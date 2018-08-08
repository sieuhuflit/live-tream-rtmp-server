const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  text: {
    type: String,
    default: ''
  },
  created_at: {
    type: Number
  }
});

module.exports = mongoose.model('Message', MessageSchema, 'messages');
