$(function () {
    var socket = io();
    socket.on('connect', function () {
        console.log("Connected to Server ");
        socket.emit('user joined client', name);
    });

    socket.on('disconnect', () => {
        console.log('disconnected from server');
    });

    // socket.on('disconnect', function() {
    //     console.log('Disconnected from Server');
    //     socket.emit('user left client', name);
    // });

    socket.on('status message', function (message) {
        $('.chat').append('<li>' + message.from + message.text + '</li>')
    });

    $('form').submit(function () {
        var typedMessage = $('#btn-input').val();
        console.log(typedMessage);
        $('.chat').append('<li class="right clearfix"><span class="chat-img pull-right"><img class="img-circle" src="http://placehold.it/50/FA6F57/fff&amp;text=BP" alt="User Avatar"></span><div class="chat-body clearfix"><div class="header"><small class="text-muted"><span class="glyphicon glyphicon-time"></span>13 mins ago</small><strong class="pull-right primary-font">You</strong></div><p>' + typedMessage + '</p></div></li>');
        socket.emit('createMessage', {
            text: $('#btn-input').val(),
            from: name
        });
        $('#btn-input').val('');
        return false;
    });

    socket.on('newMessage', function (message) {
        $('.chat').append('<li class="left clearfix"><span class="chat-img pull-left"><img class="img-circle" src="http://placehold.it/50/55C1E7/fff&amp;text=JS" alt="User Avatar"></span><div class="chat-body clearfix"><div class="header"><strong class="primary-font">' + message.from + '</strong><small class="pull-right text-muted"><span class="glyphicon glyphicon-time"></span>12 mins ago</small></div><p>' + message.text + '</p></div></li>');
    });

});