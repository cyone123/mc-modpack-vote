# ⛏️ Minecraft 群服周目换整合包投票系统 (Next.js 全栈版)

专为 Minecraft 玩家交流群定制的高颜值、像素风格化周目换包投票网站。已重构为 **Next.js 15 全栈项目**，前端界面与全套后端 API 一体化整合，完美支持 **Vercel 一键完整托管部署**，也可在本地或云服务器独立运行。

---

## ✨ 核心特色

1. **沉浸式 Minecraft 风格 UI**
   - 黑曜石与深板岩质感底色、红石/钻石/绿宝石色系高光、3D像素浮雕按钮。
   - 整合包投票热度实时呈现为 **Minecraft 经典经验条 (XP Bar)** 动态进度。
   - 支持**经典 MC 音效（可随时一键静音）**：木质按钮点击声、经验升级叮叮声、自荐号角声（Web Audio API 原生合成，零外链、零流量消耗）。

2. **丰富的预设整合包矩阵**
   - 涵盖科技自动化（机械动力：星辰大海、星空列车）、全能全家桶（ATM9）、硬核工业修仙（GTNH 格雷科技新地平线）、休闲冒险（宝可梦世代重铸）、RPG地牢刷宝（穹顶之战3）、末日极限求生（寄生虫）以及轻量原版增强生电包等。
   - 卡片直观展示 MC 游戏版本（如 1.20.1 / 1.7.10）、模组加载器（Forge / Fabric / NeoForge）、推荐运行内存（如 6G - 8G）、核心玩法特色及发布页直达链接。

3. **群友自由自荐与提案**
   - 任何群友均可点击 **“提议我想玩的整合包”** 提交自己的心仪模组包。
   - 包含名称、适用版本、加载器、内存要求、标签与推荐理由。
   - 提交成功后立刻加入全服候选池，自动为提案者投出首票并带有专属的 **“群友推荐”** 徽章。

4. **玩家身份与正版皮肤联动**
   - 玩家可设置自己的游戏 ID 或群昵称；
   - 输入正版 Minecraft ID 自动拉取其对应正版皮肤的像素头像；
   - 卡片上可直接查看 “X 位支持者” 展开弹窗，直观看到具体哪些群友投了这票。

5. **全栈架构与持久化存盘机制**
   - **本地与独立服务器运行**：直接读写 `data/votes_db.json`，原子性写入，进程重启数据不丢。
   - **Vercel Serverless 运行**：
     - 开箱即用：自动适配只读环境，在 `/tmp` 中正常处理读写；
     - 云端持久化：存储层无缝内置适配 [Upstash Redis](https://upstash.com) / Vercel KV。只需在 Vercel 环境变量中添加免费的 `KV_REST_API_URL` 与 `KV_REST_API_TOKEN`（或 `UPSTASH_REDIS_REST_URL` 与 `UPSTASH_REDIS_REST_TOKEN`），即可实现跨实例、永久云端持久化存储！
   - 同一玩家对同一个整合包不可重复刷票，再次点击可自由撤回投票。

6. **服主与管理员控制台**
   - 内置轻量管理员密码解锁（默认密码：`mcadmin888`，支持环境变量 `ADMIN_PASSWORD` 配置）。
   - 支持一键**置顶/取消置顶**特定整合包。
   - 支持**删除恶搞/违规提交**的整合包。
   - 支持**一键重置清空全服选票**（开启全新一轮投票）。

---

## 🚀 运行与部署方式

### 1. Vercel 一键完整托管（推荐）

1. 将当前项目推送至你的 GitHub / GitLab 仓库；
2. 登录 [Vercel](https://vercel.com)，点击 **“Add New Project”** 并导入该仓库；
3. **无需任何额外构建配置**，Vercel 会自动识别 Next.js 项目并完成构建与全球边缘部署；
4. （可选）如果需要在 Vercel 上实现长期跨实例持久化，可以在项目 Settings -> Environment Variables 中添加：
   - `ADMIN_PASSWORD`: 你的自定义管理员密码（可选，默认 `mcadmin888`）
   - `KV_REST_API_URL` & `KV_REST_API_TOKEN`: 你的 Upstash Redis 或 Vercel KV 免费凭证（可选）

---

### 2. 本地开发与测试

```bash
# 1. 安装依赖
npm install

# 2. 启动 Next.js 本地开发服务
npm run dev
```

在浏览器中打开：
```
http://localhost:3000
```

---

### 3. 本地或云服务器生产运行

```bash
# 1. 构建生产包
npm run build

# 2. 启动生产服务（默认端口 3000）
npm start

# 或指定端口启动，例如 3001 端口：
npx next start -p 3001
```

---

## ⚙️ 管理员说明

- **默认管理密码**：`mcadmin888`
- **自定义管理密码**：
  在启动前设置环境变量 `ADMIN_PASSWORD`，例如：
  - Windows PowerShell: `$env:ADMIN_PASSWORD="my_strong_password"; npm run dev`
  - Linux/Mac: `ADMIN_PASSWORD=my_strong_password npm run dev`
  - Vercel 部署: 直接在 Vercel 仪表盘中的 **Environment Variables** 添加 `ADMIN_PASSWORD` 即可。
