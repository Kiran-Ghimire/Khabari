const _ = require("lodash");
const moment = require("moment");

const { translationModel } = require("../models");
// const { formatDate } = require('../helpers');
const cmsTitle = require("../config").cmsTitle;

let localFunctionLoader = {};
localFunctionLoader.init = async (app) => {
  app.locals._ = _;
  app.locals.cmsTitle = cmsTitle;

  const memorizeTranslateWords = [];
  app.locals.translateLanguage = (variable, translationData) => {
    variable = Array.isArray(variable) ? variable[0] : variable;
    variable = variable ? variable.trim() : variable;
    if (translationData === undefined) {
      translationData = "en";
    }
    const lang = translationData === "en" ? "English" : "Japanese";
    const data = _.find(translationData, {
      word: variable,
    });

    if (data === undefined) {
      if (memorizeTranslateWords.includes(variable)) {
        return variable;
      } else {
        memorizeTranslateWords.push(variable);
      }

      translationModel
        .find({
          word: variable,
        })
        .then((trans) => {
          if (trans.length === 0) {
            let inputData = {};
            inputData.word = variable;
            inputData.language = lang;
            new translationModel(inputData).save().then((translation) => {
              return translation.word;
            });
          }
        });
    }

    return data && data.translation ? data.translation : variable;
  };

  app.locals.getDuration = (date) => {
    let newDate = date.split("/");
    let m1 = moment().format("YYYY-MM");
    let m2 = moment(newDate[1] + "-" + newDate[0]).format("YYYY-MM");
    let diff = moment.preciseDiff(m1, m2);
    return diff;
  };

  app.locals.formatDate = (date, format) => {
    return formatDate(date, format);
  };

  app.locals.checkPermissions = (user, permission) => {
    if (user !== null) {
      if (user.role_id.slug === "superadmin") {
        return true;
      } else {
        if (user !== null && _.includes(user.role_id.permission, permission)) {
          return true;
        } else {
          return false;
        }
      }
    }
    return false;
  };
};

module.exports = localFunctionLoader;
