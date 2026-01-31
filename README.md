# Deploy Comparison App

ALB+ECS(Fargate) と App Runner を Terraform 変数1つで切り替えて比較検証するフルスタックアプリ。

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | React + Vite + TypeScript      |
| Backend  | Node.js + Express + TypeScript |
| Auth     | Clerk (Google OAuth)           |
| DB       | PostgreSQL (RDS) + Prisma      |
| State    | zustand                        |
| Testing  | Vitest + React Testing Library |
| IaC      | Terraform                      |
| CI/CD    | GitHub Actions                 |

## Architecture

| Mode       | 構成                                   |
| ---------- | -------------------------------------- |
| ECS        | CloudFront + S3 / ALB + Fargate / RDS  |
| App Runner | CloudFront + S3 / App Runner / RDS     |

詳細は [ARCHITECTURE.md](ARCHITECTURE.md) を参照。

![ECS Mode](diagrams/ecs-mode.png)
![App Runner Mode](diagrams/apprunner-mode.png)

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Terraform 1.5+
- AWS CLI (configured)
- [Clerk](https://clerk.com) アカウント

## Quick Start (Local)

```bash
# 1. リポジトリクローン
git clone <repo-url> && cd app-runner-test

# 2. Backend 環境変数
cp backend/.env.example backend/.env
# DATABASE_URL, CLERK_SECRET_KEY を設定

# 3. Frontend 環境変数
cp frontend/.env.example frontend/.env
# VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL を設定

# 4. DB + Backend 起動
docker-compose up -d

# 5. DB マイグレーション & シード
cd backend
npx prisma migrate dev
npx prisma db seed

# 6. Frontend 起動
cd ../frontend
npm install && npm run dev
```

## Deploy to AWS

```bash
cd terraform

# 1. 変数設定
cp terraform.tfvars.example terraform.tfvars
# deploy_mode, clerk_secret_key 等を編集

# 2. デプロイモード選択
#    terraform.tfvars 内で切り替え:
#    deploy_mode = "ecs"        # ALB + ECS Fargate
#    deploy_mode = "apprunner"  # App Runner

# 3. Terraform 実行
terraform init
terraform plan
terraform apply
```

## Deploy Commands (CI/CD)

| Workflow               | Trigger       | Description                    |
| ---------------------- | ------------- | ------------------------------ |
| `ci.yml`               | Push / PR     | Lint, Type check, Test, Build  |
| `deploy-ecs.yml`       | Push to main  | ECR push + ECS service update  |
| `deploy-apprunner.yml` | Push to main  | ECR push + App Runner update   |
| `deploy-frontend.yml`  | Push to main  | S3 sync + CloudFront invalidation |

## Project Structure

```
app-runner-test/
├── frontend/          # React + Vite
├── backend/           # Express API + Prisma
├── terraform/         # IaC (modules: vpc, rds, ecr, ecs, apprunner, s3_cdn, s3_images, monitoring)
├── data/images/       # Sample images for S3 upload
├── scripts/           # Utility scripts
├── .github/workflows/ # CI/CD
├── diagrams/          # Architecture diagrams (awsdac)
├── docker-compose.yml # Local dev
└── ARCHITECTURE.md    # Detailed architecture doc
```

## Useful Commands

```bash
# ローカル開発
docker-compose up -d              # DB + Backend
docker-compose down               # 停止

# Backend
cd backend
npm run dev                       # 開発サーバー
npm test                          # テスト実行
npm run test:watch                # テスト (watch mode)
npx prisma studio                 # DB GUI
npx prisma migrate dev            # マイグレーション

# Frontend
cd frontend
npm run dev                       # Vite dev server
npm run build                     # 本番ビルド
npm test                          # テスト実行
npm run test:watch                # テスト (watch mode)

# Terraform
cd terraform
terraform plan                    # 差分確認
terraform apply                   # デプロイ
terraform destroy                 # 全削除

# Sample images を S3 にアップロード
./scripts/upload-images.sh <S3_BUCKET_NAME>

# Architecture diagrams
awsdac diagrams/ecs-mode.yaml -o diagrams/ecs-mode.png
awsdac diagrams/apprunner-mode.yaml -o diagrams/apprunner-mode.png
```

## Environment Variables

### Backend (`backend/.env`)

| Variable           | Description              |
| ------------------ | ------------------------ |
| `DATABASE_URL`     | PostgreSQL 接続文字列    |
| `CLERK_SECRET_KEY` | Clerk シークレットキー   |
| `PORT`             | サーバーポート (default: 3000) |
| `S3_IMAGES_BUCKET` | 画像用 S3 バケット名          |
| `AWS_REGION`       | AWS リージョン                |

### Frontend (`frontend/.env`)

| Variable                       | Description               |
| ------------------------------ | ------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY`   | Clerk パブリッシュキー    |
| `VITE_API_URL`                 | Backend API の URL        |
