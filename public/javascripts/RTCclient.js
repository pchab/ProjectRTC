function RTCconnection(id, parent) {
  var self = this;
  this.id = id;
  this.parent = parent;
  this.pc;
  this.remoteVideoEl = document.createElement('video');
  
  this.initPeerConnection = function() {
    this.pc = new RTCPeerConnection(parent.config.peerConnectionConfig, parent.config.peerConnectionConstraints);
    this.pc.onicecandidate = function(event) {
      if (event.candidate) {
        self.send('candidate', {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    this.pc.onaddstream = function(event) {
      attachMediaStream(self.remoteVideoEl, event.stream);
      parent.remoteVideosContainer.appendChild(self.remoteVideoEl);
    };
  };
  
  this.handleMessage = function (message) {
    console.log('receiving ' + message.type + ' from ' + message.from);
    switch (message.type) {
    case 'offer':
        this.pc.addStream(parent.localStream);
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        this.answer();
        break;
    case 'answer':
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        break;
    case 'stop':
        this.send('closed', null);
        this.initPeerConnection();
        break;
    case 'closed':
        parent.remoteVideosContainer.removeChild(self.remoteVideoEl);
        this.initPeerConnection();
        break;
    case 'candidate':
        if(this.pc.remoteDescription) {
          this.pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
            })
          );
        }
        break;
    }
  };
  
  this.answer = function() {
    this.pc.createAnswer(
      function (sessionDescription) {
        self.pc.setLocalDescription(sessionDescription);
        self.send('answer', sessionDescription);
      }, 
      function(error) { 
        console.log(error);
      },
      parent.config.mediaConstraints
    );
  };
  
  this.offer = function() {
    this.pc.createOffer(
      function (sessionDescription) {
        self.pc.setLocalDescription(sessionDescription);
        self.send('offer', sessionDescription);
      }, 
      function(error) {
        console.log(error);
      }, 
      parent.config.mediaConstraints
    );
  };
  
  this.send = function(type, payload) {
    console.log('sending ' + type + ' to ' + this.id);
    parent.connection.emit('message', {
      to: self.id,
      type: type,
      payload: payload
    });
  };
  
  this.initPeerConnection();
}

function RTCclient () {
  var self = this;
  this.id;
  this.peerConnections = {};
  this.config = {
    url: window.location.origin,
    peerConnectionConfig: {
      iceServers: [{"url": "stun:23.21.150.121"}
                  ,{"url": "stun:stun.l.google.com:19302"}]
    },
    peerConnectionConstraints: {
      optional: [{"DtlsSrtpKeyAgreement": true}]
    },
    media: {
      audio:true,
      video: {
        mandatory: {
          // maxHeight: 240,
          // maxWidth: 320
        },
        optional: []
      }
    },
    mediaConstraints: {
      'mandatory': {
          'OfferToReceiveAudio': true,
          'OfferToReceiveVideo': true
      }
    }
  };
  this.connection = io.connect(this.config.url);
  this.localStream;
  this.remoteVideosContainer = document.getElementById('remoteVideosContainer');
  
  this.connection.on('message', function(message) {
    if (self.peerConnections[message.from]) {
      var peer = self.peerConnections[message.from];
    } else {
      var peer = new RTCconnection(message.from, self);
      self.peerConnections[message.from] = peer;
    }
    peer.handleMessage(message);
  });
  
  this.connection.on('id', function(id) {
    self.id = id;
  });
  
  this.peerOffer = function(id) {
    if (this.peerConnections[id]) {
      this.peerConnections[id].pc.addStream(this.localStream);
    } else {
      var peer = new RTCconnection(id, self);
      this.peerConnections[id] = peer;
      peer.offer();
    }    
  };
}
