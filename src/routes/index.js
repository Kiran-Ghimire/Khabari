/* eslint-disable no-unreachable */
const mongoose = require("mongoose");
const ExpressBrute = require("express-brute");
const MongoStore = require("express-brute-mongo");
const moment = require("moment");
const nodemailer = require("nodemailer");
const cors = require("cors");
const randtoken = require("rand-token");
const config = require("../config");
const {
  authController,
  // dashboardController,
  // profileController,
} = require("../controllers");
const { userService, emailService } = require("../services");

const {
  forgotUserPasswordValidation,
  resetUserPasswordValidation,
} = require("../validators");
const authenticateUser = require("../middlewares/backend/authenticateMiddleware");
// const { logCrmEvents, translateWord, logLoginEvents } = require("../helpers");
// const { clientMiddleware } = require("../middlewares/api/clientMiddleware");
const { transporter } = require("../helpers/nodemailer");
const { userModel } = require("../models");

// const api = require("./api/v1");
// const roles = require("./roles");
// const admins = require("./admins");
// const users = require("./users");
// const pages = require("./pages");
// const logs = require("./logs");
// const apiUsers = require("./apiUsers");

const store = new MongoStore(function (ready) {
  ready(mongoose.connection.collection("bruteforce-store"));
});

let failCallback = function (req, res, next, nextValidRequestDate) {
  req.flash(
    "error_msg",
    "Too many login attempts, please try again " +
      moment(nextValidRequestDate).fromNow()
  );
  return res.redirect("/login");
};

let handleStoreError = function (error) {
  console.error(error); // log this error so we can figure out what went wrong
  throw {
    message: error.message,
    parent: error.parent,
  };
};

let userBruteforce = new ExpressBrute(store, {
  freeRetries: config.throttle.freeTries,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour,
  failCallback: failCallback,
  handleStoreError: handleStoreError,
});

let globalBruteforce = new ExpressBrute(store, {
  freeRetries: config.throttle.freeTries,
  attachResetToRequest: true,
  refreshTimeoutOnRequest: false,
  minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
  maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
  lifetime: config.throttle.waitTime, // 1 day (seconds not milliseconds)
  failCallback: failCallback,
  handleStoreError: handleStoreError,
});

