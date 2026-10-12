---
title: "【C# 教學】封裝、繼承、多型：物件導向的三大支柱"
description: "學會類別之後，這篇進入物件導向的核心三支柱：封裝（藏好細節）、繼承（複用與擴充）、多型（同一介面不同行為）。用好懂的範例帶你理解它們解決了什麼問題。"
keywords: ["封裝", "繼承", "多型", "物件導向三大特性", "C# OOP", "inheritance", "polymorphism", "C# 教學"]
slug: "csharp-oop-pillars"
date: "2026-10-12"
order: 6
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "物件導向"
series_order: "5"
status: "approved"
youtube: ""
cover_alt: "三根柱子分別標示封裝、繼承、多型，象徵物件導向三大支柱的概念圖"
images:
  - file: "cover.jpg"
    alt: "三根柱子分別標示封裝、繼承、多型，象徵物件導向三大支柱的概念圖"
    prompt: "一張簡潔的概念示意圖，三根並排的柱子支撐著一個結構，象徵物件導向的三大支柱，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](csharp-classes-objects.html)學會了用類別造物件。這篇進入物件導向真正的威力來源：**三大支柱——封裝、繼承、多型**。

這三個名詞聽起來很抽象，但它們各自解決一個很實際的問題。我會一個一個用好懂的例子說清楚，你會發現它們其實很直覺。

> 小提醒：這篇的範例開始會有多個類別。延續上一篇的提醒，當程式同時有執行碼和類別時，**用 `class Program { static void Main() {...} }` 包住執行碼、類別放旁邊**，才不會踩到 CS8803 的順序問題。文中範例都照這個結構寫。

## 一、封裝（Encapsulation）：藏好細節，只開放該開放的

**封裝**要解決的問題是：**不要讓外部隨便亂動物件內部的資料**。

回想上一篇的銀行帳戶——我們把餘額 `Balance` 設成 `private set`，外部不能直接 `acc.Balance = 999999`，只能透過 `Deposit`、`Withdraw` 這些有把關的方法改。這就是封裝：**把資料藏起來，只開放安全的操作管道**。

控制「誰能存取」靠的是**存取修飾詞**：

- **`public`**：公開，任何地方都能存取。
- **`private`**：私有，只有這個類別**內部**能存取（預設就是 private）。
- **`protected`**：受保護，自己和「子類別」能存取（繼承時會用到，下一節講）。

看個例子：

```csharp
class Thermostat   // 溫控器
{
    private int _temperature = 20;   // 私有：外部不能直接亂改

    // 開放一個「安全的」設定方法，幫你把關範圍
    public void SetTemperature(int value)
    {
        if (value < 10 || value > 30)
        {
            Console.WriteLine("溫度只能設 10~30 度");
            return;
        }
        _temperature = value;
    }

    public int GetTemperature() => _temperature;
}
```

外部只能透過 `SetTemperature` 改溫度，而且被限制在 10~30 度——不可能把溫度設成 999 度。**把資料保護在合理範圍內，正是封裝的價值**。

> 慣例：私有欄位常用底線開頭命名（像 `_temperature`），一眼就看出「這是內部用的」。

## 二、繼承（Inheritance）：複用與擴充

**繼承**要解決的問題是：**很多類別有共同的部分，不想重複寫**。

舉例：狗、貓都是動物，都有「名字」、都會「吃東西」。與其在 `Dog`、`Cat` 各寫一遍，不如把共通的放進一個「父類別」`Animal`，讓子類別**繼承**它：

```csharp
// 父類別（基底類別）：共通的部分放這裡
class Animal
{
    public string Name { get; set; }

    public void Eat()
    {
        Console.WriteLine($"{Name} 正在吃東西");
    }
}

// 子類別：用 : 繼承 Animal，自動擁有 Name 和 Eat()，再加自己的東西
class Dog : Animal
{
    public void Bark()
    {
        Console.WriteLine($"{Name} 說：汪汪！");
    }
}
```

用起來：

```csharp
class Program
{
    static void Main()
    {
        Dog d = new Dog();
        d.Name = "小黑";    // 繼承自 Animal
        d.Eat();           // 繼承自 Animal → 小黑 正在吃東西
        d.Bark();          // Dog 自己的 → 小黑 說：汪汪！
    }
}
```

`Dog` 沒有自己寫 `Name` 和 `Eat()`，卻能直接用——因為它**繼承**了 `Animal`。這就是複用：共通的寫一次，子類別全部共享。

