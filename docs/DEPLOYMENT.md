# Deployment sequence

This guide describes the steps needed for an intentional AWS deployment. The commands in the AWS sections create billable resources; CI does not execute them. Use sample data for this learning application.

## Local runtime check first

```bash
docker build --tag learning-backend:check backend
bash scripts/check-production-container.sh learning-backend:check
```

The check creates an isolated Docker network, a disposable PostgreSQL database, and the production backend container. It verifies migration of an empty database, HTTP health, real database CRUD, rejection of unauthenticated API requests, rejection of plaintext migration connections with the AWS TLS settings, and repeat startup. It uses synthetic configuration and removes its test containers/network on exit. It does not call AWS or test a real Clerk sign-in.

## Prerequisites and configuration

Use Node.js 24, Docker, Terraform 1.7 or later, AWS CLI, and a Clerk application. Select an AWS region/account where ECS or App Runner and the required instance sizes are available. Your AWS identity must have permission to create the resources and pass the configured IAM roles.

Provide these Terraform inputs through your shell's secure environment configuration:

- `TF_VAR_db_password`: RDS password.
- `TF_VAR_clerk_secret_key`: Clerk server key.
- `TF_VAR_clerk_publishable_key`: matching Clerk public key.
- `TF_VAR_allowed_user_ids`: comma-separated Clerk user IDs permitted to use the application.

Set these non-secret values from the repository root:

```bash
export TF_VAR_aws_region=ap-northeast-1
export TF_VAR_backend_image_tag="$(git rev-parse --short=12 HEAD)"
TASK_DEPLOY_MODE=apprunner
# Alternatives: ecs or apprunner_deployer.
```

Environment presets also define `deploy_mode` and `backend_image_tag`, so the commands below override them explicitly with `-var`. Use the same inputs and environment preset throughout the deployment.

For `apprunner_deployer`, set `TF_VAR_deployer_git_repo_url` to an HTTP(S) repository accessible without private Git credentials. The EC2 instance builds the frontend and inherits the Clerk public key. The default `t3.small` provides memory for the TypeScript/Vite build; smaller instances may run out of memory. Only public browser configuration belongs in `deployer_frontend_env_vars`.

## 1. Prepare remote state

