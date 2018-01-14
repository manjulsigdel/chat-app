var successResponse = (data, message) => {
    return {
        success: true,
        data,
        message
    };
};

var errorResponse = (data, message) => {
    return {
        success: false,
        data,
        message
    };
};

module.exports = { successResponse, errorResponse };