const oss = require('../services/ossService');
const crypto = require('crypto'); // 必须引入加密模块
const path = require('path');
exports.getCredentials = async (req, res) => {
    try {
        // 生成策略和签名的函数需要正确定义
        function generateUploadPolicy(credentials) {
            const policy = {
                expiration: new Date(credentials.expire).toISOString(),
                conditions: [
                    ["starts-with", "$key", credentials.dir],
                    ["content-length-range", 0, 100 * 1024 * 1024],
                    { "bucket": credentials.bucket }
                ]
            };
            return Buffer.from(JSON.stringify(policy)).toString('base64');
        }

        function generateSignature(credentials, policy) {
            const hmac = crypto.createHmac('sha1', credentials.accessKeySecret);
            hmac.update(policy);
            return hmac.digest('base64');
        }

        const credentials = await oss.getOSSCredentials();
        const policy = generateUploadPolicy(credentials);
        const signature = generateSignature(credentials, policy);

        res.success({
            accessKeyId: credentials.accessKeyId,
            policy: policy,
            accessKeySecret: credentials.accessKeySecret,
            // SecurityToken: credentials.SecurityToken,
            stsToken: credentials.stsToken, // 确保兼容性
            signature: signature,
            dir: credentials.dir,
            bucket: credentials.bucket,
            region: credentials.region,
            host: `https://${credentials.bucket}.${credentials.region}.aliyuncs.com`,
            expire: credentials.expire
        });

    } catch (error) {
        console.error('OSS Credentials Error:', error);
        res.error(error.message, error.code || 0);
    }
};

// 生成上传策略
function generateUploadPolicy(credentials) {
    const policy = {
        expiration: new Date(credentials.expire).toISOString(),
        conditions: [
            ["starts-with", "$key", credentials.dir],
            ["content-length-range", 0, 100 * 1024 * 1024], // 100MB限制
            { "bucket": credentials.bucket }
        ]
    };
    return Buffer.from(JSON.stringify(policy)).toString('base64');
}

// 生成签名
function generateSignature(credentials) {
    const hmac = crypto.createHmac('sha1', credentials.accessKeySecret);
    hmac.update(policy);
    return hmac.digest('base64');
}