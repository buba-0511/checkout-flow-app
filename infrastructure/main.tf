module "network" {
  source = "./modules/network"

  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  tags                 = local.common_tags
}

module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  tags         = local.common_tags
}

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  tags         = local.common_tags
}

module "compute" {
  source = "./modules/compute"

  project_name      = var.project_name
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  ecs_subnet_id     = module.network.ecs_subnet_id
  fargate_cpu       = var.fargate_cpu
  fargate_memory    = var.fargate_memory
  backend_image_tag = var.backend_image_tag
  cors_origin       = var.cors_origin

  database_url_secret_arn    = module.database.database_url_secret_arn
  payment_gateway_secret_arn = module.secrets.payment_gateway_secret_arn

  tags = local.common_tags
}

module "database" {
  source = "./modules/database"

  project_name       = var.project_name
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  instance_class     = var.db_instance_class
  allocated_storage  = var.db_allocated_storage
  db_name            = var.db_name
  tags               = local.common_tags
}

# Standalone, not inside either module — compute needs database's secret
# ARN and database needs compute's SG id, so this rule can't live inside
# either module without creating a cycle between them.
resource "aws_security_group_rule" "rds_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = module.database.security_group_id
  source_security_group_id = module.compute.ecs_task_security_group_id
  description              = "Postgres from ECS tasks"
}

module "cdn" {
  source = "./modules/cdn"

  project_name                   = var.project_name
  s3_bucket_id                   = module.storage.bucket_id
  s3_bucket_arn                  = module.storage.bucket_arn
  s3_bucket_regional_domain_name = module.storage.bucket_regional_domain_name
  alb_dns_name                   = module.compute.alb_dns_name
  tags                           = local.common_tags
}
