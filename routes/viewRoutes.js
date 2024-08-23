const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const router = express.Router();

// router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewController.getOverivew);
router.get(
  '/tour/:id',
  authController.isLoggedIn,
  viewController.getTourDetails,
);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserDate,
);

module.exports = router;
