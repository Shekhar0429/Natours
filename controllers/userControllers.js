const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./factoryHandler');

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Failed',
    message: 'This route is not implemented, Plese use signup ',
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. create error if user POST password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for updating password, please use /updatepassword.',
        400,
      ),
    );

  // 2) filered out unwanted fields
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3. update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

filterObj = (obj, ...fieldsToUpdate) => {
  let newObj = {};
  Object.keys(obj).forEach((el) => {
    if (fieldsToUpdate.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
exports.getUser = factory.getOne(User);
exports.getUsers = factory.getAll(User);
