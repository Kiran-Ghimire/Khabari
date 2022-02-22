"use strict";

const { userModel } = require("../models");

let userService = {};

userService.findAll = async (query) => {
  let users = await userModel
    .find(query.where)
    // .populate("role_id")
    .sort(query.sort)
    .limit(query.limit)
    .skip(query.offset);
  return users;
};

userService.count = async (whereCondition) => {
  const count = await userModel.find(whereCondition).countDocuments();
  return count;
};

userService.findOne = async (query) => {
  let user = await userModel.findOne(query);
  return user;
};

userService.add = async (data) => {
  console.log("DATA", data);
  let user = await userModel.create(data);
  console.log("userNNNNN", user);
  return user;
};

userService.findOneAndUpdate = async (query, updateData) => {
  let user = await userModel.findOneAndUpdate(query, updateData);
  return user;
};

userService.deleteOne = async (query) => {
  return await userModel.deleteOne(query);
};

module.exports = userService;
