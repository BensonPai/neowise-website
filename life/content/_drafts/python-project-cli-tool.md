---
title: "【Python 教學】實戰專案：做一個檔案整理小工具"
description: "學了這麼多，這篇把全部串起來：用 Python 做一個能自動整理資料夾的命令列小工具，實際體會語法、函式、資料結構、檔案操作怎麼協作成一個真正能用的程式。"
keywords: ["Python 專案", "命令列工具", "CLI", "檔案整理", "Python 實戰", "Python 範例", "Python 教學"]
slug: "python-project-cli-tool"
date: "2026-10-13"
order: 12
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "實戰"
series_order: "11"
status: "approved"
youtube: ""
cover_alt: "一個在終端機中執行的 Python 檔案整理工具畫面示意"
images:
  - file: "cover.jpg"
    alt: "一個在終端機中執行的 Python 檔案整理工具畫面示意"
    prompt: "一張乾淨的科技示意圖，一個終端機視窗中顯示 Python 檔案整理工具的執行過程與結果，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何真實可辨識文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

恭喜你走到系列最後一篇！前面學的語法、函式、資料結構、物件導向，還有實用應用（檔案、爬蟲、自動化、資料處理）——這篇要把它們**組起來**，做一個真的能用的程式：**檔案整理小工具**。

這是學程式最有成就感的時刻：把一塊塊零件拼成一個完整的東西。而且這個工具你以後真的用得到——把亂糟糟的下載資料夾一鍵整理乾淨。

## 一、我們要做什麼

一個命令列小工具，功能：

- **掃描**指定資料夾裡的檔案
- 依**副檔名**自動把檔案分類到對應子資料夾（圖片進 images、文件進 docs…）
- **預覽模式**：先看會怎麼分、但不實際動（安全第一）
- **執行整理**：確認無誤後才真的搬

先把需求想清楚再動手，這是好習慣。這個工具正好把[自動化篇](python-automation.html)的檔案操作、和整個系列的基本功都用上。

## 二、設計思路

把工作拆成幾個**函式**（呼應[函式篇](python-functions.html)），各司其職：

- 一個「副檔名 → 分類」的 **dict 對照表**（呼應[資料結構篇](python-data-structures.html)）
- `scan_folder`：掃描資料夾、決定每個檔案要去哪
- `organize`：實際執行搬移（含預覽模式）

把邏輯拆成函式的好處是：好讀、好改、好測試。

## 三、一塊塊看

**對照表**——決定哪種副檔名歸哪類：

```python
CATEGORIES = {
    ".jpg": "images", ".png": "images", ".gif": "images",
    ".pdf": "docs", ".docx": "docs", ".txt": "docs",
    ".mp3": "music", ".mp4": "videos", ".zip": "archives",
}
```

**掃描**——走訪資料夾，列出「每個檔案該搬去哪」：

```python
from pathlib import Path

def scan_folder(folder):
    plan = []                              # 存放 (檔案, 分類) 的清單
    for item in folder.iterdir():
        if item.is_file():
            category = CATEGORIES.get(item.suffix.lower())
            if category:                   # 只處理對照表裡有的副檔名
                plan.append((item, category))
    return plan
```

它回傳一份「整理計畫」——每個元素是「哪個檔案、要搬到哪一類」。先算好計畫、不急著動，這樣才能先預覽。

## 四、預覽模式：安全第一

還記得[自動化篇](python-automation.html)的安全提醒嗎？動真實檔案前，先讓使用者**預覽**會發生什麼，確認了才真的搬。這靠一個 `preview` 參數控制：

```python
def organize(folder, preview=True):
    plan = scan_folder(folder)
    if not plan:
        print("沒有需要整理的檔案。")
        return

    for item, category in plan:
        if preview:
            print(f"[預覽] {item.name} → {category}/")      # 只印，不動
        else:
            target_dir = folder / category
            target_dir.mkdir(exist_ok=True)
            item.rename(target_dir / item.name)             # 真的搬
            print(f"[完成] {item.name} → {category}/")
```

`preview=True` 時只印出計畫、不動任何檔案；`preview=False` 才真的搬。這就是「先看再做」的安全設計。

## 五、完整程式（可直接執行）

把上面全部組起來。這是**完整、可以整段貼上執行**的版本。先說明這支程式包含的部分，貼完可以對照：

- `CATEGORIES`：副檔名對照表
- `scan_folder`：掃描、產生整理計畫
- `organize`：執行（含預覽模式）
- `main`：主流程，問使用者資料夾、先預覽、確認後再整理

