const express = require("express");
const passport = require("passport");
const fileUpload = require("express-fileupload");
const flash = require("connect-flash");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const responseTime = require("response-time");
const mongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const expressValidator = require("express-validator");

// const { getPermissions, logApiRequest } = require("../helpers");
// const { adminModel } = require("../models");
const config = require("../config");

let expressLoader = {};

expressLoader.init = async (app) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  //   app.use(expressValidator());
  if (config.nodeEnv == "production") {
    app.use(helmet());
  }
  app.use(compression());
  app.use(fileUpload());
  app.use(
    session({
      secret: "zSDasdSDASDASD91287assdSzassasda",
      saveUninitialized: true,
      resave: true,
      store: mongoStore.create({
        mongoUrl: config.databaseURL,
      }),
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());

  app.use(cookieParser());
  app.use(methodOverride("_method"));
  // app.use(express.static(path.join(__dirname, "../../public/backend")));
  // app.set("views", path.join(__dirname, "../views/backend"));
  // app.set("view engine", "ejs");
  app.use(morgan("dev"));

  //   app.use(async (req, res, next) => {
  //     res.locals["error_msg"] = req.flash("error_msg");
  //     res.locals.inputData = req.flash("inputData")[0];
  //     res.locals["error_arr"] = req.flash("error_arr");
  //     res.locals["success_msg"] = req.flash("success_msg");
  //     res.locals.errors = req.flash("errors");
  //     res.locals.query = req.query;
  //     res.locals.url = req.url;
  //     res.locals.session = req.session;
  //     if (req.session.user) {
  //       let user = await adminModel
  //         .findById(req.session.user._id)
  //         .populate("role_id");
  //       res.locals.modulePermissions = getPermissions(user);
  //     }
  //     next();
  //   });

  //   require("../database/seeders");
  require("../config/passport")(passport);
  require("../routes")(app, passport);

  app.use(
    responseTime(async (request, response, time) => {
      if (response.statusCode === 200) {
        logApiRequest(request, response, time, "");
      }
    })
  );

  // eslint-disable-next-line no-unused-vars
  app.use(async (err, req, res, next) => {
    console.error(err);
    if (req.originalUrl.match(/(^|\W)api($|\W)/)) {
      // let ms = (res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6;
      let ms = 200;
      await logApiRequest(req, res, ms, err);
      res.setHeader("Content-Type", "application/json");
      let statusCode = err.statusCode ? err.statusCode : 500;
      let responseData = {
        status: "error",
        message: err.message ? err.message : "Something went wrong.",
      };
      return res.status(statusCode).send(responseData);
    } else {
      let errorStackTrace = config.nodeEnv != "production" ? err.stack : "";
      return res.status(500).json({ errorStackTrace });
    }
  });

  return app;
};

module.exports = expressLoader;
