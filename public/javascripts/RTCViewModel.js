// Model
var RTCStream = function(id, data) {
  this.id = id;
  this.name = ko.observable();
  this.points = ko.observable();
  this.isPlaying = ko.observable(false);

  this.state = ko.computed(function() {
    return this.isPlaying() ? 'Playing' : 'Available';
  }, this); 

  this.update(data);
};

ko.utils.extend(RTCStream.prototype, {
  update: function(data) {
    this.name(data.name);
    this.points((data.votes === 0) ? 0 : data.rating/data.votes);
  }
});


// Revealing module pattern
// View Model
var RTCViewModel = function(client) {
  var client = client,
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

  ko.computed(function() {
    if(isStreaming()) {
      client.send('rename', name());
    }
  });

  function getReadyToStream(stream) {
    attachMediaStream(localVideoEl, stream);
    localVideoEl.muted = "muted";
    client.setLocalStream(stream);
    client.send('readyToStream', name());
    link(window.location.origin + "/" + client.getId());
    isStreaming(true);
  }
  function getStreamById(id) {
    for(var i=0; i<availableStreams().length;i++) {
      if (availableStreams()[i].id === id) {return i;}
    }
    return -1;
  }
  function refresh() {
    // Load initial state from server
    $.getJSON("/streams", function(data) {
      var mappedStreams = [];
      for(var remoteId in data) {
        if(remoteId !== client.getId()) {
          var streamIndex = getStreamById(remoteId);
          if(streamIndex === -1) {
            mappedStreams.push(new RTCStream(remoteId, data[remoteId]));
          } else {
            availableStreams()[streamIndex].update(data[remoteId]);
            mappedStreams.push(availableStreams()[streamIndex]);
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

    refresh: refresh,
    rate: function(stream) {
      client.send('rate', {
        id: stream.id,
        points: stream.points()
      });
    },
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
      client.peerOffer(stream.id);
      stream.isPlaying(!stream.isPlaying());
      client.toggleVisibility(stream.id, stream.isPlaying());
    }
  }
};

/**
  * Star-rating binding taken from Knockoutjs tutorial on custom bindings
  * http://learn.knockoutjs.com/#/?tutorial=custombindings
  */
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