module.exports = (app, passport) => {
  app.get("/signup", async (req, res) => {
    res.send("Hello");
  });
  app.post("/signup", async (req, res, fn) => {
    try {
      let newUser = {
        email: req.body.email,
        password: req.body.password,
        username: req.body.username,
        contact_number: req.body.contact_number,
        height: req.body.height,
        weight: req.body.weight,
        allergies: req.body.allergies,
        blood_type: req.body.blood_type,
        dob: req.body.dob,
        created_at: new Date(),
      };
      const emailCheck = await userService.findOne({ email: newUser.email });
      if (emailCheck) {
        return res
          .status(404)
          .json({ success: false, message: "Email already in use" });
      }
      const userAdd = await userService.add(newUser);
      console.log("userSIGNUP", userAdd);
      if (!userAdd.verify_user) {
        let token = randtoken.generate(10);

        let expiryDate = new Date().getTime() + config.token.expiry;
        let updateData = {
          verify_user_token: token,
          verify_user_token_expires: new Date(expiryDate),
        };
        await userService.findOneAndUpdate({ _id: userAdd._id }, updateData);
        const mailData =
          `
            <p>Dear  ` +
          userAdd.username +
          `, </p>
            <p>Thanks for sign up. Your verification token is given below :  </p>
           
            <ul>
                <li>Token: ` +
          token +
          `</li>
            </ul>
            <p>verify Link: <a href="http://localhost:3000/verifyuser/:id">Verify</a></p>
            
            <p><strong>This is an automatically generated mail. Please do not reply back.</strong></p>
            
            <p>Regards,</p>
            <p>H Manager</p>
        `;

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.mail.mailUser,
            pass: config.mail.mailPassword,
          },
        });

        const mailOptions = {
          from: "n4scent9@gmail.com",
          to: userAdd.email,
          subject: "Email Verification", // Subject line
          html: mailData, // plain text body
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            return console.log(err);
          }
          console.log("MAILINFO", info);
        });

        return res.status(201).json({
          Success: true,
          userAdd: userAdd,
        });
      }
    } catch (e) {
      fn("Errorrrrrrr", e);
    }
  });

  app.post("/verifyuser/:id", async (req, res, next) => {
    await passport.authenticate("custom-signup", async (err, user) => {
      if (user) {
        let updateData = {
          verify_user: true,
          verify_user_token: null,
          verify_user_token_expires: null,
        };

        await userService.findOneAndUpdate({ _id: user._id }, updateData);
        return res
          .status(200)
          .json({ Success: true, message: "User verified" });
      } else {
        return res
          .status(404)
          .json({ Success: false, message: "User not verified" });
      }
    })(req, res, next);
  });

  app.post("/login", async (req, res, fn) => {
    try {
      let user = await userService.findOne({ email: req.body.email });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User doesnot exist" });
      }
      if (!user.validPassword(req.body.password)) {
        return res
          .status(404)
          .json({ success: false, message: "Wrong password" });
      }

      if (!user.verify_user) {
        return res
          .status(404)
          .json({ success: false, message: "Please verify user." });
      }

      if (user && !user.two_way_auth) {
        let userDetail = await userModel.findOne({ _id: user._id });
        console.log("USERDETAIL", userDetail);
        req.session.user = userDetail;
        return res.status(200).json({
          success: true,
          message: "login successfully",
          data: userDetail,
        });

        // eslint-disable-next-line no-empty
      } else if (user && user.two_way_auth) {
        let token = randtoken.generate(10);

        let expiryDate = new Date().getTime() + config.token.expiry;
        let updateData = {
          verify_login_token: token,
          verify_login_token_expires: new Date(expiryDate),
        };
        await userService.findOneAndUpdate({ _id: user._id }, updateData);
        const mailData =
          `
            <p>Dear  ` +
          user.username +
          `, </p>
            <p>Thanks for log in. Your verification token is given below :  </p>
           
            <ul>
                <li>Token: ` +
          token +
          `</li>
            </ul>
            <p>verify Link: <a href="http://localhost:3000/verifylogin/:id">Verify</a></p>
            
            <p><strong>This is an automatically generated mail. Please do not reply back.</strong></p>
            
            <p>Regards,</p>
            <p>H Manager</p>
        `;

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: config.mail.mailUser,
            pass: config.mail.mailPassword,
          },
        });

        const mailOptions = {
          from: "n4scent9@gmail.com",
          to: user.email,
          subject: "Login Verification", // Subject line
          html: mailData, // plain text body
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            return console.log(err);
          }
          console.log("MAILINFO", info);
        });

        return res.status(200).json({
          success: true,
          message: "login successfully now just add the token provided on mail",
        });
      }
    } catch (e) {
      fn("Errorrrrrrr", e);
    }
  });

  // app.get("/verifylogin/:id", authController.verifyLoginView);
  app.post("/verifylogin/:id", async (req, res, next) => {
    await passport.authenticate("custom", async (err, user) => {
      if (user) {
        let updateData = {
          verify_login_token: null,
          verify_login_token_expires: null,
        };

        await userService.findOneAndUpdate({ _id: user._id }, updateData);
        let userDetail = await userModel.findOne({ _id: user._id }).exec();
        req.session.user = userDetail;
        console.log("USERDETAIL", userDetail);
        return res.status(200).json({
          Success: true,
          message: "Login Successfull",
        });
      } else {
        return res
          .status(404)
          .json({ Success: false, message: "User not verified" });
      }
    })(req, res, next);
  });

  // app.get("/forgot-password", authController.forgotPasswordView);
  app.post(
    "/forgot-password",
    [forgotUserPasswordValidation],
    authController.forgotPassword
  );
  // app.get("/reset-password/:token", authController.resetPasswordView);
  app.post(
    "/reset-password/:token",
    [resetUserPasswordValidation],
    authController.resetPassword
  );
  // app.get("/logout", [authenticateUser.isLoggedIn], authController.logout);

  // app.get(
  //   "/home",
  //   [authenticateUser.isLoggedIn, translateWord],
  //   dashboardController.index
  // );
  // app.get(
  //   "/profile",
  //   [authenticateUser.isLoggedIn, translateWord],
  //   profileController.profile
  // );

  // app.use("/roles", authenticateUser.isLoggedIn, roles);
  // app.use("/admins", authenticateUser.isLoggedIn, admins);
  // app.use("/users", authenticateUser.isLoggedIn, users);
  // app.use("/pages", authenticateUser.isLoggedIn, pages);

  // app.use("/logs", authenticateUser.isLoggedIn, logs);
  // app.use("/apiusers", authenticateUser.isLoggedIn, apiUsers);

  // app.use("/api/v1", cors(), clientMiddleware, api);

  app.get("/forbidden", function (req, res) {
    return res.status(403);
    // return res.render("error/403", {
    //   layout: false,
    // });
  });

  app.get("/error", function (req, res) {
    return res.status(500);
    // return res.render("error/500", {
    //   layout: false,
    //   errorStackTrace: "",
    // });
  });

  app.get("/404", function (req, res) {
    return res.status(404);
    // return res.render("error/404", {
    //   layout: false,
    // });
  });

  app.get("*", function (req, res) {
    return res.status("404");
  });
};
