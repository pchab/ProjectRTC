/**
 * Module dependencies.
 */
var express  = require('express')
  , http     = require('http')
  , path     = require('path')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , flash    = require('connect-flash')
  , streams  = require('./app/streams.js')();

var app      = express()
  , server   = http.createServer(app)
  , configDB = require('./config/database.js')
  , io       = require('socket.io').listen(server);

mongoose.connect(configDB.url);
require('./config/passport')(passport); // pass passport for configuration

app.configure(function() {
  // all environments
  app.set('port', 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  // required for passport
  app.use(express.session({ secret: 'ilovemaplesyruppancakes' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routing
require('./app/routes.js')(app, streams, passport);

/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});