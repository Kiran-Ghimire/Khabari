const dotenv = require("dotenv");
dotenv.config();

let config = {
  cmsTitle: process.env.CMSTITLE || "Khabari",
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  cmsUrl: process.env.CMSURL || "http://localhost:3000/",
  clientUrl: process.env.CLIENTURL || "http://localhost:5000/",
  databaseURL: process.env.DBCONFIG || "mongodb://localhost:27017/khabari",
  pageLimit: process.env.PAGELIMIT ? parseInt(process.env.PAGELIMIT) : 10,

  mail: {
    mailSender: process.env.MAIL_SENDER || "mailgun",
    mailEmail: process.env.MAIL_EMAIL || "info@ekbana.com",
    mailApiKey:
      process.env.MAIL_API_KEY || "key-1443c655d9e02a4fa75a08974d0125e5",
    mailApiDomain: process.env.MAIL_API_DOMAIN || "mh.ekbana.net",
    mailFrom: process.env.MAIL_FROM || "info@ekbana.info",
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
