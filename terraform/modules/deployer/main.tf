# =============================================================================
# EC2 (deployer + NAT)
# - デプロイ用 EC2 + App Runner の外部 API アクセス用 NAT を兼務
# - source_dest_check = false, ip_forward=1, iptables MASQUERADE
# =============================================================================

# --- AMI (Amazon Linux 2023 最新) ---
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# --- Security Group ---
resource "aws_security_group" "deployer" {
  name_prefix = "${var.name_prefix}-deployer-"
  vpc_id      = var.vpc_id
  description = "Deployer/NAT EC2 security group"

  # NAT: VPC Connector SG からの全トラフィック許可
  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [var.allowed_security_group_id]
    description     = "NAT traffic from App Runner VPC Connector"
  }

  # SSH (only when key_name is set AND allowed CIDRs are specified)
  dynamic "ingress" {
    for_each = var.key_name != "" && length(var.ssh_allowed_cidrs) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_allowed_cidrs
      description = "SSH from allowed CIDRs"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }

  tags = {
    Name = "${var.name_prefix}-deployer"
  }
}

# --- IAM Role (SSM Session Manager) ---
resource "aws_iam_role" "deployer" {
  name = "${var.name_prefix}-deployer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.name_prefix}-deployer" }
}

resource "aws_iam_role_policy_attachment" "deployer_ssm" {
  role       = aws_iam_role.deployer.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "deployer" {
  name = "${var.name_prefix}-deployer"
  role = aws_iam_role.deployer.name

  tags = { Name = "${var.name_prefix}-deployer" }
}

# --- EC2 Instance (deployer + NAT) ---
resource "aws_instance" "deployer" {
  ami                         = data.aws_ssm_parameter.al2023.value
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  vpc_security_group_ids      = [aws_security_group.deployer.id]
  source_dest_check           = false # NAT に必須
  associate_public_ip_address = true
  key_name                    = var.key_name != "" ? var.key_name : null
  iam_instance_profile        = aws_iam_instance_profile.deployer.name

  user_data = <<-EOF
    #!/bin/bash
    # Enable IP forwarding
    echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.d/99-nat.conf
    sysctl -p /etc/sysctl.d/99-nat.conf

    # iptables MASQUERADE (SNAT)
    yum install -y iptables-services
    iptables -t nat -A POSTROUTING -o ens5 -j MASQUERADE
    iptables -A FORWARD -i ens5 -o ens5 -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -i ens5 -o ens5 -j ACCEPT
    service iptables save
    systemctl enable iptables
  EOF

  tags = {
    Name = "${var.name_prefix}-deployer"
  }
}

# --- Private Route Table: default route → EC2 NAT ---
resource "aws_route" "nat" {
  route_table_id         = var.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.deployer.primary_network_interface_id
}
