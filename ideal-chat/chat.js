var socket = io();
var allMessages = [];
var notifications = [];
var me = {};
var friend = {};

////////////////////////////// SETUP ///////////////////////////////////////

//Initialize login prompt on page load
$(document).ready(function(){
  loginMe();
});

// Prompt user to provide username to be used
function loginMe() {
  var person = prompt("Please enter your username:", "Enter username here");

  //Ensure the input is valid, then emit it if so
  if (/([^\s])/.test(person) && person != null && person != "") {
    socket.emit('newUser', person);

    //Title the window for clarity
    document.title = person+"'s Chat Window!";
  } 

  //Prompt again if input was invalid
  else {
    location.reload();
  }
}

// Send message function
function submitfunction() {

  //initiate message variable
  var message = {};

  //Get message contents from the input bar, labeled by id 'm'
  text = $('#m').val();
  
  //Only proceed if the input is valid i.e., exists
  if(text != '') {

    //Set message text to the contents of the input bar, the id to the user's ID, and the receiver to the friend's id
    message.text = text;
    message.sender = me.id;
    message.receiver = friend.id;

    //Add a speech bubble to the right of the chat window for the chat
    $('#messages').append('<li class="chatMessageLeft">' + message.text + '</li>');
    
    //Store the message data in existing array for the specific friend's chat, if it exists
    if(allMessages[friend.id] != undefined) {
      allMessages[friend.id].push(message);
    } 

    //Otherwise, create a new array for the friend to store it
    else {
      allMessages[friend.id] = new Array(message);
    }

    //Emit the message
    socket.emit('chatMessage', message);
  }

  return false;
}

/////////////////////////////////////// DISPLAY /////////////////////////////////////

// Add a chat to the window
function appendChatMessage(message) {

  //If the user is receiving a message from an active friend, add it to the chat window
  if(message.receiver == me.id && message.sender == friend.id) {    
    $('#messages').append('<li class="' + 'chatMessageRight' + '">' + message.text + '</li>');
  } 

  //Otherwise, update the necessary notification count
  else {    
    updateChatNotificationCount(message.sender);
  }

  //Update sender's existing message array, or create a new one if none exists already
  if(allMessages[message.sender] != undefined) {
    allMessages[message.sender].push(message);
  } 
  else {
    allMessages[message.sender] = new Array(message);
  }
}

//Manage notification count
function updateChatNotificationCount(userId) {

  //If there's no existing count, set it to 1 to begin. Otherwise, iterate it
  var count = (notifications[userId] == undefined) ? 1 : notifications[userId] + 1;
  notifications[userId] = count;

  //Display the count
  $('#' + userId + ' label.notifications').html(count);
  $('#' + userId + ' label.notifications').show();
}

//Clear notification count for specific window (calld when window is opened)
function clearChatNotificationCount(userId) {
  notifications[userId] = 0;
  $('#' + userId + ' label.notifications').hide();
} 

// Move to selected user box
function selectUserChatBox(element, userId, userName) {

  //Display the chat box corresponding to the friend
  friend.id = userId;
  friend.name = userName;
  $('#form').show();
  $('#messages').show();
  $('#userList li').removeClass('active');
  $(element).addClass('active'); 
  $('#m').val('').focus();

  //Since the user is viewing the current chat window, clear its notifications
  clearChatNotificationCount(userId);

  //Load existing chat history if applicable, if not then just display an empty window
  if(allMessages[userId] != undefined) {
    loadChatBox(allMessages[userId]);
  } 
  else {
    $('#messages').html('');
  }
}

// Fetch full message history for current user
function loadChatBox(messages) {

  //Initially clear the message window
  $('#messages').html('');

  //For every message in the stored message array,
  messages.forEach(function(message){

    //Set to a 'right' type speech bubble if the message sender is the user, otherwise make it a 'left' type
    var cssClass = (message.sender == me.id) ? 'chatMessageLeft' : 'chatMessageRight';

    //Add message to list
    $('#messages').append('<li class="' + cssClass + '">' + message.text + '</li>');
  });

  //Full chat history for the friend should be loaded by this point
}

/////////////////////// LISTENERS //////////////////////////////

//Listen to receive message
socket.on('chatMessage', function(message){

  //Handle appending of message when it is sensed
  appendChatMessage(message);
});

//Listen for a new user
socket.on('newUser', function(newUser){

  //Initialize self
  me = newUser;

  //Input name gets stored
  $('#myName').html(me.name);
});

//Listen for when the online list of users needs to be updated
socket.on('userList', function(userList){

  //Set it to null at first
  var usersList = '';

  //Only begin displaying when there's 2 users 
  //(since users are added sequentially, it will always pass through this point), after which multiple users are handled
  if(userList.length == 2) {
    userList.forEach(function(user){
      if(me.id != user.id){
        friend.id = user.id;
        friend.name = user.name;
        $('#form').show();
        $('#messages').show();
      }
    });
  }
  
  //For every user in the list, display a bar with a function that activates on lick that will switch to the chat box
  userList.forEach(function(user){
    if(user.id != me.id) {

      //Set active class only if user is friend
      var activeClass = (user.id == friend.id) ? 'active' : '';
      usersList += '<li id="' + user.id + '" class="' + activeClass + '" onclick="selectUserChatBox(this, \'' + user.id + '\', \'' + user.name + '\')"><a href="javascript:void(0)">' + user.name + '</a><label class="notifications"></label></li>';
    }
  });

  //Actually display the built list
  $('#userList').html(usersList);
});

//Listen for disconnection
socket.on('userIsDisconnected', function(userId){

  //Clear user from the app when disconnected
  delete allMessages[userId];
  $('#form').hide();
  $('#messages').hide();
});