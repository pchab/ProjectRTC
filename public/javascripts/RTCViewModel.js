// Model
var RTCStream = function(id, data) {
  this.id = id;
  this.name = ko.observable();
  this.isPlaying = ko.observable(false);

  this.update(data);
};

ko.utils.extend(RTCStream.prototype, {
  update: function(data) {
    this.name(data.name);
  }
});

// View Model
var RTCViewModel = function(client, path) {
  var client = client,
      path = path,
      mediaConfig = {
        audio:true,
        video: {
          mandatory: {},
          optional: []
        }
      },
      availableStreams = ko.observable([]),
      isStreaming = ko.observable(false),
      name = ko.observable('Guest'),
      link = ko.observable(),
      localVideoEl = document.getElementById('localVideo');

  // push changes to server
  ko.computed(function() {
    if(isStreaming()) {
      client.send('update', {
                              name: name()
                            });
    }
  }).extend({throttle: 500});

  function getReadyToStream(stream) {
    attachMediaStream(localVideoEl, stream);
    client.setLocalStream(stream);
    client.send('readyToStream', {
                                    name: name()
                                 }
    );
    link(window.location.host + "/" + client.getId()); 
    isStreaming(true);
  }
  function getStreamById(id) {
    for(var i=0; i<availableStreams().length;i++) {
      if (availableStreams()[i].id === id) {return availableStreams()[i];}
    }
  }
  function loadStreamsFromServer() {
    // Load JSON data from server
    $.getJSON(path, function(data) {

      var mappedStreams = [];
      for(var remoteId in data) {
        var stream = getStreamById(remoteId);

        // if stream is known, keep its state and update it
        if(!!stream) {
          stream.update(data[remoteId]);
          mappedStreams.push(stream);
        // else create a new stream (escape own stream)
        } else {
          if(remoteId !== client.getId()) {
            mappedStreams.push(new RTCStream(remoteId, data[remoteId]));
          }
        }
      }

      availableStreams(mappedStreams);
    });
  }

  return {
    streams: availableStreams,
    isStreaming: isStreaming,
    name: name,
    link: link,
    localCamButtonText: ko.computed(
      function() {
        return isStreaming() ? "Stop" : "Start";
      }
    ),

    refresh: loadStreamsFromServer,
    toggleLocalVideo: function() {
      if(isStreaming()){
        client.send('leave');
        localVideoEl.src = '';
        client.setLocalStream(null);
        isStreaming(false);
      } else {
        getUserMedia(mediaConfig, getReadyToStream, function () {
          throw new Error('Failed to get access to local media.');
        });
      }
    },
    toggleRemoteVideo: function(stream) {
      client.peerInit(stream.id);
      stream.isPlaying(!stream.isPlaying());
    },

    answerCall: function(remoteId) {
        getUserMedia(
                      mediaConfig, 
                      function (stream) {
                        getReadyToStream(stream);
                        client.pushStream(remoteId);
                        getStreamById(remoteId).isPlaying(true);
                      }, 
                      function () {
                        throw new Error('Failed to get access to local media.');
                      }
        );
    }
  }
};