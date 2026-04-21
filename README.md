# TripGuru Bug Dashboard

内部 Bug 跟踪与日报管理系统 · Internal Bug Tracking & Daily Log System

---

## 简介 / Overview

**中文**
TripGuru Bug Dashboard 是一个轻量级的内部工具，数据直接从 ClickUp 拉取，帮助团队实时跟踪 Bug 状态、按优先级筛选问题，并支持每日进度日报的提交与查看。

**English**
TripGuru Bug Dashboard is a lightweight internal tool that pulls data directly from ClickUp. It helps the team track bug status in real time, filter issues by priority, and submit or review daily progress logs.

---

## 功能 / Features

| 功能 | Feature |
|------|---------|
| 从 ClickUp 实时拉取 Bug 数据 | Real-time bug data from ClickUp |
| 按优先级（P0/P1/P2）筛选 | Filter by severity (P0 / P1 / P2) |
| 按状态筛选（修复中、已上线等） | Filter by status (In Progress, Completed, etc.) |
| 按原因、负责人筛选 | Filter by reason and assignee |
| 统计卡片可点击筛选 | Clickable stat cards for quick filtering |
| 每日日报提交（同步到 ClickUp） | Daily log submission (synced to ClickUp) |
| 历史日报横向滚动查看 | Horizontal scroll to view log history |
| 中英文界面切换 | Chinese / English UI toggle |

---

## 项目结构 / Project Structure

```
bug-dashboard/
├── index.html        # 页面结构 / Page structure
├── style.css         # 样式 / Styles
├── app.js            # 前端逻辑 / Frontend logic
├── server.js         # 本地代理服务器 / Local proxy server
├── .env              # 环境变量（不提交）/ Environment variables (not committed)
├── package.json
└── node_modules/
```

---

## 环境要求 / Requirements

- Node.js v16+
- ClickUp API Token
- VS Code + Live Server 插件（推荐 / Recommended）

---

## 启动方式 / Getting Started

**1. 安装依赖 / Install dependencies**

```bash
npm install
```

**2. 配置 Token / Configure Token**

在 `.env` 文件中填入你的 ClickUp API Token：

In the `.env` file, add your ClickUp API Token:

```
CLICKUP_TOKEN=pk_xxxxxxxxxxxxxxxx
```

**3. 启动代理服务器 / Start the proxy server**

```bash
node server.js
```

看到以下输出说明启动成功 / You should see:

```
✅ Proxy running on http://localhost:3001
```

**4. 打开页面 / Open the page**

用 VS Code 的 Live Server 打开 `index.html`，或直接在浏览器中打开文件。

Open `index.html` with VS Code Live Server, or open the file directly in your browser.

---

## 日报格式 / Daily Log Format

提交后日报会以以下格式同步到 ClickUp 的任务评论中：

Submitted logs are synced to ClickUp task comments in the following format:

```
📅 2026/4/20 | liucai
━━━━━━━━━━━━━━━━
昨日进展：修复了路由分类逻辑
卡点：—
今日计划：准备测试用例
明日计划：与前端对接接口
```

---

## 注意事项 / Notes

- `.env` 文件已加入 `.gitignore`，请勿将 Token 提交到代码仓库
- ClickUp API Token 如有泄露请立即在 ClickUp 后台重新生成
- 本工具仅供团队内部使用，请勿对外分享访问地址

---

- The `.env` file is listed in `.gitignore`. Never commit your Token to the repository.
- If your ClickUp API Token is exposed, regenerate it immediately in ClickUp settings.
- This tool is for internal team use only. Do not share access externally.

---

## 数据来源 / Data Source

数据来自 ClickUp · Bug list · TripGuru-Dev

Data sourced from ClickUp · Bug list · TripGuru-Dev
