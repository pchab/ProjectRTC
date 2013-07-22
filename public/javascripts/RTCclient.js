var PeerManager = (function () {

  var localId,
      config = {
        peerConnectionConfig: {
          iceServers: [{"url": "stun:23.21.150.121"}
                      ,{"url": "stun:stun.l.google.com:19302"}]
        },
        peerConnectionConstraints: {
          optional: [{"DtlsSrtpKeyAgreement": true}]
        },
        mediaConstraints: {
          'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
          }
        }
      },
      PeerDatabase = {},
      localStream,
      remoteVideoContainer = document.getElementById('remoteVideosContainer'),
      connection = io.connect(window.location.origin);
      
  connection.on('message', handleMessage);
  connection.on('id', function(id) {
    localId = id;
  });
      
  function addPeer(remoteId) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints);

    PeerDatabase[remoteId] = peer;
    initPeerConnection(remoteId);
        
    return peer;
  }  
  function initPeerConnection(remoteId) {
    var peer = PeerDatabase[remoteId];
    peer.pc.onicecandidate = function(event) {
      if (event.candidate) {
        send('candidate', remoteId, {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    peer.pc.onaddstream = function(event) {
      attachMediaStream(peer.remoteVideoEl, event.stream);
      remoteVideosContainer.appendChild(peer.remoteVideoEl);
    };
  }
  function answer(remoteId) {
    var peer = PeerDatabase[remoteId];
    peer.pc.createAnswer(
      function (sessionDescription) {
        peer.pc.setLocalDescription(sessionDescription);
        send('answer', remoteId, sessionDescription);
      }, 
      function(error) { 
        console.log(error);
      },
      config.mediaConstraints
    );
  }
  function offer(remoteId) {
    var peer = PeerDatabase[remoteId];
    peer.pc.createOffer(
      function (sessionDescription) {
        peer.pc.setLocalDescription(sessionDescription);
        send('offer', remoteId, sessionDescription);
      }, 
      function(error) { 
        console.log(error);
      },
      config.mediaConstraints
    );
  }
  function handleMessage(message) {
        var type = message.type,
            from = message.from,
            peer = PeerDatabase[from] || addPeer(from);
      
        switch (type) {
          case 'offer':
            peer.pc.addStream(localStream);
            peer.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
            answer(from);
            break;
          case 'answer':
            peer.pc.setRemoteDescription(new RTCSessionDescription(message.payload));
            break;
          case 'stop':
            send('closed', from, null);
            initPeerConnection(remoteId);
            break;
          case 'closed':
            remoteVideosContainer.removeChild(peer.remoteVideoEl);
            initPeerConnection(remoteId);
            break;
          case 'candidate':
            if(peer.pc.remoteDescription) {
              peer.pc.addIceCandidate(new RTCIceCandidate({
                sdpMLineIndex: message.payload.label,
                sdpMid: message.payload.id,
                candidate: message.payload.candidate
              }));
            }
            break;
        }
      }
  function send(type, to, payload) {
    console.log('sending ' + type + ' to ' + to);
    connection.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }

  return {
      setLocalStream: function(stream) {
        localStream = stream;
      },
      
      peerOffer: function(remoteId) {
        addPeer(remoteId);
        initPeerConnection(remoteId);
        offer(remoteId);
      },
      
      send: function(type, payload) {
        connection.emit(type, payload);
      },
      
      getId: function() {
        return localId;
      }
  };
  
});

var Peer = function (pcConfig, pcConstraints) {
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
}