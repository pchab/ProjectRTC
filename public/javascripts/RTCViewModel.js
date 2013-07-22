function RTCStream(id, stream, client) {
  var self = this;
  this.id = id;
  this.name = ko.observable(stream.name);
  this.client = client;
  this.points = ko.observable((stream.votes === 0) ? 0 : stream.rating/stream.votes);
  this.state = ko.observable('Available');
  this.rate = function() {
    client.send('rate', {
      id: self.id,
      points: self.points()
    });
  };
}

function RTCViewModel(client) {
  var self = this;
  this.client = client;
  this.mediaConfig = {
          audio:true,
          video: {
            mandatory: {},
            optional: []
          }
        },
  this.availableStreams = ko.observable([]);
  this.isStreaming = ko.observable(false);
  this.name = ko.observable('Guest');
  ko.computed(function() {
    if(self.isStreaming()) {
      client.send('rename', self.name());
    }
  });
  this.link = ko.observable();
  this.localVideoEl = document.getElementById('localVideo');
  this.startLocalVideo = function() {
    getUserMedia(this.mediaConfig, this.getReadyToStream, function () {
      throw new Error('Failed to get access to local media.');
    });
  };
  
  this.stopLocalVideo = function() {
    client.send('leave');
    self.localVideoEl.src = '';
    client.setLocalStream(null);
    self.isStreaming(false);
  };
  
  this.getReadyToStream = function(stream) {
    attachMediaStream(self.localVideoEl, stream);
    self.localVideoEl.muted = "muted";
    client.setLocalStream(stream);
    client.send('readyToStream', self.name());
    self.link(window.location.origin + "/" + client.getId());
    self.isStreaming(true);
  };
  
  this.chooseStream = function(stream) {
    client.peerOffer(stream.id);
    if(stream.state() === 'Playing') { 
      client.toggleVisibility(stream.id, 'none');
      stream.state('Available') 
    } else {
      client.toggleVisibility(stream.id, '');
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
        if(id !== client.id) {
          var streamIndex = self.getStreamById(id);
          if(streamIndex === -1) {
            mappedStreams.push(new RTCStream(id, data[id], client));
          } else {
            self.availableStreams()[streamIndex].name(data[id].name);
            mappedStreams.push(self.availableStreams()[streamIndex]);
          }
        }
      }
      self.availableStreams(mappedStreams);
    });
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
  
  this.refresh();
}