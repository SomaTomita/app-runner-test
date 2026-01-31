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
  default     = "t3.nano"
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
