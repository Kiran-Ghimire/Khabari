const { validationResult } = require("express-validator");
const randtoken = require("rand-token");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const { userService, emailService } = require("../services");
const config = require("../config");
const { userModel } = require("../models");

let loginController = {
  forgotPassword: async (req, res, fn) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("errors", errors.mapped());
      req.flash("inputData", req.body);
      return res.redirect("/forgot-password");
    }
    try {
      let user = await userService.findOne({ email: req.body.email });
      if (user) {
        let token = randtoken.generate(10);
        let expiryDate = new Date().getTime() + config.token.expiry;
        let updateData = {
          reset_password_token: token,
          reset_password_expires: new Date(expiryDate),
        };
        await userService.findOneAndUpdate(
          { email: req.body.email },
          updateData
        );

        let resetLink = config.projectUrl + "reset-password/" + token;
        const mailData =
          `
            <p>Dear  ` +
          user.username +
          `, </p>
            <p>Your have requested to recover password for you account. Your  token is given below. Token will be valid for 1 day only.  </p>
           
            <ul>
                <li>Token: ` +
          token +
          `</li>
          <li>Link: ` +
          resetLink +
          `</li>
            </ul>
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
          to: req.body.email,
          subject: "Forgot Password", // Subject line
          html: mailData, // plain text body
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if (err) {
            return console.log(err);
          }
          console.log("MAILINFO", info);
        });
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

  resetPassword: async (req, res, fn) => {
    let token = req.params.token;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // req.flash("errors", errors.mapped());
      return res.status(404).json({ Error: "Error" });
    }
    try {
      let currentDate = new Date();
      let user = await userService.findOne({ reset_password_token: token });
      if (
        user &&
        user.reset_password_token == token &&
        currentDate < user.reset_password_expires
      ) {
        let hashPassword = await bcrypt.hashSync(
          req.body.password,
          bcrypt.genSaltSync(10),
          null
        );
        await userService.findOneAndUpdate(
          { reset_password_token: token },
          {
            password: hashPassword,
            updated_at: new Date(),
            reset_password_token: "",
            reset_password_expires: null,
          }
        );
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
