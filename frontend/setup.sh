#!/bin/bash

echo "🚀 开始设置 Modern Pastebin 前端..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "📦 安装依赖包..."
npm install

echo "🔨 构建项目..."
npm run build

echo "📋 备份原有文件..."
mv index.html index.html.backup 2>/dev/null || true
mv script.js script.js.backup 2>/dev/null || true
mv style.css style.css.backup 2>/dev/null || true
mv settings.html settings.html.backup 2>/dev/null || true
mv settings.js settings.js.backup 2>/dev/null || true
mv settings.css settings.css.backup 2>/dev/null || true

echo "🔄 替换为新的构建文件..."
mv new-index.html index.html

echo "✅ 前端重构完成！"
echo ""
echo "📝 说明："
echo "1. 原有的 HTML/CSS/JS 文件已备份（.backup 后缀）"
echo "2. 新的 React 应用已构建完成"
echo "3. 使用了 TailwindCSS 和 Framer Motion 动画"
echo "4. view 页面保持不变"
echo ""
echo "🚀 现在可以启动开发服务器："
echo "   npm run dev"
