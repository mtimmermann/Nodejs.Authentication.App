/**
 * Error handler for controllers
 */

var logger = require('../shared/logger');

exports.errorHandler = function(req, res, err) {

    // Model validation error TYPE_ERROR: 52
    if (err.name && err.name === 'ValidationError') {
        logger.log('info', err);
        res.statusCode = 400;
        res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Bad Request',
            description: 'Validation Error',
            error: err,
            IsSuccess: false
        }));
    }

    // Unhandled error
    else {
        logger.log('error', err);
        res.statusCode = 500;
        res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Internal Server Error'
        }));
    }
}
