/*
 * GET home page.
 */
 
var streamList = [];

exports.addStream = function(stream) {
  streamList.push(stream);
};

exports.removeStream = function(streamId) {
  streamList = streamList.filter(function(el) {return el.id != streamId;});
};

exports.rate = function(id, rater, rating) {
  for(var i=0; i<streamList.length;i++) {
    if (streamList[i].id === id) {
      var stream = streamList[i];
      if(stream.raters[rater] || stream.raters[rater] === null) {
        stream.rating += rating - stream.raters[rater];
      } else {
        stream.votes +=1;
        stream.rating += rating;
      }
      stream.raters[rater] = rating;
    }
  }
};

exports.rename = function(id, name) {
  for(var i=0; i<streamList.length;i++) {
    if (streamList[i].id === id) {
      streamList[i].name = name;
    }
  }
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