---
title: "【Python 教學】自動化腳本：把重複的工作交給程式"
description: "每天重複做的瑣事，用 Python 自動化。這篇帶你用 Python 批次處理檔案、整理資料夾、做簡單的定時任務，體會「寫一次、省一輩子」的自動化威力。"
keywords: ["Python 自動化", "批次處理", "os 模組", "pathlib", "shutil", "定時任務", "Python 教學"]
slug: "python-automation"
date: "2026-10-13"
order: 10
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "實用應用"
series_order: "9"
status: "approved"
youtube: ""
cover_alt: "示意程式自動批次處理一堆檔案的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式自動批次處理一堆檔案的概念圖"
    prompt: "一張簡潔的概念示意圖，一個齒輪 / 機器人圖示自動處理一排檔案，象徵自動化批次處理，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](python-web-scraping.html)學會抓網頁。這篇講 Python 最「有感」的應用——**自動化**：把每天手動重複做的瑣事（整理檔案、改檔名、分類）交給程式，寫一次、省一輩子。

這也是很多人學 Python 的動機：不是要當工程師，而是想**讓自己的日常工作更輕鬆**。

## 一、操作檔案與資料夾

Python 用兩個工具操作檔案系統：`os` 和 `pathlib`（都是內建的，不用安裝）。`pathlib` 比較新、比較好用，這篇以它為主。

**列出資料夾裡的檔案：**

```python
from pathlib import Path

folder = Path("D:/下載")        # 指定一個資料夾（路徑用你自己的）

for item in folder.iterdir():    # 走訪資料夾裡每個項目
    if item.is_file():           # 只看檔案（跳過子資料夾）
        print(item.name)         # 印出檔名
```

**取得檔案資訊：**

```python
from pathlib import Path

p = Path("D:/下載/report.pdf")
print(p.name)        # report.pdf（完整檔名）
print(p.stem)        # report（不含副檔名）
print(p.suffix)      # .pdf（副檔名）
print(p.exists())    # True / False（檔案在不在）
```

這些是自動化的基礎——先「找到並認得」檔案，才能處理它們。

## 二、複製、移動、刪除：shutil

搬動檔案用 `shutil`（也是內建）：

```python
import shutil

shutil.copy("來源.txt", "目標.txt")        # 複製
shutil.move("舊位置.txt", "新位置.txt")      # 移動（也可用來改名）
```

刪除用 `pathlib` 或 `os`：

```python
from pathlib import Path

Path("不要的檔.txt").unlink()      # 刪除單一檔案
```

> ⚠ 刪除、覆寫、移動都是**不可逆**的操作。動真實檔案前，請務必先看第四節的安全提醒。

## 三、實戰範例：依副檔名自動分類

來做一個真正有用的腳本——**把資料夾裡的檔案，依副檔名自動分到對應的子資料夾**（圖片進 images、文件進 docs…）。這是自動化最經典的入門範例：

```python
from pathlib import Path

# 要整理的資料夾（換成你自己的）
folder = Path("D:/下載")

# 副檔名 → 分類資料夾 的對照表（還記得 dict 嗎？）
categories = {
    ".jpg": "images", ".png": "images", ".gif": "images",
    ".pdf": "docs", ".docx": "docs", ".txt": "docs",
    ".mp3": "music", ".mp4": "videos",
}

for item in folder.iterdir():
    if item.is_file():
        ext = item.suffix.lower()          # 取副檔名、轉小寫
        category = categories.get(ext)     # 查對照表
        if category:
            target_dir = folder / category
            target_dir.mkdir(exist_ok=True)  # 建立子資料夾（已存在不報錯）
            item.rename(target_dir / item.name)  # 把檔案搬進去
            print(f"{item.name} → {category}/")
```

這段把前面學的東西全用上了：`pathlib` 找檔案、`dict` 做對照表、`for` 迴圈、`if` 判斷。短短十幾行，就能自動整理一個亂糟糟的下載資料夾。

**批次改檔名**也很常見，例如幫一堆檔案加上前綴：

```python
from pathlib import Path

folder = Path("D:/照片")
for i, item in enumerate(folder.glob("*.jpg"), start=1):   # glob 找所有 jpg
    new_name = folder / f"旅遊_{i:03d}.jpg"                  # 旅遊_001.jpg、旅遊_002.jpg…
    item.rename(new_name)
    print(f"{item.name} → {new_name.name}")
```

（`enumerate` 幫你一邊走訪一邊編號、`{i:03d}` 是補零到 3 位數的格式。）

## 四、安全提醒（動檔案前必看）

自動化腳本動的是**真實檔案**，一個 bug 可能一次毀掉一堆東西。養成這些習慣：

- **先在測試資料夾跑**：複製幾個檔案到一個測試資料夾，確認腳本行為正確，再用在真實檔案。
- **先備份**：對重要資料夾動手前，先整個複製一份備份。
- **先「預覽」再「執行」**：可以先讓腳本只 `print`「我會把 A 搬到 B」但不真的動，確認無誤後再加上實際搬移的那行。

> 這不是膽小，是專業習慣。再厲害的人也會寫錯，差別在於「出錯時有沒有退路」。

## 五、定時 / 排程（簡介）

寫好的腳本想「定時自動跑」（例如每天整理一次），可以：

- **Windows**：用內建的「工作排程器」，設定幾點執行你的 `.py`。
- **Mac / Linux**：用 `cron`（排程工具）。
- 或用 Python 的 `schedule` 套件（`pip install schedule`），在程式裡寫排程邏輯。

這部分屬於進階應用，現在知道「腳本可以定時自動跑」這個方向即可，需要時再深入。

## 六、動手練習

- 寫一個「整理下載資料夾」的腳本（照第三節，但先用測試資料夾）。
- 加上「預覽模式」：先只印出會怎麼搬，確認後再真的搬。
- 挑戰：依「檔案的修改日期」把檔案分到不同月份的資料夾。

每寫一個小腳本，都是把前面學的語法、資料結構、檔案操作再用一次——而且這次是真的在幫自己省事。

## 這一步大約要花多久？

自動化沒有太多新語法要學，主要是熟悉 `pathlib` / `shutil` 的常用操作，抓 **1 週**練手感就夠。練法：

- 從「列出資料夾檔案」開始，慢慢加到「分類、改名」。
- **每個動檔案的腳本都先在測試資料夾跑**，養成安全習慣。
- 想想自己生活裡有什麼重複的檔案工作，試著用腳本解決。

## 下一篇

會自動化後，下一篇是實用應用的最後一塊、也是 Python 的招牌強項：**資料處理**——用 pandas 讀 CSV、篩選、統計、畫圖表，體會為什麼 Python 在資料分析界是王者。

下篇見。🐾

::aff hahow 想把 Python 自動化玩得更溜？ | 自動化能真正幫你省時間。Hahow 上有從 Python 入門到自動化、資料處理的系統課程，想要有完整範例與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[網路爬蟲入門：用 requests + BeautifulSoup 抓網頁資料](python-web-scraping.html)
- ➡️ 下一篇：[資料處理入門：用 pandas 讀 CSV、篩選、統計](python-data-analysis.html)
