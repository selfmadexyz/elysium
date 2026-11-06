# Infrastructure

Terraform code for the services Elysium runs on. Each folder in `terraform/` is an independent stack with its own state, so a change to monitoring never plans against DNS or hosting.

| Stack | Manages |
| --- | --- |
| `terraform/betterstack` | Telemetry source receiving the app's OpenTelemetry logs and errors, uptime monitor on `/api/health` |
| `terraform/cloudflare` | Planned: DNS, Workers/hosting, R2 |

Environments are files, not workspaces: `envs/<environment>.tfvars` holds the settings and `envs/<environment>.s3.tfbackend` the state location. Add `staging` by copying both files and changing `environment` and the state `key`.

## Requirements

- Terraform `>= 1.10` (CI uses 1.17.0).
- A Cloudflare R2 bucket for state and an R2 API token with **Object Read & Write** on that bucket.
- Better Stack API tokens: **Telemetry** (logs) and **Uptime** (monitors), from Settings → API tokens.

## State on Cloudflare R2

State holds secrets, such as the Better Stack source token, so it never lives in Git. Create the bucket once:

```bash
bunx wrangler r2 bucket create elysium-terraform-state
```

Then replace `CLOUDFLARE_ACCOUNT_ID` in each `envs/*.s3.tfbackend`. Terraform's S3 backend reads the R2 token from the standard AWS variables. `use_lockfile` stores a lock object next to the state so two applies cannot run at once.

## Usage

Export credentials in your shell or a secret manager; never commit them:

```bash
export AWS_ACCESS_KEY_ID=<R2 access key ID>
export AWS_SECRET_ACCESS_KEY=<R2 secret access key>
export TF_VAR_telemetry_api_token=<Better Stack Telemetry token>
export TF_VAR_uptime_api_token=<Better Stack Uptime token>
```

```bash
cd infra/terraform/betterstack
terraform init -backend-config=envs/production.s3.tfbackend
terraform plan -var-file=envs/production.tfvars -out=production.tfplan
terraform apply production.tfplan
```

Copy the outputs into the app's runtime configuration:

```bash
terraform output -raw betterstack_ingesting_host   # BETTER_STACK_INGESTING_HOST
terraform output -raw betterstack_source_token     # BETTER_STACK_SOURCE_TOKEN
```

Set `app_url` in `envs/production.tfvars` once the app is deployed to create the uptime monitor. It checks `/api/health` for the `healthy` keyword every three minutes from Europe and the US, and warns 14 days before the TLS certificate expires.

### Importing existing resources

A source or monitor created by hand in Better Stack can be adopted instead of duplicated:

```bash
terraform import -var-file=envs/production.tfvars logtail_source.app <source ID>
```

Leave `data_region` at its default when importing; Better Stack reports the cluster name (for example `eu-nbg-2`) and the region cannot change after creation.

## Conventions

- Pin providers with `~>` in `versions.tf` and commit `.terraform.lock.hcl`. After an upgrade, refresh hashes for every platform:
  `terraform providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_amd64 -platform=darwin_arm64`.
- Mark secrets `sensitive` in variables and outputs. Supply them through `TF_VAR_*`, never `*.tfvars` files in Git.
- CI (`.github/workflows/infra.yml`) runs `fmt`, `init -backend=false` and `validate` for each stack. It has no cloud credentials and never plans or applies; apply from a trusted machine until a protected deployment workflow exists.
- Review every `plan` before `apply`. `platform` and `data_region` of the telemetry source force a replacement, which issues a new source token.

## Next steps

- Alert on error logs once real data shows the OpenTelemetry field names in Better Stack (`logtail_exploration` + `logtail_exploration_alert`).
- Add the `cloudflare` stack and move the state bucket under its management.
