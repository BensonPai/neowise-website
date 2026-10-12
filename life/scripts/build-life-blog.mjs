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
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, renameSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';
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

// 列表頁每頁顯示幾篇文章（文章變多時由前端分頁，不會一次全載）
const POSTS_PER_PAGE = 12;

/* ---------- 系列設定表 ----------
 * 每個「系列目錄頁」的編排資訊集中在這裡。文章只要在 front-matter 標：
 *   series: <這裡的 key>      例：csharp
 *   series_stage: <階段 key>  例：基礎        （對應下方 stages[].key）
 *   series_order: <數字>      例：2           （決定編號與同階段排序；數字會直接當圓圈內的號碼）
 * 腳本會自動把同系列文章依階段分組、產生目錄頁 <key>.html。
 *
 * 欄位說明：
 *   navLabel  導覽列/頁尾顯示的名稱
 *   group     'academy' = 收進「科技學院」下拉；其他（如 'invest'）維持獨立
 *   pageClass <body> 的 class，用來在 style.css 做主題色覆蓋（如 page-appdev / page-csharp）
 *   title/subtitle 目錄頁 page-header 的大標與副標
 *   metaDescription/metaKeywords 目錄頁 SEO
 *   intro     series-intro 區塊的段落陣列（HTML 片段，支援 inline 樣式字串）
 *   stages    各階段：key 用於文章對應、badge 徽章文字、title 階段標題、desc 階段說明
 *   ytText    YouTube CTA 的副標文案
 */
