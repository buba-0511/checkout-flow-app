resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.execution.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      # No SSL_CERT_PATH/SSL_KEY_PATH — the ALB/CloudFront terminate TLS,
      # this container speaks plain HTTP behind them (see README's
      # production topology).
      environment = [
        { name = "PORT", value = "3000" },
        { name = "NODE_ENV", value = "production" },
        { name = "CORS_ORIGIN", value = var.cors_origin },
        { name = "PRODUCT_IMAGES_BASE_URL", value = var.product_images_base_url },
      ]

      secrets = [
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arn },
        { name = "PAYMENT_GATEWAY_API_URL", valueFrom = "${var.payment_gateway_secret_arn}:PAYMENT_GATEWAY_API_URL::" },
        { name = "PAYMENT_GATEWAY_PUBLIC_KEY", valueFrom = "${var.payment_gateway_secret_arn}:PAYMENT_GATEWAY_PUBLIC_KEY::" },
        { name = "PAYMENT_GATEWAY_PRIVATE_KEY", valueFrom = "${var.payment_gateway_secret_arn}:PAYMENT_GATEWAY_PRIVATE_KEY::" },
        { name = "PAYMENT_GATEWAY_EVENTS_KEY", valueFrom = "${var.payment_gateway_secret_arn}:PAYMENT_GATEWAY_EVENTS_KEY::" },
        { name = "PAYMENT_GATEWAY_INTEGRITY_KEY", valueFrom = "${var.payment_gateway_secret_arn}:PAYMENT_GATEWAY_INTEGRITY_KEY::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "backend"
        }
      }
    }
  ])

  tags = var.tags
}
