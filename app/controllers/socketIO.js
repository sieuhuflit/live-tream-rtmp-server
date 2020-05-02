const mongoose = require('mongoose');
const { exec } = require('child_process');

const Room = mongoose.model('Room');
const Utils = require('../utils');
const LiveStatus = require('../liveStatus');

// const roomList = {};

const DEFAULT_ROOM_NAME = 'user1';

module.exports = (io) => {
  // function socketIdsInRoom(roomName) {
  //   const socketIds = io.nsps['/'].adapter.rooms[roomName].sockets;
  //   if (socketIds) {
  //     const collection = [];
  //     for (const key in socketIds) {
  //       collection.push(key);
  //     }
  //     return collection;
  //   }
  //   return [];
  // }

  // function createNewRoom(roomName) {
  //   roomList[roomName] = {
  //     participants: [],
  //     countHeart: 0,
  //     countViewer: 1,
  //     messages: [],
  //   };
  // }

  function emitListLiveStreamInfo() {
    return Room.find({}, (error, results) => {
      io.emit('list-live-stream', results);
    });
  }

  // function findParticipant(socketId) {
  //   for (const roomName in roomList) {
  //     for (let i = 0; i < roomList[roomName].participant.length; i++) {
  //       if (roomList[roomName].participant[i].socketId == socketId) {
  //         return roomList[roomName].participant[i];
  //       }
  //     }
  //   }
  //   return null;
  // }

  io.on('connection', (socket) => {
    console.log('New connection');

    /**
     * Get list live stream information
     */
    socket.on('list-live-stream', () => {
      return Room.find({}, (error, results) => {
        socket.emit('list-live-stream', results);
      });
    });

    socket.on('join-room', (data) => {
      console.log('Join room', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      socket.join(roomName);
    });

    socket.on('leave-room', (data) => {
      console.log('Leave room', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      socket.leave(roomName);
    });

    socket.on('prepare-live-stream', (data) => {
      console.log('Prepare live stream', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.PREPARE },
        { new: true, useFindAndModify: false, updatedAt: Utils.getCurrentDateTime() }
      ).exec((error, foundRoom) => {
        if (error) return;
        if (foundRoom) return emitListLiveStreamInfo();
        const condition = {
          userName,
          roomName,
          liveStatus: LiveStatus.PREPARE,
        };
        return Room.create(condition).then((createdData) => {
          emitListLiveStreamInfo();
        });
      });
    });

    socket.on('begin-live-stream', (data) => {
      console.log('Begin live stream', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.ON_LIVE },
        { new: true, useFindAndModify: false, updatedAt: Utils.getCurrentDateTime() }
      ).exec((error, foundRoom) => {
        if (error) return;
        if (foundRoom) {
          io.in(roomName).emit('begin-live-stream', foundRoom);
          return emitListLiveStreamInfo();
        }
        const condition = {
          userName,
          roomName,
          liveStatus: LiveStatus.ON_LIVE,
        };
        return Room.create(condition).then((createdData) => {
          io.in(roomName).emit('begin-live-stream', createdData);
          emitListLiveStreamInfo();
        });
      });
    });

    socket.on('finish-live-stream', (data) => {
      console.log('Finish live stream');
      const { userName, roomName } = data;
      const filePath = Utils.getMp4FilePath();
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.FINISH, filePath, updatedAt: Utils.getCurrentDateTime() },
        { new: true, useFindAndModify: false }
      ).exec((error, updatedData) => {
        if (error) return;
        io.in(roomName).emit('finish-live-stream', updatedData);
        socket.leave(roomName);
        return emitListLiveStreamInfo();
      });
    });

    socket.on('send-heart', (data) => {
      console.log('Send heart');
      const { roomName = '' } = data;
      io.in(roomName).emit('send-heart');
    });

    socket.on('send-message', (data) => {
      console.log('Send message');
      const { roomName = '', message, userName } = data;
      return Room.findOneAndUpdate(
        { roomName },
        {
          $push: { messages: { message, userName, createdAt: Utils.getCurrentDateTime() } },
        },
        { new: true, useFindAndModify: false, updatedAt: Utils.getCurrentDateTime() },
        (err, result) => {
          io.in(roomName).emit('send-message', result);
        }
      );
    });

    socket.on('replay', (data) => {
      console.log('Replay video');
      const { roomName, userName } = data;
      Room.findOne({ roomName }).exec((error, result) => {
        console.log('...... result found');
        console.log(result);
        socket.emit('replay', result);
        const { filePath } = result;
        const commandExec = `ffmpeg -re -i ${filePath} -c:v libx264 -preset superfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/${roomName}/replayFor${userName}`;
        console.log('..........');
        console.log(commandExec);
        exec(commandExec, (err, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
        });
      });
    });

    // socket.on('become-viewer', (data) => {
    //   console.log('become viewer');
    // });

    // socket.on('disconnect', () => {
    //   console.log('Disconnect');
    //   const { roomName, userId, liveStatus } = socket;
    //   for (const roomName in roomList) {
    //     for (let i = 0; i < roomList[roomName].participant.length; i++) {
    //       if (roomList[roomName].participant[i].socketId == socket.id) {
    //         socket.broadcast.to(roomName).emit('leave-client');
    //         roomList[roomName].participant.splice(i, 1);
    //         break;
    //       }
    //     }
    //     if (roomList.hasOwnProperty(roomName) && roomList[roomName].participant.length === 0) {
    //       delete roomList[roomName];
    //     }
    //   }
    //   if (socket.roomName) {
    //     socket.leave(socket.roomName);
    //   }
    //   console.log(JSON.stringify(roomList));
    //   if (liveStatus === LiveStatus.REGISTER) {
    //     Room.findOneAndRemove({ roomName, userId }).exec((error, result) => {
    //       console.log(error);
    //     });
    //   }
    // });

    // socket.on('join-server', (data, callback) => {
    //   console.log('join-server');
    //   const { roomName, userId } = data;
    //   socket.join(roomName);
    //   socket.roomName = roomName;
    //   socket.broadcast.to(roomName).emit('join-client');
    //   socketIds = socketIdsInRoom(roomName);
    //   roomList[roomName].countViewer += 1;
    //   roomList[roomName].participant.push({
    //     socketId: socket.id,
    //     userId,
    //   });
    //   console.log(JSON.stringify(roomList));
    //   callback(socketIds.length);
    // });

    // socket.on('leave-server', (data) => {
    //   console.log('leave-server');
    //   const { roomName, userId } = data;
    //   socket.leave(roomName);
    //   socket.roomName = null;
    //   socket.broadcast.to(roomName).emit('leave-client');
    // });

    // socket.on('register-live-stream', (data) => {
    //   console.log('register-live-stream');
    //   const liveStatus = LiveStatus.REGISTER;
    //   const { roomName, userId } = data;
    //   createNewRoom(roomName);
    //   roomList[roomName].participant.push({
    //     socketId: socket.id,
    //     userId,
    //   });
    //   socket.join(roomName);
    //   socket.roomName = roomName;
    //   socket.userId = userId;
    //   socket.liveStatus = liveStatus;
    //   socket.broadcast.to(roomName).emit('changed-live-status', { roomName, userId, liveStatus });
    //   return Room.findOne({ roomName, userId }).exec((error, foundRoom) => {
    //     if (foundRoom) {
    //       return;
    //     }
    //     const condition = {};
    //     condition.roomName = roomName;
    //     condition.userId = userId;
    //     condition.liveStatus = liveStatus;
    //     condition.createdAt = Utils.getCurrentDateTime();
    //     Room.create(condition);
    //   });
    // });

    // socket.on('begin-live-stream', (data) => {
    //   const liveStatus = LiveStatus.ON_LIVE;
    //   const { roomName, userId } = data;
    //   socket.liveStatus = liveStatus;
    //   Room.findOneAndUpdate(
    //     { roomName, userId },
    //     { liveStatus, createdAt: Utils.getCurrentDateTime() },
    //     { new: true }
    //   ).exec((error, result) => console.log(error));
    //   socket.broadcast.to(roomName).emit('changed-live-status', { roomName, userId, liveStatus });
    // });

    // socket.on('finish-live-stream', (data) => {
    //   const liveStatus = LiveStatus.FINISH;
    //   const { roomName, userId } = data;
    //   const filePath = Utils.getMp4FilePath();
    //   const { messages } = roomList[roomName];
    //   const { countViewer } = roomList[roomName];
    //   const { countHeart } = roomList[roomName];
    //   socket.liveStatus = liveStatus;

    //   Room.findOneAndUpdate(
    //     { roomName, userId },
    //     {
    //       liveStatus,
    //       filePath,
    //       countViewer,
    //       countHeart,
    //       messages,
    //     },
    //     { new: true }
    //   ).exec((error, result) => console.log(error));
    //   socket.broadcast.to(roomName).emit('changed-live-status', { roomName, userId, liveStatus });
    // });

    // socket.on('cancel-live-stream', (data) => {
    //   const liveStatus = LiveStatus.CANCEL;
    //   const { roomName, userId } = data;
    //   socket.broadcast.to(roomName).emit('changed-live-status', { roomName, userId, liveStatus });
    // });

    // socket.on('send-heart', (data) => {
    //   console.log('send-heart');
    //   const { roomName } = data;
    //   roomList[roomName].countHeart += 1;
    //   socket.broadcast.to(roomName).emit('send-heart');
    // });

    // socket.on('send-message', (data) => {
    //   console.log('send-message');
    //   const { roomName, userId, message, productId, productUrl, productImageUrl } = data;
    //   roomList[roomName].messages.push({
    //     userId,
    //     message,
    //     productId,
    //     productUrl,
    //     productImageUrl,
    //     createdAt: Utils.getCurrentDateTime(),
    //   });
    //   socket.broadcast.to(roomName).emit('send-message', {
    //     userId,
    //     message,
    //     productId,
    //     productUrl,
    //     productImageUrl,
    //   });
    // });

    // socket.on('replay', (data, callback) => {
    //   console.log('replay');
    //   const { roomName, userId } = data;
    //   console.log(data);

    //   Room.findOne({ roomName }).exec((error, result) => {
    //     callback(result);
    //     if (result !== null && result !== undefined) {
    //       const commandExec = `ffmpeg -re -i ${result.filePath} -c:v libx264 -preset superfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/${result.roomName}/replayfor${userId}`;
    //       exec(commandExec, (err, stdout, stderr) => {
    //         if (err) {
    //           console.log('...... FUCK');
    //           console.log(err);
    //           // node couldn't execute the command
    //           return;
    //         }
    //         // the *entire* stdout and stderr (buffered)
    //         console.log(`stdout: ${stdout}`);
    //         console.log(`stderr: ${stderr}`);
    //       });
    //     }
    //   });
    // });
  });
};
