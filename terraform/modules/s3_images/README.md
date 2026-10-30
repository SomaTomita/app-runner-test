# Module: s3_images

## Description

Private S3 bucket for image storage. Public access is blocked. This module does not explicitly configure versioning or an encryption policy.

## Usage

```hcl
module "s3_images" {
  source = "./modules/s3_images"
  # ... inputs
}
```

<!-- BEGIN_TF_DOCS -->
<!-- END_TF_DOCS -->
