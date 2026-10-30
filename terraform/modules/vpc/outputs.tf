output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
  # Consumers may pull ECR images or run internet-dependent user data immediately.
  depends_on = [aws_route_table_association.public]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "private_route_table_id" {
  description = "Private route table ID (for NAT EC2 route)"
  value       = aws_route_table.private.id
}
