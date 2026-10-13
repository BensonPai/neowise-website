---
title: "【Python 教學】資料結構：list、tuple、dict、set 一次搞懂"
description: "Python 最常用的四種資料結構：list（清單）、tuple（元組）、dict（字典）、set（集合）。這篇帶你搞懂它們各自怎麼用、差在哪、什麼時候用哪個，還有好用的推導式。"
keywords: ["Python list", "Python dict", "tuple", "set", "資料結構", "推導式", "list comprehension", "Python 教學"]
slug: "python-data-structures"
date: "2026-10-13"
order: 5
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "基礎"
series_order: "4"
status: "approved"
youtube: ""
cover_alt: "示意 list、dict、set 等不同資料結構的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意 list、dict、set 等不同資料結構的概念圖"
    prompt: "一張簡潔的概念示意圖，幾種不同形狀的容器分別象徵 list、dict、set 資料結構，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[函式](python-functions.html)學完，這篇是基礎篇最後一塊、也是 Python 的核心武器：**資料結構**。

前面我們一次只處理一個值，但真實程式常要處理「一群」資料：一串名字、一堆分數、一組設定。Python 有四種最常用的「容器」來裝它們——**list、tuple、dict、set**。這篇全部搞懂，後面的實用應用才學得輕鬆。

> 上一篇函式提到的 tuple、dict，這篇就會講清楚，前後正好接上。

## 一、list（清單）：最常用

`list`（清單）用來裝「一串**有順序、可以改**的東西」，用**方括號 `[ ]`**：

```python
fruits = ["蘋果", "香蕉", "橘子"]

print(fruits[0])        # 蘋果（用索引取，從 0 開始）
print(len(fruits))      # 3（len() 算長度）

fruits.append("芒果")   # 加到最後
fruits.remove("香蕉")   # 移除某個
fruits[0] = "草莓"      # 直接改某個位置

print(fruits)           # ['草莓', '橘子', '芒果']
```

**切片（slicing）**——取一段：

```python
nums = [10, 20, 30, 40, 50]
print(nums[1:3])    # [20, 30]（從索引 1 到 2，不含 3）
print(nums[:2])     # [10, 20]（開頭到索引 1）
print(nums[-1])     # 50（-1 代表最後一個）
```

- 常用方法：`append()` 加、`remove()` 刪、`len()` 算長度。
- 走訪用上一篇學的 `for`：`for fruit in fruits:`。

## 二、tuple（元組）：不可變的清單

`tuple`（元組）跟 list 很像，但**一旦建立就不能改**，用**小括號 `( )`**：

```python
point = (3, 5)        # 一個座標
print(point[0])       # 3

# point[0] = 10       # ❌ 會出錯，tuple 不能改
```

**什麼時候用 tuple？** 當這組資料「不該被改動」時——例如座標、RGB 顏色、設定值。用 tuple 等於告訴別人（和自己）：這組資料是固定的，別亂動。

> 還記得上一篇 `*numbers` 把一堆參數「打包成一包」嗎？那一包其實就是 tuple。現在這個名詞你懂了。

## 三、dict（字典）：鍵值對

`dict`（字典）用來「用一個鍵去查對應的值」，像查字典：給一個詞，得到解釋。用**大括號 `{ }`**，裡面是 `鍵: 值`：

```python
scores = {"小明": 90, "小華": 85, "小美": 95}

print(scores["小明"])        # 90（用鍵查值）
scores["小強"] = 88          # 新增一組
scores["小明"] = 92          # 修改
del scores["小華"]           # 刪除

# 走訪：items() 一次拿鍵和值
for name, score in scores.items():
    print(f"{name}：{score} 分")
```

- 用 `[鍵]` 設定或讀取值。
- `.items()` 走訪、`.keys()` 只拿鍵、`.values()` 只拿值。
- 適合「用某個東西快速找到對應資料」，例如用名字找分數、用學號找學生。

> 上一篇提到的 `**kwargs`（打包「名字=值」成對參數），打包成的就是 dict。又一個名詞補上了。

## 四、set（集合）：不重複的一堆值

`set`（集合）裝「一堆**不重複**的值」，會自動去除重複，用大括號 `{ }`（但沒有鍵值對）：

