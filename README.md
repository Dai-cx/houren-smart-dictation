# 语文智能听写 (Smart Dictation)

面向小学生的中文听写练习全栈 Web 应用，Q 版儿童游戏风格，支持语音播报、拍照批改、AI 智能错因分析。

## 功能

- **词表输入**：粘贴词语，自动解析（支持空格、逗号、换行等分隔符）
- **语音播报**：阿里云 TTS 语音合成，可调节语速（0.5x ~ 2.0x）和间隔（3s ~ 15s），模拟课堂听写节奏
- **拍照批改**：上传学生听写纸照片，OCR 识别手写内容
- **图像标注**：批改结果直接标注在原图上 — 全对显示绿色大勾，有错在错误字上画红圈
- **AI 错因分析**：通义千问 qwen-vl-plus 视觉模型直接查看手写字迹，判断对错并分析错因
- **智能比对**：编辑距离（Levenshtein）对齐算法 + OCR 字符位置映射，精确定位错字
- **错题本**：批改完成后自动收录错词（localStorage 持久化），支持 × 移除、多选再次听写

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS v4 + React Router v7 + Vite 6 |
| 后端 | Express + tRPC v11 + Drizzle ORM |
| 数据库 | SQLite (better-sqlite3) |
| AI | 通义千问 qwen-vl-plus（多模态视觉模型） |
| 图像处理 | Sharp（SVG 叠加标注） |
| 云服务 | 阿里云 TTS + OCR（含字符位置）+ OSS |

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example packages/server/.env
# 编辑 packages/server/.env，填入阿里云 AK/SK 和通义千问 API Key

# 初始化数据库
npm run db:push
npm run db:seed   # 可选：填充示例数据

# 启动开发服务器
npm run dev
```

前端：http://localhost:5173  
后端：http://localhost:3000

## 环境变量

| 变量 | 用途 |
|---|---|
| `ALIBABA_ACCESS_KEY_ID` | 阿里云 AccessKey（TTS + OCR + OSS 共用） |
| `ALIBABA_ACCESS_KEY_SECRET` | 阿里云 SecretKey |
| `ALIBABA_TTS_APP_KEY` | 智能语音交互（NLS）项目 AppKey |
| `ALIBABA_OSS_BUCKET` | OSS Bucket 名称（上海区域） |
| `ALIBABA_OCR_ENDPOINT` | OCR API 端点，默认 `ocr.cn-shanghai.aliyuncs.com` |
| `DASHSCOPE_API_KEY` | 通义千问 API Key（百炼平台） |
| `DATABASE_URL` | SQLite 数据库路径，默认 `file:./data/smart-dictation.db` |
| `PORT` | 服务端端口，默认 3000 |

## 使用流程

```
首页 → 输入词表 → 语音播报 → 拍照上传 → 批改结果（标注图片）→ 错题本 → 再次听写
```

1. **输入词表**：粘贴本次听写的词语，如"蝴蝶 蜻蜓 蚂蚁"
2. **语音播报**：系统依次朗读每个词语，学生书写（可调语速和间隔）
3. **拍照上传**：拍摄或上传学生写完的听写纸，自动压缩
4. **批改结果**：原图上标注 — 全对绿勾 / 错字红圈，错词自动收录到错题本
5. **错题本**：查看、移除错词，多选后进行针对性再次听写

## 项目结构

```
packages/
├── shared/src/
│   ├── index.ts              # barrel export
│   ├── diff.ts               # 编辑距离对齐算法
│   ├── constants.ts          # 年级常量
│   └── types/                # 共享类型定义（DTO、输入输出接口）
├── server/src/
│   ├── routers/              # tRPC 路由（student, dictation, result, tts, ocr, correction）
│   ├── lib/                  # 阿里云服务封装（TTS, OCR, OSS, 通义千问）+ 图像标注
│   ├── db/schema/            # Drizzle ORM 表定义
│   └── trpc/                 # tRPC 初始化 + 上下文
└── web/src/
    ├── pages/                # 页面组件（home, input, dictation, upload, correction, mistakes）
    ├── layouts/              # 布局组件（胶囊导航栏）
    └── lib/                  # 前端工具（tRPC 客户端、cn() 工具）
```

## 常用命令

```bash
npm run dev              # 同时启动前后端
npm run dev:server       # 仅启动后端（端口 3000）
npm run dev:web          # 仅启动前端（端口 5173）
npm run typecheck        # 全量类型检查
npm run db:push          # 推送 schema 到 SQLite
npm run db:generate      # 生成 Drizzle 迁移文件
npm run db:seed          # 填充种子数据
npm run build            # 生产构建
```

## 许可证

MIT
