# Deploy Comparison App - Architecture Overview

## Purpose

ALB+ECS(Fargate) と App Runner の2つのデプロイ方式を、Terraform変数1つで切り替えて比較検証するためのシンプルなフルスタックアプリ。

---

## Tech Stack

| Layer              | Technology                     |
| ------------------ | ------------------------------ |
| Frontend           | React + Vite + TypeScript      |
| Backend            | Node.js + Express + TypeScript |
| Authentication     | Clerk (Google OAuth)           |
| ORM                | Prisma                         |
| Database           | PostgreSQL (RDS)               |
| State Management   | zustand                        |
| IaC                | Terraform                      |
| Testing            | Vitest + React Testing Library |
| CI/CD              | GitHub Actions                 |
| Container Registry | Amazon ECR                     |

---

## Directory Structure

```
app-runner-test/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.test.tsx            # App component test
│   │   ├── main.tsx
│   │   ├── vite-env.d.ts           # Vite type declarations
│   │   ├── test/
│   │   │   └── setup.ts            # Test setup (jsdom, cleanup)
│   │   ├── api/
│   │   │   └── client.ts           # axios wrapper + Clerk token
│   │   ├── services/
│   │   │   ├── userService.ts      # User API calls
│   │   │   └── imageService.ts     # Image API calls
│   │   ├── stores/
│   │   │   ├── useUserStore.ts     # zustand: user state
│   │   │   └── useImageStore.ts    # zustand: image state
│   │   ├── components/
│   │   │   ├── AuthGuard.tsx       # Clerk auth wrapper
│   │   │   ├── UserList.tsx
│   │   │   ├── UserList.test.tsx    # Component test
│   │   │   ├── ImageGallery.tsx     # Image grid display
│   │   │   └── ImageGallery.test.tsx
│   │   └── types/
│   │       └── index.ts
│   ├── index.html
│   ├── vite.config.ts              # Vite config (API proxy)
│   ├── vitest.config.ts            # Vitest config (jsdom environment)
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── app.ts               # Express app setup
│   │   ├── server.ts            # Server entry point
│   │   ├── config/
│   │   │   └── index.ts         # Centralized config from env
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── health.ts        # Health check endpoint
│   │   │   ├── health.test.ts   # Health endpoint test
│   │   │   ├── users.ts         # CRUD endpoint
│   │   │   ├── users.test.ts    # Users endpoint test
│   │   │   ├── images.ts        # Image list + presigned URL
│   │   │   └── images.test.ts   # Images endpoint test
│   │   ├── services/
│   │   │   ├── UserService.ts   # User CRUD class
│   │   │   └── storage/
│   │   │       ├── StorageService.ts       # Abstract base class
│   │   │       ├── LocalStorageService.ts  # Local filesystem
│   │   │       ├── S3StorageService.ts     # AWS S3
│   │   │       └── index.ts               # Factory
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── logger.ts        # Structured JSON logging
│   │   │   ├── cors.ts
│   │   │   └── auth.ts          # Clerk JWT verification
│   │   └── lib/
│   │       ├── prisma.ts        # Prisma client singleton
│   │       └── errors.ts        # AppError class
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── Dockerfile               # Multi-stage production build
│   ├── .dockerignore
│   ├── vitest.config.ts         # Vitest config (node environment)
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   ├── data/
│   │   └── images/              # Sample images for S3 upload / local dev
│   └── scripts/
│       └── upload-images.sh     # S3 画像アップロードスクリプト
│
├── terraform/
│   ├── main.tf                  # Root module
│   ├── variables.tf             # Global variables
│   ├── outputs.tf               # Outputs (URLs etc.)
│   ├── locals.tf                # Computed values
│   ├── versions.tf              # Provider versions
│   ├── backend.tf               # S3 + DynamoDB state backend
│   ├── terraform.tfvars.example
│   ├── .tflint.hcl              # TFLint config
│   ├── .terraform-docs.yml      # terraform-docs config
│   │
│   ├── bootstrap/               # State backend 用リソース
│   │   ├── main.tf              #   S3 + DynamoDB
│   │   └── outputs.tf
│   │
│   ├── environments/            # 環境別設定
│   │   ├── dev.tfvars
│   │   ├── staging.tfvars
│   │   └── prod.tfvars
│   │
│   └── modules/                 # 各モジュール: main/variables/outputs/versions/README
│       ├── vpc/                 # VPC, Subnets, IGW, S3 Gateway Endpoint
│       ├── rds/                 # RDS PostgreSQL
│       ├── ecr/                 # ECR repositories (IMMUTABLE tags)
│       ├── ecs/                 # ALB + ECS Fargate (backend only)
│       ├── apprunner/           # App Runner service
│       ├── deployer/            # EC2 NAT (App Runner mode)
│       ├── s3_cdn/              # S3 + CloudFront (Frontend, OAC)
│       ├── s3_images/           # S3 (Images, versioning + encryption)
│       └── monitoring/          # CloudWatch Alarms, Dashboard
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint, Test, Build check
│       ├── deploy-ecs.yml       # ECS deploy workflow
│       ├── deploy-apprunner.yml # App Runner deploy workflow
│       └── deploy-frontend.yml  # S3 + CloudFront deploy
│
├── diagrams/                    # Architecture diagrams (awsdac)
│   ├── ecs-mode.yaml            # ECS mode diagram definition
│   ├── apprunner-mode.yaml      # App Runner mode diagram definition
│   ├── ecs-mode.png             # Generated diagram
│   └── apprunner-mode.png       # Generated diagram
│
├── docker-compose.yml           # Local development
├── .gitignore
└── ARCHITECTURE.md              # This file
```

