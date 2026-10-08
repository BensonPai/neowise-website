#!/usr/bin/env node
/**
 * 智慧喵 生活部落格 — 聯盟連結健檢
 * ------------------------------------------------------------
 * 掃描 life/content/ 下所有 .md 的 ::aff ...:: 廣告，抽出實際會
 * 導向的外部連結，逐一發 HTTP 請求檢查是否還活著（商品下架 / 連結
 * 失效會回 404 等錯誤），把有問題的列出來提醒你處理。
 *
 * 零外部相依，純 Node 內建模組（需 Node 18+，用內建 fetch）。
 *
 * 用法：
 *   node life/scripts/check-aff-links.mjs            # 檢查全部
 *   node life/scripts/check-aff-links.mjs --bad      # 只列出有問題的
 * ------------------------------------------------------------
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIFE_ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(LIFE_ROOT, 'content');

// 與產生器 build-life-blog.mjs 保持一致（換連結或代號時兩邊都要改）
const AP_ID = 'benson0618';
const HAHOW_URL = 'https://joymall.co/3Tker';

const ONLY_BAD = process.argv.includes('--bad');
const TIMEOUT_MS = 20000;      // 單一連結逾時（joymall 等轉址服務偏慢，給寬一點）
const OK_STATUS = (s) => s >= 200 && s < 400;   // 2xx/3xx 都算正常（含轉址）

// 已知會擋腳本請求的站點 → 標為「無法自動檢測」而非失效，避免虛驚
// 這些站點在瀏覽器裡都能正常運作，只是反爬機制擋 Node fetch
const KNOWN_BLOCKED_HOSTS = [
  'joymall.co',         // Hahow 轉址服務，完全不回應非瀏覽器請求
  'www.books.com.tw',   // 博客來，對非瀏覽器回 403
];

/* ---------- 收集所有 .md ---------- */
function collectMarkdown(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...collectMarkdown(full));
    else if (e.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

/* ---------- 從一行 ::aff ...:: 取出要檢查的連結 ---------- */
// 回傳 { url, platform } 或 { skip, platform, reason }（KKday 這種無固定連結的）
function resolveAffLink(content) {
  const c = content.trim();

  // 情況 1：直接貼博客來商品連結
  const bareBooks = c.match(/^(https?:\/\/www\.books\.com\.tw\/\S+)/i);
  if (bareBooks) {
    const pid = (bareBooks[1].match(/products\/(\d{10})/) || [])[1];
    if (pid) return { platform: 'books', url: `https://www.books.com.tw/products/${pid}` };
  }

  const parts = c.split(/\s+/);
  const platform = (parts[0] || '').toLowerCase();

  // books <編號或網址>
  if (platform === 'books') {
    const pid = (String(parts[1] || '').match(/products\/(\d{10})/) || String(parts[1] || '').match(/^(\d{10})$/) || [])[1];
    if (pid) return { platform: 'books', url: `https://www.books.com.tw/products/${pid}` };
    return { skip: true, platform: 'books', reason: '缺少有效商品編號' };
  }

  // hahow：整站共用一條，檢查內建連結
  if (platform === 'hahow') return { platform: 'hahow', url: HAHOW_URL };

  // kkday：動態 JS 廣告，無固定商品連結可查
  if (platform === 'kkday') return { skip: true, platform: 'kkday', reason: '動態廣告，無固定連結' };

  // 按鈕式：link / momo / shopee / cjlink / pressplay → 第一段是連結
  if (['link', 'momo', 'shopee', 'cjlink', 'pressplay'].includes(platform)) {
    const after = c.slice(platform.length).trim();
    const href = after.split('|')[0].trim();
    if (/^https?:\/\//.test(href)) return { platform, url: href };
    return { skip: true, platform, reason: '缺少有效連結' };
  }

  return { skip: true, platform: platform || '未知', reason: '無法辨識的語法' };
}

/* ---------- 檢查單一連結 ---------- */
async function checkUrl(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  // 模擬真實瀏覽器，避免被博客來等站台攔截
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,*/*',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
  };
  try {
    // 先試 HEAD（省流量），有些站不支援再退回 GET
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers });
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers });
    }
    return { status: res.status, finalUrl: res.url };
  } catch (err) {
    return { status: 0, error: err.name === 'AbortError' ? '逾時' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- 主流程 ---------- */
async function main() {
  const files = collectMarkdown(CONTENT_DIR);
  const affRe = /^::aff\s+([\s\S]+?)::\s*$/;

  // 收集所有待查項目
  const items = [];
  for (const file of files) {
    const rel = file.slice(LIFE_ROOT.length + 1).replace(/\\/g, '/');
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      const m = line.trim().match(affRe);
      if (!m) return;
      const info = resolveAffLink(m[1]);
      items.push({ rel, lineNo: idx + 1, raw: line.trim(), ...info });
    });
  }

  if (!items.length) {
    console.log('（content/ 底下沒有找到任何 ::aff:: 廣告）');
    return;
  }

  console.log(`掃描到 ${items.length} 個聯盟廣告，開始檢查連結…\n`);

  let ok = 0, bad = 0, skipped = 0, blocked = 0;
  const badList = [];

  for (const it of items) {
    if (it.skip) {
      skipped++;
      if (!ONLY_BAD) console.log(`  ⏭  略過 [${it.platform}] ${it.rel}:${it.lineNo} — ${it.reason}`);
      continue;
    }

    // 已知擋腳本的站點 → 標記無法自動檢測，不標為失效
    let isBlocked = false;
    try { isBlocked = KNOWN_BLOCKED_HOSTS.some(h => new URL(it.url).hostname.includes(h)); } catch {}
    if (isBlocked) {
      blocked++;
      if (!ONLY_BAD) console.log(`  ⚠️  無法自動檢測 [${it.platform}] ${it.rel}:${it.lineNo} → ${it.url}（站方擋機器人，需手動確認）`);
      continue;
    }

    const r = await checkUrl(it.url);
    if (r.status && OK_STATUS(r.status)) {
      ok++;
      if (!ONLY_BAD) console.log(`  ✅ [${it.platform}] ${it.rel}:${it.lineNo} → ${it.url} (${r.status})`);
    } else {
      bad++;
      const reason = r.error ? r.error : `HTTP ${r.status}`;
      badList.push({ ...it, reason });
      console.log(`  ❌ [${it.platform}] ${it.rel}:${it.lineNo} → ${it.url} (${reason})`);
    }
  }

  console.log(`\n──────────────────────────────`);
  console.log(`掃描完成：共 ${items.length} 個 / 正常 ${ok} / 失效 ${bad} / 無法自動檢測 ${blocked} / 略過 ${skipped}`);

  if (bad) {
    console.log(`\n⚠ 以下連結需要處理（商品可能已下架或連結失效）：`);
    for (const b of badList) {
      console.log(`   • ${b.rel} 第 ${b.lineNo} 行（${b.reason}）`);
      console.log(`     ${b.raw}`);
    }
    console.log(`\n處理方式：到該 .md 把 ::aff:: 那行換成新商品連結或刪除，再重跑 build-life.bat。`);
    process.exitCode = 1;   // 有失效連結時以非 0 結束，方便日後接排程通知
  } else {
    console.log(`\n🎉 所有可自動檢查的連結都正常。`);
  }

  if (blocked) {
    console.log(`\nℹ 有 ${blocked} 個連結屬於「博客來 / Hahow」這類會擋機器人的站台，無法自動檢測。`);
    console.log(`  這些在瀏覽器裡通常正常，偶爾手動點一下確認即可。`);
  }
}

main().catch((e) => { console.error('檢查過程發生錯誤：', e); process.exitCode = 1; });
