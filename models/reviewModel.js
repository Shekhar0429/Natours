const mongoose = require('mongoose');
const tour = require('../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty'],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // ref_to_tour
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    // ref_to_user
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// pre middleware to display user and tour in review
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Calculating ratingsAvg and ratingsQnt based on a tour and tour document

reviewSchema.statics.calcRatingsAverageAndQuantity = async function (tourId) {
  // this refers to current model (review) in static methods
  console.log('tourid', tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);
  console.log('sts', stats);
  await tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRatings,
    ratingsQuantity: stats[0].nRatings,
  });
};

reviewSchema.pre(/^findOneAnd/, async function (next) {
  // creating a new property r that can be accesed on post hook
  try {
    const doc = await this.findOne(); //executes the query and return document
    console.log('doc', doc);
    this.r = doc;
    next();
  } catch (err) {
    next(err);
  }
});

// creating post query hook to update reviewAvg/reviewQnt on update/delete review
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcRatingsAverageAndQuantity(this.r.tour);
});

reviewSchema.post('save', function () {
  // this points to current review document
  this.constructor.calcRatingsAverageAndQuantity(this.tour);
});

// creating model
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
