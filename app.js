require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const ossRoutes = require('./routes/ossRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const { CustomError } = require('./utils/errors');

// 新增中间件引入
const responseMiddleware = require('./middlewares/response');
const { limiter, validateTaskId } = require('./middlewares/security');

const app = express();

// ================ 中间件加载顺序 ================
app.use(bodyParser.json());
app.use(cors());
app.use(responseMiddleware);  // 响应格式化中间件
app.use(limiter);             // 限流中间件



// 性能监控
const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    promClient: { collectDefaultMetrics: { timeout: 5000 } }
});
app.use(metricsMiddleware);

// 路由级中间件
// app.use('/api/tasks/:taskId', validateTaskId);

// 路由挂载
app.use('/api/oss', ossRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/monitor', monitorRoutes);

// ================ 全局错误处理 ================
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]', err.stack || err);

    // 处理 JSON 解析错误
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            code: 400,
            data: null,
            msg: '无效的 JSON 格式'
        });
    }

    // 处理自定义错误
    if (err instanceof CustomError) {
        return res.status(err.statusCode).json({
            code: err.code,
            data: null,
            msg: err.message
        });
    }

    // 其他未知错误
    res.status(500).json({
        code: 500,
        data: null,
        msg: process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : err.message
    });
});

// ================ 服务启动 ================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});