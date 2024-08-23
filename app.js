const express = require('express');
const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongosanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// set security http headers
// app.use(helmet());

app.use(
  cors({
    origin: [process.env.ORIGIN],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true, //to enable cookies,
  })
);

// to set pug as a template engine
app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

// serving static file, like images,favicon
app.use(express.static(path.join(__dirname, 'public')));

//to parse req body,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// to get data in req from a template form
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// to parse data from cookie, like jwt token
app.use(cookieParser());

// sanitize the req payload, remove if any mongo query present
app.use(mongosanitize());

// data sanitaztion against XSS - cross side scripting
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsQuantity',
    ],
  }),
);

//morgan middleware:- console the req type, url, status, time and size
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//middleware to limit api call from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

//creating middleware
app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});

// Routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  //passing argu in next handler will directly call error middleware from middleware stack
  next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404));
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Can't find the ${req.originalUrl} on this server`,
  // });
});

//ERROR HANDLING MIDDLEWARE : RUN ON EVERY OCCUR
app.use(globalErrorHandler);

module.exports = app;
