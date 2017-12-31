const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');
const passport = require('passport');
const config = require('./config/database');
const port = process.env.PORT || 5000;

// Connect MongoDB
mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', function () {
    console.log('Connected to mongodb');
});
// Check for DB errors
db.on('error', function (err) {
    console.log('err');
});

// Init App
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Bring in Models
let Article = require('./models/article');

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body Parser Middleware
// parse application/x-www.form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(flash());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Config
require('./config/passport')(passport);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

// Home Route
app.get('/', function (req, res) {
    Article.find({}, function (err, articles) {
        if (err) {
            console.log(err);
        } else {
            res.render('index', {
                title: 'Articles',
                articles: articles
            });
        }
    });
});

// Chat Route
app.get('/chat', ensureAuthenticated, function (req, res) {
    res.render('chat', {
        user: req.user
    });
});
//
// Socket Connection
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('status message', function(name){
        socket.emit('status message', `${name} Entered Chatroom`);
    });
    socket.on('chat message', function (msg) {
        socket.broadcast.emit('chat message', msg);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
        socket.on('status message', function(name){
            socket.emit('status message', `${name} Left Chatroom`);
        });
    });
});


// Route Files

// Articles Route
let articles = require('./routes/articles');
app.use('/articles', articles);

// Users Route
let users = require('./routes/users');
app.use('/users', users);

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('danger', 'Please login');
        res.redirect('/users/login');
    }
}

// Start Server
http.listen(port, function () {
    console.log(`Server started on port ${port}....`);
});