```python
from pathlib import Path

# 副檔名 → 分類資料夾
CATEGORIES = {
    ".jpg": "images", ".png": "images", ".gif": "images",
    ".pdf": "docs", ".docx": "docs", ".txt": "docs",
    ".mp3": "music", ".mp4": "videos", ".zip": "archives",
}


def scan_folder(folder):
    """掃描資料夾，回傳 [(檔案, 分類), ...] 的整理計畫"""
    plan = []
    for item in folder.iterdir():
        if item.is_file():
            category = CATEGORIES.get(item.suffix.lower())
            if category:
                plan.append((item, category))
    return plan


def organize(folder, preview=True):
    """整理資料夾。preview=True 只預覽、不動檔案"""
    plan = scan_folder(folder)
    if not plan:
        print("沒有需要整理的檔案。")
        return

    for item, category in plan:
        if preview:
            print(f"[預覽] {item.name} → {category}/")
        else:
            target_dir = folder / category
            target_dir.mkdir(exist_ok=True)
            item.rename(target_dir / item.name)
            print(f"[完成] {item.name} → {category}/")


def main():
    # 問使用者要整理哪個資料夾
    path = input("請輸入要整理的資料夾路徑：").strip()
    folder = Path(path)

    # 錯誤處理：資料夾不存在就結束（呼應例外處理觀念）
    if not folder.is_dir():
        print("找不到這個資料夾，請確認路徑。")
        return

    # 1. 先預覽
    print("\n=== 預覽（不會真的動檔案）===")
    organize(folder, preview=True)

    # 2. 問使用者要不要真的執行
    answer = input("\n確定要照上面整理嗎？(y/n)：").strip().lower()
    if answer == "y":
        print("\n=== 開始整理 ===")
        organize(folder, preview=False)
        print("\n整理完成！🐾")
    else:
        print("已取消，沒有動任何檔案。")


# 程式進入點
if __name__ == "__main__":
    main()
```

> 最後那行 `if __name__ == "__main__":` 是 Python 的慣例寫法，意思是「這個檔案被直接執行時，才跑 main()」。現在先照抄、知道它是程式進入點即可，之後學到模組會更懂。

**跑跑看**（強烈建議先用測試資料夾）：先隨便建一個資料夾、丟幾個不同類型的檔案進去，執行程式、輸入那個資料夾路徑。它會**先給你預覽**，你確認 `y` 之後才真的分類。這個「先預覽再執行」正是負責任的檔案工具該有的樣子。

## 六、看看你用上了哪些東西

回頭看這個程式，整個系列的觀念幾乎都在裡面：

| 用到的技能 | 在哪裡 | 哪篇學的 |
|---|---|---|
| 變數、流程控制 | if 判斷、for 迴圈 | 語法基礎 |
| 函式 | scan_folder、organize、main | 函式 |
| 資料結構 | CATEGORIES（dict）、plan（list） | 資料結構 |
| 檔案操作 | pathlib、rename、mkdir | 自動化 |
| 錯誤處理觀念 | 檢查資料夾存不存在 | 檔案與 JSON |

每個單篇學的時候像零散的積木，組起來就是一個真東西。這就是學程式的樣子。

## 七、自己動手升級

想繼續練，試著加功能：

- **依日期分類**：把檔案依修改月份分到不同資料夾。
- **可設定的對照表**：把 CATEGORIES 存成 JSON 檔，程式啟動時讀進來（用上[檔案與 JSON 篇](python-files-json.html)）。
- **做成命令列參數工具**：用內建的 `argparse`，讓你能 `python organize.py D:/下載` 直接帶路徑執行。
- **加記錄**：把每次整理了哪些檔案寫進一個 log 檔。

每加一個功能，都是把前面學的再用一次。

## 系列總結：你已經走完 Python 入門這條路

從第一篇到這裡，你完成了一整條學習路徑：

- **基礎**：環境、語法、函式、資料結構。
- **物件導向**：類別與物件、繼承與特殊方法。
- **實用應用**：檔案與 JSON、爬蟲、自動化、資料處理。
- **實戰**：把全部整合成一個能用的工具。

你現在具備的，不只是「背了一些語法」，而是**能獨立做出一個完整小程式的能力**，而且摸過了 Python 最實用的幾個方向。這是很多人學程式卡住、而你跨過去了的那道門檻。

接下來往哪走？Python 的世界很大：

- **資料分析 / AI**：接續 pandas，往 NumPy、機器學習（scikit-learn）、深度學習發展。
- **網站後端**：用 Django 或 Flask 做網站與 API。
- **自動化深化**：把更多日常工作交給程式。
- **桌面 / 遊戲**：PyQt 做桌面程式、Pygame 做小遊戲。

挑一個你有興趣的方向深入，記得——**持續動手做專案**，是進步最快的路。

謝謝你跟著智慧喵走完這個系列，辛苦了！有任何問題，歡迎來 YouTube 找我聊聊。我們下個系列見。🐾

::aff hahow 想繼續把 Python 學得更深？ | 入門之後想進階到資料分析、AI、網站或自動化，Hahow 上有不少 Python 系統課程，挑一個有興趣的方向帶著專案練下去吧。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[資料處理入門：用 pandas 讀 CSV、篩選、統計](python-data-analysis.html)
- 🎉 這是系列最後一篇，恭喜你學完！
