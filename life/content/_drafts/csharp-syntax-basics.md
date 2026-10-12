---
title: "【C# 教學】語法基礎：變數、型別、運算子與流程控制"
description: "環境裝好後，就從 C# 語法基礎開始動手寫。這篇用實際範例帶你搞懂變數與常數、常見資料型別、運算子，以及 if、switch、for、while 等流程控制，打好寫 C# 的地基。"
keywords: ["C# 變數", "C# 型別", "C# 流程控制", "if else", "for 迴圈", "while", "C# 語法", "C# 教學"]
slug: "csharp-syntax-basics"
date: "2026-10-11"
order: 3
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "基礎"
series_order: "2"
status: "approved"
youtube: ""              # 錄好對應影片後填入影片 ID 或網址，會自動在文末嵌入播放器
cover_alt: "程式編輯器中一段 C# 變數宣告與 for 迴圈的程式碼示意"
images:
  - file: "cover.jpg"
    alt: "程式編輯器中一段 C# 變數宣告與 for 迴圈的程式碼示意"
    prompt: "一張乾淨明亮的科技示意圖，畫面是程式編輯器中一段彩色的 C# 程式碼，包含變數宣告與迴圈結構，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字（或僅示意性的程式碼不可辨識），橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[環境裝好了](csharp-setup-tools.html)，這篇開始真正動手寫 **C#**。

這一篇是整個系列的地基：變數、型別、運算子、流程控制——這些是你寫**任何** C# 程式都會用到的基本功。內容不難，但建議每個範例都親手打一次、改改數值看結果，手感比死背重要太多。

小提醒：延續上一篇，在 Visual Studio 開一個主控台專案，把範例貼進 `Program.cs` 跟著跑最有效。文中的 `Console.WriteLine(...)` 就是「在主控台印出一行」。

## 一、變數與常數

變數就是「存放資料的盒子」。C# 宣告變數時，習慣把**型別**寫在前面：

```csharp
int score = 100;          // 一個整數變數
score = 120;              // ✅ 可以改，變數本來就能變

const double Pi = 3.14159; // const：常數，設定後不能改
// Pi = 3;                // ❌ 會報錯，常數不能改
```

- **變數**：值可以變動，宣告時先寫型別（例如 `int`）。
- **常數 `const`**：一旦設定就不能改，用來放不會變的值（像圓周率）。

**型別推斷 `var`**：如果你在宣告時就給了初始值，可以用 `var` 讓編譯器自動判斷型別，少打幾個字：

```csharp
var count = 5;        // 編譯器自動判斷成 int
var price = 19.9;     // 自動判斷成 double
var title = "教學";    // 自動判斷成 string
```

> 重點澄清：C# 的 `var` **不是**「什麼都能裝的萬用型別」。它只是「請編譯器幫我推斷型別」的簡寫——`var count = 5` 之後，`count` 就**永遠是 int**，不能再塞字串進去。C# 骨子裡是**強型別**語言，型別一旦定了就定了，這點和 JavaScript 的 `var` 完全不同，別搞混。

## 二、常見資料型別

C# 常用的基本型別：

```csharp
int age = 30;              // 整數
double height = 175.5;     // 小數（浮點數）
decimal money = 1500.50m;  // 高精度小數，算錢用它（注意結尾的 m）
bool isStudent = false;    // 布林：true / false
char grade = 'A';          // 單一字元，用單引號
string city = "台北";       // 字串（一串文字），用雙引號
```

幾個新手要記的點：

- **`int` vs `double` vs `decimal`**：整數用 `int`；一般小數用 `double`；但**跟錢有關的計算用 `decimal`**（結尾加 `m`），因為它精度高、不會有 `double` 那種微小誤差。
- **`char` vs `string`**：單一字元用 `char`（單引號 `'A'`）；一串文字用 `string`（雙引號 `"台北"`）。引號別用錯。

**型別轉換**：不同型別之間要轉換時：

```csharp
// 字串轉數字（例如把使用者輸入轉成數字）
string input = "42";
int number = int.Parse(input);     // 轉成 42

// 數字轉字串
int n = 100;
string text = n.ToString();        // 轉成 "100"
```

> 如果字串內容不是合法數字（例如 `"abc"`），`int.Parse` 會丟出錯誤。更安全的做法是 `int.TryParse`，我們在例外處理那篇會談。

## 三、運算子

**算術運算子**跟數學課一樣：

```csharp
int a = 10, b = 3;

Console.WriteLine(a + b);   // 13 加
Console.WriteLine(a - b);   // 7  減
Console.WriteLine(a * b);   // 30 乘
Console.WriteLine(a / b);   // 3  除（整數相除會無條件捨去小數！）
Console.WriteLine(a % b);   // 1  餘數（取模）
```

> 新手陷阱：`10 / 3` 的結果是 `3` 不是 `3.33`，因為兩個都是整數，相除會捨去小數。想要小數結果，至少有一邊要是小數，例如 `10.0 / 3`。

