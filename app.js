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
const port = process.env.PORT || 1000;
const { generateMessage, generateLocationMessage, generatePrivateMessage } = require('./server/utils/message');
const { isRealString } = require('./server/utils/validation');

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
let User = require('./models/user');
let OnlineUser = require('./models/onlineuser');

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

// Set Global Variable user
app.get('*', function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

// Home Route
app.get('/', function (req, res) {
    Article.find({}, function (err, articles) {
        if (err) {
            console.log('err');
        } else {
            res.render('index', {
                title: 'Articles',
                articles: articles
            });
        }
    });
});

// Chat Route
// app.get('/chat', ensureAuthenticated, function (req, res) {
//     res.render('chat', {
//         user: req.user
//     });
// });

// Socket Connection for chat.pug and chat.js
// io.on('connection', (socket) => {
//     console.log('a user connected');

//     socket.on('user joined client', function (name) {
//         socket.broadcast.emit('status message', generateMessage(name, ' Entered Chatroom'));
//         socket.emit('status message', generateMessage(name, ' Welcome To Chatroom'));
//     });
//     socket.on('user left client', function (name) {
//         socket.broadcast.emit('status message', generateMessage(name, ' Left Chatroom'));
//     });

//     socket.on('createMessage', function (message, callback) {
//         socket.broadcast.emit('newMessage', generateMessage(message.from, message.text));
//         callback('This is from the server');
//     });

//     socket.on('disconnect', function () {
//         console.log('user disconnected');
//     });
// });

// Chat Example Route
app.get('/chat', ensureAuthenticated, function (req, res) {
    User.find({}, (err, users) => {
        if (err) {
            console.log('Users Not Found', err);
        } else {
            console.log('users found');
            res.render('chat_example', {
                users: users,
                currentUser: req.user
            });
        }
    });
});

// Socket Connection for chat-example.pug and chat-example.js
io.on('connection', (socket) => {
    console.log('New user connected');

    // Display Already Connected Users Online
    OnlineUser.find({}, (err, onlineUsers) => {
        if (err) {
            console.log('No Online Users', err);
        } else {
            console.log('Online Users Number: ' + onlineUsers.length);
            onlineUsers.forEach((user) => {
                io.emit('already connected users', {
                    userId: user.userId,
                    socketId: user.socketId
                });
            });
        }
    });

    // Send User Joined Message To All Users
    socket.broadcast.emit('newMessage', generateMessage('Admin', 'New User Joined Chatroom'));

    // Send Welcome User Message To Joined User
    socket.emit('newMessage', generateMessage('Admin', 'Welcome To Chatroom'));

    // When client sends message, server reads and imit that message to all connect users 
    socket.on('createMessage', (message, callback) => {
        User.findById(message.from, (err, user) => {
            if (err) {
                console.log('User Not Found');
            } else {
                io.emit('newMessage', generateMessage(user.name, message.text));
                callback();
            }
        });
    });

    // When client sends location message, server reads and imit that location message to all connect users     
    socket.on('createLocationMessage', function (message) {
        User.findById(message.from, (err, user) => {
            if (err) {
                console.log('User Not Found');
            } else {
                io.emit('newLocationMessage', generateLocationMessage(user.name, message.latitude, message.longitude));
            }
        });
    });

    // Private Chat
    socket.on('createPrivateMessage', (message, callback) => {
        User.findById(message.from, (err, user) => {
            if (err) {
                console.log('User Not Found');
            } else {
                socket.to(message.to).emit('newPrivateMessage', generatePrivateMessage(user.name, message.senderSocketId, message.text));
                socket.emit('newPrivateMessage', generatePrivateMessage(user.name, message.senderSocketId, message.text));
                callback();
            }
        });
    });

    // When User Is Online
    socket.on('user online', (user) => {
        console.log('New user id is: ' + user.socketId);

        // Save Joined Client Information In Database
        let onlineUser = new OnlineUser();
        onlineUser.socketId = user.socketId;
        onlineUser.userId = user.userId;
        onlineUser.save((err) => {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log('Information Saved');
                return;
            }
        });

        io.emit('change user status', {
            socketId: user.socketId,
            userId: user.userId
        });
    });

    // when a client disconnects
    socket.on('disconnect', () => {
        console.log('User was disconnected', socket.id);
        OnlineUser.findOneAndRemove({ 'socketId': socket.id }, (err, res) => { });
        io.emit('user offline', {
            socketId: socket.id
        });
    });

    // When Server Offline
    socket.on('server offline', () => {
        OnlineUser.remove({}, (err, res) => { });
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