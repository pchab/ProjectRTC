function RTCStream(id, stream, client) {
  var self = this;
  this.id = id;
  this.name = ko.observable(stream.name);
  this.client = client;
  this.points = ko.observable((stream.votes === 0) ? 0 : stream.rating/stream.votes);
  this.state = ko.observable('Available');
  this.rate = function() {
    client.connection.emit('rate', {
      id: self.id,
      points: self.points()
    });
  };
}

function RTCViewModel(client) {
  var self = this;
  this.client = client;
  this.availableStreams = ko.observable([]);
  this.isStreaming = ko.observable(false);
  this.name = ko.observable('My Live');
  ko.computed(function() {
    if(self.isStreaming()) {
      client.connection.emit('rename', self.name());
    }
  });
  this.localVideoEl = document.getElementById('localVideo');
 
  this.startLocalVideo = function() {
    getUserMedia(client.config.media, this.getReadyToStream, function () {
      throw new Error('Failed to get access to local media.');
    });
  };
  
  this.stopLocalVideo = function() {
    client.connection.emit('leave');
    self.localVideoEl.src = '';
    client.localStream = '';
    self.isStreaming(false);
  };
  
  this.getReadyToStream = function(stream) {
    attachMediaStream(self.localVideoEl, stream);
    self.localVideoEl.muted = "muted";
    client.localStream = stream;
    client.connection.emit('readyToStream', self.name());
    self.isStreaming(true);
  };
  
  this.chooseStream = function(stream) {
    if(stream.state() === 'Playing') {
      client.connection.emit('message', {
        to: stream.id,
        type: 'stop'
      });
      stream.state('Available');
    } else {
      client.peerOffer(stream.id);
      stream.state('Playing');
    }
  };
  
  this.getStreamById = function(id) {
    for(var i=0; i<self.availableStreams().length;i++) {
      if (self.availableStreams()[i].id === id) {return i;}
    }
    return -1;
  };

  this.refresh = function() {
    // Load initial state from server
    $.getJSON("/streams", function(data) {
      var mappedStreams = [];
      for(var id in data) {
        var streamIndex = self.getStreamById(id);
        if(streamIndex === -1) {
          mappedStreams.push(new RTCStream(id, data[id], client));
        } else {
          self.availableStreams()[streamIndex].name(data[id].name);
          mappedStreams.push(self.availableStreams()[streamIndex]);
        }
      }
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