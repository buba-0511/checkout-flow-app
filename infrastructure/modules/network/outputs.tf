output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

# ECS tasks are placed only here — single-AZ compute by design, even though
# the DB subnet group (which needs 2+ AZs) uses both private subnets.
output "ecs_subnet_id" {
  value = aws_subnet.private[0].id
}
