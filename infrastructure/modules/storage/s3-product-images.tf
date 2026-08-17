# Same pattern as s3-static-site.tf — private bucket, CloudFront reaches
# it via OAC, and the bucket policy granting that access lives in the cdn
# module (which needs the distribution's ARN).

resource "aws_s3_bucket" "product_images" {
  bucket = "${var.project_name}-product-images-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, { Name = "${var.project_name}-product-images" })
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
