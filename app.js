var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

const session = require('express-session');
const passport = require('passport');
const Strategy = require('openid-client').Strategy;

module.exports = (issuer) => {
  var index = require('./routes/index');
  var users = require('./routes/users');

  const client = new issuer.Client({
    client_id: '0',
    client_secret: '0'
  });
  const params = {
    redirect_uri: 'http://localhost:3000/auth/cb'
  };
  passport.use('oidc', new Strategy({ client, params }, (tokenset, userinfo, done) => {
    console.log('tokenset', tokenset);
    console.log('access_token', tokenset.access_token);
    console.log('id_token', tokenset.id_token);
    console.log('claims', tokenset.claims);
    console.log('userinfo', userinfo);

    // この部分をユーザ検索して有無チェックする
    if (tokenset.claims.sub !== '0') {
      return done(null);
    }
    return done(null, tokenset.claims.sub);
  }));

  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/', index);
  app.use('/users', users);

  app.get('/auth', passport.authenticate('oidc'));
  app.get('/auth/cb', passport.authenticate('oidc', {
    successRedirect: '/',
    failureRedirect: '/users'
  }));

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
};

passport.serializeUser(function(user, done) {
  // セッション情報にはIDなど最低限のみ保存する
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  // 実際にはここでセッションにもつIDからユーザ情報を取得する
  // User.findById(id, function(err, user) {
  //   done(err, user);
  // });
  done(null, {client_id: id});
});