---

## Deployment Modes

### Mode 1: ALB + ECS (Fargate)

![ECS Mode Architecture](diagrams/ecs-mode.png)

```bash
# 図の生成: awsdac diagrams/ecs-mode.yaml -o diagrams/ecs-mode.png
```

**特徴:**

- ALB が直接 Backend コンテナにルーティング (Nginx 不要)
- ALB で複数タスクへのロードバランシング
- タスク数でスケーリング
- Public IP 付与により外部 API (Clerk等) に直接アクセス (NAT Gateway 不要)
- S3 Gateway Endpoint 経由で画像用 S3 バケットにアクセス

### Mode 2: App Runner

![App Runner Mode Architecture](diagrams/apprunner-mode.png)

```bash
# 図の生成: awsdac diagrams/apprunner-mode.yaml -o diagrams/apprunner-mode.png
```

**特徴:**

- App Runner が HTTPS 終端・LB を担当
- 自動スケーリング内蔵
- VPC Connector (`egress_type = "VPC"`) で RDS に接続
- `egress_type = "VPC"` は全送信トラフィックを VPC 経由にするため、外部 API (Clerk等) へのアクセスに **NAT が必要**
- Public Subnet の EC2 (deployer) が NAT を兼務 (`ip_forward` + `iptables MASQUERADE`)
- S3 Gateway Endpoint 経由で画像用 S3 バケットにアクセス
- マネージドサービスのため運用が楽

#### App Runner → 外部 API パケットフロー

```
App Runner → VPC Connector (private subnet ENI)
  → Route Table: 0.0.0.0/0 → EC2 NAT の ENI
  → EC2 (deployer + NAT): MASQUERADE で SNAT
  → IGW → Clerk API

戻り: Clerk → IGW → EC2 (conntrack で reverse SNAT) → VPC Connector → App Runner
```

### 切り替え方法

```hcl
# terraform.tfvars
deploy_mode = "ecs"       # ALB + ECS Fargate
# deploy_mode = "apprunner"  # App Runner
```

Terraform の `count` / `for_each` で deploy_mode に応じてリソースを作成/スキップ。