Before root initialization, follow [the bootstrap guide](../terraform/README.md#optional-first-time-aws-setup). Choose a globally unique state bucket name and configure `terraform/backend.tf` to match. Keep separate state keys or workspaces for separate environments.

```bash
terraform -chdir=terraform init
```

## 2. Create ECR before creating a service

An ECS or App Runner service cannot pull an image from a repository that has not yet been populated. For the first deployment only, create the ECR module before the full infrastructure. Resource targeting is a bootstrap exception, not the routine deployment path.

```bash
terraform -chdir=terraform plan -target=module.ecr \
  -var-file=environments/dev.tfvars \
  -var="deploy_mode=$TASK_DEPLOY_MODE" \
  -var="backend_image_tag=$TF_VAR_backend_image_tag"

# Run only after reviewing the plan.
terraform -chdir=terraform apply -target=module.ecr \
  -var-file=environments/dev.tfvars \
  -var="deploy_mode=$TASK_DEPLOY_MODE" \
  -var="backend_image_tag=$TF_VAR_backend_image_tag"
```

## 3. Publish the backend image

Use Linux AMD64 for App Runner and the current ECS task definition, including when building on an Apple Silicon machine.

```bash
TASK_ECR_URL="$(terraform -chdir=terraform output -raw ecr_repository_url)"
TASK_ECR_REGISTRY="${TASK_ECR_URL%%/*}"

aws ecr get-login-password --region "$TF_VAR_aws_region" \
  | docker login --username AWS --password-stdin "$TASK_ECR_REGISTRY"

docker build --platform linux/amd64 \
  --tag "$TASK_ECR_URL:$TF_VAR_backend_image_tag" backend
docker push "$TASK_ECR_URL:$TF_VAR_backend_image_tag"
```

## 4. Create or update the full infrastructure

```bash
terraform -chdir=terraform plan \
  -var-file=environments/dev.tfvars \
  -var="deploy_mode=$TASK_DEPLOY_MODE" \
  -var="backend_image_tag=$TF_VAR_backend_image_tag"

# Run only after reviewing the plan.
terraform -chdir=terraform apply \
  -var-file=environments/dev.tfvars \
  -var="deploy_mode=$TASK_DEPLOY_MODE" \
  -var="backend_image_tag=$TF_VAR_backend_image_tag"
```

The backend applies committed Prisma migrations before starting its HTTP server. A failed migration prevents startup. The runtime image includes the migration files, CLI, and public RDS CA bundle; it does not reset or seed data. The application uses node-postgres `verify-full`; the Prisma CLI configuration translates that to `require` with `sslaccept=strict` and preserves the CA file path. Migrations use Prisma's database advisory lock. For larger workloads or long-running migrations, replace startup migration with a dedicated deployment job and an appropriate rollout strategy.

Terraform selects an available PostgreSQL version matching `rds_engine_version` in the deployment region. The default prefix is `16`; set an exact available minor version if you need a fixed version. IAM policy dependencies are explicit so services and initialization scripts do not start before their referenced policies are attached.

## 5. Publish the frontend

For `ecs` and `apprunner`, run this from the repository root. It can also be used for a manual frontend update in `apprunner_deployer` mode.

```bash
export VITE_CLERK_PUBLISHABLE_KEY="$TF_VAR_clerk_publishable_key"
export VITE_API_URL=""
(cd frontend && npm ci && npm run build)

TASK_FRONTEND_BUCKET="$(terraform -chdir=terraform output -raw s3_frontend_bucket)"
TASK_DISTRIBUTION_ID="$(terraform -chdir=terraform output -raw cloudfront_distribution_id)"
aws s3 sync frontend/dist/ "s3://$TASK_FRONTEND_BUCKET/" --delete
aws cloudfront create-invalidation --distribution-id "$TASK_DISTRIBUTION_ID" --paths '/*'
```

Use an empty API URL so browser requests go through CloudFront's `/api/*` behavior. API errors retain their HTTP status; they are not rewritten to the frontend HTML page.

## 6. Verify the deployment

```bash
TASK_FRONTEND_DOMAIN="$(terraform -chdir=terraform output -raw cloudfront_domain)"
curl --fail "https://$TASK_FRONTEND_DOMAIN/api/health"
curl -i "https://$TASK_FRONTEND_DOMAIN/api/users"
```

Health should return HTTP 200. An API request without a Clerk session should return HTTP 401. Open the frontend, sign in as an allowlisted Clerk user, and exercise user creation/deletion and image loading. Configure the frontend URL in the Clerk application's permitted origins/redirect settings as appropriate for your Clerk environment.

Upload sample images when needed:

```bash
./backend/scripts/upload-images.sh "$(terraform -chdir=terraform output -raw s3_images_bucket)"
```

Inspect ECS/App Runner application logs if startup fails. In `apprunner_deployer` mode, inspect cloud-init output and `/var/log/frontend-deploy.log` through SSM if the EC2 frontend build fails.

## Updates and limits

For later updates, publish a new unique backend image tag and repeat the full infrastructure plan/apply and frontend publishing steps. The ECR bootstrap step is unnecessary once the repository exists. App Runner automatic source deployment is disabled; changing the image identifier through Terraform initiates the intended service update.

The local runtime check does not validate AWS account permissions, regional quotas/capacity, DNS propagation, live RDS TLS, or real Clerk sign-in. Those require deployment-time verification. The ECS ALB path is HTTP-only in this learning configuration; add HTTPS before handling real data. See [the architecture limitations](../ARCHITECTURE.md#learning-environment-limitations).