const SERIES = {
  appdev: {
    navLabel: 'App 開發指南',
    group: 'academy',
    pageClass: 'page-appdev',
    title: 'App 開發完整指南 🐾',
    subtitle: '從 iPhone 到 Android，一條扎實的系統學習路徑，帶你從零做出並上架自己的 App',
    metaDescription: '智慧喵的 App 開發完整指南系列目錄：從 iPhone（iOS）到 Android，涵蓋開發工具、開發流程、上架商店、費用與賺錢方式，一條扎實的系統學習路徑，帶你從零做出並上架自己的 App。',
    metaKeywords: 'App 開發,iOS 開發,Android 開發,iPhone App 教學,Swift,Kotlin,SwiftUI,Jetpack Compose,App 上架,跨平台開發,智慧喵',
    intro: [
      '想做一個 App，卻不知道從哪裡開始？這個系列把整條路攤開來：先用一篇總覽建立全貌（工具、流程、上架、費用、賺錢），再分成 iOS 與 Android 兩條對稱的學習路徑，一步步從裝環境、學語言、做畫面、串資料，走到上架與變現。',
      '走的是「扎實系統學習」路線，不是速成班。建議先看總覽篇，再挑一個平台（iOS 或 Android）從頭走完；學過一個平台再學另一個會快很多。每篇文章底部都有系列導覽連結。',
      '<span style="color:#94a3b8;font-size:0.86rem;">※ 文中費用、版本、上架規則等均標註查證時間，技術演進快，實際請以各官方文件為準。</span>',
    ],
    stages: [
      { key: '總覽', badge: '總覽', title: '先看全貌', desc: '一篇看懂開發工具、流程、上架、費用與賺錢方式，決定你該先學哪個平台。' },
      { key: 'iOS', badge: 'iOS', title: 'iPhone 開發路徑', desc: '用 Swift + SwiftUI，從環境準備一路到上架 App Store 與變現。' },
      { key: 'Android', badge: 'Android', title: 'Android 開發路徑', desc: '用 Kotlin + Jetpack Compose，結構與 iOS 對稱；學過 iOS 再學會快很多。' },
      { key: '補充', badge: '補充', title: '跨平台方案', desc: '學原生要學兩套，想「寫一次兩邊共用」？這篇幫你選型。' },
    ],
    ytText: '影片版的 App 開發教學、程式與工具分享，歡迎來看看',
  },

  csharp: {
    navLabel: 'C# 教學',
    group: 'academy',
    pageClass: 'page-csharp',
    title: 'C# 程式設計完整教學 🐾',
    subtitle: '從零開始學 C#，一條循序漸進的路徑，帶你從語法基礎走到實戰應用',
    metaDescription: '智慧喵的 C# 程式設計完整教學系列目錄：從開發環境、語法基礎、物件導向，到進階主題與實戰專案，一條循序漸進的學習路徑，適合完全沒寫過程式或想系統補強 C# 的人。',
    metaKeywords: 'C#,C sharp,C# 教學,.NET,Visual Studio,物件導向,程式設計入門,C# 入門,智慧喵',
    intro: [
      '想學 C#，卻被滿坑滿谷的教學搞得更亂？這個系列把 C# 從頭到尾鋪成一條路：先裝好環境、打穩語法基礎，再進入物件導向與進階主題，最後用實戰專案把學到的串起來。',
      '走的是「循序漸進、重觀念」路線。建議從第一篇環境準備開始照順序走；每個主題都盡量用能動手跑的小範例說明。每篇文章底部都有系列導覽連結。',
      '<span style="color:#94a3b8;font-size:0.86rem;">※ 文中版本、工具與 API 均標註查證時間，實際請以 .NET / Microsoft Learn 官方文件為準。</span>',
    ],
    stages: [
      { key: '總覽', badge: '總覽', title: '先看全貌', desc: '一篇看懂 C# 能做什麼、要裝什麼、這個系列會帶你走到哪。' },
      { key: '基礎', badge: '基礎', title: '語法基礎', desc: '變數與型別、流程控制、方法與例外處理，打穩寫 C# 的地基。' },
      { key: '物件導向', badge: 'OOP', title: '物件導向', desc: '類別與物件、封裝繼承多型、介面與泛型，寫出結構良好的程式。' },
      { key: '進階', badge: '進階', title: '進階主題', desc: '集合與 LINQ、非同步、檔案與資料存取等實用進階主題。' },
      { key: '實戰', badge: '實戰', title: '實戰專案', desc: '把前面學到的整合起來，做出一個完整的小專案。' },
    ],
    ytText: '影片版的 C# 與程式教學、工具分享，歡迎來看看',
  },

  invest: {
    navLabel: '投資理財修煉',
    group: 'invest',          // 獨立，不收進科技學院下拉
    pageClass: '',            // 用預設紫色主題
    title: '投資理財修煉 🐾',
    subtitle: '從零開始，把投資一步步學會、學透的完整學習地圖',
    metaDescription: '智慧喵的投資理財修煉系列目錄：從入門的理財心法、進階的投資招式，到高手的財務自由修煉，一步步把投資學會、學透的完整學習地圖。',
    metaKeywords: '投資理財,投資入門,資產配置,ETF,技術分析,基本面分析,財務自由,智慧喵',
    intro: [
      '這是我自己的投資學習記錄。我把它整理成一條由淺入深的路徑：先建立正確的觀念與心態（入門篇），再認識各種投資工具與分析方法（進階篇），最後走向被動收入與財務自由的規劃（高手篇）。',
      '建議照順序閱讀，也歡迎挑有興趣的主題直接看。每篇文章底部都有「上一篇／下一篇」連結，方便你順著走。',
      '<span style="color:#94a3b8;font-size:0.86rem;">※ 本系列為個人學習記錄與知識整理，非投資建議。投資有風險，請獨立判斷。</span>',
    ],
    stages: [
      { key: '入門篇', badge: '入門篇', title: '理財心法', desc: '先把觀念與心態打穩，這是所有投資的地基。' },
      { key: '進階篇', badge: '進階篇', title: '投資招式', desc: '認識各種投資工具與分析方法，開始實作。' },
      { key: '高手篇', badge: '高手篇', title: '財務自由修煉', desc: '把投資變成長期的財務策略，走向自由。' },
    ],
    ytText: '影片版的理財、投資與工具分享，歡迎來看看',
  },
};

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

