# ===== VPC =====

module "vpc" {
  source             = "./modules/vpc"
  name_prefix        = local.name_prefix
  aws_region         = var.aws_region
  create_nat_gateway = var.deploy_mode == "apprunner" # apprunner: マネージド NAT GW, apprunner_deployer: EC2 NAT
}

# ===== ECR =====

module "ecr" {
  source      = "./modules/ecr"
  name_prefix = local.name_prefix
}

# ===== S3 (Images) =====

module "s3_images" {
  source      = "./modules/s3_images"
  name_prefix = local.name_prefix
}

# ===== ECS Log Group =====
# Created at root level to avoid circular dependency:
# monitoring needs ECS outputs (cluster_name etc.) for alarms,
# but ECS needs the log group name from monitoring.

resource "aws_cloudwatch_log_group" "ecs_backend" {
  count             = var.deploy_mode == "ecs" ? 1 : 0
  name              = "/ecs/${local.name_prefix}/backend"
  retention_in_days = 30

  tags = { Name = "${local.name_prefix}-ecs-logs" }
}

# ===== RDS =====

module "rds" {
  source             = "./modules/rds"
  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
  instance_class        = var.rds_instance_class
  multi_az              = var.rds_multi_az
  skip_final_snapshot   = var.rds_skip_final_snapshot
  deletion_protection   = var.rds_deletion_protection
  max_allocated_storage = var.rds_max_allocated_storage
  allowed_security_group_ids = compact([
    var.deploy_mode == "ecs" ? module.ecs[0].task_security_group_id : "",
    local.is_apprunner ? module.apprunner[0].vpc_connector_security_group_id : "",
  ])
}

# ===== ECS (ALB + Fargate) =====

module "ecs" {
  count  = var.deploy_mode == "ecs" ? 1 : 0
  source = "./modules/ecs"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  backend_image_uri  = local.backend_image_uri
  cpu                = var.ecs_cpu
  memory             = var.ecs_memory
  desired_count      = var.ecs_desired_count
  log_group_name     = aws_cloudwatch_log_group.ecs_backend[0].name
  aws_region         = var.aws_region
  database_url       = local.database_url
  clerk_secret_key   = var.clerk_secret_key
  s3_images_bucket     = module.s3_images.bucket_name
  s3_images_bucket_arn = module.s3_images.bucket_arn
  cors_origins       = var.cors_origins
}

# ===== App Runner =====

module "apprunner" {
  count  = local.is_apprunner ? 1 : 0
  source = "./modules/apprunner"

  name_prefix        = local.name_prefix
  ecr_repository_url = module.ecr.repository_url
  backend_image_tag  = var.backend_image_tag
  cpu                = var.apprunner_cpu
  memory             = var.apprunner_memory
  max_concurrency    = var.apprunner_max_concurrency
  max_size           = var.apprunner_max_size
  min_size           = var.apprunner_min_size
  aws_region         = var.aws_region
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  database_url       = local.database_url
  clerk_secret_key   = var.clerk_secret_key
  s3_images_bucket     = module.s3_images.bucket_name
  s3_images_bucket_arn = module.s3_images.bucket_arn
  cors_origins       = var.cors_origins
}

# ===== Deployer EC2 (NAT + frontend deploy) =====

module "deployer_ec2" {
  count  = var.deploy_mode == "apprunner_deployer" ? 1 : 0
  source = "./modules/deployer_ec2"

  name_prefix               = local.name_prefix
  vpc_id                    = module.vpc.vpc_id
  public_subnet_id          = module.vpc.public_subnet_ids[0]
  private_route_table_id    = module.vpc.private_route_table_id
  allowed_security_group_id = module.apprunner[0].vpc_connector_security_group_id
  instance_type             = var.deployer_instance_type
  key_name                  = var.deployer_key_name
  ssh_allowed_cidrs         = var.deployer_ssh_allowed_cidrs

  # Frontend build & deploy
  enable_frontend_deploy     = true
  frontend_bucket_name       = module.s3_cdn.bucket_name
  cloudfront_distribution_id = module.s3_cdn.distribution_id
  git_repo_url               = var.deployer_git_repo_url
  git_branch                 = var.deployer_git_branch
  frontend_env_vars          = merge({ VITE_API_URL = "" }, var.deployer_frontend_env_vars)
}

# ===== Monitoring (Alarms + Dashboard) =====

module "monitoring" {
  source      = "./modules/monitoring"
  name_prefix = local.name_prefix
  deploy_mode = var.deploy_mode
  aws_region  = var.aws_region

  sns_topic_arn           = var.alarm_sns_topic_arn
  rds_instance_identifier = module.rds.identifier
  ecs_cluster_name        = var.deploy_mode == "ecs" ? module.ecs[0].cluster_name : ""
  ecs_service_name        = var.deploy_mode == "ecs" ? module.ecs[0].service_name : ""
  alb_arn_suffix          = var.deploy_mode == "ecs" ? module.ecs[0].alb_arn_suffix : ""
  target_group_arn_suffix = var.deploy_mode == "ecs" ? module.ecs[0].target_group_arn_suffix : ""
  apprunner_service_name  = local.is_apprunner ? module.apprunner[0].service_name : ""
}

# ===== S3 + CloudFront (Frontend CDN) =====

module "s3_cdn" {
  source      = "./modules/s3_cdn"
  name_prefix = local.name_prefix
  backend_url = local.backend_url
}
