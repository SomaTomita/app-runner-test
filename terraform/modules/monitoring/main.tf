# ECS log group is created at root level (to avoid circular dependency with ECS module).
# App Runner automatically creates its own log groups.

# ===== RDS Alarms (common) =====

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.name_prefix}-rds-cpu-high"
  alarm_description   = "RDS CPU utilization > 80%"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = { Name = "${var.name_prefix}-rds-cpu-high" }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  alarm_name          = "${var.name_prefix}-rds-connections-high"
  alarm_description   = "RDS database connections > 50 (db.t3.micro max ~80)"
  namespace           = "AWS/RDS"
  metric_name         = "DatabaseConnections"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 50
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = { Name = "${var.name_prefix}-rds-connections-high" }
}

# ===== ECS Alarms (ECS mode only) =====

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  count               = var.deploy_mode == "ecs" ? 1 : 0
  alarm_name          = "${var.name_prefix}-ecs-cpu-high"
  alarm_description   = "ECS CPU utilization > 80%"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = { Name = "${var.name_prefix}-ecs-cpu-high" }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  count               = var.deploy_mode == "ecs" ? 1 : 0
  alarm_name          = "${var.name_prefix}-ecs-memory-high"
  alarm_description   = "ECS memory utilization > 80%"
  namespace           = "AWS/ECS"
  metric_name         = "MemoryUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = { Name = "${var.name_prefix}-ecs-memory-high" }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count               = var.deploy_mode == "ecs" ? 1 : 0
  alarm_name          = "${var.name_prefix}-alb-5xx-high"
  alarm_description   = "ALB 5xx errors > 10 in 5 minutes"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  tags = { Name = "${var.name_prefix}-alb-5xx-high" }
}

# ===== App Runner Alarms (App Runner mode only) =====

resource "aws_cloudwatch_metric_alarm" "apprunner_5xx" {
  count               = contains(["apprunner", "apprunner_deployer"], var.deploy_mode) ? 1 : 0
  alarm_name          = "${var.name_prefix}-apprunner-5xx-high"
  alarm_description   = "App Runner 5xx errors > 10 in 5 minutes"
  namespace           = "AWS/AppRunner"
  metric_name         = "5xxStatusResponses"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = local.alarm_actions
  ok_actions    = local.alarm_actions

  dimensions = {
    ServiceName = var.apprunner_service_name
    ServiceID   = var.apprunner_service_id
  }

  tags = { Name = "${var.name_prefix}-apprunner-5xx-high" }
}

# ===== CloudWatch Dashboard =====

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = var.deploy_mode == "ecs" ? jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "ECS CPU / Memory Utilization"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name],
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "ALB 5xx / 4xx Errors"
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.alb_arn_suffix],
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "RDS CPU / Connections"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_identifier],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_identifier],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
        }
      },
    ]
    }) : jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "App Runner Requests / Latency"
          metrics = [
            ["AWS/AppRunner", "2xxStatusResponses", "ServiceName", var.apprunner_service_name, "ServiceID", var.apprunner_service_id],
            ["AWS/AppRunner", "5xxStatusResponses", "ServiceName", var.apprunner_service_name, "ServiceID", var.apprunner_service_id],
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "App Runner Active Instances"
          metrics = [
            ["AWS/AppRunner", "ActiveInstances", "ServiceName", var.apprunner_service_name, "ServiceID", var.apprunner_service_id],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title = "RDS CPU / Connections"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_identifier],
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_identifier],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
        }
      },
    ]
  })
}
