const moment = require('moment-timezone');

let mp4FilePath = '';

const getMp4FilePath = () => mp4FilePath;

const setMp4FilePath = (path) => {
  mp4FilePath = path;
};

const getCurrentDateTime = () => {
  const a = moment().tz('Asia/Ho_Chi_Minh');
  const currentDateTime = a.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  return currentDateTime;
};

module.exports = {
  getMp4FilePath,
  setMp4FilePath,
  getCurrentDateTime,
};
