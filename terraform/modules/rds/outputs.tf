output "endpoint" {
  description = "RDS endpoint (host only)"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}
