const { validationResult } = require("express-validator");
const randtoken = require("rand-token");
const bcrypt = require("bcryptjs");

const { adminService, emailService } = require("../services");
const config = require("../config");
const { adminModel } = require("../models");

let loginController = {
  // authToggle: async(req, res, fn) => {
  //     const currentUser = req.session.user._id;
  //     const {authToggle} = req.body;
  //     console.log(req.body);
  //     try {
  //         let admin = await adminModel.findById(currentUser);

  //         if(admin){
  //             admin.two_way_auth = authToggle;
  //             await admin.save();

  //         }
  //     } catch(error) {
  //         fn(error);
  //     }
  // },

  forgotPassword: async (req, res, fn) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("errors", errors.mapped());
      req.flash("inputData", req.body);
      return res.redirect("/forgot-password");
    }
    try {
      let admin = await adminService.findOne({ email: req.body.email });
      if (admin) {
        let token = randtoken.generate(10);
        let expiryDate = new Date().getTime() + config.token.expiry;
        let updateData = {
          reset_password_token: token,
          reset_password_expires: new Date(expiryDate),
        };
        await adminService.findOneAndUpdate(
          { email: req.body.email },
          updateData
        );

        let mailData = {
          to: req.body.email,
          subject: "Password Reset",
        };
        let resetLink = config.cmsUrl + "reset-password/" + token;
        mailData["html"] =
          "Dear " +
          admin.username +
          ",<br><br>Your have requested to recover password for you account. Please click the link below to reset your password. Link will be valid for 1 day only. <br><b>Link: </b><a href='" +
          resetLink +
          "'>" +
          resetLink +
          "</a><br>Thank you.";
        await emailService.sendEmail(mailData);
      } else {
        return res
          .status(404)
          .json({ Success: false, message: "Email address does not exist" });
      }
      return res.status(200).json({
        Success: true,
        message: "Password reset link is sent to your mail",
      });
    } catch (e) {
      fn(e);
    }
  },
  // resetPasswordView : async(req, res, fn) => {
  //     let token = req.params.token;
  //     try {
  //         let currentDate = new Date();
  //         let admin = await adminService.findOne({'reset_password_token': token});
  //         if (admin && admin.reset_password_token==token && currentDate < admin.reset_password_expires) {
  //             logCrmEvents(req, "Page Visit", "success", {message: "Reset Password Page"});
  //             return res.render('auth/reset-password', {layout: false, token: req.params.token});
  //         } else {
  //             req.flash('error_msg', 'Reset link is invalid or expired.');
  //             return res.redirect("/login");
  //         }
  //     } catch(e) {
  //         fn(e);
  //     }
  // },
  resetPassword: async (req, res, fn) => {
    let token = req.params.token;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("errors", errors.mapped());
      return res.redirect("/reset-password/" + token);
    }
    try {
      let currentDate = new Date();
      let admin = await adminService.findOne({ reset_password_token: token });
      if (
        admin &&
        admin.reset_password_token == token &&
        currentDate < admin.reset_password_expires
      ) {
        let hashPassword = await bcrypt.hashSync(
          req.body.password,
          bcrypt.genSaltSync(10),
          null
        );
        await adminService.findOneAndUpdate(
          { reset_password_token: token },
          {
            password: hashPassword,
            updated_at: new Date(),
            reset_password_token: "",
            reset_password_expires: null,
          }
        );
        // req.flash("success_msg", "Password reset successful");
        // logCrmEvents(req, "Event", "success", {
        //   message: "Password reset successful",
        // });
        return res
          .status(200)
          .json({ Success: true, message: "Password reset successfull" });
      } else {
        return res
          .status(404)
          .json({ Success: false, message: "Password reset unsuccessfull" });
      }
    } catch (e) {
      fn(e);
    }
  },
};

module.exports = loginController;
