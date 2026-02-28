output "bucket_name" {
  description = "S3 images bucket name"
  value       = aws_s3_bucket.images.id
}

output "bucket_arn" {
  description = "S3 images bucket ARN"
  value       = aws_s3_bucket.images.arn
}
