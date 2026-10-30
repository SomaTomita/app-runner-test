# Terraform infrastructure

This directory contains infrastructure code for a learning project originally created while exploring deployment options for potential workplace use. It supports three configurations through `deploy_mode`.

## Directory structure

```text
terraform/
├── bootstrap/        # S3 and DynamoDB for remote state
├── environments/     # Development, staging, and production presets
├── modules/          # Resource modules
├── main.tf           # Root module wiring
├── variables.tf      # Inputs
├── outputs.tf        # Resource identifiers and URLs
├── locals.tf         # Computed values
└── backend.tf        # Active S3 remote state configuration
```

## Validation without creating resources

Prerequisites: Terraform 1.5 or later. The installed provider binaries must support your Terraform version and operating system.

```bash
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend=false
terraform -chdir=terraform validate
# Requires Terraform 1.7+; all providers are mocked.
terraform -chdir=terraform test
```

These checks do not create infrastructure or require an AWS account. They validate configuration structure, not deployment behavior. CI uses this path and contains no AWS deployment jobs.

## Deployment modes

| `deploy_mode`        | Configuration                                  | Outbound internet access |
| -------------------- | ---------------------------------------------- | ------------------------ |
| `ecs`                | ALB + ECS Fargate                              | Public IPs on tasks      |
| `apprunner`          | App Runner + VPC Connector                     | Managed NAT Gateway      |
| `apprunner_deployer` | App Runner + VPC Connector + frontend deployer | EC2 NAT instance         |

RDS traffic travels directly through the VPC. NAT is for outbound internet access, such as requests to Clerk. The S3 Gateway Endpoint handles VPC access to S3.

Changing modes can replace or destroy compute resources. This configuration is intended for a disposable learning environment.

## Optional first-time AWS setup

The following operations create billable AWS resources. Run them only when you intend to deploy, with an AWS identity authorized for the required services.

The root backend is already enabled in `backend.tf`. Before root initialization, create its S3 bucket and DynamoDB lock table using `bootstrap/`, or configure an existing backend. S3 bucket names are globally unique, so adjust `project_name` and the root backend bucket name together if necessary.

```bash
cd terraform/bootstrap
terraform init
terraform plan
# Review the plan before choosing to apply it.
terraform apply
```

Then initialize the root module:

```bash
cd ..
terraform init
# If migrating existing local state, use terraform init -migrate-state instead.
```

All environment presets use the same configured backend key unless you select a different key or workspace. Use separate state per environment; changing `environment` alone does not isolate state.

## Required inputs

| Input                   | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `backend_image_tag`     | Tag of an image already pushed to the project ECR repository |
| `db_password`           | RDS password; sensitive                                      |
| `clerk_secret_key`      | Clerk server key; sensitive                                  |
| `clerk_publishable_key` | Clerk application publishable key for the backend            |
| `allowed_user_ids`      | Comma-separated Clerk user IDs allowed to access the API     |

Provide secrets through a secure shell or CI environment, such as `TF_VAR_db_password` and `TF_VAR_clerk_secret_key`. Do not commit populated secret files. Terraform state contains sensitive values even when inputs use `sensitive = true`.

Set `cors_origins` to the actual browser origins if calling the backend across origins. A comma-separated list of explicit HTTPS origins is appropriate for a deployed frontend. The default CloudFront setup proxies `/api/*` from the same origin.

For `apprunner_deployer`, also set `deployer_git_repo_url` to an accessible repository and include `VITE_CLERK_PUBLISHABLE_KEY` in `deployer_frontend_env_vars`. Only public browser configuration belongs in this map. The EC2 build has no private Git authentication configured.

## Plan and deployment

Once the backend and required inputs are configured:

```bash
cd terraform
terraform plan -var-file=environments/dev.tfvars
# Applying the reviewed plan creates or changes AWS resources.
terraform apply -var-file=environments/dev.tfvars
```

The first deployment needs an ECR repository and an uploaded image before ECS or App Runner can start. Provision ECR in a separate bootstrap step if needed. The backend image does not run database migrations automatically; run `prisma migrate deploy` separately from an environment that can reach RDS and trust its CA certificates.

The PostgreSQL URL uses verified TLS. The backend Docker image installs the public RDS CA bundle. Other migration clients need an equivalent trust configuration.

## Modules

| Module         | Resources                                                                            |
| -------------- | ------------------------------------------------------------------------------------ |
| `vpc`          | VPC, public/private subnets, internet gateway, S3 endpoint, optional NAT Gateway     |
| `ecr`          | Image repository, scanning, and lifecycle policy                                     |
| `rds`          | Private PostgreSQL instance, subnet group, security group, final snapshot identifier |
| `ecs`          | HTTP ALB, Fargate service, task roles, and security groups                           |
| `apprunner`    | App Runner service, scaling configuration, VPC Connector, and IAM roles              |
| `deployer_ec2` | EC2 NAT instance, SSM access, and optional frontend build/deployment                 |
| `s3_cdn`       | Frontend S3 bucket, CloudFront distribution, API proxy, and OAC                      |
| `s3_images`    | Private S3 image bucket                                                              |
| `monitoring`   | CloudWatch alarms and dashboard                                                      |

Each module directory contains its own README. See the source variables for complete inputs and defaults.

## Outputs and maintenance

Run these commands from `terraform/` after an intentional deployment:

```bash
terraform output
terraform output -raw ecr_repository_url
terraform output -raw cloudfront_domain

# Available only in apprunner_deployer mode.
aws ssm start-session --target "$(terraform output -raw deployer_instance_id)"

# Upload sample images from the repository root.
../backend/scripts/upload-images.sh "$(terraform output -raw s3_images_bucket)"
```

`terraform destroy` deletes infrastructure, including RDS where deletion protection permits it. Review `rds_deletion_protection` and `rds_skip_final_snapshot` first. A final snapshot identifier is supplied when final snapshots are enabled. Keep remote state private and backed up.

ECR tags are currently mutable. Use unique commit SHA tags to reduce accidental replacement. The EC2 NAT mode uses one instance in one availability zone and has no failover. The ECS learning configuration exposes HTTP port 80 on its ALB; add HTTPS and appropriate origin restrictions before using real data.
