const crypto = require('crypto');
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name is required.'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin', 'guide', 'lead-guide'],
      message: 'role must be user, admin, guide or lead-guide',
    },
    default: 'user',
  },
  email: {
    type: String,
    validate: {
      validator: isEmail,
      message: '({VALUE}): not a validate email.',
    },
    required: [true, 'email is required.'],
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'password is requried.'],
    minlength: 4,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'you need to confirm your password'],
    validate: {
      validator: function (passwordConfirm) {
        return passwordConfirm === this.password;
      },
      message: 'passwords do not match.',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordRestExpiresIn: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
  }

  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.methods.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.isPassChangedAfterJWTcreation = function (iat) {
  if (this.passwordChangedAt) {
    const passChangedAtInSec = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return iat < passChangedAtInSec;
  }
  return false;
};

userSchema.methods.createResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordRestExpiresIn = Date.now() + 10 * 60 * 1000;

  await this.save({ validateBeforeSave: false });

  return resetToken;
};

userSchema.methods.cancelPasswordReset = async function () {
  this.passwordResetToken = undefined;
  this.passwordRestExpiresIn = undefined;

  return this.save({ validateBeforeSave: false });
};

userSchema.methods.isExpiredResetToken = function () {
  return this.passwordRestExpiresIn < Date.now();
};

userSchema.methods.resetPassword = async function (password, passwordConfirm) {
  this.passwordRestExpiresIn = undefined;
  this.passwordResetToken = undefined;

  return this.updatePassword(password, passwordConfirm);
};

userSchema.methods.updatePassword = function (password, passwordConfirm) {
  this.password = password;
  this.passwordConfirm = passwordConfirm;

  return this.save();
};

userSchema.methods.updatePhoto = async function (photo) {
  this.photo = photo;

  return await this.save({ validateBeforeSave: false });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
