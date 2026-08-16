output "payment_gateway_secret_arn" {
  value = aws_secretsmanager_secret.payment_gateway.arn
}
