function RTCconnection(stream, parent) {
  var self = this;
  this.id = stream.id;
  this.name = ko.observable(stream.name);
  this.parent = parent;
  this.points = ko.observable((stream.votes === 0) ? 0 : stream.rating/stream.votes);
  ko.computed(function() {
    if(self.points() !== 0) {
      parent.connection.emit('rate', {
        id: self.id,
        points: self.points()
      });
    }
  });
  this.pc;
  this.state = ko.observable('Available');
  this.remoteVideoEl = document.createElement('video');
  
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
        this.state('Available');
        parent.remoteVideosContainer.removeChild(self.remoteVideoEl);
        this.initPeerConnection();
        break;
    case 'candidate':
        if(this.pc.remoteDescription) {
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
      self.state('Playing');
      parent.remoteVideosContainer.appendChild(self.remoteVideoEl);
      attachMediaStream(self.remoteVideoEl, event.stream);
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
    this.state('Contacting');
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
  this.availableStreams = ko.observableArray([]);
  this.config = {
    url: 'http://localhost:3000',
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
  this.connection = io.connect(this.config.url);
  this.name = ko.observable('My Live');
  ko.computed(function() {
    self.connection.emit('rename', self.name);
  });
  this.localStream;
  this.localVideoEl = document.getElementById('localVideo');
  this.remoteVideosContainer = document.getElementById('remoteVideosContainer');
  
  this.connection.on('id', function(id) {
    this.id = id;
  });
  
  this.connection.on('message', function(message) {
      var streamIndex = self.getStreamById(message.from);
      if (streamIndex === -1) {
        var stream = new RTCconnection({id: message.from, name: name, rating: 5}, self);
        self.availableStreams().push(stream);
      } else {
        stream = self.availableStreams()[streamIndex];
      }
      stream.handleMessage(message);
  });
  
  this.getStreamById = function(id) {
    for(var i=0; i<self.availableStreams().length;i++) {
      if (self.availableStreams()[i].id === id) {return i;}
    }
    return -1;
  };
 
  this.startLocalVideo = function() {
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
    self.connection.emit('readyToStream', self.name());
  };
  
  this.chooseStream = function(peer) {
    if(peer.state() === 'Playing') {
      self.connection.emit('message', {
        to: peer.id,
        type: 'stop'
      });
    } else {
      peer.offer();
    }
  };

  this.refresh = function() {
    // Load initial state from server
    $.getJSON("/streams", function(allData) {
      var mappedStreams = $.map(allData, function(data) {
        var streamIndex = self.getStreamById(data.id);
        if(streamIndex === -1) {
          return new RTCconnection(data, self);
        } else {
          return self.availableStreams()[streamIndex];
        }
      });
      self.availableStreams(mappedStreams);
    });
  };
  
  ko.bindingHandlers.starRating = {
    init: function(element, valueAccessor) {
      $(element).addClass("starRating");
      for (var i = 0; i < 5; i++)
        $("<span>").appendTo(element);
            
      // Handle mouse events on the stars
      $("span", element).each(function(index) {
        $(this).hover(
          function() { $(this).prevAll().add(this).addClass("hoverChosen") },
          function() { $(this).prevAll().add(this).removeClass("hoverChosen") }                
        ).click(function() {
          var observable = valueAccessor();  // Get the associated observable
          observable(index+1);               // Write the new rating to it
        }); ;
      });
    },
    update: function(element, valueAccessor) {
      // Give the first x stars the "chosen" class, where x <= rating
      var observable = valueAccessor();
      $("span", element).each(function(index) {
        $(this).toggleClass("chosen", index < observable());
      });
    }
  };
  
  this.refresh();
}
