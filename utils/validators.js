const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

exports.isValidUrl = (url) => {
    // 基础格式验证
    if (!urlRegex.test(url)) return false;

    // 扩展验证：OSS URL格式示例
    try {
        // const { protocol, hostname, pathname } = new URL(url);
        // return protocol.startsWith('http') // && 
        // hostname.endsWith('.aliyuncs.com') &&
        // pathname.startsWith(`/${process.env.OSS_USER_PATH}/`);
        return true
    } catch {
        return false;
    }
};