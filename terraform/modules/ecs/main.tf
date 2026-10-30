# ===== IAM: Task Execution Role (ECR pull + CloudWatch logs) =====

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.name_prefix}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.name_prefix}-ecs-task-execution" }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ===== IAM: Task Role (S3 access) =====

resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = { Name = "${var.name_prefix}-ecs-task" }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.name_prefix}-ecs-task-s3"
  role = aws_iam_role.ecs_task.id

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

# ===== Security Groups =====

resource "aws_security_group" "alb" {
  name_prefix = "${var.name_prefix}-alb-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-alb" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_task" {
  name_prefix = "${var.name_prefix}-ecs-task-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "From ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.name_prefix}-ecs-task" }

  lifecycle {
    create_before_destroy = true
  }
}

# ===== ALB =====

resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = { Name = "${var.name_prefix}-alb" }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.name_prefix}-backend"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = { Name = "${var.name_prefix}-backend" }
}

# Before production: configure an ACM certificate and an HTTPS listener,
# then redirect HTTP requests to HTTPS. This learning configuration uses HTTP.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ===== ECS Cluster =====

resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.name_prefix}-cluster" }
}

# ===== Task Definition =====

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.name_prefix}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "${var.name_prefix}-backend"
    image = var.backend_image_uri

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    # Learning setup: values are visible to principals that can inspect task definitions.
    # Use Secrets Manager references in the ECS secrets field for production.
    environment = [
      { name = "DATABASE_URL", value = var.database_url },
      { name = "CLERK_SECRET_KEY", value = var.clerk_secret_key },
      { name = "CLERK_PUBLISHABLE_KEY", value = var.clerk_publishable_key },
      { name = "ALLOWED_USER_IDS", value = var.allowed_user_ids },
      { name = "PORT", value = tostring(var.container_port) },
      { name = "BASE_URL", value = "http://${aws_lb.main.dns_name}" },
      { name = "STORAGE_TYPE", value = "s3" },
      { name = "S3_IMAGES_BUCKET", value = var.s3_images_bucket },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "CORS_ORIGINS", value = var.cors_origins },
      { name = "NODE_ENV", value = "production" },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "backend"
      }
    }

    stopTimeout = 10
  }])

  tags = { Name = "${var.name_prefix}-backend" }
}

# ===== ECS Service =====

resource "aws_ecs_service" "backend" {
  name            = "${var.name_prefix}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.ecs_task.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "${var.name_prefix}-backend"
    container_port   = var.container_port
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  depends_on = [aws_lb_listener.http, aws_iam_role_policy_attachment.ecs_task_execution, aws_iam_role_policy.ecs_task_s3]

  tags = { Name = "${var.name_prefix}-backend" }
}
