---
title: "【C# 教學】集合與 LINQ：優雅地處理一堆資料"
description: "實務上你常要處理「一堆資料」。這篇帶你認識 C# 常用集合 List、Dictionary，再學 LINQ：用接近自然語言的寫法做篩選、排序、投影與統計，讓資料處理又短又好讀。"
keywords: ["C# 集合", "List", "Dictionary", "LINQ", "Where", "Select", "資料處理", "C# 教學"]
slug: "csharp-collections-linq"
date: "2026-10-12"
order: 8
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "進階"
series_order: "7"
status: "approved"
youtube: ""
cover_alt: "示意一堆雜亂資料經過 LINQ 篩選排序後變得整齊的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意一堆雜亂資料經過 LINQ 篩選排序後變得整齊的概念圖"
    prompt: "一張簡潔的概念示意圖，左邊是一堆雜亂的資料方塊、經過一個漏斗後右邊變成整齊排列的方塊，象徵資料篩選與排序，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

物件導向篇走完，從這篇開始進入**進階主題**——都是實務上天天在用的技能。第一篇講**集合與 LINQ**：怎麼處理「一堆資料」。

單一變數只能裝一個值，但真實程式常要處理「一群」東西：一串學生、一堆訂單、一列商品。這時就需要**集合**來裝它們，再用 **LINQ** 優雅地查詢、篩選、排序。

> 延續前面的提醒，範例若有自訂類別，用 `class Program { static void Main() {...} }` 結構包住執行碼。只用內建型別的小範例可以直接寫。

## 一、List：最常用的集合

`List<T>` 是最常用的集合——一串可以動態增減的資料。還記得上一篇說的泛型嗎？`<T>` 就是告訴它「這串要裝什麼型別」：

```csharp
List<string> fruits = new List<string>();  // 一串字串

fruits.Add("蘋果");       // 新增
fruits.Add("香蕉");
fruits.Add("橘子");

Console.WriteLine(fruits.Count);     // 3（元素個數）
Console.WriteLine(fruits[0]);        // 蘋果（用索引取，從 0 開始）

fruits.Remove("香蕉");    // 移除某個元素
fruits.Insert(0, "芒果"); // 在最前面插入

Console.WriteLine(fruits.Contains("蘋果"));  // True（有沒有包含）
```

常用操作一覽：

- `Add(x)`：加到最後。
- `Remove(x)` / `RemoveAt(i)`：移除某個值 / 某個位置。
- `Count`：有幾個元素。
- `[i]`：用索引存取（從 0 開始）。
- `Contains(x)`：有沒有包含某個值。

**List vs 陣列**：你可能學過陣列 `string[]`。差別是——陣列長度固定、建立時就定死；`List` 長度可動態增減，實務上更常用。新手直接用 `List` 就好。

## 二、Dictionary：鍵值對

有時你要的不是「一串」，而是「用一個鍵去查對應的值」——像查字典：給一個詞（鍵），得到解釋（值）。這用 `Dictionary<鍵型別, 值型別>`：

```csharp
Dictionary<string, int> scores = new Dictionary<string, int>();

scores["小明"] = 90;      // 鍵是名字，值是分數
scores["小華"] = 85;
scores["小美"] = 95;

Console.WriteLine(scores["小明"]);        // 90（用鍵查值）

if (scores.ContainsKey("小華"))           // 先確認鍵存在再查，比較安全
{
    Console.WriteLine($"小華考了 {scores["小華"]} 分");
}
```

- 用 `[鍵]` 設定或讀取對應的值。
- `ContainsKey(鍵)`：確認某個鍵在不在（直接查不存在的鍵會出錯，先確認較安全）。
- 適合「用某個東西快速找到對應資料」的場景，例如「用學號找學生」。

## 三、走訪集合

用 `foreach`（基礎篇學過）走訪集合裡的每個元素，最直覺：

```csharp
List<string> fruits = new List<string> { "蘋果", "香蕉", "橘子" };  // 建立時直接給初始值

foreach (string fruit in fruits)
{
    Console.WriteLine(fruit);
}

// 走訪 Dictionary：每個元素是一組「鍵值對」
Dictionary<string, int> scores = new Dictionary<string, int>
{
    ["小明"] = 90,
    ["小華"] = 85
};

foreach (var pair in scores)
{
    Console.WriteLine($"{pair.Key} 考了 {pair.Value} 分");
}
```

注意上面用了 `new List<string> { ... }` 的**集合初始化語法**，建立的同時就塞好初始值，比一行行 `Add` 省事。

## 四、LINQ：用接近自然語言的方式查資料

這篇的重頭戲。**LINQ**（Language Integrated Query）讓你用很短、很好讀的寫法對集合做「篩選、排序、轉換、統計」，取代一堆手寫迴圈。

先準備一組資料（一串學生成績）當範例：

