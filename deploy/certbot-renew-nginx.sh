#!/usr/bin/env sh
set -eu

# Certbot's IP certificates expire after roughly six days. Reload Nginx only
# after a successful renewal has replaced the files it already references.
/usr/sbin/nginx -t
/usr/bin/systemctl reload nginx.service
