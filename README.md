# LaoWang Sub-converter v1.1

<div align="center">

![Logo](https://img.shields.io/badge/LaoWang-Sub--converter-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEzIDJMMyAxNGgxMGwtMSAxMCAxMC0xMkgxMnoiLz48L3N2Zz4=)

**专业的代理订阅转换服务**

[![GitHub license](https://img.shields.io/github/license/laowang-sub-converter/laowang-sub-converter)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Ready-orange?logo=cloudflare)](https://cloudflare.com)

[English](./README_EN.md) | 简体中文

</div>

---

## ✨ v1.1 更新亮点

- ⚡️ **全面 VLESS 支持** - 所有客户端（Clash, Surge, QX, Loon, SingBox 等）现已完美支持 VLESS 协议（包含 Reality/Flow/gRPC 支持）。
- 🛠 **核心解析重构** - 统一的解析和转换引擎，大幅提升 SS/Trojan 等协议的兼容性与稳定性。
- 🔮 **Clash 增强** - `convertToClash` 逻辑升级，生成的配置更规范，特性支持更全。
- 📦 **ESM 架构** - 服务端代码全面迁移至 ES Modules，提升性能与现代化开发体验。

## 🚀 功能特性

- 🔄 **多协议支持** - SS、SSR、VMess、VLESS、Trojan、Hysteria、TUIC
- 📱 **多客户端格式** - Clash、Clash Meta、Surge、Quantumult X、Shadowrocket、Loon、V2RayN、SingBox 等
- 🔗 **短链接服务** - 生成短链接便于分享，支持访问统计
- 🌍 **多语言界面** - 中文、英文、俄语、波斯语
- 🐳 **多种部署方式** - Vercel、Netlify、Cloudflare Workers、VPS Docker，一键部署完整功能
- ⚙️ **高级配置** - 节点过滤、重命名、排序、Emoji 添加
- 🎨 **多主题切换** - 8 种精美主题随心切换

---

## 🌐 在线演示

<p>
  <a href="https://laowang-sub-conv.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🔗_点击体验_Demo-laowang--sub--conv.vercel.app-38b2ac?style=for-the-badge" alt="Demo">
  </a>
</p>

<table>
  <tr>
    <td align="center">
      <img src="docs/images/preview_home.png" width="400" alt="首页"><br>
      <b>首页</b>
    </td>
    <td align="center">
      <img src="docs/images/preview_converter.png" width="400" alt="转换器"><br>
      <b>订阅转换</b>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="docs/images/preview_theme.png" width="600" alt="主题切换"><br>
      <b>多主题支持（星空紫主题示例）</b>
    </td>
  </tr>
</table>

---

## ☁️ 一键部署

> ✅ 所有部署方式都支持**完整的订阅转换功能**（含 VLESS）。

| 平台 | 部署按钮 | 说明 |
|------|----------|------|
| **Vercel** | [![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tony-wang1990/laowang-sub-converter) | 推荐，速度快 |
| **Netlify** | [![Deploy](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tony-wang1990/laowang-sub-converter) | 免费额度高 |
| **Cloudflare Workers** | 见下方教程 | 全球边缘，超快 |

### Cloudflare Workers 部署

1. **Fork 本仓库**到您的 GitHub 账号
2. **安装 Wrangler CLI**：
```bash
npm install -g wrangler
```
3. **登录 Cloudflare**：
```bash
wrangler login
```
4. **克隆并部署**：
```bash
git clone https://github.com/你的用户名/laowang-sub-converter.git
cd laowang-sub-converter
wrangler deploy
```
5. 部署成功后，访问 `https://laowang-sub-converter.你的账号.workers.dev` 即可使用！

---

## 🚀 VPS Docker 部署

如果您有自己的服务器，推荐使用 Docker Compose 部署：

```bash
# 1. 克隆仓库
git clone https://github.com/tony-wang1990/laowang-sub-converter.git
cd laowang-sub-converter

# 2. 启动服务（前端 + 后端）
docker-compose up -d

# 3. 查看运行状态
docker ps
```

访问 `http://服务器IP` 即可使用！

> 💡 **多架构支持**：Docker 镜像同时支持 **AMD64** (Intel/AMD 服务器) 和 **ARM64** (树莓派/Oracle ARM 等)。

### 更新到最新版本 (v1.1)

```bash
cd laowang-sub-converter
git pull
# 重新构建以应用最新的服务端更新
docker-compose up -d --build
```

---

## 📖 API 文档

### 订阅转换

```
GET /api/convert
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `target` | string | ✅ | 目标客户端 (clash/surge/quantumultx/shadowrocket/loon/v2rayn/singbox) |
| `url` | string | ✅ | 订阅链接 (需 URL 编码) |
| `emoji` | string | | 添加 Emoji (1/0，默认 1) |
| `udp` | string | | 启用 UDP (1/0，默认 1) |
| `scert` | string | | 跳过证书验证 (1/0，默认 0) |
| `sort` | string | | 按名称排序 (1/0，默认 0) |
| `include` | string | | 节点过滤关键词 (用 \| 分隔) |
| `exclude` | string | | 排除节点关键词 (用 \| 分隔) |
| `rename` | string | | 重命名规则 (旧名称->新名称) |

**示例：**
```
/api/convert?target=clash&url=https%3A%2F%2Fexample.com%2Fsub&emoji=1&udp=1
```

### 短链接

**创建短链接：**
```
POST /api/shortlink
Content-Type: application/json

{
  "url": "https://example.com/subscription"
}
```

**响应：**
```json
{
  "shortUrl": "https://your-domain.com/s/abc123",
  "id": "abc123",
  "originalUrl": "https://example.com/subscription",
  "clicks": 0
}
```

---

## 🔧 项目结构 (v1.1)

```
laowang-sub-converter/
├── src/                    # 前端源码 (Vue 3 + Vite)
├── server/                 # 后端 API (Node.js ESM)
│   ├── routes/            # API 路由
│   ├── utils/             # 核心解析与转换逻辑 (parsers.js, converters.js)
│   └── index.js           # 服务入口
├── api/                    # Vercel Serverless Functions
├── docker/                 # Docker 配置
└── ...配置文件
```

---

## 🌍 多语言支持

- 🇨🇳 简体中文
- 🇺🇸 English
- 🇷🇺 Русский
- 🇮🇷 فارسی

---

## 📝 开源协议

[MIT License](LICENSE) © 2024 LaoWang Sub-converter

<div align="center">

![Logo](https://img.shields.io/badge/LaoWang-Sub--converter-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEzIDJMMyAxNGgxMGwtMSAxMCAxMC0xMkgxMnoiLz48L3N2Zz4=)

**专业的代理订阅转换服务**

[![GitHub license](https://img.shields.io/github/license/laowang-sub-converter/laowang-sub-converter)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Ready-orange?logo=cloudflare)](https://cloudflare.com)

[English](./README_EN.md) | 简体中文

</div>

---

## ✨ 功能特性

- 🔄 **多协议支持** - SS、SSR、VMess、VLESS、Trojan、Hysteria、TUIC
- 📱 **多客户端格式** - Clash、Surge、Quantumult X、Shadowrocket、Loon、V2RayN 等 10+ 客户端
- 🔗 **短链接服务** - 生成短链接便于分享，支持访问统计
- 🌍 **多语言界面** - 中文、英文、俄语、波斯语
- 🐳 **多种部署方式** - Vercel、Netlify、Cloudflare Workers、VPS Docker，一键部署完整功能
- ⚙️ **高级配置** - 节点过滤、重命名、排序、Emoji 添加
- 🎨 **多主题切换** - 8 种精美主题随心切换

---

## 🌐 在线演示

<p>
  <a href="https://laowang-sub-conv.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🔗_点击体验_Demo-laowang--sub--conv.vercel.app-38b2ac?style=for-the-badge" alt="Demo">
  </a>
</p>

<table>
  <tr>
    <td align="center">
      <img src="docs/images/preview_home.png" width="400" alt="首页"><br>
      <b>首页</b>
    </td>
    <td align="center">
      <img src="docs/images/preview_converter.png" width="400" alt="转换器"><br>
      <b>订阅转换</b>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="docs/images/preview_theme.png" width="600" alt="主题切换"><br>
      <b>多主题支持（星空紫主题示例）</b>
    </td>
  </tr>
</table>

---

## ☁️ 一键部署

> ✅ 所有部署方式都支持**完整的订阅转换功能**，使用 Serverless Functions 实现。

| 平台 | 部署按钮 | 说明 |
|------|----------|------|
| **Vercel** | [![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tony-wang1990/laowang-sub-converter) | 推荐，速度快 |
| **Netlify** | [![Deploy](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/tony-wang1990/laowang-sub-converter) | 免费额度高 |
| **Cloudflare Workers** | 见下方教程 | 全球边缘，超快 |

### Cloudflare Workers 部署

1. **Fork 本仓库**到您的 GitHub 账号

2. **安装 Wrangler CLI**：
```bash
npm install -g wrangler
```

3. **登录 Cloudflare**：
```bash
wrangler login
```

4. **克隆并部署**：
```bash
git clone https://github.com/你的用户名/laowang-sub-converter.git
cd laowang-sub-converter
wrangler deploy
```

5. 部署成功后，访问 `https://laowang-sub-converter.你的账号.workers.dev` 即可使用！

---

## 🚀 VPS Docker 部署

如果您有自己的服务器，推荐使用 Docker Compose 部署：

```bash
# 1. 克隆仓库
git clone https://github.com/tony-wang1990/laowang-sub-converter.git
cd laowang-sub-converter

# 2. 启动服务（前端 + 后端）
docker-compose up -d

# 3. 查看运行状态
docker ps
```

访问 `http://服务器IP` 即可使用！

> 💡 **多架构支持**：Docker 镜像同时支持 **AMD64** (Intel/AMD 服务器) 和 **ARM64** (树莓派/Oracle ARM 等)。

### 更新到最新版本

```bash
cd laowang-sub-converter
git pull
docker-compose up -d --build
```

---

## 📖 API 文档

### 订阅转换

```
GET /api/convert
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `target` | string | ✅ | 目标客户端 (clash/surge/quantumultx/shadowrocket/loon/v2rayn/singbox) |
| `url` | string | ✅ | 订阅链接 (需 URL 编码) |
| `emoji` | string | | 添加 Emoji (1/0，默认 1) |
| `udp` | string | | 启用 UDP (1/0，默认 1) |
| `scert` | string | | 跳过证书验证 (1/0，默认 0) |
| `sort` | string | | 按名称排序 (1/0，默认 0) |
| `include` | string | | 节点过滤关键词 (用 \| 分隔) |
| `exclude` | string | | 排除节点关键词 (用 \| 分隔) |
| `rename` | string | | 重命名规则 (旧名称->新名称) |

**示例：**
```
/api/convert?target=clash&url=https%3A%2F%2Fexample.com%2Fsub&emoji=1&udp=1
```

### 短链接

**创建短链接：**
```
POST /api/shortlink
Content-Type: application/json

{
  "url": "https://example.com/subscription"
}
```

**响应：**
```json
{
  "shortUrl": "https://your-domain.com/s/abc123",
  "id": "abc123",
  "originalUrl": "https://example.com/subscription",
  "clicks": 0
}
```

---

## 📱 支持的客户端

| 客户端 | 平台 | 格式 |
|--------|------|------|
| Clash | 全平台 | YAML |
| Clash Meta | 全平台 | YAML |
| Surge | iOS/macOS | 配置文件 |
| Quantumult X | iOS | 配置片段 |
| Shadowrocket | iOS | Base64 |
| Loon | iOS | 配置文件 |
| V2RayN | Windows | Base64/JSON |
| V2RayNG | Android | Base64 |
| Surfboard | Android | 配置文件 |
| Stash | iOS/macOS | YAML |
| sing-box | 全平台 | JSON |

---

## 🔧 项目结构

```
laowang-sub-converter/
├── src/                    # 前端源码
│   ├── assets/            # 样式和资源
│   ├── components/        # Vue 组件
│   ├── views/             # 页面视图
│   ├── i18n/              # 多语言文件
│   └── router/            # 路由配置
├── server/                 # 后端 API
│   ├── routes/            # API 路由
│   └── index.js           # 服务入口
├── docker/                 # Docker 配置
├── .github/workflows/      # GitHub Actions
├── Dockerfile             # Docker 镜像
├── docker-compose.yml     # Docker Compose
├── vercel.json            # Vercel 配置
├── netlify.toml           # Netlify 配置
└── wrangler.toml          # Cloudflare 配置
```

---

## 🌍 多语言支持

- 🇨🇳 简体中文
- 🇺🇸 English
- 🇷🇺 Русский
- 🇮🇷 فارسی

---

## 📝 开源协议

[MIT License](LICENSE) © 2024 LaoWang Sub-converter

---

## ⚠️ 免责声明

本项目仅供学习交流使用，请遵守当地法律法规。使用本项目导致的任何问题，开发者不承担任何责任。

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

</div>
