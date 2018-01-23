const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../server/utils/response');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { getAbsolutePath } = require('../server/utils/path');
const url = require('url');

// Chat Model
let Message = require('../models/message');

// Room Model
let Room = require('../models/room');

// User Model
let User = require('../models/user');

// File Model
let File = require('../models/file');

// Get Chat Page
router.get('/', ensureAuthenticated, function (req, res) {
    User.find({}, (err, users) => {
        if (err) {
            console.log('Users Not Found', err);
        } else {
            console.log('users found');
            // var usersArray = [];
            // for(var i = 0; i<users.length;i++){
            //     var userId = users[i]._id;
            //     usersArray.push(userId);
            // }
            res.render('chat_example', {
                users: users,
                // usersArray,
                currentUser: req.user
            });
        }
    });
});

// Add Chat Message
router.post('/add', (req, res) => {
    var hostName = req.headers.host;
    var users = req.body.users;
    var userId = req.body.userId;
    var files = req.body.files;
    var filesToBeInserted = [];
    if (files) {
        for (var i = 0; i < files.length; i++) {
            filesToBeInserted.push(mongoose.Types.ObjectId(files[i]));
        }
    }
    var body = req.body.body;
    users = users.sort();
    customUsers = [];
    for (var i = 0; i < users.length; i++) {
        customUsers.push(mongoose.Types.ObjectId(users[i]));
    }

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
                        files: filesToBeInserted,
                        body
                    });
                    message.save((err, message) => {
                        if (!message) {
                            res.status(400).send(errorResponse(null, "From not room Message Could Not Be Saved."));
                        } else {
                            Message.findById(message._id).populate('files').exec((err, foundMessage) => {
                                var fileNames = [];
                                for (var i = 0; i < foundMessage.files.length; i++) {
                                    var fileName = foundMessage.files[i].file;
                                    var filePath = "/images/" + fileName;
                                    fileNames.push(filePath);
                                }
                                var msgResponse = {
                                    body: foundMessage.body,
                                    files: fileNames
                                };
                                console.log(foundMessage);
                                res.send(msgResponse);
                            });
                        }
                    });
                }
            });
        } else {
            var message = new Message({
                roomId: room._id,
                user: mongoose.Types.ObjectId(userId),
                files: filesToBeInserted,
                body
            });
            message.save((err, message) => {
                if (!message) {
                    res.status(400).send(errorResponse(err, "From room Message Could Not Be Saved."));
                } else {
                    Message.findById(message._id).populate('files').exec((err, foundMessage) => {
                        var fileNames = [];
                        for (var i = 0; i < foundMessage.files.length; i++) {
                            var fileName = foundMessage.files[i].file;
                            var filePath = "/images/" + fileName;
                            fileNames.push(filePath);
                        }
                        var msgResponse = {
                            body: foundMessage.body,
                            files: fileNames
                        };
                        // console.log(foundMessage);
                        res.send(msgResponse);
                    });
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
            Message.find({ roomId: room._id }).populate('user').populate('files', 'file').exec((err, messages) => {
                if (messages.length > 0) {
                    // var alteredMessages = [];
                    var callMessages = [];
                    for (var i = 0; i < messages.length; i++) {
                        callMessages.push(getMessage(messages[i]));
                    };

                    function getMessage(message) {
                        return new Promise((resolve, reject) => {
                            var callMessageFiles = [];
                            var files = message.files;
                            for (var i = 0; i < files.length; i++) {
                                callMessageFiles.push(getFilePath(files[i]));
                            };
                            function getFilePath(file) {
                                return new Promise((resolve, reject) => {
                                    var filePath = '/images/' + file.file;
                                    resolve(filePath);
                                });
                            };
                            Promise.all(callMessageFiles)
                                .then((filesPath) => {
                                    resolve({
                                        userId: message.user._id,
                                        userName: message.user.name,
                                        body: message.body,
                                        createdAt: message.createdAt,
                                        updatedAt: message.updatedAt,
                                        files: filesPath,
                                    });
                                })
                                .catch((err) => console.log(err));
                        });
                    };

                    Promise.all(callMessages)
                        .then((messages) => {
                            var messageResponse = {
                                messages,
                                users
                            }
                            res.send(successResponse(messageResponse, "Messages Found Successfully"));
                        })
                        .catch((err) => console.log(err));
                } else {
                    res.send(successResponse(null, "Messages Not Found"));
                }
            });
        }
    }, (e) => {
        res.status(400).send(errorResponse(null, "Invalid Room Users"));
    });

});

// File Upload
router.post('/file/upload', (req, res) => {
    var files = req.files.photo;
    // console.log(files);
    if (files.length) {
        var callFiles = [];
        for (var i = 0; i < files.length; i++) {
            callFiles.push(saveFile(files[i]));
        };

        function saveFile(file) {
            return new Promise((resolve, reject) => {
                fs.writeFile("public/images/" + file.name, new Buffer(file.data), (err) => {
                    if (err) {
                        console.log("Couldn't save file");
                    } else {
                        var image = new File(
                            {
                                file: file.name,
                                type: image,
                            }
                        );
                        image.save().then((image) => {
                            resolve(image._id);
                        });
                    }
                });
            });
        };
        Promise.all(callFiles)
            .then((data) => res.send(data))
            .catch((err) => console.log(err));
    } else {
        fs.writeFile("public/images/" + files.name, new Buffer(files.data), (err) => {
            if (err) {
                console.log(err);
            } else {
                var image = new File(
                    {
                        file: files.name,
                        type: image,
                    }
                );
                var response = [];
                image.save((err, image) => {
                    if (image) {
                        response.push(image._id);
                    }
                    res.send(response);
                });
            }
        });
    }
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