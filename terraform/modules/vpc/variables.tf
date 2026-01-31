variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "create_nat_gateway" {
  description = "Whether to create a NAT Gateway (required for App Runner mode)"
  type        = bool
  default     = false
}
