---
title: "【C# 教學】介面與泛型：寫出更有彈性、可重用的程式"
description: "這篇帶你認識 C# 的介面（interface）與抽象類別：怎麼定義「一份契約」，以及泛型（generics）如何讓同一段程式適用多種型別，寫出又彈性又安全的程式碼。"
keywords: ["C# 介面", "interface", "抽象類別", "abstract", "泛型", "generics", "C# 教學"]
slug: "csharp-interfaces-generics"
date: "2026-10-12"
order: 7
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "物件導向"
series_order: "6"
status: "approved"
youtube: ""
cover_alt: "示意介面是一份契約、泛型是一個可套不同型別的模具的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意介面是一份契約、泛型是一個可套不同型別的模具的概念圖"
    prompt: "一張簡潔的概念示意圖，左邊是一份契約文件象徵介面、右邊是一個可以放入不同形狀的模具象徵泛型，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[三大支柱](csharp-oop-pillars.html)學完，這篇是物件導向篇的最後一塊：**介面與泛型**。這兩個是很多 C# 框架和函式庫的基石，學會它們，你讀別人的程式、用別人的套件都會更有感。

延續前面的提醒：範例涉及多個類別時，用 `class Program { static void Main() {...} }` 結構包住執行碼，避免 CS8803 的順序問題。

## 一、介面（interface）：一份「契約」

**介面要解決的問題是**：我只在乎「這個東西會做某件事」，不在乎它「怎麼做、是什麼」。

打個比方：插座就是一種「介面」。它規定「提供 110V 電」，至於插上來的是電風扇、充電器還是檯燈，插座不管——只要符合插座規格就能用。

介面在程式裡就是**一份契約**：它只列出「有哪些方法」，但**不寫怎麼實作**。誰想符合這份契約，誰就得把這些方法實作出來。

```csharp
// 定義一份契約：會發出聲音
interface ISoundMaker
{
    void MakeSound();   // 只宣告「有這個方法」，不寫內容
}
```

- 介面名稱習慣用 **大寫 I 開頭**（`ISoundMaker`），這是 C# 的命名慣例，一眼就看出「這是介面」。
- 裡面的方法**只有宣告、沒有內容**（連大括號都沒有，直接分號結束）。

接著讓類別**實作**這份契約（語法跟繼承一樣用 `:`）：

```csharp
class Dog : ISoundMaker
{
    public void MakeSound()   // 必須實作契約規定的方法
    {
        Console.WriteLine("汪汪！");
    }
}

class Doorbell : ISoundMaker  // 門鈴也會發聲，但它跟狗一點關係都沒有
{
    public void MakeSound()
    {
        Console.WriteLine("叮咚～");
    }
}
```

威力在這裡——狗和門鈴**毫無血緣關係**（不像繼承那樣是「同一種東西」），但只要都實作了 `ISoundMaker`，就能被當成「會發聲的東西」統一處理：

```csharp
class Program
{
    static void Main()
    {
        List<ISoundMaker> things = new List<ISoundMaker>
        {
            new Dog(),
            new Doorbell()
        };

        foreach (ISoundMaker thing in things)
        {
            thing.MakeSound();   // 不管是狗還是門鈴，都會發聲
        }
        // 輸出：汪汪！　叮咚～
    }
}
```

**介面 vs 繼承，差在哪？**

- **繼承**是「**是一種**」：狗是一種動物（`Dog : Animal`），會連資料帶行為一起繼承。
- **介面**是「**會做某件事**」：狗、門鈴都「會發聲」（實作 `ISoundMaker`），彼此可以毫無關係。
- 一個類別**只能繼承一個父類別**，但**可以實作多個介面**（例如 `class Dog : Animal, ISoundMaker, IRunnable`）。

## 二、抽象類別（abstract）：介於中間的選擇

有時你想要「有共通實作、又強制子類別補完某些方法」——這就是**抽象類別**，介於「一般類別」和「純介面」之間：

```csharp
abstract class Shape         // abstract：不能直接 new，只能被繼承
{
    public string Name { get; set; }

    public void Describe()   // 一般方法：子類別直接共用
    {
        Console.WriteLine($"這是一個 {Name}，面積是 {Area()}");
    }

    public abstract double Area();   // 抽象方法：沒內容，強制子類別實作
}

class Circle : Shape
{
    public double Radius { get; set; }

    public override double Area()    // 必須補完父類別的抽象方法
    {
        return 3.14159 * Radius * Radius;
    }
}
```

