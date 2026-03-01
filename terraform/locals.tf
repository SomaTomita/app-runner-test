locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  is_apprunner = contains(["apprunner", "apprunner_deployer"], var.deploy_mode)

  # Backend URL based on deploy mode (both apprunner modes use App Runner URL)
  backend_url = var.deploy_mode == "ecs" ? (
    "http://${try(module.ecs[0].alb_dns_name, "")}"
  ) : (
    "https://${try(module.apprunner[0].service_url, "")}"
  )

  # CloudFront domain for CORS
  cloudfront_domain = "https://${module.s3_cdn.cloudfront_domain_name}"

  # DATABASE_URL construction
  database_url = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}/${var.db_name}?connection_limit=5"

  # ECR image URI
  backend_image_uri = "${module.ecr.repository_url}:${var.backend_image_tag}"
}
