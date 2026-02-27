#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <S3_BUCKET_NAME>"
  echo "Example: $0 my-app-images-bucket"
  exit 1
fi

BUCKET_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE_DIR="${SCRIPT_DIR}/../data/images"

if [ ! -d "$IMAGE_DIR" ]; then
  echo "Error: ${IMAGE_DIR} not found"
  exit 1
fi

echo "Uploading images to s3://${BUCKET_NAME}/ ..."
aws s3 sync "$IMAGE_DIR" "s3://${BUCKET_NAME}/" \
  --exclude ".gitkeep" \
  --exclude ".*"

echo "Done."
