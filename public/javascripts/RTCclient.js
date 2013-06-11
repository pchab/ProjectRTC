function RTCconnection(id, parent) {
  var self = this;
  this.id = id;
  this.parent = parent;
  this.pc;
  this.state = ko.observable('Available');
  this.remoteVideoEl = document.createElement('video');
  
  this.handleMessage = function (message) {
    console.log('receiving ' + message.type + ' from ' + message.from);
    switch (message.type) {
    case 'offer':
        self.pc.addStream(parent.getStream(message.to));
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        this.answer();
        break;
    case 'answer':
        this.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        break;
    case 'stop':
        self.send('closed', null);
        self.initPeerConnection();
        break;
    case 'closed':
        self.state('Available');
        parent.remoteVideosContainer.removeChild(self.remoteVideoEl);
        self.initPeerConnection();
        break;
    case 'candidate':
        if(self.pc.remoteDescription) {
          this.pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            candidate: message.payload.candidate
            })
          );
        }
        break;
    }
  };
  
  this.initPeerConnection = function() {
    self.pc = new RTCPeerConnection(parent.config.peerConnectionConfig, parent.config.peerConnectionConstraints);
    self.pc.onicecandidate = function(event) {
      if (event.candidate) {
        self.send('candidate', {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    self.pc.onaddstream = function(event) {
      self.state('Playing');
      parent.remoteVideosContainer.appendChild(self.remoteVideoEl);
      attachMediaStream(self.remoteVideoEl, event.stream);
      self.remoteVideoEl.controls = 'controls';
      self.parent.connection.emit('complete', self.id);
    };
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
      parent.config.mediaConstraints);
  };
  
  this.offer = function() {
    self.state('Contacting');
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
    this.parent.connection.emit('message', {
      to: self.id,
      type: type,
      payload: payload
    });
  };
  
  this.initPeerConnection();
}

function RTCclient () {
  var self = this;
  self.mode = ['Watch', 'Stream'];
  self.chosenMode = ko.observable();  
  self.availableStreams = ko.observableArray([]);
  this.config = {
    url: 'http://54.214.218.3:3000',
    peerConnectionConfig: {
      iceServers: [{"url": "stun:23.21.150.121"}
                  ,{"url": "stun:stun.l.google.com:19302"}]
    },
    peerConnectionContraints: {
      optional: [{"DtlsSrtpKeyAgreement": true}]
    },
    media: {
      audio:true,
      video: {
        mandatory: {
          maxHeight: 240,
          maxWidth: 320
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
  this.localStream;
  this.localVideoEl = document.getElementById('localVideo');
  this.remoteVideosContainer = document.getElementById('remoteVideosContainer');
  
  this.getStream = function(id){
    var StreamId = self.getStreamById(id);
    if (StreamId === -1) {
      return self.localStream;
    } 
    return self.availableStreams()[peerId].getRemoteStreams()[0];
  }
  
  this.connection = io.connect(this.config.url);
  
  this.connection.on('message', function (message) {
      var streamId = self.getStreamById(message.from);
      if (streamId === -1) {
        var stream = new RTCconnection(message.from, self);
        self.availableStreams().push(stream);
      } else {
        stream = self.availableStreams()[streamId];
      }
      stream.handleMessage(message);
  });
    
  this.connection.on('readyToJoin', function() {
    self.joinRoom('sRoom');
  });
  
  this.getStreamById = function(id) {
    for(var i=0; i<self.availableStreams().length;i++) {
      if (self.availableStreams()[i].id === id) {return i;}
    }
    return -1;
  };
  
  this.joinRoom = function(name) {
    self.connection.emit('join', name)
  };
 
  this.startLocalVideo = function(element) {
    getUserMedia(this.config.media, this.getReadyToStream, function () {
      throw new Error('Failed to get access to local media.');
    });
  };
  
  this.stopLocalVideo = function() {
    self.connection.emit('leave');
    self.localStream = '';
    self.localVideoEl.src = '';
  };
  
  this.getReadyToStream = function(stream) {
    attachMediaStream(self.localVideoEl, stream);
    self.localVideoEl.muted = "muted";
    self.localStream = stream;
    self.connection.emit('readyToStream');
  };
  
  this.startStream = function(peer) {
    peer.offer();
  };

  this.stopStream = function(peer) {
    self.connection.emit('message', {
      to: peer.id,
      type: 'stop'
    });
  };

  // Client-side route
  this.goToMode = function(mode) {
    if(mode === 'Stream') {
      if(self.chosenMode() === 'Watch') {
        self.availableStreams().forEach(
          function(stream) {
            if(stream.state() === 'Playing') {self.stopStream(stream);}
          }
        );
      }
      self.chosenMode('Stream');
      self.startLocalVideo();
    } else {
      // Load initial state from server
      $.getJSON("/streams", function(allData) {
        var mappedStreams = $.map(allData, function(data) { 
          return new RTCconnection(data.seed, self);
        });
        self.availableStreams(mappedStreams);
      }); 
      if(self.chosenMode() === 'Stream') {
        self.stopLocalVideo();
      }
      self.chosenMode('Watch');
    }
  };
}
