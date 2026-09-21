# Staging setup

Staging reuses the same VPS as production (`103.89.5.73` / `zenkoedu.id`) —
separate ports, separate database, so it can never touch real data.

| | Production | Staging |
|---|---|---|
| Domain | `zenkoedu.id` | `staging.zenkoedu.id` |
| API port | 8080 | 8081 |
| Web port | 3000 | 3001 |
| API env file | `/etc/zenko/api.env` | `/etc/zenko/api-staging.env` |
| Web env file | `/etc/zenko/web.env` | `/etc/zenko/web-staging.env` |
| Database | `zenko` | `zenko_staging` |
| Payment | Manual QRIS, verified by an admin | Manual QRIS, verified by an admin |
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
There are no payment gateway credentials to set: orders are paid by transfer
to Zenko's static QRIS poster and verified by an admin. The manual settings
(`MANUAL_QRIS_*`) all have working defaults — see `zenko-api/.env.example`.

Also set `API_PUBLIC_URL=https://staging.zenkoedu.id`, which the image
upload endpoint uses to build the URLs it returns.

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
   any priced product — this hits `POST /orders`, which creates a pending
   order with a three-digit unique code added to the amount. Set
   `NUXT_PUBLIC_PAYMENT_ENABLED=true` in `web-staging.env` first, or the
   checkout page says payment is not connected instead of placing one.
2. `/pembayaran/:invoice` shows the static QRIS poster, the amount to
   transfer (unique code included) and the receipt upload. Upload any image
   as the receipt; the order moves to `verifying`.
3. Sign in as an admin, open **Dashboard → Pembayaran**, and approve or
   reject the receipt. Approving marks the order paid, grants the package,
   and credits the tutor's sale share; rejecting returns the order to the
   buyer with the reason shown on the payment page.
4. A pending order nobody uploads a receipt for expires on its own after
   `MANUAL_QRIS_DEADLINE_HOURS` (24 by default); one waiting on an admin
   never does.
