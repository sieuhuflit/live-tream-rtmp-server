const mongoose = require('mongoose');
const { exec } = require('child_process');

const Room = mongoose.model('Room');
const Utils = require('../utils');
const LiveStatus = require('../liveStatus');

module.exports = (io) => {
  function emitListLiveStreamInfo() {
    return Room.find({}, (error, results) => {
      io.emit('list-live-stream', results);
    });
  }

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

    /**
     * Join live stream room
     */
    socket.on('join-room', (data) => {
      console.log('Join room', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      socket.join(roomName);
    });

    /**
     * Leave live stream room
     */
    socket.on('leave-room', (data) => {
      console.log('Leave room', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      socket.leave(roomName);
    });

    /**
     * The host join the room and prepare live stream
     */
    socket.on('prepare-live-stream', (data) => {
      console.log('Prepare live stream', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.PREPARE, createdAt: Utils.getCurrentDateTime() },
        { new: true, useFindAndModify: false }
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

    /**
     * When user begin live stream
     */
    socket.on('begin-live-stream', (data) => {
      console.log('Begin live stream', data);
      const { userName, roomName } = data;
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.ON_LIVE, beginAt: Utils.getCurrentDateTime() },
        { new: true, useFindAndModify: false }
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

    /**
     * When user finish live stream action
     */
    socket.on('finish-live-stream', (data) => {
      console.log('Finish live stream');
      const { userName, roomName } = data;
      const filePath = Utils.getMp4FilePath();
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.FINISH, filePath },
        { new: true, useFindAndModify: false }
      ).exec((error, updatedData) => {
        if (error) return;
        io.in(roomName).emit('finish-live-stream', updatedData);
        socket.leave(roomName);
        return emitListLiveStreamInfo();
      });
    });

    /**
     * User send heart to room
     */
    socket.on('send-heart', (data) => {
      console.log('Send heart');
      const { roomName = '' } = data;
      io.in(roomName).emit('send-heart');
    });

    /**
     * User send message to room
     */
    socket.on('send-message', (data) => {
      console.log('Send message');
      const { roomName = '', message, userName } = data;
      return Room.findOneAndUpdate(
        { roomName },
        {
          $push: { messages: { message, userName, createdAt: Utils.getCurrentDateTime() } },
        },
        { new: true, useFindAndModify: false },
        (err, result) => {
          io.in(roomName).emit('send-message', result);
        }
      );
    });

    /**
     * Try to replay video
     */
    socket.on('replay', (data) => {
      console.log('Replay video');
      const { roomName, userName } = data;
      Room.findOne({ roomName }).exec((error, result) => {
        socket.emit('replay', result);
        const { filePath } = result;
        const commandExec = `ffmpeg -re -i ${filePath} -c:v libx264 -preset superfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ac 2 -ar 44100 -f flv rtmp://localhost/live/${roomName}/replayFor${userName}`;
        console.log('Command execute : ', commandExec);
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
  });
};
