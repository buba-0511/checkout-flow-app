output "static_site_bucket_id" {
  value = aws_s3_bucket.static_site.id
}

output "static_site_bucket_arn" {
  value = aws_s3_bucket.static_site.arn
}

output "static_site_bucket_regional_domain_name" {
  value = aws_s3_bucket.static_site.bucket_regional_domain_name
}

output "product_images_bucket_id" {
  value = aws_s3_bucket.product_images.id
}

output "product_images_bucket_arn" {
  value = aws_s3_bucket.product_images.arn
}

output "product_images_bucket_regional_domain_name" {
  value = aws_s3_bucket.product_images.bucket_regional_domain_name
}
