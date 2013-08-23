/**
 * available streams 
 * the id key is considered unique (provided by socket.io)
 */
var streamList = {
  public: {},
  private: {}
};

exports.addStream = function(id, stream, isPrivate) {
  isPrivate ? streamList.private[id] = stream : streamList.public[id] = stream;
};

exports.removeStream = function(id) {
  delete streamList.public[id];
  delete streamList.private[id];
};

// rate function
exports.rate = function(id, rater, rating) {
  var stream = (streamList.public[id] || streamList.private[id]);
  if(stream.raters[rater] || stream.raters[rater] === null) {
    stream.rating += rating - stream.raters[rater];
  } else {
    stream.votes++;
    stream.rating += rating;
  }
  stream.raters[rater] = rating;
};

// update function
exports.update = function(id, name, isPrivate) {
  var stream = streamList.public[id] || streamList.private[id];
  stream.name = name;
  
  this.removeStream(id);
  
  this.addStream(id, stream, isPrivate);
};


// GET home 
exports.index = function(req, res) {
  res.render('index', { 
                        title: 'Project RTC', 
                        header: 'WebRTC live streaming',
                        footer: 'pierre@chabardes.net',
                        id: req.params.id
                      });
};

// GET crowd
exports.crowd = function(req, res) {
  res.render('crowd', { 
                        title: 'Project RTC', 
                        footer: ''
                      });
};

// GET join
exports.join = function(req, res) {
  res.render('join', { 
                        title: 'Project RTC', 
                        footer: ''
                      });
};

// GET streams as JSON
exports.streams = function(req, res) {
  var id = req.params.id;
  // JSON exploit to clone streamList.public
  var data = (JSON.parse(JSON.stringify(streamList.public))); 

  /* 
   * if a specific id is requested, always add the stream even if private
   */
  if(!!id) {
    data[id] = streamList.public[id] || streamList.private[id];
  } 

  res.json(200, data);
};