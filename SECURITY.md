# Security

## Project scope

This is a personal learning project created while exploring deployment options for potential workplace use. Use synthetic records and sample images. The repository demonstrates infrastructure choices; it does not provide a production security guarantee.

## Access model

Production requires Clerk authentication and an explicit `ALLOWED_USER_IDS` allowlist. Every allowed user can read and modify all sample user records and access the sample image bucket. There are no separate tenant or record ownership boundaries.

Without Clerk backend keys, `development` and `test` modes bypass API authentication. Docker Compose binds both the API and PostgreSQL to localhost. Local sample images are publicly served by the development backend. Do not expose that setup to an untrusted network.

S3 image URLs are temporary bearer links. Anyone with a link can retrieve that object until the link expires.

## Secrets and public source

- Keep Clerk server keys, database passwords, AWS credentials, populated environment files, Terraform state, and saved plans out of Git.
- Vite exposes `VITE_*` values to browsers. Include public configuration only.
- Terraform sensitive inputs still appear in state. The learning configuration passes runtime secrets as environment values, which authorized AWS configuration readers can inspect.
- Use unique test credentials and replace exposed credentials immediately. Removing a secret in a later commit does not remove it from history.
- Review an environment preset before using it, and keep private deployment notes outside the tracked tree.

## Infrastructure limitations

The ECS ALB uses HTTP in this learning configuration. Add HTTPS before sending real data or tokens through that path. EC2 NAT uses a single instance. Application rate limiting, tenant isolation, deployment integration tests, and managed secret references are not implemented.

See [ARCHITECTURE.md](ARCHITECTURE.md#learning-environment-limitations) for details.

## Reporting a vulnerability

Use the repository's private vulnerability reporting feature when available. If it is unavailable, contact the repository owner privately before publishing exploit details. Do not include credentials, personal data, or active signed URLs in a public issue.

## Verification scope

Automated checks cover source linting, tests with mocked dependencies, builds, dependency audits, and static Terraform validation. They do not create AWS resources or confirm the behavior of a live deployment. Secret files are excluded from code review; a review cannot certify their contents or any external deployment configuration.
