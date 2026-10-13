---
title: "【Python 教學】繼承與特殊方法：讓類別更強大"
description: "學會類別之後，這篇進入繼承（複用與擴充）與 Python 的特殊方法（dunder methods，如 __str__）：讓你的類別能被 print 得漂亮、能用運算子，寫出更 Python 風格的程式。"
keywords: ["Python 繼承", "inheritance", "特殊方法", "dunder", "__str__", "方法覆寫", "Python OOP", "Python 教學"]
slug: "python-oop-inheritance"
date: "2026-10-13"
order: 7
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "物件導向"
series_order: "6"
status: "approved"
youtube: ""
cover_alt: "示意子類別繼承父類別、並加上特殊方法的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意子類別繼承父類別、並加上特殊方法的概念圖"
    prompt: "一張簡潔的概念示意圖，一個父類別方塊延伸出子類別方塊，象徵繼承與擴充，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](python-classes-objects.html)學會了用類別造物件。這篇是物件導向篇最後一塊，講兩個讓類別更強大的工具：**繼承**（讓類別之間能複用）和 **特殊方法**（讓物件更好用、更有 Python 味）。

## 一、繼承：共通的部分不要重複寫

**繼承要解決的問題是**：很多類別有共同的部分，不想重複寫。

舉例：狗、貓都是動物，都有名字、都會吃東西。與其在 `Dog`、`Cat` 各寫一遍，不如把共通的放進父類別 `Animal`，讓子類別**繼承**它：

```python
# 父類別：共通的部分放這裡
class Animal:
    def __init__(self, name):
        self.name = name

    def eat(self):
        print(f"{self.name} 正在吃東西")


# 子類別：括號裡寫父類別，就繼承了它
class Dog(Animal):
    def bark(self):
        print(f"{self.name} 說：汪汪！")
```

用起來：

```python
d = Dog("小黑")
d.eat()      # 繼承自 Animal → 小黑 正在吃東西
d.bark()     # Dog 自己的 → 小黑 說：汪汪！
```

`Dog` 沒有自己寫 `__init__` 和 `eat()`，卻能直接用——因為它**繼承**了 `Animal`。寫法就是 `class 子類別(父類別):`。

## 二、super()：呼叫父類別

如果子類別想「在父類別的基礎上多做一點」，用 **`super()`** 呼叫父類別：

```python
class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)    # 先呼叫父類別的 __init__ 設定 name
        self.breed = breed        # 再加上 Dog 自己的屬性

    def bark(self):
        print(f"{self.name}（{self.breed}）說：汪汪！")


d = Dog("小黑", "柴犬")
d.bark()     # 小黑（柴犬）說：汪汪！
```

`super().__init__(name)` 的意思是「請父類別先把 name 設定好」，然後子類別再補自己的 `breed`。這樣就不用把父類別做過的事再抄一遍。

## 三、方法覆寫：子類別給出自己的版本

子類別可以**改寫**父類別的方法，給出自己的版本（這叫 override，覆寫）：

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        print(f"{self.name} 發出聲音")


class Dog(Animal):
    def speak(self):                    # 改寫父類別的 speak
        print(f"{self.name} 說：汪汪！")

class Cat(Animal):
    def speak(self):
        print(f"{self.name} 說：喵～")


Dog("小黑").speak()    # 小黑 說：汪汪！
Cat("咪咪").speak()    # 咪咪 說：喵～
```

同樣叫 `speak()`，狗和貓各自表現出自己的行為。Python 不需要像 C# 那樣加 `virtual`/`override` 關鍵字，**直接在子類別定義同名方法就會覆寫**。

## 四、多型與「鴨子型別」

Python 處理「同一個動作、不同東西不同做法」的方式很有自己的風格，叫 **鴨子型別（duck typing）**：

> 「如果牠走起來像鴨子、叫起來像鴨子，那牠就是鴨子。」

意思是：Python **不在乎物件是什麼類別，只在乎它有沒有你要呼叫的方法**。只要有 `speak()`，不管是狗、貓、還是其他什麼，都能用：

```python
animals = [Dog("小黑"), Cat("咪咪")]

for a in animals:
    a.speak()        # 不管是狗是貓，有 speak() 就能叫
