const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ShortUniqueId = require('short-unique-id'); 
const uid = new ShortUniqueId({ length: 16 });

var userLoginFailsSchema = new Schema(
  {
    _id: {
      type: String,
      default: () => {
        return uid();
      },
    },
    user_id: {
      type: String,
      ref: "Users",
      required: true,
    },
    email: {
      type: String
    },
  },
  {
    collection: "UserLoginFails",
    timestamps: { createdAt: "_created", updatedAt: "_updated" },
    typecast: true,
  }
);

module.exports = mongoose.model("UserLoginFails", userLoginFailsSchema);
