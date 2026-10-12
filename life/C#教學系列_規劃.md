# 智慧喵・科技｜C# 程式設計完整教學系列 規劃

> 這份給「開新 Session 要寫這個系列」時對照用。屬於智慧喵「科技」分類（青藍色 `tech` 標籤）。
> 收在導覽列「科技學院」下拉，系列目錄頁為 `csharp.html`（由 build 腳本自動產生）。

---

## 系列定位

- **對象**：完全沒寫過程式、或會一點其他語言想系統學 C# 的人。
- **主軸**：從開發環境 → 語法基礎 → 物件導向 → 進階主題 → 實戰專案，一條循序漸進的路。
- **分類**：一律 `category: "科技"`；標題掛前綴【C# 教學】方便讀者辨識同系列。
- **目錄頁主題色**：翠綠 `#059669`（`body.page-csharp`，與 App 開發的青藍區隔）。
- **每篇底部**：靠系列導覽；文章在 front-matter 標 `series: "csharp"`。

---

## 資料驅動：每篇 front-matter 要加的欄位

除了既有欄位（title/description/keywords/slug/date/order/author/category/status/images…），
系列文章要再加三個欄位，腳本會據此自動排進 `csharp.html`：

```yaml
series: "csharp"           # 固定值，對應腳本 SERIES.csharp
series_stage: "基礎"        # 階段 key，須為下方「階段」清單之一
series_order: "2"          # 圓圈內的編號；數字會依序排列，非數字（如「總」）排在數字後、套特別樣式
```

> 注意：`series_order` 用「字串」寫（加引號）。數字字串會被當號碼顯示並排序；
> 想放特別標記（像總覽用「總」）就填中文字。

---

## 階段（對應腳本 SERIES.csharp.stages）

| 階段 key | 徽章 | 階段標題 | 說明 |
|---------|------|---------|------|
| 總覽 | 總覽 | 先看全貌 | 一篇看懂 C# 能做什麼、要裝什麼、系列會帶你走到哪 |
| 基礎 | 基礎 | 語法基礎 | 變數型別、流程控制、方法、例外處理 |
| 物件導向 | OOP | 物件導向 | 類別物件、封裝繼承多型、介面與泛型 |
| 進階 | 進階 | 進階主題 | 集合與 LINQ、非同步、檔案與資料存取 |
| 實戰 | 實戰 | 實戰專案 | 整合前面所學，做一個完整小專案 |

---

## 文章規劃（草案，可再增補）

### 總覽（1 篇）
- **slug: `csharp-complete-guide-overview`**（series_order: 總）
  C# 是什麼、能做什麼（桌面、Web、遊戲 Unity、後端）、要裝什麼（.NET SDK + VS / VS Code）、
  這個系列的學習路徑地圖。✅ 已建立（第一篇）

### 基礎
1. `csharp-setup-tools` — 開發環境：安裝 .NET SDK、Visual Studio / VS Code，跑第一支程式
2. `csharp-syntax-basics` — 變數、型別、運算子、流程控制（if/for/while/switch）
3. `csharp-methods-exceptions` — 方法、參數、回傳值、例外處理 try/catch

### 物件導向
4. `csharp-classes-objects` — 類別與物件、欄位屬性、建構式
5. `csharp-oop-pillars` — 封裝、繼承、多型
6. `csharp-interfaces-generics` — 介面、抽象類別、泛型

### 進階
7. `csharp-collections-linq` — 集合（List/Dictionary）與 LINQ
8. `csharp-async` — 非同步 async/await
9. `csharp-files-data` — 檔案讀寫、JSON、簡單資料存取

### 實戰
10. `csharp-project-console-app` — 用一個完整的主控台小專案收尾

---

## 寫作與產生流程

1. 在 `content/_drafts/` 建 `<slug>.md`，填好 front-matter（含上面三個 series 欄位），`status` 先放 `draft`。
2. 準備封面圖放 `assets/<slug>/cover.jpg`（可選）。
3. 內容寫好、要發布時把 `status` 改成 `approved`。
4. 執行 `build-life.bat`（或 `node scripts/build-life-blog.mjs`）。
5. 腳本會自動：產生文章頁、更新首頁科技分類列表、重建 `csharp.html` 目錄頁、更新 sitemap。
   目錄頁完全不用手改。
