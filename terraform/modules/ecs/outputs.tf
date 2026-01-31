output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "task_security_group_id" {
  description = "ECS task security group ID"
  value       = aws_security_group.ecs_task.id
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix (for CloudWatch metrics)"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn_suffix" {
  description = "Target group ARN suffix (for CloudWatch metrics)"
  value       = aws_lb_target_group.backend.arn_suffix
}
