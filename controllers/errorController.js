const AppError = require('../utils/appError');

handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

handleJwtError = () => {
  return new AppError('Invalid token', 401);
};

handleJWTExpriedError = () => {
  return new AppError('Token expired timeout', 401);
};

sendErrorDev = (err, req, res) => {
  // req.originalUrl givves complete url without host, eg: /api/vi/tours...
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    //operational trusted error : send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //programming or other unknown error:don't leak error details
      // 1. log error
      // console.error(err);
     return res.status(500).json({
        status: 'error',
        message: 'something went wrong',
      });
  } 
    if (err.isOperational) {
     return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });
    }
    //programming or other unknown error:don't leak error details
    else {
      // 1. log error
      // console.error(err);
     return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later',
      });
    }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // console.log(err);
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.includes('production')) {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDb(error);
    if (error.name === 'JsonWebTokenError') error = handleJwtError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpriedError();

    sendErrorProd(error, req, res);
  }

  // next();
};
