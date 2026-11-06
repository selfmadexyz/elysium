output "betterstack_ingesting_host" {
  description = "Value for BETTER_STACK_INGESTING_HOST in the app runtime."
  value       = logtail_source.app.ingesting_host
}

output "betterstack_source_token" {
  description = "Value for BETTER_STACK_SOURCE_TOKEN in the app runtime."
  value       = logtail_source.app.token
  sensitive   = true
}

output "betterstack_table_name" {
  description = "Table name to use in Better Stack SQL queries and dashboards."
  value       = logtail_source.app.table_name
}

output "health_monitor_id" {
  description = "Uptime monitor checking /api/health, when app_url is set."
  value       = one(betteruptime_monitor.health[*].id)
}
