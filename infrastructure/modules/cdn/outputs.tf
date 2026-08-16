output "app_domain_name" {
  value = aws_cloudfront_distribution.app.domain_name
}

output "app_distribution_id" {
  value = aws_cloudfront_distribution.app.id
}

output "api_domain_name" {
  value = aws_cloudfront_distribution.api.domain_name
}
