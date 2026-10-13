---
title: "【Python 教學】語法基礎：變數、型別、流程控制與縮排規則"
description: "環境裝好後，就從 Python 語法基礎開始動手寫。這篇帶你搞懂變數與型別、運算子、if/for/while 流程控制，以及 Python 最特別的「用縮排表示程式區塊」規則，打好地基。"
keywords: ["Python 變數", "Python 型別", "Python 流程控制", "Python 縮排", "if", "for 迴圈", "Python 語法", "Python 教學"]
slug: "python-syntax-basics"
date: "2026-10-13"
order: 3
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "基礎"
series_order: "2"
status: "approved"
youtube: ""
cover_alt: "程式編輯器中一段 Python 變數與 for 迴圈的程式碼示意"
images:
  - file: "cover.jpg"
    alt: "程式編輯器中一段 Python 變數與 for 迴圈的程式碼示意"
    prompt: "一張乾淨明亮的科技示意圖，畫面是程式編輯器中一段彩色的 Python 程式碼，包含變數與迴圈結構，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何可辨識文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[環境裝好了](python-setup-tools.html)，這篇開始真正動手寫 **Python**。

這一篇是整個系列的地基：變數、型別、運算子、流程控制——寫**任何** Python 程式都會用到的基本功。Python 語法很乾淨，但它有一個跟多數語言很不一樣的規則（縮排），我會特別講清楚。建議每個範例都親手打一次、改改看，手感比死背重要。

小提醒：在 VS Code 建一個 `.py` 檔，把範例貼進去跟著跑最有效。文中的 `print(...)` 就是「印出一行」。

## 一、變數與型別

Python 的變數**不用宣告型別**，直接賦值就好——它會自動判斷：

```python
score = 100          # 整數
name = "智慧喵"       # 字串
height = 175.5       # 小數
is_student = False   # 布林（True / False）
```

- 不用寫 `int`、`string` 這些，Python 看你給什麼值，自動決定型別（這叫**動態型別**）。
- 變數命名習慣用小寫加底線（像 `is_student`），這是 Python 的慣例。

想知道某個變數是什麼型別，用 `type()`：

```python
print(type(score))   # <class 'int'>（整數）
print(type(name))    # <class 'str'>（字串）
```

常見型別：`int`（整數）、`float`（小數）、`str`（字串）、`bool`（布林）。

**型別轉換**：

```python
age_text = "25"           # 這是字串
age = int(age_text)       # 轉成整數 25
price = str(100)          # 數字轉字串 "100"
```

> 新手陷阱：從鍵盤輸入或檔案讀進來的東西，**預設都是字串**。例如 `input()` 讀到的 `"25"` 是字串，要拿來算數學得先 `int()` 轉成數字，否則 `"25" + 1` 會出錯。

## 二、運算子與字串

**算術運算子**：

```python
a = 10
b = 3
print(a + b)    # 13
print(a - b)    # 7
print(a * b)    # 30
print(a / b)    # 3.3333...（Python 的 / 一律給小數）
print(a // b)   # 3（// 是整數除法，捨去小數）
print(a % b)    # 1（餘數）
print(a ** b)   # 1000（次方，10 的 3 次方）
```

> 跟某些語言不同：Python 的 `/` 永遠給小數結果（`10 / 3` 是 3.33）。想要整數相除捨去小數，用 `//`。

**比較與邏輯**：Python 的邏輯運算子用英文單字 `and` / `or` / `not`（不是 `&&`、`||`）：

```python
print(a > b)              # True
print(a > 5 and b < 5)    # True（兩邊都成立）
print(a > 5 or b > 5)     # True（任一成立）
print(not a > 5)          # False
```

**字串格式化（f-string）**：在字串前加 `f`，用 `{}` 把變數塞進去，超好用：

```python
name = "智慧喵"
level = 3
print(f"哈囉 {name}，你現在是第 {level} 級")
# 哈囉 智慧喵，你現在是第 3 級
```

