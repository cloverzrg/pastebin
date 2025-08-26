# Pastebin 项目

一个现代化的代码分享平台，支持用户认证和代码片段管理。

## 项目概述

这是一个基于 Go + SQLite 后端和原生 HTML/CSS/JavaScript 前端的代码分享应用。用户可以登录后创建代码片段，并通过短链接分享给其他人。

## 技术栈

- **后端**: Go 1.24.5 + Gin 框架 + SQLite 数据库
- **前端**: 原生 HTML5 + CSS3 + JavaScript (ES6+)
- **认证**: JWT Token
- **数据库**: SQLite

## 目录结构

```
pastebin/
├── backend/                 # 后端 Go 代码
│   ├── controllers/        # 控制器层
│   │   ├── auth_controller.go    # 用户认证控制器
│   │   └── paste_controller.go   # 代码片段控制器
│   ├── database/           # 数据库层
│   │   └── db.go          # 数据库连接和操作
│   ├── middleware/         # 中间件
│   │   └── auth.go        # JWT 认证中间件
│   ├── models/            # 数据模型
│   │   ├── paste.go       # 代码片段模型
│   │   └── user.go        # 用户模型
│   ├── routes/            # 路由配置
│   │   └── routes.go      # 应用路由设置
│   ├── go.mod             # Go 模块依赖
│   ├── go.sum             # Go 依赖校验
│   ├── main.go            # 应用入口点
│   └── pastebin.db        # SQLite 数据库文件
├── frontend/               # 前端代码
│   ├── index.html         # 主页面
│   ├── script.js          # 前端逻辑
│   └── style.css          # 样式文件
└── README.md              # 项目说明文档
```

## 主要功能

### 后端功能
- 用户认证 (登录/登出)
- 代码片段创建和存储
- 代码片段查询和展示
- JWT Token 验证
- SQLite 数据持久化

### 前端功能
- 用户登录界面
- 代码片段创建表单
- 代码片段展示页面
- 响应式设计
- 代码高亮和行号显示
- 复制链接和内容功能
- 字体大小调节和全屏显示

## API 接口

- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/auth/check` - 检查认证状态
- `POST /api/paste` - 创建代码片段 (需要认证)
- `GET /api/paste/:id` - 获取指定代码片段
- `GET /api/pastes` - 获取所有代码片段
- `GET /:id` - 查看代码片段页面

## 运行方式

### 后端启动
```bash
cd backend
go run main.go
```

### 前端访问
后端启动后，访问 `http://localhost:8080` 即可使用前端界面。

## 数据库结构

- **pastes 表**: 存储代码片段信息
  - id: 主键
  - title: 标题 (可选)
  - content: 代码内容
  - created_at: 创建时间

## 特性

- 简洁现代的 UI 设计
- 响应式布局，支持移动端
- 安全的用户认证系统
- 快速的代码分享功能
- 支持代码行号显示