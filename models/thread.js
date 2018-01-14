let mongoose = require('mongoose');

let threadSchema = mongoose.Schema({
    messageId: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    body: {
        type: String,
        required: true
    }
}, {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        }
    }
);

let Thread = module.exports = mongoose.model('Thread', threadSchema);