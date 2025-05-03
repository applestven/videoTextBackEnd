# AD 视频处理服务端 🔥

[English Version 👉](./README.en.md)

---

## 📌 项目概览
高并发分布式视频处理服务端，集成：
- 🚢 阿里云OSS对象存储
- ⚡ Redis任务队列
- 🗄️ MySQL数据库管理
- 🔧 可扩展的FFmpeg处理策略

![系统架构图](https://via.placeholder.com/800x400.png/007BFF/FFFFFF?text=System+Architecture+Diagram)

## 🚀 核心功能
| 功能模块       | 描述                                                      |
| -------------- | --------------------------------------------------------- |
| 智能任务队列   | Redis Bull实现优先级处理，自动重试机制(3次)，失败任务隔离 |
| 云存储集成     | 支持OSS直传、分片上传、签名URL访问(有效期管理)            |
| 分布式处理     | 支持横向扩展Worker节点，负载均衡                          |
| ffmpeg策略引擎 | 内置10+视频处理策略(字幕/水印/画中画)等，支持自定义扩展   |

## 🛠️ 技术栈
​**后端核心**​  
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis)

​**云服务**​  
![Aliyun OSS](https://img.shields.io/badge/Aliyun_OSS-最新版-FF6A00?logo=alibabacloud)
![STS](https://img.shields.io/badge/STS_Token-支持-00C1DE)

​**运维工具**​  
![PM2](https://img.shields.io/badge/PM2-5.x-2B037A)

## 📂 项目结构
```bash
.
├── config/         # 环境配置
├── controllers/    # API控制器
├── models/         # 数据模型
├── queues/         # Redis任务队列配置
│   └── videoQueue.js # 视频处理队列
├── services/       # 云服务集成
│   ├── ossService.js # OSS操作模块
│   └── ffmpegService.js # 视频处理核心
└── utils/          # 工具库
    ├── compressFolder.js # ZIP压缩工具
    └── ffmpegStrategies/ # 视频处理策略库

```

## 📝⚡ 快速开始
1. 克隆仓库
```bash
git clone https://github.com/applestven/videoTextBackEnd.git
cd videoTextBackEnd
```
2. 初始化环境
```bash
.env  # 修改配置参数
npm install
npm run init-db       # 初始化数据库
```
3. env 配置说明
```ini
# 阿里云OSS配置
OSS_REGION=oss-cn-guangzhou
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret_key

# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# MySQL配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=video_processing
```