```csharp
class Program
{
    static void Main()
    {
        List<Student> students = new List<Student>
        {
            new Student { Name = "小明", Score = 90 },
            new Student { Name = "小華", Score = 55 },
            new Student { Name = "小美", Score = 78 },
            new Student { Name = "小強", Score = 95 }
        };

        // 之後的 LINQ 範例都基於這組資料
    }
}

class Student
{
    public string Name { get; set; }
    public int Score { get; set; }
}
```

**篩選：Where（挑出符合條件的）**

```csharp
// 挑出及格（>= 60）的學生
var passed = students.Where(s => s.Score >= 60);

foreach (var s in passed)
    Console.WriteLine($"{s.Name}：{s.Score}");
// 小明、小美、小強
```

`s => s.Score >= 60` 是**判斷條件**：對每個學生 `s`，留下分數 >= 60 的。這個 `=>` 寫法叫 **Lambda**，可以想成「一個臨時的小判斷函式」。

**排序：OrderBy / OrderByDescending**

```csharp
var ranked = students.OrderByDescending(s => s.Score);  // 依分數由高到低

foreach (var s in ranked)
    Console.WriteLine($"{s.Name}：{s.Score}");
// 小強95、小明90、小美78、小華55
```

`OrderBy` 是由小到大，`OrderByDescending` 是由大到小。

**投影：Select（把資料轉成另一種形式）**

```csharp
// 只要名字，不要整個物件
var names = students.Select(s => s.Name);
// 結果：小明、小華、小美、小強

// 轉成「名字（分數）」的字串
var labels = students.Select(s => $"{s.Name}（{s.Score}）");
```

`Select` 把每個元素「轉換」成你要的樣子。

**常用的統計與取值**

```csharp
int count = students.Count(s => s.Score >= 60);  // 及格幾人 → 3
double avg = students.Average(s => s.Score);      // 平均分
int max = students.Max(s => s.Score);             // 最高分 → 95
var top = students.First(s => s.Score >= 90);     // 第一個 90 分以上的 → 小明
```

**串接起來用才是精髓**：這些方法可以像積木一樣接起來：

```csharp
// 及格的人，依分數由高到低，取出名字
var result = students
    .Where(s => s.Score >= 60)
    .OrderByDescending(s => s.Score)
    .Select(s => s.Name);

foreach (var name in result)
    Console.WriteLine(name);
// 小強、小明、小美
```

讀起來幾乎像白話：「學生 → 篩出及格 → 由高到低排 → 取名字」。想想看，同樣的事用手寫迴圈要寫多少行、多容易出錯？這就是 LINQ 的價值。

## 五、動手綜合練習

用一組商品資料練習 LINQ：

```csharp
class Program
{
    static void Main()
    {
        List<Product> products = new List<Product>
        {
            new Product { Name = "滑鼠", Price = 300 },
            new Product { Name = "鍵盤", Price = 900 },
            new Product { Name = "螢幕", Price = 5000 },
            new Product { Name = "耳機", Price = 1200 }
        };

        // 練習 1：價格 1000 以上的商品名稱
        var expensive = products
            .Where(p => p.Price >= 1000)
            .Select(p => p.Name);
        Console.WriteLine("1000 以上：" + string.Join("、", expensive));

        // 練習 2：全部商品總價
        decimal total = products.Sum(p => p.Price);
        Console.WriteLine($"總價：{total}");

        // 練習 3：最便宜的商品
        var cheapest = products.OrderBy(p => p.Price).First();
        Console.WriteLine($"最便宜：{cheapest.Name}");
    }
}

class Product
{
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

（`string.Join("、", 集合)` 是把一串東西用「、」接成一個字串的好用小工具。）

試著自己改：找出 500~2000 之間的商品？依價格由高到低列出全部？算平均價？動手改最有感。

## 這一步大約要花多久？

集合（List、Dictionary）觀念簡單，幾天就熟。LINQ 建議多練，因為它的方法很多，但最常用的就是 `Where`、`Select`、`OrderBy`、`Count`、`Sum`、`First` 這幾個，先把這些練熟。練法：

- 準備一組資料（學生、商品、訂單都行），反覆用 LINQ 問不同問題。
- 練習「串接」——先 Where 再 OrderBy 再 Select，體會像積木堆疊的感覺。
- 看到別人程式裡的 `.Where(...).Select(...)`，試著讀懂它在做什麼。

## 下一篇

會處理一堆資料後，下一篇進入另一個實務重點：**非同步 async/await**——當程式要下載檔案、呼叫網路 API 時，怎麼讓它「不卡住、能同時做多件事」。這是現代程式幾乎都會用到的技能。

下篇見。🐾

::aff hahow 想把 C# 進階技能練得更扎實？ | LINQ 是處理資料的利器，熟練它程式會短很多。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[介面與泛型：寫出更有彈性、可重用的程式](csharp-interfaces-generics.html)
- ➡️ 下一篇：[非同步 async/await：讓程式不卡頓](csharp-async.html)