環境別の設定は `environments/` ディレクトリの tfvars ファイルで管理:
```bash
terraform apply -var-file=environments/dev.tfvars
terraform apply -var-file=environments/prod.tfvars
```

> **Note:** ECS モードは Public IP 付与により NAT 不要。App Runner モードは `egress_type = "VPC"` で全トラフィックが VPC 経由となるため、EC2 (deployer) が NAT を兼務 (追加コスト ~$4/月)。

---

## App Runner Spec Configuration

```hcl
# terraform.tfvars で簡単に変更可能

# App Runner instance configuration
apprunner_cpu    = "1024"    # 1 vCPU  (256|512|1024|2048|4096)
apprunner_memory = "2048"    # 2 GB    (512|1024|2048|3072|4096|6144|8192|10240|12288)

# Auto scaling
apprunner_max_concurrency = 100  # リクエスト同時実行数
apprunner_max_size        = 5    # 最大インスタンス数
apprunner_min_size        = 1    # 最小インスタンス数
```

---

## CloudWatch Logging Strategy

### App Runner Logs

App Runner は自動的に CloudWatch Logs に出力する。以下を設定:

| Log Group                               | 内容                                 | Retention |
| --------------------------------------- | ------------------------------------ | --------- |
| `/apprunner/{service-name}/application` | アプリケーションログ (stdout/stderr) | 30 days   |
| `/apprunner/{service-name}/service`     | App Runner サービスイベント          | 30 days   |

### ECS Logs

| Log Group                | 内容                            | Retention |
| ------------------------ | ------------------------------- | --------- |
| `/ecs/{cluster}/backend` | Backend container stdout/stderr | 30 days   |

### Structured Logging (Backend)

```json
{
  "timestamp": "2025-01-31T10:00:00.000Z",
  "level": "info",
  "message": "GET /api/users 200 15ms",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "responseTime": 15,
  "requestId": "uuid-xxx",
  "userAgent": "Mozilla/5.0...",
  "ip": "10.0.1.50"
}
```

- JSON 形式で出力 → CloudWatch Logs Insights でクエリ可能
- Request ID をヘッダーで追跡
- Response time 計測

### CloudWatch Logs Insights クエリ例

```sql
-- エラーログの検索
fields @timestamp, level, message, path, statusCode
| filter level = "error"
| sort @timestamp desc
| limit 50

-- レスポンスタイムが遅いリクエスト
fields @timestamp, method, path, responseTime, statusCode
| filter responseTime > 1000
| sort responseTime desc
| limit 20

-- ステータスコード別の集計
stats count(*) as cnt by statusCode
| sort cnt desc

-- 特定パスのリクエスト分析
fields @timestamp, method, path, responseTime
| filter path like /api\/users/
| stats avg(responseTime) as avgTime, max(responseTime) as maxTime, count(*) as total by bin(5m)
```

---

## Shared Resources (Both Modes)

以下のリソースは deploy_mode に関係なく常に作成:

| Resource              | Description                  |
| --------------------- | ---------------------------- |
| VPC                    | 2 AZ, public/private subnets   |
| NAT (EC2 deployer)     | App Runner モード時のみ (EC2 が NAT 兼務, 単一 AZ) |
| S3 Gateway Endpoint    | VPC 内から S3 へのプライベート接続 |
| RDS PostgreSQL         | db.t3.micro (テスト用)         |
| ECR                    | Backend image repository       |
| S3 (Frontend)          | CloudFront + OAC               |
| S3 (Images)            | 画像ストレージ                 |
| CloudWatch Log Groups  | Monitoring                     |

---

## API Endpoints (Backend)

Clerk 認証 + シンプルな CRUD:

