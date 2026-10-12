---
title: "【C# 教學】方法與例外處理：把程式切成好用的小塊，並優雅地處理錯誤"
description: "程式變長就該拆成方法。這篇帶你搞懂 C# 的方法：參數、回傳值、多載與預設參數，再學會用 try/catch/finally 處理例外，讓程式遇到錯誤也不會整個崩掉。"
keywords: ["C# 方法", "C# 函式", "method", "參數", "回傳值", "例外處理", "try catch", "C# 教學"]
slug: "csharp-methods-exceptions"
date: "2026-10-11"
order: 4
author: "智慧喵"
category: "科技"
series: "csharp"
series_stage: "基礎"
series_order: "3"
status: "approved"
youtube: ""
cover_alt: "示意程式被拆成多個方法區塊，並有一個錯誤被 try/catch 攔下的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意程式被拆成多個方法區塊，並有一個錯誤被 try/catch 攔下的概念圖"
    prompt: "一張簡潔的概念示意圖，畫面是幾個相連的程式方塊代表方法，其中一個方塊有錯誤符號被一個保護框攔下，青藍與紫色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[語法基礎](csharp-syntax-basics.html)學完，你已經能寫出一段段會跑的程式了。但隨著程式變長，全部擠在一起會越來越難讀、難改。這篇要解決兩件事：

1. **怎麼把程式切成一塊塊好用的「方法」**——讓程式有條理、可重用。
2. **程式出錯時怎麼優雅處理**——用例外處理讓程式遇到問題也不會整個崩掉。

這是基礎篇的最後一塊拼圖，學完就能進入物件導向了。

## 一、方法是什麼、為什麼要用

**方法（method）**就是一段「打包好、取了名字、可以重複呼叫」的程式碼。你其實已經用過別人寫的方法了——`Console.WriteLine(...)` 就是一個方法。這篇要學的是**自己寫方法**。

為什麼要拆方法？三個好處：

- **可讀**：一段長程式拆成幾個命名清楚的方法，一看名字就知道在做什麼。
- **可重用**：同樣的邏輯寫一次，到處呼叫，不用複製貼上。
- **好維護**：邏輯要改時只改一個地方。

來看一個最基本的方法：

```csharp
// 定義一個方法：接收名字，回傳打招呼的句子
string Greet(string name)
{
    return $"哈囉，{name}！";
}

// 呼叫它
string message = Greet("智慧喵");
Console.WriteLine(message);   // 印出：哈囉，智慧喵！
```

拆解這個方法：

- **`string`**（最前面）：**回傳型別**，表示這個方法會吐回一個字串。
- **`Greet`**：方法名稱，習慣用「動詞」開頭、字首大寫（C# 的方法命名慣例）。
- **`(string name)`**：**參數**，呼叫時要給它的資料。
- **`return`**：把結果吐回去。

## 二、回傳值與 void

方法可以「有回傳值」或「沒有回傳值」：

```csharp
// 有回傳值：算完吐回結果
int Add(int a, int b)
{
    return a + b;
}

// 沒有回傳值：只做事、不吐東西，回傳型別寫 void
void SayHello()
{
    Console.WriteLine("哈囉！");
}

int sum = Add(3, 5);   // sum = 8
SayHello();            // 印出：哈囉！（它不回傳東西，所以不用接）
```

- **有回傳值**：寫明回傳型別（`int`、`string`…），方法裡用 `return` 吐回。
- **沒有回傳值**：回傳型別寫 **`void`**，表示「我只做事，不給你東西」。

## 三、進階參數技巧

方法的參數還有幾個實用寫法，分成「多載」和「預設參數值」兩個，各自認識一下。

### 多載（overloading）

**多載**指的是：**同一個方法名，可以有多個「參數不同」的版本**，C# 會依你傳進去的參數，自動幫你選對的那個版本：

```csharp
int Add(int a, int b) => a + b;
double Add(double a, double b) => a + b;

Console.WriteLine(Add(3, 5));       // 參數是整數 → 用 int 版 → 8
Console.WriteLine(Add(1.5, 2.5));   // 參數是小數 → 用 double 版 → 4
```

兩個方法都叫 `Add`，但一個收整數、一個收小數。你呼叫時給什麼型別，C# 就挑對應的版本執行。這就是**多載**——名字相同、參數不同。（之後在「類別與物件」篇，建構式也會用到多載，記住這個名詞。）

> 上面順便用了**表達式主體方法**：當方法只有一行 `return`，可以用 `=> 結果` 的精簡寫法取代 `{ return ...; }`，少打幾個字。

### 預設參數值

**預設參數值**指的是：參數可以先給一個預設值，呼叫時沒傳就用預設：

```csharp
string Greet(string name, string greeting = "哈囉")
{
    return $"{greeting}，{name}！";
}

Console.WriteLine(Greet("智慧喵"));          // 沒給第二個參數 → 用預設「哈囉」→ 哈囉，智慧喵！
Console.WriteLine(Greet("智慧喵", "早安"));   // 有給就用給的 → 早安，智慧喵！
```

