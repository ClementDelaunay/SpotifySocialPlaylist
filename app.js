/*--------------------------------
============ MODULES ============
--------------------------------*/

var art = require('ascii-art'), 
	colors = require('colors'), 
	inquirer = require("inquirer"), 
	ngrok = require('ngrok'), 
	express = require('express'),
	http = require('http'),
	cookieParser = require('cookie-parser'),
	socketio = require('socket.io'),
	mongoose = require('mongoose');

var util = require('util');

var options = {
    cacheFolder: 'cache',
    settingsFolder: 'settings',
    appkeyFile: './spotify_appkey.key'
};
var spotify = require('node-spotify/build/Release/spotify')(options);

/*--------------------------------
========= CONFIGURATION ==========
--------------------------------*/

var app = express();
var server = http.Server(app);
var io = socketio(server);
var crSpot = {
	login: 'YOUR_SPOTIFY_LOGIN',
	password: 'YOUR_SPOTIFY_PASSWORD'
};
var playlist;
var clients = [];
var config = {
	static_url: "YOUR_STATIC_URL",
	port: 8080,
	autoDestroy:{
		activated: false, 
		minClients:2,
		maxPercentage:50
	}
};

// mongoose.connect('mongodb://localhost/socialplaylist');
// var User = require('./models/user');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

/*--------------------------------
============= UTILS =============
--------------------------------*/

