# ===== Environment =====
environment = "dev"

# ===== Deploy Mode =====
deploy_mode = "apprunner"

# ===== RDS =====
rds_instance_class        = "db.t3.micro"
rds_multi_az              = false
rds_skip_final_snapshot   = true
rds_deletion_protection   = false
rds_max_allocated_storage = 0

# ===== ECS =====
ecs_cpu           = 256
ecs_memory        = 512
ecs_desired_count = 1

# ===== App Runner =====
apprunner_cpu             = "1024"
apprunner_memory          = "2048"
apprunner_max_concurrency = 100
apprunner_max_size        = 3
apprunner_min_size        = 1

# ===== Container =====
backend_image_tag = "latest"
