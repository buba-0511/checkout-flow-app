# No Route 53, no ACM — both distributions serve on their default
# *.cloudfront.net domain, which already carries a valid, trusted
# certificate with no extra setup (see project-domain-dns-decision).

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

# --- App distribution: S3 static site, via Origin Access Control ---

resource "aws_cloudfront_origin_access_control" "app" {
  name                              = "${var.project_name}-app-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "app" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = var.s3_bucket_regional_domain_name
    origin_id                = "s3-static-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.app.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-static-site"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # Client-side routing (react-router) — a direct hit on e.g. /products/abc
  # isn't a real S3 object, so serve index.html and let the SPA's router
  # take over instead of showing S3's 403/404.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = var.tags
}

resource "aws_s3_bucket_policy" "allow_cloudfront" {
  bucket = var.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontOAC"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${var.s3_bucket_arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.app.arn
        }
      }
    }]
  })
}

# --- API distribution: proxies the ALB, including websocket upgrades ---

resource "aws_cloudfront_distribution" "api" {
  enabled     = true
  price_class = "PriceClass_100"

  origin {
    domain_name = var.alb_dns_name
    origin_id   = "alb-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "alb-backend"
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
    # Forwards all headers (incl. Upgrade/Connection for the Socket.IO
    # gateway) and query strings through to the ALB.
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = var.tags
}
