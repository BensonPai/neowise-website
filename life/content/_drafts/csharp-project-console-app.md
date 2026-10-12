---
title: "【C# 教學】實戰專案：動手做一個主控台待辦清單 App"
description: "學了這麼多，這篇把全部串起來：用 C# 從零做一個可以新增、檢視、完成、刪除、並能存檔讀檔的主控台待辦清單程式，實際體會類別、集合、LINQ、檔案與例外處理怎麼協作。"
keywords: ["C# 專案", "主控台程式", "Console App", "待辦清單", "C# 實戰", "C# 範例", "C# 教學"]
slug: "csharp-project-console-app"
date: "2026-10-12"
order: 11
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "實戰"
series_order: "10"
status: "approved"
youtube: ""
cover_alt: "一個在終端機中執行的待辦清單主控台程式畫面示意"
images:
  - file: "cover.jpg"
    alt: "一個在終端機中執行的待辦清單主控台程式畫面示意"
    prompt: "一張乾淨的科技示意圖，一個終端機 / 主控台視窗中顯示一份待辦清單程式的選單與項目，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何真實可辨識文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

恭喜你走到系列最後一篇！前面學的語法、類別、集合、LINQ、非同步、檔案 JSON、例外處理——這篇要把它們**全部組起來**，做一個真的能用的程式：**主控台待辦清單 App**。

這就是學程式最有成就感的時刻：把一塊塊零件拼成一個完整的東西。跟著做完，你會對「一個程式怎麼從無到有」有完整的體會。

## 一、我們要做什麼

一個在終端機操作的待辦清單，功能：

- **新增**待辦事項
- **列出**所有事項（標示完成與否）
- **標記完成**
- **刪除**事項
- **自動存檔**：離開時存進檔案
- **自動讀檔**：啟動時把上次的資料讀回來

操作方式是文字選單：輸入數字選功能，像這樣：

```text
===== 待辦清單 =====
1. [ ] 寫 C# 教學
2. [v] 買晚餐
--------------------
[1] 新增  [2] 完成  [3] 刪除  [4] 離開
請選擇：
```

先把需求想清楚再動手，這是寫程式的好習慣。

## 二、設計資料結構

一筆待辦事項有「內容」和「完成了沒」兩個資料，用一個類別表示（[類別篇](csharp-classes-objects.html)學的）：

```csharp
class TodoItem
{
    public string Title { get; set; }      // 事項內容
    public bool IsDone { get; set; }        // 完成了沒
}
```

一整份清單就是「一串 TodoItem」，用 `List<TodoItem>`（[集合篇](csharp-collections-linq.html)學的）來裝。

## 三、一塊塊把功能寫出來

先看每個功能怎麼寫（下面是片段講解，完整可執行版在第五節）。

**列出清單**——用 `foreach` 走訪，完成的標 `[v]`、未完成標 `[ ]`：

```csharp
static void ShowList(List<TodoItem> todos)
{
    Console.WriteLine("\n===== 待辦清單 =====");
    if (todos.Count == 0)
    {
        Console.WriteLine("（目前沒有待辦事項）");
    }
    for (int i = 0; i < todos.Count; i++)
    {
        string mark = todos[i].IsDone ? "v" : " ";   // 三元運算子
        Console.WriteLine($"{i + 1}. [{mark}] {todos[i].Title}");
    }
    Console.WriteLine("--------------------");
}
```

**新增**——讀使用者輸入，建一個 `TodoItem` 加進清單：

```csharp
static void AddTodo(List<TodoItem> todos)
{
    Console.Write("輸入新事項：");
    string title = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(title))   // 空白就不加
    {
        Console.WriteLine("內容不能空白。");
        return;
    }
    todos.Add(new TodoItem { Title = title, IsDone = false });
    Console.WriteLine("已新增！");
}
```

**標記完成 / 刪除**——請使用者輸入編號，注意「編號從 1 開始、但清單索引從 0 開始」要減 1：

