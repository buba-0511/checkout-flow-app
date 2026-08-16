# ALB only accepts traffic that actually came through CloudFront (its
# managed prefix list), not the open internet directly — matches the
# project's existing OWASP-hardening posture (helmet, rate limiting, etc.).
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  description = "Only CloudFront may reach the ALB."
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from CloudFront only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project_name}-alb-sg" })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_task" {
  name_prefix = "${var.project_name}-ecs-task-"
  description = "Backend container - inbound only from the ALB."
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port from the ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.project_name}-ecs-task-sg" })

  lifecycle {
    create_before_destroy = true
  }
}
