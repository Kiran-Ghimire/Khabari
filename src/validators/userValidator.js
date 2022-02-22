const { checkSchema } = require("express-validator/check");

const { userModel } = require("../models");

let changePasswordValidation = checkSchema({
  password: {
    isLength: {
      errorMessage: "Password is required",
      options: { min: 1 },
    },
    custom: {
      options: (value) => {
        if (value.length >= 6 && value.length <= 20) {
          return true;
        } else {
          throw new Error(
            "Password must be between 6 and 20 characters",
            "password",
            412
          );
        }
      },
    },
  },
  confirm_password: {
    isLength: {
      errorMessage: "Confirm password is required",
      options: { min: 1 },
    },
    custom: {
      options: (value, { req }) => {
        if (value === req.body.password) {
          return true;
        } else {
          throw new Error("Password do not match");
        }
      },
    },
  },
});

let forgotUserPasswordValidation = checkSchema({
  email: {
    isLength: {
      errorMessage: "Email is required",
      options: { min: 1 },
    },
    isEmail: {
      errorMessage: "Not a valid email",
    },
    custom: {
      options: async (value) => {
        return new Promise((resolve, reject) => {
          userModel
            .findOne({ email: value })
            .then((user) => {
              if (user === null) {
                reject("Email address does not exist");
              } else {
                resolve(true);
              }
            })
            .catch(() => {
              resolve(true);
            });
        });
      },
    },
  },
});

let resetUserPasswordValidation = checkSchema({
  password: {
    isLength: {
      errorMessage: "Password is required",
      options: { min: 1 },
    },
    custom: {
      options: (value) => {
        if (value.length >= 6 && value.length <= 20) {
          return true;
        } else {
          throw new Error(
            "Password must be between 6 and 20 characters",
            "password",
            412
          );
        }
      },
    },
  },
  confirm_password: {
    isLength: {
      errorMessage: "Confirm password is required",
      options: { min: 1 },
    },
    custom: {
      options: (value, { req }) => {
        if (value === req.body.password) {
          return true;
        } else {
          throw new Error("Password do not match");
        }
      },
    },
  },
});

module.exports = {
  changePasswordValidation,
  forgotUserPasswordValidation,
  resetUserPasswordValidation,
};