| Method | Path             | Auth     | Description    |
| ------ | ---------------- | -------- | -------------- |
| GET    | `/api/health`    | -        | ヘルスチェック |
| GET    | `/api/users`     | Required | ユーザー一覧   |
| GET    | `/api/users/:id` | Required | ユーザー詳細   |
| POST   | `/api/users`     | Required | ユーザー作成   |
| PUT    | `/api/users/:id` | Required | ユーザー更新   |
| DELETE | `/api/users/:id` | Required | ユーザー削除   |
| GET    | `/api/images`    | Required | 画像一覧 (S3)  |
| GET    | `/api/images/:key` | Required | 画像取得 (S3 presigned URL) |

認証フロー:

1. Frontend: Clerk SDK でログイン → JWT トークン取得
2. Frontend → Backend: `Authorization: Bearer <token>` ヘッダー付きリクエスト
3. Backend: `auth.ts` ミドルウェアで Clerk JWT を検証

---

## Database Schema (Prisma)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Operational Concerns / 運用面の検討事項

### 1. Cost Comparison (コスト比較)

| Item          | ECS                  | App Runner                              |
| ------------- | -------------------- | --------------------------------------- |
| Compute       | vCPU/Memory 秒課金   | vCPU/Memory 秒課金 + プロビジョニング料 |
| LB            | ALB ~$16/月 + LCU    | 込み (無料)                             |
| NAT (EC2)     | 不要                 | ~$4/月 (deployer EC2 兼用, t3.nano)     |
| 最小コスト/月 | ALB + 1 task = ~$30~ | idle 時 ~$9~ (EC2 NAT 含む)             |
| スケール時    | タスク数で線形増     | 自動スケール                            |

**結論**: ECS は ALB 固定費のみ。App Runner は deployer EC2 が NAT を兼務するため追加コストは最小限、compute は idle 時ほぼ無料。

### 2. Scaling (スケーリング)

- **ECS**: Application Auto Scaling (CPU/Memory ターゲット) を設定可能。手動でも task 数を変更可能。
- **App Runner**: 同時リクエスト数ベースで自動スケール。`max_concurrency` でインスタンスあたりの処理数を調整。

### 3. Secrets 管理

検証用途のため、環境変数で管理する。

| Secret             | 管理方法                                         |
| ------------------ | ------------------------------------------------ |
| `DATABASE_URL`     | ECS: タスク定義の環境変数 / App Runner: 環境変数 |
| `CLERK_SECRET_KEY` | ECS: タスク定義の環境変数 / App Runner: 環境変数 |
| `STORAGE_TYPE`     | `local` (開発) / `s3` (本番) -- 画像ストレージ切替 |
| `S3_IMAGES_BUCKET` | 画像用 S3 バケット名 (本番時)                    |

- Terraform で `sensitive = true` を付与し、`TF_VAR_` 環境変数 or `-var` フラグで注入（`terraform.tfvars` は `.gitignore` で除外）
- CI/CD では GitHub Actions Secrets に格納 → デプロイ時に注入
- 本番移行時は Secrets Manager or SSM Parameter Store に切り替え

### 4. Security (セキュリティ)

- Clerk で認証管理 (JWT 検証)
- RDS は private subnet に配置 → インターネットから直接アクセス不可

**Security Group ルール:**

| SG          | Inbound                                              | Outbound   |
| ----------- | ---------------------------------------------------- | ---------- |
| ALB SG      | `0.0.0.0/0` → port 80/443                           | All        |
| ECS Task SG | ALB SG → port 3000                                  | All        |
| RDS SG      | ECS Task SG → port 5432 / App Runner VPC Connector SG → port 5432 | Deny (default) |
| Deployer SG | VPC Connector SG → all (NAT) / SSH → port 22                     | All            |

