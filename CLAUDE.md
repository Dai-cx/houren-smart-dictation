# CLAUDE.md

此文件为 Claude Code（claude.ai/code）在此仓库中工作时提供指引。

## 项目概述

Smart Dictation（语文智能听写）— 面向小学生的中文听写练习全栈 Web 应用，Q 版儿童游戏风格。

- **Monorepo**: npm workspaces，`packages` 目录下分 `shared` / `server` / `web` 三个包
- **共享类型**: `packages/shared` 导出 DTO 和输入类型，前后端通过 workspace 直接引用 TS 源文件
- **后端**: Express + tRPC v11 + Drizzle ORM + SQLite (better-sqlite3)
- **前端**: React 19 + TypeScript + Tailwind CSS v4 + React Router v7，Vite 6 构建
- **视觉风格**: 春天主题 — 全屏背景图 + 毛玻璃圆角卡片 + 马卡龙色系 + 吉祥物装饰

## 常用命令

```bash
npm install              # 安装所有 workspace 依赖
npm run dev              # 同时启动前后端（concurrently）
npm run dev:server       # 仅启动后端（tsx watch，端口 3000）
npm run dev:web          # 仅启动前端（Vite，端口 5173）
npm run typecheck        # 全量类型检查（shared + server + web）
npm run db:push          # 推送 schema 到 SQLite（建表 / 改表）
npm run db:generate      # 生成 Drizzle 迁移文件
npm run db:seed          # 填充种子数据（3 名学生 + 2 篇听写练习）
npm run build            # 生产构建
```

## 架构

### 请求链路

```
浏览器 → Vite (5173) → /trpc 代理 → Express (3000) → tRPC 中间件
  → context（注入 db 实例）→ router → Drizzle 查询 → SQLite
```

tRPC 过程：`query`（GET，幂等读取）/ `mutation`（POST，写入）。v11 中 query 默认只接受 GET。

开发时 Vite 将 `/trpc` 代理到后端，trpc client 使用相对路径 `"/trpc"`。

### 页面路由

```
/            → HomePage          词表输入
/dictation   → DictationPage     语音播报
/upload      → PhotoUploadPage   拍照上传
/correction  → CorrectionPage    批改结果
/mistakes    → MistakeBookPage   错题本
```

所有页面共享 `RootLayout`（胶囊导航栏 + `<Outlet />`），导航使用 `NavLink` 自动高亮。

### 静态资源

图片素材统一放在 `packages/web/public/images/`：

| 文件 | 用途 |
|---|---|
| `bg-spring.jpg` | 全屏背景（body 固定背景，cover） |
| `mascot.png` | 吉祥物（导航栏头像、页面装饰） |
| `card-bg.png` | 内容卡片底板（所有页面卡片背景） |

> 注意：Vite 的 public 目录是 `packages/web/public/`，不是项目根目录的 `public/`。

### 目录约定

```
packages/shared/src/types/   # DTO 接口定义，前后端共享
packages/server/src/
  index.ts                   # Express 入口，挂载 tRPC 中间件
  db/
    index.ts                 # better-sqlite3 连接 + drizzle 实例
    schema/                  # Drizzle 表定义（每文件一张表）
      index.ts               # barrel export + InferSelect / Insert 类型导出
  routers/
    index.ts                 # appRouter 根路由，合并所有子路由
  trpc/
    trpc.ts                  # initTRPC → 导出 router / publicProcedure / middleware
    context.ts               # 请求上下文工厂（向每个过程注入 db）
packages/web/src/
  main.tsx                   # React 入口（QueryClient + tRPC Provider + RouterProvider）
  App.tsx                    # createBrowserRouter 路由配置
  index.css                  # Tailwind v4 + 全屏背景图 + 主题色变量
  lib/
    utils.ts                 # cn() 工具（clsx + tailwind-merge）
    trpc.ts                  # tRPC React 客户端（createTRPCReact<AppRouter>）
  layouts/
    root-layout.tsx          # 胶囊导航栏（吉祥物 + 标题 + 圆角按钮组 + Outlet）
  pages/                     # 各页面（毛玻璃卡片 + card-bg.png 底板 + 渐变标题）
  styles/
    spring.css               # CSS 动画（已废弃，不再引用）
```

### 视觉设计约定

- **圆角**：大圆角为主（rounded-2xl / rounded-3xl / rounded-full），禁用直角
- **阴影**：`shadow-xl` + 彩色 shadow（如 `shadow-pink-200/50`）
- **导航**：`rounded-full` 胶囊形，毛玻璃 `bg-white/50 backdrop-blur-xl`，激活态粉→玫红渐变
- **卡片**：`rounded-[2.5rem]`，`card-bg.png` 背景 + `bg-white/30` 半透明遮罩保证文字可读
- **按钮**：`rounded-full`，渐变背景 + 彩色阴影，hover 时 `scale-105`
- **色板**：粉（primary）、天蓝、翠绿、琥珀、紫，马卡龙低饱和度
- **禁止**：不使用 emoji 作为图标，用图片素材或 SVG

### 数据库

- SQLite 文件：`packages/server/data/smart-dictation.db`
- 启用 WAL 模式 + 外键约束
- 三张核心表：`students`、`dictation_exercises`、`dictation_results`
- `drizzle-kit push` 同步 schema；`drizzle-kit generate` 生成迁移
- 后续切换 MySQL：改连接驱动 + schema 方言，router 代码不变

### 添加新功能的标准流程

1. 在 `shared/src/types/` 定义 DTO 接口
2. 在 `server/src/db/schema/` 添加 Drizzle 表定义，更新 barrel
3. 在 `server/src/routers/` 添加 tRPC 子路由，合并到 `appRouter`
4. 在 `shared/src/index.ts` 导出新类型
5. 在 `web/src/pages/` 创建页面（遵循视觉设计约定），在 `App.tsx` 添加路由
6. 前端通过 `trpc.<router>.<procedure>.useQuery()` 或 `.useMutation()` 调用后端

## 技能路由

当用户的请求匹配可用技能时，通过 Skill 工具调用对应技能。

关键路由规则：
- 产品想法 / 头脑风暴 → `/office-hours`
- 策略 / 范围规划 → `/plan-ceo-review`
- 架构设计评审 → `/plan-eng-review`
- 设计系统 / 方案评审 → `/design-consultation` 或 `/plan-design-review`
- 完整评审流程 → `/autoplan`
- Bug / 报错排查 → `/investigate`
- QA / 测试网站行为 → `/qa` 或 `/qa-only`
- 代码审查 / diff 检查 → `/review`
- 视觉打磨 → `/design-review`
- 发布 / 部署 / 提 PR → `/ship` 或 `/land-and-deploy`
- 保存进度 → `/context-save`
- 恢复上下文 → `/context-restore`
- 编写 backlog 规格说明 → `/spec`
