let mongoose = require('mongoose');
var Schema = mongoose.Schema;

let fileSchema = Schema({
    file: {
        type: String,
        required: true
    },
    type: {
        type: String
    }
}, {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        }
    }
);

let File = module.exports = mongoose.model('File', fileSchema);