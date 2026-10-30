# =============================================================================
# EC2 (deployer + NAT)
# - Combines frontend deployment with NAT for App Runner external API access.
# - source_dest_check = false, ip_forward=1, iptables MASQUERADE
# =============================================================================

# --- AWS Account ID (for IAM resource scoping) ---
data "aws_caller_identity" "current" {}

# --- AMI (latest Amazon Linux 2023) ---
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# --- Security Group ---
resource "aws_security_group" "deployer" {
  name_prefix = "${var.name_prefix}-deployer-"
  vpc_id      = var.vpc_id
  description = "Deployer/NAT EC2 security group"

  # NAT: allow traffic from the VPC Connector security group.
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

# --- IAM Policy: S3 + CloudFront (frontend deploy) ---
resource "aws_iam_role_policy" "deployer_frontend" {
  count = var.enable_frontend_deploy ? 1 : 0
  name  = "${var.name_prefix}-deployer-frontend"
  role  = aws_iam_role.deployer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObject",
        ]
        Resource = [
          "arn:aws:s3:::${var.frontend_bucket_name}",
          "arn:aws:s3:::${var.frontend_bucket_name}/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${var.cloudfront_distribution_id}"
      },
    ]
  })
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
  source_dest_check           = false # Required for NAT.
  associate_public_ip_address = true
  key_name                    = var.key_name != "" ? var.key_name : null
  iam_instance_profile        = aws_iam_instance_profile.deployer.name
  user_data_replace_on_change = true

  metadata_options {
    http_tokens = "required"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # ===== NAT Setup =====
    echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.d/99-nat.conf
    sysctl -p /etc/sysctl.d/99-nat.conf

    yum install -y iptables-services
    PRIMARY_IF=$(ip route show default | awk '/default/ {print $5}')
    iptables -t nat -A POSTROUTING -o "$PRIMARY_IF" -j MASQUERADE
    iptables -A FORWARD -i "$PRIMARY_IF" -o "$PRIMARY_IF" -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -i "$PRIMARY_IF" -o "$PRIMARY_IF" -j ACCEPT
    service iptables save
    systemctl enable iptables

    %{if var.enable_frontend_deploy}
    # ===== Frontend Build & Deploy =====
    dnf install -y git
    curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
    dnf install -y nodejs

    cd /tmp
    git clone --branch "${var.git_branch}" --depth 1 "${var.git_repo_url}" app
    cd app/frontend

    # Write env vars for Vite
    %{for key, value in var.frontend_env_vars~}
    printf '%s\n' ${jsonencode(base64encode("${key}=${value}"))} | base64 --decode >> .env
    printf '\n' >> .env
    %{endfor~}
    chmod 600 .env

    npm ci
    npm run build

    aws s3 sync dist/ s3://${var.frontend_bucket_name}/ --delete
    aws cloudfront create-invalidation \
      --distribution-id ${var.cloudfront_distribution_id} \
      --paths "/*"

    # Save deploy script for re-runs via SSM
    cat > /opt/deploy-frontend.sh << 'DEPLOY'
    #!/bin/bash
    set -euo pipefail
    cd /tmp/app && git pull
    cd frontend && npm ci && npm run build
    aws s3 sync dist/ s3://${var.frontend_bucket_name}/ --delete
    aws cloudfront create-invalidation --distribution-id ${var.cloudfront_distribution_id} --paths "/*"
    DEPLOY
    chmod +x /opt/deploy-frontend.sh

    echo "Frontend deploy completed at $(date)" >> /var/log/frontend-deploy.log
    %{endif}
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