function stringGen(len){
    var text = " ";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

/*--------------------------------
============= LOGIN =============
--------------------------------*/

var spotifyReady = function(err) {
    if(err) {
        console.log('Login failed :('.error);
        console.log(err)
        console.log('');
        loginUsername(true);
    } else {
    	console.log('Login succeded!'.info);
    	console.log('Init server...'.warn);
    	serverInit();
    }
};

function loginUsername(retry){

	/*if(retry == undefined){
		console.log('-------------------------------'.info);
		console.log('First of all, log in to Spotify'.info);
		console.log('-------------------------------'.info);
		console.log('');
	}
	else{
		console.log('-------------'.info);
		console.log('Please, retry'.info);
		console.log('-------------'.info);
		console.log('');
	}

	var questionLogin = {
	  name: 'username',
	  message: 'Username:',
	  type: 'input'
	}

	var questionPassword = {
	  name: 'password',
	  message: 'Password:',
	  type: 'password'
	}

    inquirer.prompt(questionLogin, function(dataLogin){
    	var intervalPassword = setInterval(function() {
		  process.stdout.cursorTo(12);  // move cursor to beginning of line
		  process.stdout.write("");  // write text
		}, 10);
    	inquirer.prompt(questionPassword, function(dataPassword){
    		clearInterval(intervalPassword);
    		spotify.login(dataLogin.username, dataPassword.password, false, false);
		});
	});*/


	console.log('Login to Spotify...'.warn);
	spotify.login(crSpot.login, crSpot.password, false, false);
 
}

/*--------------------------------
============= CLIENTS ============
--------------------------------*/

var Playlist = function () {
    this.tracks = [];
    this.playing = {
    	playing: false,
        artist:"",
        track: "",
        duration: {
        	total: 0,
        	current: 0
        }
    };
    this.intervalPlaying = undefined;
	this.add = function (track, user) {
		var newTrack = {uid: stringGen(15), track: track, likes: [], dislikes: [], score: 0, owner: user};
		if(this.tracks.length == 0 && this.playing.playing == false) this.play(newTrack);
		else this.tracks.push(newTrack);
		console.log(colors.verbose(this.tracks.length+' tracks queued'));
    	return this.tracks;
	};
	this.remove = function (id, user, auto) {
		if(this.tracks[id].owner == user || auto != undefined){
			this.tracks.splice(id, 1);
			console.log(colors.verbose(this.tracks.length+' tracks queued'));
			return this.tracks;
		}
		else return 'forbidden';
	};
	this.like = function (id, user) {
		var indexOfLike = this.tracks[id].likes.indexOf(user);
		if(indexOfLike == -1){
			this.tracks[id].likes.push(user);
			var disliked = this.tracks[id].dislikes.indexOf(user);
			if(disliked > -1) this.tracks[id].dislikes.splice(disliked, 1);
			this.tracks[id].score = this.calcScore(this.tracks[id]);
		}
		else{
			this.tracks[id].likes.splice(indexOfLike);
			this.tracks[id].score = this.calcScore(this.tracks[id]);
		}
		return this.tracks;
	};
	this.dislike = function (id, socket) {
		user = socket.id;
		var indexOfDislike = this.tracks[id].dislikes.indexOf(user);
    	if(indexOfDislike == -1){
			this.tracks[id].dislikes.push(user);
			var liked = this.tracks[id].likes.indexOf(user);
			if(liked > -1) this.tracks[id].likes.splice(liked, 1);
			this.tracks[id].score = this.calcScore(this.tracks[id]);
			if(config.autoDestroy.activated) return this.autoDestroy(this.tracks[id], id);
			else return this.tracks;
			updateAllClients(this.tracks);
		}
		else{
			this.tracks[id].dislike.splice(indexOfDislike);
			this.tracks[id].score = this.calcScore(this.tracks[id]);
			return this.tracks;
		}
	};
	this.autoDestroy = function(track, id){
		if(clients.length >= config.autoDestroy.minClients && (track.dislikes.length*100)/clients.length >= config.autoDestroy.maxPercentage){
			io.sockets.emit('autodestroy', track);
			this.tracks = this.remove(id, false, true);
			updateAllClients(this.tracks);
		}
		return this.tracks;
	};
	this.removeClient = function(user) {
		var self = this;
		this.tracks.forEach(function(track){
			var disliked = track.dislikes.indexOf(user), liked = track.likes.indexOf(user);
			if(liked > -1) track.likes.splice(liked, 1);
			if(disliked > -1) track.dislikes.splice(disliked, 1);
			track.score = self.calcScore(track);
		});
		return this.tracks;
	};
	this.calcScore = function(track){
		return track.likes.length-track.dislikes.length;
	};
	this.sort = function(tracks){
		tracks.sort(function(a, b) {
		    return parseFloat(a.score) - parseFloat(b.score);
		});
		return tracks.reverse();
	};
	this.play = function(track){
		var self = this;
		this.playing.playing = true;
		this.playing.artist = track.track.artists[0].name;
		this.playing.track = track.track.name;
		this.playing.duration.total = track.track.duration;
		if(self.intervalPlaying != undefined){
			clearInterval(self.intervalPlaying);
			self.intervalPlaying = undefined;
			self.playing.duration.current = 0;
		}
		self.intervalPlaying = setInterval(function(){
			self.playing.duration.current++;
		}, 1000);
		var playingTrack = spotify.createFromLink(track.track.link);
		spotify.player.play(playingTrack);
		console.log(colors.warn('Now playling '+track.track.name+' by '+track.track.artists[0].name));
		io.sockets.emit('update', { tracks: this.tracks, playing: this.playing});
		return this.playing;
	};
	this.pause = function(){
		spotify.player.pause();
	},
	this.nextTrack = function(){
		var self = this;
		this.pause();
		if(this.tracks.length > 0) {
			this.playing = this.play(this.tracks[0]);
			this.tracks.shift();
		}
		else{
			this.playing.playing = false;
			clearInterval(self.intervalPlaying);
			console.log(colors.error('No tracks queued'));
		}
		io.sockets.emit('update', { tracks: this.tracks, playing: this.playing});
	}
};

function checkAuthorization(socket, data){
	if(data != 'forbidden') return true;
	else socket.emit('forbidden');
}

function updateAllClients(tracks){
	tracks = playlist.sort(tracks);
	io.sockets.emit('update', tracks);
}

function search(str, cb){
	var limit = 15, offset = 0;
    var search = new spotify.Search(str, offset, limit);
	search.execute(function(err, searchResult) {
	    var foundTracks = searchResult.tracks;
	    cb(foundTracks);
	});
}

function findClientBySocket(socketId){
	var client = null;
	clients.forEach(function(currentClient, index){
		if(currentClient.socketId == socketId){
			client = currentClient;
		}
	});
	return client;
}

/*--------------------------------
============ TUNNELING ===========
--------------------------------*/

function serverInit(){

	ngrok.connect(config.port, function (err, url) {
		if(!err){
			console.log(colors.info('Server available at '+url+ ' or '+config.static_url));
			playlist = new Playlist();
			io.listen(server); 
			server.listen(config.port);
			setTimeout(function(){
				updateAllClients(playlist.tracks);
			}, 10000);
		}
		else{
			console.log('Error while establishing tunneling :('.error)
		}
	});
}

/*--------------------------------
============= ROUTES =============
--------------------------------*/

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.get('*', function(req, res) {
    res.sendfile('./public/index.html');
});

/*--------------------------------
============= EVENTS =============
--------------------------------*/

spotify.on({
    ready: spotifyReady
});	

spotify.player.on({
    endOfTrack: function(){
    	playlist.nextTrack();
    }
});

io.sockets.on('connection', function (socket) {

    socket.on('facebookLogin', function(client){

    	var exists = false;

    	clients.forEach(function(currentClient, index){
    		if(currentClient.id == client.fbId) exists = true;
    	});
    	if(!exists){
    		clients.push({name: client.name, fbId: client.id, socketId: socket.id});
    		console.log(colors.verbose(client.name+' connected with uid '+socket.id));
		    socket.emit('connected', {tracks: playlist.tracks, playing: playlist.playing, uid: socket.id, name: client.name});

    	} 
    	else socket.emit('forbidden_auth');

    });	

    socket.on('facebookLogout', function(client){
    	if(client.name != undefined){
    		console.log(colors.verbose(client.name+' with id '+socket.id+' logout'));
	        var tracks = playlist.removeClient(socket.id);
	        updateAllClients(tracks);
	        clients.splice(client.id, 1);
	        socket.emit('disconnected');
    	}
		
    });

    socket.on('search', function(str){
    	search(str, function(tracks){
		   socket.emit('searchResults', tracks);
    	})
    });	
    socket.on('add', function(data){
    	var tracks = playlist.add(data.track, socket.id);
    	socket.emit('added');
    	updateAllClients(tracks);
    	//client = findClientBySocket(socket.id);
    	console.log(colors.info(data.client.name+' with id '+socket.id+' has just added '+data.track.name+' by '+data.track.artists[0].name));
    });	
    socket.on('remove', function(data){
    	if(checkAuthorization(socket, tracks)){
    		client = findClientBySocket(socket.id);
    		console.log(colors.error(data.client.name+' with id '+socket.id+' has just removed '+playlist.tracks[data.id].track.name+' by '+playlist.tracks[data.id].track.artists[0].name));
    		var tracks = playlist.remove(data.id, socket.id);
    		socket.emit('removed');
    		updateAllClients(tracks);
    	} 
    });	
    socket.on('like', function(data){
    	var tracks = playlist.like(data.id, socket.id);
		updateAllClients(tracks);
		//client = findClientBySocket(socket.id);
		console.log(colors.info(data.client.name+' with id '+socket.id+' has just liked '+playlist.tracks[data.id].track.name+' by '+playlist.tracks[data.id].track.artists[0].name));
    });
    socket.on('dislike', function(data){
    	var tracks = playlist.dislike(data.id, socket);
		updateAllClients(tracks);
		client = findClientBySocket(socket.id);
    	console.log(colors.error(data.client.name+' with id '+socket.id+' has just disliked '+playlist.tracks[data.id].track.name+' by '+playlist.tracks[data.id].track.artists[0].name));
    	
    });
    socket.on('disconnect', function(){
    	var toRemove = null;
    	clients.forEach(function(client, index){
    		if(client.socketId == socket.id){
		        toRemove = index;
    		}
    	});
    	if(toRemove != null){
    		console.log(colors.verbose('Client '+socket.id+' logout'));
	        var tracks = playlist.removeClient(socket.id);
	        updateAllClients(tracks);
	        clients.splice(toRemove, 1);
    	} 
        
    });
    socket.on('next', function(){
        playlist.nextTrack();
    });
})

/*--------------------------------
============= LAUNCH =============
--------------------------------*/

art.font('Social Playlist', 'Doom', function(rendered){
	console.log('');
    console.log(rendered);
    loginUsername();
});

