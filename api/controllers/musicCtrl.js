"use strict"
/**
 * Music Controller
 */

const async = require('async');
const userCtrl = require('./userCtrl.js');
const stringsUtils = require('../utils/strings.js');

module.exports = {
  name: 'Music',
  search: function(str, cb){
  	var limit = 15, offset = 0;
    var search = new spotify.Search(str, offset, limit);
  	search.execute(function(err, searchResult) {
  	    var foundTracks = searchResult.tracks;
  	    cb(foundTracks);
  	});
  },
  Playlist: function () {
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
  		var newTrack = {uid: stringsUtils.stringGen(15), track: track, likes: [], dislikes: [], score: 0, owner: user};
  		if(this.tracks.length == 0 && this.playing.playing == false) this.play(newTrack);
  		else this.tracks.push(newTrack);
  		// console.log(colors.verbose(this.tracks.length+' tracks queued'));
      	return this.tracks;
  	};
  	this.remove = function (id, userId, auto) {
  		if(this.tracks[id].owner.id == userId || auto != undefined){
  			this.tracks.splice(id, 1);
  			console.log(colors.verbose(this.tracks.length+' tracks queued'));
  			return this.tracks;
  		}
  		else return 'forbidden';
  	};
  	this.like = function (id, userId) {
  		var indexOfLike = this.tracks[id].likes.indexOf(userId);
  		if(indexOfLike == -1){
  			this.tracks[id].likes.push(userId);
  			var disliked = this.tracks[id].dislikes.indexOf(userId);
  			if(disliked > -1) this.tracks[id].dislikes.splice(disliked, 1);
  			this.tracks[id].score = this.calcScore(this.tracks[id]);
  		}
  		else{
  			this.tracks[id].likes.splice(indexOfLike);
  			this.tracks[id].score = this.calcScore(this.tracks[id]);
  		}
  		return this.tracks;
  	};
  	this.dislike = function (id, userId) {
  		var indexOfDislike = this.tracks[id].dislikes.indexOf(userId);
      if(indexOfDislike == -1){
  			this.tracks[id].dislikes.push(userId);
  			var liked = this.tracks[id].likes.indexOf(userId);
  			if(liked > -1) this.tracks[id].likes.splice(liked, 1);
  			this.tracks[id].score = this.calcScore(this.tracks[id]);
  			if(spotifyConfig.autoDestroy.activated) return this.autoDestroy(this.tracks[id], id);
  			else return this.tracks;
  		}
  		else{
  			this.tracks[id].dislikes.splice(indexOfDislike);
  			this.tracks[id].score = this.calcScore(this.tracks[id]);
  			return this.tracks;
  		}
  	};
  	this.autoDestroy = function(track, id){
  		if(Object.keys(socketUsers).length >= spotifyConfig.autoDestroy.minClients && (track.dislikes.length*100)/Object.keys(socketUsers).length >= spotifyConfig.autoDestroy.maxPercentage){
        console.log(colors.error('Auto removing '+track.track.name+' by '+track.track.artists[0].name));
  			socketio.sockets.emit('autodestroy', track);
  			this.tracks = this.remove(id, false, true);
  			userCtrl.updateAllClients(this.tracks);
  		}
  		return this.tracks;
  	};
  	this.removeClient = function(userId) {
  		var self = this;
      var tracksToDelete = [];
  		this.tracks.forEach(function(track, currentIndex){
  			var disliked = track.dislikes.indexOf(userId), liked = track.likes.indexOf(userId);
  			if(liked > -1) track.likes.splice(liked, 1);
  			if(disliked > -1) track.dislikes.splice(disliked, 1);
  			track.score = self.calcScore(track);
        if(track.owner == userId) tracksToDelete.push(currentIndex);
  		});
      if(tracksToDelete.length > 0){
        tracksToDelete.forEach(function(indexTrack){
    			this.tracks.splice(indexTrack, 1);
    		});
      }
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
      console.log(colors.warn('########################################'));
      console.log(colors.warn('NOW PLAYING'));
      console.log(colors.warn('-------------------'));
      console.log(colors.warn('Song : '+track.track.name));
      console.log(colors.warn('Artist : '+track.track.artists[0].name));
      console.log(colors.warn('Album : '+track.track.album.name));
      console.log(colors.warn('########################################'));
  		socketio.sockets.emit('update', { tracks: this.tracks, playing: this.playing});
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
  		socketio.sockets.emit('update', { tracks: this.tracks, playing: this.playing});
  	}
  }

};
