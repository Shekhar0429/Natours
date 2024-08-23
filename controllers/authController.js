const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const token = signToken(newUser.id);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  //taking email and password for req body
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password)
    return next(new AppError('please provide email and password!', 400));

  // 2.check if user exists and password is correct
  // find by email and include password field also
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect password or email', 401));
  }

  // 3.if everything ok, send token
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token = '';
  // 1.getting token and check if its exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not loggedIn, please log in to access.', 401),
    );

  // 2.verification token
  // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const decoded = await Promise.resolve(
    jwt.verify(token, process.env.JWT_SECRET),
  );

  // 3. check if user still exists
  const userExist = await User.findById(decoded.id);
  if (!userExist) return next(new AppError('User doesn;t exist', 401));

  // 4.if user changed the password after token was issued.
  if (await userExist.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password, please login again',
        401,
      ),
    );
  }

  // everything passed
  req.user = userExist;
  res.locals.user = userExist;
  next();
});

// Only for rendered pages, to check ig user is loggedIn or not
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1.verify token
      const decoded = await Promise.resolve(
        jwt.verify(req.cookies.jwt, process.env.JWT_SECRET),
      );

      // 2. check if user still exists
      const userExist = await User.findById(decoded.id);
      if (!userExist) return next();

      // 3.if user changed the password after token was issued.
      if (await userExist.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGEDIN USER
      res.locals.user = userExist; // res.local can be accessible from templates
      console.log('check res', res.locals);
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin','lead-guide'];
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          'You do not have sufficient permission to perform this task!',
          403,
        ),
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on passed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with email address', 404));

  // 2. generate  the random reset token for the same doc and save in DB.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    //Reset password and expire time in DB if any fail
    user.passwordResetToken = undefined;
    user.passwordResetExpies = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email.Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpies: { $gt: Date.now() },
  });

  // 2.if token has not expired,
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpies = undefined;

  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1.) get the user from the collections
  const user = await User.findById(req.user._id).select('+password');

  //2. check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  //3. if so. update password in DB.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4. log user In, send jwt

  createSendToken(user, 200, res);
});
