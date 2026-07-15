/**
 * Connect to existing Chrome (remote debugging :9222) with user session,
 * use dash.cloudflare.com/api/v4 session to configure DNS + Origin cert.
 */
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ZONE_ID = 'b4713e8837854ab6c56582815eb4d866';
const FQDN = 'blog.lzch.eu.org';
const ORIGIN_IP = process.env.DEPLOY_HOST || '149.88.74.70';
const SSH_PASS = process.env.DEPLOY_SSH_PASS || '';
const SSH_USER = process.env.DEPLOY_USER || 'root';
const SSH_PORT = process.env.DEPLOY_PORT || '22';

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-cdp-'));
const keyPath = path.join(outDir, `${FQDN}.key`);
const csrPath = path.join(outDir, `${FQDN}.csr`);
const certPath = path.join(outDir, `${FQDN}.pem`);
const log = (...a) => console.log(...a);

function expectCmd(cmd) {
  const script = `
set timeout 120
spawn ${cmd}
expect {
  -re "(?i)are you sure you want to continue connecting" { send "yes\\r"; exp_continue }
  -re "(?i)password:" { send "${SSH_PASS}\\r"; exp_continue }
  eof
}
catch wait result
exit [lindex $result 3]
`;
  const r = spawnSync('expect', ['-c', script], { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  if (r.status !== 0) throw new Error(`fail ${cmd} status=${r.status}`);
}

async function api(page, method, apiPath, body) {
  // Try dash API first (session cookie)
  const viaDash = await page.evaluate(async ({ method, apiPath, body }) => {
    const res = await fetch('https://dash.cloudflare.com/api/v4' + apiPath, {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-cross-site-security': 'dash',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    return { status: res.status, json };
  }, { method, apiPath, body });
  if (viaDash.status && viaDash.status !== 401 && viaDash.status !== 403) return { channel: 'dash', ...viaDash };

  // Fallback api.cloudflare.com with cookies (sometimes works)
  const viaApi = await page.evaluate(async ({ method, apiPath, body }) => {
    const res = await fetch('https://api.cloudflare.com/client/v4' + apiPath, {
      method,
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 300) }; }
    return { status: res.status, json };
  }, { method, apiPath, body });
  return { channel: 'api', ...viaApi };
}

async function main() {
  execFileSync('openssl', [
    'req', '-new', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', csrPath, '-subj', `/CN=${FQDN}`,
  ], { stdio: 'ignore' });
  const csr = fs.readFileSync(csrPath, 'utf8');

  log('连接 Chrome CDP :9222 …');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0] || await browser.newContext();
  let page = context.pages().find((p) => p.url().includes('cloudflare.com'));
  if (!page) page = context.pages()[0] || await context.newPage();
  await page.goto(`https://dash.cloudflare.com/4555fd402f493f78358d5f5d98abcdca/lzch.eu.org/dns/records`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForTimeout(3000);
  log('page', page.url());

  // probe auth
  let probe = await api(page, 'GET', `/zones/${ZONE_ID}`);
  log('probe zone', probe.channel, probe.status, probe.json?.success, probe.json?.errors || probe.json?.result?.name);
  if (!probe.json?.success) {
    probe = await api(page, 'GET', `/zones?name=lzch.eu.org`);
    log('probe zones', probe.channel, probe.status, probe.json?.success, probe.json?.errors, (probe.json?.result || [])[0]?.id);
  }
  if (!probe.json?.success) {
    // print cookies presence
    const cookies = await context.cookies('https://dash.cloudflare.com');
    log('cookies', cookies.map((c) => c.name).slice(0, 20));
    throw new Error('控制台会话不可用，请在该 Chrome 窗口登录 Cloudflare 后重试');
  }

  // DNS
  log('==> DNS A', FQDN, ORIGIN_IP);
  const list = await api(page, 'GET', `/zones/${ZONE_ID}/dns_records?type=A&name=${FQDN}`);
  log('list', list.status, list.json?.success, list.json?.errors, (list.json?.result || []).length);
  const payload = { type: 'A', name: FQDN, content: ORIGIN_IP, ttl: 1, proxied: true, comment: 'tech-garden-blog' };
  let dns;
  if ((list.json?.result || []).length) {
    dns = await api(page, 'PUT', `/zones/${ZONE_ID}/dns_records/${list.json.result[0].id}`, payload);
  } else {
    dns = await api(page, 'POST', `/zones/${ZONE_ID}/dns_records`, payload);
  }
  log('dns', dns.status, dns.json?.success, dns.json?.errors || `${dns.json?.result?.name} proxied=${dns.json?.result?.proxied}`);
  if (!dns.json?.success) throw new Error('DNS failed');

  // SSL Full
  log('==> SSL Full');
  const ssl = await api(page, 'PATCH', `/zones/${ZONE_ID}/settings/ssl`, { value: 'full' });
  log('ssl', ssl.status, ssl.json?.success, ssl.json?.result?.value, ssl.json?.errors);
  await api(page, 'PATCH', `/zones/${ZONE_ID}/settings/always_use_https`, { value: 'on' });

  // Origin cert
  log('==> Origin certificate');
  let cert = await api(page, 'POST', '/certificates', {
    hostnames: [FQDN],
    requested_validity: 5475,
    request_type: 'origin-rsa',
    csr,
  });
  log('cert', cert.status, cert.json?.success, cert.json?.errors);
  if (!cert.json?.success) {
    // try with wildcard zone hostnames as CF sometimes wants apex too
    cert = await api(page, 'POST', '/certificates', {
      hostnames: [FQDN, 'lzch.eu.org'],
      requested_validity: 5475,
      request_type: 'origin-rsa',
      csr,
    });
    log('cert2', cert.status, cert.json?.success, cert.json?.errors);
  }
  if (!cert.json?.success) throw new Error('Origin cert failed: ' + JSON.stringify(cert.json));
  fs.writeFileSync(certPath, cert.json.result.certificate + '\n');
  log('cert saved', certPath, 'expires', cert.json.result.expires_on);

  if (!SSH_PASS) {
    log('no SSH pass, stop after files', outDir);
    return;
  }

  log('==> install on VPS');
  expectCmd(`scp -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -P ${SSH_PORT} ${certPath} ${keyPath} ${SSH_USER}@${ORIGIN_IP}:/tmp/`);
  expectCmd(`ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${SSH_PORT} ${SSH_USER}@${ORIGIN_IP} "mv /tmp/${FQDN}.pem /etc/nginx/ssl/${FQDN}.pem && mv /tmp/${FQDN}.key /etc/nginx/ssl/${FQDN}.key && chmod 600 /etc/nginx/ssl/${FQDN}.key && nginx -t && systemctl reload nginx && echo CERT_OK"`);

  const pub = spawnSync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '25', `https://${FQDN}/`], { encoding: 'utf8' });
  log('public https', pub.stdout, pub.stderr || '');
  log('==> DONE https://' + FQDN + '/');
  // don't close user's chrome
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
