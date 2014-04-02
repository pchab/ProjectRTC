module.exports = function(app) {
  app.get('/streams', streams);
  app.get('/streams/:id', streams);
  app.get('/crowd', crowd);
  app.get('/join', join);
  app.get('/', index);
  app.get('/:id', index);
}

// GET home 
function index(req, res) {
  res.render('index', { 
                        title: 'Project RTC', 
                        header: 'WebRTC live streaming',
                        footer: 'pierre@chabardes.net',
                        id: req.params.id
                      });
};

// GET crowd
function crowd(req, res) {
  res.render('crowd', { 
                        title: 'Project RTC', 
                        footer: ''
                      });
};

// GET join
function join(req, res) {
  res.render('join', { 
                        title: 'Project RTC', 
                        footer: ''
                      });
};

// GET streams as JSON
function streams(req, res) {
  var id = req.params.id;
  var streamList = require('./streams.js')().getStreams();
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