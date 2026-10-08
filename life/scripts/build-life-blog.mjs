#!/usr/bin/env node
/**
 * 智慧喵 生活部落格 產生器
 * ------------------------------------------------------------
 * 讀 life/content/ 的 Markdown（含 front-matter），產生：
 *   1. 各文章 HTML -> life/<slug>.html
 *   2. 文章列表頁   -> life/index.html
 *   3. 分站 sitemap -> life/sitemap.xml
 * 零外部相依，純 Node 內建模組。只發布 status = approved/published。
 *
 * 用法：node life/scripts/build-life-blog.mjs
 * ------------------------------------------------------------
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// sharp 為選用相依：沒安裝也能照常產生 HTML，只是不縮圖。
let sharp = null;
try { sharp = (await import('sharp')).default; }
catch { console.warn('⚠ 未安裝 sharp，略過自動縮圖（如需縮圖請在 life/ 執行 npm install）。'); }

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIFE_ROOT = resolve(__dirname, '..');          // life/
const CONTENT_DIR = join(LIFE_ROOT, 'content');
const ASSETS_DIR = join(LIFE_ROOT, 'assets');
const SITE_URL = 'https://neowise.com.tw/life';
const YT_URL = 'https://www.youtube.com/@智慧喵';
const GA_ID = 'G-ECQ2F0L341';   // 智慧喵 Google Analytics 評量 ID（換帳號改這裡）

// Google Analytics 追蹤碼片段（放每頁 <head>）
const gaSnippet = () => `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;

// 縮圖設定：超過此寬度就等比縮小（考慮 2x 高解析螢幕，760px 版面用 1600 足夠）
const MAX_IMG_WIDTH = 1600;
// 檔案超過此大小就重新壓縮品質（加速網頁載入的主因）
const MAX_IMG_BYTES = 300 * 1024;   // 300 KB
const JPEG_QUALITY = 80;            // jpg 壓縮品質（80 幾乎看不出差別，檔案大幅變小）
const IMG_EXT = /\.(png|jpe?g|webp)$/i;

// 分類 -> 標籤 CSS class（對應 style.css）
const CAT_CLASS = { '投資理財': 'invest', '科技': 'tech', '旅遊': 'travel', '生活': 'life' };

/* ---------- 工具 ---------- */
function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function stripQuotes(s = '') {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

// 從各種形式的 YouTube 輸入取出影片 ID：純 ID、youtu.be/xxx、watch?v=xxx、embed/xxx、shorts/xxx
function youtubeId(input = '') {
  const s = String(input).trim();
  if (!s) return '';
  // 已是純 ID（11 碼英數與 -_）
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : '';
}

/* ---------- 自動縮圖 ---------- */
// 掃描 assets 下所有圖檔，寬度超過 MAX_IMG_WIDTH 就等比縮小並「覆寫原檔」。
// 已在範圍內的圖不動，避免重複壓縮失真。
async function optimizeImages() {
  if (!sharp || !existsSync(ASSETS_DIR)) return;
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (IMG_EXT.test(e)) files.push(full);
    }
  };
  walk(ASSETS_DIR);

  let processed = 0;
  for (const file of files) {
    try {
      // 先把原圖整個讀進 buffer，用 buffer 當來源處理，避免 Windows 上同檔讀寫的鎖定問題。
      const input = readFileSync(file);
      const meta = await sharp(input, { failOn: 'none' }).metadata();
      const tooWide = meta.width && meta.width > MAX_IMG_WIDTH;
      const tooBig = input.length > MAX_IMG_BYTES;

      // 尺寸在範圍內、檔案也不大 → 不處理，避免重複壓縮失真
      if (!tooWide && !tooBig) continue;

      let pipeline = sharp(input, { failOn: 'none' });
      if (tooWide) pipeline = pipeline.resize({ width: MAX_IMG_WIDTH, withoutEnlargement: true });

      // 依格式重新壓縮：jpg 用品質壓縮、png 用最高壓縮等級、webp 用品質壓縮
      const fmt = (meta.format || '').toLowerCase();
      if (fmt === 'jpeg' || fmt === 'jpg') {
        pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
      } else if (fmt === 'png') {
        pipeline = pipeline.png({ compressionLevel: 9, palette: true });
      } else if (fmt === 'webp') {
        pipeline = pipeline.webp({ quality: JPEG_QUALITY });
      }

      const output = await pipeline.toBuffer();

      // 只有在「確實變小」時才覆寫，避免壓縮後反而變大
      if (output.length < input.length) {
        writeFileSync(file, output);
        const rel = file.slice(LIFE_ROOT.length + 1).replace(/\\/g, '/');
        const before = Math.round(input.length / 1024);
        const after = Math.round(output.length / 1024);
        console.log(`  ↓ 優化：${rel}（${before}KB → ${after}KB${tooWide ? `, ${meta.width}px→${MAX_IMG_WIDTH}px` : ''}）`);
        processed++;
      }
    } catch (err) {
      const rel = file.slice(LIFE_ROOT.length + 1).replace(/\\/g, '/');
      console.warn(`  ⚠ 圖片優化失敗（略過）：${rel} — ${err.message}`);
    }
  }
  if (sharp) console.log(`  ✔ 圖片優化完成（處理 ${processed} 張，其餘已達標）`);
}

