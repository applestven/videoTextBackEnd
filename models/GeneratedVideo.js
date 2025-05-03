const pool = require('../config/db');

module.exports = class GeneratedVideo {
    static async create({ task_id, video_url }) {
        const [result] = await pool.execute(
            'INSERT INTO generated_videos (task_id, video_url) VALUES (?, ?)',
            [task_id, video_url]
        );
        return result.insertId;
    }

    static async findByTaskId(taskId) {
        const [rows] = await pool.execute(
            'SELECT * FROM generated_videos WHERE task_id = ?',
            [taskId]
        );
        return rows;
    }
};