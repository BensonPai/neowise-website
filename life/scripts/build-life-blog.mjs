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

// 縮圖設定：超過此寬度就等比縮小（考慮 2x 高解析螢幕，760px 版面用 1600 足夠）
const MAX_IMG_WIDTH = 1600;
// 檔案超過此大小就重新壓縮品質（加速網頁載入的主因）
const MAX_IMG_BYTES = 300 * 1024;   // 300 KB
const JPEG_QUALITY = 80;            // jpg 壓縮品質（80 幾乎看不出差別，檔案大幅變小）
const IMG_EXT = /\.(png|jpe?g|webp)$/i;

// 分類 -> 標籤 CSS class（對應 style.css）
const CAT_CLASS = { '投資理財': 'invest', '旅遊': 'travel', '生活': 'life' };

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
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
${videoHint}${markdownToHtml(body)}
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
  await optimizeImages();
  const all = loadArticles();
  const pub = all.filter(a => a.status === 'approved' || a.status === 'published')
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
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
  console.log('\n✅ 完成。');
}
main().catch(err => { console.error('❌ 產生失敗：', err); process.exit(1); });