/* ---------- front-matter ---------- */
function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const [, fmText, body] = match;
  const data = {};
  let currentKey = null;
  for (const line of fmText.split('\n')) {
    if (!line.trim()) continue;
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      const itemText = listItem[1].trim();
      const kv = itemText.match(/^(\w+):\s*(.*)$/);
      if (kv) { const o = {}; o[kv[1]] = stripQuotes(kv[2]); data[currentKey].push(o); }
      else data[currentKey].push(stripQuotes(itemText));
      continue;
    }
    const nestedKv = line.match(/^\s{4,}(\w+):\s*(.*)$/);
    if (nestedKv && currentKey && Array.isArray(data[currentKey]) &&
        typeof data[currentKey][data[currentKey].length - 1] === 'object') {
      data[currentKey][data[currentKey].length - 1][nestedKv[1]] = stripQuotes(nestedKv[2]);
      continue;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();
      if (value === '') data[currentKey] = [];
      else if (value.startsWith('[') && value.endsWith(']'))
        data[currentKey] = value.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
      else data[currentKey] = stripQuotes(value);
    }
  }
  return { data, body };
}

/* ---------- 聯盟行銷廣告 ---------- */
// 博客來商品貼紙版型：high=直式高版(/0/7)、wide=橫式寬版(/1/3)
const BOOKS_STICK = { high: '0/7', wide: '1/3' };
const AP_ID = 'benson0618';   // 博客來 AP 推薦人代號（之後要換在這裡改）

// Hahow 好學校聯盟連結（整個平台共用一條；換連結只改這裡）
const HAHOW_URL = 'https://joymall.co/3Tker';

// 聯盟揭露聲明（統一管理，改一次全站生效）
const AFF_NOTE = {
  books: '※ 本連結為博客來聯盟行銷連結，透過它購書我會獲得少許回饋，不影響你的售價。',
  momo:  '※ 本連結為 momo 聯盟行銷連結，透過它購物我會獲得少許回饋，不影響你的售價。',
  shopee:'※ 本連結為蝦皮聯盟行銷連結，透過它購物我會獲得少許回饋，不影響你的售價。',
  hahow: '※ 本連結為 Hahow 好學校聯盟連結，連結導向 Hahow 平台（非特定課程頁）；透過它購課我會獲得少許回饋，不影響你的售價。',
  kkday: '※ 以上為 KKday 聯盟行銷廣告，透過它訂購行程我會獲得少許回饋，不影響你的售價。',
  cjlink:   '※ 本連結為通路王（iChannels）聯盟行銷連結，透過它購買我會獲得少許回饋，不影響你的售價。',
  pressplay:'※ 本連結為 PressPlay 聯盟行銷連結，透過它訂閱／購課我會獲得少許回饋，不影響你的售價。',
  link:  '※ 本連結為合作／聯盟連結，透過它購買我可能獲得少許回饋，不影響你的售價。',
};

// 按鈕式平台的預設標籤與按鈕文字（momo/蝦皮沿用舊行為不設標籤；通路王、PressPlay 給專屬標籤）
const BTN_PLATFORM = {
  cjlink:    { label: '🛒 通路王推薦', btn: '前往購買 →' },
  pressplay: { label: '🎓 線上課程・訂閱', btn: '看看這堂課 →' },
};

// 從博客來商品網址或純編號取出 10 碼商品編號
function booksProductId(input = '') {
  const s = String(input).trim();
  const m = s.match(/products\/(\d{10})/) || s.match(/^(\d{10})$/);
  return m ? m[1] : '';
}

