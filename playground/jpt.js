$('#message-form').on('submit', function (e) {
    e.preventDefault();
    var messsageTextbox = $('[name=message]');
    var clientSocketId = $('#messages').attr('socket-id-ol');
    var clientUserId = $('#messages').attr('user-id-ol');
    var users = [userId, clientUserId];
    // users.push(anotherUserId);
    fired = false;

    // Data To Append
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
    }
});