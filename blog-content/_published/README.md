# 已發布區（_published）

審核通過並已上線的文章，可從 `_drafts/` 搬到這裡歸檔。
產生器會同時掃描 `_drafts/` 與 `_published/`，只要文章的 `status` 為
`approved` 或 `published`，就會被產成 HTML 並列入列表頁。

放在哪個資料夾只影響「你自己的整理習慣」，不影響是否發布；
真正決定發布的是 front-matter 裡的 `status` 欄位。
