# No inline ingress rule here — it would need the ECS task security
# group's id, and compute already depends on this module (for the
# database secret ARN), so a direct reference back would be a cycle. The
# ingress rule that actually opens 5432 to ECS is a standalone
# aws_security_group_rule in the root module instead, which can see both.
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  description = "Postgres - inbound rule attached separately, see root main.tf."
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project_name}-rds-sg" })

  lifecycle {
    create_before_destroy = true
  }
}
