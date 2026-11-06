provider "logtail" {
  api_token = var.telemetry_api_token
}

provider "betteruptime" {
  api_token = var.uptime_api_token
}
