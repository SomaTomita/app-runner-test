output "instance_id" {
  description = "Deployer EC2 instance ID"
  value       = aws_instance.deployer.id
}

output "public_ip" {
  description = "Deployer EC2 public IP"
  value       = aws_instance.deployer.public_ip
}

output "security_group_id" {
  description = "Deployer EC2 security group ID"
  value       = aws_security_group.deployer.id
}

output "iam_role_arn" {
  description = "Deployer EC2 IAM role ARN"
  value       = aws_iam_role.deployer.arn
}
