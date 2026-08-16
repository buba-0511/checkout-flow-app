# Private bucket — no public access, no S3 "static website hosting" mode.
# CloudFront reaches it via Origin Access Control (OAC); the bucket policy
# granting that access lives in the cdn module, not here, since it needs
# the distribution's ARN (cdn depends on storage, not the other way).

# S3 bucket names are globally unique across every AWS account — the
# account id suffix avoids colliding with someone else's bucket already
# using the plain "${var.project_name}-frontend" name (hit this for real
# on first apply).
data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "static_site" {
  bucket = "${var.project_name}-frontend-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, { Name = "${var.project_name}-frontend" })
}

resource "aws_s3_bucket_public_access_block" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_site" {
  bucket = aws_s3_bucket.static_site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
