const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function compressFolder(sourceDir, destPath) {
    console.log("开始压缩视频文件夹:", sourceDir);
    return new Promise((resolve, reject) => {
        // 校验源目录是否存在
        if (!fs.existsSync(sourceDir)) {
            reject(new Error(`源文件夹不存在: ${sourceDir}`));
            return;
        }

        // 创建输出目录
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // 创建输出流
        const output = fs.createWriteStream(destPath);
        const archive = archiver('zip', {
            zlib: { level: 9 },
            statConcurrency: 2,          // 避免并发导致大文件问题
            highWaterMark: 1024 * 1024   // 提高缓冲区大小
        });

        // 事件监听
        output.on('close', () => {
            console.log(`压缩完成，文件大小: ${archive.pointer()} 字节`);
            resolve(destPath);
        });

        archive.on('warning', (err) => console.warn('压缩警告:', err));
        archive.on('error', (err) => reject(err));
        output.on('error', (err) => reject(err));

        // 管道连接
        archive.pipe(output);

        // 递归添加文件（异步方式）
        function addFiles(dir) {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            files.forEach((file) => {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    addFiles(fullPath); // 递归子目录
                } else {
                    // 关键步骤：使用二进制流添加文件
                    archive.append(fs.createReadStream(fullPath), {
                        name: path.relative(sourceDir, fullPath),
                        mode: 0o755 // 保持文件权限
                    });
                    console.log('已添加:', fullPath);
                }
            });
        }

        // 开始添加文件
        addFiles(sourceDir);

        // 完成压缩
        archive.finalize();
    });
}

// 使用示例
// compressFolder('./videos', './output/videos.zip')
//     .then(() => console.log('所有视频压缩完成！'))
//     .catch(console.error);

module.exports = { compressFolder };
// 使用示例
// (async () => {
//     try {
//         await compressFolder('./my-folder', './dist/my-archive.zip');
//         console.log('压缩成功！');
//     } catch (err) {
//         console.error('压缩失败:', err);
//     }
// })();