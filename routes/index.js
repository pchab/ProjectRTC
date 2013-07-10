/*
 * GET home page.
 */
 
var streamList = {};

exports.addStream = function(id, stream) {
  streamList[id] = stream;
};

exports.removeStream = function(id) {
  delete streamList[id];
};

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

exports.rename = function(id, name) {
  streamList[id].name = name;
};

exports.index = function(req, res) {
  res.render('index', { title: 'Project RTC', 
                        header: 'Web RTC live streaming',
                        footer: 'by Pierre Chabardes'
                      });
};

exports.streams = function(req, res) {
  res.json(200, streamList); 
};

exports.watch = function(req,res) {
  res.render('watch', { id: req.params.id});
};