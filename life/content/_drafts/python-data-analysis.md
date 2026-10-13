---
title: "【Python 教學】資料處理入門：用 pandas 讀 CSV、篩選、統計"
description: "Python 在資料分析界是王者。這篇帶你入門 pandas：讀取 CSV、檢視與篩選資料、做基本統計，還有畫出簡單圖表，體會用程式處理資料的威力。"
keywords: ["Python 資料分析", "pandas", "CSV", "DataFrame", "資料處理", "matplotlib", "Python 教學"]
slug: "python-data-analysis"
date: "2026-10-13"
order: 11
author: "智慧喵"
category: "科技"
series: "python"
series_stage: "實用應用"
series_order: "10"
status: "approved"
youtube: ""
cover_alt: "示意用 pandas 把表格資料整理與統計的概念圖"
images:
  - file: "cover.jpg"
    alt: "示意用 pandas 把表格資料整理與統計的概念圖"
    prompt: "一張簡潔的概念示意圖，一份表格資料經過處理後產生統計圖表，象徵資料分析，藍黃色調呼應 Python 代表色，現代科技氛圍，扁平簡潔風格，不要有任何文字，橫向 16:9 構圖，輸出約 1200x630 像素、適合網頁使用的中等解析度（勿超過 1600px 寬）"
---

[上一篇](python-automation.html)學會自動化。這篇是實用應用的最後一塊、也是 Python 的招牌強項：**資料處理**。

Python 在資料分析界幾乎是王者，核心工具就是 **pandas**。有了它，Excel 要點半天的篩選、統計、樞紐分析，用幾行程式就能搞定，而且能處理 Excel 開不動的大檔案。

## 一、安裝與認識 pandas

pandas 不是內建的，用 pip 安裝（建議在上一篇環境篇講的 venv 裡裝）：

```bash
pip install pandas
```

> 遇到裝了卻 `ModuleNotFoundError`？回頭看[環境準備篇的 venv 段落](python-setup-tools.html)，多半是 Python 環境錯位。

**DataFrame 是什麼**：pandas 的核心是 **DataFrame**——你可以把它想成「程式裡的試算表」，有欄（column）有列（row），就像一張 Excel 表。pandas 做的事，就是用程式操作這張表。

### 補充：用 Jupyter Notebook 做資料分析更順手

做資料分析時，很多人愛用 **Jupyter Notebook**。它跟一般 `.py` 檔最大的差別是：可以把程式**切成一格一格（cell）分開跑**，每格跑完**立刻在下面看到結果**（表格、圖表都直接顯示），改哪格就只重跑哪格——很適合「邊試邊看」的資料探索。

**在 VS Code 裡用（最簡單，不用額外開軟體）：**

1. 新建一個副檔名為 **`.ipynb`** 的檔案（notebook 檔），VS Code 會自動用 notebook 介面打開。
2. 在格子裡打程式，按 **Shift + Enter** 執行這一格並跳到下一格。
3. 第一次執行時，VS Code 可能提示你安裝需要的東西，照它指示點「安裝」即可。

> 關於要裝什麼，別被兩個名字很像的東西搞混：
> - **Jupyter 擴充套件**（VS Code 的外掛）：當初裝 Microsoft 官方「Python」擴充套件時，通常**已經連它一起裝好了**，不用再另外裝。
> - **`jupyter` 套件**（Python 套件）：這是讓 notebook 核心能跑的東西，若 VS Code 提示缺少，就在你的 venv 裡 `pip install jupyter`（或 `pip install ipykernel`）。
>
> 簡單說：**VS Code 擴充多半已有、直接開 `.ipynb` 試；真的缺東西時它會提示你裝。**

**用起來像這樣**——一格放一個步驟，分開跑、逐步看：

```python
# 第 1 格：讀資料
import pandas as pd
df = pd.read_csv("students.csv")
df.head()          # 直接顯示前幾列的表格（notebook 會漂亮地排版出來）
```

```python
# 第 2 格：分組統計（跑這格會直接在下面顯示結果）
df.groupby("subject")["score"].mean()
```

```python
# 第 3 格：畫圖（圖表直接內嵌顯示在格子下方）
df.groupby("subject")["score"].mean().plot(kind="bar")
```

- notebook 裡**最後一行的結果會自動顯示**，不用每次都 `print()`（例如上面直接寫 `df.head()` 就會印出表格）。
- 每格可獨立執行，改了某格只要重跑那格，不用整個程式從頭跑——這是它最爽的地方。

> 新手不用糾結要用哪個：**學語法、寫工具用一般 `.py`；做資料探索、想一步步看結果用 Notebook**。兩個都用同一套 Python 和套件，隨時切換都行。這篇的範例用 `.py` 或 Notebook 跑都可以。

## 二、讀取資料

假設你有一個 CSV 檔 `students.csv`（CSV 是最常見的表格資料格式，Excel 可以另存成 CSV）。它的內容長這樣——第一行是欄位名稱，之後每行一筆資料：

```text
name,subject,score
小明,數學,90
小華,數學,55
小美,英文,78
小強,英文,95
小李,數學,82
```

> 想直接練不想自己打？[下載這份範例 students.csv](assets/python-data-analysis/students.csv)（15 筆、數學/英文/自然三科，分組統計起來更有感），存到你的程式同一個資料夾就能跟著跑。

用 pandas 讀進來：

```python
import pandas as pd        # 慣例：pandas 簡寫成 pd

df = pd.read_csv("students.csv")   # 讀 CSV，得到一個 DataFrame

print(df)                  # 印出整張表
print(df.head(3))          # 只看前 3 列
print(df.info())           # 看欄位、資料型別、筆數
print(df.describe())       # 數值欄位的統計摘要（平均、最大最小等）
```

