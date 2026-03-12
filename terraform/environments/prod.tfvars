# ===== Environment =====
environment = "prod"

# ===== Deploy Mode =====
deploy_mode = "apprunner"

# ===== RDS =====
rds_instance_class        = "db.t3.medium"
rds_multi_az              = true
rds_skip_final_snapshot   = false
rds_deletion_protection   = true
rds_max_allocated_storage = 100

# ===== ECS =====
ecs_cpu           = 1024
ecs_memory        = 2048
ecs_desired_count = 2

# ===== App Runner =====
apprunner_cpu             = "1024"
apprunner_memory          = "2048"
apprunner_max_concurrency = 100
apprunner_max_size        = 10
apprunner_min_size        = 2

# ===== Container =====
backend_image_tag = "latest"
