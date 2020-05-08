const mongoose = require('mongoose');
const Utils = require('../utils');

const { Schema } = mongoose;

const RoomSchema = new Schema({
  userName: {
    type: String,
  },
  roomName: {
    type: String,
  },
  liveStatus: {
    type: Number,
    default: 0,
  },
  filePath: {
    type: String,
    default: '',
  },
  messages: {
    type: Array,
  },
  countViewer: {
    type: Number,
    default: 1,
  },
  countHeart: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Utils.getCurrentDateTime(),
  },
  beginAt: {
    type: Date,
    default: Utils.getCurrentDateTime(),
  },
});

module.exports = mongoose.model('Room', RoomSchema, 'rooms');
