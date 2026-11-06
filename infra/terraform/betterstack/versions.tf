terraform {
  required_version = ">= 1.10.0"

  required_providers {
    logtail = {
      source  = "BetterStackHQ/logtail"
      version = "~> 11.4"
    }
    betteruptime = {
      source  = "BetterStackHQ/better-uptime"
      version = "~> 0.22"
    }
  }

  backend "s3" {}
}
