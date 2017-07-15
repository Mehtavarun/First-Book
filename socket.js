module.exports = function(io, messages, files){

	io.on('connection', (socket)=>{

		socket.on('msg', (msg)=>{
			messages.push(msg);
		});

		socket.emit('newmsg', JSON.stringify(messages));
		socket.broadcast.emit('newmsg', JSON.stringify(messages));
	});
}