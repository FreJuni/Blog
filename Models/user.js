const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    minLength: 5,
    sparse : true,
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

// Create a sparse index on the username field
userSchema.index({ email: 1 }, { sparse: true });

module.exports = model("User", userSchema);
