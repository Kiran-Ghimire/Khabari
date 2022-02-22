const LocalStrategy = require("passport-local").Strategy;

const BearerStrategy = require("passport-http-bearer").Strategy;
const CustomStrategy = require("passport-custom").Strategy;

const { accessTokenModel, userModel } = require("../models");

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    userModel.findById(id, function (err, user) {
      done(err, user);
    });
  });

  passport.use(
    "custom",
    new CustomStrategy((req, done) => {
      userModel.findOne(
        { verify_login_token: req.body.token },
        async (err, user) => {
          if (err) {
            return done(null, false, { error: err });
          }
          if (!user) {
            return done(null, false, { message: "Account does not exist." });
          }
          return done(null, user);
        }
      );
    })
  );

  passport.use(
    "custom-signup",
    new CustomStrategy((req, done) => {
      userModel.findOne(
        { verify_user_token: req.body.token },
        async (err, user) => {
          if (err) {
            return done(null, false, { error: err });
          }
          if (!user) {
            return done(null, false, { message: "Account does not exist." });
          }
          return done(null, user);
        }
      );
    })
  );

  passport.use(
    new LocalStrategy((username, password, done) => {
      userModel.findOne({ username: username }, async (err, user) => {
        if (err) {
          return done(null, false, { error: err });
        }
        if (!user) {
          return done(null, false, { message: "Account does not exist." });
        }
        if (!user.validPassword(password)) {
          return done(null, false, {
            message: "Username and Password do not match.",
          });
        }
        if (user.status !== "active") {
          return done(null, false, {
            message:
              "Your account is not active. Please contact administrator.",
          });
        }
        return done(null, user);
      });
    })
  );

  passport.use(
    "local-login",
    new LocalStrategy((username, password, done) => {
      userModel.findOne({ username: username }, async (err, user) => {
        if (err) {
          return done(null, false, { error: err });
        }
        if (!user) {
          return done(null, false, { message: "Account does not exist." });
        }
        if (!user.validPassword(password)) {
          return done(null, false, {
            message: "Username and Password do not match.",
          });
        }
        if (user.status !== "active") {
          return done(null, false, {
            message:
              "Your account is not active. Please contact administrator.",
          });
        }
        return done(null, user);
      });
    })
  );

  passport.use(
    new BearerStrategy(async (accessToken, done) => {
      let token = await accessTokenModel.findOne({ token: accessToken });
      if (token) {
        if (new Date().getTime() > new Date(token.token_expiry).getTime()) {
          await accessTokenModel.deleteOne({ token: accessToken });
          return done(null, false, { message: "Token expired" });
        } else {
          let user = await userModel.findOne({ _id: token.user });
          done(null, user, {});
        }
      } else {
        done(null, false, { message: "Unauthorized" });
      }
    })
  );
};
