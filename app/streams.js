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
  }

  return {
    addStream : function(id, name) {
      var stream = new Stream(name);
      streamList[id] = stream;
    },

    removeStream : function(id) {
      delete streamList[id];
    },

    // update function
    update : function(id, name) {
      var stream = streamList[id];
      if(!!stream){
        stream.name = name;
        
        this.removeStream(id);     
        streamList[id] = stream;  
      }
    },

    getStreams : function() {
      return streamList;
    }
  }
};
