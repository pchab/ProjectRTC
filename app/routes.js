module.exports = function(app, streams, passport) {

  // HOME PAGE (with login links)
  var index = function(req, res) {
    res.render('index', {  
                          title: 'Project RTC'
                        });
  };

  // LOGIN PAGE 
  var login = function(req, res) {
    res.render('login', {  
                          title: 'Project RTC',
                          message: req.flash('loginMessage')
                        });
  };

  // LOGOUT PAGE 
  var logout = function(req, res) {
    req.logout();
    res.redirect('/');
  };

  // SIGNUP PAGE 
  var signup = function(req, res) {
    res.render('signup', { 
                            title: 'Project RTC',
                            message: req.flash('signupMessage') 
                          });
  };

  // GET main 
  var main = function(req, res) {
    res.render('main', { 
                          title: 'Project RTC', 
                          header: 'WebRTC live streaming',
                          footer: 'pierre@chabardes.net',
                          id: req.params.id,
                          user: req.user.local.username
                        });
  };

  // GET streams as JSON
  var displayStreams = function(req, res) {
    var streamList = streams.getStreams();
    // JSON exploit to clone streamList.public
    var data = (JSON.parse(JSON.stringify(streamList))); 

    res.json(200, data);
  };

  // route middleware to make sure a user is logged in
  var isLoggedIn = function(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
      return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
  }

  app.get('/streams', displayStreams);
  app.get('/main', isLoggedIn, main);
  app.get('/login', login);
  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/main', // redirect to the secure profile section
    failureRedirect : '/login',   // redirect back to the signup page if there is an error
    failureFlash    : true        // allow flash messages
  }));
  app.get('/logout', logout);
  app.get('/signup', signup);
  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/main',   // redirect to the secure main section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash    : true       // allow flash messages
  }));
  app.get('/', index);
  app.get('/:id', isLoggedIn, main);
}