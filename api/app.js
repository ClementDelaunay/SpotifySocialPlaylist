"use strict"
/**
 * @file index.js
 * @description
 * API Initialization
 */
;(function(log, err, exit, undefined) {

  const modulesPath = '../';

  /* ########################################
     LOAD FILES
     ######################################## */

  /**
   * Get package.json file in `appPackage` variable
   */
  try {
    var appPackage = require(modulesPath + 'package.json');
  } catch (e) {
    /**
    * Permission problem or bad package.json formatting (or not found)
    */
    err(e);
    exit();
  }


  // Getting Tools
   const utils = require('./utils/files.js');

   //Controllers
   const musicCtrl = require('./controllers/musicCtrl.js');
   const userCtrl = require('./controllers/userCtrl.js');


/* ########################################
   LOAD DEPENDENCIES
   ######################################## */

   const Hapi = require('hapi');
   const config = require('config');
   const jwt = require('jsonwebtoken');
   const hapiAuthJwt = require('hapi-auth-jwt2');
   const mongoose = require('mongoose');
   const ascii = require('ascii-art');
   const io = require('socket.io');

/* ########################################
   GLOBAL DEPENDENCIES
   ######################################## */

  const colors = require('colors');
  const _ = require('lodash');
  global.log = log;
  colors.setTheme({
    verbose: 'cyan',
    success: 'green',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  });
  global.colors = colors;
  global._ = _;

  /* ########################################
     SPOTIFY CONFIGURATION
     ######################################## */

  const crSpot = config.get('spotify.credentials');
  global.spotifyConfig = config.get('spotify.config');

  const options = {
      cacheFolder: 'cache',
      settingsFolder: 'settings',
      appkeyFile: './spotify_appkey.key'
  };
  // const spotify = require('node-spotify')(options);
  global.spotify = require('node-spotify')(options);


/* ########################################
   GLOBAL CONFIGURATION
   ######################################## */

  const server = new Hapi.Server();
  global.socketUsers = [];
  global.DEBUG_MODE = config.get('server.debug');
  server.connection(config.get('server.connection'));
  global.socketio = io(server.listener);

  server.register([require('inert'),require('vision')]);

  /* ########################################
   AUTHENTICATION CONFIGURATION
   ######################################## */

   var validateAuth = function (decoded, request, callback) {

    var authRole = false;
    if (request.route.settings.validate.options.scope.indexOf(decoded.scope) > -1) authRole = true;

    jwt.verify(request.headers.authorization, config.get('server.auth.secretKey'), function(err, decoded) {
      if (err || !authRole) {
        return callback(null, false);
      } else {
        return callback(null, true);
      }
    });

  };

  server.register(hapiAuthJwt, function (err) {

    if(err){
      console.log(err);
    }

    server.auth.strategy('credentials', 'jwt', false,
    { key: config.get('server.auth.secretKey'), // Never Share Secret key
      validateFunc: validateAuth,               // Validate function defined above
      verifyOptions: { algorithms: [ 'HS256' ], ignoreExpiration: true } // Pick a strong algorithm
    });

  });

  var startServer = {
    routes:function(){
      /* ########################################
       ROUTES CONFIGURATION
       ######################################## */
      log(colors.warn("Initializing routes"));
      utils.getFiles('routes').forEach(function(routesFile) {
        // Loop in routing array in each file
        require(routesFile).forEach(function(route) {

          // Add prefix to API routes
          if(route.path !== '/{file*}') route.path = config.get('server.api.prefix') + route.path;
          var scope = 'public';
          if(route.config.auth) scope = (route.config.validate.options.scope).toString();
          log(" +  %s %s", route.method, route.path);
          log(" ---------------------------  %s ", scope);
          // Add all routes to HapiJS
          server.route(route);
        });
      });
    },
    sockets: function(){
      socketio.on('connection', function (socket) {
        if(DEBUG_MODE) console.log(colors.verbose('New anonymous client connected with id '+socket.id));
        socket.emit('connected', socket.id);
        socket.on('login', function (user) { userCtrl.onLogin({socket: socket, user: user }) });
        socket.on('search', function(str){
        	musicCtrl.search(str, function(tracks){
    		   socket.emit('searchResults', tracks);
        	})
        });
        socket.on('add', function(data){
        	var tracks = playlist.add(data.track, data.user);
        	socket.emit('added');
        	userCtrl.updateAllClients(tracks);
        	//client = findClientBySocket(socket.id);
        	console.log(colors.success(data.user.name +' has just added '+data.track.name+' by '+data.track.artists[0].name));
          console.log(colors.verbose('########################################'));
          console.log(colors.verbose('NEW SONG'));
          console.log(colors.verbose('-------------------'));
          console.log(colors.verbose('Name : '+data.track.name));
          console.log(colors.verbose('Artist : '+data.track.artists[0].name));
          console.log(colors.verbose('Album : '+data.track.album.name));
          console.log(colors.verbose('-------------------'));
          console.log(colors.verbose('Tracks queued : '+tracks.length));
          console.log(colors.verbose('########################################'));
        });

        socket.on('like', function(data){
        	var tracks = playlist.like(data.id, data.user.id);
      		userCtrl.updateAllClients(tracks);
      		//client = findClientBySocket(socket.id);
      		console.log(colors.success(data.user.name+' has just liked '+playlist.tracks[data.id].track.name+' by '+playlist.tracks[data.id].track.artists[0].name));
        });
        socket.on('dislike', function(data){
          console.log(colors.error(data.user.name+' has just disliked '+playlist.tracks[data.id].track.name+' by '+playlist.tracks[data.id].track.artists[0].name));
          var tracks = playlist.dislike(data.id, data.user.id);
      		userCtrl.updateAllClients(tracks);
        });
        socket.on('remove', function(data){
          var trackName = playlist.tracks[data.id].track.name, artistName = playlist.tracks[data.id].track.artists[0].name;
      		var tracks = playlist.remove(data.id, data.user.id);
      		if(tracks != 'forbidden'){
            socket.emit('removed');
            userCtrl.updateAllClients(tracks);
            console.log(colors.error(data.user.name+' with id '+socket.id+' has just removed '+trackName+' by '+artistName));
          }
          else socket.emit('forbidden');

        });

        socket.on('facebookLogout', function(user){
            console.log(colors.error(user.name+' with id '+user.id+' logout'));
            var tracks = playlist.removeClient(user.id);
            updateAllClients(tracks);
            socketUsers.splice(user.id, 1);
            socket.emit('disconnected');
        });


        socket.on('next', function(){
            playlist.nextTrack();
        });

        // socket.on('disconnect', function (user) {});
        // Search in fb users the socket id and delete the entry
      });
    }

  };

  /* ########################################
   SERVER START
   ######################################## */


   // Start Server
   server.start(function() {
     ascii.font(appPackage.name, 'Doom', function(rendered){
       console.log(rendered);
       //Start Spotify
       console.log(colors.warn('Login to Spotify...'));
       spotify.login(crSpot.login, crSpot.password, false, false);
     });
   });

   // When Spotify is Ready
   spotify.on({
       ready: function(err) {
           if(err) {
               console.log(colors.error('Login failed!'));
               console.log(err)
               console.log('');
              //  loginUsername(true);
           } else {
             console.log(colors.success('Login succeded!'));
             console.log(colors.warn('Init server...'));

              // Start HapiJS Server
             startServer.routes();
             startServer.sockets();
             global.playlist = new musicCtrl.Playlist();
             console.log(colors.success(appPackage.name+' '+appPackage.version+ ' launched on '+server.info.uri));
             socketio.sockets.emit('serverReady');

           }
       }
   });

   /* ########################################
    SPOTIFY EVENTS
    ######################################## */

   spotify.player.on({
        endOfTrack: function(){
          playlist.nextTrack();
        }
    });


})(console.log, console.error, process.exit);
