const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const Months = require('../utils/contants');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./factoryHandler');
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Missing price or name',
//     });
//   }
//   next();
// };

exports.aliasingTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,duration,ratingsAverage';
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } }, //match stage
    },
    //group stage
    {
      $group: {
        // _id: null
        _id: { $toUpper: '$difficulty' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        // numTours: { $count: {} },
      },
    },
    //sort stage
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: {
    //     _id: { $ne: 'EASY' },
    //   },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

exports.getMontlyPlan = catchAsync(async (req, res, next) => {
  console.log(Months.Months);

  const year = req.params.year;
  const monthlyStat = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTousStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
        // monthName: { $arrayElemAt: [Months.Months, '$_id'] },
        monthName: {
          $arrayElemAt: [Months.Months, { $subtract: ['$_id', 1] }],
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTousStart: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      monthlyStat,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.00621371 : 0.001;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng',
        400,
      ),
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});

exports.getToursWithIn = catchAsync(async (req, res, next) => {
  // /tours-within/300/34.024628, -118.322494/mi
  const { distance, latlng, unit } = req.params;

  // array destructuring
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in format lat,lng',
        400,
      ),
    );

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'sucess',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.gettours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
});
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.createTour = factory.createOne(Tour);
