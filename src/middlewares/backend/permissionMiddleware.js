const _ = require("lodash");
const { adminModel } = require("../../models");

module.exports = {
  checkPermission(permission) {
    return function (req, res, next) {
      if (req.session.user) {
        if (req.session.user.role_id.slug === "superadmin") {
          return next();
        } else {
          return adminModel
            .findOne({ email: req.session.user.email })
            .populate("role_id") // multiple path names in one requires mongoose >= 3.6
            .then((response) => {
              if (
                response !== null &&
                _.includes(response.role_id.permission, permission)
              ) {
                return next();
              } else {
                return res.status(403).json({ message: "Error/403" });
              }
            });
        }
      }
      res.status(403).json({ message: "Error/403" });
    };
  },
};
