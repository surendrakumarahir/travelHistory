/* eslint-disable object-shorthand,max-len */
const nodeMailer = require('nodemailer');
const OneSignal = require('onesignal-node');

const client = new OneSignal.Client(AppConfig.CONSTANT.ONE_SIGNAL.ANDROID.APP_ID,
  AppConfig.CONSTANT.ONE_SIGNAL.ANDROID.API_KEY);

function response(res, data, message, status, error) {
  const responseData = {
    status,
    message,
    data: data,
    error: error || null,
  };
  res.status(status);
  res.format({
    json: () => {
      res.json(responseData);
    },
  });
}

function sendMail(from, to, subject, text) {
  const transporter = nodeMailer.createTransport({
    service: ApppConfig.CONSTANT.MAIL.SERVICE.GMAIL,
    auth: {
      user: AppConfig.email,
      pass: AppConfig.password,
    },
  });

  const mailOptions = {
    from,
    to,
    subject,
    text,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}

const createNotification = async (obj) => {
  try {
    let playerIdArray = [];
    playerIdArray.push(obj.playerId)
    const notification = {
      headings: {
        "en": obj.title
      },
      contents: {
        "en": obj.body
      },
      include_player_ids: playerIdArray,
    };
    await client.createNotification(notification);
    return true
  } catch (e) {
    if (e instanceof OneSignal.HTTPError) {
      return false
    }
  }
}

module.exports = {
  response,
  sendMail,
  createNotification
};
