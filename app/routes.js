module.exports = function(app, streams) {

  // GET home 
  var index = function(req, res) {
    res.render('index', { 
                          title: 'Project RTC', 
                          header: 'WebRTC live streaming',
                          footer: 'pierre@chabardes.net',
                          id: req.params.id
                        });
  };

  // GET crowd
  var crowd = function(req, res) {
    res.render('crowd', { 
                          title: 'Project RTC', 
                          footer: ''
                        });
  };

  // GET join
  var join = function(req, res) {
    res.render('join', { 
                          title: 'Project RTC', 
                          footer: ''
                        });
  };

  // GET streams as JSON
  var displayStreams = function(req, res) {
    var id = req.params.id;
    var streamList = streams.getStreams();
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

  app.get('/streams', displayStreams);
  app.get('/streams/:id', displayStreams);
  app.get('/', index);
  app.get('/:id', index);
}