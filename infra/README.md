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

Terraform's S3 backend reads the R2 endpoint and token from the standard AWS variables below, so `envs/*.s3.tfbackend` holds no account-specific value. `use_lockfile` stores a lock object next to the state so two applies cannot run at once.

R2 has no object versioning, so the apply workflow copies the current state to `backups/<stack>/<environment>/<timestamp>-<commit>.tfstate` in the same bucket before every apply. Add an R2 lifecycle rule on the `backups/` prefix (for example, delete after 90 days). To keep backups outside the state bucket, set the repository variable `TF_STATE_BACKUP_BUCKET`. To restore, download a backup and run `terraform state push <file>`.

## Usage

Export credentials in your shell or a secret manager; never commit them:

```bash
export AWS_ENDPOINT_URL_S3=https://<Cloudflare account ID>.r2.cloudflarestorage.com
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

## CI/CD

`.github/workflows/infra.yml` runs when `infra/**` changes:

| Event | Job | What it does |
| --- | --- | --- |
| Every PR and push | `validate` | `fmt -check`, `init -backend=false`, `validate`; no credentials |
| PR from this repository | `plan` | Plans each stack/environment without taking the state lock and posts or updates one PR comment per plan |
| Push to `main`, manual run | `apply` | Waits for approval, backs up the state, plans again and applies that plan |

Plans for PRs from forks are skipped because forks never receive secrets. The `plan` job skips with a notice until credentials exist, so CI stays green before setup.

### One-time GitHub setup

1. Settings → Environments → create **`infra-plan`** (no protection) and **`infra-production`**, with **Required reviewers** set to you and **Deployment branches** limited to `main`.
2. Add these secrets to **both** environments:
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`: an R2 API token with Object Read & Write on the state bucket.
   - `BETTERSTACK_TELEMETRY_API_TOKEN`, `BETTERSTACK_UPTIME_API_TOKEN`.
3. Add the repository variable `CLOUDFLARE_ACCOUNT_ID` (Settings → Secrets and variables → Actions → Variables).

Merging a PR that touches `infra/` then starts `apply`, which pauses until you approve it in the Actions tab. Read the plan comment on the PR before approving. The apply job re-plans on `main`, so changes made outside Terraform in the meantime also show up in its job summary. To apply without a code change, for example to fix drift, run the workflow manually from `main`.

Plan-time access is broad: anyone who can push a branch here can run code with the `infra-plan` secrets. Give those secrets read-only tokens once Better Stack and R2 offer suitable scopes, and keep write access to the repository restricted.

## Conventions

- Pin providers with `~>` in `versions.tf` and commit `.terraform.lock.hcl`. After an upgrade, refresh hashes for every platform:
  `terraform providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_amd64 -platform=darwin_arm64`.
- Mark secrets `sensitive` in variables and outputs. Supply them through `TF_VAR_*`, never `*.tfvars` files in Git.
- Review every `plan` before `apply`. `platform` and `data_region` of the telemetry source force a replacement, which issues a new source token.

## Next steps

- Add the new stack to the `matrix.stack` lists in `infra.yml` whenever a stack is added.

- Alert on error logs once real data shows the OpenTelemetry field names in Better Stack (`logtail_exploration` + `logtail_exploration_alert`).
- Add the `cloudflare` stack and move the state bucket under its management.