- **`pd.read_csv(檔名)`**：讀 CSV 成 DataFrame。
- **`.head(n)`**：看前 n 列（資料多時很好用）。
- **`.info()`**：看整張表的結構。
- **`.describe()`**：自動算出數值欄位的統計摘要。

## 三、篩選與操作

**選某一欄：**

```python
print(df["score"])           # 只看分數那一欄
print(df["name"])            # 只看名字
```

**依條件篩選列**（這是最常用的）：

```python
# 分數 >= 80 的學生
high = df[df["score"] >= 80]
print(high)

# 數學科的學生
math = df[df["subject"] == "數學"]
print(math)
```

讀法：`df[df["score"] >= 80]` 就是「從 df 裡，挑出 score 欄 >= 80 的那些列」。

**排序、新增欄位：**

```python
# 依分數由高到低排序
print(df.sort_values("score", ascending=False))

# 新增一欄「是否及格」
df["pass"] = df["score"] >= 60
print(df)
```

## 四、分組統計：groupby

資料分析最強的功能之一——**依某欄分組，再對每組做統計**。例如「各科的平均分數」：

```python
# 依科目分組，算每組 score 的平均
avg = df.groupby("subject")["score"].mean()
print(avg)
# subject
# 數學    75.666667
# 英文    86.500000

# 各科有幾人
count = df.groupby("subject")["name"].count()
print(count)
```

`groupby("subject")` 把資料依科目分成幾組，再 `["score"].mean()` 算每組的平均分。這在 Excel 要做樞紐分析，pandas 一行搞定。

## 五、簡單視覺化

pandas 可以直接畫圖（底層用 matplotlib，裝 pandas 時通常會一起有，若無就 `pip install matplotlib`）：

```python
import pandas as pd
import matplotlib.pyplot as plt

# 讓圖表能正常顯示中文（詳細說明見下方）
plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei"]   # Mac 改 "Arial Unicode MS"
plt.rcParams["axes.unicode_minus"] = False

df = pd.read_csv("students.csv")

# 各科平均分數畫成長條圖
avg = df.groupby("subject")["score"].mean()
avg.plot(kind="bar")        # kind 可換 line（折線）、pie（圓餅）等

plt.title("各科平均分數")
plt.show()                  # 顯示圖表
```

幾行就能把資料變成圖表。想換圖表類型改 `kind` 就好（`bar` 長條、`line` 折線、`pie` 圓餅）。

> 上面開頭那兩行 `rcParams` 就是在設定中文字型——如果少了它們，圖上的中文會變成方塊。下面詳細說明。

**中文顯示問題（很常遇到，一定會用到）**：matplotlib 預設的字型沒有中文，所以圖表上的中文標題、標籤會變成一個個**空心方塊**。解法是在畫圖**之前**，指定一個「系統裡有的中文字型」：

```python
import matplotlib.pyplot as plt

# 指定中文字型（放在畫圖之前）
plt.rcParams["font.sans-serif"] = ["Microsoft JhengHei"]  # Windows：微軟正黑體
# Mac 改用：plt.rcParams["font.sans-serif"] = ["Arial Unicode MS"]
plt.rcParams["axes.unicode_minus"] = False                # 修正負號變成方塊的問題
```

- **`font.sans-serif`**：指定要用的字型。字型名稱要是**你系統真的有裝**的——Windows 常用 `Microsoft JhengHei`（微軟正黑體）或 `DFKai-SB`（標楷體）；Mac 可用 `Arial Unicode MS` 或 `Heiti TC`；若還是方塊，就換一個你電腦有的中文字型名稱試試。
- **`axes.unicode_minus = False`**：不加這行的話，負數的負號（像 -5）有時也會變方塊，加了就正常。

把這兩三行放在畫圖程式的最前面，中文就會正常顯示了。

> 這段內容參考 matplotlib 社群常見做法整理，已改寫說明。實際字型名稱請以你電腦安裝的為準。

## 六、動手練習

- 找一份公開 CSV（政府開放資料、Kaggle，或自己用 Excel 存一份），用 `read_csv` 讀進來。
- 練 `head()`、`info()`、`describe()` 看懂資料長相。
- 練條件篩選（挑出符合某條件的列）。
- 練 `groupby` 做分組統計，再畫成圖表。

拿你有興趣的資料來玩最有感——銷售紀錄、記帳明細、運動數據都行。

## 這一步大約要花多久？

pandas 功能很多，但入門只要掌握「讀資料 → 篩選 → 分組統計 → 畫圖」這條主線，抓 **2~3 週**。它是個大題目，這篇是入門敲門磚，之後想深入資料分析、甚至往 AI/機器學習走，pandas 都是必備基礎。練法：

- 一定要拿**真實資料**練，光看範例沒用。
- 把「用 Excel 會做的事」試著改用 pandas 做一遍。
- `groupby` 多練，它是資料分析的核心武器。

## 下一篇

實用應用篇到這裡就完整了——檔案、爬蟲、自動化、資料處理，你已經能用 Python 做很多實際的事。下一篇是整個系列的**壓軸實戰**：把前面學的整合起來，動手做一個**檔案整理小工具**，體會從零打造一個完整程式的成就感。

準備好收尾了嗎？下篇見。🐾

::aff hahow 想把 Python 資料分析學得更深？ | pandas 是資料分析的敲門磚，往後還有視覺化、機器學習。Hahow 上有從 Python 資料分析到 AI 的系統課程，想要有完整範例與專案帶著走的話可以逛逛。::

---

**系列導覽**

- 📚 回到 [Python 程式設計完整教學 全系列目錄](python.html)
- ⬅️ 上一篇：[自動化腳本：把重複的工作交給程式](python-automation.html)
- ➡️ 下一篇：[實戰專案：做一個檔案整理小工具](python-project-cli-tool.html)
