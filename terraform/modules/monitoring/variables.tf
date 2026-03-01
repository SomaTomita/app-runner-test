variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "deploy_mode" {
  description = "Deployment mode: 'ecs', 'apprunner', or 'apprunner_deployer'"
  type        = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch dashboard metrics"
  type        = string
}

# ===== RDS =====

variable "rds_instance_identifier" {
  description = "RDS instance identifier for CloudWatch alarms"
  type        = string
}

# ===== ECS (only used when deploy_mode == 'ecs') =====

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
  default     = ""
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics"
  type        = string
  default     = ""
}

variable "target_group_arn_suffix" {
  description = "Target group ARN suffix for CloudWatch metrics"
  type        = string
  default     = ""
}

# ===== App Runner (only used when deploy_mode == 'apprunner') =====

variable "apprunner_service_name" {
  description = "App Runner service name"
  type        = string
  default     = ""
}

# ===== Notification =====

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications (empty = no notification)"
  type        = string
  default     = ""
}
