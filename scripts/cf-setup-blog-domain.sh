#!/usr/bin/env bash
# 使用 Cloudflare API 创建子域名 DNS + Origin 证书，并安装到 VPS。
# 需要 API Token 权限：
#   Zone.DNS:Edit, Zone.SSL and Certificates:Edit, 以及 Origin CA Key（或 Account 级 Create Certificate）
#
# 用法：
#   export CF_API_TOKEN='xxxx'
#   export DEPLOY_SSH_PASS='xxxx'   # 安装证书到服务器时需要
#   bash scripts/cf-setup-blog-domain.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${DEPLOY_DOMAIN:-blog.lzch.eu.org}"
ZONE_NAME="${CF_ZONE_NAME:-lzch.eu.org}"
ORIGIN_IP="${DEPLOY_HOST:-149.88.74.70}"
SSH_USER="${DEPLOY_USER:-root}"
SSH_PORT="${DEPLOY_PORT:-22}"
TOKEN="${CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
if [[ -z "$TOKEN" && -f "${CF_API_TOKEN_FILE:-/tmp/CF_API_TOKEN}" ]]; then
  TOKEN="$(tr -d " \n\r" < "${CF_API_TOKEN_FILE:-/tmp/CF_API_TOKEN}")"
fi
PASS="${DEPLOY_SSH_PASS:-}"

if [[ -z "$TOKEN" ]]; then
  echo "缺少 CF_API_TOKEN（Cloudflare API Token）" >&2
  echo "Dashboard → My Profile → API Tokens → Create Token" >&2
  echo "权限至少：Zone.DNS Edit + Zone.SSL and Certificates Edit + Origin CA Key" >&2
  exit 1
fi

api() {
  local method="$1" url="$2" data="${3:-}"
  if [[ -n "$data" ]]; then
    curl -sS --max-time 45 -X "$method" "$url" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$data"
  else
    curl -sS --max-time 45 -X "$method" "$url" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json"
  fi
}

echo "==> resolve zone $ZONE_NAME"
ZONE_JSON=$(api GET "https://api.cloudflare.com/client/v4/zones?name=${ZONE_NAME}")
ZONE_ID=$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); assert d.get("success"), d; print(d["result"][0]["id"])' "$ZONE_JSON")
echo "zone_id=$ZONE_ID"

echo "==> ensure DNS A $DOMAIN -> $ORIGIN_IP (proxied)"
EXIST=$(api GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&name=${DOMAIN}")
REC_ID=$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print(d["result"][0]["id"] if d.get("success") and d.get("result") else "")' "$EXIST")
BODY=$(python3 - <<PY
import json
print(json.dumps({
  "type":"A",
  "name":"$DOMAIN",
  "content":"$ORIGIN_IP",
  "ttl":1,
  "proxied":True,
  "comment":"tech-garden-blog origin"
}))
PY
)
if [[ -n "$REC_ID" ]]; then
  RES=$(api PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${REC_ID}" "$BODY")
else
  RES=$(api POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" "$BODY")
fi
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); assert d.get("success"), d; print("dns ok", d["result"]["name"], d["result"]["content"], "proxied="+str(d["result"]["proxied"]))' "$RES"

echo "==> set SSL mode Full"
SSL=$(api PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" '{"value":"full"}')
python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print("ssl", d.get("success"), (d.get("result") or {}).get("value"), d.get("errors"))' "$SSL" || true

echo "==> always use HTTPS"
api PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/always_use_https" '{"value":"on"}' >/dev/null || true

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
KEY="$TMP/${DOMAIN}.key"
CSR="$TMP/${DOMAIN}.csr"
CERT="$TMP/${DOMAIN}.pem"
openssl req -new -newkey rsa:2048 -nodes \
  -keyout "$KEY" -out "$CSR" \
  -subj "/CN=${DOMAIN}" >/dev/null 2>&1

CSR_JSON=$(python3 - <<PY
import json, pathlib
print(json.dumps({
  "hostnames": ["$DOMAIN"],
  "requested_validity": 5475,
  "request_type": "origin-rsa",
  "csr": pathlib.Path("$CSR").read_text(),
}))
PY
)

echo "==> create Cloudflare Origin Certificate"
CERT_JSON=$(api POST "https://api.cloudflare.com/client/v4/certificates" "$CSR_JSON")
python3 -c 'import json,sys,pathlib; d=json.loads(sys.argv[1]); assert d.get("success"), d; pathlib.Path(sys.argv[2]).write_text(d["result"]["certificate"]); print("origin cert expires", d["result"].get("expires_on"))' "$CERT_JSON" "$CERT"

if [[ -z "$PASS" ]]; then
  echo "已生成证书到 $CERT / $KEY"
  echo "请设置 DEPLOY_SSH_PASS 后重新运行以安装到服务器，或手动 scp"
  exit 0
fi

echo "==> install cert on VPS"
expect <<EXP
set timeout 120
spawn scp -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -P ${SSH_PORT} ${CERT} ${KEY} ${SSH_USER}@${ORIGIN_IP}:/tmp/
expect {
  -re "(?i)password:" { send "${PASS}\r"; exp_continue }
  eof
}
EXP

expect <<EXP
set timeout 60
spawn ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${SSH_PORT} ${SSH_USER}@${ORIGIN_IP} {mkdir -p /etc/nginx/ssl && mv /tmp/${DOMAIN}.pem /etc/nginx/ssl/${DOMAIN}.pem && mv /tmp/${DOMAIN}.key /etc/nginx/ssl/${DOMAIN}.key && chmod 600 /etc/nginx/ssl/${DOMAIN}.key && nginx -t && systemctl reload nginx && echo CERT_INSTALLED}
expect {
  -re "(?i)password:" { send "${PASS}\r"; exp_continue }
  eof
}
EXP

echo "==> done https://${DOMAIN}/"
