# 📺 Live stream RTMP server

### Live stream using RTMP for React Native App Live Stream

Client: https://github.com/sieuhuflit/react-native-live-stream-rtmp-example

## Demo v2

**Note: Here is demo for version 2.0**

<img src="demo/1.png" width="260" title="hover text">

## Demo v1

**Note: Here is demo for version 1.0**

| Streamer                                                                                                                  | Viewer                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| <img src="https://raw.githubusercontent.com/sieuhuflit/react-native-live-stream-rtmp-example/master/demo/streamer.gif" /> | <img src="https://raw.githubusercontent.com/sieuhuflit/react-native-live-stream-rtmp-example/master/demo/viewer.gif" /> |

## Feature

- ✅ Live Stream with input username account
- ✅ The video can replay
- ✅ Live update status when `Pending`, `On Live`, and `Finish` live streaming process
- ✅ Streamer and viewer can chat and send heart when livestream

## Teachnology using

- Using node-media-server

## Prerequisite

- Install NodeJS (https://nodejs.org)
- Install ffmpeg (https://www.ffmpeg.org/download.html). If you are using MacOS just type _brew install ffmpeg_
- MongoDB (https://www.mongodb.com/)

Then start MongoDB. Then type the following to terminal

```
# mongo
```

Then switch to admin database

```
> use admin
```

Then create user admin

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

## Get Start

```
yarn install
node server.js
```

## Want to Replay video

`Concept`: After live stream finish, the mp4 file will generate and save to folder `media/*` folder.
We need to do this step to get exact mp4 path information and save it to MongoDB.

Open this file `node_modules/node_media_server/node_trans_session.js`. Then import this to the top

```js
const context = require('./node_core_ctx');
```

Then add this

```js
context.nodeEvent.emit('getFilePath', this.conf.streamPath, ouPath, mp4FileName);
```

Under this line

```js
Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + mp4FileName);
```

The result look similar like this

```js

// ...
// ===> ADD THIS LINE
const context = require("./node_core_ctx");
// ...

class NodeTransSession extends EventEmitter {
  constructor(conf) {
    super();
    this.conf = conf;
  }

  run() {
    // ...
    // Rest of stuff
    // ...
    if (this.conf.mp4) {
      this.conf.mp4Flags = this.conf.mp4Flags ? this.conf.mp4Flags : '';
      let now = new Date();
      let mp4FileName = dateFormat('yyyy-mm-dd-HH-MM') + '.mp4';
      let mapMp4 = `${this.conf.mp4Flags}${ouPath}/${mp4FileName}|`;
      mapStr += mapMp4;
      Logger.log('[Transmuxing MP4] ' + this.conf.streamPath + ' to ' + ouPath + '/' + mp4FileName);

      // ===> ADD THIS LINE
      context.nodeEvent.emit("getFilePath", this.conf.streamPath, ouPath, mp4FileName);
    }

    //...
  }
```

## Common Problem

`1/ I can't replay the video ?`

Sometimes the video can't replay, you need to wait a little bit wait the saving mp4 file process finish, then you can replay the video.

## License

[MIT](https://choosealicense.com/licenses/mit/)
