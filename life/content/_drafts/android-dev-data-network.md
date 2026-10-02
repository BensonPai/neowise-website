---
title: "【App 開發指南】讓 Android App 記住資料、連上網路：DataStore、Room 與 API"
description: "會做畫面之後，這篇讓你的 Android App 真正實用起來：用 DataStore 存小設定、用 Room 存結構化資料、用 Retrofit 串接網路 API，把靜態畫面變成會記憶、會連線的實用工具。"
keywords: ["Android 資料儲存", "Room", "DataStore", "Retrofit", "Android API", "Kotlin 網路", "協程 coroutine", "Android 開發"]
slug: "android-dev-data-network"
date: "2026-09-24"
order: 11
author: "智慧喵"
category: "科技"
status: "approved"
youtube: ""              # 錄好對應影片後填入影片 ID 或網址，會自動在文末嵌入播放器
cover_alt: "Android App 從網路雲端抓取資料的示意"
images:
  - file: "cover.jpg"
    alt: "Android App 從網路雲端抓取資料的示意"
    prompt: "一張簡潔的科技示意圖，一支 Android 手機透過連線從雲端伺服器接收資料的概念，青綠色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
  - file: "data-flow.jpg"
    alt: "Android 串接 API 的流程示意：發出請求、收到 JSON、解析、顯示"
    prompt: "簡潔的橫向流程圖，四個依序相連的步驟代表 App 發出請求、伺服器回傳資料、解析資料、顯示在畫面上，青綠色與白色搭配，乾淨的資訊圖風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

到目前為止，我們的 Android App 能[顯示畫面、能互動](android-dev-compose-first-app.html)了，但一樣有兩個問題：**一關掉資料就不見**，而且**不會連網**。這篇補這兩塊，讓 App 變成實用工具。

（如果你走過 iOS 的 [資料與網路篇](ios-dev-data-network.html)，觀念完全共通，只是換工具。）分兩部分：本機記資料、網路抓資料。

## 第一部分：讓 App 記住資料

Android 存本機資料，依「量」和「複雜度」有不同工具，先認識兩個層級。

### DataStore：存小設定最簡單

存少量、簡單的設定（暱稱、開關、偏好），用 **DataStore**（Google 現在推薦的做法，取代舊的 SharedPreferences）。概念就是「用一把鑰匙（key）存一個值」，會自動保存，App 關掉再開資料還在。

> 對應 iOS：這相當於 iOS 的 UserDefaults。用途一樣——只適合小資料，不是拿來當資料庫。

**先給你一個最輕量、能馬上跑的版本（SharedPreferences）。** 正式的 DataStore 要加套件、用協程，前置設定不少；學習階段想先體驗「資料被記住」，用 Android 最基本的 **SharedPreferences** 幾行就夠，不用加任何套件。下面做一個「輸入暱稱 → 儲存 → 關掉 App 重開還在」的小畫面（整段可貼，紅字用 Alt + Enter 補 import）：

```kotlin
@Composable
fun NicknameApp() {
    val context = LocalContext.current
    // 開啟一個叫 "settings" 的本機儲存空間
    val prefs = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

    // 一開始把之前存的暱稱讀出來（沒存過就給空字串）
    var nickname by remember { mutableStateOf(prefs.getString("nickname", "") ?: "") }

    Column(modifier = Modifier.safeDrawingPadding().padding(16.dp)) {
        Text("你好，${if (nickname.isEmpty()) "訪客" else nickname}", fontSize = 24.sp)

        OutlinedTextField(
            value = nickname,
            onValueChange = { nickname = it },
            label = { Text("輸入暱稱") }
        )

        Button(onClick = {
            prefs.edit().putString("nickname", nickname).apply()   // 存進本機
        }) {
            Text("儲存")
        }
    }
}
```

**驗證「真的記住了」**：輸入暱稱 → 按儲存 → 把 App 從最近清單完全關掉 → 重開 → 暱稱還在。`SharedPreferences` 跟 iOS 的 UserDefaults 一樣是「用 key 存值、存本機、沒加密、只適合小資料」。等你之後要更進階、型別更安全的做法，再換成官方推薦的 DataStore。

### Room：存結構化資料（清單、記錄）

當你要存的是**大量、有結構的資料**——例如一份待辦清單、一堆筆記、交易記錄——就用 **Room**。它是 Android 官方的資料庫方案，底層是 SQLite，但幫你包成好用的介面。

Room 的核心三塊（先建立概念，實作時再深入）：

- **Entity**：一筆資料的樣子（例如一則「筆記」有標題、內容）。用 Kotlin 的 `data class` 加註解定義。
- **DAO**：資料存取的方法（新增、查詢、刪除）。
- **Database**：把上面兩者組起來的資料庫本體。

```kotlin
// Entity：定義「筆記」這種資料長怎樣
@Entity
data class Note(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val content: String
)
```

Room 一開始配置比 UserDefaults 多幾個步驟，但一旦建好，存取結構化資料非常穩。這系列先讓你知道「小設定用 DataStore、清單記錄用 Room」這個分工，實作細節等你真的要做時再深入官方文件。

## 第二部分：從網路抓資料

大部分實用 App 都要連網。Android 這塊的主流做法是用 **Retrofit** 這個函式庫。

### 先懂幾個名詞

- **API**：網路上的資料窗口，你發請求、它回資料。
- **JSON**：API 回傳最常用的資料格式，像一堆「鍵：值」。
- **Retrofit**：Android 社群最常用的網路請求函式庫，把「呼叫 API」寫得很簡潔。
- **協程（Coroutine）**：Kotlin 處理非同步（例如等待網路回應）的機制，用 `suspend` 標記。對應 iOS 的 async/await。

