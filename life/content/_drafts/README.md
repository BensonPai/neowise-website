# 智慧喵 草稿區（_drafts）

放「尚未審核發布」的文章。每篇一個 `.md`。

## 文章格式

```markdown
---
title: "文章標題"
description: "摘要，會顯示在卡片與 SEO"
keywords: ["關鍵字1", "關鍵字2"]
slug: "url-用英文與連字號"
date: "2026-09-17"
author: "智慧喵"
category: "理財"          # 理財 / 旅遊 / 生活
status: "draft"           # draft=不發布，approved/published=會發布
cover_alt: "封面圖說明"
images:
  - file: "cover.png"
    alt: "封面圖說明"
    prompt: "生圖提示或圖庫建議"
---

## 小標題

正文，支援 **粗體**、清單、> 引用、表格、[連結](網址)、圖片。

![封面圖說明](assets/你的slug/cover.png)
```

## 分類（category）
- 理財、旅遊、生活（決定卡片標籤顏色與首頁篩選）

## 狀態（status）
- draft：草稿，產生器略過不發布
- approved / published：會產成 HTML 並列入列表
