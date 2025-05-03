const express = require('express');
const router = express.Router();
const videoQueue = require('../queues/videoQueue');
const Task = require('../models/Task'); // 引入任务模型
// Route to get OSS credentials
router.get('/queue-stats', async (req, res) => {
    const counts = await videoQueue.getJobCounts();
    res.success({
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed
    });
});

// 健康检查端点
router.get('/health', (req, res) => {
    console.log("队列监控请求")
    res.success({
        status: 'OK',
        timestamp: Date.now(),
        uptime: process.uptime()
    });
});

//清空队列liet
router.delete('/queue', async (req, res) => {
    try {
        await videoQueue.empty();
        res.success('队列已清空');
    } catch (error) {
        console.error(`[清空队列失败] ${error.message}`);
        res.error(error.message, error.code || 0);
    }
});

//清空Tasks表
router.delete('/tasks', async (req, res) => {
    try {
        await Task.deleteMany({});
        res.success('Tasks表已清空');
    } catch (error) {
        console.error(`[清空Tasks表失败] ${error.message}`);
        res.error(error.message, error.code || 0);
    }
});
module.exports = router;