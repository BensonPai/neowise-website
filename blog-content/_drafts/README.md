# 草稿區（_drafts）

這裡放「AI 產生、尚未審核發布」的文章。每篇文章是一個 `.md` 檔。

## 文章檔格式

檔案開頭用 `---` 包起來的區塊叫 front-matter，放 SEO 與圖片需求；
下方才是文章正文（Markdown）。

```markdown
---
title: "文章標題（會成為 <title> 與 H1）"
description: "SEO meta description，建議 60-155 字，含關鍵字"
keywords: ["關鍵字1", "關鍵字2", "關鍵字3"]
slug: "url-slug-用英文與連字號"
date: "2026-09-11"
author: "炘智科技"
category: "技術文章"
status: "draft"
cover_alt: "封面圖的替代文字（無障礙 + SEO）"
images:
  - file: "cover.png"
    alt: "封面圖說明"
    usage: "文章頂部主視覺"
    prompt: "給生圖工具的英文/中文提示，或建議的圖庫來源"
  - file: "diagram-01.png"
    alt: "內文示意圖說明"
    usage: "放在第二段之後"
    prompt: "..."
---

## 這是第一個小標

文章正文，支援 **粗體**、清單、引用、圖片等。

![封面圖說明](assets/你的slug/cover.png)
```

## 欄位說明

| 欄位 | 必填 | 說明 |
|------|------|------|
| title | 是 | 文章標題 |
| description | 是 | meta description（SEO 摘要） |
| keywords | 是 | 關鍵字陣列 |
| slug | 是 | 網址代稱，決定 `blog/<slug>.html` 與圖片資料夾 `blog/assets/<slug>/` |
| date | 是 | 發布日期 YYYY-MM-DD |
| author | 否 | 預設「炘智科技」 |
| category | 否 | 分類標籤，顯示在卡片與文章頁 |
| status | 是 | draft / approved / published，控制發布狀態 |
| cover_alt | 否 | 列表卡片與 OG 圖的替代文字 |
| images | 否 | 圖片需求清單（AI 產出，供審核與配圖用） |

## 狀態流程

- `draft`：AI 剛產出，待審核。**產生器不會發布。**
- `approved`：審核通過，準備發布。產生器會把它產成 HTML。
- `published`：已發布。產生器持續產出，並可搬到 `_published/`。