```python
nums = {1, 2, 2, 3, 3, 3}
print(nums)             # {1, 2, 3}（重複的自動消失）

# 常見用途：快速去重複
names = ["小明", "小華", "小明", "小美"]
unique = set(names)     # {'小明', '小華', '小美'}
```

set 還能做數學上的集合運算——交集（兩邊都有的）、聯集（兩邊合起來的）、差集（我有你沒有的）：

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a & b)    # {3, 4}（交集：兩邊都有）
print(a | b)    # {1, 2, 3, 4, 5, 6}（聯集：合起來、自動去重複）
print(a - b)    # {1, 2}（差集：a 有但 b 沒有）
```

實際用途例如：兩個人各有一份名單，想找出「兩人共同認識的」就用交集 `&`、「兩份名單合起來有誰」就用聯集 `|`。不過最常用的，還是前面那個**去重複**。

## 五、四種怎麼選？

快速對照，幫你記：

| 結構 | 符號 | 特性 | 什麼時候用 |
|------|------|------|-----------|
| list | `[ ]` | 有順序、可改 | 最常用，裝一串會變動的資料 |
| tuple | `( )` | 有順序、不可改 | 一組固定不該變的資料 |
| dict | `{鍵:值}` | 鍵值對 | 用鍵查值（名字→分數） |
| set | `{ }` | 不重複、無序 | 去重複、判斷有沒有 |

**不確定用哪個？** 90% 的情況用 **list** 就對了，需要「用鍵查」才用 **dict**。這兩個是最常用的，先把它們練熟。

## 六、推導式：Python 的招牌寫法

**推導式（comprehension）** 是 Python 很有特色的簡潔寫法——用一行產生一個 list。先看傳統寫法 vs 推導式的對比：

```python
# 傳統寫法：產生 0~4 各乘以 2
result = []
for x in range(5):
    result.append(x * 2)
# result = [0, 2, 4, 6, 8]

# 推導式：同樣的事，一行搞定
result = [x * 2 for x in range(5)]
# result = [0, 2, 4, 6, 8]
```

還能加條件篩選：

```python
# 只要偶數
evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]
```

推導式讀起來像白話：「對 range(10) 裡每個 x，如果是偶數就留下」。一開始覺得不習慣沒關係，看多就順了——這是很 Python 的寫法，別人的程式裡很常見。

## 七、動手綜合練習

用資料結構做一個「統計一段文字裡每個字出現幾次」的小程式（dict 的經典用法）：

```python
text = "香蕉蘋果香蕉橘子蘋果香蕉"
count = {}

for char in text:
    if char in count:
        count[char] += 1      # 已經有了，次數 +1
    else:
        count[char] = 1       # 第一次出現，設為 1

for char, times in count.items():
    print(f"{char}：{times} 次")
# 香蕉 → 蕉、香各 3 次；蘋果各 2 次；橘子各 1 次
```

試著自己改：找出出現最多次的字？用 set 算這段文字用了幾種不同的字？動手改最有感。

## 這一步大約要花多久？

四種資料結構裡，**list 和 dict 最常用、一定要熟**；tuple 和 set 先知道特性、用到再深入即可。推導式一開始可以先用傳統 for 寫法，熟了再換成推導式。練法：

- 用 list 裝一串東西、增刪改查、走訪。
- 用 dict 做「用鍵查值」的小程式（像上面的字數統計）。
- 試著把一個 for 迴圈改寫成推導式。

這四種結構會貫穿你之後寫的所有 Python 程式，是真正的核心基本功。

## 下一篇

基礎篇到這裡就完整了——語法、函式、資料結構，你已經能寫出像樣的小程式。接下來進入 **物件導向**，下一篇從 **類別與物件** 開始，學會用「藍圖造物件」的方式組織更大的程式。

下篇見。🐾

::aff hahow 想把 Python 基礎練得更扎實？ | 資料結構是 Python 的核心武器。Hahow 上有從 Python 入門到實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[函式：把程式切成好用的小塊](python-functions.html)
- ➡️ 下一篇：[類別與物件：用物件的方式組織程式](python-classes-objects.html)
