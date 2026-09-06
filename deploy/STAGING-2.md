# Staging-2 setup

Staging-2 reuses the same VPS as production and the primary staging
environment (`103.89.5.73` / `zenkoedu.id`) — separate ports, separate
database, separate Duitku environment (sandbox), so it can never touch real
data, real payments, or the primary staging environment. It exists to
preview the `feat/bimbel` branch independently, so the primary `staging`
environment stays stable while that work is validated.

| | Production | Staging | Staging-2 |
|---|---|---|---|
| Domain | `zenkoedu.id` | `staging.zenkoedu.id` | `staging-2.zenkoedu.id` |
| API port | 8080 | 8081 | 8082 |
| Web port | 3000 | 3001 | 3003 |
| API env file | `/etc/zenko/api.env` | `/etc/zenko/api-staging.env` | `/etc/zenko/api-staging2.env` |
| Web env file | `/etc/zenko/web.env` | `/etc/zenko/web-staging.env` | `/etc/zenko/web-staging2.env` |
| Database | `zenko` | `zenko_staging` | `zenko_staging2` |
| Payment gateway | Duitku live (`DUITKU_PRODUCTION=true`) | Duitku sandbox (`DUITKU_PRODUCTION=false`) | Duitku sandbox (`DUITKU_PRODUCTION=false`) |
| Deploy branch | `main` | `staging` | `staging-2` |
| systemd units | `zenko-api.service`, `zenko-web.service` | `zenko-api-staging.service`, `zenko-web-staging.service` | `zenko-api-staging2.service`, `zenko-web-staging2.service` |

Do the steps below in order — step 2a (getting the SSL cert) must happen
before step 2f (reloading Nginx with the staging-2 server block), or
`nginx -t` will fail on a certificate path that doesn't exist yet.

Two different SSH identities are involved: your own admin/sudo account does
everything below manually; the `zenko-deploy` account is CI-only and is
restricted by sudoers to running the deploy wrapper scripts — never use it
for the manual setup steps.

## 1. DNS

1. Log into wherever `zenkoedu.id`'s DNS is managed.
2. Add an `A` record: name `staging-2`, value `103.89.5.73` (same IP as the
   existing root `A` record), default TTL.
3. If DNS is behind Cloudflare, set this record's proxy status to **DNS
   only** (grey cloud) — a proxied record breaks the certbot HTTP-01
   challenge, which needs to reach the VPS directly.
4. Wait for propagation, then confirm from your local machine:
   ```
   dig +short staging-2.zenkoedu.id
   ```
   Proceed once that prints `103.89.5.73`.

## 2. Server

SSH in with your own admin account: `ssh <you>@103.89.5.73`.

**2a. Get the SSL certificate first.** Production Nginx already has a
`default_server` block on port 80 that answers the ACME HTTP-01 challenge
for any hostname pointed at this server, so the cert can be issued before
any staging-2-specific Nginx config exists:
```
sudo certbot certonly --webroot -w /var/www/letsencrypt -d staging-2.zenkoedu.id
```

**2b. Create the staging-2 database** (separate from production and from
the primary staging database, same Postgres instance):
```
sudo -u postgres createdb -O zenko zenko_staging2
```

**2c. Copy the deploy files onto the server.** From your local machine, in
each repo's checkout:
```
scp zenko-api/deploy/zenko-api-staging2.service <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko-web-staging2.service <you>@103.89.5.73:/tmp/
scp zenko-api/deploy/deploy-api-staging2.sh     <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/deploy-web-staging2.sh     <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko.nginx                <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko-deploy.sudoers       <you>@103.89.5.73:/tmp/
```
Then on the server, move each into place:
```
sudo mv /tmp/zenko-api-staging2.service /etc/systemd/system/
sudo mv /tmp/zenko-web-staging2.service /etc/systemd/system/

sudo mv /tmp/deploy-api-staging2.sh /usr/local/sbin/zenko-deploy-api-staging2
sudo mv /tmp/deploy-web-staging2.sh /usr/local/sbin/zenko-deploy-web-staging2
sudo chmod 0755 /usr/local/sbin/zenko-deploy-api-staging2 /usr/local/sbin/zenko-deploy-web-staging2

sudo visudo -c -f /tmp/zenko-deploy.sudoers
sudo mv /tmp/zenko-deploy.sudoers /etc/sudoers.d/zenko-deploy

sudo cp /etc/nginx/sites-available/zenko.nginx /etc/nginx/sites-available/zenko.nginx.bak
sudo mv /tmp/zenko.nginx /etc/nginx/sites-available/zenko.nginx
```
Adjust the Nginx path above if it's not actually installed at
`sites-available/zenko.nginx` on your server — check with
`sudo nginx -T | grep 'configuration file'` if unsure. The `zenko.nginx` and
`zenko-deploy.sudoers` files here already carry the primary `staging` and
production config unchanged, plus the new staging-2 additions — this
overwrite does not remove or alter anything for those environments.

