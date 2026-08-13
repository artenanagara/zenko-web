#!/usr/bin/env sh
set -eu

# Certbot's IP certificates expire after roughly six days. Reload Nginx only
# after a successful renewal has replaced the files it already references.
# Nginx writes a successful config-test message to stderr; keep a successful
# renewal quiet while preserving the diagnostic if validation ever fails.
if ! validation_output=$(/usr/sbin/nginx -t 2>&1); then
    printf '%s\n' "$validation_output" >&2
    exit 1
fi
/usr/bin/systemctl reload nginx.service