## 三、縮排：Python 最特別的地方

這是 Python 跟多數語言**最不一樣**的點，新手一定要先搞懂。

多數語言（像 C#、Java）用**大括號 `{ }`** 來框住一個程式區塊。Python 不用大括號——它**用「縮排」來表示程式區塊**：

```python
if score >= 60:
    print("及格")        # 縮排了，所以屬於 if 的內容
    print("恭喜")        # 一樣縮排，也屬於 if
print("這行沒縮排")       # 回到最外層，不屬於 if
```

重點：

- 區塊開頭的那行結尾要加 **冒號 `:`**（像 `if ...:`）。
- 下一層的程式要**往右縮排**（慣例是 **4 個空白**）。
- 同一個區塊的縮排必須**一致**，縮錯會直接報錯（`IndentationError`）。

> 新手最常踩的雷就是縮排。好消息是：VS Code 會幫你自動縮排，而且**不要混用「空白」和「Tab」**（看起來一樣、電腦看起來不一樣，會報錯）。VS Code 預設按 Tab 會轉成空白，照它的預設走最安全。

這個設計的好處是：Python 程式天生整齊，想亂排都難。

## 四、流程控制

### if：條件判斷

```python
temperature = 28

if temperature >= 30:
    print("好熱，開冷氣")
elif temperature >= 20:      # elif = else if
    print("天氣舒服")
else:
    print("有點冷")
```

注意：條件後面加冒號 `:`、下一行縮排。`elif` 是 Python 版的「else if」。

### for：走訪 / 重複

Python 的 `for` 很直覺——「對每個東西做一件事」：

```python
# 搭配 range() 跑固定次數
for i in range(1, 6):        # 1, 2, 3, 4, 5（不含 6）
    print(f"第 {i} 次")

# 直接走訪一串東西
fruits = ["蘋果", "香蕉", "橘子"]
for fruit in fruits:
    print(fruit)
```

- `range(1, 6)` 產生 1 到 5（**不含結尾的 6**，這點新手要記）。
- `for x in 一串東西` 會一個個取出來，比其他語言的 for 迴圈好讀。

### while：條件成立就一直做

```python
count = 3
while count > 0:
    print(f"倒數 {count}")
    count -= 1        # 別忘了讓條件有機會變 False，否則變無窮迴圈
```

`break` 可中途跳出迴圈、`continue` 可跳過這一輪，兩個都常用。

## 五、動手綜合練習

把上面全用上，做一個「印 1 到 10、標出奇偶數」的小程式：

```python
for i in range(1, 11):           # 1 到 10
    if i % 2 == 0:
        print(f"{i} 是偶數")
    else:
        print(f"{i} 是奇數")
```

跑跑看，再試著自己改：只印偶數？改成 1 到 100？用 `i % 3 == 0` 找 3 的倍數？動手改，才是真的學會。

## 這一步大約要花多久？

Python 語法基礎抓 **1~2 週**。如果你學過其他語言（C#、Java 等），觀念大多相通，可能幾天就上手，主要是適應縮排和 Python 的寫法。練法：

- 每個觀念親手打、改數值看變化。
- **特別練縮排**——這是 Python 新手最常卡的地方，多寫幾個 if、for 就習慣了。
- 寫個小程式綜合練習，例如「輸入分數印等第」。

重點是手感，不是背。這些會在你之後寫的每一支 Python 程式裡反覆出現。

## 下一篇

變數和流程控制有了，但程式一長就會亂。下一篇進入 **函式**——學會用 `def` 把程式切成一塊塊好用、可重用的「函式」，讓程式有條理。

下篇見。🐾

::aff hahow 想把 Python 練得更扎實？ | 語言基礎最怕只看不練。Hahow 上有從 Python 入門到實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[開發環境準備：安裝 Python、VS Code，跑出第一支程式](python-setup-tools.html)
- ➡️ 下一篇：[函式：把程式切成好用的小塊](python-functions.html)