**2d. Write the env files**, using
[`zenko-api/.env.staging.example`](../../zenko-api/.env.staging.example) and
[`zenko-web/.env.staging.example`](../.env.staging.example) as templates
(same templates the primary staging environment uses):
```
sudo install -d -m 0750 -o root -g zenko /etc/zenko
sudo nano /etc/zenko/api-staging2.env
sudo nano /etc/zenko/web-staging2.env
sudo chmod 0640 /etc/zenko/api-staging2.env /etc/zenko/web-staging2.env
sudo chown root:zenko /etc/zenko/api-staging2.env /etc/zenko/web-staging2.env
```
Put the **sandbox** Duitku credentials in `api-staging2.env` — merchant code
and API key from the sandbox dashboard at
[sandbox.duitku.com](https://sandbox.duitku.com), with
`DUITKU_PRODUCTION=false` so requests go to the sandbox host. Production
credentials belong to a different environment entirely and will fail every
sandbox request. Reusing the same sandbox merchant account as the primary
staging environment is fine — sandbox charges from staging-2 don't collide
with staging's, since each environment tracks its own orders in its own
database.

`DUITKU_QRIS_METHOD_CODE` is the payment method code your own sandbox
merchant account uses for QRIS — read it off that dashboard's Payment Method
list. It varies per account depending on which channels are enabled, so
there is no default to copy. Leaving it (or either credential) empty is not
an error: the API still runs, `POST /orders` creates pending orders with no
QR attached, and checkout says the payment is not connected instead of
pretending a charge exists.

Also set `API_PUBLIC_URL=https://staging-2.zenkoedu.id`. Duitku takes a
`callbackUrl` on every charge request rather than reading one URL configured
on its dashboard, so the API builds its own callback from this value — point
it at localhost (or at staging's URL) and Duitku can never deliver a
settlement notification to this environment.

**2e. Register the systemd units** without starting them yet — there is no
binary at `/opt/zenko/api-staging2/current` until the first deploy runs
(step 3):
```
sudo systemctl daemon-reload
sudo systemctl enable zenko-api-staging2.service zenko-web-staging2.service
```

**2f. Activate the Nginx config**:
```
sudo nginx -t
```
Only if that succeeds:
```
sudo systemctl reload nginx
```
If `nginx -t` fails, do not reload — read the error (usually a missing
certificate path from skipping 2a, or an incomplete file copy from 2c).

## 3. GitHub

1. In **both** `zenko-api` and `zenko-web` repos on GitHub: **Settings →
   Environments → New environment**, named exactly `staging-2`.
2. Add the same four secrets as the `staging` environment (check its secret
   names under **Settings → Secrets and variables → Actions** — the values
   can be identical, since it's the same VPS): `VPS_HOST`, `VPS_USER`,
   `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
3. Unlike the primary staging setup, do **not** push an empty `staging-2`
   branch to trigger a first deploy yet. The `staging-2` branch created by
   this infra work carries only the deploy/config files above — no
   application code differs from `staging` yet. The intended flow is: once
   this infra is live (DNS, certs, systemd units, Nginx all in place per
   steps 1–2), merge `feat/bimbel` into `staging-2` locally and push that —
   that push is what should trigger the first real deploy via
   `.github/workflows/deploy-staging2.yml`, so the first thing staging-2
   ever serves is the bimbel feature it was created to preview.
4. That push triggers `.github/workflows/deploy-staging2.yml`, which builds,
   uploads, and runs `zenko-deploy-api-staging2` / `zenko-deploy-web-staging2`
   on the server via the sudoers entry from step 2c — the first real deploy,
   which creates the release directory and starts the service.
5. Watch the **Actions** tab for the run. Once both repos have deployed
   successfully:
   ```
   sudo systemctl status zenko-api-staging2 zenko-web-staging2
   ```
   should show both `active (running)`, and `https://staging-2.zenkoedu.id`
   should serve the app.

## Testing a payment

1. Open `https://staging-2.zenkoedu.id`, sign in, and go through checkout
   for any product — this hits `POST /orders`, which charges QRIS through
   Duitku sandbox and returns a QR payload. Unlike Midtrans, Duitku returns
   the raw QRIS string rather than a hosted image; `/pembayaran/:invoice`
   renders it into a scannable code in the browser, so a blank QR box there
   means the payload never arrived, not that image loading failed.
2. There is no notification URL to configure on the dashboard. The API sends
   `callbackUrl: {API_PUBLIC_URL}/api/v1/payments/duitku/notification` with
   every charge, so getting `API_PUBLIC_URL` right in step 2d is what makes
   settlement reach this deployment.
3. Simulate the payment from the sandbox dashboard
   ([sandbox.duitku.com](https://sandbox.duitku.com)). QRIS is not always
   enabled on a fresh sandbox account — if it is missing from the payment
   options there, request activation from `support@duitku.com` before
   testing. See
   [knowledge.duitku.com](https://knowledge.duitku.com/bagaimana-cara-melakukan-testing-pembayaran-qris)
   for the current simulation steps.
4. Duitku retries a callback up to 5 times until it gets an HTTP 200, then
   emails a failure notice; the dashboard's **Report** menu can resend one
   manually. If settlement is slow to land, the order is not lost — the API
   also reconciles pending charges by polling Duitku's transaction status.

Note: `internal/payment/duitku.go` carries a `TODO(duitku)` on the sandbox
and production hostnames and endpoint paths — they were written from the
integration's shape rather than verified end-to-end against a live sandbox
account. A first staging-2 payment that fails at the HTTP layer is the most
likely place that TODO comes due.
