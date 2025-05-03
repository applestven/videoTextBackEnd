const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask); // 创建任务
router.get('/status/:taskId', taskController.getTaskStatus);
router.get('/download/:taskId', taskController.getDownloadUrls);
//根据userId获取所有任务
router.post('/getUserTasks', taskController.getUserTasks);

module.exports = router;