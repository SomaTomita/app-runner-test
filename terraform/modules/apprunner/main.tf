# ===== IAM: Access Role (ECR pull) =====

resource "aws_iam_role" "apprunner_access" {
  name = "${var.name_prefix}-apprunner-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "build.apprunner.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.name_prefix}-apprunner-access" }
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr" {
  role       = aws_iam_role.apprunner_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# ===== IAM: Instance Role (S3 access) =====

resource "aws_iam_role" "apprunner_instance" {
  name = "${var.name_prefix}-apprunner-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "tasks.apprunner.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.name_prefix}-apprunner-instance" }
}

resource "aws_iam_role_policy" "apprunner_s3" {
  name = "${var.name_prefix}-apprunner-s3"
  role = aws_iam_role.apprunner_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket",
      ]
      Resource = [
        var.s3_images_bucket_arn,
        "${var.s3_images_bucket_arn}/*",
      ]
    }]
  })
}

# ===== Security Group: VPC Connector =====

resource "aws_security_group" "vpc_connector" {
  name_prefix = "${var.name_prefix}-apprunner-vpc-"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound (RDS, S3 Gateway Endpoint, NAT Gateway)"
  }

  tags = { Name = "${var.name_prefix}-apprunner-vpc-connector" }

  lifecycle {
    create_before_destroy = true
  }
}

# ===== VPC Connector =====

resource "aws_apprunner_vpc_connector" "main" {
  vpc_connector_name = "${var.name_prefix}-vpc-connector"
  subnets            = var.private_subnet_ids
  security_groups    = [aws_security_group.vpc_connector.id]

  tags = { Name = "${var.name_prefix}-vpc-connector" }
}

# ===== Auto Scaling =====

resource "aws_apprunner_auto_scaling_configuration_version" "main" {
  auto_scaling_configuration_name = "${var.name_prefix}-scaling"
  max_concurrency                 = var.max_concurrency
  max_size                        = var.max_size
  min_size                        = var.min_size

  tags = { Name = "${var.name_prefix}-scaling" }
}

# ===== App Runner Service =====

resource "aws_apprunner_service" "backend" {
  service_name = "${var.name_prefix}-backend"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access.arn
    }

    image_repository {
      image_identifier      = "${var.ecr_repository_url}:${var.backend_image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = tostring(var.container_port)

        # Learning setup: values are visible to principals that can inspect the service.
        # Use SSM Parameter Store or Secrets Manager references for production.
        runtime_environment_variables = {
          DATABASE_URL          = var.database_url
          CLERK_SECRET_KEY      = var.clerk_secret_key
          CLERK_PUBLISHABLE_KEY = var.clerk_publishable_key
          ALLOWED_USER_IDS      = var.allowed_user_ids
          PORT                  = tostring(var.container_port)
          STORAGE_TYPE          = "s3"
          S3_IMAGES_BUCKET      = var.s3_images_bucket
          AWS_REGION            = var.aws_region
          CORS_ORIGINS          = var.cors_origins
          NODE_ENV              = "production"
        }
      }
    }

    auto_deployments_enabled = false
  }

  instance_configuration {
    cpu               = var.cpu
    memory            = var.memory
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.main.arn
    }
  }

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.main.arn

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = { Name = "${var.name_prefix}-backend" }
}