![Android 串接 API 的流程示意：發出請求、收到 JSON、解析、顯示](assets/android-dev-data-network/data-flow.jpg)

流程一樣是：**發出請求 → 收到 JSON → 轉成 Kotlin 資料 → 顯示在畫面**。

### 定義資料與 API 介面

先照 JSON 定義 `data class`（Kotlin 的資料類別，很像 iOS 的 Codable struct）：

```kotlin
// 假設 API 回傳：{"city": "台北", "temp": 28}
data class Weather(
    val city: String,
    val temp: Int
)
```

再用 Retrofit 定義「這個 API 怎麼呼叫」：

```kotlin
interface WeatherApi {
    @GET("weather")
    suspend fun getWeather(): Weather   // suspend：這是非同步函式
}
```

`@GET("weather")` 告訴 Retrofit 去打哪個路徑，`suspend` 表示它是協程的非同步函式。Retrofit 會自動幫你發請求、把 JSON 轉成 `Weather`——不用手動解析。

### 實際呼叫

在協程裡呼叫，並處理錯誤：

```kotlin
suspend fun loadWeather() {
    try {
        val weather = api.getWeather()   // 等它回來，但不卡住畫面
        println("${weather.city} 溫度 ${weather.temp} 度")
    } catch (e: Exception) {
        // 網路很容易出錯，一定要處理
        println("抓取失敗：$e")
    }
}
```

重點跟 iOS 一樣：**網路一定會有出錯的時候**（斷線、逾時、格式不符），務必用 `try / catch` 處理，別假設它一定成功。

### 在 Compose 裡顯示

把抓到的資料放進 state，畫面就自動更新（延續上一篇的狀態驅動）：

```kotlin
@Composable
fun WeatherScreen() {
    var cityName by remember { mutableStateOf("載入中…") }

    LaunchedEffect(Unit) {
        // 畫面出現時自動抓資料
        // …抓成功後 cityName = weather.city，畫面自動更新
    }

    Text(cityName)
}
```

`LaunchedEffect` 是 Compose 提供的機制：畫面一出現就執行裡面的協程工作，很適合載入資料（對應 SwiftUI 的 `.task`）。

### 換成真的抓得到：輕量實作版（不用 Retrofit）

上面用 Retrofit 是正式做法，但要加套件、設定一堆。學習階段想**先真的抓到資料看看**，可以用 Kotlin 內建的 `URL().readText()` + `JSONObject` 手動解析，不用加任何套件。我們抓跟 iOS 篇同一個免費測試 API（JSONPlaceholder）。

**第一步：加網路權限。** 打開 `app/src/main/AndroidManifest.xml`，在 `<manifest>` 裡、`<application>` 上面加一行（沒加的話 Android 不准連網，會抓失敗）：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**第二步：這段整個可貼**（紅字 Alt + Enter 補 import）：

```kotlin
@Composable
fun TodoApp() {
    var text by remember { mutableStateOf("載入中…") }

    LaunchedEffect(Unit) {   // 畫面一出現就抓
        text = try {
            // 網路請求要丟到背景執行緒，不能卡主畫面
            val json = withContext(Dispatchers.IO) {
                URL("https://jsonplaceholder.typicode.com/todos/1").readText()
            }
            val obj = JSONObject(json)
            "第 ${obj.getInt("id")} 筆：${obj.getString("title")}"
        } catch (e: Exception) {
            "抓取失敗：$e"
        }
    }

    Column(modifier = Modifier.safeDrawingPadding().padding(16.dp)) {
        Text(text = text, fontSize = 20.sp)
    }
}
```

跑起來會顯示「第 1 筆：delectus aut autem」（跟 iOS 篇抓到的同一筆）。

> **跟 iOS 的差異**：Android 多了 `withContext(Dispatchers.IO)`——Android 規定網路**不能在主執行緒做**，要丟到背景，否則會當掉。另外要「打開網址看結構」決定怎麼解析（這招跟 iOS 篇一樣：把 API 網址貼進瀏覽器就看得到有哪些欄位）。
>
> **抓取失敗（連不到）怎麼辦？** 先確認 AndroidManifest 的 `INTERNET` 權限有加、模擬器有網路。這跟你 iOS 遇到的沙盒權限是類似的概念——都是「要先給 App 連網的許可」。

## 這一步大約要花多久？

觀念較密，抓 **2~3 週**：

- 先玩 DataStore：做一個「記住暱稱」的小畫面。
- 認識 Room：試著存一份簡單清單。
- 找一個**免費、不用金鑰**的公開 API，用 Retrofit 把「請求 → 解析 → 顯示」跑通一次。
- 綜合練習：把前面做過的 App 加上「連網抓資料 + 記住設定」。

網路這套「請求 → 解析 → 顯示」骨架學會後，抓任何 API 都是同一套。做過 iOS 的話，這篇會覺得特別熟悉。

## 下一篇

App 能記憶、能連網了，功能上像個真正的產品。下一篇進入 **完整上架 Google Play**——開發者帳號、建立 App、上傳、以及一個很多新手不知道、卻會卡住上架的關鍵規則（先劇透：新的個人帳號要先做封閉測試）。

下篇見。🐾

---

**系列導覽**

- 📚 回到 [App 開發完整指南 全系列目錄](appdev.html)
- ⬅️ 上一篇：[用 Jetpack Compose 做第一個 App](android-dev-compose-first-app.html)
- ➡️ 下一篇：[完整上架 Google Play](android-dev-publish-google-play.html)