- **`abstract class`**：抽象類別，**不能直接 `new`**，只能當父類別被繼承。
- **抽象方法**：只宣告、沒內容，子類別**一定要** `override` 補完。
- 它同時能有「一般方法」（像 `Describe`，子類別直接共用）。

**介面 vs 抽象類別怎麼選？** 簡單判斷：
- 只想定義「一份能力契約」、不帶實作 → 用**介面**。
- 想定義一群「是一種」的類別、又要共用部分實作 → 用**抽象類別**。

新手階段先把介面用熟，抽象類別知道有就好。

## 三、泛型（generics）：同一段程式，適用多種型別

**泛型要解決的問題是**：同樣的邏輯，不想為每種型別重寫一遍。

想像你要寫一個「盒子」，可以裝任何東西。如果沒有泛型，你得寫 `IntBox`（裝 int）、`StringBox`（裝 string）……每種型別一個，重複到爆。泛型讓你**寫一次、適用所有型別**：

```csharp
// <T> 是「型別參數」——T 代表「某種型別，用的時候才決定」
class Box<T>
{
    private T _item;

    public void Put(T item) => _item = item;
    public T Get() => _item;
}
```

用的時候才指定 T 是什麼：

```csharp
class Program
{
    static void Main()
    {
        Box<int> intBox = new Box<int>();   // 這個盒子裝 int
        intBox.Put(100);
        Console.WriteLine(intBox.Get());    // 100

        Box<string> strBox = new Box<string>();  // 這個盒子裝 string
        strBox.Put("智慧喵");
        Console.WriteLine(strBox.Get());    // 智慧喵
    }
}
```

同一個 `Box<T>`，裝 int 也行、裝 string 也行。重點是它**型別安全**——`Box<int>` 只能放 int，你放字串進去會在編譯時就被擋下，不會等到執行才爆。這就是泛型的兩大好處：**重用 + 型別安全**。

**你其實早就用過泛型了**：還記得前面常用的 `List<T>` 嗎？

```csharp
List<int> numbers = new List<int>();      // 一串 int
List<string> names = new List<string>();  // 一串 string
```

那個 `<int>`、`<string>` 就是在告訴 `List` 這個泛型「我這串要裝什麼」。C# 的集合（下一篇的主題）幾乎都是泛型做的。

## 四、串起來看

這篇的兩個主角，角色不同但常搭配：

- **介面**解決「**用統一方式操作不同東西**」——只要符合契約就能通用。
- **泛型**解決「**同一段程式適用多種型別**」——寫一次，到處能用、又安全。

很多 C# 的函式庫就是「泛型 + 介面」疊出來的，例如 `List<T>`（泛型）本身也實作了多個介面。現在你讀到這種寫法，就知道背後在做什麼了。

## 這一步大約要花多久？

介面的觀念要多練（抓 1~2 週），泛型先理解 `List<T>` 這種「指定型別」的用法就夠入門，自己寫泛型類別是進階，不急。練法：

- 定義一個介面（例如 `IPlayable { void Play(); }`），讓兩個不相干的類別（`Song`、`Video`）都實作它，再用一個 `List` 統一跑 `Play()`。
- 泛型先熟練用現成的 `List<T>`、`Dictionary<K,V>`，有餘力再試著自己寫個 `Box<T>`。

## 下一篇

物件導向篇到這裡就完整了——類別、三大支柱、介面與泛型，你已經掌握 C# 組織程式的核心工具。接下來進入**進階主題**，第一篇是 **集合與 LINQ**：怎麼優雅地處理「一堆資料」，這也是實務上最常用的技能之一。

下篇見。🐾

::aff hahow 想把 C# 物件導向學得更透？ | 介面與泛型是讀懂框架的關鍵。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[封裝、繼承、多型：物件導向的三大支柱](csharp-oop-pillars.html)
- ➡️ 下一篇：[集合與 LINQ：優雅地處理一堆資料](csharp-collections-linq.html)
