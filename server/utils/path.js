const path = require('path');

var getAbsolutePath = (middlePath, fileName) => {
    return path.join(__dirname, middlePath, fileName);
};

module.exports = { getAbsolutePath };