terraform {
  backend "s3" {
    bucket         = "deploy-comparison-tfstate"
    key            = "terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "deploy-comparison-tfstate-lock"
    encrypt        = true
  }
}
