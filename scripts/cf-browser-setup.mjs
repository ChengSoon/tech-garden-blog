/**
 * 拉起 Chrome 登录 Cloudflare，用控制台会话完成：
 * - DNS A: blog.lzch.eu.org -> 服务器
 * - SSL Full
 * - Origin 证书签发并装到 VPS
 *
 * 无需 API Token。用法：
 *   DEPLOY_SSH_PASS='...' node scripts/cf-browser-setup.mjs
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ACCOUNT = '4555fd402f493f78358d5f5d98abcdca';
const ZONE_NAME = 'lzch.eu.org';
const ZONE_ID = 'b4713e8837854ab6c56582815eb4d866';
const FQDN = 'blog.lzch.eu.org';
const ORIGIN_IP = process.env.DEPLOY_HOST || '149.88.74.70';
const SSH_PASS = process.env.DEPLOY_SSH_PASS || '';
const SSH_USER = process.env.DEPLOY_USER || 'root';
const SSH_PORT = process.env.DEPLOY_PORT || '22';

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-blog-'));
const keyPath = path.join(outDir, `${FQDN}.key`);
const csrPath = path.join(outDir, `${FQDN}.csr`);
const certPath = path.join(outDir, `${FQDN}.pem`);

const log = (...a) => console.log(...a);

function expectSsh(cmd) {
  if (!SSH_PASS) throw new Error('需要 DEPLOY_SSH_PASS');
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
  if (r.status !== 0) throw new Error(`命令失败: ${cmd}\nstatus=${r.status}`);
}

async function dashApi(page, method, apiPath, body) {
  return page.evaluate(async ({ method, apiPath, body }) => {
    const res = await fetch(`https://dash.cloudflare.com/api/v4${apiPath}`, {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-cross-site-security': 'dash',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  }, { method, apiPath, body });
}

async function waitLoggedIn(page) {
  log('==> 请在弹出的 Chrome 窗口完成 Cloudflare 登录/授权（已登录会自动继续，最多等 5 分钟）');
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes('dash.cloudflare.com') && !url.includes('/login')) {
      const probe = await dashApi(page, 'GET', `/zones/${ZONE_ID}`);
      if (probe.status === 200 && probe.json?.success) {
        log('==> 控制台会话可用');
        return;
      }
      // try account-level
      const me = await page.evaluate(async () => {
        const res = await fetch('https://dash.cloudflare.com/api/v4/zones?name=lzch.eu.org', {
          credentials: 'include',
          headers: { 'x-cross-site-security': 'dash' },
        });
        return { status: res.status, json: await res.json().catch(() => ({})) };
      });
      if (me.status === 200 && me.json?.success) {
        log('==> 控制台会话可用 (zones list)');
        return;
      }
    }
    await page.waitForTimeout(2000);
  }
  throw new Error('登录超时：请在浏览器登录 Cloudflare 后重试');
}

async function main() {
  log('工作目录', outDir);

  // generate CSR/key for origin cert
  execFileSync('openssl', [
    'req', '-new', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', keyPath, '-out', csrPath, '-subj', `/CN=${FQDN}`,
  ], { stdio: 'ignore' });
  const csr = fs.readFileSync(csrPath, 'utf8');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.goto(`https://dash.cloudflare.com/${ACCOUNT}/${ZONE_NAME}/dns/records`, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await waitLoggedIn(page);

  // 1) DNS A record
  log('==> 创建/更新 DNS A 记录');
  const list = await dashApi(page, 'GET', `/zones/${ZONE_ID}/dns_records?type=A&name=${FQDN}`);
  log('list status', list.status, list.json?.success, list.json?.errors);
  if (!list.json?.success) {
    // dump for debug
    throw new Error(`无法通过控制台会话读取 DNS：${JSON.stringify(list.json?.errors || list)}`);
  }
  const existing = list.json.result || [];
  const payload = {
    type: 'A',
    name: FQDN,
    content: ORIGIN_IP,
    ttl: 1,
    proxied: true,
    comment: 'tech-garden-blog',
  };
  let dnsRes;
  if (existing.length) {
    dnsRes = await dashApi(page, 'PUT', `/zones/${ZONE_ID}/dns_records/${existing[0].id}`, payload);
  } else {
    dnsRes = await dashApi(page, 'POST', `/zones/${ZONE_ID}/dns_records`, payload);
  }
  log('dns', dnsRes.status, dnsRes.json?.success, dnsRes.json?.errors || dnsRes.json?.result?.name);
  if (!dnsRes.json?.success) throw new Error('DNS 写入失败: ' + JSON.stringify(dnsRes.json));

  // 2) SSL Full
  log('==> SSL 模式 -> Full');
  const ssl = await dashApi(page, 'PATCH', `/zones/${ZONE_ID}/settings/ssl`, { value: 'full' });
  log('ssl', ssl.status, ssl.json?.success, ssl.json?.result?.value, ssl.json?.errors);
  await dashApi(page, 'PATCH', `/zones/${ZONE_ID}/settings/always_use_https`, { value: 'on' });

  // 3) Origin certificate
  log('==> 签发 Origin 证书');
  // Try via dash API first
  let certRes = await dashApi(page, 'POST', '/certificates', {
    hostnames: [FQDN],
    requested_validity: 5475,
    request_type: 'origin-rsa',
    csr,
  });
  log('cert via dash', certRes.status, certRes.json?.success, certRes.json?.errors);

  // Some dash sessions need account-scoped path
  if (!certRes.json?.success) {
    certRes = await page.evaluate(async ({ FQDN, csr, ACCOUNT }) => {
      const res = await fetch('https://api.cloudflare.com/client/v4/certificates', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          hostnames: [FQDN],
          requested_validity: 5475,
          request_type: 'origin-rsa',
          csr,
        }),
      });
      return { status: res.status, json: await res.json().catch(() => ({})) };
    }, { FQDN, csr, ACCOUNT });
    log('cert via api.cf', certRes.status, certRes.json?.success, certRes.json?.errors);
  }

  if (!certRes.json?.success) {
    // Fallback: use UI page generate (Cloudflare generates key)
    log('==> API 签发失败，改为在 Origin 页面用界面创建（将自动生成密钥）');
    await page.goto(`https://dash.cloudflare.com/${ACCOUNT}/${ZONE_NAME}/ssl-tls/origin`, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await page.waitForTimeout(2500);
    // click create
    const create = page.getByRole('button', { name: /Create Certificate|创建证书/i }).first();
    if (await create.count()) await create.click();
    else await page.getByText(/Create Certificate|创建证书/i).first().click();
    await page.waitForTimeout(2000);

    // Cloudflare generate private key option
    const gen = page.getByText(/Let Cloudflare generate|让 Cloudflare 生成|Cloudflare 生成私钥/i).first();
    if (await gen.count()) await gen.click().catch(() => {});

    // hostnames textarea
    const areas = page.locator('textarea:visible');
    if (await areas.count()) {
      await areas.first().fill(FQDN);
    }
    // submit
    await page.getByRole('button', { name: /^(Create|创建)$/i }).last().click();
    await page.waitForTimeout(4000);

    const texts = [];
    const nodes = page.locator('pre, textarea, code');
    const n = await nodes.count();
    for (let i = 0; i < n; i++) texts.push(await nodes.nth(i).innerText().catch(() => ''));
    const all = texts.join('\n');
    const cert = all.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/)?.[0];
    const key = all.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/)?.[0];
    if (!cert || !key) {
      // save screenshot for debug
      const shot = path.join(outDir, 'origin-page.png');
      await page.screenshot({ path: shot, fullPage: true });
      throw new Error(`界面提取证书失败，截图: ${shot}`);
    }
    fs.writeFileSync(certPath, cert + '\n');
    fs.writeFileSync(keyPath, key + '\n');
  } else {
    fs.writeFileSync(certPath, certRes.json.result.certificate + '\n');
    // key is our openssl key
  }

  log('==> 证书文件', certPath, keyPath);

  // 4) install on VPS
  if (!SSH_PASS) {
    log('未提供 DEPLOY_SSH_PASS，跳过安装。证书在', outDir);
  } else {
    log('==> 上传并安装到 Nginx');
    expectSsh(`scp -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -P ${SSH_PORT} ${certPath} ${keyPath} ${SSH_USER}@${ORIGIN_IP}:/tmp/`);
    expectSsh(`ssh -o StrictHostKeyChecking=accept-new -o PreferredAuthentications=password -o PubkeyAuthentication=no -p ${SSH_PORT} ${SSH_USER}@${ORIGIN_IP} "mkdir -p /etc/nginx/ssl && mv /tmp/${FQDN}.pem /etc/nginx/ssl/${FQDN}.pem && mv /tmp/${FQDN}.key /etc/nginx/ssl/${FQDN}.key && chmod 600 /etc/nginx/ssl/${FQDN}.key && chown root:root /etc/nginx/ssl/${FQDN}.* && nginx -t && systemctl reload nginx && echo CERT_OK"`);
  }

  // verify public
  log('==> 验证 https://' + FQDN);
  try {
    const r = spawnSync('curl', ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '20', `https://${FQDN}/`], { encoding: 'utf8' });
    log('public status', r.stdout || r.stderr);
  } catch {}

  await page.waitForTimeout(1500);
  await browser.close();
  log('==> 全部完成: https://' + FQDN + '/');
}

main().catch((e) => {
  console.error('\n失败:', e.message || e);
  process.exit(1);
});
