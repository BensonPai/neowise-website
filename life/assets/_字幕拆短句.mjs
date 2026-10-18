// 字幕拆短句工具（通用）
// 用途：把 DaVinci（或任何來源）匯出的「單一完整 SRT」裡過長的字幕條目，
//       依中文標點自動拆成多條短句，時間按字數比例分配，避免上傳 YouTube 爆版。
// 特性：只拆短句、不合併、不平移時間（時間已在 SRT 裡且正確，直接沿用）。
//
// 用法（在這個 assets 資料夾開終端機執行）：
//   node _字幕拆短句.mjs <輸入.srt>
//   例：node _字幕拆短句.mjs faceless-tutorial-video-production/faceless.srt
//
// 會在同一個資料夾輸出一個 <原檔名>.short.srt（短句版）。
// 想調整每條字數上限，改下面的 MAX_LEN（預設 20）。

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';

const MAX_LEN = 20; // 每條字幕最多顯示的字數（超過就拆）

const input = process.argv[2];
if (!input) {
  console.error('用法：node _字幕拆短句.mjs <輸入.srt>');
  console.error('例： node _字幕拆短句.mjs faceless-tutorial-video-production/faceless.srt');
  process.exit(1);
}
const inPath = resolve(process.cwd(), input);

function tcToMs(tc) {
  const m = tc.trim().match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!m) return null;
  const [, h, mi, s, ms] = m;
  return ((+h * 60 + +mi) * 60 + +s) * 1000 + +ms;
}
function msToTc(ms) {
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const mi = Math.floor(ms / 60000); ms -= mi * 60000;
  const s = Math.floor(ms / 1000); const mm = ms - s * 1000;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(mi)}:${p(s)},${p(mm, 3)}`;
}

// 把一段文字依標點拆成 <= MAX_LEN 的短句片段
function splitText(text) {
  const parts = text.split(/(?<=[，。！？、；：])/).filter(Boolean);
  const out = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + p).length > MAX_LEN && buf) { out.push(buf); buf = p; }
    else buf += p;
  }
  if (buf) out.push(buf);
  // 單句沒標點又超長 → 硬切
  const final = [];
  for (const seg of out) {
    if (seg.length <= MAX_LEN * 1.5) { final.push(seg); continue; }
    for (let i = 0; i < seg.length; i += MAX_LEN) final.push(seg.slice(i, i + MAX_LEN));
  }
  return final.map(s => s.replace(/[，、；：]$/, ''));
}

const raw = readFileSync(inPath, 'utf8').replace(/^\uFEFF/, ''); // 去 BOM
const chunks = raw.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);

// 先掃一遍找出最小起始時間，當作整體偏移量歸零
// （DaVinci 時間軸常從 01:00:00:00 起算，匯出的 SRT 會整段偏移，需扣掉讓第一條歸零）
let minStart = Infinity;
for (const c of chunks) {
  const tl = c.split('\n').find(l => l.includes('-->'));
  if (!tl) continue;
  const s = tcToMs(tl.split('-->')[0]);
  if (s != null && s < minStart) minStart = s;
}
if (!isFinite(minStart)) minStart = 0;
if (minStart > 0) console.log(`偵測到起始偏移 ${msToTc(minStart)}，已整體往前歸零。`);

// 去掉常見的字幕內嵌標籤（如 <b></b>、<i></i>）
const stripTags = (s) => s.replace(/<\/?[a-zA-Z][^>]*>/g, '').trim();

const blocks = [];
for (const c of chunks) {
  const lines = c.split('\n');
  const ti = lines.findIndex(l => l.includes('-->'));
  if (ti === -1) continue;
  const [start, end] = lines[ti].split('-->').map(s => s.trim());
  let s0 = tcToMs(start), e0 = tcToMs(end);
  if (s0 == null || e0 == null) continue;
  s0 -= minStart; e0 -= minStart; // 歸零
  const text = stripTags(lines.slice(ti + 1).join('').trim());
  if (!text) continue;

  const segs = splitText(text);
  if (segs.length <= 1) { blocks.push({ start: s0, end: e0, text }); continue; }

  const total = segs.reduce((a, b) => a + b.length, 0);
  let cur = s0; const dur = e0 - s0;
  segs.forEach((seg, idx) => {
    const segEnd = (idx === segs.length - 1) ? e0 : cur + Math.round(dur * seg.length / total);
    blocks.push({ start: cur, end: segEnd, text: seg });
    cur = segEnd;
  });
}

blocks.sort((a, b) => a.start - b.start);
const out = blocks.map((b, i) =>
  `${i + 1}\n${msToTc(b.start)} --> ${msToTc(b.end)}\n${b.text}`
).join('\n\n') + '\n';

const outName = basename(inPath).replace(/\.srt$/i, '') + '.short.srt';
const outPath = join(dirname(inPath), outName);
writeFileSync(outPath, out, 'utf8');
console.log(`完成：${blocks.length} 條短字幕`);
console.log(`輸出：${outPath}`);