/* ---------- 副檔名正規化 ---------- */
// GitHub Pages 跑在 Linux、檔名大小寫敏感；但 Markdown 連結慣用小寫 .jpg。
// 這裡把 assets 下所有圖檔的大寫副檔名（.JPG/.JPEG/.PNG/.WEBP…）統一改成小寫，
// 避免「本機看得到、上線卻破圖」。Windows 檔名不分大小寫，故用兩段式改名避免同名衝突。
function normalizeImageExtensions(dir) {
  if (!existsSync(dir)) return 0;
  let renamed = 0;
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const full = join(d, e);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      const ext = extname(e);                 // 含點，例：".JPG"
      if (!ext || !IMG_EXT.test(e)) continue;
      const lower = ext.toLowerCase();
      if (ext === lower) continue;            // 已是小寫，不動
      const base = e.slice(0, e.length - ext.length);
      const tmp = join(d, base + ext + '.tmprename');
      const dest = join(d, base + lower);
      try {
        renameSync(full, tmp);                // 第一段：改暫存名
        renameSync(tmp, dest);                // 第二段：改成小寫副檔名
        const rel = dest.slice(LIFE_ROOT.length + 1).replace(/\\/g, '/');
        console.log(`  ↻ 副檔名正規化：${e} → ${rel.split('/').pop()}`);
        renamed++;
      } catch (err) {
        console.warn(`  ⚠ 副檔名正規化失敗（略過）：${e} — ${err.message}`);
      }
    }
  };
  walk(dir);
  return renamed;
}

/* ---------- 自動縮圖 ---------- */
// 掃描 assets 下所有圖檔，寬度超過 MAX_IMG_WIDTH 就等比縮小並「覆寫原檔」。
// 已在範圍內的圖不動，避免重複壓縮失真。
async function optimizeImages() {
  if (!existsSync(ASSETS_DIR)) return;
  // 先統一副檔名大小寫（即使沒裝 sharp 也要做，否則上線會破圖）
  normalizeImageExtensions(ASSETS_DIR);
  if (!sharp) return;
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
  kkdaylink: '※ 本連結為 KKday 聯盟行銷連結，透過它訂購行程我會獲得少許回饋，不影響你的售價。',
  cjlink:   '※ 本連結為通路王（iChannels）聯盟行銷連結，透過它購買我會獲得少許回饋，不影響你的售價。',
  pressplay:'※ 本連結為 PressPlay 聯盟行銷連結，透過它訂閱／購課我會獲得少許回饋，不影響你的售價。',
  link:  '※ 本連結為合作／聯盟連結，透過它購買我可能獲得少許回饋，不影響你的售價。',
};

