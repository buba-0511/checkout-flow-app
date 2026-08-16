terraform {
  # Created by infrastructure/bootstrap/ — see that directory's README
  # comment. Bucket/table names must match its outputs exactly.
  backend "s3" {
    bucket         = "checkout-flow-app-terraform-state"
    key            = "checkout-flow-app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "checkout-flow-app-terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}
