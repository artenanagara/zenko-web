# Staging setup

Staging reuses the same VPS as production (`103.89.5.73` / `zenkoedu.id`) —
separate ports, separate database, separate Duitku environment (sandbox),
so it can never touch real data or real payments.

| | Production | Staging |
|---|---|---|
| Domain | `zenkoedu.id` | `staging.zenkoedu.id` |
| API port | 8080 | 8081 |
| Web port | 3000 | 3001 |
| API env file | `/etc/zenko/api.env` | `/etc/zenko/api-staging.env` |
| Web env file | `/etc/zenko/web.env` | `/etc/zenko/web-staging.env` |
| Database | `zenko` | `zenko_staging` |
| Payment gateway | Duitku live (`DUITKU_PRODUCTION=true`) | Duitku sandbox (`DUITKU_PRODUCTION=false`) |
| Deploy branch | `main` | `staging` |
| systemd units | `zenko-api.service`, `zenko-web.service` | `zenko-api-staging.service`, `zenko-web-staging.service` |

Do the steps below in order — step 2a (getting the SSL cert) must happen
before step 2f (reloading Nginx with the staging server block), or
`nginx -t` will fail on a certificate path that doesn't exist yet.

Two different SSH identities are involved: your own admin/sudo account does
everything below manually; the `zenko-deploy` account is CI-only and is
restricted by sudoers to running the deploy wrapper scripts — never use it
for the manual setup steps.

## 1. DNS

1. Log into wherever `zenkoedu.id`'s DNS is managed.
2. Add an `A` record: name `staging`, value `103.89.5.73` (same IP as the
   existing root `A` record), default TTL.
3. If DNS is behind Cloudflare, set this record's proxy status to **DNS
   only** (grey cloud) — a proxied record breaks the certbot HTTP-01
   challenge, which needs to reach the VPS directly.
4. Wait for propagation, then confirm from your local machine:
   ```
   dig +short staging.zenkoedu.id
   ```
   Proceed once that prints `103.89.5.73`.

## 2. Server

SSH in with your own admin account: `ssh <you>@103.89.5.73`.

**2a. Get the SSL certificate first.** Production Nginx already has a
`default_server` block on port 80 that answers the ACME HTTP-01 challenge
for any hostname pointed at this server, so the cert can be issued before
any staging-specific Nginx config exists:
```
sudo certbot certonly --webroot -w /var/www/letsencrypt -d staging.zenkoedu.id
```

**2b. Create the staging database** (separate from production, same
Postgres instance):
```
sudo -u postgres createdb -O zenko zenko_staging
```

**2c. Copy the deploy files onto the server.** From your local machine, in
each repo's checkout:
```
scp zenko-api/deploy/zenko-api-staging.service <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko-web-staging.service <you>@103.89.5.73:/tmp/
scp zenko-api/deploy/deploy-api-staging.sh     <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/deploy-web-staging.sh     <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko.nginx               <you>@103.89.5.73:/tmp/
scp zenko-web/deploy/zenko-deploy.sudoers      <you>@103.89.5.73:/tmp/
```
Then on the server, move each into place:
```
sudo mv /tmp/zenko-api-staging.service /etc/systemd/system/
sudo mv /tmp/zenko-web-staging.service /etc/systemd/system/

sudo mv /tmp/deploy-api-staging.sh /usr/local/sbin/zenko-deploy-api-staging
sudo mv /tmp/deploy-web-staging.sh /usr/local/sbin/zenko-deploy-web-staging
sudo chmod 0755 /usr/local/sbin/zenko-deploy-api-staging /usr/local/sbin/zenko-deploy-web-staging

sudo visudo -c -f /tmp/zenko-deploy.sudoers
sudo mv /tmp/zenko-deploy.sudoers /etc/sudoers.d/zenko-deploy

sudo cp /etc/nginx/sites-available/zenko.nginx /etc/nginx/sites-available/zenko.nginx.bak
sudo mv /tmp/zenko.nginx /etc/nginx/sites-available/zenko.nginx
```
Adjust the Nginx path above if it's not actually installed at
`sites-available/zenko.nginx` on your server — check with
`sudo nginx -T | grep 'configuration file'` if unsure.

**2d. Write the env files**, using
[`zenko-api/.env.staging.example`](../../zenko-api/.env.staging.example) and
[`zenko-web/.env.staging.example`](../.env.staging.example) as templates:
```
sudo install -d -m 0750 -o root -g zenko /etc/zenko
sudo nano /etc/zenko/api-staging.env
sudo nano /etc/zenko/web-staging.env
sudo chmod 0640 /etc/zenko/api-staging.env /etc/zenko/web-staging.env
sudo chown root:zenko /etc/zenko/api-staging.env /etc/zenko/web-staging.env
```
Put the **sandbox** Duitku credentials in `api-staging.env` — merchant code
and API key from the sandbox dashboard at
[sandbox.duitku.com](https://sandbox.duitku.com), with
`DUITKU_PRODUCTION=false` so requests go to the sandbox host. Production
credentials belong to a different environment entirely and will fail every
sandbox request.

`DUITKU_QRIS_METHOD_CODE` is the payment method code your own sandbox
merchant account uses for QRIS — read it off that dashboard's Payment Method
list. It varies per account depending on which channels are enabled, so
there is no default to copy. Leaving it (or either credential) empty is not
an error: the API still runs, `POST /orders` creates pending orders with no
QR attached, and checkout says the payment is not connected instead of
pretending a charge exists.

Also set `API_PUBLIC_URL=https://staging.zenkoedu.id`. Duitku takes a
`callbackUrl` on every charge request rather than reading one URL configured
on its dashboard, so the API builds its own callback from this value — point
it at localhost and Duitku can never deliver a settlement notification.

**2e. Register the systemd units** without starting them yet — there is no
binary at `/opt/zenko/api-staging/current` until the first deploy runs
(step 3):
```
sudo systemctl daemon-reload
sudo systemctl enable zenko-api-staging.service zenko-web-staging.service
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
   Environments → New environment**, named exactly `staging`.
2. Add the same four secrets as the `production` environment (check its
   secret names under **Settings → Secrets and variables → Actions** — the
   values can be identical, since it's the same VPS): `VPS_HOST`,
   `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`.
3. Create and push a `staging` branch in each repo:
   ```
   git checkout -b staging
   git push -u origin staging
   ```
4. That push triggers `.github/workflows/deploy-staging.yml`, which builds,
   uploads, and runs `zenko-deploy-api-staging` / `zenko-deploy-web-staging`
   on the server via the sudoers entry from step 2c — the first real deploy,
   which creates the release directory and starts the service.
5. Watch the **Actions** tab for the run. Once both repos have deployed
   successfully:
   ```
   sudo systemctl status zenko-api-staging zenko-web-staging
   ```
   should show both `active (running)`, and `https://staging.zenkoedu.id`
   should serve the app.

## Testing a payment

1. Open `https://staging.zenkoedu.id`, sign in, and go through checkout for
   any product — this hits `POST /orders`, which charges QRIS through
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
account. A first staging payment that fails at the HTTP layer is the most
likely place that TODO comes due.
