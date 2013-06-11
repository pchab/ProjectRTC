/*
 * GET home page.
 */
 
// JSON data
var streamList = [];
var nodes = {};

exports.addStream = function(stream) {
  streamList.push({id: stream});
  nodes[stream] = [stream];
};

exports.removeStream = function(stream) {
  streamList = streamList.filter(function(el) {return el.id != stream;});
  delete nodes[stream];
}

exports.addNode = function(id, seed) {
  nodes[seed].unshift(id);
}

exports.getNextNode = function(seed) {
  return nodes[seed].shift();
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