// 包成統一的廣告區塊 HTML
function wrapAffiliate({ href, inner, note, label }) {
  const heading = label ? `<span class="affiliate-label">${escapeHtml(label)}</span>` : '';
  return `<div class="affiliate-box">
    ${heading}
    <a href="${href}" target="_blank" rel="noopener sponsored">${inner}</a>
    <p class="affiliate-note">${escapeHtml(note)}</p>
</div>`;
}

// 解析單一 ::aff ...:: 指令，回傳 HTML（解析失敗回傳提示註解，不中斷生成）
function renderAffiliate(raw) {
  const content = raw.trim();

  // 情況 1：直接貼博客來商品連結（最簡單）→ 自動帶 AP 代號、預設高版
  const bareBooksUrl = content.match(/^(https?:\/\/www\.books\.com\.tw\/\S+)(?:\s+(high|wide))?(?:\s+(.+))?$/i);
  if (bareBooksUrl && /books\.com\.tw/.test(bareBooksUrl[1])) {
    const pid = booksProductId(bareBooksUrl[1]);
    if (pid) {
      const variant = (bareBooksUrl[2] || 'high').toLowerCase();
      const stick = BOOKS_STICK[variant] || BOOKS_STICK.high;
      const label = bareBooksUrl[3] ? bareBooksUrl[3].trim() : '📖 想入手這本書';
      const href = `https://www.books.com.tw/exep/assp.php/${AP_ID}/products/${pid}?utm_source=${AP_ID}&utm_medium=ap-books&utm_content=recommend&utm_campaign=ap-affiliate`;
      const img = `<img src="https://ap.books.com.tw/web/apProductStick/${pid}/blue/${stick}" alt="博客來購書連結" loading="lazy">`;
      return wrapAffiliate({ href, inner: img, note: AFF_NOTE.books, label });
    }
  }

  // 情況 2：以空白分隔的參數式 → books / momo / shopee / link
  const parts = content.split(/\s+/);
  const platform = (parts[0] || '').toLowerCase();

  if (platform === 'books') {
    // 用法：books <商品編號或網址> [high|wide] [標題文字...]
    const pid = booksProductId(parts[1] || '');
    if (!pid) return `<!-- affiliate 解析失敗：books 缺少有效商品編號 -> ${escapeHtml(content)} -->`;
    let rest = parts.slice(2);
    let variant = 'high';
    if (rest[0] && /^(high|wide)$/i.test(rest[0])) { variant = rest[0].toLowerCase(); rest = rest.slice(1); }
    const stick = BOOKS_STICK[variant] || BOOKS_STICK.high;
    const label = rest.length ? rest.join(' ') : '📖 想入手這本書';
    const href = `https://www.books.com.tw/exep/assp.php/${AP_ID}/products/${pid}?utm_source=${AP_ID}&utm_medium=ap-books&utm_content=recommend&utm_campaign=ap-affiliate`;
    const img = `<img src="https://ap.books.com.tw/web/apProductStick/${pid}/blue/${stick}" alt="博客來購書連結" loading="lazy">`;
    return wrapAffiliate({ href, inner: img, note: AFF_NOTE.books, label });
  }

  // 情況 2.5：Hahow 好學校（整個平台共用一條聯盟連結，連結已內建）
  // 用法：hahow [標題文字] | [說明文字] | [按鈕文字]
  //   全部可省略，省略時用預設文案。連結固定用 HAHOW_URL。
  if (platform === 'hahow') {
    const afterPlatform = content.slice(platform.length).trim();
    const segs = afterPlatform ? afterPlatform.split('|').map(s => s.trim()) : [];
    const title = segs[0] || '想線上進修？來 Hahow 好學校看看';
    const desc  = segs[1] || '程式、設計、理財、語言都有，挑一堂有興趣的課開始學。';
    const btn   = segs[2] || '前往 Hahow 逛逛 →';
    const inner = `<span class="affiliate-card-title">${escapeHtml(title)}</span>` +
                  `<span class="affiliate-card-desc">${escapeHtml(desc)}</span>` +
                  `<span class="affiliate-btn">${escapeHtml(btn)}</span>`;
    return `<div class="affiliate-box affiliate-card">
    <span class="affiliate-label">🎓 線上學習</span>
    <a href="${HAHOW_URL}" target="_blank" rel="noopener sponsored">${inner}</a>
    <p class="affiliate-note">${escapeHtml(AFF_NOTE.hahow)}</p>
</div>`;
  }

  // 情況 2.6：KKday 動態商品廣告（靠外部 JS 動態渲染旅遊商品）
  // 用法：kkday [顯示數量，預設 3]
  //   腳本只需每頁載一次，實際的 <script> 由 renderArticle 統一注入頁尾。
  if (platform === 'kkday') {
    const amount = /^\d+$/.test(parts[1] || '') ? parts[1] : '3';
    return `<div class="affiliate-box affiliate-kkday">
    <span class="affiliate-label">✈️ 旅遊行程・體驗</span>
    <ins class="kkday-product-media" data-oid="13787" data-amount="${amount}" data-origin="https://kkpartners.kkday.com"></ins>
    <p class="affiliate-note">${escapeHtml(AFF_NOTE.kkday)}</p>
</div>`;
  }

  // 情況 3：按鈕式連結 — 用 | 分隔：平台 連結 | 按鈕文字 | 自訂揭露
  // 支援 link / momo / shopee / cjlink（通路王）/ pressplay
  // 例：link https://xxx | 看看這個工具
  //     momo https://xxx | 到 momo 購買
  //     cjlink https://ichannels... | 到通路王購買
  //     pressplay https://pressplay... | 看看這堂課
  if (platform === 'link' || platform === 'momo' || platform === 'shopee'
      || platform === 'cjlink' || platform === 'pressplay') {
    const afterPlatform = content.slice(platform.length).trim();
    const segs = afterPlatform.split('|').map(s => s.trim());
    const href = segs[0];
    if (!href || !/^https?:\/\//.test(href)) {
      return `<!-- affiliate 解析失敗：${escapeHtml(platform)} 缺少有效連結 -> ${escapeHtml(content)} -->`;
    }
    const preset = BTN_PLATFORM[platform] || {};
    const btnText = segs[1] || preset.btn || '前往查看 →';
    const note = segs[2] || AFF_NOTE[platform] || AFF_NOTE.link;
    const inner = `<span class="affiliate-btn">${escapeHtml(btnText)}</span>`;
    return wrapAffiliate({ href, inner, note, label: preset.label || '' });
  }

  return `<!-- affiliate 解析失敗：無法辨識的語法 -> ${escapeHtml(content)} -->`;
}

