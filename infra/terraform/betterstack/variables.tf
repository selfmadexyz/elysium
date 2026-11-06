variable "telemetry_api_token" {
  description = "Better Stack Telemetry API token (Settings → API tokens → Telemetry)."
  type        = string
  sensitive   = true
}

variable "uptime_api_token" {
  description = "Better Stack Uptime API token (Settings → API tokens → Uptime)."
  type        = string
  sensitive   = true
}

variable "project" {
  description = "Project name used as a prefix for every Better Stack resource."
  type        = string
  default     = "elysium"
}

variable "environment" {
  description = "Deployment environment, such as production or staging."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.environment))
    error_message = "Use lowercase letters, digits and dashes."
  }
}

variable "data_region" {
  description = "Telemetry data region: us_west, germany or singapore. Fixed once the source exists."
  type        = string
  default     = "germany"
}

variable "logs_retention_days" {
  description = "Log retention in days; longer retention can cost extra."
  type        = number
  default     = 30
}

variable "app_url" {
  description = "Public HTTPS origin of the deployed app. Leave null until the app is deployed to skip uptime monitoring."
  type        = string
  default     = null

  validation {
    condition     = var.app_url == null || can(regex("^https://[^/]+$", var.app_url))
    error_message = "Use an https origin without a trailing slash, such as https://app.example.com."
  }
}

variable "uptime_check_frequency" {
  description = "Seconds between health checks."
  type        = number
  default     = 180
}

variable "uptime_regions" {
  description = "Regions that run the health check: us, eu, as, au."
  type        = list(string)
  default     = ["eu", "us"]
}
