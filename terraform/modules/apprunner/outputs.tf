output "service_url" {
  description = "App Runner service URL"
  value       = aws_apprunner_service.backend.service_url
}

output "service_arn" {
  description = "App Runner service ARN"
  value       = aws_apprunner_service.backend.arn
}

output "vpc_connector_security_group_id" {
  description = "VPC Connector security group ID"
  value       = aws_security_group.vpc_connector.id
}

output "service_name" {
  description = "App Runner service name"
  value       = aws_apprunner_service.backend.service_name
}

output "service_id" {
  description = "App Runner service ID used by CloudWatch metric dimensions"
  value       = split("/", aws_apprunner_service.backend.arn)[2]
}
