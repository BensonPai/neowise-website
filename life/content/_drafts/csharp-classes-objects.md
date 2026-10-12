---
title: "【C# 教學】類別與物件：物件導向的第一步"
description: "C# 是物件導向語言，而類別是它的核心。這篇帶你從零認識類別與物件：欄位、屬性、方法、建構式，以及 new 一個物件到底發生了什麼事，為後面的封裝繼承多型打底。"
keywords: ["C# 類別", "C# 物件", "class", "object", "屬性", "建構式", "物件導向", "C# 教學"]
slug: "csharp-classes-objects"
date: "2026-10-12"
order: 5
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "物件導向"
series_order: "4"
status: "approved"
youtube: ""
cover_alt: "用藍圖與成品比喻類別與物件關係的概念示意圖"
images:
  - file: "cover.jpg"
    alt: "用藍圖與成品比喻類別與物件關係的概念示意圖"
    prompt: "一張簡潔的概念示意圖，左邊是一張設計藍圖、右邊是依藍圖產生的多個相同成品，象徵類別與物件的關係，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[基礎篇](csharp-methods-exceptions.html)走完，你已經能寫出會跑的程式了。從這篇開始，進入 C# 真正的核心精神：**物件導向（Object-Oriented Programming，OOP）**。

物件導向聽起來很學術，但它的出發點其實很直覺：**用「東西」的方式來組織程式**。而這一切的起點，就是這篇要講的 **類別** 與 **物件**。

## 一、類別與物件：藍圖與成品

先用一個比喻把觀念講清楚：

- **類別（class）是藍圖**——它定義「這種東西長什麼樣、有哪些資料、能做什麼」，但它本身不是實際的東西。
- **物件（object）是依藍圖造出來的成品**——根據藍圖做出一個個實際存在、能用的東西。

舉例：你畫了一張「汽車設計藍圖」（類別），上面寫明汽車有顏色、品牌、能加速能煞車。然後你照這張藍圖造出一台**紅色的 Toyota**、一台**黑色的 Honda**——這兩台實際的車，就是**物件**。

同一張藍圖（類別）可以造出很多台車（物件），每台各有自己的顏色、品牌。這就是類別與物件的關係。

## 二、定義一個類別

來把上面的概念寫成程式。定義一個最簡單的「學生」類別：

```csharp
class Student
{
    // 欄位 / 屬性：這個類別「有什麼資料」
    public string Name;
    public int Age;

    // 方法：這個類別「能做什麼」
    public void Introduce()
    {
        Console.WriteLine($"大家好，我叫 {Name}，今年 {Age} 歲。");
    }
}
```

拆解這個類別，它有兩種**成員**：

- **資料**（`Name`、`Age`）：描述這個學生「是什麼樣子」。
- **行為**（`Introduce` 方法）：描述這個學生「能做什麼」。

`public` 代表「外部可以存取」，之後講封裝時會深入。

## 三、建立並使用物件

有了類別（藍圖），用 **`new`** 來造出物件（成品）：

```csharp
// 用 new 依 Student 藍圖造出一個物件
Student s1 = new Student();
s1.Name = "小明";       // 用 . 存取物件的成員
s1.Age = 18;
s1.Introduce();         // 印出：大家好，我叫 小明，今年 18 歲。

// 再造一個，各有各的資料
Student s2 = new Student();
s2.Name = "小華";
s2.Age = 20;
s2.Introduce();         // 印出：大家好，我叫 小華，今年 20 歲。
```

重點：

- **`new Student()`**：依 `Student` 類別造出一個新物件。
- **`.`（點）**：存取物件的成員（屬性、方法）。
- `s1` 和 `s2` 是**兩個獨立的物件**，各自有自己的 `Name` 和 `Age`，互不影響。

## 四、屬性：比欄位更好的做法

前面的 `public string Name;` 這種直接開放的叫**欄位（field）**，簡單但不夠安全——任何人都能亂塞值（例如把年齡設成 -5）。C# 更推薦用**屬性（property）**，它看起來像欄位，但能加上控制：

```csharp
class Student
{
    // 自動屬性：最常見的寫法，簡潔又比欄位好
    public string Name { get; set; }
    public int Age { get; set; }
}
```

`{ get; set; }` 的意思是「可以讀（get）、可以寫（set）」。用起來跟欄位一樣：

