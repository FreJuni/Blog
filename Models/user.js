const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    minLength: 5,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: true,
    minLength: 6,
  },
  profile_imgUrl: {
    type: String,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  payment_session_key: {
    type: String,
  },
  resetToken: String,
  tokenExpiration: Date,
});

module.exports = model("User", userSchema);
