# Terraform

AWS インフラを管理する Terraform コードです。ECS Fargate と App Runner の2つのデプロイモードをサポートしています。

## ディレクトリ構成

```
terraform/
├── bootstrap/        # リモートステート用 S3 + DynamoDB（初回のみ）
├── environments/     # 環境別 tfvars (dev / staging / prod)
├── modules/          # 各リソースのモジュール
├── main.tf           # ルートモジュール
├── variables.tf      # 変数定義
├── outputs.tf        # 出力値
└── backend.tf        # リモートステート設定（初回後に有効化）
```

## 前提条件

- Terraform >= 1.5.0
- AWS CLI（`aws configure` で認証設定済み）

## デプロイモード

`deploy_mode` 変数で切り替えます。

| モード | 構成 | 用途 |
|---|---|---|
| `ecs` | ALB + ECS Fargate | 標準的なコンテナデプロイ |
| `apprunner` | App Runner + EC2 NAT | フルマネージド構成 |

共通リソース（どちらのモードでも作成）: RDS, ECR, S3, CloudFront

## 初回セットアップ（bootstrap）

Terraform のリモートステートを保存するための S3 バケットと DynamoDB テーブルを作成します。

**実行タイミング：** このプロジェクトのインフラを**初めて構築するとき1回だけ**実行します。
すでに S3 バケット（`deploy-comparison-tfstate`）と DynamoDB テーブル（`deploy-comparison-tfstate-lock`）が存在する場合は不要です。

```bash
cd terraform/bootstrap
terraform init
terraform apply
```

完了後、`terraform/backend.tf` のコメントを外してリモートステートに移行します。

```hcl
# terraform/backend.tf のコメントを外す
terraform {
  backend "s3" {
    # ... (ファイル内のコメントを参照)
  }
}
```

```bash
cd terraform/
terraform init -migrate-state   # ローカルステートをS3に移行
```

以降は `terraform init` のみで OK です（再移行は不要）。

## 基本的な使い方

### 初期化

```bash
cd terraform
terraform init
```

### 差分確認

```bash
terraform plan \
  -var-file=environments/dev.tfvars \
  -var="db_password=your-password" \
  -var="clerk_secret_key=sk_test_..."
```

### デプロイ

```bash
terraform apply \
  -var-file=environments/dev.tfvars \
  -var="db_password=your-password" \
  -var="clerk_secret_key=sk_test_..."
```

### 削除

```bash
terraform destroy \
  -var-file=environments/dev.tfvars \
  -var="db_password=your-password" \
  -var="clerk_secret_key=sk_test_..."
```

## 環境別 tfvars

| ファイル | 環境 | RDS インスタンス | 冗長化 |
|---|---|---|---|
| `environments/dev.tfvars` | dev | t3.micro | なし |
| `environments/staging.tfvars` | staging | t3.small | なし |
| `environments/prod.tfvars` | prod | t3.medium | Multi-AZ |

## シークレットの渡し方

`db_password` と `clerk_secret_key` は機密情報のため、以下の方法で渡します。

```bash
# -var フラグで渡す（推奨）
-var="db_password=..." -var="clerk_secret_key=..."

# 環境変数で渡す
export TF_VAR_db_password="..."
export TF_VAR_clerk_secret_key="..."
```

`terraform.tfvars` に直書きするのは **非推奨**（git にコミットしないよう注意）。

## よく使うコマンド

```bash
# デプロイ後の出力値を確認
terraform output

# ECR リポジトリ URL を取得（docker push 時に使用）
terraform output -raw ecr_repository_url

# CloudFront URL を取得
terraform output -raw cloudfront_domain

# deployer EC2 に SSM で接続（App Runner モード）
aws ssm start-session --target $(terraform output -raw deployer_instance_id)

# S3 にサンプル画像をアップロード
./backend/scripts/upload-images.sh $(terraform output -raw s3_images_bucket)
```

## モジュール一覧

| モジュール | 作成されるリソース |
|---|---|
| `vpc` | VPC, サブネット, IGW, S3 Gateway Endpoint |
| `ecr` | ECR リポジトリ（タグ immutable） |
| `rds` | PostgreSQL 16.4（プライベートサブネット） |
| `ecs` | ALB + ECS Fargate クラスター |
| `apprunner` | App Runner サービス + VPC Connector |
| `deployer` | EC2 NAT インスタンス（App Runner モード専用） |
| `s3_cdn` | S3 + CloudFront（フロントエンド配信） |
| `s3_images` | S3（アプリ画像保存用） |
| `monitoring` | CloudWatch Alarms + Dashboard |

## 注意事項

- `terraform destroy` を実行すると **RDS も削除**されます。本番環境では `deletion_protection = true`（prod.tfvars デフォルト）を確認してください。
- App Runner モードでは `deployer`（EC2 NAT）が App Runner → RDS の通信を中継します。deployer を削除するとバックエンドから DB に接続できなくなります。
- ECR のタグは immutable（上書き不可）です。同じタグで再プッシュする場合は一度削除が必要です。
