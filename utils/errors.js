class CustomError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = options.code || 0;       // 业务错误码
        this.statusCode = options.statusCode || 400; // HTTP状态码
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends CustomError {
    constructor(message) {
        super(message, { code: 1001 });
    }
}

class DatabaseError extends CustomError {
    constructor(message) {
        super(message, { code: 2001, statusCode: 500 });
    }
}

module.exports = {
    CustomError,
    ValidationError,
    DatabaseError
};