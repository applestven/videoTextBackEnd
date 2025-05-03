const { Task, GeneratedVideo } = require('../models');
const videoQueue = require('../queues/videoQueue');
const { isValidUrl } = require('../utils/validators'); // 

exports.createTask = async (req, res) => {
    try {
        console.log("创建任务")
        let { videoUrl, userId, textContent, strategyList } = req.body;
        console.log("@@videoUrl", req.body);
        console.log("@@userId", userId);
        console.log("@@textContent", textContent);
        console.log("@@strategyList", strategyList);

        // ========== 参数处理 ==========
        // 统一转为数组格式
        videoUrl = Array.isArray(videoUrl) ? videoUrl : [videoUrl];

        // 空数组校验
        if (videoUrl.length === 0) {
            return res.error('至少需要提供一个视频URL', 1001);
        }

        // URL格式校验
        if (!videoUrl.every(url => isValidUrl(url))) {
            console.log("isValidUrl(url)", isValidUrl(url))
            return res.error('存在无效的视频URL格式', 1002);
        }

        // ========== 创建任务 ==========
        const taskId = await Task.create({ originalVideo: videoUrl, userId });

        // ========== 队列处理 ==========
        await videoQueue.add({
            userId,
            taskId,
            videoUrls: videoUrl,
            textContent,
            strategyList
        }, {
            attempts: 3,
            backoff: 5000, // 重试3次，每次间隔5秒
            backoff: { // 更智能的重试策略
                type: 'exponential',
                delay: 5000
            }
        });

        res.success({
            taskId,
            userId,
            videoCount: videoUrl.length
        });

    } catch (error) {
        console.error(`[任务创建失败] ${error.message}`);
        res.error(error.message, error.code || 0);
    }
};

exports.getTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        // console.log("@@task", task)
        if (!task) return res.status(404).send('Task not found');

        const videos = await GeneratedVideo.findByTaskId(task.task_id);
        res.success({
            status: task.status,
            processed_videos: task.processed_videos,
            error: task.error_message

        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDownloadUrls = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).send('Task not found');

        if (task.status !== 'success') {
            return res.status(400).json({
                error: 'Task not completed yet'
            });
        }

        const videos = await GeneratedVideo.findByTaskId(task.task_id);
        const oss = require('../services/ossService');

        const signedUrls = await Promise.all(
            videos.map(async v => ({
                url: await oss.generateDownloadUrl(v.video_url)
            }))
        );

        res.json({ videoUrls: signedUrls });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getUserTasks = async (req, res) => {
    try {
        // 从认证信息获取用户ID
        const { userId, page = 1, page_size: pageSize = 10 } = req.body;
        // 参数验证
        if (isNaN(page)) throw new Error('页码参数不合法');
        if (isNaN(pageSize)) throw new Error('分页大小不合法');

        // 查询数据
        const result = await Task.findAllByUser(userId, parseInt(page), parseInt(pageSize));

        res.success({
            tasks: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        res.error(error.message, 400);
    }
};