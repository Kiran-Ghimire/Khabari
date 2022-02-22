const Mailgun = require("mailgun-js");
const config = require("../config");

let emailService = {
  sendEmail: async (data) => {
    try {
      let mailgun = new Mailgun({
        apiKey: config.mail.mailApiKey,
        domain: config.mail.mailApiDomain,
      });
      let emailData = {
        from: config.projectTitle + " <" + config.mail.mailFrom + ">",
        to: data.to,
        subject: data.subject,
        html: data.html,
      };
      mailgun.messages().send(emailData, function (err, body) {
        if (err) {
          return err;
        } else {
          return body;
        }
      });
    } catch (err) {
      console.log(err);
      return err;
    }
  },
};

module.exports = emailService;