```csharp
static void MarkDone(List<TodoItem> todos)
{
    Console.Write("要完成哪一項（輸入編號）：");
    if (int.TryParse(Console.ReadLine(), out int num)   // 安全轉數字（例外處理篇）
        && num >= 1 && num <= todos.Count)
    {
        todos[num - 1].IsDone = true;     // 編號 1 對應索引 0
        Console.WriteLine("已標記完成！");
    }
    else
    {
        Console.WriteLine("編號無效。");
    }
}
```

`Console.ReadLine()` 讀使用者輸入的一行文字；`int.TryParse` 安全地把它轉成數字（還記得嗎？它不會丟例外，用回傳值告訴你成不成功）。

## 四、存檔與讀檔

這是讓資料「不會關掉就不見」的關鍵，用上[檔案與 JSON 篇](csharp-files-data.html)學的：

```csharp
static readonly string FilePath = "todos.json";

// 存檔：把整串清單序列化成 JSON 寫入檔案
static void Save(List<TodoItem> todos)
{
    string json = JsonSerializer.Serialize(todos, new JsonSerializerOptions { WriteIndented = true });
    File.WriteAllText(FilePath, json);
}

// 讀檔：啟動時把上次資料讀回；第一次執行檔案不存在就回空清單
static List<TodoItem> Load()
{
    try
    {
        string json = File.ReadAllText(FilePath);
        return JsonSerializer.Deserialize<List<TodoItem>>(json);
    }
    catch (FileNotFoundException)
    {
        return new List<TodoItem>();   // 第一次執行，從空清單開始
    }
}
```

注意 `Load()` 用 `try/catch` 接住「檔案還不存在」的情況——這正是上一篇強調的實務必備模式。

## 五、完整程式（可直接執行）

把上面全部組起來，這是**完整、可以整段貼上執行**的版本。

這支程式有點長，先給你一張「地圖」——`Program` 類別裡依序包含這幾個方法，貼完可以對照確認每個都在：

- `Main`：程式進入點，主選單迴圈
- `ShowList`：列出清單
- `AddTodo`：新增
- `MarkDone`：標記完成
- `DeleteTodo`：刪除
- `Save`：存檔
- `Load`：讀檔（**在整段的最後面，別以為漏掉了**）

結構重點：`using` 在最上面、`Main` 是進入點、`class TodoItem` 放最後（避免 CS8803 順序問題）。整段從 `using` 到最後的 `}` 一次複製貼上即可：

```csharp
using System.Text.Json;

class Program
{
    static readonly string FilePath = "todos.json";

    static void Main()
    {
        List<TodoItem> todos = Load();   // 啟動先讀回上次資料
        bool running = true;

        while (running)   // 主選單迴圈
        {
            ShowList(todos);
            Console.WriteLine("[1] 新增  [2] 完成  [3] 刪除  [4] 離開");
            Console.Write("請選擇：");
            string choice = Console.ReadLine();

            switch (choice)
            {
                case "1": AddTodo(todos); break;
                case "2": MarkDone(todos); break;
                case "3": DeleteTodo(todos); break;
                case "4": running = false; break;
                default: Console.WriteLine("請輸入 1~4。"); break;
            }

            Save(todos);   // 每次操作後存檔，資料不怕丟
        }

        Console.WriteLine("已儲存，再見！🐾");
    }

    static void ShowList(List<TodoItem> todos)
    {
        Console.WriteLine("\n===== 待辦清單 =====");
        if (todos.Count == 0)
            Console.WriteLine("（目前沒有待辦事項）");
        for (int i = 0; i < todos.Count; i++)
        {
            string mark = todos[i].IsDone ? "v" : " ";
            Console.WriteLine($"{i + 1}. [{mark}] {todos[i].Title}");
        }
        Console.WriteLine("--------------------");
    }

    static void AddTodo(List<TodoItem> todos)
    {
        Console.Write("輸入新事項：");
        string title = Console.ReadLine();
        if (string.IsNullOrWhiteSpace(title))
        {
            Console.WriteLine("內容不能空白。");
            return;
        }
        todos.Add(new TodoItem { Title = title, IsDone = false });
        Console.WriteLine("已新增！");
    }

    static void MarkDone(List<TodoItem> todos)
    {
        Console.Write("要完成哪一項（輸入編號）：");
        if (int.TryParse(Console.ReadLine(), out int num) && num >= 1 && num <= todos.Count)
        {
            todos[num - 1].IsDone = true;
            Console.WriteLine("已標記完成！");
        }
        else
        {
            Console.WriteLine("編號無效。");
        }
    }

    static void DeleteTodo(List<TodoItem> todos)
    {
        Console.Write("要刪除哪一項（輸入編號）：");
        if (int.TryParse(Console.ReadLine(), out int num) && num >= 1 && num <= todos.Count)
        {
            todos.RemoveAt(num - 1);
            Console.WriteLine("已刪除！");
        }
        else
        {
            Console.WriteLine("編號無效。");
        }
    }

    static void Save(List<TodoItem> todos)
    {
        string json = JsonSerializer.Serialize(todos, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(FilePath, json);
    }

    static List<TodoItem> Load()
    {
        try
        {
            string json = File.ReadAllText(FilePath);
            return JsonSerializer.Deserialize<List<TodoItem>>(json);
        }
        catch (FileNotFoundException)
        {
            return new List<TodoItem>();
        }
    }
}

class TodoItem
{
    public string Title { get; set; }
    public bool IsDone { get; set; }
}
```

