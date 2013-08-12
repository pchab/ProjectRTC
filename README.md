# ProjectRTC

## WebRTC Live Streaming

- Node.js server
- Desktop client
- [Android client](https://github.com/pchab/AndroidRTC)

The signaling part is done with [socket.io](socket.io).
The client follows a MVVM pattern [knockoutjs](http://knockoutjs.com/)

Most of the time, the latest version of the server is running [here](http://54.214.218.3:3000)

Firefox is not fully supported yet : https://bugzilla.mozilla.org/show_bug.cgi?id=844295

## Install

It requires [node.js](http://nodejs.org/download/)

* git clone https://github.com/pchab/ProjectRTC.git
* cd ProjectRTC/
* npm install
* npm start

The server will run on port 3000.
You can test it in the (Chrome) browser at localhost:3000.

## Author

- Pierre Chabardes
