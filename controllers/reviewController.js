const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./factoryHandler');

exports.setTourAndUserId = (req, res, next) => {
  if (!req.body.tour || !req.body.user) {
    req.body.tour = req.params.tourId;
    req.body.user = req.user.id;
  }
  next();
};

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
exports.getReviews = factory.getAll(Review);