- Deployer EC2 は SSM Session Manager で管理 (`AmazonSSMManagedInstanceCore` ポリシー付与済み)。SSH はデフォルト無効 (`ssh_allowed_cidrs = []`)
- ECS タスクは public subnet に配置 (Public IP) → SG で ALB からのみ受け入れ
- App Runner は VPC Connector で private subnet の RDS に接続
- S3 (Frontend) は OAC (Origin Access Control) で CloudFront 経由のみアクセス許可
- S3 (Images) は Instance Role で Backend からのみアクセス許可
- S3 Gateway Endpoint で VPC 内から S3 へプライベート接続 (NAT Gateway 不要)
- ECR イメージタグ不変化 (`image_tag_mutability = "IMMUTABLE"`) でタグ上書きを防止
- S3 バケット (Images / Frontend) はサーバーサイド暗号化 (AES256) + バージョニング有効
- Terraform 変数バリデーションでプレースホルダー値・不正フォーマットを拒否

### 5. Database (データベース)

- RDS インスタンスクラス・Multi-AZ・削除保護等は環境別 tfvars で設定可能
  - dev: `db.t3.micro`, Single-AZ, `skip_final_snapshot=true`
  - prod: `db.t3.medium+`, Multi-AZ, `deletion_protection=true`, storage autoscaling
- Automated backups: 7 days
- Connection pooling: Prisma の接続プール設定

### 6. Deployment (デプロイ)

- **ECS**: Rolling update (最小ヘルシー 100%, 最大 200%)
- **App Runner**: 自動ローリングデプロイ
- **Frontend**: S3 sync + CloudFront invalidation
- **Docker image tag**: git commit SHA (例: `abc1234`) を使用

### 7. Monitoring & Alerts (将来的に)

- CPU/Memory 使用率アラーム
- 5xx エラー率アラーム
- RDS 接続数監視
- CloudWatch Dashboard でメトリクス可視化

### 8. CI/CD Pipeline

```
Push to main
  │
  ├── CI (ci.yml)
  │   ├── Lint
  │   ├── Type check
  │   ├── Test
  │   └── Build check
  │
  ├── Deploy Backend (deploy-ecs.yml or deploy-apprunner.yml)
  │   ├── ⏸ Manual approval (GitHub Environments)
  │   ├── Build Docker image
  │   ├── Push to ECR
  │   ├── Run Prisma migrate
  │   └── Update ECS service / App Runner
  │
  └── Deploy Frontend (deploy-frontend.yml)
      ├── ⏸ Manual approval (GitHub Environments)
      ├── Build (npm run build)
      ├── Upload to S3
      └── Invalidate CloudFront cache
```

- GitHub Environments に `production` 環境を作成し、Required reviewers を設定
- CI 成功後、レビュアーに通知メールが届く → Actions ページで「Approve and deploy」を押してデプロイ実行
- `terraform output` から Backend URL を取得し、Frontend ビルド時に `VITE_API_URL` として注入

### 9. Testing (テスト)

**Vitest** を Frontend / Backend 共通で使用。Vite エコシステムに統一し、設定を最小化。

| 対象     | Framework | Environment | 補助ライブラリ                |
| -------- | --------- | ----------- | ----------------------------- |
| Frontend | Vitest    | jsdom       | React Testing Library, msw    |
| Backend  | Vitest    | node        | supertest                     |

**テストファイル配置**: コロケーション方式 (テスト対象と同じディレクトリに `*.test.ts(x)` を配置)

```bash
# Frontend テスト
cd frontend
npm test              # vitest run
npm run test:watch    # vitest (watch mode)

# Backend テスト
cd backend
npm test              # vitest run
npm run test:watch    # vitest (watch mode)
```

