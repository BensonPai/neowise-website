#!/usr/bin/env node
/**
 * NeoWise Blog 產生器
 * ------------------------------------------------------------
 * 讀取 blog-content/ 底下的 Markdown 文章（含 front-matter），
 * 產生：
 *   1. 每篇文章的靜態 HTML  -> neowise-website/blog/<slug>.html
 *   2. 文章列表頁            -> neowise-website/blog/index.html
 *   3. 網站 sitemap.xml      -> neowise-website/sitemap.xml
 *
 * 特色：
 *   - 零外部相依（不需 npm install），純 Node 內建模組
 *   - 只發布 status 為 approved / published 的文章
 *   - 自動產生 SEO meta、Open Graph、JSON-LD 結構化資料
 *
 * 用法：
 *   node scripts/build-blog.mjs
 * ------------------------------------------------------------
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = resolve(__dirname, '..');            // neowise-website/
const CONTENT_DIR = join(SITE_ROOT, 'blog-content');
const BLOG_OUT_DIR = join(SITE_ROOT, 'blog');
const SITE_URL = 'https://neowise.com.tw';
const GA_ID = 'G-QVQJDMZYRH';

// 對外公開頁面（給 sitemap 用）
const STATIC_PAGES = [
  '', 'about.html', 'solutions.html', 'cases.html', 'contact.html',
  'alignment.html', 'inspection.html', 'privacy.html',
  'products/', 'products/smartstock.html', 'products/swiftbridge.html', 'products/wealthmate.html',
];

/* ============================================================
 * 工具函式
 * ========================================================== */

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- front-matter 解析 ---------- */
function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };

  const [, fmText, body] = match;
  const data = {};
  const lines = fmText.split('\n');
  let currentKey = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    // 陣列項目： "  - foo" 或 "  - key: value" 形式
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      const itemText = listItem[1].trim();
      // 物件型清單項目（含冒號 key: value）
      const kv = itemText.match(/^(\w+):\s*(.*)$/);
      if (kv) {
        const obj = {};
        obj[kv[1]] = stripQuotes(kv[2]);
        data[currentKey].push(obj);
      } else {
        data[currentKey].push(stripQuotes(itemText));
      }
      continue;
    }

    // 物件清單的後續屬性（縮排更深的 key: value，接到上一個物件）
    const nestedKv = line.match(/^\s{4,}(\w+):\s*(.*)$/);
    if (nestedKv && currentKey && Array.isArray(data[currentKey]) &&
        typeof data[currentKey][data[currentKey].length - 1] === 'object') {
      const last = data[currentKey][data[currentKey].length - 1];
      last[nestedKv[1]] = stripQuotes(nestedKv[2]);
      continue;
    }

    // 一般 key: value
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();
      if (value === '') {
        data[currentKey] = []; // 可能是接下來的清單
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // 行內陣列 ["a", "b"]
        data[currentKey] = value.slice(1, -1)
          .split(',')
          .map(s => stripQuotes(s.trim()))
          .filter(Boolean);
      } else {
        data[currentKey] = stripQuotes(value);
      }
    }
  }
  return { data, body };
}

function stripQuotes(s = '') {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/* ---------- 輕量 Markdown -> HTML ---------- */
function inlineMarkdown(text) {
  let t = escapeHtml(text);
  // 圖片 ![alt](src)
  t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, src) => `<img src="${src.trim()}" alt="${alt.trim()}" loading="lazy">`);
  // 連結 [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) => `<a href="${url.trim()}" rel="noopener">${label}</a>`);
  // 粗體 **text**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // 斜體 *text*
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // 行內程式碼 `code`
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

function markdownToHtml(md) {
  const lines = md.split('\n');
  const html = [];
  let i = 0;
  let inList = null; // 'ul' | 'ol'

  const closeList = () => {
    if (inList) { html.push(`</${inList}>`); inList = null; }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行
    if (!trimmed) { closeList(); i++; continue; }

    // 標題
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      // H1 保留給文章標題；內文標題從 h2 起（## -> h2、### -> h3…）
      const lv = Math.min(Math.max(heading[1].length, 2), 5);
      html.push(`<h${lv}>${inlineMarkdown(heading[2])}</h${lv}>`);
      i++; continue;
    }

    // 引用
    if (trimmed.startsWith('> ')) {
      closeList();
      const quote = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quote.push(lines[i].trim().slice(2));
        i++;
      }
      html.push(`<blockquote>${inlineMarkdown(quote.join(' '))}</blockquote>`);
      continue;
    }

    // 分隔線
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeList();
      html.push('<hr>');
      i++; continue;
    }

    // 無序清單
    if (/^[-*]\s+/.test(trimmed)) {
      if (inList !== 'ul') { closeList(); html.push('<ul>'); inList = 'ul'; }
      html.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      i++; continue;
    }

    // 有序清單
    if (/^\d+\.\s+/.test(trimmed)) {
      if (inList !== 'ol') { closeList(); html.push('<ol>'); inList = 'ol'; }
      html.push(`<li>${inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</li>`);
      i++; continue;
    }

    // 純圖片行 -> 包成 figure
    const imgOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgOnly) {
      closeList();
      const alt = imgOnly[1].trim();
      const src = imgOnly[2].trim();
      // alt 保留給 SEO 與無障礙，但不顯示為圖片下方的圖說文字
      html.push(`<figure><img src="${src}" alt="${alt}" loading="lazy"></figure>`);
      i++; continue;
    }

    // 一般段落（合併連續非空行）
    closeList();
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() &&
           !/^(#{1,4}\s|[-*]\s|\d+\.\s|>\s|-{3,}|\*{3,})/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    html.push(`<p>${inlineMarkdown(para.join(' '))}</p>`);
  }
  closeList();
  return html.join('\n');
}

