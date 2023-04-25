const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 16 });
var userSchema = new Schema({
  _id: {
    type: String,
    default: () => {
      return uid();
    },
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  display_name: {
    type: String,
  },
  phone: {
    type: String
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  profile_picture: Object,
  since: {
    type: Date,
    required: true,
    default: new Date()
  },
  last_login_at: {
    type: Date
  },
  last_login_failed_at: {
    type: Date
  },
  failed_attempts: [{
    ip_address: String,
    count: Number,
    failed_at: Date,
    _id: false
  }],
  user_locked_until: [{
    ip_address: String,
    date: Date,
    _id: false
  }],
  password_reset_code: String,
  password_reset_code_expire_at: Date,
}, {
  collection: 'Users',
  timestamps: { createdAt: '_created', updatedAt: '_updated' },
  typecast: true
});

userSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();

  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

userSchema.methods.validPassword = function (password) {
  if (this.password) {
    return bcrypt.compareSync(password, this.password);
  } else {
    return false;
  }
}

userSchema.methods.filter = function () {
  var user = this;
  var temp = { ...user.toObject() }
  delete temp.password;
  delete temp.activation_code;
  delete temp.activation_code_expire_at;
  delete temp.password_reset_code;
  delete temp.last_login_at;
  delete temp.last_login_failed_at;
  delete temp.failed_attempts;
  delete temp.user_locked_until;
  return temp;
}

userSchema.methods.sessionStore = function () {
  var user = this;
  var temp = { ...user.toObject() }
  delete temp.password;
  delete temp.activation_code;
  delete temp.activation_code_expire_at;
  delete temp.password_reset_code;
  delete temp.password_reset_code_expire_at;
  delete temp.user_activated;
  delete temp.additional_emails;
  delete temp.birth_day;
  delete temp.last_login_at;
  delete temp.last_login_failed_at;
  delete temp.failed_attempts;
  delete temp.user_locked_until;
  delete temp._created;
  delete temp._updated;
  delete temp.__v;
  return temp;
}

module.exports = mongoose.model('Users', userSchema);