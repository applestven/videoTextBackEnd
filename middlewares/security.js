// 请求频率限制
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 每个IP限制100次请求
});

// 任务ID验证中间件
const validateTaskId = (req, res, next) => {
    const { taskId } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID format' });
    }
    next();
};

module.exports = { limiter, validateTaskId };