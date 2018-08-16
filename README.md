# live-tream-rmtp-server

Live stream using RTMP for React Native App Live Stream

![Streamer user - IOS Real Device](https://media.giphy.com/media/2xDzufTCpkL6OzoJ0a/giphy.gif) ![Viewer user - IOS Simulator](https://media.giphy.com/media/2xDzufTCpkL6OzoJ0a/giphy.gif)

## Teachnology using

Using node-media-server. Client using Node media client

- [Client React Native](https://github.com/sieuhuflit/react-native-live-stream-rtmp-example)

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
