module.exports = function() {
  /**
   * available streams 
   * the id key is considered unique (provided by socket.io)
   */
  var streamList = {};

  /**
   * Stream object
   *
   * Stored in JSON using socket.id as key
   */
  var Stream = function(name) {
    this.name = name;
    this.rating = 0;
    this.votes = 0;
    this.raters = {};
  }

  return {
    addStream : function(id, name) {
      var stream = new Stream(name);
      streamList[id] = stream;
    },

    removeStream : function(id) {
      delete streamList[id];
    },

    // rate function
    rate : function(id, rater, rating) {
      var stream = streamList[id];
      if(stream.raters[rater] || stream.raters[rater] === null) {
        stream.rating += rating - stream.raters[rater];
      } else {
        stream.votes++;
        stream.rating += rating;
      }
      stream.raters[rater] = rating;
    },

    // update function
    update : function(id, name) {
      var stream = streamList[id];
      stream.name = name;
      
      this.removeStream(id);     
      streamList[id] = stream;
    },

    getStreams : function() {
      return streamList;
    }
  }
};
