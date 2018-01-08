let mongoose = require('mongoose');

let onlineuserSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    socketId: {
        type: String,
        required: true
    }
});

let OnlineUser = module.exports = mongoose.model('OnlineUser', onlineuserSchema);