跑跑看——新增幾筆、標記完成、關掉程式，再重新執行，你會發現**資料還在**（因為存進了 `todos.json`）。這就是一個麻雀雖小、五臟俱全的完整程式。

## 六、看看你用上了哪些東西

回頭看這個程式，整個系列的觀念幾乎都在裡面：

| 用到的技能 | 在哪裡 | 哪篇學的 |
|---|---|---|
| 變數、流程控制 | `while` 選單、`switch` 分流 | 語法基礎 |
| 方法 | 把每個功能拆成方法 | 方法與例外處理 |
| 例外處理 | `int.TryParse`、讀檔 `try/catch` | 方法與例外處理 |
| 類別與物件 | `TodoItem`、`Program` | 類別與物件 |
| 集合 | `List<TodoItem>` | 集合與 LINQ |
| 檔案 + JSON | `Save` / `Load` | 檔案讀寫與 JSON |

有沒有發現——每個單篇學的時候像是零散的積木，組起來就是一個真東西。這就是學程式的樣子。

## 七、自己動手升級

想繼續練，試著幫它加功能：

- **編輯**既有事項的內容。
- **用 LINQ** 加一個「只看未完成」的檢視（`todos.Where(t => !t.IsDone)`）。
- 幫事項加**截止日期**（在 `TodoItem` 加一個 `DateTime` 欄位）。
- 把存讀改成**非同步**版本（`File.WriteAllTextAsync` / `ReadAllTextAsync`）。

每加一個功能，都是把前面學的再用一次。

## 系列總結：你已經走完 C# 入門這條路

從第一篇到這裡，你完成了一整條學習路徑：

- **基礎**：裝好環境、語法、方法與例外處理。
- **物件導向**：類別、封裝繼承多型、介面與泛型。
- **進階**：集合與 LINQ、非同步、檔案與 JSON。
- **實戰**：把全部整合成一個能用的程式。

你現在具備的，不只是「背了一些語法」，而是**能獨立做出一個完整小程式的能力**。這是很多人學程式卡住、而你跨過去了的那道門檻。

接下來往哪走？C# 的世界還很大：

- **桌面應用**：WPF、.NET MAUI，做有視窗介面的程式。
- **網站後端**：ASP.NET Core，做網站與 Web API。
- **遊戲**：Unity 用的就是 C#，想做遊戲可以接著學。

挑一個你有興趣的方向深入，記得——**持續動手做專案**，是進步最快的路。

謝謝你跟著智慧喵走完這個系列，辛苦了！有任何問題，歡迎來 YouTube 找我聊聊。我們下個系列見。🐾

::aff hahow 想繼續把 C# 學得更深？ | 入門之後想進階到桌面、Web 或遊戲開發，Hahow 上有不少 C# / .NET 的系統課程，挑一個有興趣的方向帶著專案練下去吧。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[檔案讀寫與 JSON：讓程式能存資料、讀資料](csharp-files-data.html)
- 🎉 這是系列最後一篇，恭喜你學完！
