const Queue = require('bull');
const path = require('path');

const { processVideoTask } = require('../services/ffmpegService');
// 创建队列
const videoQueue = new Queue('video-processing', {
    redis: { port: 6379, host: '127.0.0.1' },
    defaultJobOptions: {
        attempts: 3, // 失败重试 3 次
        backoff: {
            type: 'exponential',
            delay: 5000, // 初始重试间隔 5 秒
        },
        removeOnComplete: {
            age: 7 * 24 * 3600, // 成功后保留 7 天
        },
        removeOnFail: {
            age: 30 * 24 * 3600, // 失败后保留 30 天
        },
    },
});

// 处理逻辑
videoQueue.process(async (job) => {
    try {
        const { userId, taskId, videoUrls, textContent, strategyList } = job.data;
        console.log(`[videoQueue] 开始处理任务 ${taskId}, 用户 ${userId}`);
        console.log(`[videoQueue] 视频列表:`, videoUrls);
        await processVideoTask(taskId, videoUrls, textContent, strategyList);

        console.log(`[videoQueue] 任务 ${taskId} 完成 ✅`);
        return true;

    } catch (error) {
        console.error(`[videoQueue] 任务 ${job.id} 出错 ❌`, error);
        throw error; // 让 Bull 记录错误并触发重试
    }
});

// 监听事件
videoQueue.on('completed', (job, result) => {
    console.log(`[videoQueue] 任务 ${job.id} 处理完成！`);
});

videoQueue.on('failed', (job, err) => {
    console.error(`[videoQueue] 任务 ${job.id} 处理失败:`, err.message);
});

module.exports = videoQueue;