**Frontend アーキテクチャ:**
- **zustand** で状態管理 (`stores/`)
- **services/** で API 呼び出しを集約 (コンポーネントから分離)
- データフロー: Component → Store (action) → Service (API call) → Store (state update) → Component (re-render)

**Frontend テスト方針:**
- コンポーネントのレンダリング・ユーザー操作をテスト
- zustand store / service を `vi.mock` でモック
- `src/test/setup.ts` で jsdom 環境のセットアップ + Clerk モック

**Backend テスト方針:**
- supertest で Express ルートの統合テスト
- Prisma Client はモック (`vi.mock`)
- 認証ミドルウェアはテスト時にバイパス

### 10. Local Development

```bash
docker compose up          # PostgreSQL + Backend
cd frontend && npm run dev # Vite dev server
```

---

## Architecture Diagrams

[awslabs/diagram-as-code](https://github.com/awslabs/diagram-as-code) を使用。

```bash
# インストール
brew install awsdac

# 図の生成
awsdac diagrams/ecs-mode.yaml -o diagrams/ecs-mode.png
awsdac diagrams/apprunner-mode.yaml -o diagrams/apprunner-mode.png
```

YAML 定義ファイル: `diagrams/` ディレクトリ

---

## Terraform State 管理

チーム開発を想定し、S3 + DynamoDB で state を管理する。

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "deploy-comparison-tfstate"
    key            = "terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "deploy-comparison-tfstate-lock"
    encrypt        = true
  }
}
```

- S3 バケット: state ファイル保存 (バージョニング有効)
- DynamoDB テーブル: state lock (同時実行防止)
- S3 バケット・DynamoDB テーブルは `terraform/bootstrap/` モジュールで作成可能:
  ```bash
  cd terraform/bootstrap && terraform init && terraform apply
  ```
  その後、本体の `backend.tf` を有効化:
  ```bash
  cd terraform && terraform init -migrate-state
  ```

---

## Deploy Checklist

### デプロイ前

- [ ] `terraform/bootstrap` で state 管理用リソースを作成 (`cd terraform/bootstrap && terraform apply`)
- [ ] `terraform init -migrate-state` でリモート state へ移行
- [ ] `TF_VAR_db_password` 環境変数で RDS パスワードを設定
- [ ] `TF_VAR_clerk_secret_key` 環境変数で Clerk キーを設定
- [ ] `terraform.tfvars` or 環境別 tfvars で `deploy_mode` を設定
- [ ] Clerk アカウント作成、キー取得
- [ ] GitHub Actions Secrets に `CLERK_SECRET_KEY`, `DATABASE_URL` 等を登録
- [ ] GitHub Environments に `production` 環境 + Required reviewers を設定

### デプロイ後

- [ ] Backend の CORS 許可オリジンに CloudFront ドメインを設定
- [ ] Clerk の Allowed origins に CloudFront ドメインを追加
- [ ] 動作確認 (ヘルスチェック、認証フロー、CRUD)

---

## テスト環境特有の仕様 (本番移行時の変更点)

本プロジェクトは比較検証用のため、以下のコスト・簡略化のためのトレードオフがある。

| 項目 | テスト環境 (現状) | 本番で必要な対応 |
|------|-------------------|------------------|
| シークレット管理 | ECS/App Runner の環境変数に平文で渡す | Secrets Manager or SSM Parameter Store に移行 |
| HTTPS | ALB は HTTP:80 のみ。App Runner は標準で HTTPS | ACM 証明書 + HTTPS リスナー + HTTP→HTTPS リダイレクト |
| SSH | deployer EC2 の SSH はデフォルト無効 (`ssh_allowed_cidrs = []`) | SSM Session Manager の利用を推奨 |
| RDS | `environments/dev.tfvars` で設定 (db.t3.micro, Single-AZ, skip_final_snapshot=true) | `environments/prod.tfvars` で Multi-AZ + 削除保護 + storage autoscaling |
| NAT | EC2 (deployer) が NAT を兼務 (単一インスタンス, 冗長性なし) | マネージド NAT Gateway or 複数 AZ 構成 |
| CloudWatch | アラーム定義済だが通知先 (SNS) はオプション | `alarm_sns_topic_arn` を設定して通知有効化 |
| ECS タスク配置 | Public Subnet + Public IP (NAT 不要でコスト削減) | Private Subnet + NAT Gateway が望ましい |

---

## Next Steps / 今後の対応

1. [ ] ACM 証明書 + カスタムドメイン
2. [ ] Secrets Manager / SSM Parameter Store への移行
3. [ ] Blue-Green deployment
