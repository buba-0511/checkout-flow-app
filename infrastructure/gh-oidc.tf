# Lets GitHub Actions assume an AWS role via short-lived OIDC tokens —
# no long-lived AWS access keys stored as GitHub secrets.
#
# NOTE: if this AWS account already has a GitHub OIDC provider from a
# prior project, this resource will fail on "already exists" — the fix is
# `terraform import aws_iam_openid_connect_provider.github <arn>`, not a
# design change.
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = local.common_tags
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Both the plan-only PR runs (into dev) and the apply/deploy runs
    # (push to prod) need to assume this role — deploy-infra.yml runs
    # `terraform plan` on the former, `apply` only on the latter.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${split("/", var.github_repo)[0]}*/${split("/", var.github_repo)[1]}*:pull_request",
        "repo:${split("/", var.github_repo)[0]}*/${split("/", var.github_repo)[1]}*:ref:refs/heads/prod",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json

  tags = local.common_tags
}

# Broad, curated set of managed policies rather than a hand-scoped
# least-privilege policy — this role runs `terraform apply` for the whole
# stack (including creating IAM roles for ECS), which is inherently
# broad. Acceptable for a single-purpose demo/test AWS account; tightening
# this (resource-scoped ARNs, a permissions boundary) is a reasonable
# follow-up, not something this pass pretends to have already done.
locals {
  github_actions_managed_policies = [
    "arn:aws:iam::aws:policy/AmazonVPCFullAccess",
    "arn:aws:iam::aws:policy/AmazonRDSFullAccess",
    "arn:aws:iam::aws:policy/AmazonECS_FullAccess",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/CloudFrontFullAccess",
    "arn:aws:iam::aws:policy/SecretsManagerReadWrite",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/IAMFullAccess",
  ]
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  for_each = toset(local.github_actions_managed_policies)

  role       = aws_iam_role.github_actions.name
  policy_arn = each.value
}
