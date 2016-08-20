"use strict"
/**
 * User Controller
 */

module.exports = {
  name: 'User',

  onLogin: function(data){
    if(socketUsers[data.user.id] && DEBUG_MODE) console.log(colors.error('User exists, overriding.'));
    if(!socketUsers[data.user.id] && data.user.name != undefined){
      // console.log(colors.success(data.user.name+' connected with Facebook id '+data.user.id));
      console.log(colors.success('########################################'));
      console.log(colors.success(data.user.name + ' is connected !'));
      console.log(colors.success('########################################'));
    }
    socketUsers[data.user.id] = {socket: data.socket, socketId: data.socket.id, user: data.user};
    data.socket.emit('fbAuthenticated', {tracks: playlist.tracks, playing: playlist.playing, socketId: data.socket.id, user: data.user});
  },
  updateAllClients: function(tracks){
  	tracks = playlist.sort(tracks);
  	socketio.sockets.emit('update', tracks);
  },
  findClientBySocket(socketId){
  	var client = null;
  	socketUsers.forEach(function(currentClient, index){
  		if(currentClient.socketId == socketId){
  			client = currentClient;
  		}
  	});
  	return client;
  }
};
