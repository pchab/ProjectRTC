module.exports = function() {
  /**
   * available streams 
   * the id key is considered unique (provided by socket.io)
   */
  var streamList = {
    public: {},
    private: {}
  };

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
    addStream : function(id, name, isPrivate) {
      var stream = new Stream(name);
      isPrivate ? streamList.private[id] = stream : streamList.public[id] = stream;
    },

    removeStream : function(id) {
      delete streamList.public[id];
      delete streamList.private[id];
    },

    // rate function
    rate : function(id, rater, rating) {
      var stream = (streamList.public[id] || streamList.private[id]);
      if(stream.raters[rater] || stream.raters[rater] === null) {
        stream.rating += rating - stream.raters[rater];
      } else {
        stream.votes++;
        stream.rating += rating;
      }
      stream.raters[rater] = rating;
    },

    // update function
    update : function(id, name, isPrivate) {
      var stream = streamList.public[id] || streamList.private[id];
      stream.name = name;
      
      this.removeStream(id);     
      isPrivate ? streamList.private[id] = stream : streamList.public[id] = stream;
    },

    getStreams : function() {
      return streamList;
    }
  }
};
