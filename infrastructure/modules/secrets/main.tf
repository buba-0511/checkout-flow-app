# Placeholder value on purpose — the real payment gateway sandbox keys
# are set manually via `aws secretsmanager put-secret-value` after apply,
# same trust model as the gitignored .env locally. `ignore_changes` keeps
# later `terraform apply` runs from clobbering that manual update.

resource "aws_secretsmanager_secret" "payment_gateway" {
  name        = "${var.project_name}/payment-gateway"
  description = "Payment gateway sandbox keys - populated manually after apply, never via Terraform state."

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "payment_gateway" {
  secret_id = aws_secretsmanager_secret.payment_gateway.id
  secret_string = jsonencode({
    PAYMENT_GATEWAY_API_URL       = "REPLACE_ME"
    PAYMENT_GATEWAY_PUBLIC_KEY    = "REPLACE_ME"
    PAYMENT_GATEWAY_PRIVATE_KEY   = "REPLACE_ME"
    PAYMENT_GATEWAY_EVENTS_KEY    = "REPLACE_ME"
    PAYMENT_GATEWAY_INTEGRITY_KEY = "REPLACE_ME"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
