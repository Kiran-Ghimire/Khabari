"use strict";

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let adminSchema = new Schema({
  email: { type: String, unique: true, index: true },
  username: { type: String, unique: true, index: true },
  password: { type: String },
  contact_number: { type: String },
  height: { type: String },
  weight: { type: String },
  allergies: { type: String, default: "" },
  blood_type: { type: String, default: "" },
  dob: { type: Date },
  verify_user: { type: Boolean, default: false },
  token: { type: String, default: "" },
  token_expires: { type: Date },
  reset_password_token: { type: String },
  reset_password_expires: { type: Date },
  verify_user_token: { type: String },
  verify_user_token_expires: { type: Date },
  verify_login_token: { type: String },
  verify_login_token_expires: { type: Date },
  two_way_auth: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

adminSchema.pre("save", function (next) {
  let admin = this;
  if (!admin.isModified("password")) {
    return next();
  }

  admin.password = generateHash(admin.password);
  next();
});

let generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

adminSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

adminSchema.set("toObject", { virtuals: true });
adminSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Admin", adminSchema);
