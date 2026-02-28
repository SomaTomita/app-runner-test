# ===== Environment =====
environment = "staging"

# ===== Deploy Mode =====
deploy_mode = "apprunner"

# ===== RDS =====
rds_instance_class        = "db.t3.small"
rds_multi_az              = false
rds_skip_final_snapshot   = false
rds_deletion_protection   = false
rds_max_allocated_storage = 50

# ===== ECS =====
ecs_cpu           = 512
ecs_memory        = 1024
ecs_desired_count = 1

# ===== App Runner =====
apprunner_cpu             = "1024"
apprunner_memory          = "2048"
apprunner_max_concurrency = 100
apprunner_max_size        = 5
apprunner_min_size        = 1
