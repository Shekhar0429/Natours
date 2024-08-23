const express = require('express');
const tourController = require('../controllers/tourControllers');
const router = express.Router();
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRouter');

// const reviewController = require('../controllers/reviewController');
// router.param('id', tourController.inValidId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasingTour, tourController.gettours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithIn);
// /tours-within/300/center/34.024628, -118.322494/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/monthly-plan/:year')
  .get(
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMontlyPlan,
  );

router.use('/:tourId/reviews', reviewRouter);

// router
//   .route('/:tourId/review')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

router
  .route('/')
  .get(tourController.gettours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour,
  )
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;
