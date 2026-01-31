variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "backend_url" {
  description = "Backend URL (ALB DNS or App Runner URL) for API proxy origin"
  type        = string
}
