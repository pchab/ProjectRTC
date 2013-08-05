/**
 * JSON storing available streams
 */
var streamList = {
  public: {},
  private: {}
};

exports.addStream = function(id, stream, isPrivate) {
  isPrivate ? streamList.private[id] = stream  : streamList.public[id] =stream;
};

exports.removeStream = function(id) {
  delete streamList.public[id];
  delete streamList.private[id];
};

// rate function
exports.rate = function(id, rater, rating) {
  var stream = streamList.public[id];
  if(stream.raters[rater] || stream.raters[rater] === null) {
    stream.rating += rating - stream.raters[rater];
  } else {
    stream.votes +=1;
    stream.rating += rating;
  }
  stream.raters[rater] = rating;
};

// rename function
exports.rename = function(id, name, isPrivate) {
  if(isPrivate) {
    if (!!streamList.public[id]){
      // privacy setting has changed
      streamList.private[id] = streamList.public[id];
      delete streamList.public[id];
    } else {
      // else name has changed
      streamList.private[id].name = name;
    }
  } else {
    if(!!streamList.private[id]){
      // privacy setting has changed
      streamList.public[id] = streamList.private[id];
      delete streamList.private[id];
    } else {
      // else name has changed
      streamList.public[id].name = name;
    }
  }
};


// GET home 
exports.index = function(req, res) {
  res.render('index', { title: 'Project RTC', 
                        header: 'Web RTC live streaming',
                        footer: 'by Pierre Chabardes'
                      });
};

// GET streams as JSON
exports.streams = function(req, res) {
  res.json(200, streamList.public); 
};

// GET <id> stream
exports.call = function(req,res) {
  res.render('call', { id: req.params.id});
};