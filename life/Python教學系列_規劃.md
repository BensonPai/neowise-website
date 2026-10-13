# 智慧喵・科技｜Python 程式設計完整教學系列 規劃

> **✅ 本系列已全部完成並發布（共 11 篇：總覽 1 + 基礎 4 + 物件導向 2 + 實用應用 4 + 實戰 1）。**
> 這份保留作為系列結構與寫作慣例的紀錄；未來要增補或新開類似系列時可對照。

> 這份給「開新 Session 要寫這個系列」時對照用。屬於智慧喵「科技」分類（青藍色 `tech` 標籤）。
> 收在導覽列「科技學院」下拉，系列目錄頁為 `python.html`（由 build 腳本自動產生）。

---

## 系列定位

- **對象**：完全沒寫過程式、想找一個「最好上手」的語言入門的人；或想補強 Python 的人。
- **主軸**：從開發環境 → 語法與資料結構 → 物件導向 → 實用應用（Python 強項）→ 實戰專案。
- **跟 C# 系列的區隔**：C# 偏「扎實、工程導向」；Python 偏「好上手、重實用」。Python 多一個「實用應用」階段（檔案、爬蟲、自動化、資料處理），突顯它的賣點。
- **分類**：一律 `category: "科技"`；標題掛前綴【Python 教學】方便讀者辨識同系列。
- **目錄頁主題色**：藍色 `#2563eb`（`body.page-python`，Python 代表色，與 App 青藍、C# 翠綠區隔）。
- **每篇底部**：靠系列導覽；文章在 front-matter 標 `series: "python"`。

---

## 資料驅動：每篇 front-matter 要加的欄位

除了既有欄位（title/description/keywords/slug/date/order/author/category/status/images…），
系列文章要再加三個欄位，腳本會據此自動排進 `python.html`：

```yaml
series: "python"           # 固定值，對應腳本 SERIES.python
series_stage: "基礎"        # 階段 key，須為下方「階段」清單之一
series_order: "2"          # 圓圈內的編號；數字會依序排列，非數字（如「總」）排在數字後、套特別樣式
```

> 注意：`series_order` 用「字串」寫（加引號）。
> `date` 一律用「寫作當天」實際日期（用 `Get-Date` 抓系統日期，不要憑記憶）。

---

## 階段（對應腳本 SERIES.python.stages）

| 階段 key | 徽章 | 階段標題 | 說明 |
|---------|------|---------|------|
| 總覽 | 總覽 | 先看全貌 | 一篇看懂 Python 能做什麼、要裝什麼、系列會帶你走到哪 |
| 基礎 | 基礎 | 語法基礎 | 變數型別、流程控制、函式，list/dict 等資料結構 |
| 物件導向 | OOP | 物件導向 | 類別與物件、繼承、特殊方法 |
| 實用應用 | 應用 | 實用應用 | 檔案與 JSON、爬蟲、自動化、資料處理入門 |
| 實戰 | 實戰 | 實戰專案 | 整合前面所學，做一個完整小工具 |

---

## 文章規劃（草案，可再增補）

### 總覽（1 篇）
- ✅ **slug: `python-complete-guide-overview`**（series_order: 總）
  Python 是什麼、能做什麼（自動化、爬蟲、資料分析、AI、後端）、要裝什麼（Python 直譯器 + VS Code / PyCharm）、
  這個系列的學習路徑地圖。

### 基礎
1. ✅ `python-setup-tools` — 開發環境：安裝 Python、選編輯器（VS Code）、跑第一支程式、認識 pip、venv
2. ✅ `python-syntax-basics` — 變數、型別、運算子、流程控制（if/for/while）、縮排規則
3. ✅ `python-functions` — 函式：def、參數、回傳值、預設參數、*args/**kwargs 入門
4. ✅ `python-data-structures` — 資料結構：list、tuple、dict、set 與常用操作、推導式

### 物件導向
5. ✅ `python-classes-objects` — 類別與物件：class、__init__、屬性與方法、self
6. ✅ `python-oop-inheritance` — 繼承與特殊方法：繼承、方法覆寫、__str__ 等 dunder 方法

### 實用應用（Python 強項）
7. ✅ `python-files-json` — 檔案讀寫與 JSON：open、with、讀寫文字、json 模組
8. ✅ `python-web-scraping` — 網路爬蟲入門：requests + BeautifulSoup 抓網頁資料（含禮貌爬取與法律提醒）
9. ✅ `python-automation` — 自動化腳本：批次處理檔案、定時任務、把重複工作交給程式
10. ✅ `python-data-analysis` — 資料處理入門：用 pandas 讀 CSV、篩選、統計、簡單圖表（附範例 students.csv、中文字型設定、Jupyter 說明）

### 實戰
11. ✅ `python-project-cli-tool` — 用一個完整的「檔案整理工具」收尾（含預覽模式）

> 封面圖與內文圖的生圖提示都備在各篇 `assets/<slug>/_圖片需求.txt`，缺圖不影響發布。

---

## 寫作與產生流程

1. 在 `content/_drafts/` 建 `<slug>.md`，填好 front-matter（含上面三個 series 欄位），`status` 先放 `draft`。
2. 準備封面圖放 `assets/<slug>/cover.jpg`（可選），並比照慣例放一份 `_圖片需求.txt`。
3. 內容寫好、要發布時把 `status` 改成 `approved`。
4. 執行 `build-life.bat`（或 `node scripts/build-life-blog.mjs`）。
5. 腳本會自動：產生文章頁、更新首頁科技分類列表、重建 `python.html` 目錄頁、更新 sitemap。
   目錄頁完全不用手改。

---

## 寫作風格備忘（與 C# 系列一致）

- 語氣：專業但白話，智慧喵口吻；開場用情境/痛點切入、結尾 🐾。
- 每篇用「上一篇…這篇…」銜接，底部放系列導覽（回目錄、上一篇、下一篇）。
- 程式碼用 ``` 區塊；多段範例若有先後，說清楚縮排與執行方式（Python 特別注意縮排）。
- 適時用 `>` 標註新手陷阱、查證時間。
- 可自然帶 Hahow 課程導流（`::aff hahow ...::`），不強求每篇都帶。
- 已發布時，同步更新該篇 `_圖片需求.txt` 的狀態標示（草稿 → 已發布）。