// 按鈕式平台的預設標籤與按鈕文字（momo/蝦皮沿用舊行為不設標籤；通路王、PressPlay 給專屬標籤）
const BTN_PLATFORM = {
  cjlink:    { label: '🛒 通路王推薦', btn: '前往購買 →' },
  pressplay: { label: '🎓 線上課程・訂閱', btn: '看看這堂課 →' },
  kkday:     { label: '✈️ 旅遊行程・體驗', btn: '到 KKday 看看 →' },
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

  // 情況 2.6：KKday
  //   (a) 按鈕式單一行程：kkday <商品連結> | [按鈕文字] | [自訂揭露]
  //       —— 第一個參數是 http(s) 連結時走此分支，導向你指定的單一行程頁。
  //   (b) 動態商品廣告：kkday [顯示數量，預設 3]
  //       —— 沒給連結（空或純數字）時維持原本行為，靠外部 JS 動態輪播旅遊商品，
  //          腳本只需每頁載一次，實際的 <script> 由 renderArticle 統一注入頁尾。
  if (platform === 'kkday') {
    const afterPlatform = content.slice(platform.length).trim();
    // (a) 按鈕式：以連結開頭
    if (/^https?:\/\//i.test(afterPlatform)) {
      const segs = afterPlatform.split('|').map(s => s.trim());
      const href = segs[0];
      const preset = BTN_PLATFORM.kkday;
      const btnText = segs[1] || preset.btn;
      const note = segs[2] || AFF_NOTE.kkdaylink;
      const inner = `<span class="affiliate-btn">${escapeHtml(btnText)}</span>`;
      return wrapAffiliate({ href, inner, note, label: preset.label });
    }
    // (b) 動態廣告：空或純數字
    const amount = /^\d+$/.test(afterPlatform) ? afterPlatform : '3';
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
// 導覽列。active 可為 'home'/'invest'/'tools'，或某個系列 key（如 'appdev'/'csharp'），
// 系列 key 會讓「科技學院」父項與對應子項同時高亮。
function navbar(active) {
  const on = (k) => active === k ? ' class="active"' : '';
  // 「科技學院」下拉：列出所有「科技系列」（SERIES 中 group === 'academy' 者）
  const academyKeys = Object.keys(SERIES).filter(k => SERIES[k].group === 'academy');
  const academyOpen = academyKeys.includes(active);   // 目前頁屬於科技學院任一系列
  const academyItems = academyKeys.map(k =>
    `                <li><a href="${k}.html"${on(k)}>${SERIES[k].navLabel}</a></li>`
  ).join('\n');
  return `<nav class="navbar">
    <div class="nav-container">
        <a href="index.html" class="logo"><span class="cat">🐾</span>智慧喵</a>
        <button class="menu-toggle" aria-label="開啟選單">☰</button>
        <ul class="nav-links">
            <li><a href="index.html"${on('home')}>首頁</a></li>
            <li><a href="invest.html"${on('invest')}>投資理財修煉</a></li>
            <li class="has-dropdown${academyOpen ? ' open' : ''}">
                <a href="#" class="dropdown-toggle${academyOpen ? ' active' : ''}" aria-haspopup="true" aria-expanded="false">科技學院 <span class="caret">▾</span></a>
                <ul class="dropdown-menu">
${academyItems}
                </ul>
            </li>
            <li><a href="tools.html"${on('tools')}>我的工具</a></li>
            <li><a href="about.html" class="btn-nav">關於</a></li>
        </ul>
    </div>
</nav>`;
}

// 導覽列下拉所需的互動 JS（手機點擊展開、桌機 hover 由 CSS 處理）。
// 與 footer 的 menu-toggle 併在一起輸出。
function navbarScript() {
  return `<script>
document.querySelector('.menu-toggle').addEventListener('click',function(){document.querySelector('.nav-links').classList.toggle('active');});
document.querySelectorAll('.has-dropdown > .dropdown-toggle').forEach(function(t){
    t.addEventListener('click',function(e){ e.preventDefault(); t.parentElement.classList.toggle('open'); });
});
</script>`;
}
function footer() {
  return `<footer class="footer">
    <div class="container">
        <div class="footer-inner">
            <div class="footer-brand"><h4>🐾 智慧喵</h4><p>理財 · 旅遊 · 生活</p></div>
            <div class="footer-links">
                <a href="index.html">首頁</a>
                <a href="invest.html">投資理財修煉</a>
${Object.keys(SERIES).filter(k => SERIES[k].group === 'academy').map(k => `                <a href="${k}.html">${SERIES[k].navLabel}</a>`).join('\n')}
                <a href="tools.html">我的工具</a>
                <a href="about.html">關於</a>
                <a href="${YT_URL}" rel="noopener">YouTube</a>
            </div>
        </div>
        <p class="footer-copy">&copy; 2026 智慧喵. All rights reserved.</p>
    </div>
</footer>
${navbarScript()}`;
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
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
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
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
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
        ${arts.length ? '<nav class="pagination" aria-label="文章分頁"></nav>' : empty}
    </div>
</section>
${footer()}
<script>
(function(){
    var PER_PAGE = ${POSTS_PER_PAGE};
    var cards = Array.prototype.slice.call(document.querySelectorAll('.post-card'));
    var pagination = document.querySelector('.pagination');
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
    var currentFilter = 'all';
    var currentPage = 1;

    // 取得符合目前分類的文章卡片
    function matched(){
        return cards.filter(function(c){
            return currentFilter === 'all' || c.getAttribute('data-category') === currentFilter;
        });
    }

    // 依目前分類與頁碼，決定每張卡片顯示與否
    function applyView(){
        var list = matched();
        var totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;
        var start = (currentPage - 1) * PER_PAGE;
        var end = start + PER_PAGE;
        cards.forEach(function(c){ c.style.display = 'none'; });
        list.slice(start, end).forEach(function(c){ c.style.display = ''; });
        renderPagination(totalPages);
    }

    // 產生分頁列（含省略號），單頁時隱藏
    function renderPagination(totalPages){
        if (!pagination) return;
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        var frag = document.createDocumentFragment();
        var addBtn = function(label, page, opts){
            opts = opts || {};
            var b = document.createElement('button');
            b.className = 'page-btn' + (opts.active ? ' active' : '');
            b.textContent = label;
            if (opts.disabled) { b.disabled = true; }
            else { b.addEventListener('click', function(){ goTo(page); }); }
            frag.appendChild(b);
        };
        var addGap = function(){
            var s = document.createElement('span');
            s.className = 'page-gap';
            s.textContent = '…';
            frag.appendChild(s);
        };

        addBtn('‹', currentPage - 1, { disabled: currentPage === 1 });

        // 頁碼顯示策略：永遠顯示首尾頁，當前頁前後各一頁，其餘用省略號
        var pages = [];
        for (var p = 1; p <= totalPages; p++){
            if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) pages.push(p);
        }
        var prev = 0;
        pages.forEach(function(p){
            if (p - prev > 1) addGap();
            addBtn(String(p), p, { active: p === currentPage });
            prev = p;
        });

        addBtn('›', currentPage + 1, { disabled: currentPage === totalPages });
        pagination.appendChild(frag);
    }

    // 切頁並捲回列表頂端
    function goTo(page){
        currentPage = page;
        applyView();
        var grid = document.querySelector('.post-grid');
        if (grid) window.scrollTo({ top: grid.offsetTop - 80, behavior: 'smooth' });
    }

    filterBtns.forEach(function(btn){
        btn.addEventListener('click', function(){
            filterBtns.forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            currentPage = 1;      // 換分類時回到第一頁
            applyView();
        });
    });

    applyView();
})();
</script>
</body>
</html>`;
}

/* ---------- 系列目錄頁（資料驅動） ----------
 * 依 SERIES[key] 的 stages 定義，把 posts（已篩出屬於此系列的文章）分組排序，
 * 產生一頁「階段 → 編號卡片」的目錄頁，輸出成 <key>.html。
 * 文章用 series_order 決定圓圈內的編號與同階段排序：
 *   - 數字（如 2）→ 圓圈顯示數字，依數字排序
 *   - 非數字（如「總」「跨」）→ 當作特別編號，套 toc-num-extra 樣式，排在數字後面
 */
function renderSeriesToc(key, posts) {
  const cfg = SERIES[key];
  if (!cfg) return '';
  const esc = escapeHtml;

  // 分組：stageKey -> 該階段文章陣列
  const byStage = {};
  for (const s of cfg.stages) byStage[s.key] = [];
  const orphan = [];   // 標了 series 但 series_stage 不在定義內的，收集起來印警告
  for (const p of posts) {
    const st = p.series_stage || '';
    if (byStage[st]) byStage[st].push(p);
    else orphan.push(p);
  }
  if (orphan.length) {
    orphan.forEach(p => console.warn(`  ⚠ 系列「${key}」文章 series_stage 無法對應（略過排入目錄）：${p.slug}（stage=${p.series_stage || '空'}）`));
  }

  // 排序輔助：數字 series_order 在前（由小到大），非數字在後
  const orderVal = (p) => {
    const v = p.series_order;
    if (v === undefined || v === '') return Number.POSITIVE_INFINITY;
    const n = Number(v);
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  };
  const sortStage = (list) => list.slice().sort((a, b) => {
    const d = orderVal(a) - orderVal(b);
    if (d !== 0) return d;
    return String(a.series_order || '').localeCompare(String(b.series_order || ''));
  });

  // 單篇卡片
  const tocItem = (p) => {
    const raw = p.series_order;
    const isNum = raw !== undefined && raw !== '' && !Number.isNaN(Number(raw));
    const numCls = isNum ? 'toc-num' : 'toc-num toc-num-extra';
    const numText = isNum ? esc(String(Number(raw))) : esc(String(raw || '•'));
    const hasVideo = !!youtubeId(p.youtube || '');
    const videoTag = hasVideo ? ' <span class="toc-video">🎬 有影片</span>' : '';
    // 目錄頁顯示標題：去掉標題開頭的【...】系列前綴，讓目錄更乾淨
    const cleanTitle = String(p.title || '').replace(/^【[^】]*】/, '');
    const desc = p.toc_desc || p.description || '';
    return `                <li class="toc-item">
                    <span class="${numCls}">${numText}</span>
                    <div class="toc-body">
                        <h3><a href="${p.slug}.html">${esc(cleanTitle)}</a>${videoTag}</h3>
                        <p>${esc(desc)}</p>
                    </div>
                </li>`;
  };

  // 各階段區塊（空階段不輸出）
  const stagesHtml = cfg.stages.map(s => {
    const list = sortStage(byStage[s.key] || []);
    if (!list.length) return '';
    return `        <div class="series-stage">
            <h2><span class="stage-badge">${esc(s.badge)}</span>${esc(s.title)}</h2>
            <p class="stage-desc">${esc(s.desc)}</p>
            <ol class="toc-list">
${list.map(tocItem).join('\n')}
            </ol>
        </div>`;
  }).filter(Boolean).join('\n\n');

  const introHtml = (cfg.intro || []).map(p => `            <p>${p}</p>`).join('\n');
  const bodyClass = cfg.pageClass ? ` class="${cfg.pageClass}"` : '';
  const url = `${SITE_URL}/${key}.html`;
  const empty = `<p style="text-align:center;color:#94a3b8;padding:40px 0;">本系列文章即將登場，敬請期待 🐾</p>`;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${gaSnippet()}
    <title>${esc(cfg.title.replace(/\s*🐾\s*$/, ''))} 全系列目錄 - 智慧喵</title>
    <meta name="description" content="${esc(cfg.metaDescription || '')}">
    <meta name="keywords" content="${esc(cfg.metaKeywords || '')}">
    <meta property="og:title" content="${esc(cfg.title.replace(/\s*🐾\s*$/, ''))} 全系列目錄 - 智慧喵">
    <meta property="og:description" content="${esc(cfg.subtitle || '')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="style.css">
</head>
<body${bodyClass}>
${navbar(key)}

<section class="page-header">
    <h1>${esc(cfg.title)}</h1>
    <p>${esc(cfg.subtitle || '')}</p>
</section>

<section class="page-content">
    <div class="series-toc">
        <div class="series-intro">
${introHtml}
        </div>

${stagesHtml || '        ' + empty}
    </div>

    <div class="yt-cta">
        <h2>🎬 訂閱智慧喵 YouTube 頻道</h2>
        <p>${esc(cfg.ytText || '影片版的教學與工具分享，歡迎來看看')}</p>
        <a href="${YT_URL}?sub_confirmation=1" class="btn-yt" rel="noopener">訂閱 YouTube 頻道</a>
    </div>
</section>
${footer()}
</body>
</html>`;
}

/* ---------- sitemap ---------- */
function renderSitemap(arts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/tools.html</loc><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${SITE_URL}/about.html</loc><lastmod>${today}</lastmod></url>`];
  // 系列目錄頁（appdev.html / csharp.html / invest.html …）由 SERIES 動態列出
  for (const key of Object.keys(SERIES)) urls.push(`  <url><loc>${SITE_URL}/${key}.html</loc><lastmod>${today}</lastmod></url>`);
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

  // 系列目錄頁：把帶 series 的文章分組，逐系列產生 <key>.html
  for (const key of Object.keys(SERIES)) {
    const seriesPosts = pub.filter(a => a.series === key);
    writeFileSync(join(LIFE_ROOT, `${key}.html`), renderSeriesToc(key, seriesPosts), 'utf8');
    console.log(`  ✔ 系列目錄：life/${key}.html（${seriesPosts.length} 篇）`);
  }

  writeFileSync(join(LIFE_ROOT, 'sitemap.xml'), renderSitemap(pub), 'utf8');
  console.log('  ✔ sitemap：life/sitemap.xml');
  const totalSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ 完成（共 ${totalSec} 秒，其中圖片優化 ${imgSec} 秒）。`);
}
main().catch(err => { console.error('❌ 產生失敗：', err); process.exit(1); });
