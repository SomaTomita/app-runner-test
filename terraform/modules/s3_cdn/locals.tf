locals {
  is_https                = startswith(var.backend_url, "https://")
  backend_origin_domain   = replace(replace(var.backend_url, "https://", ""), "http://", "")
  backend_origin_protocol = local.is_https ? "https-only" : "http-only"
}
