variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  description = "ALB's subnets — needs 2+ AZs."
  type        = list(string)
}

variable "ecs_subnet_id" {
  description = "Single private subnet ECS tasks run in."
  type        = string
}

variable "fargate_cpu" {
  type = number
}

variable "fargate_memory" {
  type = number
}

variable "backend_image_tag" {
  type = string
}

variable "cors_origin" {
  type = string
}

variable "database_url_secret_arn" {
  description = "Secrets Manager ARN of the full DATABASE_URL connection string."
  type        = string
}

variable "payment_gateway_secret_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
