# 基于Node镜像来构建我们的前端环境
FROM node:lts-alpine
 
# 设置工作目录为/app
WORKDIR /app
 
# 复制`package.json`和`package-lock.json`（如果有）
COPY package*.json ./
 
# 安装项目依赖
RUN npm install 
RUN npm install -g http-server 
 
# 复制项目文件到工作目录
COPY . .
 
# 暴露80端口
EXPOSE 8080
 
# 启动Nginx，并且Nginx将持续运行
CMD ["http-server"]