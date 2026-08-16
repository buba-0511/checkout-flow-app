# Single-AZ, matches the local postgres:16-alpine engine version — see
# project-ecs-over-apprunner-decision for why this deploy is deliberately
# single-AZ (cost trade-off, not an oversight).

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = var.tags
}

# The app reads a single DATABASE_URL connection string (app.module.ts),
# not separate host/user/password vars — RDS's native
# manage_master_user_password only stores {username, password} as
# separate JSON keys, which ECS's `secrets` (valueFrom) can't compose into
# one URL. Generating the password ourselves lets us build and store the
# full connection string below instead.
resource "random_password" "master" {
  length  = 32
  special = false
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = "checkout_admin"
  password = random_password.master.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  # Demo/test environment — avoid terraform destroy being blocked on either.
  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(var.tags, { Name = "${var.project_name}-db" })
}

resource "aws_secretsmanager_secret" "database_url" {
  name        = "${var.project_name}/database-url"
  description = "Full Postgres connection string for the backend's DATABASE_URL env var."

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "postgresql://${aws_db_instance.main.username}:${random_password.master.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
}
