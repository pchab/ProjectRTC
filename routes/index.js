/*
 * GET home page.
 */
 
var peerList = [];

exports.addPeer = function(peer) {
  peerList.push({id: peer});
};

exports.removePeer = function(peer) {
  peerList = peerList.filter(function(el) {return el.id != peer;});
}

exports.index = function(req, res){
  res.render('index', { title: 'Project RTC', 
                        header: 'Web RTC live streaming',
                        footer: 'by Pierre Chabardes'
                      });
};

exports.peers = function(req, res){
  res.json(200, peerList); 
};