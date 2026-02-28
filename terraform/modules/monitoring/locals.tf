locals {
  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
}
