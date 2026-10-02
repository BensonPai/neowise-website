---
title: "【App 開發指南】完整上架 Google Play：帳號、封閉測試到送審全流程"
description: "Android App 做好了，怎麼放上 Google Play？這篇帶你走完整上架流程：註冊開發者帳號、打包 AAB、在 Play Console 建立 App，並特別說明新手最容易卡關的『12 位測試者、14 天封閉測試』規則。"
keywords: ["Google Play 上架", "Play Console", "Android 上架流程", "封閉測試", "AAB", "target API", "Android 送審", "Google Play 開發者"]
slug: "android-dev-publish-google-play"
date: "2026-09-25"
order: 12
author: "智慧喵"
category: "科技"
status: "approved"
youtube: ""              # 錄好對應影片後填入影片 ID 或網址，會自動在文末嵌入播放器
cover_alt: "App 上架到 Google Play 的示意"
images:
  - file: "cover.jpg"
    alt: "App 上架到 Google Play 的示意"
    prompt: "一張簡潔的科技示意圖，一支 Android 手機從裝置往上傳到一個雲端商店的概念，青綠色調的現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
  - file: "publish-steps.jpg"
    alt: "Google Play 上架流程示意，含封閉測試步驟"
    prompt: "簡潔的橫向流程圖，六個依序相連的步驟代表註冊帳號、建立 App、準備素材、上傳、封閉測試、送審正式版，青綠色與白色搭配，乾淨的資訊圖風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

Android App 能跑、能記憶、能連網了——[前四篇](android-dev-data-network.html)的努力，現在要讓它上架 **Google Play**。

Android 上架整體比 iOS 快、也便宜（帳號一次性、審核相對寬鬆），但**有一個新手極容易卡關的規則**，我會特別點出來，讓你不會白等。

> **查證時間：2026-09-27**。以下流程與規則參考 Google 官方文件，Google 政策可能調整，實際請以 [Google Play 官方說明](https://support.google.com/googleplay/android-developer)與 Play Console 為準。

## 上架的整體流程

![Google Play 上架流程示意，含封閉測試步驟](assets/android-dev-publish-google-play/publish-steps.jpg)

大致是：**註冊開發者帳號 → 在 Play Console 建立 App → 準備素材 → 打包上傳 → （新個人帳號）封閉測試 → 送審正式版**。

## 步驟一：註冊 Google Play 開發者帳號

到 [Google Play Console](https://play.google.com/console) 註冊：

- 費用：**一次性 US$25**（付一次終身有效，不用年繳，來源：[Google Play 官方說明](https://support.google.com/googleplay/android-developer/answer/6112435)）。
- 可選「個人」或「組織」帳號。
- 需要完成**身分驗證**，這步可能要花一點時間，建議越早開始越好。

## 步驟二：在 Play Console 建立 App

在 Play Console 建立一筆 App，填基本資訊：App 名稱、預設語言、是 App 還是遊戲、免費或付費。

## 步驟三：準備素材與必填資訊

跟 iOS 類似，這些少一樣就送不出去：

- **App 圖示、功能圖（feature graphic）、螢幕截圖**。
- **簡短說明、完整說明**（影響搜尋，好好寫）。
- **隱私權政策網址**：**必填**。
- **內容分級**：填一份問卷。
- **資料安全表單（Data Safety）**：申報你的 App 收集、分享哪些資料（類似 iOS 的隱私標籤）。
- **目標對象與內容**：宣告面向的年齡層等。

## 步驟四：打包並上傳 App

Android 上架用的格式是 **AAB（Android App Bundle）**，不是舊的 APK：

1. 在 Android Studio 選 **Build → Generate Signed Bundle**，產生簽署過的 `.aab`。
2. 上傳到 Play Console 對應的發布軌道。

> **重要**：Google Play 規定新 App 必須 **target 夠新的 Android 版本（目前是 Android 16 / API level 36 以上）**才能上架，且這個要求每年會往上調。在 Android Studio 專案裡設定好 `targetSdk` 再打包。

## 步驟五（關鍵！）：新個人帳號的封閉測試門檻

這是**最多新手卡關、卻很少人事先講**的地方，一定要知道：

**如果你的開發者帳號是「個人」帳號、且是在 2023 年 11 月 13 日之後建立的**，那麼在能發布「正式版（production）」之前，Google 要求你先完成一輪**封閉測試（closed testing）**：

- 需要**至少 12 位測試者**，
- 持續**至少 14 天**，
- 之後才能申請「正式版存取權」。

換句話說，個人新帳號**沒辦法一鍵直接上架**，得先找到 12 個人幫你測兩週。這常讓不知情的人卡在最後一步乾等。

**因應建議**：

- 及早**號召親友、社群 12 位測試者**（用 Google 帳號 email 加入測試），別等到最後才找人。
- 這 14 天剛好拿來收集回饋、修 bug，把它當成正式的測試期，而不只是走流程。
- 組織帳號的規則不同，但個人開發者最常見，務必留意這條。

（來源：[Google Play 上架流程說明](https://www.choicely.com/tutorials/how-to-publish-an-app-on-google-play)。實際門檻請以 Play Console 顯示為準。）

## 步驟六：送審正式版

完成測試門檻、素材齊全後，就能提交正式版送審。

- Google 審核**相對比 iOS 快、也較自動化**，但新帳號、或涉及敏感權限的 App 可能審得久一些。
- 通過後即可發布，選擇要不要分階段釋出（staged rollout，先開放給部分用戶）。

## 這一步大約要花多久？

- 準備素材、熟悉 Play Console：**3~5 天**。
- 但如果是新個人帳號，要**額外算上封閉測試的 14 天**——這段是硬性等待期，記得提早啟動。

所以務實的時程是：**素材準備 3~5 天，加上（新帳號）14 天封閉測試**。把測試者提早找齊，是這步最省時間的關鍵。

## 下一篇

App 上架了，最後一哩路——**怎麼靠 Android App 賺錢**。下一篇是 Android 路徑最後一篇，會講 Google Play 的內購、訂閱、AdMob 廣告，以及定價策略。

你即將完成 Android 從零到上架的完整旅程。下篇見。🐾

---

**系列導覽**

- 📚 回到 [App 開發完整指南 全系列目錄](appdev.html)
- ⬅️ 上一篇：[讓 App 記住資料、連上網路](android-dev-data-network.html)
- ➡️ 下一篇：[Android App 怎麼賺錢](android-dev-monetization.html)
