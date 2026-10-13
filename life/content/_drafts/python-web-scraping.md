---
title: "【Python 教學】網路爬蟲入門：用 requests + BeautifulSoup 抓網頁資料"
description: "Python 最受歡迎的應用之一就是爬蟲。這篇帶你用 requests 抓網頁、用 BeautifulSoup 解析內容，從零學會自動抓取網頁資料，並說明禮貌爬取與法律界線。"
keywords: ["Python 爬蟲", "requests", "BeautifulSoup", "網路爬蟲", "抓網頁", "web scraping", "Python 教學"]
slug: "python-web-scraping"
date: "2026-10-13"
order: 9
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "實用應用"
series_order: "8"
status: "approved"
youtube: ""
cover_alt: "示意程式自動從網頁抓取資料的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式自動從網頁抓取資料的概念圖"
    prompt: "一張簡潔的概念示意圖，一個程式圖示用箭頭從網頁圖示抓取資料方塊，象徵網路爬蟲，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](python-files-json.html)學會存讀資料。這篇講 Python 最受歡迎的應用之一：**網路爬蟲**——用程式自動把網頁上的資料抓下來。

爬蟲很實用（抓價格、整理資料、監控更新），但它也最需要「守規矩」。所以這篇**先講規矩，再講技術**——爬得聰明，也要爬得正當。

## 一、先搞懂規矩（這段最重要，別跳過）

用程式抓別人的網站，不是「技術上做得到」就代表「可以做」。開始前先建立這些觀念：

- **看 robots.txt**：大多網站在網址後面加 `/robots.txt`（例如 `example.com/robots.txt`）會列出「哪些頁面不希望被爬」。這是業界共識，請尊重它。
- **看網站使用條款**：有些網站明文禁止爬取，違反可能有法律責任。
- **別狂打**：短時間大量請求會造成對方伺服器負擔，等同攻擊。**每次請求之間要加延遲**（後面會教）。
- **個資與版權**：抓到的資料若含個人資料或受版權保護的內容，不能隨意散布、商用。
- **優先找官方 API**：很多服務有提供官方 API（正式的資料取得管道），有 API 就用 API，比爬 HTML 更穩定、也更正當。

> 一句話總結：**把爬蟲當成「有禮貌的訪客」**——輕手輕腳、遵守告示、不打擾對方正常運作。本篇範例都用公開、允許練習的網站。

## 二、安裝工具

爬蟲用兩個套件：`requests`（抓網頁）和 `beautifulsoup4`（解析內容）。用上一篇沒細講、但總覽提過的 **pip** 安裝：

```bash
pip install requests beautifulsoup4
```

（Mac/Linux 若 `pip` 沒反應，試 `pip3`。）

> 如果執行程式時出現 `ModuleNotFoundError: No module named 'requests'`（明明裝了卻找不到），通常是「裝套件的 Python」和「跑程式的 Python」不是同一個。解法請回頭看[環境準備篇的 venv 段落](python-setup-tools.html)——用虛擬環境把它們綁在一起就不會出錯。

## 三、用 requests 抓網頁

`requests` 讓你用一行就把網頁抓下來：

```python
import requests

url = "https://example.com"
response = requests.get(url)        # 發出請求、拿回回應

print(response.status_code)         # 200 代表成功
print(response.text[:200])          # 印出網頁 HTML 的前 200 字
```

重點：

- **`requests.get(網址)`**：抓一個網頁，回傳一個 response 物件。
- **`response.status_code`**：狀態碼。**200** = 成功；**404** = 找不到；**403** = 被拒絕。
- **`response.text`**：網頁的 HTML 原始碼（一大串字串）。

**加上 headers（模擬瀏覽器）**：有些網站會擋掉沒有瀏覽器標頭的請求，加個 `User-Agent` 比較不會被擋：

```python
headers = {"User-Agent": "Mozilla/5.0"}
response = requests.get(url, headers=headers)
```

## 四、用 BeautifulSoup 解析

抓回來的 `response.text` 是一大串 HTML，很難直接用。**BeautifulSoup** 幫你把它變成「可以用程式找東西」的結構：

```python
import requests
from bs4 import BeautifulSoup

url = "https://example.com"
response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})

# 把 HTML 丟給 BeautifulSoup 解析
soup = BeautifulSoup(response.text, "html.parser")

# 找東西
print(soup.title.text)              # 網頁標題
print(soup.find("h1").text)         # 第一個 <h1> 的文字

# find_all 找出所有符合的
for link in soup.find_all("a"):     # 所有 <a> 連結
    print(link.get("href"))         # 取出連結的網址
```

常用方法：

- **`BeautifulSoup(html, "html.parser")`**：建立解析器。
- **`soup.find("標籤")`**：找**第一個**符合的元素。
- **`soup.find_all("標籤")`**：找**所有**符合的，回傳一個 list。
- **`.text`**：取元素裡的文字；**`.get("屬性")`**：取屬性值（像連結的 `href`）。

## 五、禮貌爬取：加延遲

如果你要連續抓很多頁，**一定要在每次請求之間加延遲**，別把對方伺服器打爆：

```python
import requests
import time

urls = ["https://example.com/page1", "https://example.com/page2"]

for url in urls:
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    print(f"抓了 {url}，狀態 {response.status_code}")
    time.sleep(2)        # 每抓一頁休息 2 秒，當個有禮貌的訪客
```

`time.sleep(2)` 讓程式暫停 2 秒再抓下一頁。這一步看似拖慢速度，但它是負責任爬蟲的基本禮貌，也降低你被封鎖的機會。

## 六、動手練習與注意

一個完整的小範例（抓網頁標題與所有連結）：

```python
import requests
from bs4 import BeautifulSoup
import time

url = "https://example.com"       # 練習請用公開、允許爬取的網站
response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})

if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")
    print("標題：", soup.title.text)
    print("連結：")
    for link in soup.find_all("a"):
        print(" -", link.get("href"))
else:
    print(f"抓取失敗，狀態碼 {response.status_code}")

time.sleep(2)
```

**練習建議**：拿 `example.com` 這種公開範例站、或專門給人練爬蟲的網站（搜尋「爬蟲練習網站」）來試，別一上來就爬商業網站。再次提醒——**合法與禮貌是底線**，技術只是工具。

## 這一步大約要花多久？

爬蟲基本流程（requests 抓 → BeautifulSoup 解析）抓 **1~2 週**就能上手。難的通常不是語法，而是「看懂目標網頁的 HTML 結構、找出要抓的元素在哪」，這需要多練。練法：

- 先用 `example.com` 練 requests + BeautifulSoup 的基本流程。
- 用瀏覽器的「檢查元素」看網頁結構，練習用 find / find_all 定位。
- **每個練習都加 `time.sleep`**，養成禮貌爬取的習慣。

## 下一篇

會抓網頁後，下一篇講另一個超實用的應用：**自動化腳本**——用 Python 批次處理檔案、整理資料夾，把每天重複的瑣事交給程式，體會「寫一次、省一輩子」的威力。

下篇見。🐾

::aff hahow 想把 Python 爬蟲學得更完整？ | 爬蟲從入門到實戰有不少眉角。Hahow 上有專門的 Python 爬蟲系統課程，想要有完整範例與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[檔案讀寫與 JSON：讓程式能存資料、讀資料](python-files-json.html)
- ➡️ 下一篇：[自動化腳本：把重複的工作交給程式](python-automation.html)
