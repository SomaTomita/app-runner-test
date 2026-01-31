variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB and ECS tasks"
  type        = list(string)
}

variable "backend_image_uri" {
  description = "Full ECR image URI with tag"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "Task CPU units"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Task memory (MiB)"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired task count"
  type        = number
  default     = 1
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

# Environment variables for the container
variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "clerk_secret_key" {
  description = "Clerk secret key"
  type        = string
  sensitive   = true
}

variable "s3_images_bucket" {
  description = "S3 images bucket name"
  type        = string
}

variable "s3_images_bucket_arn" {
  description = "S3 images bucket ARN"
  type        = string
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = string
}
