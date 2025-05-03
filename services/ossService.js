const OSS = require('ali-oss');
const { STS } = require('ali-oss');
const crypto = require('crypto');
const path = require('path')
const fs = require('fs')

const sts = new STS({
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET
});

const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: 'zh-video-text'
});

// 生成上传凭证
exports.getOSSCredentials = async () => {
    const policy = {
        Statement: [{
            Action: ['oss:PutObject'],
            Resource: [`acs:oss:*:*:${process.env.OSS_BUCKET}/${process.env.OSS_USER_PATH}/*`],
            Effect: 'Allow'
        }],
        Version: '1'
    };
    const result = await sts.assumeRole(
        `acs:ram::${process.env.OSS_ACCOUNT_ID}:role/${process.env.ROLE_NAME}`, // 替换实际RAM角色
        policy,
        30 * 60 // 有效期30分钟
    );
    return {
        accessKeyId: result.credentials.AccessKeyId,
        accessKeySecret: result.credentials.AccessKeySecret,
        // SecurityToken: result.credentials.SecurityToken,
        stsToken: result.credentials.SecurityToken,
        region: process.env.OSS_REGION,
        bucket: process.env.OSS_BUCKET,
        dir: `${process.env.OSS_USER_PATH}/`,
        expire: result.credentials.Expiration
    };
};

// 生成带签名的下载URL
exports.generateDownloadUrl = async (videoPath) => {
    return client.signatureUrl(videoPath, {
        expires: 3600, // 1小时有效
        method: 'GET'
    });
};

// 批量生成下载URL
exports.batchGenerateDownloadUrls = async (prefix) => {
    const { objects } = await client.list(prefix, { 'max-keys': 1000 });
    return Promise.all(
        objects.map(obj => client.signatureUrl(obj.name, { expires: 3600 }))
    );
};

// 生成下载url
exports.generateSignedUrl = async (ossPath, expires = 3600) => {
    try {
        const url = await client.signatureUrl(ossPath, {
            expires,
            method: 'GET'
        });
        return url;
    } catch (err) {
        console.error('生成签名 URL 失败:', err);
        throw err;
    }
}
// 通用上传方法
exports.uploadFiles = async (files, options = {}) => {
    const defaultOptions = {
        dir: options.dir || 'video/',  // 默认上传目录
        maxSize: 1000 * 1024 * 1024, // 1000MB
        mimeTypes: ['application/zip', 'application/x-zip-compressed', 'video/mp4'], // 支持 zip
        // 你可以在调用时传入更多类型，比如 ['video/mp4', 'application/pdf', ...]
    };

    const mergedOptions = { ...defaultOptions, ...options };
    if (!files || !files.length) {
        throw new Error('至少需要上传一个文件');
    }

    const results = await Promise.all(
        files.map(async file => {
            if (
                mergedOptions.mimeTypes.length &&
                !mergedOptions.mimeTypes.includes(file.mimetype)
            ) {
                throw new Error(`文件 ${file.originalname} 类型不支持: ${file.mimetype}`);
            }

            if (file.size > mergedOptions.maxSize) {
                throw new Error(`文件 ${file.originalname} 超出大小限制`);
            }

            const filename = `${mergedOptions.dir}`;
            console.log("拿到文件名", filename)

            try {
                const result = await client.put(filename, file.buffer, {
                    // headers: {
                    //     // 关键参数：设置对象为公共可读
                    //     'x-oss-object-acl': 'public-read'
                    // }
                });
                return {
                    originalName: file.originalname,
                    url: result.url,
                    ossPath: result.name,
                };
            } catch (err) {
                throw new Error(`上传失败: ${file.originalname} - ${err.message}`);
            }
        })
    );

    return results;
};


exports.downloadFile = async function (objectKey, downloadPath) {
    const decodedPath = new URL(objectKey).pathname;
    // 确保目录存在
    const dir = path.dirname(downloadPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        // 直接将远端文件下载并写入本地文件
        const result = await client.get(decodedPath, downloadPath);
        // console.log("client.get(decodedPath, downloadPath)", client.get(decodedPath, downloadPath))
        // console.log('Download complete:', result);
        return result;
    } catch (err) {
        console.error('Download failed:', err);
        throw err;
    }
}



// (async () => {
//     await downloadToFile(
//       client,
//       'videos/video.mp4',    // OSS 上的文件 Key
//       './downloads/video.mp4' // 本地保存路径
//     );
//   })();