# YouTube 影片文案範本（影片 ↔ 文章 互導）

> 錄影片、寫說明欄時直接複製套用。目的：把 YouTube 觀眾導向部落格文章，形成雙向連動。
> 文章網址格式：`https://neowise.com.tw/life/<slug>.html`

---

## 一、影片「說明欄」範本（複製後替換 [ ] 內容）

```
📖 這支影片的完整圖文版在這裡（有更多圖表與細節）：
[文章標題]
👉 https://neowise.com.tw/life/[slug].html

—

🐾 我是智慧喵，分享投資理財、旅遊與生活，順便介紹我自己開發的實用軟體。

📚 投資理財修煉系列（從入門到高手）：
https://neowise.com.tw/life/invest.html

🔔 訂閱頻道不錯過新影片：
https://www.youtube.com/@智慧喵?sub_confirmation=1

—

⏱️ 章節
00:00 開場
（依影片內容補）

—

※ 本頻道內容為個人學習記錄與分享，非投資建議。投資有風險，請獨立判斷。
```

---

## 二、影片「片中/結尾」口播提示

- 開頭：「這支影片的完整圖文版，我放在部落格，連結在說明欄，想看圖表的可以搭配著看。」
- 結尾：「如果覺得有幫助，記得訂閱，我們下一支影片見。完整系列也在部落格，連結在下方。」

---

## 三、各篇文章對應網址（方便貼說明欄）

投資理財修煉系列：

| 篇 | 文章 | 網址 |
|---|------|------|
| 1 | 理財第一步：先搞懂錢跑去哪了 | https://neowise.com.tw/life/start-personal-finance.html |
| 2 | 理財基本概念：資產配置與風險管理 | https://neowise.com.tw/life/invest-basics-asset-allocation.html |
| 3 | 投資心態：長期 vs 短期、耐心 vs 貪婪 | https://neowise.com.tw/life/invest-mindset-long-vs-short.html |

系列目錄：https://neowise.com.tw/life/invest.html

（之後新增文章再補上對應網址。）

---

## 四、Short 的說明/導流

- Short 結尾用文字卡或口播：「完整版看我的頻道長片」或「詳細圖文在部落格（連結在簡介）」。
- Short 說明欄放一行：`完整內容 👉 https://neowise.com.tw/life/[slug].html`
- 頻道「簡介」欄固定放部落格網址與投資理財修煉目錄連結。

---

## 五、文章端的「影片版」導引（已由網站自動處理）

- 有填 `youtube` 的文章，文章頁會自動嵌入播放器（🎬 影片版/影片名稱），首頁卡片也會顯示 🎬 標記。
- 所以「文章 → 影片」不需要手動加文案，填好 front-matter 的 `youtube` 欄位即可。
- 若想在文章開頭再加一句提示，可在正文最前面手動加：
  `> 🎬 這篇也有影片版，可以搭配文末的影片一起看。`
```
