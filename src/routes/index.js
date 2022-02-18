/* eslint-disable no-unreachable */
const mongoose = require("mongoose");
const ExpressBrute = require("express-brute");
const MongoStore = require("express-brute-mongo");
const moment = require("moment");
const cors = require("cors");
const randtoken = require("rand-token");
const config = require("../config");
const {
  authController,
  // dashboardController,
  // profileController,
} = require("../controllers");
const { adminService, emailService } = require("../services");

const {
  forgotAdminPasswordValidation,
  resetAdminPasswordValidation,
} = require("../validators");
const authenticateUser = require("../middlewares/backend/authenticateMiddleware");
// const { logCrmEvents, translateWord, logLoginEvents } = require("../helpers");
// const { clientMiddleware } = require("../middlewares/api/clientMiddleware");
const { adminModel } = require("../models");

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
  // app.get("/", [authenticateUser.guest], authController.login);
  // app.get("/login", [authenticateUser.guest], authController.login);
  app.get("/signup", async (req, res) => {
    res.send("Hello");
  });
  // app.put("/toggle-auth", authController.authToggle);

  app.post("/signup", async (req, res, fn) => {
    try {
      // let passwordMethod = req.body.password_method;
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
      console.log("HEYO", newUser);
      const adminAdd = await adminService.add(newUser);
      console.log("adminSIGNUP", adminAdd);
      if (!adminAdd.verify_user) {
        let token = randtoken.generate(10);

        let expiryDate = new Date().getTime() + config.token.expiry;
        let updateData = {
          verify_user_token: token,
          verify_user_token_expires: new Date(expiryDate),
        };
        await adminService.findOneAndUpdate({ _id: adminAdd._id }, updateData);

        let mailData = {
          to: adminAdd.email,
          subject: "Verify User",
        };

        mailData["html"] =
          "Dear " +
          adminAdd.username +
          ",<br><br>Your have requested to verify your account. Your token is: <br><b>Token: </b>" +
          token +
          "<br>Thank you.";
        await emailService.sendEmail(mailData);
        return res.status(201).json({
          Success: true,
          adminAdd: adminAdd,
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

        await adminService.findOneAndUpdate({ _id: user._id }, updateData);
        // let userDetail = await adminModel.findOne({ _id: user._id }).exec();
        // req.session.user = userDetail;
        // logCrmEvents(req, "Event", "success", { message: "Login Successful" });
        // logLoginEvents(req, "Login", "success", {
        //   message: "has successfully logged in",
        // });
        return res
          .status(200)
          .json({ Success: true, message: "User verified" });
      } else {
        // let msg = "Reset link is invalid or expired.";
        // req.flash("error_msg", msg);
        return res
          .status(404)
          .json({ Success: false, message: "User not verified" });
      }
    })(req, res, next);
  });

  app.post(
    "/login",
    // globalBruteforce.prevent,
    // userBruteforce.getMiddleware({
    //   key: function (req, res, next) {
    //     // prevent too many attempts for the same username
    //     next(req.body.username);
    //   },
    // }),
    async (req, res, fn) => {
      try {
        let admin = await adminService.findOne({ email: req.body.email });

        if (!admin) {
          return res
            .status(404)
            .json({ success: false, message: "User doesnot exist" });
        }
        if (!admin.validPassword(req.body.password)) {
          return res
            .status(404)
            .json({ success: false, message: "Wrong password" });
          // return res.redirect("/login");
        }

        if (!admin.verify_user) {
          return res
            .status(404)
            .json({ success: false, message: "Please verify user." });
        }

        if (admin && !admin.two_way_auth) {
          let userDetail = await adminModel.findOne({ _id: admin._id });
          console.log("USERDETAIL", userDetail);
          req.session.user = userDetail;
          //resets previous brute retries on successful login
          // req.brute.reset(() => {
          //   return res.status(200).json({ "Login" :"Success"});
          // });
          return res
            .status(200)
            .json({ success: true, message: "login successfully" });

          // eslint-disable-next-line no-empty
        } else if (admin && admin.two_way_auth) {
          let token = randtoken.generate(10);

          let expiryDate = new Date().getTime() + config.token.expiry;
          let updateData = {
            verify_login_token: token,
            verify_login_token_expires: new Date(expiryDate),
          };
          await adminService.findOneAndUpdate({ _id: admin._id }, updateData);

          let mailData = {
            to: admin.email,
            subject: "Verify User",
          };

          mailData["html"] =
            "Dear " +
            admin.username +
            ",<br><br>Your have requested to verify your account. Your token is: <br><b>Token: </b>" +
            token +
            "<br>Thank you.";
          await emailService.sendEmail(mailData);
          // req.brute.reset(() => {
          //   return res.redirect(`/verifylogin/${admin._id}`);
          // });
          return res.status(200).json({
            success: true,
            message:
              "login successfully now just add the token provided on mail",
          });
        }
      } catch (e) {
        fn("Errorrrrrrr", e);
      }
    }
  );

  // app.get("/verifylogin/:id", authController.verifyLoginView);
  app.post("/verifylogin/:id", async (req, res, next) => {
    await passport.authenticate("custom", async (err, user) => {
      if (user) {
        let updateData = {
          verify_login_token: null,
          verify_login_token_expires: null,
        };

        await adminService.findOneAndUpdate({ _id: user._id }, updateData);
        let userDetail = await adminModel.findOne({ _id: user._id }).exec();
        req.session.user = userDetail;
        return res
          .status(200)
          .json({ Success: true, message: "Login Successfull" });
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
    [forgotAdminPasswordValidation],
    authController.forgotPassword
  );
  // app.get("/reset-password/:token", authController.resetPasswordView);
  app.post(
    "/reset-password/:token",
    [resetAdminPasswordValidation],
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
    return res.redirect("404");
  });
};
