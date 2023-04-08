const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session')
const logger = require('morgan');
const flash = require('connect-flash')
const passport = require('passport')
const dotenv = require('dotenv')
dotenv.config()
const checkAuction = require('./modules/checkAuction.module')

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const { sequelize } = require('./models');
const nunjucks = require('nunjucks')
const passportConfig = require('./passport')

const app = express();




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
nunjucks.configure('views', {
  express: app,
  watch: true,
});

// User.sync({force : true})
// Good.sync(({force : true}))
// Auction.sync({force : true})
sequelize.sync({ force : false })
  .then(() => { 
    console.log('successed connect database')
  })
  .catch((err) => {
    console.error(err)
  })
passportConfig(passport)
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave : false,
  saveUninitialized : false,
  secret : process.env.COOKIE_SECRET,
  cookie : {
    httpOnly : true,
    secure : false, 
  }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'uploads')));
app.use('/', indexRouter);
app.use('/auth', authRouter);

checkAuction()

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

const schedule = require('node-schedule')
module.exports = app;
