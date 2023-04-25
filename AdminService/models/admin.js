const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const ShortUniqueId = require('short-unique-id');
const uid = new ShortUniqueId({ length: 16 });
var adminSchema = new Schema({
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
  email: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
  },
  last_login_at: {
    type: Date
  },
  since: {
    type: Date,
    required: true,
    default: new Date()
  },
}, {
  collection: 'Admin',
  timestamps: { createdAt: '_created', updatedAt: '_updated' },
  typecast: true
});

adminSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();

  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

adminSchema.methods.validPassword = function (password) {
  if (this.password) {
    return bcrypt.compareSync(password, this.password);
  } else {
    return false;
  }
}

adminSchema.methods.filter = function () {
  var user = this;
  var temp = { ...user.toObject() }
  delete temp.password;
  return temp;
}

adminSchema.methods.sessionStore = function () {
  var user = this;
  var temp = { ...user.toObject() }
  delete temp._created;
  delete temp._updated;
  delete temp.__v;
  return temp;
}

module.exports = mongoose.model('Admin', adminSchema);