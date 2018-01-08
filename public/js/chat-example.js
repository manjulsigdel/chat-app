$(function () {
    var socket = io();

    // Function to Scroll message page to bottom
    function scrollToBottom() {
        // Selectors
        var messages = $('#messages');
        var newMessage = messages.children('li:last-child');
        // Heights
        var clientHeight = messages.prop('clientHeight');
        var scrollTop = messages.prop('scrollTop');
        var scrollHeight = messages.prop('scrollHeight');
        var newMessageHeight = newMessage.innerHeight();
        var lastMessageHeight = newMessage.prev().innerHeight();

        if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
            messages.scrollTop(scrollHeight);
        }
    }

    // When a client connects to the server
    socket.on('connect', function () {
        console.log('Connected to server');
        socket.emit('user online', {
            socketId: socket.id,
            userId: userId
        });
    });

    // When User Online Show Online Status On All Connected Users
    socket.on('already connected users', function (data) {
        $('#' + data.userId).attr('socket-id', data.socketId);
        $('#' + data.userId + ' span').css('display', 'inline-block');
        // $('#'+data.userId + ' button').css('display', 'inline-block');
    });

    // When User Online Change That User Status
    socket.on('change user status', function (data) {
        $('#' + data.userId).attr('socket-id', data.socketId);
        $('#' + data.userId + ' span').css('display', 'inline-block');
        // $('#'+data.userId + ' button').css('display', 'inline-block');
    });

    // When User Goes Offline
    socket.on('user offline', function (data) {
        $('[socket-id=' + data.socketId + '] span').css('display', 'none');
        // $('[socket-id='+ data.socketId +'] button').css('display', 'none');
    });

    // When a client disconnects from the server
    socket.on('disconnect', function () {
        socket.emit('server offline');
        console.log('Disconnected from server', socket.id);
    });

    // When a client receives a new message from another client
    socket.on('newMessage', function (message) {
        var formattedTime = moment(message.createdAt).format('h:mm a');
        var template = $('#message-template').html();
        var html = Mustache.render(template, {
            text: message.text,
            from: message.from,
            createdAt: formattedTime
        });
        var socketId = $('#messages').attr('socket-id-ol');
        if (socketId === "") {
            $('#messages').append(html);
            scrollToBottom();
        }
    });

    socket.on('newPrivateMessage', function (message) {
        var formattedTime = moment(message.createdAt).format('h:mm a');
        var template = $('#message-template').html();
        var html = Mustache.render(template, {
            text: message.text,
            from: message.from,
            createdAt: formattedTime
        });
        var socketId = $('#messages').attr('socket-id-ol');
        if (socketId && socketId == message.to) {
            $('[socket-id-ol=' + socketId + ']').append(html);
        }
    });

    // When a client receives a new location message from another client
    socket.on('newLocationMessage', function (message) {
        var formattedTime = moment(message.createdAt).format('h:mm a');
        var template = $('#location-message-template').html();
        var html = Mustache.render(template, {
            from: message.from,
            createdAt: formattedTime,
            url: message.url
        });
        $('#messages').append(html);
        scrollToBottom();
    });

    // Make Environment For Private Chat
    $('.user__list .user').on('click', function (e) {
        e.preventDefault();
        var userId = $(this).attr('id');
        var socketId = $(this).attr('socket-id');
        var userName = $(this).html();
        if (socketId === "") {
            return 0;
        }

        $('.user__list .user').removeClass('active');
        $('#messages').attr('socket-id-ol', '');
        $('#messages').empty();
        $(this).addClass('active');

        $('#message__title').html(userName);
        $('#messages').attr('socket-id-ol', socketId);



    });

    // When a client submits a new message, that message is emitted to the server
    $('#message-form').on('submit', function (e) {
        e.preventDefault();

        var messsageTextbox = $('[name=message]');
        var socketId = $('#messages').attr('socket-id-ol');
        if (socketId) {
            socket.emit('createPrivateMessage', {
                from: userId,
                senderSocketId: socket.id,
                to: socketId,
                text: messsageTextbox.val()
            }, function () {
                messsageTextbox.val('');
            });
        } else {
            socket.emit('createMessage', {
                from: userId,
                text: messsageTextbox.val()
            }, function () {
                messsageTextbox.val('');
            });
        }
    });

    // When a client submits a new location message, that location message is emitted to the server    
    var locationButton = $('#send-location');
    locationButton.on('click', function () {
        if (!navigator.geolocation) {
            return alert('Geolocation not supported by your browser.');
        }

        locationButton.attr('disabled', 'disabled').text('Sending Location...');

        navigator.geolocation.getCurrentPosition(function (position) {
            locationButton.removeAttr('disabled').text('Send Location');
            socket.emit('createLocationMessage', {
                from: userId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
        }, function () {
            locationButton.removeAttr('disabled').text('Send Location');
            alert('Unable to fetch location.');
        });
    });

});