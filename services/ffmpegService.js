const fs = require('fs').promises;
const path = require('path');
const oss = require('./ossService');
const Task = require('../models/Task');
const logger = require('../utils/logger');
const { runFFMPEGStrategy } = require('../utils/runFFMPEGStrategy');
const { downloadFile } = require("../services/ossService")
const { compressFolder } = require("../utils/compressFolder")
// ==================== 处理视频任务 ====================
const processVideoTask = async (taskId, videoUrl, textContent = "AD强模拟数据", strategyList = [1]) => {
    // 定义路径常量
    const TEMP_DIR = path.join(__dirname, '../temp');
    const TASK_DIR = path.join(TEMP_DIR, `${taskId}`);
    const OUTPUT_DIR = path.join(TASK_DIR, 'processed');
    try {
        //     // ==================== 初始化环境 ====================
        console.log("====================1.初始化环境 ====================")
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        //     // 使用oss将videoUrl 所有的视频下载下来 并收集本地路径集合
        let videoPaths = []

        await Promise.all(videoUrl.map(async (item, index) => {
            // 获取item 视频路径文件名
            const fileName = path.basename(item);
            try {
                // await downloadFile(item, path.join(TASK_DIR, fileName));
                let requestResult = await downloadFile(item, `./temp/${taskId}/${fileName}`);
                requestResult.res.status == 200 && videoPaths.push(`./temp/${taskId}/${fileName}`); // 收集本地路径
            } catch (error) {
                console.error(`下载源视频 ${fileName} 失败: ${error.message}`);
            }
        }))
        console.log("==================== 2.下载处理完成 ====================")
        // 根据前端请求参数执行策略 (先写死)
        const strategyOptions = [
            { id: 1, text: "模型1", strategy: "labelOverlay", args: { direction: "straight" } },
            { id: 2, text: "模型2", strategy: "labelOverlay", args: { direction: "right" } },
            { id: 3, text: "模型3", strategy: "labelOverlay", args: { direction: "left" } },
            { id: 4, text: "模型4", strategy: "labelOverlay", args: { direction: "bottomRight" } },
            { id: 5, text: "模型5", strategy: "labelOverlay", args: { direction: "topRight" } },
            { id: 6, text: "模型6", strategy: "labelOverlay", args: { direction: "bottomLeft" } },
        ]
        // 策略参数
        let strategyParams = strategyOptions.filter(item => strategyList.includes(item.id))
        try {
            // 本地视频执行以选的策略
            await Promise.all(videoPaths.map(async (item, index) => {
                // allDealVideo = allDealVideo.concat(item)
                const result = await processAllStrategies(strategyParams, item, index + 1, taskId, textContent)
            }))
            // 删除临时文件
            // await fs.rm(TASK_DIR, { recursive: true, force: true });
        } catch (error) {
            console.log("视频执行策略错误,中断任务")
            await Task.updateStatus(taskId, 'failed', error.message);
            logger.error(`Task ${taskId} failed,视频执行策略错误,中断任务`, error);
            return false;
        }
        console.log("==================== 3.ffmpeg处理视频完成 ====================")
        // 上传开始
        logger.info(`Starting upload for task ${taskId}`, {
            // fileCount: outputFiles.length,
            ossPath: `${taskId}/processed`
        });

        // ==================== 压缩文件夹 ====================
        console.log("==================== 4.压缩文件夹 ====================")
        await compressFolder(`./temp/${taskId}/processed`, `./temp/${taskId}/${taskId}.zip`)
        let outputFiles = [`./${taskId}/${taskId}.zip`]

        // ==================== 准备上传文件数据 ====================
        const filesToUpload = await Promise.all(
            outputFiles.map(async file => {
                const localPath = path.join(TEMP_DIR, file);
                return {
                    originalname: `./${taskId}.zip`,       // 原始文件名
                    buffer: await fs.readFile(localPath), // 文件内容
                    mimetype: 'application/zip',     // 文件类型
                    size: (await fs.stat(localPath)).size
                };
            })
        );

        // ==================== 调用通用上传方法 ====================
        console.log("==================== 5.调用通用上传方法 ====================")
        const uploadResults = await oss.uploadFiles(filesToUpload, {
            dir: `${process.env.OSS_VIDEO_PATH}/${taskId}/${taskId}.zip`,  // OSS存储路径
        });
        console.log("==================== 6.将oss链接生成可下载链接 ====================")
        // 将oss链接生成可下载链接
        let dealDownload = await oss.generateSignedUrl(uploadResults[0]['ossPath'], 3600)
        //将 dealDownload http改为https
        dealDownload = dealDownload.replace("http", "https")

        // ==================== 保存到数据库 ====================
        console.log("==================== 7.保存到数据库，更新redis任务 ====================")
        // 直接保存到task任务表中的processed_videos
        await Task.updateProcessedVideos(taskId, dealDownload);
        await Task.updateStatus(taskId, 'success');
        // ==================== 清理临时文件 ====================
        console.log("==================== 8.清理临时文件 ====================")
        try {
            await fs.rm(TASK_DIR, { recursive: true, force: true });
        } catch (cleanError) {
            console.error(`[Cleanup Failed] Task ${taskId}`, cleanError);
        }
    } catch (error) {
        await Task.updateStatus(taskId, 'failed', error.message);
        // 错误日志
        logger.error(`Task ${taskId} failed`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    } finally {
        // ==================== 清理临时文件 ====================
        try {
            // await fs.rm(TASK_DIR, { recursive: true, force: true });
        } catch (cleanError) {
            console.error(`[Cleanup Failed] Task ${taskId}`, cleanError);
        }
    }
};


module.exports = {
    processVideoTask
};


// 一条视频执行多个不同的策略
async function processAllStrategies(strategyParams, videoPath, index, taskId, textContent) {
    //针对策略特殊处理
    // strategyParams.strategy = "drawText" && (textContent = textContent.split("").join(","))
    try {
        // 创建所有异步任务的 Promise 数组
        const ffmpegPromises = strategyParams.map((item) => {
            const options = {
                strategy: item.strategy,
                input: videoPath,
                // output: path.join(OUTPUT_DIR, `output-${index}-${item.id}.mp4`),// output-视频index-策略id
                output: `./temp/${taskId}/processed/output-${index}-${item.id}.mp4`,// output-视频index-策略id
                text: `"${textContent}"`,
                ...item.args
            };
            return runFFMPEGStrategy(options); // 假设返回 Promise
        });

        // 并行执行所有任务并等待结果
        const results = await Promise.all(ffmpegPromises);
        console.log('所有处理完成，结果:', results);
        return results; // 返回所有结果
    } catch (error) {
        console.error('处理过程中出错:', error);
        throw error; // 可选择重新抛出错误或处理
    }
}
