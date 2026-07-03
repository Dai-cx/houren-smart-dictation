# 语文智能听写 (Smart Dictation)

面向小学生的中文听写练习全栈 Web 应用，支持语音播报、拍照批改、AI 错因分析。

## 功能

- **词表输入**：粘贴词语，支持多种分隔符自动解析（空格、逗号、顿号、换行等）
- **语音播报**：阿里云 TTS 语音合成，可调节语速和间隔，模拟课堂听写节奏
- **拍照批改**：上传学生听写纸照片，OCR 识别手写内容
- **智能比对**：编辑距离（Levenshtein）对齐算法，正确区分错字、漏字、多字
- **AI 错因分析**：通义千问视觉模型直接查看手写字迹，精准判断错误类型（笔画错误 / 偏旁遗漏 / 形近混淆 / OCR 误识等），生成逐字分析与纠正建议
- **错题本**：自动记录每次批改结果

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS v4 + React Router v7 + Vite 6 |
| 后端 | Express + tRPC v11 + Drizzle ORM |
| 数据库 | SQLite (better-sqlite3) |
| AI | 通义千问 qwen-vl-plus（多模态视觉模型） |
| 云服务 | 阿里云 TTS + OCR + OSS |

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
首页 → 输入词表 → 听写播报 → 拍照上传 → 批改结果（+ AI 分析）→ 错题本
```

1. **输入词表**：粘贴本次听写的词语，如"蝴蝶 蜻蜓 蚂蚁"
2. **听写播报**：系统依次朗读每个词语，学生书写
3. **拍照上传**：拍摄或上传学生写完的听写纸
4. **批改结果**：系统对比识别结果与正确词表，自动触发 AI 分析错因
5. **错题本**：查看历次批改记录与错误统计

## 项目结构

```
packages/
├── shared/src/types/     # 共享类型定义（DTO、输入输出接口）
├── server/src/
│   ├── routers/          # tRPC 路由（student, dictation, result, tts, ocr, correction）
│   ├── lib/              # 阿里云服务封装（TTS, OCR, OSS, 通义千问）
│   ├── db/schema/        # Drizzle ORM 表定义
│   └── trpc/             # tRPC 初始化 + 上下文
└── web/src/
    ├── pages/            # 页面组件
    ├── components/       # 通用组件
    ├── layouts/          # 布局组件
    └── lib/              # 前端工具（tRPC 客户端、编辑距离算法）
```

## 许可证

MIT
