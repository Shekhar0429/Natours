const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');
const authController = require('../controllers/authController');

router.route('/signup').post(authController.signUp);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgotpassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.route('/updatepassword').patch(authController.updatePassword);
router.route('/updateMe').patch(userController.updateMe);
// route to make user status inactive
router.route('/deleteMe').delete(userController.deleteMe);

router.route('/me').get(userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getUsers).post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    userController.deleteUser,
  );

module.exports = router;
