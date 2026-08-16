# The ECS task definition reads this via `secrets` (valueFrom) into
# DATABASE_URL — never a plaintext env var, and the composed connection
# string never appears in an output here, only its Secrets Manager ARN.
output "database_url_secret_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}

output "security_group_id" {
  value = aws_security_group.rds.id
}
