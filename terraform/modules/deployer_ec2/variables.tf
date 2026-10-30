variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet ID for the deployer EC2"
  type        = string
}

variable "private_route_table_id" {
  description = "Private route table ID (to add NAT route)"
  type        = string
}

variable "allowed_security_group_id" {
  description = "VPC Connector SG (allow NAT traffic from App Runner)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for deployer/NAT"
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "SSH key pair name (optional)"
  type        = string
  default     = ""
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH into the deployer (empty = SSH disabled)"
  type        = list(string)
  default     = []
}

# ========== Frontend Build & Deploy ==========

variable "enable_frontend_deploy" {
  description = "Enable frontend build and S3 deploy from this EC2"
  type        = bool
  default     = false
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend deployment"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  type        = string
  default     = ""
}

variable "git_repo_url" {
  description = "Git repository URL to clone for frontend build"
  type        = string
  default     = ""

  validation {
    condition     = var.git_repo_url == "" || can(regex("^https?://[a-zA-Z0-9._/-]+$", var.git_repo_url))
    error_message = "git_repo_url must be a valid HTTP(S) URL without shell metacharacters."
  }
}

variable "git_branch" {
  description = "Git branch to checkout"
  type        = string
  default     = "main"

  validation {
    condition     = can(regex("^[a-zA-Z0-9._/-]+$", var.git_branch))
    error_message = "git_branch must contain only alphanumeric characters, dots, slashes, hyphens, and underscores."
  }
}

variable "frontend_env_vars" {
  description = "Environment variables for frontend build (written to .env)"
  type        = map(string)
  default     = {}
}
