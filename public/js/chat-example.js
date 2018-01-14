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
            scrollToBottom();
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

    // User is typing message on private chat
    socket.on('newUserIsTypingOnPrivateMessage', function (message) {
        var formattedTime = moment(message.createdAt).format('h:mm a');
        var template = $('#userIsTyping-message-template').html();
        var html = Mustache.render(template, {
            text: message.text,
            from: message.from,
            createdAt: formattedTime
        });
        var socketId = $('#messages').attr('socket-id-ol');
        if (socketId && socketId == message.to) {
            $('[socket-id-ol=' + socketId + ']').append(html);
            scrollToBottom();
        }
    });

    // User is typing message on group chat
    socket.on('newUserIsTypingOnGroupMessage', function (message) {
        var formattedTime = moment(message.createdAt).format('h:mm a');
        var template = $('#userIsTyping-message-template').html();
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

    // User stops typing message on private chat
    socket.on('newUserStopsTyping', function (message) {
        $('.user__is__typing').remove();
    });

    // Make Environment For Private Chat
    $('.user__list .user').on('click', function (e) {
        e.preventDefault();
        var clientUserId = $(this).attr('id');
        var clientSocketId = $(this).attr('socket-id');
        var clientUserName = $(this).html();

        $('.user__list .user').removeClass('active');
        $('#messages').attr('socket-id-ol', '');
        $('#messages').empty();
        $(this).addClass('active');

        $('#message__title').html(clientUserName);
        $('#messages').attr('socket-id-ol', clientSocketId);
        $('#messages').attr('user-id-ol', clientUserId);

        // AJAX REQUEST

        // GET Messages
        $.ajax({
            type: 'POST',
            url: '/chat/messages',
            data: {
                users: [userId, clientUserId]
            },
            success: function (messageResponse) {
                var messages = messageResponse.data.messages;
                // var users = messageResponse.data.users;
                console.log(messages);
                messages.forEach(function (message) {
                    var formattedTime = moment(message.createdAt).format('h:mm a');
                    var body = message.body;
                    // $.ajax({
                    //     type: 'GET',
                    //     url: '/users/' + message.userId,
                    //     success: function (userName) {
                    //         var template = $('#message-template').html();
                    //         var html = Mustache.render(template, {
                    //             text: body,
                    //             from: userName.data,
                    //             createdAt: formattedTime
                    //         });
                    //         $('#messages').append(html);
                    //         scrollToBottom();
                    //     }
                    // });
                    var template = $('#message-template').html();
                    var html = Mustache.render(template, {
                        text: body,
                        from: message.userName,
                        createdAt: formattedTime
                    });
                    $('#messages').append(html);
                    scrollToBottom();
                });
            },
            dataType: 'json'
        });
    });

    // User Is Typing or Stops Typing Functionality
    // Setup
    var typingTimer;
    var doneTypingInterval = 2000;
    var $input = $('[name=message]');
    var fired = false;

    // On keyup, start the countdown
    $input.on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    // On Keydown, fires user is typing message
    $input.on("keypress", function (e) {
        clearTimeout(typingTimer);
        var socketId = $('#messages').attr('socket-id-ol');
        var keyCode = (e.keyCode ? e.keyCode : e.which);
        if (fired == false) {
            if (keyCode == 13) {
                return;
            }
            if (socketId) {
                socket.emit('createUserIsTypingOnPrivateMessage', {
                    from: userId,
                    senderSocketId: socket.id,
                    to: socketId,
                    text: "...is typing"
                });
            } else {
                // socket.emit('createUserIsTypingOnGroupMessage', {
                //     from: userId,
                //     text: "...is typing"
                // });
            }
        }
        fired = true;
    });

    // When user is finished typing, fire user stops typing message
    function doneTyping() {
        fired = false;
        var socketId = $('#messages').attr('socket-id-ol');
        if (socketId) {
            socket.emit('createUserStopsTypingOnPrivateMessage', {
                from: userId,
                senderSocketId: socket.id,
                to: socketId,
                text: "...stops typing"
            });
        } else {
            socket.emit('createUserStopsTypingOnGroupMessage', {
                from: userId,
                text: "...stops typing"
            });
        }
    }

    // When a client submits a new message, that message is emitted to the server
    $('#message-form').on('submit', function (e) {
        e.preventDefault();
        var messsageTextbox = $('[name=message]');
        var clientSocketId = $('#messages').attr('socket-id-ol');
        var clientUserId = $('#messages').attr('user-id-ol');
        var users = [userId, clientUserId];
        // users.push(anotherUserId);
        fired = false;

        // Data To Be Append
        var formattedTime = moment().format('h:mm a');
        var template = $('#message-template').html();
        var html = Mustache.render(template, {
            text: messsageTextbox.val(),
            from: userName,
            createdAt: formattedTime
        });

        // AJAX REQUESTS

        // Save Message
        var messageToBeSaved = {
            users: users,
            userId: userId,
            body: messsageTextbox.val()
        };

        $.ajax({
            type: 'POST',
            url: '/chat/add',
            data: messageToBeSaved,
            success: function (messageResponse) {
                console.log("click");
                console.log("Message Saved: " + JSON.stringify(messageResponse, undefined, 2));
            },
            dataType: 'json'
        });

        // If User Is Online
        if (clientSocketId) {
            $('[user-id-ol=' + clientUserId + ']').append(html);
            scrollToBottom();

            socket.emit('createPrivateMessage', {
                from: userId,
                senderSocketId: socket.id,
                to: clientSocketId,
                text: messsageTextbox.val()
            }, function () {
                messsageTextbox.val('');
            });
            socket.emit('createUserStopsTypingOnPrivateMessage', {
                from: userId,
                senderSocketId: socket.id,
                to: clientSocketId,
                text: "...stops typing"
            });
        } else {
            $('[user-id-ol=' + clientUserId + ']').append(html);
            scrollToBottom();
            messsageTextbox.val('');
            // socket.emit('createMessage', {
            //     from: userId,
            //     text: messsageTextbox.val()
            // }, function () {
            //     messsageTextbox.val('');
            // });
            // socket.emit('createUserStopsTypingOnGroupMessage', {
            //     from: userId,
            //     text: "...stops typing"
            // });
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