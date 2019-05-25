var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var userList = [];

//Initialization
app.get('/', function(req, res){
  var express=require('express');
  app.use(express.static(path.join(__dirname)));
  res.sendFile(path.join(__dirname, '../ideal-chat', 'index.html'));
});

//Create a socket event on connection
io.on('connection', function(socket){ 

  // Listen for a chat message and emit it to the client
  socket.on('chatMessage', function(message){
    io.to(message.receiver).emit('chatMessage', message);
  }); 

   // Listen for a new user to notify full list to new userList
  socket.on('newUser', function(user){
    var newUser = {id: socket.id, name: user};
    userList.push(newUser);
    io.to(socket.id).emit('newUser', newUser);
    io.emit('userList', userList);
  });  
 
  // Listen for disconnections to update list
  socket.on('disconnect', function(){
    userList.forEach(function(user, index){
      if(user.id === socket.id) {
        userList.splice(index, 1);
        io.emit('userIsDisconnected', socket.id);
        io.emit('userList', userList);
      }
    });
  });

});

// Set up on port 3000 (arbitrarily)
http.listen(3000, function(){
  console.log('Listening on Port 3000. Please open localhost:3000 in multiple tabs on your browser of choice.');
});