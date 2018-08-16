const mongoose = require('mongoose');
const config = require('config');
const moment = require('moment-timezone');
const { exec } = require('child_process');
const Room = mongoose.model('Room');
const Utils = require('../utils');
const LiveStatus = require('../liveStatus');
const roomList = {};

module.exports = io => {
  function socketIdsInRoom(roomName) {
    var socketIds = io.nsps['/'].adapter.rooms[roomName].sockets;
    if (socketIds) {
      var collection = [];
      for (var key in socketIds) {
        collection.push(key);
      }
      return collection;
    } else {
      return [];
    }
  }

  function createNewRoom(roomName, error) {
    // if (roomList.hasOwnProperty(roomName)) {
    //   if (error) error('Room already used.');
    // } else {
    roomList[roomName] = {
      participant: [],
      countHeart: 0,
      countViewer: 1,
      messages: []
    };
    // }
  }

  function findParticipant(socketId) {
    for (let roomName in roomList) {
      for (let i = 0; i < roomList[roomName].participant.length; i++) {
        if (roomList[roomName].participant[i].socketId == socketId) {
          return roomList[roomName].participant[i];
        }
      }
    }
    return null;
  }

  io.on('connection', socket => {
    console.log('connection');

    socket.on('disconnect', () => {
      console.log('Disconnect');
      const { roomName, userId, liveStatus } = socket;
      for (let roomName in roomList) {
        for (let i = 0; i < roomList[roomName].participant.length; i++) {
          if (roomList[roomName].participant[i].socketId == socket.id) {
            socket.broadcast.to(roomName).emit('leave-client');
            roomList[roomName].participant.splice(i, 1);
            break;
          }
        }
        if (
          roomList.hasOwnProperty(roomName) &&
          roomList[roomName].participant.length === 0
        ) {
          delete roomList[roomName];
        }
      }
      if (socket.roomName) {
        socket.leave(socket.roomName);
      }
      console.log(JSON.stringify(roomList));
      if (liveStatus === LiveStatus.REGISTER) {
        Room.findOneAndRemove({ roomName, userId }).exec((error, result) => {
          console.log(error);
        });
      }
    });

    socket.on('join-server', (data, callback) => {
      console.log('join-server');
      const { roomName, userId } = data;
      socket.join(roomName);
      socket.roomName = roomName;
      socket.broadcast.to(roomName).emit('join-client');
      socketIds = socketIdsInRoom(roomName);
      roomList[roomName].countViewer += 1;
      roomList[roomName].participant.push({
        socketId: socket.id,
        userId: userId
      });
      console.log(JSON.stringify(roomList));
      callback(socketIds.length);
    });

    socket.on('leave-server', data => {
      console.log('leave-server');
      const { roomName, userId } = data;
      socket.leave(roomName);
      socket.roomName = null;
      socket.broadcast.to(roomName).emit('leave-client');
    });

    socket.on('register-live-stream', data => {
      console.log('register-live-stream');
      const liveStatus = LiveStatus.REGISTER;
      const { roomName, userId } = data;
      createNewRoom(roomName);
      roomList[roomName].participant.push({
        socketId: socket.id,
        userId: userId
      });
      socket.join(roomName);
      socket.roomName = roomName;
      socket.userId = userId;
      socket.liveStatus = liveStatus;
      socket.broadcast
        .to(roomName)
        .emit('changed-live-status', { roomName, userId, liveStatus });
      return Room.findOne({ roomName, userId }).exec((error, foundRoom) => {
        if (foundRoom) {
          return;
        }
        const condition = {};
        condition.roomName = roomName;
        condition.userId = userId;
        condition.liveStatus = liveStatus;
        condition.createdAt = Utils.getCurrentDateTime();
        Room.create(condition);
      });
    });

    socket.on('begin-live-stream', data => {
      const liveStatus = LiveStatus.ON_LIVE;
      const { roomName, userId } = data;
      socket.liveStatus = liveStatus;
      Room.findOneAndUpdate(
        { roomName, userId },
        { liveStatus, createdAt: Utils.getCurrentDateTime() },
        { new: true }
      ).exec((error, result) => console.log(error));
      socket.broadcast
        .to(roomName)
        .emit('changed-live-status', { roomName, userId, liveStatus });
    });

    socket.on('finish-live-stream', data => {
      const liveStatus = LiveStatus.FINISH;
      const { roomName, userId } = data;
      const filePath = Utils.getMp4FilePath();
      const messages = roomList[roomName].messages;
      const countViewer = roomList[roomName].countViewer;
      const countHeart = roomList[roomName].countHeart;
      socket.liveStatus = liveStatus;

      Room.findOneAndUpdate(
        { roomName, userId },
        { liveStatus, filePath, countViewer, countHeart, messages },
        { new: true }
      ).exec((error, result) => console.log(error));
      socket.broadcast
        .to(roomName)
        .emit('changed-live-status', { roomName, userId, liveStatus });
    });

    socket.on('cancel-live-stream', data => {
      const liveStatus = LiveStatus.CANCEL;
      const { roomName, userId } = data;
      socket.broadcast
        .to(roomName)
        .emit('changed-live-status', { roomName, userId, liveStatus });
    });

    socket.on('send-heart', data => {
      console.log('send-heart');
      const { roomName } = data;
      roomList[roomName].countHeart += 1;
      socket.broadcast.to(roomName).emit('send-heart');
    });

    socket.on('send-message', data => {
      console.log('send-message');
      const {
        roomName,
        userId,
        message,
        productId,
        productUrl,
        productImageUrl
      } = data;
      roomList[roomName].messages.push({
        userId,
        message,
        productId,
        productUrl,
        productImageUrl,
        createdAt: Utils.getCurrentDateTime()
      });
      socket.broadcast.to(roomName).emit('send-message', {
        userId,
        message,
        productId,
        productUrl,
        productImageUrl
      });
    });

    socket.on('replay', (data, callback) => {
      console.log('replay');
      const { roomName, userId } = data;
      console.log(data);

      Room.findOne({ roomName }).exec((error, result) => {
        callback(result);
        if (result !== null && result !== undefined) {
          const commandExec = `ffmpeg -re -i ${
            result.filePath
          } -c:v libx264 -preset superfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/${
            result.roomName
          }/replayfor${userId}`;
          exec(commandExec, (err, stdout, stderr) => {
            if (err) {
              // node couldn't execute the command
              return;
            }
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
          });
        }
      });
    });
  });
};
