"use strict";

const express = require("express");
const config = require("./config");
const loaders = require("./loaders");

let startServer = async () => {
  const app = express();
  await loaders.init(app);
  app.listen(config.port, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Express running at port: ${config.port} -> ${config.projectUrl}`);
  });
};
startServer();
