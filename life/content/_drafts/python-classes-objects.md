---
title: "【Python 教學】類別與物件：用物件的方式組織程式"
description: "這篇帶你認識 Python 的物件導向：用 class 定義類別、__init__ 建構式、屬性與方法、self 是什麼，從零學會「用物件思考」組織程式。"
keywords: ["Python 類別", "Python 物件", "class", "__init__", "self", "物件導向", "Python 教學"]
slug: "python-classes-objects"
date: "2026-10-13"
order: 6
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "物件導向"
series_order: "5"
status: "approved"
youtube: ""
cover_alt: "用藍圖與成品比喻類別與物件關係的概念示意圖"
images:
  - file: "cover.jpg"
    alt: "用藍圖與成品比喻類別與物件關係的概念示意圖"
    prompt: "一張簡潔的概念示意圖，左邊是一張設計藍圖、右邊是依藍圖產生的多個相同成品，象徵類別與物件的關係，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[基礎篇](python-data-structures.html)走完，你已經能寫出會跑的程式了。從這篇開始，進入**物件導向（OOP）**——用「東西」的方式來組織程式。這一切的起點，就是 **類別** 與 **物件**。

## 一、類別與物件：藍圖與成品

先用比喻把觀念講清楚：

- **類別（class）是藍圖**——定義「這種東西長什麼樣、有哪些資料、能做什麼」，但它本身不是實際的東西。
- **物件（object）是依藍圖造出來的成品**——根據藍圖做出一個個實際能用的東西。

舉例：你畫一張「狗」的設計藍圖（類別），上面寫明狗有名字、年齡、會叫。然後照藍圖造出一隻叫「小黑」的狗、一隻叫「小白」的狗——這兩隻實際的狗就是**物件**。同一張藍圖能造出很多隻，各有各的名字。

## 二、定義一個類別

把上面的概念寫成程式。定義一個「狗」類別：

```python
class Dog:
    # __init__：建構式，建立物件時自動執行，用來設定初始資料
    def __init__(self, name, age):
        self.name = name      # 把傳進來的 name 存成這隻狗的屬性
        self.age = age

    # 方法：這個類別「能做什麼」
    def bark(self):
        print(f"{self.name} 說：汪汪！")
```

這段有三個新東西要解釋：`class`、`__init__`、`self`。

- **`class Dog:`**：用 `class` 定義一個類別，名稱習慣**字首大寫**（`Dog`）。
- **`__init__`**：念作「dunder init」（dunder = 雙底線 double underscore）。它是**建構式**——每次建立一隻新狗時，Python 會自動呼叫它，用來設定這隻狗的初始資料。
- **方法**：`bark` 是這個類別的方法（定義在 class 裡的函式）。

## 三、self 是什麼？（Python 新手重點）

你一定注意到每個方法第一個參數都是 **`self`**，而且 `name` 要寫成 `self.name`。這是 Python 物件導向最需要先搞懂的點。

**`self` 代表「物件自己」**。因為同一個類別可以造出很多物件（很多隻狗），當你呼叫某隻狗的方法時，`self` 就代表「**被呼叫的那一隻**」，這樣程式才知道要用誰的資料。

- `self.name = name`：把資料存進「這隻狗自己」身上。
- `self.name`（在 bark 裡）：讀取「這隻狗自己」的名字。

> 不用緊張，呼叫方法時你**不用自己傳 self**，Python 會自動把物件填進去。你只要記得：定義方法時第一個參數寫 `self`、要存取物件自己的資料就用 `self.xxx`。

## 四、建立並使用物件

有了類別（藍圖），來造物件（成品）。Python 建立物件**不用 new**，直接「類別名稱()」就好：

```python
# 建立物件：直接呼叫類別，括號裡的參數會傳給 __init__
dog1 = Dog("小黑", 3)
dog2 = Dog("小白", 5)

# 用 . 存取屬性與方法
print(dog1.name)      # 小黑
print(dog2.age)       # 5
dog1.bark()           # 小黑 說：汪汪！
dog2.bark()           # 小白 說：汪汪！
```

重點：

- **`Dog("小黑", 3)`**：建立物件，`"小黑"` 和 `3` 會對應傳給 `__init__` 的 `name` 和 `age`（self 不用你傳）。
- **`.`（點）**：存取物件的屬性（`dog1.name`）或方法（`dog1.bark()`）。
- `dog1` 和 `dog2` 是**兩個獨立的物件**，各有各的 name、age，互不影響。

> 跟 C# 的差別：C# 建立物件要寫 `new Dog(...)`，Python 不用 `new`，直接 `Dog(...)` 就好，更簡潔。

## 五、動手綜合練習

做一個「銀行帳戶」類別，把類別、`__init__`、屬性、方法全用上：

```python
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner        # 戶名
        self.balance = balance    # 餘額

    def deposit(self, amount):
        if amount <= 0:
            print("存款金額要大於 0")
            return
        self.balance += amount
        print(f"{self.owner} 存入 {amount}，餘額 {self.balance}")

    def withdraw(self, amount):
        if amount > self.balance:
            print("餘額不足")
            return
        self.balance -= amount
        print(f"{self.owner} 提出 {amount}，餘額 {self.balance}")


# 使用
acc = BankAccount("智慧喵", 1000)
acc.deposit(500)      # 智慧喵 存入 500，餘額 1500
acc.withdraw(2000)    # 餘額不足
acc.withdraw(300)     # 智慧喵 提出 300，餘額 1200
```

注意 `deposit`、`withdraw` 都透過 `self.balance` 操作「這個帳戶自己」的餘額，而且加了檢查（存款要正數、提款不能超過餘額）。這就是用類別把「資料 + 操作」綁在一起的好處。

試著自己加一個 `transfer`（轉帳給另一個帳戶）方法——提示：收兩個參數「要轉給誰（另一個 BankAccount 物件）」和「金額」，自己扣錢、呼叫對方的 `deposit` 加錢。

## 這一步大約要花多久？

類別與物件是觀念轉換的門檻，很多人卡在「什麼時候該開一個類別」和「self 是什麼」。建議：

- 先熟練「定義類別 → 建立物件 → 用 . 操作」的流程。
- **把 self 搞懂**——記住「self 就是物件自己」，多寫幾個類別就有感。
- 拿生活中的東西來練：狗、車子、書、帳戶……想想它有哪些資料、能做什麼。

這觀念需要時間消化，別急。一旦「用物件思考」的開關打開，程式會變得好組織很多。

## 下一篇

會定義類別之後，下一篇進入 **繼承與特殊方法**：讓類別之間能複用（繼承），並用 Python 的特殊方法（像 `__str__`）讓你的物件能被 print 得漂亮、更有 Python 味。

下篇見。🐾

::aff hahow 想把 Python 物件導向學得更透？ | OOP 是程式進階的分水嶺。Hahow 上有從 Python 入門到實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[資料結構：list、tuple、dict、set 一次搞懂](python-data-structures.html)
- ➡️ 下一篇：[繼承與特殊方法：讓類別更強大](python-oop-inheritance.html)