/* ---------- 共用 HTML 片段 ---------- */
function navbar(base) {
  return `<nav class="navbar">
    <div class="nav-container">
        <a href="${base}index.html" class="logo">炘智科技</a>
        <button class="menu-toggle" aria-label="開啟選單">☰</button>
        <ul class="nav-links">
            <li><a href="${base}about.html">關於炘智科技</a></li>
            <li><a href="${base}solutions.html">解決方案</a></li>
            <li><a href="${base}cases.html">成功案例</a></li>
            <li><a href="${base}blog/index.html" class="active">部落格</a></li>
            <li><a href="${base}contact.html" class="btn-nav">聯絡我們</a></li>
        </ul>
    </div>
</nav>`;
}

function footer(base) {
  return `<footer class="footer">
    <div class="container footer-grid">
        <div class="footer-brand"><h3>炘智科技</h3><p>NEOWISE TECHNOLOGY LTD.</p></div>
        <div class="footer-links"><h4>服務項目</h4><ul><li><a href="${base}about.html">關於炘智科技</a></li><li><a href="${base}solutions.html">解決方案</a></li><li><a href="${base}cases.html">成功案例</a></li><li><a href="${base}blog/index.html">部落格</a></li><li><a href="${base}contact.html">聯絡我們</a></li></ul></div>
        <div class="footer-links"><h4>公司資訊</h4><ul><li><a href="${base}privacy.html">隱私權政策</a></li></ul></div>
        <div class="footer-contact"><p>📍 231057 新北市新店區永平街18號3樓</p><p>📞 +886-2-3151-7027</p><p>📧 benson@neowise.com.tw</p><p>服務時間：週一至週五 09:00-18:00</p></div>
    </div>
    <div class="footer-bottom"><p>&copy; 2026 炘智科技有限公司 NEOWISE TECHNOLOGY LTD.</p></div>
</footer>
<script>document.querySelector('.menu-toggle').addEventListener('click', function() { document.querySelector('.nav-links').classList.toggle('active'); });</script>`;
}

function gaSnippet() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`;
}

/* ============================================================
 * 文章讀取
 * ========================================================== */
function collectMarkdownFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectMarkdownFiles(full));
    } else if (entry.endsWith('.md') && entry.toLowerCase() !== 'readme.md') {
      out.push(full);
    }
  }
  return out;
}

function loadArticles() {
  const files = collectMarkdownFiles(CONTENT_DIR);
  const articles = [];
  for (const file of files) {
    const raw = readFileSync(file, 'utf8');
    const { data, body } = parseFrontMatter(raw);
    if (!data.slug || !data.title) {
      console.warn(`⚠ 略過（缺 slug 或 title）：${file}`);
      continue;
    }
    const status = (data.status || 'draft').toLowerCase();
    articles.push({ ...data, status, body, sourceFile: file });
  }
  return articles;
}

/* ============================================================
 * 產生文章頁
 * ========================================================== */
function renderArticlePage(article) {
  const {
    title, description = '', keywords = [], slug, date = '',
    author = '炘智科技', category = '技術文章', cover_alt = '',
    images = [], body,
  } = article;

  const kw = Array.isArray(keywords) ? keywords.join(',') : keywords;
  const url = `${SITE_URL}/blog/${slug}.html`;
  const cover = images && images[0] ? `assets/${slug}/${images[0].file}` : '';
  const coverUrl = cover ? `${SITE_URL}/blog/${cover}` : `${SITE_URL}/neowiselogo.png`;
  const contentHtml = markdownToHtml(body);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: coverUrl,
    datePublished: date,
    dateModified: date,
    author: { '@type': 'Organization', name: author },
    publisher: {
      '@type': 'Organization',
      name: '炘智科技 NEOWISE TECHNOLOGY',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/neowiselogo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${gaSnippet()}
    <title>${escapeHtml(title)} - 炘智科技 NEOWISE</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(kw)}">
    <meta name="author" content="${escapeHtml(author)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${coverUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="../style.css">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
${navbar('../')}

<article class="article">
    <header class="article-header">
        <div class="container article-container">
            <span class="blog-tag">${escapeHtml(category)}</span>
            <h1>${escapeHtml(title)}</h1>
            <p class="article-meta">${escapeHtml(author)}　•　${escapeHtml(date)}</p>
        </div>
    </header>
    ${cover ? `<div class="container article-container"><img class="article-cover" src="${cover}" alt="${escapeHtml(cover_alt || title)}" loading="lazy"></div>` : ''}
    <div class="container article-container">
        <div class="article-body">
${contentHtml}
        </div>
        <div class="article-back"><a href="index.html">← 回部落格列表</a></div>
    </div>
</article>

${footer('../')}
</body>
</html>`;
}

