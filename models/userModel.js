const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

//user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'A user must have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: 8,
    select: false,
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide', 'guide'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpies: Date,
  active: {
    default: true,
    type: Boolean,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "'Password doesn't match",
    },
  },
});

userSchema.pre('save', async function (next) {
  //only run this function if password is actually modified
  if (!this.isModified('password')) return next();

  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

//pre hook for updating passwordChangedAt when password is modified.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//pre hook on find queries not to display inactive users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// method to check if password from client and password in DB are equals
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (jwtIssueTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return jwtIssueTimeStamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // updating the passwordResetToken field of current doc.
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // setting expiry time to 10mins
  this.passwordResetExpies = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
