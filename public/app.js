var socialPlaylist = angular.module('SocialPlaylist', []);

socialPlaylist.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

socialPlaylist.run(['$rootScope', '$window', 'facebookService', 
  function($rootScope, $window, sAuth) {

  $rootScope.user = {};

  $window.fbAsyncInit = function() {

    FB.init({ 
      appId: 'YOUR_FB_APP_ID',
      channelUrl: 'app/channel.html',
      status: true, 
      cookie: true, 
      xfbml: true 
    });

    sAuth.watchLoginChange();

  };


  (function(d){

    var js, 
    id = 'facebook-jssdk',
    ref = d.getElementsByTagName('script')[0];

    if (d.getElementById(id)) {
      return;
    }

    js = d.createElement('script'); 
    js.id = id; 
    js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";

    ref.parentNode.insertBefore(js, ref);

  }(document));

}]);

socialPlaylist.factory('facebookService', function($rootScope, $q) {
    return {
      logout: function() {

        var _self = this;

        FB.logout(function(response) {

          $rootScope.$apply(function() { 
            socket.emit('facebookLogout', $rootScope.user);
            $rootScope.user = _self.user = {}; 
          }); 

        });

      },
      getUserInfo: function() {

        var _self = this;

        FB.api('/me', function(res) {

          $rootScope.$apply(function() { 

            $rootScope.user = _self.user = res; 
            socket.emit('facebookLogin', $rootScope.user);

          });

        });

      },
      watchLoginChange: function() {

        var _self = this;

        FB.Event.subscribe('auth.authResponseChange', function(res) {

          if (res.status === 'connected') {
            
            _self.getUserInfo();

          } 
          else {
            socket.emit('facebookLogout', $rootScope.user);
            $rootScope.user = _self.user = {}; 
          }

        });

      }
    }
});

socialPlaylist.directive('onLongPress', function($timeout) {
  return {
    restrict: 'A',
    link: function($scope, $elm, $attrs) {
      $elm.bind('touchstart', function(evt) {
        $scope.longPress = true;
        $timeout(function() {
          if ($scope.longPress) {
            $scope.$apply(function() {
              $scope.$eval($attrs.onLongPress)
            });
          }
        }, 600);
      });

      $elm.bind('touchend', function(evt) {
        $scope.longPress = false;
        if ($attrs.onTouchEnd) {
          $scope.$apply(function() {
            $scope.$eval($attrs.onTouchEnd)
          });
        }
      });
    }
  };
});

socialPlaylist.controller('AppController', function($window, $rootScope, $scope, $http, $timeout, $interval, facebookService) {

    var findIndexInArrayFromProp = function(array, property, value){
      indexes = array.map(function(obj, index) {
        if(obj[property] == value) {
            return index;
        }
      }).filter(isFinite)
      return indexes[0];
    };

    var self = this, idModal = '#infoTrack';
    this.data = {
      forbiddenAuth: false,
      auth: false,
      name: "",
      uid: "",
      search: "",
      toRemove: {},
      tracks: [],
      playlist: []
    };
    this.interface = {
      playing: {
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
        empty: 'No songs, too bad...'
      } 
    };
    this.intervalPlaying = undefined;
    socket = io();

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
      facebookService.logout();
    };

    this.clearSearch = function(){
      this.data.search = "";
      this.data.tracks = [];
    };

    this.search = function(){
      if(this.data.search != ""){
        socket.emit('search', this.data.search);
      }
      else this.data.tracks = [];
    };
    this.next = function(){
      socket.emit('next');
    };

    this.likeDislike = function(track, index, type){
      var like = track.likes.indexOf(this.data.uid) > -1;
      var dislike = track.dislikes.indexOf(this.data.uid) > -1;
      if(type == 1 && !like) socket.emit('like', {client: $rootScope.user, id: index});
      else if(type == 0 && !dislike) socket.emit('dislike', {client: $rootScope.user, id: index});
    };

    this.add = function(track){
      this.interface.focusSearch = false;
      socket.emit('add', {client: $rootScope.user, track: track});
    };
    this.showRemove = function(track) {
      if(track.owner == this.data.uid){
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
      socket.emit('remove', {client: $rootScope.user, id: index});
    };
    this.playing = function(playing){
      this.interface.playing = playing;
      if(this.intervalPlaying != undefined){
        $interval.cancel(this.intervalPlaying);
        this.intervalPlaying = undefined;
        self.interface.playing.duration.current = 0;
      }
      this.intervalPlaying = $interval(function(){
        self.interface.playing.duration.current++;
      },1000);
    };
    socket.on('connected', function(data){
      $timeout(function(){
        console.log(data);
        self.data.playlist = data.tracks;
        self.data.uid = data.uid;
        self.data.name = data.name;
        self.data.auth = true;
        self.data.forbiddenAuth = false;
        if(data.playing.playing) self.playing(data.playing);
        self.interface.loading.display = self.interface.loading.empty;
      });
    });
    socket.on('disconnected', function(data){
      $timeout(function(){
        self.data.auth = false;
        self.data.forbiddenAuth = false;
      });
    });
    socket.on('forbidden_auth', function(data){
      $timeout(function(){
        self.data.forbiddenAuth = true;
      });
    });
    socket.on('update', function(tracks){
      $timeout(function(){
        if(tracks.playing != undefined){
          self.playing(tracks.playing);
          self.data.playlist = tracks.tracks;
          if(tracks.playing.playing == false) $interval.cancel(self.intervalPlaying);
        } 
        else self.data.playlist = tracks;
      });
    });
    socket.on('removed', function(){
      $timeout(function(){
        self.interface.modal.confirm = false;
        self.interface.modal.display = self.interface.modal.remove;
      });
      modal.showHide();
    });
    socket.on('added', function(){
      self.interface.modal.display = self.interface.modal.add;
      modal.showHide();
    });
    socket.on('searchResults', function(tracks){
      $timeout(function(){
        self.data.tracks = tracks;
      });
    });
    socket.on('forbidden', function(){
      $timeout(function(){
        self.interface.modal.display = self.interface.modal.forbidden;
      });
      modal.showHide();
    });
    socket.on('autodestroy', function(track){
      $timeout(function(){
        var modal = self.interface.modal.autodestroy;
        self.interface.modal.display.title = modal.title;
        self.interface.modal.display.text = modal.text(track.track.name, track.track.artists[0].name);
      });
      modal.show();
    });

});