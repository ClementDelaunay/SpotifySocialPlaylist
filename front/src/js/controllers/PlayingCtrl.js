app.controller('PlayingCtrl', function($scope, $rootScope, $document, $timeout, $interval, $stateParams, Constants, Api, Session, Utils) {

    $rootScope.viewTitle = "Music";

    var self = this, idModal = '#infoTrack';

    /* ########################################
       UTILS (TO MOVE)
       ######################################## */

    var findIndexInArrayFromProp = function(array, property, value){
      var indexes = array.map(function(obj, index) {
        if(obj[property] == value) {
            return index;
        }
      }).filter(isFinite)
      return indexes[0];
    };

    /* ########################################
       INIT DATA
       ######################################## */

    this.data = {
      forbiddenAuth: false,
      auth: false,
      search: "",
      toRemove: {},
      tracks: [],
      playlist: []
    };
    this.interface = {
      spotify: {
        playing: false,
        artist:"",
        track: "",
        duration:{
          total: 0,
          current: 0
        }
      },
      modal:{
        display:{},
        add:{title:"Track added", text:"The track has been added!"},
        remove:{title:"Track deleted", text:"The track has been deleted :("},
        askRemove:{title:"Remove track", text:"Remove this track from playlist ?"},
        noRemove:{title:"Forbidden", text:"You can remove only your own tracks!"},
        forbidden:{title:"Forbidden", text:"You are not allowed to perform this action"},
        autodestroy:{
          title:"Track deleted",
          text:function(track, artist){
            return "The track \""+track+"\" by \""+artist+"\" has received too many negative votes and was deleted";
          },
        },
        confirm: false,
        focusSearch: false,
      },
      loading:{
        display: 'Loading data...',
        empty: 'No songs queued'
      }
    };


    this.intervalPlaying = undefined;

    var modal = {
      show: function(confirm){
        if(confirm != undefined) self.interface.modal.confirm = true;
        $timeout(function(){
          $(idModal).modal('show');
        });
      },
      hide: function(){
        $timeout(function(){
          $(idModal).modal('hide');
        });
      },
      showHide:function(delay){
        var that = this;
        if(delay == undefined) delay = 1500;
        that.show();
        $timeout(function(){
          that.hide();
        }, delay);
      }
    };

    this.logout = function(){
      $rootScope.socketio.emit('facebookLogout', Session.user.get());
    };

    this.clearSearch = function(){
      this.data.search = "";
      this.data.tracks = [];
    };

    this.search = function(){
      if(this.data.search != ""){
        $rootScope.socketio.emit('search', this.data.search);
      }
      else this.data.tracks = [];
    };
    this.next = function(){
      $rootScope.socketio.emit('next');
    };

    this.likeDislike = function(track, index, type){
      console.log(Session.user.get());
      var like = track.likes.indexOf(this.data.uid) > -1;
      var dislike = track.dislikes.indexOf(this.data.uid) > -1;
      if(type == 1 && !like) $rootScope.socketio.emit('like', {user: Session.user.get(), id: index});
      else if(type == 0 && !dislike) $rootScope.socketio.emit('dislike', {user: Session.user.get(), id: index});
    };

    this.add = function(track){
      this.interface.focusSearch = false;
      $rootScope.socketio.emit('add', {user: Session.user.get(), track: track});
    };
    this.showRemove = function(track) {
      if(track.owner.id == Session.user.get().id){
        self.interface.modal.display = self.interface.modal.askRemove;
        this.data.toRemove = track.uid;
        modal.show(true);
      }
      else{
        self.interface.modal.display = self.interface.modal.noRemove;
        modal.show();
      }

    };
    this.remove = function() {
      var index = findIndexInArrayFromProp(this.data.playlist, 'uid', this.data.toRemove);
      $rootScope.socketio.emit('remove', {user: Session.user.get(), id: index});
    };




    /* ########################################
       SOCKETS LISTENER
       ######################################## */

     $rootScope.socketio.on('serverReady', function(data){
       location.reload();
     });


    $rootScope.socketio.on('fbAuthenticated', function(data){
      // $timeout(function(){
        console.log(data);
        self.data.playlist = data.tracks;
        if(data.playing.playing) self.playing(data.playing);
        self.interface.loading.display = self.interface.loading.empty;
      // });
    });
    $rootScope.socketio.on('disconnected', function(data){
      Session.clear(function(){
        console.log('coucou')
        $state.go('signin');
      });
    });
    $rootScope.socketio.on('update', function(data){
      $timeout(function(){
        if(data.playing != undefined){
          self.playing(data.playing);
          self.data.playlist = data.tracks;
          if(self.interface.spotify.playing == false) $interval.cancel(self.intervalPlaying);
        }
        else self.data.playlist = data;
      });
    });
    this.playing = function(playing){
      this.interface.spotify = playing;
      if(this.intervalPlaying != undefined){
        $interval.cancel(this.intervalPlaying);
        this.intervalPlaying = undefined;
        self.interface.spotify.duration.current = 0;
      }
      this.intervalPlaying = $interval(function(){
        self.interface.spotify.duration.current++;
      },1000);
    };


    $rootScope.socketio.on('removed', function(){
      $timeout(function(){
        self.interface.modal.confirm = false;
        self.interface.modal.display = self.interface.modal.remove;
      });
      modal.showHide();
      //Notif
    });
    $rootScope.socketio.on('added', function(){
      // self.interface.modal.display = self.interface.modal.add;
      // modal.showHide();


      //Notif
    });
    $rootScope.socketio.on('searchResults', function(tracks){
      $timeout(function(){
        self.data.tracks = tracks;
      });
    });
    $rootScope.socketio.on('forbidden', function(){
      $timeout(function(){
        self.interface.modal.display = self.interface.modal.forbidden;
      });
      modal.showHide();
    });
    $rootScope.socketio.on('autodestroy', function(track){
      $timeout(function(){
        var modal = self.interface.modal.autodestroy;
        self.interface.modal.display.title = modal.title;
        self.interface.modal.display.text = modal.text(track.track.name, track.track.artists[0].name);
      });
      modal.show();
    });

});
