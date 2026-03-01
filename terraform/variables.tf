# ========== Core ==========

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "deploy-comparison"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

# ========== Deploy Mode ==========

variable "deploy_mode" {
  description = "Deployment mode: 'ecs' (ALB+Fargate), 'apprunner' (App Runner+NAT GW), 'apprunner_deployer' (App Runner+EC2 NAT+S3 deploy)"
  type        = string
  default     = "ecs"

  validation {
    condition     = contains(["ecs", "apprunner", "apprunner_deployer"], var.deploy_mode)
    error_message = "deploy_mode must be 'ecs', 'apprunner', or 'apprunner_deployer'."
  }
}

# ========== Secrets ==========

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key for backend auth"
  type        = string
  sensitive   = true
}

# ========== RDS ==========

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "appuser"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "apprunner_db"
}

# ========== ECS ==========

variable "ecs_cpu" {
  description = "ECS task CPU units"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "ECS task memory (MiB)"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "ECS service desired task count"
  type        = number
  default     = 1
}

# ========== App Runner ==========

variable "apprunner_cpu" {
  description = "App Runner CPU (256|512|1024|2048|4096)"
  type        = string
  default     = "1024"
}

variable "apprunner_memory" {
  description = "App Runner memory (512|1024|2048|3072|4096|...)"
  type        = string
  default     = "2048"
}

variable "apprunner_max_concurrency" {
  description = "App Runner max concurrent requests per instance"
  type        = number
  default     = 100
}

variable "apprunner_max_size" {
  description = "App Runner max instance count"
  type        = number
  default     = 5
}

variable "apprunner_min_size" {
  description = "App Runner min instance count"
  type        = number
  default     = 1
}

# ========== Deployer EC2 ==========

variable "deployer_instance_type" {
  description = "EC2 instance type for deployer/NAT"
  type        = string
  default     = "t3.nano"
}

variable "deployer_key_name" {
  description = "SSH key pair name for deployer EC2 (optional)"
  type        = string
  default     = ""
}

variable "deployer_ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH into deployer EC2 (empty = SSH disabled)"
  type        = list(string)
  default     = []
}

variable "deployer_git_repo_url" {
  description = "Git repository URL for frontend build (apprunner_deployer mode)"
  type        = string
  default     = ""
}

variable "deployer_git_branch" {
  description = "Git branch to build frontend from (apprunner_deployer mode)"
  type        = string
  default     = "main"
}

variable "deployer_frontend_env_vars" {
  description = "Additional environment variables for frontend build (e.g., VITE_CLERK_PUBLISHABLE_KEY)"
  type        = map(string)
  default     = {}
}

# ========== Monitoring ==========

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications (empty = no notification)"
  type        = string
  default     = ""
}

# ========== Container ==========

variable "backend_image_tag" {
  description = "Docker image tag for backend (e.g., git SHA)"
  type        = string
  default     = "latest"
}
