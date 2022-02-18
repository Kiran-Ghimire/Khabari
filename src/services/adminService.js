"use strict";

const { adminModel } = require("../models");

let adminService = {};

adminService.findAll = async (query) => {
  let admins = await adminModel
    .find(query.where)
    // .populate("role_id")
    .sort(query.sort)
    .limit(query.limit)
    .skip(query.offset);
  return admins;
};

adminService.count = async (whereCondition) => {
  const count = await adminModel.find(whereCondition).countDocuments();
  return count;
};

adminService.findOne = async (query) => {
  let admin = await adminModel.findOne(query);
  return admin;
};

adminService.add = async (data) => {
  console.log("DATA", data);
  let admin = await adminModel.create(data);
  console.log("ADMINNNNNN", admin);
  return admin;
};

adminService.findOneAndUpdate = async (query, updateData) => {
  let admin = await adminModel.findOneAndUpdate(query, updateData);
  return admin;
};

adminService.deleteOne = async (query) => {
  return await adminModel.deleteOne(query);
};

module.exports = adminService;
