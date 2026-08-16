# Execution role only — pulls the image, writes logs, reads the two
# secrets referenced by the task definition. No separate task role: the
# app makes no other AWS API calls at runtime (confirmed — the MinIO/S3
# env vars in local docker-compose are dead code, nothing reads them).

data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${var.project_name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "secrets_read" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.database_url_secret_arn, var.payment_gateway_secret_arn]
  }
}

resource "aws_iam_role_policy" "secrets_read" {
  name   = "${var.project_name}-ecs-secrets-read"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.secrets_read.json
}
