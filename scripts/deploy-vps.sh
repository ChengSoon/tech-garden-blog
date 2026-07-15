#!/usr/bin/env bash
# Deploy static dist/ to VPS via SSH (password auth via expect + DEPLOY_SSH_PASS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-149.88.74.70}"
USER="${DEPLOY_USER:-root}"
PORT="${DEPLOY_PORT:-22}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/blog.lzch.eu.org}"
DOMAIN="${DEPLOY_DOMAIN:-blog.lzch.eu.org}"
PASS="${DEPLOY_SSH_PASS:-}"

cd "$ROOT"

if [[ -z "$PASS" ]]; then
  echo "请设置环境变量 DEPLOY_SSH_PASS" >&2
  exit 1
fi

echo "==> build"
ASTRO_TELEMETRY_DISABLED=1 npm run build
test -d dist

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

# nginx site config (local file to upload)
cat > "$TMP/nginx-${DOMAIN}.conf" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${REMOTE_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ \$uri.html =404;
    }

    location /_astro/ {
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
    }

    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?)\$ {
        access_log off;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     /etc/nginx/ssl/${DOMAIN}.pem;
    ssl_certificate_key /etc/nginx/ssl/${DOMAIN}.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root ${REMOTE_PATH};
    index index.html;

    location / {
        try_files \$uri \$uri/ \$uri.html =404;
    }

    location /_astro/ {
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files \$uri =404;
    }

    location ~* \.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?)\$ {
        access_log off;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files \$uri =404;
    }

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}
NGINX

# remote setup script
cat > "$TMP/remote-setup.sh" <<REMOTE
#!/usr/bin/env bash
set -euo pipefail
DOMAIN='${DOMAIN}'
REMOTE_PATH='${REMOTE_PATH}'

mkdir -p "\$REMOTE_PATH" /etc/nginx/ssl /etc/nginx/sites-available /etc/nginx/sites-enabled
if [[ ! -f "/etc/nginx/ssl/\${DOMAIN}.pem" ]]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "/etc/nginx/ssl/\${DOMAIN}.key" \
    -out "/etc/nginx/ssl/\${DOMAIN}.pem" \
    -subj "/CN=\${DOMAIN}"
fi

install -m 644 /tmp/nginx-\${DOMAIN}.conf /etc/nginx/sites-available/\${DOMAIN}
ln -sfn /etc/nginx/sites-available/\${DOMAIN} /etc/nginx/sites-enabled/\${DOMAIN}
chown -R www-data:www-data "\$REMOTE_PATH"
nginx -t
systemctl reload nginx
echo REMOTE_SETUP_OK
REMOTE

SSH_BASE=(ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p "$PORT")
RSYNC_RSH="ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${PORT}"

ssh_pass() {
  # $1 = command line after spawn target already includes full spawn argv as single string for expect
  local cmd="$1"
  expect <<EXP
set timeout 180
spawn $cmd
expect {
  -re "(?i)are you sure you want to continue connecting" { send "yes\r"; exp_continue }
  -re "(?i)password:" { send "${PASS}\r"; exp_continue }
  eof
}
catch wait result
exit [lindex \$result 3]
EXP
}

echo "==> prepare remote"
ssh_pass "${SSH_BASE[*]} ${USER}@${HOST} mkdir -p ${REMOTE_PATH} /tmp"

echo "==> upload site files"
ssh_pass "rsync -az --delete -e \"${RSYNC_RSH}\" ${ROOT}/dist/ ${USER}@${HOST}:${REMOTE_PATH}/"

echo "==> upload nginx config + setup script"
ssh_pass "scp -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -P ${PORT} ${TMP}/nginx-${DOMAIN}.conf ${TMP}/remote-setup.sh ${USER}@${HOST}:/tmp/"

echo "==> apply nginx + ssl"
ssh_pass "${SSH_BASE[*]} ${USER}@${HOST} bash /tmp/remote-setup.sh"

echo "==> verify origin"
ssh_pass "${SSH_BASE[*]} ${USER}@${HOST} curl -sS -o /dev/null -w '%{http_code}' -H 'Host: ${DOMAIN}' http://127.0.0.1/ || true"
echo
echo "==> done: https://${DOMAIN}/  (Cloudflare SSL 建议 Full)"
