let mp4FilePath = '';

const getMp4FilePath = () => {
  return mp4FilePath;
};

const setMp4FilePath = path => {
  mp4FilePath = path;
};

module.exports = {
  getMp4FilePath,
  setMp4FilePath
};
