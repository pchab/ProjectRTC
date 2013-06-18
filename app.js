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

app.get('/', routes.index);
app.get('/streams', routes.streams);
app.post('/rename', routes.rename);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function Stream(id, name) {
  this.id = id;
  this.name = name;
  this.rating = 0;
  this.votes = 0;
  this.raters = {};
}

io.sockets.on('connection', function(client) {
  console.log('-- ' + client.id + ' connected --');
   	
  // pass a message
  client.on('message', function (details) {
    var otherClient = io.sockets.sockets[details.to];

    if (!otherClient) {
      return;
    }
      delete details.to;
      details.from = client.id;
      otherClient.emit('message', details);
  });
    
  client.on('readyToStream', function(name) {
    console.log('-- ' + client.id + ' is ready to stream --');
    var stream = new Stream(client.id, name);
    routes.addStream(stream);
  });
  
  client.on('rate', function(rating) {
    routes.rate(rating.id, client.id, rating.points);
  });
  
  client.on('rename', function(name) {
    routes.rename(client.id, name);
  });

  function leave() {
    console.log('-- ' + client.id + ' leaved --');
    routes.removeStream(client.id);
  }

  client.on('disconnect', leave);
  client.on('leave', leave);
});
