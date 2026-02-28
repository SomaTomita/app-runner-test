output "backend_url" {
  description = "Backend URL (ALB DNS for ECS, service URL for App Runner)"
  value       = local.backend_url
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.s3_cdn.cloudfront_domain_name
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint (host)"
  value       = module.rds.endpoint
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend"
  value       = module.s3_cdn.bucket_name
}

output "s3_images_bucket" {
  description = "S3 bucket name for images"
  value       = module.s3_images.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = module.s3_cdn.distribution_id
}

output "deployer_public_ip" {
  description = "Deployer/NAT EC2 public IP"
  value       = var.deploy_mode == "apprunner" ? module.deployer[0].public_ip : null
}

output "deployer_instance_id" {
  description = "Deployer/NAT EC2 instance ID (for SSM Session Manager)"
  value       = var.deploy_mode == "apprunner" ? module.deployer[0].instance_id : null
}
