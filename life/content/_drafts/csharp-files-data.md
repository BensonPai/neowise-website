---
title: "【C# 教學】檔案讀寫與 JSON：讓程式能存資料、讀資料"
description: "程式關掉資料就不見？這篇帶你用 C# 做檔案讀寫，並認識怎麼把物件轉成 JSON 存檔、再讀回來，讓你的程式真正能記住東西，為實戰專案做準備。"
keywords: ["C# 檔案讀寫", "File", "StreamReader", "JSON", "序列化", "System.Text.Json", "C# 教學"]
slug: "csharp-files-data"
date: "2026-10-12"
order: 10
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "進階"
series_order: "9"
status: "approved"
youtube: ""
cover_alt: "示意程式把資料寫入檔案、再從檔案讀回的雙向流程概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式把資料寫入檔案、再從檔案讀回的雙向流程概念圖"
    prompt: "一張簡潔的概念示意圖，一個程式圖示與一個檔案圖示之間有雙向箭頭，象徵資料寫入與讀取，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](csharp-async.html)學會非同步。這篇是進階篇最後一塊，也是最實用的技能之一：**讓程式能把資料存起來**。

你前面寫的程式有個共同問題——**一關掉，資料就全沒了**。因為資料都放在記憶體，程式結束就清空。這篇要解決它：把資料**存進檔案**，下次打開再**讀回來**，程式才能真正「記住東西」。這也是下一篇實戰專案的直接基礎。

> 範例會用到自訂類別，記得用 `class Program { static void Main() {...} }` 結構。

## 一、最基本的檔案讀寫

C# 用 `File` 這個工具做檔案讀寫，最簡單的是整個檔案一次讀寫文字：

```csharp
class Program
{
    static void Main()
    {
        // 寫入：把文字存成檔案（檔案不存在會自動建立，存在會覆蓋）
        File.WriteAllText("note.txt", "這是我存下來的筆記。");
        Console.WriteLine("已寫入 note.txt");

        // 讀取：把整個檔案讀成字串
        string content = File.ReadAllText("note.txt");
        Console.WriteLine($"讀回來的內容：{content}");
    }
}
```

- **`File.WriteAllText(檔名, 內容)`**：把文字寫進檔案。檔案不存在就建立、存在就**整個覆蓋**。
- **`File.ReadAllText(檔名)`**：把整個檔案讀成一個字串。

**多行資料**可以用對應的 Lines 版本：

```csharp
string[] lines = { "第一行", "第二行", "第三行" };
File.WriteAllLines("list.txt", lines);          // 一行一筆寫入

string[] readLines = File.ReadAllLines("list.txt");  // 讀回成字串陣列
foreach (string line in readLines)
    Console.WriteLine(line);
```

> 檔案存哪？只給檔名（像 `"note.txt"`）會存在程式執行目錄下。想指定位置可以給完整路徑，例如 `@"C:\Users\你\Desktop\note.txt"`（字串前的 `@` 讓反斜線不用跳脫）。

## 二、問題來了：怎麼存「物件」？

純文字好存，但實務上你要存的通常是**物件**——一個學生、一筆訂單、一串待辦事項。難道要自己把每個欄位拼成文字、讀回來再一個個拆解嗎？太麻煩也容易出錯。

這就是 **JSON** 登場的時候。

**JSON** 是一種通用的資料格式，長這樣：

```json
{
  "Name": "智慧喵",
  "Score": 95
}
```

它的好處是：**人看得懂、程式好處理、跨語言通用**（網路 API 幾乎都用它）。我們要做的，就是把 C# 物件「轉成 JSON 字串存檔」、再「從 JSON 字串讀回物件」。這兩個動作有專有名詞：

- **序列化（Serialize）**：物件 → JSON 字串。
- **反序列化（Deserialize）**：JSON 字串 → 物件。

## 三、用 System.Text.Json 存讀物件

C# 內建 `System.Text.Json` 可以做這件事，不用裝額外套件。先引用它，再序列化：

```csharp
using System.Text.Json;    // 放在檔案最上方

class Program
{
    static void Main()
    {
        Student s = new Student { Name = "智慧喵", Score = 95 };

        // 序列化：物件 → JSON 字串
        string json = JsonSerializer.Serialize(s);
        Console.WriteLine(json);   // {"Name":"智慧喵","Score":95}

        // 存進檔案
        File.WriteAllText("student.json", json);
    }
}

class Student
{
    public string Name { get; set; }
    public int Score { get; set; }
}
```

讀回來則用反序列化：

