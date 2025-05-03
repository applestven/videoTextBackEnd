const pool = require('../config/db');
const uuid = require('uuid');
module.exports = class Task {
    static async create({ userId, originalVideo }) {
        const taskId = uuid.v4();
        await pool.execute(
            'INSERT INTO tasks (task_id, user_id, original_video) VALUES (?, ?, ?)',
            [taskId, userId, JSON.stringify(originalVideo)]
        );
        return taskId;
    }

    // 查询方法增加用户过滤
    static async findByUser(userId, taskId) {
        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE task_id = ? AND user_id = ?',
            [taskId, userId]
        );
        return rows[0];
    }

    static async findById(taskId) {
        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE task_id = ?',
            [taskId]
        );
        return rows[0];
    }
    static async updateStatus(taskId, status, errorMessage = null) {
        const query = errorMessage
            ? 'UPDATE tasks SET status = ?, error_message = ? WHERE task_id = ?'
            : 'UPDATE tasks SET status = ? WHERE task_id = ?';

        const params = errorMessage
            ? [status, errorMessage, taskId]
            : [status, taskId];

        await pool.execute(query, params);
    }
    //更新processed_videos JSON 
    static async updateProcessedVideos(taskId, processedVideos) {
        await pool.execute(
            'UPDATE tasks SET processed_videos = ? WHERE task_id = ?',
            [JSON.stringify(processedVideos), taskId]
        );
    }

    // 新增用户任务查询方法
    static async findAllByUser(userId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;

        // 查询列表
        const [tasks] = await pool.execute(`
            SELECT * FROM tasks 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}
        `, [userId]);

        // 查询总数
        const [[{ count }]] = await pool.execute(
            'SELECT COUNT(*) AS count FROM tasks WHERE user_id = ?',
            [userId]
        );

        // 格式化数据
        const safeParse = (str) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                return str; // 解析失败就原样返回
            }
        };

        return {
            data: tasks.map(task => ({
                ...task,
                original_video: safeParse(task.original_video),
            })),
            pagination: {
                page,
                pageSize,
                total: count,
                totalPages: Math.ceil(count / pageSize),
            },
        };
    }
    // 清空所有的任务方法
    static async deleteMany() {
        await pool.execute('DELETE FROM tasks');
    }


};