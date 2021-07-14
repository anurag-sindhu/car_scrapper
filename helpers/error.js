const config = require("config");

class ErrorHandler extends Error {
    constructor(status, msg, location) {
        super();
        this.status = status;
        this.msg = msg;
        this.location = location;
    }
}


const handleError = (err, res) => {
    const { status, msg, location } = err;
    res.status(status || config.get('httpStatusCode.internalServerError')).json({
        msg, location, err
    });
};

module.exports = {
    error: ErrorHandler,
    handleError
}