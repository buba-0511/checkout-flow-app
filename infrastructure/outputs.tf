# Everything below this line needs to be copied into GitHub repo secrets
# manually after apply (Terraform has no GitHub admin access) — see the
# comment against each output for which secret it becomes.

# -> AWS_DEPLOY_ROLE_ARN
output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

# -> ECS_CLUSTER
output "ecs_cluster_name" {
  value = module.compute.ecs_cluster_name
}

# -> ECS_SERVICE
output "ecs_service_name" {
  value = module.compute.ecs_service_name
}

# -> FRONTEND_BUCKET
output "frontend_bucket" {
  value = module.storage.static_site_bucket_id
}

output "product_images_bucket" {
  value = module.storage.product_images_bucket_id
}

# -> CLOUDFRONT_DISTRIBUTION_ID (frontend cache invalidation)
output "cdn_app_distribution_id" {
  value = module.cdn.app_distribution_id
}

# -> BACKEND_URL (ZAP baseline scan target) and VITE_API_BASE_URL
# (frontend build-time env — see deploy-frontend.yml)
output "cdn_api_domain_name" {
  value = "https://${module.cdn.api_domain_name}"
}

# Frontend URL — not copied anywhere, just for checking the deploy worked.
output "cdn_app_domain_name" {
  value = "https://${module.cdn.app_domain_name}"
}

# ECR repo deploy-backend.yml pushes images to.
output "ecr_repository_url" {
  value = module.compute.ecr_repository_url
}

# Where to `aws secretsmanager put-secret-value` the real payment gateway
# sandbox keys after apply — see modules/secrets/main.tf's placeholder value.
output "payment_gateway_secret_arn" {
  value = module.secrets.payment_gateway_secret_arn
}
