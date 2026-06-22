const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "red",
  },
  petName: {
    type: String,
  },
  gender: {
    type: String,
  },
  sexType: {
    type: String,
  },
  sex: {
    type: String,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
