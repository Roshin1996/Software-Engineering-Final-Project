//Package requirements (install via npm install)
var topology = require("fully-connected-topology");
var streamSet = require("stream-set");
var jsonStream = require("duplex-json-stream");
var toPort = require("hash-to-port");

//The user (self)'s name'
var me = process.argv[2];

//A list of everyone else in the room
var peers = process.argv.slice(3);

//Handle connections 
var swarm = topology(hash(me), peers.map(hash));
var streams = streamSet();

//Upon new connection from list, notify the chat
swarm.on("connection", function(socket){
	console.log("New peer connection!\n");

	//Set up message connection	
	socket = jsonStream(socket);
	streams.add(socket);
	socket.on("data", function(data){
		console.log(data.username+": "+data.message);
	});	

});

//Every time the self writes a message, iterate through all users and post it to everyone
process.stdin.on("data", function(data){
	streams.forEach(function(socket){

		//Format the message JSON
		socket.write({
			username: me,
			message: data.toString().trim()
		});

	});
});

//Tragically simple hash function to get a port number based on a name
function hash(name){
	var x = toPort(name);
	x = x/10;
	x=Math.floor(x);
	return "localhost:"+x;
}