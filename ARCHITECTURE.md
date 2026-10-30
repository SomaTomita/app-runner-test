# Deploy Comparison App: architecture

## Purpose and status

This personal learning project was created while exploring infrastructure options for potential workplace use. It compares ALB + ECS Fargate with AWS App Runner using a small user-management API and image gallery.

The Terraform variable `deploy_mode` selects the compute configuration. The code is intended for study and disposable experiments. It has not been validated by deploying AWS resources as part of the repository review.

## Application structure

| Area           | Implementation                                                      |
| -------------- | ------------------------------------------------------------------- |
| Frontend       | React + TypeScript, built with Vite and Tailwind CSS                |
| State          | Zustand stores call service functions through an Axios client       |
| Sign-in        | Clerk frontend SDK obtains a bearer token                           |
| Backend        | Express routes, middleware, user service, and storage abstraction   |
| Database       | Prisma Client with the PostgreSQL driver adapter                    |
| Images         | Local sample files or private S3 objects with temporary signed URLs |
| Infrastructure | Terraform modules, remote S3 state, DynamoDB locking                |
| Checks         | GitHub Actions; no automatic AWS deployment                         |

Frontend data flow:

```text
Component -> Zustand action -> API service -> Axios + Clerk token
          <- state update  <- JSON response <- Express API
```

The Axios token provider is installed before components perform passive-effect requests. A failed create operation preserves form input and exposes an error instead of closing the form.

Backend routes delegate database work to `UserService` and image work to `StorageService`. `LocalStorageService` serves sample files during development; `S3StorageService` lists image objects and generates signed URLs. Generated Prisma files live under `backend/src/generated/` and are excluded from Git.

## Deployment modes

### ALB + ECS Fargate (`ecs`)

![ECS architecture](diagrams/ecs-mode.png)

- CloudFront serves frontend files from a private S3 bucket using OAC.
- CloudFront forwards `/api/*` to the ALB with caching disabled.
- The HTTP ALB routes requests to Fargate tasks; no Nginx proxy is required.
- Tasks run in public subnets with public IPs for outbound internet access.
- The task security group accepts application traffic only from the ALB security group.
- RDS remains in private subnets. VPC access to S3 uses the Gateway Endpoint.
- `ecs_desired_count` controls task count. Application Auto Scaling is not configured.

The ALB is HTTP-only in this learning configuration. CloudFront HTTPS does not encrypt the CloudFront-to-ALB connection.

### App Runner with managed NAT (`apprunner`)

![App Runner architecture](diagrams/apprunner-mode.png)

- App Runner provides its HTTPS endpoint and concurrency-based autoscaling.
- A VPC Connector routes application outbound traffic through private subnets.
- RDS is reached directly through the VPC.
- A managed NAT Gateway provides outbound internet access, including Clerk API requests.
- The S3 Gateway Endpoint provides VPC access to the image bucket.

### App Runner with EC2 NAT (`apprunner_deployer`)

![App Runner with EC2 NAT](diagrams/apprunner-deployer-mode.png)

This mode replaces the managed NAT Gateway with an EC2 instance in a public subnet. The instance enables IP forwarding and iptables masquerading, and disables source/destination checking. It also builds the frontend and uploads it to S3.

```text
App Runner -> VPC Connector -> private route table -> EC2 NAT -> internet gateway -> Clerk
Return traffic -> internet gateway -> EC2 connection tracking -> VPC Connector -> App Runner
```

RDS traffic does not pass through the NAT instance. The instance is a single point of failure for internet access. It uses IMDSv2 and supports SSM Session Manager. SSH is disabled unless both a key pair and allowed CIDRs are supplied.

Frontend build configuration is written to an environment file during instance initialization. Values are encoded before shell interpolation. Changing user data replaces the instance, so review changes carefully. The rebuild script is stored at `/opt/deploy-frontend.sh`; its checkout is under `/opt/app` on the instance root volume. The default deployer size is `t3.small` to provide memory for the frontend build.

## Resource selection and scaling

```hcl
# Choose one compute mode.
deploy_mode = "ecs"
# Alternatives: "apprunner" or "apprunner_deployer".

# App Runner example settings.
apprunner_cpu             = "1024"
apprunner_memory          = "2048"
apprunner_max_concurrency = 100
apprunner_max_size        = 5
apprunner_min_size        = 1
```

Both App Runner modes use the same service module. NAT resources depend on the selected mode. All modes create the VPC, RDS, ECR, S3 buckets, CloudFront, and monitoring resources.