- `class Dog : Animal` 的 `: Animal` 表示「Dog 繼承 Animal」。
- `Animal` 叫**父類別**（或基底類別），`Dog` 叫**子類別**。
- 子類別自動擁有父類別的 public / protected 成員，還能加自己的。

> 什麼時候「不」該用繼承？繼承代表「是一種」的關係——狗**是一種**動物，合理。但如果只是「想借用某些功能」，硬套繼承反而會綁死架構。判斷標準：講得通「A 是一種 B」才用繼承。

## 三、多型（Polymorphism）：同一個呼叫，不同的行為

**多型**要解決的問題是：**同樣一個動作，不同的東西該有不同的做法**。

例如「叫」這個動作，狗是汪汪、貓是喵喵。多型讓你**用同一個方法名 `Speak()`，但每種動物各自定義自己的版本**：

```csharp
class Animal
{
    public string Name { get; set; }

    // virtual：宣告這個方法「可以被子類別改寫」
    public virtual void Speak()
    {
        Console.WriteLine($"{Name} 發出聲音");
    }
}

class Dog : Animal
{
    // override：改寫父類別的 Speak，給出 Dog 自己的版本
    public override void Speak()
    {
        Console.WriteLine($"{Name} 說：汪汪！");
    }
}

class Cat : Animal
{
    public override void Speak()
    {
        Console.WriteLine($"{Name} 說：喵～");
    }
}
```

威力在這裡——你可以把不同動物**當成同一種 `Animal` 來處理**，但它們會各自表現出正確的行為：

```csharp
class Program
{
    static void Main()
    {
        // 一個 Animal 清單，裡面裝著狗和貓
        List<Animal> animals = new List<Animal>
        {
            new Dog { Name = "小黑" },
            new Cat { Name = "咪咪" }
        };

        // 同一行 Speak()，每隻動物叫出自己的聲音
        foreach (Animal a in animals)
        {
            a.Speak();
        }
        // 輸出：
        // 小黑 說：汪汪！
        // 咪咪 說：喵～
    }
}
```

明明都是呼叫 `a.Speak()`，狗叫汪汪、貓叫喵喵——這就是多型。它的好處是：**新增一種動物（例如 `Bird`）時，上面那段 `foreach` 完全不用改**，只要新類別自己 override 好 `Speak()` 就行。程式因此變得好擴充。

- **`virtual`**：加在父類別方法上，表示「這個方法允許被子類別改寫」。
- **`override`**：加在子類別方法上，表示「我要改寫父類別這個方法」。
- 兩者成對出現：父類別 `virtual`、子類別 `override`。

## 四、三者如何協作

把三根柱子串起來看，它們通常是一起運作的：

- **封裝**把每個類別內部收拾乾淨，只露出該露的。
- **繼承**讓一群相關類別共享共通的部分。
- **多型**讓你用統一的方式操作它們，又各自表現出正確行為。

以剛才的動物為例：`Name` 用屬性管好（封裝）、`Dog`/`Cat` 繼承 `Animal`（繼承）、各自 override `Speak()`（多型）。這套組合拳，就是物件導向能把複雜程式整理得井井有條的原因。

## 這一步大約要花多久？

三大支柱是觀念重點，建議抓 **1~2 週**慢慢消化，重點不是背定義，而是理解「它們各自解決什麼問題」：

- **封裝** → 不讓外部亂動內部資料。
- **繼承** → 共通的部分不要重複寫。
- **多型** → 同一個呼叫，不同東西各自做對的事。

練法：拿「圖形」來練很經典——父類別 `Shape` 有 `virtual double Area()`，子類別 `Circle`、`Rectangle` 各自 override 算自己的面積，再用一個 `List<Shape>` 跑迴圈印出每個形狀的面積。能把這個寫出來，三大支柱就通了。

## 下一篇

三大支柱之後，下一篇是物件導向的最後一塊：**介面與泛型**。介面像「一份契約」，泛型讓同一段程式適用多種型別——這兩個是很多 C# 框架和函式庫的基石。

學完下一篇，物件導向篇就完整了。下篇見。🐾

::aff hahow 想把 C# 物件導向學得更透？ | 封裝、繼承、多型是程式進階的分水嶺。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[類別與物件：物件導向的第一步](csharp-classes-objects.html)
- ➡️ 下一篇：[介面與泛型：寫出更有彈性、可重用的程式](csharp-interfaces-generics.html)
