const mysql = require('mysql2/promise');
require('dotenv').config();

const initDB = async () => {
  // 创建基础连接（无指定数据库）
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  // 创建数据库
  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  // 切换到目标数据库
  await conn.changeUser({ database: process.env.DB_NAME });

  // 创建表结构
  await conn.execute(`
    CREATE TABLE tasks (
      task_id          VARCHAR(36)   PRIMARY KEY,
      status           ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending',
      user_id          INT           NOT NULL,
      original_video   JSON          NOT NULL,  -- 存储原始视频数组
      processed_videos JSON,                   -- 存储处理后视频数组
      created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      error_message    TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS generated_videos (
      video_id         INT AUTO_INCREMENT PRIMARY KEY,
      task_id          VARCHAR(36)   NOT NULL,
      video_url        VARCHAR(512)  NOT NULL,
      created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE,
      INDEX idx_task (task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Database initialized successfully!');
  process.exit(0);
};

initDB().catch(err => {
  console.error('Initialization failed:', err);
  process.exit(1);
});