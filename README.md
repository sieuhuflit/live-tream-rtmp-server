# live-tream-rmtp-server

Live stream using RTMP for React Native App Live Stream

Client : https://github.com/sieuhuflit/react-native-live-stream-rtmp-example

## Demo

| Streamer                                                                                                             | Viewer                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| <img src="https://raw.githubusercontent.com/sieuhuflit/react-native-live-stream-rtmp-example/master/streamer.gif" /> | <img src="https://raw.githubusercontent.com/sieuhuflit/react-native-live-stream-rtmp-example/master/viewer.gif" /> |

## Teachnology using

Using node-media-server. Client using Node media client

## Install

```js
npm install
```

You must install ffmpeg to using

```js
brew install ffmpeg
```

```
mongo
use admin
db.createUser({user:"admin",pwd:"123456",roles:[{role:"userAdminAnyDatabase",db:"admin"}]})
```

## Edit MongoDB Authentication

- Edit in config/sit.json file and edit the YOUR_PASSWORD field

```javascript
...
mongoose.connect(
  config.get('DB_STRING'),
  { useNewUrlParser: true, user: 'admin', pass: 'YOUR_PASSWORD' },
  ...
);
...
```

## Running project

- Open terminal and type

```bash
pm2 start pm2.config.js --env sit
```

## Custom way to get mp4 file path

Add these line to node_modules/node_media_server/node_trans_session.js

Import this on top

```js
const context = require('./node_core_ctx');
```

Then add

```js
context.nodeEvent.emit('getFilePath', this.conf.streamPath, ouPath, mp4FileName);
```

Under this line

```js
Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + mp4FileName);
```

## Running Docker

First we need to build docker

```
docker-compose up -d --build
```

Then we list out container ID

```
docker ps
```

```
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                                      NAMES
57281a1e4106        egg-docker-template_nodejs   "docker-entrypoint.s…"   3 hours ago         Up 3 hours          127.0.0.1:7001->7001/tcp                   egg-docker-template_nodejs_1
596247f36cbe        egg-docker-template_nginx    "/bin/sh -c nginx"       3 hours ago         Up 3 hours          0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   egg-docker-template_nginx_1
9bcac416cd63        egg-docker-template_mongo    "docker-entrypoint.s…"   3 hours ago         Up 3 hours          127.0.0.1:27017->27017/tcp                 egg-docker-template_mongo_1
```

We need mongodb's container name or id , and use `exec` to enter using mongo container id

```
docker exec -it 12ac46c96b4d /bin/sh
```

now you enter container's shell, just only enter `mongo` to open mongodb, and create account.
switch to admin database

```
use admin
```

create admin user

```
db.createUser({
  user: 'admin',
  pwd: '123456',
  roles: [
    { role: 'userAdminAnyDatabase', db: 'admin' },
    { role: 'dbAdminAnyDatabase', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' }
  ]
})
```

```bash
docker-compose up
```

If you are using MacOS, run these syntax

```
ex -s -c '7i|const context = require("./node_core_ctx");' -c x node_modules/node-media-server/node_trans_session.js
ex -s -c '33i|context.nodeEvent.emit("getFilePath", this.conf.streamPath, ouPath, mp4FileName);' -c x  node_modules/node-media-server/node_trans_session.js
```

Then we connect to container then type this

```
sed -i '7 i\const context = require("./node_core_ctx");' node_modules/node-media-server/node_trans_session.js
sed -i '33 i\context.nodeEvent.emit("getFilePath", this.conf.streamPath, ouPath, mp4FileName);' node_modules/node-media-server/node_trans_session.js
```

