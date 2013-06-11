/*
 * GET home page.
 */
 
var streamList = [];

exports.addStream = function(stream) {
  streamList.push({id: stream});
};

exports.removeStream = function(stream) {
  streamList = streamList.filter(function(el) {return el.id != stream;});
}

exports.index = function(req, res){
  res.render('index', { title: 'Project RTC', 
                        header: 'Web RTC live streaming',
                        footer: 'by Pierre Chabardes'
                      });
};

exports.streams = function(req, res){
  res.json(200, streamList); 
};