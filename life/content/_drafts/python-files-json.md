---
title: "【Python 教學】檔案讀寫與 JSON：讓程式能存資料、讀資料"
description: "程式關掉資料就不見？這篇帶你用 Python 做檔案讀寫（open、with），並用內建 json 模組把資料存成 JSON、再讀回來，讓程式真正能記住東西。"
keywords: ["Python 檔案讀寫", "open", "with", "JSON", "json 模組", "讀寫檔案", "Python 教學"]
slug: "python-files-json"
date: "2026-10-13"
order: 8
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "實用應用"
series_order: "7"
status: "approved"
youtube: ""
cover_alt: "示意程式把資料寫入檔案、再從檔案讀回的雙向流程概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式把資料寫入檔案、再從檔案讀回的雙向流程概念圖"
    prompt: "一張簡潔的概念示意圖，一個程式圖示與一個檔案圖示之間有雙向箭頭，象徵資料寫入與讀取，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

物件導向篇走完，從這篇開始進入 Python 最有感的 **實用應用** 階段——學一點就能馬上幫自己做事。第一篇講最基本也最常用的：**讓程式能把資料存起來**。

你前面寫的程式有個共同問題：**一關掉，資料就全沒了**。因為資料都放在記憶體，程式結束就清空。這篇教你把資料**存進檔案**、下次**讀回來**，程式才能真正「記住東西」。這也是最後實戰篇的基礎。

## 一、基本檔案讀寫

Python 用 `open()` 開檔案，但更推薦搭配 **`with`** 寫，它會自動幫你關檔，不用自己記得關：

**寫入檔案：**

```python
# "w" = write 寫入模式（檔案不存在會建立、存在會整個覆蓋）
with open("note.txt", "w", encoding="utf-8") as f:
    f.write("這是我存下來的筆記。\n")
    f.write("第二行。")

print("已寫入 note.txt")
```

**讀取檔案：**

```python
# "r" = read 讀取模式
with open("note.txt", "r", encoding="utf-8") as f:
    content = f.read()      # 讀整個檔案成一個字串

print(content)
```

重點：

- **`with open(...) as f:`**：開檔並命名為 `f`，區塊結束自動關檔（推薦這樣寫）。
- **模式**：`"r"` 讀、`"w"` 寫（覆蓋）、`"a"` 附加（接在後面不覆蓋）。
- **`encoding="utf-8"`**：處理中文一定要加，否則可能亂碼。
- `f.read()` 讀整個檔；`f.readlines()` 讀成一行一個元素的 list。

**一行一行讀**（檔案大時更省記憶體）：

```python
with open("note.txt", "r", encoding="utf-8") as f:
    for line in f:                   # 直接走訪，一次一行
        print(line.strip())          # strip() 去掉每行結尾的換行
```

## 二、為什麼需要 JSON

純文字好存，但實務上你要存的常是**結構化資料**——一個 dict、一串物件。如果自己把每個欄位拼成文字、讀回來再拆解，太麻煩也容易出錯。

這就是 **JSON** 登場的時候。JSON 是一種通用資料格式，長這樣：

```json
{
  "name": "智慧喵",
  "age": 3
}
```

好處是：**人看得懂、程式好處理、跨語言通用**（網路 API 幾乎都用它）。而且它跟 Python 的 dict/list 幾乎長一樣，轉換超自然。

## 三、用 json 模組存讀資料

Python 內建 `json` 模組，不用額外安裝。先 `import` 進來：

**把資料存成 JSON 檔（`json.dump`）：**

```python
import json

data = {
    "name": "智慧喵",
    "age": 3,
    "skills": ["Python", "理財", "旅遊"]
}

with open("data.json", "w", encoding="utf-8") as f:
    # ensure_ascii=False 讓中文正常顯示、indent=2 讓檔案有排版好閱讀
    json.dump(data, f, ensure_ascii=False, indent=2)

print("已存成 data.json")
```

**從 JSON 檔讀回資料（`json.load`）：**

```python
import json

with open("data.json", "r", encoding="utf-8") as f:
    data = json.load(f)      # 讀回來就是 Python 的 dict

print(data["name"])          # 智慧喵
print(data["skills"])        # ['Python', '理財', '旅遊']
```

- **`json.dump(資料, 檔案)`**：把 Python 資料寫成 JSON 存檔。
- **`json.load(檔案)`**：把 JSON 檔讀回成 Python 資料（dict / list）。
- 存中文記得加 **`ensure_ascii=False`**，否則會變成 `\uXXXX` 的編碼；`indent=2` 讓檔案有縮排好讀。