/* ---------- Markdown ---------- */
function inlineMarkdown(text) {
  let t = escapeHtml(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<img src="${src.trim()}" alt="${alt.trim()}" loading="lazy">`);
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${url.trim()}" rel="noopener">${label}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}
function markdownToHtml(md) {
  const lines = md.split('\n');
  const html = [];
  let i = 0, inList = null;
  const closeList = () => { if (inList) { html.push(`</${inList}>`); inList = null; } };
  while (i < lines.length) {
    const line = lines[i], trimmed = line.trim();
    if (!trimmed) { closeList(); i++; continue; }
    // 程式碼區塊（fenced code block）：``` 或 ```語言 開頭，到下一個 ``` 結束
    const fence = trimmed.match(/^```+\s*([A-Za-z0-9+#-]*)\s*$/);
    if (fence) {
      closeList();
      const lang = fence[1] || '';
      const code = [];
      i++;
      while (i < lines.length && !/^```+\s*$/.test(lines[i].trim())) { code.push(lines[i]); i++; }
      i++; // 跳過結尾的 ```
      const cls = lang ? ` class="language-${lang}"` : '';
      html.push(`<div class="code-wrap"><button class="code-copy" type="button" aria-label="複製程式碼">複製</button><pre class="code-block"><code${cls}>${escapeHtml(code.join('\n'))}</code></pre></div>`);
      continue;
    }
    // 聯盟行銷廣告：整行為 ::aff ...:: 時展開成廣告區塊
    const affMatch = trimmed.match(/^::aff\s+([\s\S]+?)::$/i);
    if (affMatch) { closeList(); html.push(renderAffiliate(affMatch[1])); i++; continue; }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) { closeList(); const lv = Math.min(Math.max(heading[1].length, 2), 5); html.push(`<h${lv}>${inlineMarkdown(heading[2])}</h${lv}>`); i++; continue; }
    if (trimmed.startsWith('> ')) {
      closeList(); const q = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) { q.push(lines[i].trim().slice(2)); i++; }
      html.push(`<blockquote>${inlineMarkdown(q.join(' '))}</blockquote>`); continue;
    }
    if (trimmed.startsWith('|') && i + 1 < lines.length &&
        /^\|?[\s:-]*-[\s:|-]*\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
      closeList();
      const splitRow = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const headers = splitRow(lines[i]); i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(splitRow(lines[i])); i++; }
      let table = '<div class="table-wrap"><table><thead><tr>' + headers.map(h => `<th>${inlineMarkdown(h)}</th>`).join('') + '</tr></thead><tbody>';
      for (const row of rows) table += '<tr>' + row.map(c => `<td>${inlineMarkdown(c)}</td>`).join('') + '</tr>';
      table += '</tbody></table></div>';
      html.push(table); continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) { closeList(); html.push('<hr>'); i++; continue; }
    if (/^[-*]\s+/.test(trimmed)) { if (inList !== 'ul') { closeList(); html.push('<ul>'); inList = 'ul'; } html.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</li>`); i++; continue; }
    if (/^\d+\.\s+/.test(trimmed)) { if (inList !== 'ol') { closeList(); html.push('<ol>'); inList = 'ol'; } html.push(`<li>${inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</li>`); i++; continue; }
    const imgOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgOnly) { closeList(); html.push(`<figure><img src="${imgOnly[2].trim()}" alt="${imgOnly[1].trim()}" loading="lazy"></figure>`); i++; continue; }
    closeList();
    const para = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|[-*]\s|\d+\.\s|>\s|-{3,}|\*{3,}|\|)/.test(lines[i].trim())) { para.push(lines[i]); i++; }
    html.push(`<p>${inlineMarkdown(para.join(' '))}</p>`);
  }
  closeList();
  return html.join('\n');
}

/* ---------- 共用片段 ---------- */
function navbar(active) {
  const on = (k) => active === k ? ' class="active"' : '';
  return `<nav class="navbar">
    <div class="nav-container">
        <a href="index.html" class="logo"><span class="cat">🐾</span>智慧喵</a>
        <button class="menu-toggle" aria-label="開啟選單">☰</button>
        <ul class="nav-links">
            <li><a href="index.html"${on('home')}>首頁</a></li>
            <li><a href="invest.html"${on('invest')}>投資理財修煉</a></li>
            <li><a href="appdev.html"${on('appdev')}>App 開發指南</a></li>
            <li><a href="tools.html"${on('tools')}>我的工具</a></li>
            <li><a href="about.html" class="btn-nav">關於</a></li>
        </ul>
    </div>
</nav>`;
}
function footer() {
  return `<footer class="footer">
    <div class="container">
        <div class="footer-inner">
            <div class="footer-brand"><h4>🐾 智慧喵</h4><p>理財 · 旅遊 · 生活</p></div>
            <div class="footer-links">
                <a href="index.html">首頁</a>
                <a href="invest.html">投資理財修煉</a>
                <a href="appdev.html">App 開發指南</a>
                <a href="tools.html">我的工具</a>
                <a href="about.html">關於</a>
                <a href="${YT_URL}" rel="noopener">YouTube</a>
            </div>
        </div>
        <p class="footer-copy">&copy; 2026 智慧喵. All rights reserved.</p>
    </div>
</footer>
<script>document.querySelector('.menu-toggle').addEventListener('click',function(){document.querySelector('.nav-links').classList.toggle('active');});</script>`;
}

/* ---------- 讀文章 ---------- */
function collectMd(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...collectMd(full));
    else if (e.endsWith('.md') && e.toLowerCase() !== 'readme.md') out.push(full);
  }
  return out;
}
function loadArticles() {
  const arts = [];
  for (const file of collectMd(CONTENT_DIR)) {
    const { data, body } = parseFrontMatter(readFileSync(file, 'utf8'));
    if (!data.slug || !data.title) { console.warn(`⚠ 略過（缺 slug/title）：${file}`); continue; }
    arts.push({ ...data, status: (data.status || 'draft').toLowerCase(), body });
  }
  return arts;
}

/* ---------- 文章頁 ---------- */
function renderArticle(a) {
  const { title, description = '', keywords = [], slug, date = '', author = '智慧喵',
          category = '生活', cover_alt = '', images = [], youtube = '', youtube_title = '', body } = a;
  const kw = Array.isArray(keywords) ? keywords.join(',') : keywords;
  const url = `${SITE_URL}/${slug}.html`;
  const cover = images && images[0] ? `assets/${slug}/${images[0].file}` : '';
  const coverUrl = cover ? `${SITE_URL}/${cover}` : '';
  const catClass = CAT_CLASS[category] !== undefined ? CAT_CLASS[category] : '';
  const ytId = youtubeId(youtube);
  const videoLabel = youtube_title ? `🎬 ${escapeHtml(youtube_title)}` : '🎬 影片版';
  const videoHint = ytId ? `<p class="video-hint">🎬 這篇也有影片版，可以搭配<a href="#article-video">文末的影片</a>一起看。</p>\n` : '';
  const videoBlock = ytId ? `
        <div class="article-video" id="article-video">
            <p class="article-video-label">${videoLabel}</p>
            <div class="video-embed"><iframe src="https://www.youtube.com/embed/${ytId}" title="${escapeHtml(youtube_title || title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>
        </div>` : '';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title, description,
    datePublished: date, dateModified: date,
    author: { '@type': 'Person', name: author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
  if (coverUrl) jsonLd.image = coverUrl;
  const bodyHtml = markdownToHtml(body);
  // KKday 動態廣告需要的外部腳本：整頁只注入一次（不論放幾個廣告）
  const kkdayScript = bodyHtml.includes('kkday-product-media')
    ? '\n<script type="text/javascript" src="https://kkpartners.kkday.com/iframe.init.1.0.js"></script>'
    : '';
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${gaSnippet()}
    <title>${escapeHtml(title)} - 智慧喵</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(kw)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">${coverUrl ? `\n    <meta property="og:image" content="${coverUrl}">` : ''}
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="style.css">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
${navbar(null)}
<article class="article">
    <header class="article-header">
        <div class="container article-container">
            <span class="post-tag ${catClass}">${escapeHtml(category)}</span>
            <h1>${escapeHtml(title)}</h1>
            <p class="article-meta">${escapeHtml(author)}　•　${escapeHtml(date)}</p>
        </div>
    </header>
    ${cover ? `<div class="container article-container"><img class="article-cover" src="${cover}" alt="${escapeHtml(cover_alt || title)}" loading="lazy"></div>` : ''}
    <div class="container article-container">
        <div class="article-body">
${videoHint}${bodyHtml}
        </div>${videoBlock}
        <div class="sub-cta">
            <div class="sub-cta-text">
                <strong>喜歡這篇的話，來 YouTube 找我 🐾</strong>
                <span>訂閱智慧喵，收看理財、投資與工具的影片分享</span>
            </div>
            <a href="${YT_URL}?sub_confirmation=1" class="btn-yt" rel="noopener">訂閱頻道</a>
        </div>
        <div class="article-back"><a href="index.html">← 回文章列表</a></div>
    </div>
</article>
${footer()}
<script>
document.querySelectorAll('.code-copy').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var pre = btn.parentElement.querySelector('code');
    if (!pre) return;
    var text = pre.innerText;
    navigator.clipboard.writeText(text).then(function () {
      var old = btn.textContent;
      btn.textContent = '已複製';
      btn.classList.add('copied');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('copied'); }, 1500);
    }).catch(function () {
      btn.textContent = '複製失敗';
      setTimeout(function () { btn.textContent = '複製'; }, 1500);
    });
  });
});
</script>${kkdayScript}
</body>
</html>`;
}

/* ---------- 列表頁 ---------- */
function renderIndex(arts) {
  const card = (a) => {
    const cover = a.images && a.images[0] ? `assets/${a.slug}/${a.images[0].file}` : '';
    const catClass = CAT_CLASS[a.category] !== undefined ? CAT_CLASS[a.category] : '';
    const hasVideo = !!youtubeId(a.youtube || '');
    const videoBadge = hasVideo ? '<span class="card-video-badge" title="含影片">🎬</span>' : '';
    return `            <a class="post-card" href="${a.slug}.html" data-category="${escapeHtml(a.category || '生活')}">
                <div class="post-card-cover-wrap">
                ${cover ? `<img class="post-card-cover" src="${cover}" alt="${escapeHtml(a.cover_alt || a.title)}" loading="lazy">` : '<div class="post-card-cover"></div>'}${videoBadge}
                </div>
                <div class="post-card-body">
                    <span class="post-tag ${catClass}">${escapeHtml(a.category || '生活')}</span>
                    <h3>${escapeHtml(a.title)}</h3>
                    <p class="post-date">${escapeHtml(a.date || '')}</p>
                    <p class="excerpt">${escapeHtml(a.description || '')}</p>
                </div>
            </a>`;
  };
  const cards = arts.map(card).join('\n');
  const empty = `<p style="text-align:center;color:#94a3b8;padding:60px 0;">文章即將登場，敬請期待 🐾</p>`;
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${gaSnippet()}
    <title>智慧喵 - 理財 · 旅遊 · 生活</title>
    <meta name="description" content="智慧喵的生活部落格：理財教學、旅遊工具與生活分享，順便介紹我自己開發的實用軟體。">
    <meta name="keywords" content="智慧喵,理財教學,旅遊工具,生活部落格,個人理財,投資">
    <meta property="og:title" content="智慧喵 - 理財 · 旅遊 · 生活">
    <meta property="og:description" content="理財教學、旅遊工具與生活分享。">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}/">
    <link rel="canonical" href="${SITE_URL}/">
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="style.css">
</head>
<body>
${navbar('home')}
<section class="hero">
    <div class="hero-content">
        <h1>你好，我是<em>智慧喵</em> 🐾</h1>
        <p class="hero-subtitle">分享理財教學、好用的旅遊工具，還有生活中的大小事<br>順便聊聊我自己開發的實用軟體</p>
        <a href="tools.html" class="btn-primary">看看我做的工具</a>
    </div>
</section>
<section class="page-content">
    <div class="container">
        <div class="cat-filter">
            <button class="filter-btn active" data-filter="all">全部</button>
            <button class="filter-btn" data-filter="投資理財">投資理財</button>
            <button class="filter-btn" data-filter="科技">科技</button>
            <button class="filter-btn" data-filter="旅遊">旅遊</button>
            <button class="filter-btn" data-filter="生活">生活</button>
        </div>
        <div class="post-grid">
${arts.length ? cards : ''}
        </div>
        ${arts.length ? '' : empty}
    </div>
</section>
${footer()}
<script>
document.querySelectorAll('.filter-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
        document.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        var f = btn.getAttribute('data-filter');
        document.querySelectorAll('.post-card').forEach(function(c){
            c.style.display = (f === 'all' || c.getAttribute('data-category') === f) ? '' : 'none';
        });
    });
});
</script>
</body>
</html>`;
}

/* ---------- sitemap ---------- */
function renderSitemap(arts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/invest.html</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/appdev.html</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/tools.html</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/about.html</loc><lastmod>${today}</lastmod></url>`];
  for (const a of arts) urls.push(`  <url><loc>${SITE_URL}/${a.slug}.html</loc><lastmod>${a.date || today}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/* ---------- 主流程 ---------- */
async function main() {
  console.log('🐾 智慧喵部落格產生器啟動…\n');
  const t0 = Date.now();
  const imgStart = Date.now();
  await optimizeImages();
  const imgSec = ((Date.now() - imgStart) / 1000).toFixed(1);
  const all = loadArticles();
  const pub = all.filter(a => a.status === 'approved' || a.status === 'published')
    .sort((a, b) => {
      // 主要：日期新到舊
      const byDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (byDate !== 0) return byDate;
      // 次要：同日期時，依 order 由大到小（篇號大＝較新，排前面；沒填 order 的排在有填的後面）
      const oa = a.order !== undefined && a.order !== '' ? Number(a.order) : -Infinity;
      const ob = b.order !== undefined && b.order !== '' ? Number(b.order) : -Infinity;
      return ob - oa;
    });
  const drafts = all.filter(a => a.status === 'draft');
  console.log(`  找到文章：${all.length} 篇（發布 ${pub.length}、草稿 ${drafts.length}）`);
  drafts.forEach(d => console.log(`    - [草稿] ${d.title} (${d.slug})`));
  for (const a of pub) {
    writeFileSync(join(LIFE_ROOT, `${a.slug}.html`), renderArticle(a), 'utf8');
    console.log(`  ✔ 文章：life/${a.slug}.html`);
  }
  writeFileSync(join(LIFE_ROOT, 'index.html'), renderIndex(pub), 'utf8');
  console.log('  ✔ 列表：life/index.html');
  writeFileSync(join(LIFE_ROOT, 'sitemap.xml'), renderSitemap(pub), 'utf8');
  console.log('  ✔ sitemap：life/sitemap.xml');
  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ 完成（共 ${totalSec} 秒，其中圖片優化 ${imgSec} 秒）。`);
}
main().catch(err => { console.error('❌ 產生失敗：', err); process.exit(1); });
