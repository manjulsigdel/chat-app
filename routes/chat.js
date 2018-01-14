const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../server/utils/response');
const mongoose = require('mongoose');

// Chat Model
let Message = require('../models/message');

// Room Model
let Room = require('../models/room');

// User Model
let User = require('../models/user');

// Get Chat Page
router.get('/', ensureAuthenticated, function (req, res) {
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

router.get('/example', (req, res) => {
    var extractedUsers = [];
    User.find({}, (err, users) => {
        console.log(users);
        extractedUsers = users;
    });
    setTimeout(function () {
        console.log("After receiving users..." + extractedUsers + " how good");
    }, 1000);
});


// Add Chat Message
router.post('/add', (req, res) => {
    var users = req.body.users;
    var userId = req.body.userId;
    var body = req.body.body;
    users = users.sort();
    customUsers = [];
    users.forEach(function(user){
        customUsers.push(mongoose.Types.ObjectId(user));
    });

    Room.findOne({ users: users }, (err, room) => {
        if (!room) {
            var room = new Room({
                users: customUsers
            });
            room.save((err, room) => {
                if (!room) {
                    res.status(400).send(errorResponse(null, "Room Could Not Be Saved."));
                } else {
                    var message = new Message({
                        roomId: room._id,
                        user: mongoose.Types.ObjectId,
                        body
                    });
                    message.save((err, message) => {
                        if (!message) {
                            res.status(400).send(errorResponse(null, "From not room Message Could Not Be Saved."));
                        } else {
                            res.send(successResponse(message, "Message Successfully Saved."));
                        }
                    });
                }
            });
        } else {
            var message = new Message({
                roomId: room._id,
                user: mongoose.Types.ObjectId(userId),
                body
            });
            message.save((err, message) => {
                if (!message) {
                    res.status(400).send(errorResponse(err, "From room Message Could Not Be Saved."));
                } else {
                    res.send(successResponse(message, "Message Successfully Saved."));
                }

            });
        }
    });

});

// Get Chat Messages
router.post('/messages', (req, res) => {
    var users = req.body.users;
    users.sort();
    Room.findOne({ users: users }).then((room) => {
        if (!room) {
            res.status(400).send(errorResponse(null, "Room Not Found"));            
        } else {
            Message.find({ roomId: room._id }).populate('user').exec((err, messages)=> {
                if(messages.length > 0){
                    var alteredMessages = [];
                    for(var i =0; i< messages.length; i++){
                        var createdAt = messages[i].createdAt;
                        var updatedAt = messages[i].updatedAt;
                        var userId = messages[i].user._id;
                        var userName = messages[i].user.name;
                        var body = messages[i].body;
                        alteredMessages.push(
                            {
                                userId,
                                userName,
                                body,
                                createdAt,
                                updatedAt
                            }
                        );
                    }
                    var messageResponse = {
                        messages: alteredMessages,
                        users: users
                    };
                    res.send(successResponse(messageResponse, "Messages found successfully"));
                } else {
                    res.send(successResponse(null, "Messages Not Found"));
                }
            });
        }
    }, (e) => {
        res.status(400).send(errorResponse(null, "Invalid Room Users"));
    });

});

// Access Control
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('danger', 'Please login');
        res.redirect('/users/login');
    }
}

module.exports = router;