---
title: "【Python 教學】函式：把程式切成好用的小塊"
description: "程式變長就該拆成函式。這篇帶你搞懂 Python 的函式：用 def 定義、參數與回傳值、預設參數，以及 *args / **kwargs 入門，讓程式有條理、可重用。"
keywords: ["Python 函式", "def", "參數", "回傳值", "預設參數", "args kwargs", "Python 教學"]
slug: "python-functions"
date: "2026-10-13"
order: 4
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "基礎"
series_order: "3"
status: "approved"
youtube: ""
cover_alt: "示意程式被拆成多個函式區塊的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式被拆成多個函式區塊的概念圖"
    prompt: "一張簡潔的概念示意圖，幾個相連的程式方塊代表函式，象徵把程式拆成可重用的小塊，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[語法基礎](python-syntax-basics.html)學完，你能寫出一段段會跑的程式了。但程式一長，全部擠在一起會越來越難讀、難改。這篇要學的 **函式（function）**，就是把程式切成一塊塊好用的小單位。

你其實已經用過函式了——`print()`、`type()`、`range()` 都是 Python 內建的函式。這篇要學的是**自己寫函式**。

## 一、函式是什麼、為什麼要用

**函式**就是一段「打包好、取了名字、可以重複呼叫」的程式碼。拆函式有三個好處：

- **可讀**：一段長程式拆成幾個命名清楚的函式，看名字就懂在做什麼。
- **可重用**：同樣的邏輯寫一次，到處呼叫，不用複製貼上。
- **好維護**：邏輯要改，只改一個地方。

來看最基本的函式：

```python
# 定義一個函式：接收名字，回傳打招呼的句子
def greet(name):
    return f"哈囉，{name}！"

# 呼叫它
message = greet("智慧喵")
print(message)        # 哈囉，智慧喵！
```

拆解：

- **`def`**：定義函式的關鍵字（define 的縮寫）。
- **`greet`**：函式名稱，習慣用小寫加底線。
- **`(name)`**：參數——呼叫時要給它的資料。
- 結尾的 **冒號 `:`** + 下一行**縮排**（還記得上一篇的縮排規則嗎？函式內容也要縮排）。
- **`return`**：把結果吐回去。

## 二、回傳值與 None

函式可以「有回傳值」或「沒有回傳值」：

```python
# 有回傳值：算完吐回結果
def add(a, b):
    return a + b

# 沒有 return：只做事、不吐東西
def say_hello():
    print("哈囉！")

total = add(3, 5)     # total = 8
say_hello()           # 印出：哈囉！
```

- 有 `return` 就會吐回一個值，可以用變數接住。
- **沒有 `return` 的函式，其實會回傳一個特殊值 `None`**（代表「什麼都沒有」）。這點記著，之後會遇到。

## 三、參數的各種寫法

Python 的參數很靈活，介紹幾個常用的。

**位置參數 vs 關鍵字參數**：

```python
def introduce(name, age):
    print(f"{name} 今年 {age} 歲")

introduce("智慧喵", 3)              # 位置參數：照順序對應
introduce(age=3, name="智慧喵")      # 關鍵字參數：指名道姓，順序就不重要
```

**預設參數值**：參數可以給預設值，呼叫時沒傳就用預設：

```python
def greet(name, greeting="哈囉"):
    return f"{greeting}，{name}！"

print(greet("智慧喵"))              # 哈囉，智慧喵！（用預設）
print(greet("智慧喵", "早安"))       # 早安，智慧喵！
```

**讓函式「傳幾個都行」（進階，先看懂概念就好）**：

前面的函式參數個數都是固定的（`add(a, b)` 就收兩個）。但有時你希望參數「**傳幾個都行**」——想想內建的 `print()`，你可以 `print(a)`，也可以 `print(a, b, c)`，塞幾個都接受。

要讓自己的函式也能這樣，在參數名前面加一個**星號 `*`**：

```python
def total(*numbers):          # 星號：把傳進來的一堆數字全部打包給 numbers
    return sum(numbers)       # sum() 會把它們加總

print(total(1, 2, 3))         # 6
print(total(1, 2, 3, 4, 5))   # 15（同一個函式，傳幾個都行）
```

那個 `*` 的作用就是「**不管你傳幾個，我全部收下、打包成一包**」。呼叫 `total(1,2,3)` 時，`numbers` 就等於 `(1, 2, 3)` 這一包，`sum()` 再把它加起來。

> 你可能也會聽到 `*args` 和 `**kwargs` 這兩個詞——`*args` 就是上面這種（打包一堆值），`**kwargs` 是進階版（打包「名字=值」成對的參數）。這部分牽涉到下一篇才教的資料結構（tuple、dict），所以**這裡先知道「加星號能讓參數不定個數」就夠了**，細節等學完下一篇再回來看會很好懂，現在不用硬記。

## 四、作用域（簡介）

變數有「活動範圍」——函式**裡面**定義的變數，只在函式內有效，外面看不到：

```python
def my_func():
    x = 10          # 區域變數，只在函式內有效
    print(x)

my_func()           # 10
# print(x)          # ❌ 會出錯，外面看不到函式裡的 x
```

- 函式內定義的變數叫**區域變數**，出了函式就不存在。
- 函式外定義的變數叫**全域變數**。
- 新手先建立「函式內的變數是函式私有的」這個觀念就夠，細節之後遇到再深入。

## 五、動手綜合練習

寫幾個小函式練習——計算 BMI、判斷是否及格：

```python
# 算 BMI
def calc_bmi(weight, height):
    bmi = weight / (height ** 2)
    return round(bmi, 1)        # round() 四捨五入到小數 1 位

# 判斷等第
def grade(score):
    if score >= 90:
        return "優秀"
    elif score >= 60:
        return "及格"
    else:
        return "不及格"

print(f"BMI：{calc_bmi(65, 1.70)}")   # BMI：22.5
print(f"成績：{grade(85)}")            # 成績：及格
```

試著自己改：BMI 加上「過輕／正常／過重」的判斷？`grade` 多加一個「待加強」等第？把前面學的流程控制和這篇的函式結合起來，就是真正在寫程式了。

## 這一步大約要花多久？

函式的基本觀念很快能懂（抓幾天）。`*args`/`**kwargs`、作用域這些先知道有、看得懂即可，不用一次全精通。練法：

- 把前面寫過的小程式，試著拆成幾個命名清楚的函式。
- 練「有回傳值」和「沒回傳值」兩種函式的差別。
- 練預設參數——這在實務和用別人套件時超常見。

## 下一篇

會寫函式後，下一篇是基礎篇最後一塊、也是 Python 的核心武器：**資料結構**——list、tuple、dict、set，學會優雅地裝一群資料、處理一堆東西。這篇打穩，後面的實用應用才學得輕鬆。

下篇見。🐾

::aff hahow 想把 Python 基礎練得更扎實？ | 函式是組織程式的關鍵。Hahow 上有從 Python 入門到實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[語法基礎：變數、型別、流程控制與縮排規則](python-syntax-basics.html)
- ➡️ 下一篇：[資料結構：list、tuple、dict、set 一次搞懂](python-data-structures.html)
