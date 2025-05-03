const responseMiddleware = (req, res, next) => {
    // 成功响应方法
    res.success = (data = null, message = '') => {
        res.json({
            code: 1,
            data,
            msg: message
        });
    };

    // 失败响应方法
    res.error = (message = 'Server Error', code = 0) => {
        res.status(400).json({ // 默认400错误，可自定义状态码
            code,
            data: null,
            msg: message
        });
    };

    next();
};

module.exports = responseMiddleware;