Environment presets are stored in `terraform/environments/`. Separate development, staging, and production state explicitly; environment names alone do not create separate backend state.

## Authentication and authorization

1. The user signs in through the Clerk frontend SDK.
2. Axios sends `Authorization: Bearer <token>` with API requests.
3. Clerk middleware verifies the token.
4. The API requires a signed-in user whose Clerk ID appears in `ALLOWED_USER_IDS`.

An unauthenticated caller receives HTTP 401; a signed-in caller outside the allowlist receives HTTP 403. Production startup fails when the Clerk keys or allowlist are absent. Development and test mode bypass authentication only when Clerk backend keys are not configured.

Allowlisted users share all sample records and images. The database has no Clerk ownership column, organizations, tenant isolation, or per-record permissions. Use sample data. Signing out unmounts protected UI, but browser store memory is not an isolation boundary.

Local sample images are exposed under `/static/images`. This local-only development path is not a private image store. AWS mode uses a private S3 bucket and signed URLs that expire after one hour. A signed URL can be used by anyone who possesses it until it expires.

## API

| Method | Path               | Access           | Description                         |
| ------ | ------------------ | ---------------- | ----------------------------------- |
| GET    | `/api/health`      | Public           | Database connectivity check         |
| GET    | `/api/users`       | Allowlisted user | List sample users                   |
| GET    | `/api/users/:id`   | Allowlisted user | Retrieve one sample user            |
| POST   | `/api/users`       | Allowlisted user | Create a sample user                |
| PUT    | `/api/users/:id`   | Allowlisted user | Update a sample user                |
| DELETE | `/api/users/:id`   | Allowlisted user | Delete a sample user                |
| GET    | `/api/images`      | Allowlisted user | List image metadata and signed URLs |
| GET    | `/api/images/:key` | Allowlisted user | Retrieve an image URL               |

User IDs must be positive PostgreSQL 32-bit integers. Zod validates names and email addresses. Missing users return 404; duplicate emails return 409; malformed IDs, invalid JSON, and invalid fields return 400. Unexpected errors return a generic 500 response.

S3 image access accepts PNG, JPEG, GIF, and WebP objects. A single-image lookup checks that the object exists before signing its URL. Lists currently return all matching objects, with no API-level pagination or total-result cap.

## Database

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

The PostgreSQL driver pool is limited to five connections per application instance and uses a connection timeout. RDS PostgreSQL uses verified TLS; the Docker image trusts the public Amazon RDS CA bundle. The Terraform connection URL escapes username/password values.

RDS uses encrypted storage, seven-day backup retention, and private subnet placement. Instance size, Multi-AZ, storage autoscaling, deletion protection, and final snapshot behavior are configurable. A final snapshot identifier is generated when snapshots are enabled.

The production container includes Prisma CLI and migration files, and runs `prisma migrate deploy` before accepting HTTP requests. Failed migrations prevent startup. It does not reset or seed data. Prisma generation explicitly targets CommonJS with JavaScript import extensions, matching the compiled Node.js application.

## Security groups and storage

| Group            | Inbound access                                          |
| ---------------- | ------------------------------------------------------- |
| ALB              | Internet traffic on TCP 80 in the learning setup        |
| ECS task         | ALB security group on the application port              |
| RDS              | Selected compute security groups on TCP 5432            |
| VPC Connector    | No inbound rule required for application egress         |
| EC2 NAT/deployer | VPC Connector traffic; optional SSH from explicit CIDRs |

All S3 buckets block public access. CloudFront accesses frontend objects through OAC. Backend IAM roles have image-bucket list/read permissions. The frontend deployer has permissions scoped to its frontend bucket and CloudFront distribution.

The image and frontend modules do not explicitly configure versioning or a customer-managed encryption policy. Terraform state storage does explicitly configure versioning and server-side encryption. ECR scans images on push and uses mutable tags with a lifecycle policy for untagged images.

## Logging and monitoring

Backend requests produce JSON logs with timestamp, HTTP method, path, response status, elapsed milliseconds, request ID, user agent, and IP address. Responses include `X-Request-Id`. Behind proxies, `req.ip` may identify the proxy because Express proxy trust is not configured.

ECS logs use `/ecs/{name-prefix}/backend` with 30-day retention. App Runner creates its own service and application log groups; this code does not configure their retention.

Example CloudWatch Logs Insights queries:

```text
fields @timestamp, level, message, path, statusCode
| filter level = "error"
| sort @timestamp desc
| limit 50
```

