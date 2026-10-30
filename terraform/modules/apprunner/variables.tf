variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "backend_image_tag" {
  description = "Docker image tag"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "App Runner CPU"
  type        = string
  default     = "1024"
}

variable "memory" {
  description = "App Runner memory"
  type        = string
  default     = "2048"
}

variable "max_concurrency" {
  description = "Max concurrent requests per instance"
  type        = number
  default     = 100
}

variable "max_size" {
  description = "Max instance count"
  type        = number
  default     = 5
}

variable "min_size" {
  description = "Min instance count"
  type        = number
  default     = 1
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for VPC Connector"
  type        = list(string)
}

# Environment variables
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

variable "clerk_publishable_key" {
  description = "Clerk publishable key"
  type        = string
}

variable "allowed_user_ids" {
  description = "Comma-separated allowed Clerk user IDs"
  type        = string
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
