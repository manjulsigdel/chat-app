let mongoose = require('mongoose');
var Schema = mongoose.Schema;

let roomSchema = Schema({
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    name: {
        type: String,
        default: null
    },
    topic: {
        type: String,
        default: null
    },
}, {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        }
    }
);

let Room = module.exports = mongoose.model('Room', roomSchema);