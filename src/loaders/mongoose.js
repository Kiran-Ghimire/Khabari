const mongoose = require("mongoose");
const config = require("../config");

let mongooseLoader = {};

mongooseLoader.init = async () => {
  mongoose.Promise = global.Promise;
  mongoose.set("returnOriginal", false);
  await mongoose
    .connect(config.databaseURL, {
      // useFindAndModify: false,
      useNewUrlParser: true,
      // useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      console.error(
        "***** Error while connecting database: " + err.message + " *****"
      );
    });
};

module.exports = mongooseLoader;