**比較與邏輯運算子**（結果是 true / false）：

```csharp
bool r1 = (a > b);          // 大於
bool r2 = (a == b);         // 等於（注意是兩個等號 ==）
bool r3 = (a != b);         // 不等於
bool r4 = (a > 5 && b < 5); // && 且（兩邊都成立）
bool r5 = (a > 5 || b > 5); // || 或（任一成立）
```

**字串插值 `$"..."`**：把變數塞進文字裡，C# 的寫法很好用——在字串前面加 `$`，然後用 `{變數}` 包住：

```csharp
string name = "智慧喵";
int level = 3;

Console.WriteLine($"哈囉 {name}，你現在是第 {level} 級");
// 印出：哈囉 智慧喵，你現在是第 3 級
```

這比用 `+` 一段一段接字串好讀太多，之後會很常用。

## 四、流程控制

讓程式「依情況做不同的事」或「重複做某件事」。

### if：條件判斷

```csharp
int temperature = 28;

if (temperature >= 30)
{
    Console.WriteLine("好熱，開冷氣");
}
else if (temperature >= 20)
{
    Console.WriteLine("天氣舒服");
}
else
{
    Console.WriteLine("有點冷");
}
```

C# 的條件要用**括號 `( )`** 包起來，區塊用**大括號 `{ }`**。

### switch：多重條件

當你要比對同一個變數的多種值，`switch` 比一長串 `else if` 清楚：

```csharp
string grade = "B";

switch (grade)
{
    case "A":
        Console.WriteLine("優秀");
        break;
    case "B":
        Console.WriteLine("良好");
        break;
    case "C":
        Console.WriteLine("及格");
        break;
    default:
        Console.WriteLine("要加油");
        break;
}
```

每個 `case` 結尾要 `break`（跳出 switch）。新版 C# 還有更精簡的 **switch 運算式**寫法：

```csharp
string result = grade switch
{
    "A" => "優秀",
    "B" => "良好",
    "C" => "及格",
    _ => "要加油"      // _ 代表「其他情況」
};
Console.WriteLine(result);
```

兩種都能用，新寫法更短、更適合「依值回傳一個結果」的情況。

### 迴圈：重複執行

```csharp
// for：重複固定次數
for (int i = 1; i <= 5; i++)
{
    Console.WriteLine($"第 {i} 次");
}

// while：條件成立就一直做
int count = 3;
while (count > 0)
{
    Console.WriteLine($"倒數 {count}");
    count--;        // 別忘了讓條件有機會變 false，否則變無窮迴圈
}

// foreach：走訪一整組資料（之後學集合會很常用）
string[] fruits = { "蘋果", "香蕉", "橘子" };
foreach (string fruit in fruits)
{
    Console.WriteLine(fruit);
}
```

- **`for`**：知道要跑幾次時用它（`i++` 代表每輪 i 加 1）。
- **`while`**：依條件決定跑幾次。小心別讓條件永遠成立，變成跑不完的無窮迴圈。
- **`foreach`**：一次走訪一整組資料的每個元素，最直覺。

## 五、動手綜合練習

把上面全用上，做一個「印出 1 到 10、並標出奇偶數」的小程式：

```csharp
for (int i = 1; i <= 10; i++)
{
    string type = (i % 2 == 0) ? "偶數" : "奇數";   // 三元運算子：條件 ? 真 : 假
    Console.WriteLine($"{i} 是 {type}");
}
```

這裡順便介紹**三元運算子 `? :`**：`條件 ? 成立時的值 : 不成立時的值`，是 `if-else` 的精簡版，適合「二選一給值」的場合。

跑跑看，然後試著自己改：改成只印偶數？改成 1 到 100？用 `i % 3 == 0` 找 3 的倍數？動手改，才是真的學會。

## 這一步大約要花多久？

C# 語法基礎抓 **2~3 週**。如果你學過其他語言（Swift、Kotlin、Java、C++ 都算），觀念大多相通，可能一週就上手，主要是適應 C# 的語法細節。練法：

- 每個觀念親手打、改數值看變化。
- 流程控制（if / switch / 迴圈）多練，這是組成所有程式的骨架。
- 寫個小程式綜合練習，例如「輸入分數印等第」「印九九乘法表」。

重點是手感，不是背。這些會在你之後寫的每一支 C# 程式裡反覆出現。

## 下一篇

變數和流程控制有了，但程式一長就會亂。下一篇進入 **方法與例外處理**——學會把程式切成一塊塊好用的「方法」，並在出錯時優雅地處理，不讓程式整個崩掉。

下篇見。🐾

::aff hahow 想把 C# 練得更扎實？ | 語言基礎最怕只看不練。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[開發環境準備：安裝 .NET SDK 與 Visual Studio，跑出第一支程式](csharp-setup-tools.html)
- ➡️ 下一篇：[方法與例外處理：把程式切成好用的小塊，並優雅地處理錯誤](csharp-methods-exceptions.html)
