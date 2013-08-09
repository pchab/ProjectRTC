/**
 * Module dependencies.
 */
var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

// all environments
app.set('port', 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routing
app.get('/streams', routes.streams);
app.get('/streams/:id', routes.streams);
app.get('/crowd', routes.crowd);
app.get('/', routes.index);
app.get('/:id', routes.index);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Stream object
 *
 * Stored in JSON using socket.id as key
 */
function Stream(name) {
  this.name = name;
  this.rating = 0;
  this.votes = 0;
  this.raters = {};
}

/**
 * Socket.io event handling
 */
io.sockets.on('connection', function(client) {
  console.log('-- ' + client.id + ' joined --');
  client.emit('id', client.id);

  client.on('message', function (details) {
    var otherClient = io.sockets.sockets[details.to];

    if (!otherClient) {
      return;
    }
      delete details.to;
      details.from = client.id;
      otherClient.emit('message', details);
  });
    
  client.on('readyToStream', function(options) {
    console.log('-- ' + client.id + ' is ready to stream --');
    var stream = new Stream(options.name);
    routes.addStream(client.id, stream, options.privacy); 
  });
  
  client.on('rate', function(rating) {
    routes.rate(rating.id, client.id, rating.points);
  });
  
  client.on('update', function(options) {
    routes.update(client.id, options.name, options.privacy);
  });

  function leave() {
    console.log('-- ' + client.id + ' left --');
    routes.removeStream(client.id);
  }

  client.on('disconnect', leave);
  client.on('leave', leave);
});