```csharp
// 從檔案讀回 JSON 字串
string json = File.ReadAllText("student.json");

// 反序列化：JSON 字串 → Student 物件
Student s = JsonSerializer.Deserialize<Student>(json);

Console.WriteLine($"{s.Name} 考了 {s.Score} 分");   // 智慧喵 考了 95 分
```

重點：

- **`JsonSerializer.Serialize(物件)`**：轉成 JSON 字串。
- **`JsonSerializer.Deserialize<型別>(字串)`**：轉回物件，角括號 `<Student>` 告訴它「要轉成什麼型別」（還記得泛型嗎？就是這個）。

**存一整串物件**也完全一樣——這正是下一篇待辦清單要用的：

```csharp
List<Student> students = new List<Student>
{
    new Student { Name = "小明", Score = 90 },
    new Student { Name = "小華", Score = 85 }
};

// 一串物件照樣能序列化
string json = JsonSerializer.Serialize(students);
File.WriteAllText("students.json", json);

// 讀回成 List
string read = File.ReadAllText("students.json");
List<Student> loaded = JsonSerializer.Deserialize<List<Student>>(read);
Console.WriteLine($"讀回 {loaded.Count} 筆學生資料");
```

> 想讓存出來的 JSON 有排版（換行縮排、好閱讀），可以加選項：
> `JsonSerializer.Serialize(students, new JsonSerializerOptions { WriteIndented = true });`

## 四、別忘了錯誤處理

讀檔很容易出錯——**檔案不存在、沒權限、內容壞掉**都會讓程式崩潰。還記得[例外處理篇](csharp-methods-exceptions.html)嗎？這裡正好用上：

```csharp
try
{
    string json = File.ReadAllText("students.json");
    List<Student> students = JsonSerializer.Deserialize<List<Student>>(json);
    Console.WriteLine($"成功讀入 {students.Count} 筆");
}
catch (FileNotFoundException)
{
    Console.WriteLine("檔案不存在，可能是第一次執行，從空清單開始。");
}
catch (Exception ex)
{
    Console.WriteLine($"讀取失敗：{ex.Message}");
}
```

特別是「**第一次執行時檔案還不存在**」這個情況很常見——用 `try/catch` 接住它、改成「從空資料開始」，程式就不會因為找不到檔案而掛掉。這個模式下一篇會直接用到。

## 五、動手綜合練習

把檔案 + JSON + 類別 + 集合全部串起來，做一個「存讀商品清單」的小程式：

```csharp
using System.Text.Json;

class Program
{
    static void Main()
    {
        string file = "products.json";

        // 準備資料
        List<Product> products = new List<Product>
        {
            new Product { Name = "滑鼠", Price = 300 },
            new Product { Name = "鍵盤", Price = 900 }
        };

        // 存檔（加 WriteIndented 讓 JSON 好讀）
        string json = JsonSerializer.Serialize(products, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(file, json);
        Console.WriteLine($"已存 {products.Count} 筆到 {file}");

        // 讀回來
        try
        {
            string read = File.ReadAllText(file);
            List<Product> loaded = JsonSerializer.Deserialize<List<Product>>(read);
            foreach (var p in loaded)
                Console.WriteLine($"{p.Name}：{p.Price} 元");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"讀取失敗：{ex.Message}");
        }
    }
}

class Product
{
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

跑完去程式目錄找找 `products.json`，打開看看裡面長什麼樣（會是排版好的 JSON）。試著自己加一筆商品、重新跑，確認存讀都正確。

## 這一步大約要花多久？

檔案讀寫觀念簡單（`WriteAllText` / `ReadAllText` 幾分鐘就懂）。JSON 序列化建議多練，因為實戰和串接網路 API 都會用到。練法：

- 先練純文字讀寫，確認檔案真的被建立、讀得回來。
- 練把一個物件、一串物件存成 JSON 再讀回。
- 一定要練「檔案不存在時用 try/catch 接住」，這是實務必備。

## 下一篇

進階篇到這裡就完整了——集合與 LINQ、非同步、檔案與 JSON，你已經備齊實務需要的工具。下一篇是整個系列的**壓軸實戰**：**動手做一個主控台待辦清單 App**，把前面學過的語法、類別、集合、檔案存讀全部整合進一個真的能用的程式。

準備好把學到的東西組起來了嗎？下篇見。🐾

::aff hahow 想把 C# 進階技能練得更扎實？ | 檔案與資料處理是實戰必備。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[非同步 async/await：讓程式不卡頓](csharp-async.html)
- ➡️ 下一篇：[實戰專案：動手做一個主控台待辦清單 App](csharp-project-console-app.html)