> 還有一對 `json.dumps()` / `json.loads()`（結尾多個 s）——它們是「物件 ↔ 字串」互轉（不碰檔案），用在例如處理網路 API 回傳的 JSON 字串。名字差一個 s，別搞混：**沒 s 的碰檔案、有 s 的碰字串**。

## 四、別忘了錯誤處理

讀檔很容易出錯——**檔案不存在**最常見。用 `try / except` 接住它：

```python
import json

try:
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"讀入成功：{data['name']}")
except FileNotFoundError:
    print("檔案不存在，可能是第一次執行，從空資料開始。")
    data = {}
```

特別是「**第一次執行時檔案還不存在**」這情況很常見——用 `try/except` 接住 `FileNotFoundError`、改成「從空資料開始」，程式就不會因為找不到檔案而崩潰。這個模式實戰篇會直接用到。

> `try / except` 是 Python 的錯誤處理（其他語言常叫 try/catch，Python 用 except）。這裡先看懂這個「接住檔案不存在」的常用模式即可。

**還有哪些常見異常？** `FileNotFoundError` 只是其中一個，新手最常遇到的還有這幾個：

| 異常名稱 | 什麼時候發生 | 例子 |
|---------|------------|------|
| `FileNotFoundError` | 開啟不存在的檔案 | `open("沒這檔.txt")` |
| `ValueError` | 值不對、轉換失敗 | `int("abc")` |
| `TypeError` | 型別用錯 | `"字" + 1` |
| `KeyError` | 查 dict 不存在的鍵 | `d["沒這鍵"]` |
| `IndexError` | list 索引超出範圍 | 空 list 取 `[0]` |
| `ZeroDivisionError` | 除以 0 | `10 / 0` |

你可以針對不同異常分別處理，`except` 也能一次接住全部：

```python
try:
    # 可能出錯的程式
    pass
except FileNotFoundError:
    print("檔案找不到")
except ValueError:
    print("值不對")
except Exception as e:     # 接住「其他所有」異常，e 是錯誤內容
    print(f"發生其他錯誤：{e}")
```

> 兩個實用小技巧：
> 1. **不知道會丟哪個異常？先故意跑錯一次**——Python 的錯誤訊息**最後一行**會告訴你異常名字（例如 `KeyError: '小李'`），照抄去 `except` 接就對了。
> 2. **想查完整清單**：看 Python 官方文件的[內建例外頁面](https://docs.python.org/3/library/exceptions.html)（可切換成繁體中文），列出所有內建異常。

## 五、動手綜合練習

把檔案 + JSON + 前面學的資料結構串起來，做一個「存讀待辦清單」的小程式（為實戰篇鋪路）：

```python
import json

FILE = "todos.json"

# 準備一串待辦（每筆是一個 dict）
todos = [
    {"title": "寫 Python 教學", "done": False},
    {"title": "買晚餐", "done": True},
]

# 存檔
with open(FILE, "w", encoding="utf-8") as f:
    json.dump(todos, f, ensure_ascii=False, indent=2)
print(f"已存 {len(todos)} 筆")

# 讀回來（含錯誤處理）
try:
    with open(FILE, "r", encoding="utf-8") as f:
        loaded = json.load(f)
    for t in loaded:
        mark = "完成" if t["done"] else "待辦"
        print(f"[{mark}] {t['title']}")
except FileNotFoundError:
    print("還沒有待辦清單")
```

跑完去程式目錄找找 `todos.json`，打開看看裡面長什麼樣（排版好的 JSON）。試著自己加一筆、重新跑，確認存讀都正確。

## 這一步大約要花多久？

檔案讀寫觀念簡單（`with open` 的寫法幾分鐘就懂）。JSON 建議多練，因為自動化、爬蟲、資料處理都會用到。練法：

- 先練純文字讀寫，確認檔案真的建立、讀得回來（記得加 `encoding="utf-8"`）。
- 練把一個 dict / list 存成 JSON 再讀回。
- 一定要練「檔案不存在時用 try/except 接住」，這是實務必備。

## 下一篇

會存讀資料後，下一篇進入 Python 最受歡迎的應用之一：**網路爬蟲**——用 requests + BeautifulSoup 自動抓網頁資料。我也會特別講「禮貌爬取」和法律界線，爬得聰明也要爬得正當。

下篇見。🐾

::aff hahow 想把 Python 實用技能練得更扎實？ | 檔案與資料處理是實戰必備。Hahow 上有從 Python 入門到爬蟲、資料分析的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[繼承與特殊方法：讓類別更強大](python-oop-inheritance.html)
- ➡️ 下一篇：[網路爬蟲入門：用 requests + BeautifulSoup 抓網頁資料](python-web-scraping.html)
