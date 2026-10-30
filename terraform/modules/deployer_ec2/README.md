# Module: deployer_ec2

## Description

EC2 instance providing NAT for App Runner outbound internet access and an optional frontend build/deployment step. Used in `apprunner_deployer` mode. RDS traffic stays inside the VPC and does not pass through this instance.

## Usage

```hcl
module "deployer_ec2" {
  source = "./modules/deployer_ec2"
  # ... inputs
}
```

<!-- BEGIN_TF_DOCS -->
<!-- END_TF_DOCS -->