# 小黑 說：汪汪！
# 咪咪 說：喵～
```

> 跟 C# 的差別：C# 要靠 `virtual`/`override` 和共同的父類別/介面；Python 更隨性——只要有那個方法就能用，不強制要繼承關係。這讓 Python 很靈活，但也要自己確保物件真的有那個方法。

## 五、特殊方法（dunder methods）

Python 有一組**特殊方法**，名字前後都是雙底線（像 `__init__`），叫 **dunder method**（double underscore）。它們讓你的物件能融入 Python 的語法。最實用的是 **`__str__`**。

**問題**：直接 print 一個物件，印出來很醜：

```python
class Dog:
    def __init__(self, name):
        self.name = name

d = Dog("小黑")
print(d)     # <__main__.Dog object at 0x000001...>（看不懂的東西）
```

**加上 `__str__`**，就能決定「這個物件被 print 時要顯示什麼」：

```python
class Dog:
    def __init__(self, name):
        self.name = name

    def __str__(self):
        return f"狗狗：{self.name}"

d = Dog("小黑")
print(d)     # 狗狗：小黑（漂亮多了）
```

- **`__str__`**：定義物件被 `print()` 或轉成字串時的樣子。
- 這些 dunder 方法是 Python 「很 Python」的地方——讓自訂物件也能用內建語法。

除了 `__str__`，還有兩個常見的，各看一個小例子就懂它們在做什麼：

**`__len__`**——讓你的物件可以用 `len()`：

```python
class Team:
    def __init__(self, members):
        self.members = members      # members 是一個 list

    def __len__(self):
        return len(self.members)    # 定義 len(隊伍) 要回傳什麼

team = Team(["小明", "小華", "小美"])
print(len(team))     # 3（因為我們定義了 __len__）
```

**`__eq__`**——讓你的物件可以用 `==` 比較：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, other):
        # 自己定義「兩個點相等」的意思：x、y 都一樣就算相等
        return self.x == other.x and self.y == other.y

p1 = Point(3, 5)
p2 = Point(3, 5)
print(p1 == p2)      # True（若沒定義 __eq__，這裡會是 False）
```

> 沒定義 `__eq__` 時，`==` 預設只看「是不是同一個物件」，所以兩個內容一樣的點會被判定為不相等。定義了 `__eq__`，你就能決定「怎樣算相等」。這些 dunder 方法先知道 `__str__` 最常用、其他遇到再學即可。

## 六、動手綜合練習

建一組有繼承關係的類別，並加上 `__str__`：

```python
class Shape:
    def __init__(self, name):
        self.name = name

    def area(self):
        return 0

    def __str__(self):
        return f"{self.name} 的面積是 {self.area()}"


class Circle(Shape):
    def __init__(self, radius):
        super().__init__("圓形")
        self.radius = radius

    def area(self):                      # 覆寫，算圓面積
        return round(3.14159 * self.radius ** 2, 2)


class Rectangle(Shape):
    def __init__(self, w, h):
        super().__init__("長方形")
        self.w = w
        self.h = h

    def area(self):
        return self.w * self.h


# 用鴨子型別：都有 area() 和 __str__，統一處理
shapes = [Circle(5), Rectangle(3, 4)]
for s in shapes:
    print(s)
# 圓形 的面積是 78.54
# 長方形 的面積是 12
```

這個小程式把這篇全用上了：繼承（Circle/Rectangle 繼承 Shape）、super()、方法覆寫（各自算面積）、特殊方法（__str__）、鴨子型別（統一 print）。試著自己加一個 `Triangle`（三角形）類別練練看。

## 這一步大約要花多久？

繼承和 `super()` 的觀念抓幾天就懂；dunder 方法先把 `__str__` 練熟（最常用），其他遇到再學。練法：

- 建一組有繼承關係的類別（動物、圖形都行），練 super() 和方法覆寫。
- 幫你的類別加 `__str__`，讓 print 出來好看。
- 體會鴨子型別：把不同類別的物件放進一個 list，用迴圈統一呼叫同名方法。

## 下一篇

物件導向篇到這裡就完整了——類別、繼承、特殊方法，你已經掌握 Python 組織程式的核心工具。接下來進入最有感的 **實用應用** 階段，第一篇是 **檔案讀寫與 JSON**：讓你的程式能把資料存起來、讀回來，真正能記住東西。

下篇見。🐾

::aff hahow 想把 Python 物件導向學得更透？ | 繼承與特殊方法是寫出好程式的關鍵。Hahow 上有從 Python 入門到實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[類別與物件：用物件的方式組織程式](python-classes-objects.html)
- ➡️ 下一篇：[檔案讀寫與 JSON：讓程式能存資料、讀資料](python-files-json.html)
