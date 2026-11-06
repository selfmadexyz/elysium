locals {
  name = "${var.project}-${var.environment}"
}

resource "logtail_source" "app" {
  name           = local.name
  platform       = "open_telemetry"
  data_region    = var.data_region
  logs_retention = var.logs_retention_days
}

resource "betteruptime_monitor_group" "app" {
  count = var.app_url == null ? 0 : 1

  name = local.name
}

resource "betteruptime_monitor" "health" {
  count = var.app_url == null ? 0 : 1

  url                = "${var.app_url}/api/health"
  pronounceable_name = "${var.project} ${var.environment} health"
  monitor_type       = "keyword"
  required_keyword   = "healthy"
  monitor_group_id   = betteruptime_monitor_group.app[0].id
  check_frequency    = var.uptime_check_frequency
  regions            = var.uptime_regions
  request_timeout    = 15
  verify_ssl         = true
  ssl_expiration     = 14
  email              = true
  push               = true
}
