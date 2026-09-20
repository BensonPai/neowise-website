# NeoWise 官網 SEO 優化說明

讓「炘智科技」與相關關鍵字能在 Google 被搜到的完整指南。
分成「一次性設定」與「持續經營」兩部分，照順序做效果最好。

---

## 現況重點

- 網站 HTML 的 SEO 標籤（title、description、keywords、Open Graph、JSON-LD）都已完備。
- 目前搜不到的主因是：**Google 還沒正常索引網站**，不是內容或技術問題。
- 解法核心：主動向 Google 提交網站與 sitemap（見下方步驟一、二）。

---

## 第一部分：一次性設定（做完就有效，優先做）

### 步驟一、Google Search Console 驗證網站（最重要）

到 [search.google.com/search-console](https://search.google.com/search-console)，用 Google 帳號登入。
「新增資源」→「網址前置字元」→ 輸入 `https://neowise.com.tw`。

**驗證方式建議用「HTML 標記（Meta 標籤）」，比 HTML 檔案穩定：**

1. Search Console 會給一段標籤，例如：
   `<meta name="google-site-verification" content="一串代碼" />`
2. 把這段貼進 `index.html` 的 `<head>` 區塊裡（可請 Kiro 代勞）。
3. 用 GitHub Desktop 上傳，等 GitHub Pages 部署完成（約 2–5 分鐘）。
4. 回 Search Console 按「驗證」。

> **驗證失敗（找不到驗證檔／標籤）怎麼辦？**
> - 確認檔案／標籤已「上傳到 GitHub」，不是只存在本機。
> - 等幾分鐘讓 GitHub Pages 部署完成，別太快按驗證。
> - HTML 檔案驗證：檔案要放在最上層（跟 index.html 同層），檔名不可更改。
> - 自我測試：瀏覽器打開 `https://neowise.com.tw/驗證檔名.html`，看得到內容才算上線。

### 步驟二、提交 sitemap

驗證通過後，在 Search Console 左選單「Sitemap」→
輸入 `sitemap.xml`（或完整網址 `https://neowise.com.tw/sitemap.xml`）→ 提交。
Google 會照 sitemap 去爬所有頁面。每次新增文章、重跑 build-blog.bat，sitemap 會自動更新。

### 步驟三、robots.txt（已建好）

專案根目錄已有 `robots.txt`，允許搜尋引擎爬取並指向 sitemap。
記得跟其他檔一起上傳到 GitHub。

### 步驟四、要求 Google 索引特定頁面

在 Search Console 上方搜尋列貼上某個網址（例如首頁或某篇文章）→
「要求建立索引」，可加速 Google 收錄該頁。

### 步驟五、建立 Google 商家檔案

到 [business.google.com](https://business.google.com) 免費註冊：
- 公司名稱：炘智科技有限公司
- 地址：231057 新北市新店區永平街18號3樓
- 電話：+886-2-3151-7027
- 類別：可選「工程服務」或相關

好處：搜「炘智科技」時，Google 地圖與右側資訊卡會顯示公司資料，
對品牌與本地搜尋幫助很大。

---

## 第二部分：持續經營（決定排名高低）

### 關鍵字策略：攻長尾，不跟大詞硬拚

「檢測系統」「對位系統」這類大詞競爭極高，新網站很難直接排上第一頁。
應鎖定更具體、意圖更明確、競爭較低的「長尾關鍵字」：

- 客製化視覺檢測系統開發
- SMT 視覺對位系統
- 半導體視覺對位
- AI 瑕疵檢測系統
- 台灣機器視覺開發商
- 視覺引導機械手臂 VGR

### 部落格是攻長尾的主力

每一篇部落格文章都是一個「能被搜到的入口」。持續發文能：
- 針對不同長尾關鍵字建立內容
- 讓網站「有在更新」，Google 更願意常來爬
- 累積專業形象，提升信任與轉換

寫文章時（產文流程見 `部落格使用說明.md`）：
- title 與 description 帶上目標關鍵字
- 內文自然出現關鍵字，別硬塞
- 用小標（##）組織內容，方便搜尋引擎理解

### 建立外部連結與品牌曝光

在能放的地方留下「公司全名 + 網址 https://neowise.com.tw」：
- 公司 Facebook、LinkedIn
- 產業名錄、B2B 平台（台灣經貿網等）
- 相關的合作夥伴或客戶頁面

外部連結越多且越相關，Google 越信任你的網站。

---

## 優先順序總覽

| 順序 | 動作 | 難度 | 效果 |
|------|------|------|------|
| 1 | Search Console 驗證 + 提交 sitemap | 低 | 最大：讓 Google 開始正常索引 |
| 2 | 上傳 robots.txt（已建好） | 低 | 輔助爬取 |
| 3 | 要求索引主要頁面 | 低 | 加速收錄 |
| 4 | 建立 Google 商家檔案 | 低 | 品牌搜尋曝光 |
| 5 | 持續發布部落格文章 | 中 | 長尾關鍵字，長期最有效 |

---

## 常見問題

**Q：做完設定多久能搜到？**
A：驗證並提交 sitemap 後，通常幾天到兩三週 Google 會開始收錄。排名要爬上去則需要持續經營，非一蹴可幾。

**Q：怎麼確認 Google 收錄了幾頁？**
A：在 Google 搜尋列打 `site:neowise.com.tw`，會列出已被索引的頁面。數量越多代表收錄越完整。

**Q：驗證檔／標籤可以刪掉嗎？**
A：不要刪。Google 會不定期重新驗證，刪掉可能導致驗證失效。

**Q：搜「炘智科技」還是找不到公司？**
A：優先完成步驟一（Search Console）與步驟五（Google 商家檔案），這兩個對品牌搜尋最直接。