/* ============================================================
 * 產生列表頁
 * ========================================================== */
function renderIndexPage(articles) {
  const cards = articles.map(a => {
    const cover = a.images && a.images[0] ? `assets/${a.slug}/${a.images[0].file}` : '';
    return `            <a class="blog-card" href="${a.slug}.html">
                ${cover ? `<img class="blog-card-cover" src="${cover}" alt="${escapeHtml(a.cover_alt || a.title)}" loading="lazy">` : ''}
                <span class="blog-tag">${escapeHtml(a.category || '技術文章')}</span>
                <h3>${escapeHtml(a.title)}</h3>
                <p class="blog-date">${escapeHtml(a.date || '')}</p>
                <p>${escapeHtml(a.description || '')}</p>
            </a>`;
  }).join('\n');

  const empty = `<p style="color:#888; text-align:center; padding:60px 0;">目前尚無文章，敬請期待。</p>`;

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${gaSnippet()}
    <title>部落格 - 炘智科技 NEOWISE TECHNOLOGY</title>
    <meta name="description" content="炘智科技技術部落格，分享機器視覺、AI 瑕疵檢測、視覺對位與智慧製造的實務觀點與案例。">
    <meta name="keywords" content="機器視覺,視覺檢測,AI瑕疵檢測,視覺對位,智慧製造,炘智科技部落格">
    <meta property="og:title" content="部落格 - 炘智科技 NEOWISE TECHNOLOGY">
    <meta property="og:description" content="機器視覺與 AI 智慧製造的技術觀點與案例分享。">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}/blog/">
    <link rel="canonical" href="${SITE_URL}/blog/">
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
${navbar('../')}

<section class="page-header">
    <h1>技術部落格</h1>
    <p>機器視覺、AI 瑕疵檢測與智慧製造的實務觀點</p>
</section>

<section class="page-content">
    <div class="container">
        <div class="blog-grid">
${articles.length ? cards : ''}
        </div>
        ${articles.length ? '' : empty}
    </div>
</section>

${footer('../')}
</body>
</html>`;
}

/* ============================================================
 * 產生 sitemap
 * ========================================================== */
function renderSitemap(articles) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  for (const p of STATIC_PAGES) {
    urls.push(`  <url><loc>${SITE_URL}/${p}</loc><lastmod>${today}</lastmod></url>`);
  }
  urls.push(`  <url><loc>${SITE_URL}/blog/</loc><lastmod>${today}</lastmod></url>`);
  for (const a of articles) {
    urls.push(`  <url><loc>${SITE_URL}/blog/${a.slug}.html</loc><lastmod>${a.date || today}</lastmod></url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/* ============================================================
 * 主流程
 * ========================================================== */
function main() {
  console.log('▶ NeoWise Blog 產生器啟動…\n');

  const all = loadArticles();
  const published = all
    .filter(a => a.status === 'approved' || a.status === 'published')
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const drafts = all.filter(a => a.status === 'draft');

  console.log(`  找到文章：${all.length} 篇（發布 ${published.length}、草稿 ${drafts.length}）`);
  if (drafts.length) {
    console.log('  以下為草稿，未發布：');
    drafts.forEach(d => console.log(`    - [${d.status}] ${d.title}  (${d.slug})`));
  }

  if (!existsSync(BLOG_OUT_DIR)) mkdirSync(BLOG_OUT_DIR, { recursive: true });

  // 產生各文章頁
  for (const a of published) {
    const outFile = join(BLOG_OUT_DIR, `${a.slug}.html`);
    writeFileSync(outFile, renderArticlePage(a), 'utf8');
    console.log(`  ✔ 產生文章：blog/${a.slug}.html`);
  }

  // 列表頁
  writeFileSync(join(BLOG_OUT_DIR, 'index.html'), renderIndexPage(published), 'utf8');
  console.log('  ✔ 產生列表：blog/index.html');

  // sitemap
  writeFileSync(join(SITE_ROOT, 'sitemap.xml'), renderSitemap(published), 'utf8');
  console.log('  ✔ 產生 sitemap.xml');

  console.log('\n✅ 完成。');
}

main();
