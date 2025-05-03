// utils/logger.js
const winston = require('winston');
const path = require('path');

// 创建日志格式
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// 创建日志实例
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 控制台输出（开发环境）
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // 文件输出（生产环境）
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/app.log'),
            maxsize: 1024 * 1024 * 10, // 10MB
            maxFiles: 5
        })
    ]
});

// 增强的请求日志中间件
exports.requestLogger = (req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        headers: req.headers
    });
    next();
};

module.exports = logger;