```csharp
Student s = new Student();
s.Name = "小明";          // set
Console.WriteLine(s.Name); // get → 小明
```

屬性的好處是**可以加入檢查邏輯**。例如不讓年齡變成負數：

```csharp
class Student
{
    public string Name { get; set; }

    private int _age;      // 底層真正存值的欄位（private = 外部碰不到）
    public int Age
    {
        get { return _age; }
        set
        {
            if (value < 0)
                _age = 0;       // 不合理的值就擋掉
            else
                _age = value;   // value 是外部傳進來的新值
        }
    }
}
```

這就是屬性比欄位強的地方：外觀一樣好用，但你能在背後把關。這個「把資料保護起來」的觀念，正是下一篇封裝的核心。

## 五、建構式：建立物件時就設定好

每次 `new` 完還要一行行設定 `Name`、`Age` 很麻煩。**建構式（constructor）** 讓你在建立物件的當下就把值帶進去：

```csharp
class Student
{
    public string Name { get; set; }
    public int Age { get; set; }

    // 建構式：方法名要跟類別同名，沒有回傳型別
    public Student(string name, int age)
    {
        Name = name;
        Age = age;
    }

    public void Introduce()
    {
        Console.WriteLine($"我叫 {Name}，今年 {Age} 歲。");
    }
}
```

這樣建立物件就能一行搞定：

```csharp
Student s = new Student("小明", 18);   // 建立時直接帶入
s.Introduce();                         // 我叫 小明，今年 18 歲。
```

- 建構式的**名稱必須和類別同名**（`Student`），而且**沒有回傳型別**。
- 它在 `new` 的那一刻自動被呼叫。
- 你也可以寫多個建構式（參數不同），這就是前一篇講過的**多載**。

## 六、一個要記住的特性：物件是「參考型別」

這點新手常踩雷，先建立觀念。物件變數存的**不是物件本身，而是「指向物件的參考」**（可以想成一個地址）。所以：

```csharp
Student a = new Student("小明", 18);
Student b = a;          // b 和 a 指向「同一個」物件，不是複製

b.Name = "改名了";
Console.WriteLine(a.Name);   // 印出：改名了（因為 a 和 b 是同一個物件！）
```

`b = a` 並沒有複製出第二個學生，而是讓 `b` 和 `a` 指向**同一個**物件。改 `b` 等於改 `a`。這跟前面學的 `int`、`double` 那種「數值型別」（複製的是值）不同，是 C# 的重要分野。現在知道有這回事就好，之後會更有感。

## 七、動手綜合練習

做一個「銀行帳戶」類別，把類別、屬性、建構式、方法全用上：

```csharp
class BankAccount
{
    public string Owner { get; set; }
    public decimal Balance { get; private set; }   // 餘額只能內部改，外部不能亂設

    // 建構式：開戶時設定戶名與初始餘額
    public BankAccount(string owner, decimal initial)
    {
        Owner = owner;
        Balance = initial;
    }

    // 存款
    public void Deposit(decimal amount)
    {
        if (amount <= 0)
        {
            Console.WriteLine("存款金額要大於 0");
            return;
        }
        Balance += amount;
        Console.WriteLine($"{Owner} 存入 {amount}，餘額 {Balance}");
    }

    // 提款
    public void Withdraw(decimal amount)
    {
        if (amount > Balance)
        {
            Console.WriteLine("餘額不足");
            return;
        }
        Balance -= amount;
        Console.WriteLine($"{Owner} 提出 {amount}，餘額 {Balance}");
    }
}
```

用它：

```csharp
BankAccount acc = new BankAccount("智慧喵", 1000m);
acc.Deposit(500);    // 智慧喵 存入 500，餘額 1500
acc.Withdraw(2000);  // 餘額不足
acc.Withdraw(300);   // 智慧喵 提出 300，餘額 1200
```

注意 `Balance` 用了 `private set`——外部**不能**直接 `acc.Balance = 999999`，只能透過 `Deposit` / `Withdraw` 這些有把關的方法改。這就是用類別「保護資料」的實際好處。

