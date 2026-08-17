variable "project_name" {
  type = string
}

variable "s3_bucket_id" {
  type = string
}

variable "s3_bucket_arn" {
  type = string
}

variable "s3_bucket_regional_domain_name" {
  type = string
}

variable "product_images_bucket_id" {
  type = string
}

variable "product_images_bucket_arn" {
  type = string
}

variable "product_images_bucket_regional_domain_name" {
  type = string
}

variable "alb_dns_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
