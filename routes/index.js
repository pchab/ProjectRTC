/**
 * JSON storing available streams
 */
var streamList = {};

exports.addStream = function(id, stream) {
  streamList[id] = stream;
};

exports.removeStream = function(id) {
  delete streamList[id];
};

// rate function
exports.rate = function(id, rater, rating) {
  var stream = streamList[id];
  if(stream.raters[rater] || stream.raters[rater] === null) {
    stream.rating += rating - stream.raters[rater];
  } else {
    stream.votes +=1;
    stream.rating += rating;
  }
  stream.raters[rater] = rating;
};

// rename function
exports.rename = function(id, name) {
  streamList[id].name = name;
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
  res.json(200, streamList); 
};

// GET <id> stream
exports.call = function(req,res) {
  res.render('call', { id: req.params.id});
};