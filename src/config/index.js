const dotenv = require("dotenv");
dotenv.config();

let config = {
  projectTitle: process.env.PROJECTTITLE || "Khabari",
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  projectUrl: process.env.PROJECTURL || "http://localhost:3000/",
  clientUrl: process.env.CLIENTURL || "http://localhost:5000/",
  databaseURL: process.env.DBCONFIG || "mongodb://localhost:27017/khabari",
  pageLimit: process.env.PAGELIMIT ? parseInt(process.env.PAGELIMIT) : 10,


  mail: {
    mailSender: process.env.MAIL_SENDER || "mailgun",
    mailEmail: process.env.MAIL_EMAIL ,
    mailApiKey:
      process.env.MAIL_API_KEY ,
    mailApiDomain: process.env.MAIL_API_DOMAIN  ,
    mailFrom: process.env.MAIL_FROM ,
    mailUser: process.env.MAIL_USER,
    mailPassword: process.env.MAIL_PASSWORD
  },
  token: {
    expiry: parseInt(process.env.EXPIRY_TIME) || 86400000,
    length: 400,
  },
  throttle: {
    freeTries: process.env.FREE_TRIES || 5,
    waitTime: process.env.WAIT_TIME_IN_SEC || 60,
  },
};

module.exports = config;