```text
fields @timestamp, method, path, responseTime, statusCode
| filter responseTime > 1000
| sort responseTime desc
| limit 20
```

```text
stats count(*) as requests by statusCode
| sort requests desc
```

Terraform defines RDS CPU/connection alarms, ECS CPU/memory alarms, ALB target 5xx alarms, App Runner 5xx alarms, and a dashboard. App Runner metrics include both service name and service ID dimensions. Set `alarm_sns_topic_arn` to enable notifications; an empty ARN means no notification target.

## Deployment and CI

ECS uses rolling updates with minimum healthy capacity of 100% and maximum capacity of 200%. App Runner automatic source deployments are disabled; an operator must trigger an intentional update. The frontend is uploaded to S3 followed by CloudFront invalidation.

GitHub Actions runs lint, formatting, backend/frontend tests and builds, dependency audits, and static Terraform checks. The workflow has read-only repository permissions and no AWS credentials or deployment step.

[The deployment guide](docs/DEPLOYMENT.md) specifies the initial ECR bootstrap, Linux AMD64 image publishing, full infrastructure apply, and frontend delivery. AWS deployment operations are not implemented by CI.

## Tests

| Target   | Environment | Libraries                                 |
| -------- | ----------- | ----------------------------------------- |
| Frontend | jsdom       | Vitest, React Testing Library, user-event |
| Backend  | Node.js     | Vitest, Supertest                         |

Tests live next to implementation files as `*.test.ts` or `*.test.tsx`. Most route/component tests mock database, storage, or Clerk dependencies. Additional regression tests cover access restrictions and error handling. CI additionally runs the production container against a real disposable local PostgreSQL database to verify migrations, startup, CRUD, access rejection, and repeat startup. These are not live AWS integration tests.

See [README.md](README.md#checks-without-aws-resources) for commands. Prisma Client must be generated before backend compilation and tests that import the user service.

## Diagrams

Diagram sources and labels are in English and stored under `diagrams/`. They illustrate resource relationships rather than every routing detail; CloudFront also proxies API calls in the Terraform configuration.

The PNG files can be regenerated with [AWS Diagram-as-Code](https://github.com/awslabs/diagram-as-code):

```bash
awsdac diagrams/ecs-mode.yaml -o diagrams/ecs-mode.png
awsdac diagrams/apprunner-mode.yaml -o diagrams/apprunner-mode.png
awsdac diagrams/apprunner-deployer-mode.yaml -o diagrams/apprunner-deployer-mode.png
```

## State management

The root backend uses S3 for state and DynamoDB for locking. `terraform/bootstrap/` creates these resources. The root backend is already active; its bucket and table must exist before normal root initialization.

Use `terraform init -backend=false` for static local checks. Use `terraform init -migrate-state` only when intentionally migrating existing state. Protect state as sensitive data and use a separate key or workspace per environment.

## Learning environment limitations

| Area              | Current behavior                                                                                | Before using real workloads                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Secrets           | Plain runtime environment values are recorded in Terraform state and service/task configuration | Use Secrets Manager or SSM references and restrict state access     |
| ALB transport     | HTTP-only listener and HTTP origin traffic                                                      | Add ACM, HTTPS, and suitable origin restrictions                    |
| Authorization     | Explicit allowlist with shared sample records                                                   | Define roles, ownership, and tenant boundaries                      |
| Local development | API auth bypass without Clerk keys; public sample image path                                    | Keep localhost binding and use synthetic data                       |
| EC2 NAT           | Single instance and availability zone; frontend checkout on the instance volume                 | Design failover, durable build artifacts, and recovery              |
| API size          | User/image lists have no API pagination; no rate limiting                                       | Add limits appropriate to the workload                              |
| Monitoring        | Optional SNS destination; App Runner retention unmanaged                                        | Configure notification delivery and log retention                   |
| Deployment        | Local production-image/PostgreSQL checks and startup migrations; no live AWS test               | Add an approved AWS deployment pipeline and live integration checks |
| State             | A shared default backend key                                                                    | Isolate environment state explicitly                                |

Cost comparisons depend on region, uptime, traffic, provisioned resources, and data transfer. Managed NAT adds its own charges; EC2 NAT adds instance and public IPv4 costs. No cost estimate here should be treated as a current AWS quote.

## Next steps

- Move runtime secrets to managed secret references.
- Add HTTPS for the ECS ALB path.
- Add pagination, rate limits, and workload-specific authorization.
- Add an intentionally approved deployment workflow and live integration tests.
- Improve NAT availability and frontend build durability.
