# Deploying API to Fly.io

This guide covers deploying the innozverse API to Fly.io.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI tool

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

3. **Authenticate**:
```bash
fly auth login
```

## First-Time Deployment

### 1. Navigate to API Directory

```bash
cd apps/api
```

### 2. Launch App (First Time Only)

```bash
fly launch
```

This will:
- Read your `fly.toml` configuration
- Prompt you to choose a region (select closest to your users)
- Ask about PostgreSQL and Redis (choose "No" for now)
- Create the app on Fly.io

**Important**: When prompted, answer:
- App name: Use `innozverse-api` or choose your own
- Region: Select one (e.g., `sjc` for San Jose)
- PostgreSQL: No (for now)
- Redis: No (for now)
- Deploy now: Yes

### 3. Set Environment Variables

```bash
fly secrets set API_VERSION=1.0.0
fly secrets set NODE_ENV=production
```

### 4. Deploy

If you chose not to deploy during `fly launch`, deploy manually:

```bash
fly deploy
```

## Subsequent Deployments

For updates after the initial deployment:

```bash
cd apps/api
fly deploy
```

That's it! Fly.io will:
1. Build the Docker image
2. Deploy to your app
3. Run health checks
4. Route traffic to the new version

## Viewing Your Deployment

### Check App Status
```bash
fly status
```

### View Logs
```bash
fly logs
```

### Open in Browser
```bash
fly open
```

### Check Health Endpoint
```bash
curl https://innozverse-api.fly.dev/health
```

## Configuration

### fly.toml Overview

The `apps/api/fly.toml` file configures your deployment:

```toml
app = "innozverse-api"          # Your app name
primary_region = "sjc"          # Primary region

[http_service]
  internal_port = 8080          # Port your app listens on
  force_https = true            # Redirect HTTP to HTTPS
  auto_stop_machines = true     # Stop when idle
  auto_start_machines = true    # Start on request
  min_machines_running = 0      # Allow scaling to zero

[[services.http_checks]]
  path = "/health"              # Health check endpoint
  interval = "30s"
  timeout = "5s"
```

### Scaling Configuration

**Scale to multiple regions:**
```bash
fly scale count 2 --region sjc,ord
```

**Scale machine size:**
```bash
fly scale vm shared-cpu-1x --memory 512
```

**Always-on (no auto-stop):**
```bash
fly scale count 1 --max-per-region 1
```

## Environment Variables

### Set Secrets
```bash
fly secrets set KEY=value
```

### List Secrets
```bash
fly secrets list
```

### Unset Secrets
```bash
fly secrets unset KEY
```

### Common Secrets for innozverse
```bash
fly secrets set API_VERSION=1.0.0
fly secrets set CORS_ORIGIN=https://yourdomain.com
fly secrets set DATABASE_URL=postgresql://...  # When you add a database
```

## Monitoring

### View Metrics
```bash
fly dashboard
```

Or visit: https://fly.io/dashboard

### Real-time Logs
```bash
fly logs -a innozverse-api
```

### SSH into Machine
```bash
fly ssh console
```

## Custom Domains

### Add a Custom Domain

1. **Add domain to Fly**:
```bash
fly certs add api.yourdomain.com
```

2. **Add DNS records** (provided by Fly):
```
A     @    your-fly-ip
AAAA  @    your-fly-ipv6
```

3. **Verify**:
```bash
fly certs show api.yourdomain.com
```

### Update CORS Origin
```bash
fly secrets set CORS_ORIGIN=https://yourdomain.com
```

## Troubleshooting

### Deployment Fails

**Check logs during deployment:**
```bash
fly logs
```

**Common issues:**
- Build errors: Check Dockerfile and dependencies
- Port mismatch: Ensure `PORT=8080` in environment
- Health check fails: Verify `/health` endpoint works locally

### App Not Starting

**SSH into machine:**
```bash
fly ssh console
```

**Check running processes:**
```bash
ps aux
```

**Manually start app:**
```bash
node /app/dist/index.js
```

### High Memory Usage

**Check current usage:**
```bash
fly status
```

**Scale up memory:**
```bash
fly scale memory 1024
```

### Connection Issues

**Verify health check:**
```bash
curl https://innozverse-api.fly.dev/health
```

**Check machine status:**
```bash
fly status --all
```

**Restart app:**
```bash
fly apps restart innozverse-api
```

## Database Integration

When you're ready to add a database:

### Create PostgreSQL Database
```bash
fly postgres create
```

### Attach to Your App
```bash
fly postgres attach your-postgres-app-name
```

This automatically sets `DATABASE_URL` environment variable.

## Cost Optimization

### Free Tier Limits
- 3 shared-cpu-1x VMs with 256MB RAM
- 160GB outbound data transfer
- Auto-stop/start helps stay within free tier

### Optimize for Free Tier
```bash
# Scale to zero when idle
fly scale count 0 --min-machines-running 0

# Use smallest machine
fly scale vm shared-cpu-1x --memory 256
```

### Monitor Usage
Check usage at: https://fly.io/dashboard/personal/billing

## CI/CD Integration

### GitHub Actions Example

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'

jobs:
  deploy:
    name: Deploy API
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        working-directory: ./apps/api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Get API Token
```bash
fly auth token
```

Add token as `FLY_API_TOKEN` in GitHub repository secrets.

## Backup Strategy

### Database Backups (when using Postgres)
Fly automatically backs up Postgres daily. Manual backup:

```bash
fly postgres backup create
```

### Application State
Since the API is stateless, no application backup needed. All state should be in the database.

## Rollback

### View Releases
```bash
fly releases
```

### Rollback to Previous Version
```bash
fly releases rollback
```

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Fly.io Status](https://status.fly.io/)
- [Fly.io Community](https://community.fly.io/)

## Support

- Fly.io Community Forum: https://community.fly.io/
- innozverse Issues: Create an issue in the repository
