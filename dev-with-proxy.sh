#!/bin/bash

# 获取系统代理设置
HTTP_PROXY=$(scutil --proxy | awk '/HTTPProxy/ {print $2}')
HTTPS_PROXY=$(scutil --proxy | awk '/HTTPSProxy/ {print $2}')
HTTP_PORT=$(scutil --proxy | awk '/HTTPPort/ {print $2}')
HTTPS_PORT=$(scutil --proxy | awk '/HTTPSPort/ {print $2}')

# 设置代理环境变量
if [ ! -z "$HTTP_PROXY" ] && [ ! -z "$HTTP_PORT" ]; then
    export http_proxy="http://${HTTP_PROXY}:${HTTP_PORT}"
    export https_proxy="http://${HTTP_PROXY}:${HTTP_PORT}"
    echo "System proxy detected: http://${HTTP_PROXY}:${HTTP_PORT}"
elif [ ! -z "$HTTPS_PROXY" ] && [ ! -z "$HTTPS_PORT" ]; then
    export http_proxy="http://${HTTPS_PROXY}:${HTTPS_PORT}"
    export https_proxy="http://${HTTPS_PROXY}:${HTTPS_PORT}"
    echo "System proxy detected: http://${HTTPS_PROXY}:${HTTPS_PORT}"
else
    echo "No system proxy detected"
fi

# 启动开发服务器
npm run dev