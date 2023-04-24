const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ShortUniqueId = require('short-unique-id'); 
const uid = new ShortUniqueId({ length: 16 });

var sessionSchema = new Schema(
  {
    _id: {
        type: String,
        default: () => {
          return uid();
        },
    },
    user: Object,
    token: {
      type: String,
      required: true,
    },
    _expired: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    logged_out: {
      type: Date
    },
    user_agent: { type: Schema.Types.Mixed, default: null },
  },
  {
    collection: "Sessions",
    timestamps: { createdAt: "_created", updatedAt: "_updated" },
    typecast: true,
  }
);

module.exports = mongoose.model("Sessions", sessionSchema);