> ⚠ **貼進專案時要注意「順序」！**
> 從這篇開始，你的程式同時有「執行的程式碼」和「類別定義」兩種東西。新版 .NET 的頂層語句有個規定：**執行碼一定要寫在最前面，所有 `class` 定義要放在它後面**。如果把 `class BankAccount { ... }` 放到執行碼前面，就會跳出錯誤 **CS8803：「最上層陳述式必須在命名空間和型別宣告之前」**。
>
> 為了避免搞混順序，**當程式開始有自己的類別時，建議改用下面這種傳統結構**——把執行碼放進 `Main`、類別放在旁邊，怎麼擺都不會錯：

```csharp
class Program
{
    static void Main()
    {
        BankAccount acc = new BankAccount("智慧喵", 1000m);
        acc.Deposit(500);    // 智慧喵 存入 500，餘額 1500
        acc.Withdraw(2000);  // 餘額不足
        acc.Withdraw(300);   // 智慧喵 提出 300，餘額 1200
    }
}

class BankAccount
{
    public string Owner { get; set; }
    public decimal Balance { get; private set; }

    public BankAccount(string owner, decimal initial)
    {
        Owner = owner;
        Balance = initial;
    }

    public void Deposit(decimal amount)
    {
        if (amount <= 0) { Console.WriteLine("存款金額要大於 0"); return; }
        Balance += amount;
        Console.WriteLine($"{Owner} 存入 {amount}，餘額 {Balance}");
    }

    public void Withdraw(decimal amount)
    {
        if (amount > Balance) { Console.WriteLine("餘額不足"); return; }
        Balance -= amount;
        Console.WriteLine($"{Owner} 提出 {amount}，餘額 {Balance}");
    }
}
```

這段是**完整、可以直接整段貼上執行**的版本——`Program` 裡的 `Main` 是程式進入點，`BankAccount` 是我們定義的類別。前面的範例為了聚焦觀念拆成小段呈現，實際動手時照這個完整結構擺就不會有順序問題。

> 補充：那前幾篇直接寫、沒有 `Main` 的範例為什麼能跑？因為那些檔案裡**只有執行碼、沒有自己的類別**，頂層語句就能單獨成立。一旦你開始定義類別，用 `class Program` + `Main` 這種結構最保險。

**動手練習**：試著自己在 `BankAccount` 裡加一個**轉帳**方法——從這個帳戶轉一筆錢「到另一個帳戶」（也就是自己扣錢、對方加錢）。方法可以取名 `TransferTo`（Transfer 轉帳 + To 到…，名字你自己取也行）。它會像這樣用：

```csharp
BankAccount a = new BankAccount("智慧喵", 1000m);
BankAccount b = new BankAccount("小明", 500m);
a.TransferTo(b, 300m);   // 智慧喵轉 300 給小明 → a 剩 700、b 變 800
```

提示：方法會收**兩個參數**——「要轉給誰（另一個 `BankAccount` 物件）」和「轉多少錢」。先檢查自己餘額夠不夠，再自己扣錢、讓對方加錢。

這裡有個卡點正好是練習重點：對方的 `Balance` 是 `private set`，你**不能**直接寫 `對方.Balance += 金額`。想想看——我們不是已經有一個「安全加錢」的方法了嗎？對，就呼叫對方的 `Deposit`。這也剛好呼應本篇的主題：**資料被保護起來，只能透過方法去改**。

## 這一步大約要花多久？

類別與物件是觀念轉換的門檻，很多人卡在「什麼時候該開一個類別」。建議：

- 先熟練「定義類別 → new 物件 → 用 . 操作」的流程。
- 多拿生活中的東西來練：車子、書、寵物、帳戶……想想它有哪些資料、能做什麼。
- 搞懂屬性（尤其 `private set`）和建構式，這兩個最常用。

這觀念需要時間消化，別急。一旦「用物件思考」的開關打開，你會發現程式變得好組織很多。

## 下一篇

會定義類別之後，下一篇進入物件導向的核心三支柱：**封裝、繼承、多型**。這三個特性才是物件導向真正威力的來源，也會把這篇提到的「保護資料」「重用程式」講透。

下篇見。🐾

::aff hahow 想把 C# 物件導向學得更透？ | OOP 是程式進階的分水嶺。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[方法與例外處理：把程式切成好用的小塊，並優雅地處理錯誤](csharp-methods-exceptions.html)
- ➡️ 下一篇：[封裝、繼承、多型：物件導向的三大支柱](csharp-oop-pillars.html)
