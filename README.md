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

## Config port and Database

- Edit in config/sit.json file

```json
{
  "API": {
    "PORT": 3333,
    "NAME": "localhost"
  },
  "DB_STRING": "mongodb://127.0.0.1:27017/livestream?authSource=admin"
}
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

```js
context.nodeEvent.emit(
  'getFilePath',
  this.conf.streamPath,
  ouPath,
  mp4FileName
);
```

Under

```js
Logger.log(
  '[Transmuxing MP4] ' +
    this.conf.streamPath +
    ' to ' +
    ouPath +
    '/' +
    mp4FileName
);
```