這兩個技巧（多載、預設參數值）現在知道有就好，等實際寫到會自然用上。

## 四、為什麼需要例外處理

接下來換另一個主題：**錯誤處理**。

程式出錯分兩種：
- **你能預防的**（例如忘了判斷、邏輯寫錯）→ 靠測試和細心避免。
- **執行時才會發生、你擋不住的**（例如使用者亂輸入、檔案不存在、網路斷線）→ 這類叫**例外（exception）**，需要「例外處理」來接住。

舉個最常見的例子，呼應上一篇講過的字串轉數字：

```csharp
string input = "abc";          // 使用者亂打
int number = int.Parse(input); // 💥 這裡會丟出例外，程式直接崩潰！
Console.WriteLine(number);
```

`int.Parse("abc")` 沒辦法把 `"abc"` 變成數字，就會丟出例外。如果不處理，程式會當場停住、跳出一堆錯誤訊息。這在正式程式裡是不能接受的——你不能因為使用者打錯字就整個崩潰。

## 五、try / catch / finally

C# 用 `try` / `catch` 來「試著執行、出錯就接住」：

```csharp
string input = "abc";

try
{
    // try 區塊：放「可能會出錯」的程式
    int number = int.Parse(input);
    Console.WriteLine($"轉換成功：{number}");
}
catch (FormatException)
{
    // catch 區塊：出錯時才會執行，程式不會崩
    Console.WriteLine("輸入的不是有效數字，請重新輸入。");
}
```

- **`try`**：把「可能出錯」的程式放進來。
- **`catch`**：如果 `try` 裡出錯，就跳來這裡處理，程式繼續活著。
- 括號裡的 `FormatException` 是**例外的型別**——這裡專門接「格式錯誤」。你也可以不指定型別、用 `catch (Exception ex)` 接住所有例外。

**finally：不管有沒有錯都會執行**

```csharp
try
{
    Console.WriteLine("嘗試開啟檔案…");
    // 假設這裡做了某件可能出錯的事
}
catch (Exception ex)
{
    Console.WriteLine($"發生錯誤：{ex.Message}");  // ex.Message 是錯誤說明
}
finally
{
    Console.WriteLine("不管成功或失敗，這裡都會跑（例如收尾、關檔）。");
}
```

`finally` 常用來做「無論如何都要做的收尾」，例如關閉檔案、釋放資源。

**主動丟出例外 throw**：有時你自己想在不合理時主動報錯：

```csharp
int Divide(int a, int b)
{
    if (b == 0)
    {
        throw new DivideByZeroException("除數不能為 0");
    }
    return a / b;
}
```

## 六、動手綜合練習

把方法和例外處理合起來，做一個「安全把字串轉成數字」的方法。這裡用上一篇提過、更安全的 `int.TryParse`，再搭配例外觀念：

```csharp
// 讀使用者輸入，安全轉成數字；失敗就回傳 0 並提示
int ReadNumber(string input)
{
    if (int.TryParse(input, out int result))
    {
        return result;          // 轉成功，result 就是數字
    }
    else
    {
        Console.WriteLine($"「{input}」不是有效數字，當作 0 處理。");
        return 0;
    }
}

Console.WriteLine(ReadNumber("42"));    // 42
Console.WriteLine(ReadNumber("abc"));   // 提示後回傳 0
```

> 這裡出現了 `out`：`int.TryParse` 會回傳 true/false 代表「成功了沒」，同時把轉好的數字透過 `out` 參數「送出來」。`TryParse` 的好處是——它不會丟例外、不會崩，用回傳值告訴你成不成功。很多 C# 的 `TryXxx` 方法都是這個模式，比 `Parse` + try/catch 更俐落。

試著改改看：失敗時改成要求重新輸入？改成處理小數（`double.TryParse`）？動手改最有感。

## 這一步大約要花多久？

方法的觀念很快能懂（抓幾天）；例外處理則建議多練，因為「什麼時候該接、該接哪種例外」需要經驗累積。練法：

- 把前面寫過的小程式，試著拆成幾個命名清楚的方法。
- 故意輸入會出錯的資料，練習用 try/catch 接住。
- 記住 `TryParse` 這種「不丟例外、用回傳值報成敗」的安全模式。

## 下一篇

基礎篇到這裡就完整了——你已經會變數、流程控制、方法、例外處理，能寫出像樣的小程式。接下來進入 C# 的核心精神：**物件導向**。下一篇從 **類別與物件** 開始，學會用「藍圖造物件」的方式組織程式。

這是 C# 真正強大的地方，別錯過。下篇見。🐾

::aff hahow 想把 C# 基礎練得更扎實？ | 方法與例外處理是寫出穩定程式的關鍵。Hahow 上有從 C# 到 .NET 實作的系統課程，想要有完整練習與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [C# 程式設計完整教學 全系列目錄](csharp.html)
- ⬅️ 上一篇：[語法基礎：變數、型別、運算子與流程控制](csharp-syntax-basics.html)
- ➡️ 下一篇：[類別與物件：物件導向的第一步](csharp-classes-objects.html)
