const { NodeMediaServer } = require('node-media-server');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const utils = require('./app/utils');

const shopmodelsPath = `${__dirname}/app/models/`;
fs.readdirSync(shopmodelsPath).forEach((file) => {
  if (~file.indexOf('.js')) {
    require(`${shopmodelsPath}/${file}`);
  }
});

const server = http.createServer(app);
/* eslint-disable-next-line */
const io = require('socket.io').listen(server);
require('./app/controllers/socketIO')(io);

mongoose.Promise = global.Promise;
global.appRoot = path.resolve(__dirname);

mongoose.connect('mongodb://localhost:27017/livestream', (err) => {
  if (err) {
    console.log('....................... ERROR CONNECT TO DATABASE');
    console.log(err);
  } else {
    console.log('....................... CONNECTED TO DATABASE');
  }
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.set('socketio', io);
app.set('server', server);
app.use(express.static(`${__dirname}/public`));

server.listen(3333, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`listening on port 3333`);
  }
});

const nodeMediaServerConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*',
  },
  trans: {
    ffmpeg: '/usr/local/bin/ffmpeg',
    tasks: [
      {
        app: 'live',
        ac: 'aac',
        mp4: true,
        mp4Flags: '[movflags=faststart]',
      },
    ],
  },
};

const nms = new NodeMediaServer(nodeMediaServerConfig);
nms.run();

nms.on('getFilePath', (streamPath, oupath, mp4Filename) => {
  console.log('---------------- get file path ---------------');
  console.log(streamPath);
  console.log(oupath);
  console.log(mp4Filename);
  utils.setMp4FilePath(`${oupath}/${mp4Filename}`);
});

nms.on('preConnect', (id, args) => {
  console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('postConnect', (id, args) => {
  console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('doneConnect', (id, args) => {
  console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on prePublish]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on postPublish]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on donePublish]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on prePlay]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on postPlay]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log(
    '[NodeEvent on donePlay]',
    `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
  );
});
