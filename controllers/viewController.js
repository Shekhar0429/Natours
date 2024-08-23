const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverivew = catchAsync(async (req, res, next) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Build template

  // 3. render that template using tour dara from 1.
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
  // 1. get the data for the requested tour(including review, tour guides)
  const tour = await Tour.findOne({ slug: req.params.id }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  // 2. Build template

  if (!tour) return next(new AppError('Tour Not found!', 404));

  // 3. Render template using the data from 1.
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res, next) => {
  // const user = await
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
});

exports.updateUserDate = catchAsync(async (req, res, next) => {
  console.log(req.body)
  const updated_user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updated_user,
  });
});
