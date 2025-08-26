# 使用官方 Go 镜像作为构建阶段
FROM golang:1.24.5-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装依赖工具，包括 C 编译器用于 CGO
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

# 复制 go mod 文件
COPY backend/go.mod backend/go.sum ./

# 下载依赖
RUN go mod download

# 复制后端源代码
COPY backend/ ./

# 构建应用
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main .

# 使用 alpine 作为最终运行镜像
FROM alpine:latest

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata sqlite

# 设置工作目录
WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/main .

# 复制前端文件
COPY frontend/ ./frontend/

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chmod 755 /app/data

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV PORT=8080
ENV GIN_MODE=release

# 运行应用
CMD ["./main"]
