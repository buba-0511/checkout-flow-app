variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  description = "Both private subnets — the DB subnet group needs 2+ AZs even though the instance itself is single-AZ."
  type        = list(string)
}

variable "instance_class" {
  type = string
}

variable "allocated_storage" {
  type = number
}

variable "db_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
