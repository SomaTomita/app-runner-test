# Mock providers keep these plans entirely local: no AWS credentials or resources.
mock_provider "aws" {
  mock_resource "aws_apprunner_service" {
    defaults = {
      arn         = "arn:aws:apprunner:ap-northeast-1:123456789012:service/learning-backend/test-service-id"
      service_url = "learning.example.awsapprunner.com"
    }
  }
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }
}

mock_provider "random" {}

variables {
  backend_image_tag     = "local-test"
  db_password           = "dummy-password-for-local-mock-only"
  clerk_secret_key      = "dummy-clerk-server-config"
  clerk_publishable_key = "dummy-clerk-public-config"
  allowed_user_ids      = "user_test"
}

run "ecs_mode" {
  command = plan
  variables {
    deploy_mode = "ecs"
  }
  assert {
    condition     = length(module.ecs) == 1 && length(module.apprunner) == 0 && length(module.deployer_ec2) == 0
    error_message = "ECS mode must create only the ECS compute module."
  }
}

run "apprunner_mode" {
  command = plan
  variables {
    deploy_mode = "apprunner"
  }
  assert {
    condition     = length(module.ecs) == 0 && length(module.apprunner) == 1 && length(module.deployer_ec2) == 0
    error_message = "Managed NAT mode must not create a deployer EC2 module."
  }
}

run "apprunner_deployer_mode" {
  command = plan
  variables {
    deploy_mode           = "apprunner_deployer"
    deployer_git_repo_url = "https://github.com/example/learning-app.git"
  }
  assert {
    condition     = length(module.ecs) == 0 && length(module.apprunner) == 1 && length(module.deployer_ec2) == 1
    error_message = "EC2 NAT mode must create App Runner and the deployer module."
  }
}
