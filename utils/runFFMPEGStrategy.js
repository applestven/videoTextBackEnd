const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

async function runFFMPEGStrategy(options) {
    return new Promise((resolve, reject) => {
        // 根据操作系统选择二进制文件
        const ffmpegBinary = os.platform() === 'win32' ? 'ffmpeg-bundle-win.exe' : 'ffmpeg-bundle-linux';
        const ffmpegPath = path.join(__dirname, '../bin', ffmpegBinary); // 假设二进制文件位于 bin 目录
        // ffmpegPath = '../bin/ffmpeg-bundle-win.exe';
        // 初始化命令行参数
        let args = [];

        // 将 options 对象中的每个键值对作为参数添加到 args 数组中
        Object.keys(options).forEach((key) => {
            // 如果参数值为字符串或其他值，则直接添加
            args.push(`--${key}=${options[key]}`);
        });

        // 使用 spawn 执行命令
        const ffmpegProcess = spawn(ffmpegPath, args);
        console.log(`Running FFMPEG with :${ffmpegPath} ${args.join(' ')}`);

        // 捕获输出
        ffmpegProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        // 捕获错误输出
        ffmpegProcess.stderr.on('data', (data) => {
            // console.error(`stderr: ${data}`);
        });

        // 监听进程结束
        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                resolve(options.output); // 执行成功，返回 output 地址
            } else {
                reject(new Error(`FFMPEG process exited with code ${code}`));
            }
        });
    });
}
module.exports = {
    runFFMPEGStrategy
};

// 示例调用
// const options = {
//     strategy: 'drawText',
//     input: 'out.mp4',
//     output: 'outputText.mp4',
//     text: '测,试,O,C,R,文,字,识,别'
// };

// runFFMPEGStrategy(options)
//     .then((outputFile) => {
//         console.log(`FFMPEG task completed successfully. Output file: ${outputFile}`);
//     })
//     .catch((error) => {
//         console.error(`FFMPEG task failed: ${error.message}`);
//     });
