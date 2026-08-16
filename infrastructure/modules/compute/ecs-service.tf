resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [var.ecs_subnet_id]
    security_groups  = [aws_security_group.ecs_task.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  # deploy-backend.yml redeploys via `--force-new-deployment` against the
  # task definition's :latest-tagged image — the task definition ARN
  # itself doesn't need to change for a routine image deploy, only when
  # this Terraform config changes (env vars, secrets, sizing).
  depends_on = [aws_lb_listener.http]

  tags = var.tags
}
