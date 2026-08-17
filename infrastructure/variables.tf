variable "project_name" {
  description = "Short name used to prefix/tag every resource this config creates."
  type        = string
  default     = "checkout-flow"
}

variable "github_repo" {
  description = "owner/repo — scopes the GitHub Actions OIDC trust policy to this repo only."
  type        = string
  default     = "buba-0511/checkout-flow-app"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Two public subnets (one per AZ) — the ALB requires at least two AZs even though everything else here is single-AZ."
  type        = list(string)
  default     = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Two private subnets (one per AZ) — RDS's DB subnet group requires 2+ AZs even for a single-AZ instance. ECS tasks only ever run in the first one; the second exists purely to satisfy that AWS constraint (see project-ecs-over-apprunner-decision for the single-AZ compute/DB rationale)."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage, in GB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name inside the RDS instance."
  type        = string
  default     = "checkout"
}

variable "backend_image_tag" {
  description = "Image tag the ECS task definition starts on — deploy-backend.yml moves the service to newer tags afterward via force-new-deployment against :latest."
  type        = string
  default     = "latest"
}

variable "fargate_cpu" {
  description = "Fargate task vCPU units (256 = 0.25 vCPU) — this is a demo workload, not production traffic."
  type        = number
  default     = 256
}

variable "fargate_memory" {
  description = "Fargate task memory, in MB."
  type        = number
  default     = 512
}

variable "cors_origin" {
  description = <<-EOT
    Origin the backend accepts CORS requests from. The ALB<->CloudFront
    relationship is circular (compute needs cdn's app-distribution domain
    for CORS; cdn needs compute's ALB DNS for its api-distribution origin),
    so this can't be wired as a cross-module reference without Terraform
    refusing the graph as a cycle.
  EOT
  type        = string
  default     = "https://d1vdwx1cui511h.cloudfront.net"
}

variable "product_images_base_url" {
  description = <<-EOT
    Browser-facing base URL the seeder prepends to each product's bag
    image filename. Same cross-module cycle problem as cors_origin (this
    is served off the app CloudFront distribution's own domain), so it's
    a plain variable with the known-stable domain hardcoded as the
    default rather than a cross-module reference.
  EOT
  type        = string
  default     = "https://d1vdwx1cui511h.cloudfront.net/product-images"
}
