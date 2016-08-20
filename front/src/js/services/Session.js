app.service('Session', function($cookies) {

    var session = {};
    var self = this;

    var USER_KEY = 'playlist-cookie-user';
    var PUBLIC_DATA = 'suw-local-storage-public-data';

    (function Init() {
      session.user = $cookies.getObject(USER_KEY) || false;
      session.publicData = JSON.parse(localStorage.getItem(PUBLIC_DATA)) || {};
    })();

    this.clear = function(cb) {
      session.user = false;
      $cookies.remove(USER_KEY);
      cb();
    };

    this.publicData = {
      get: function(){
        return session.publicData;
      },
      set: function(data){
        if(data) session.publicData = data;
      },
      save: function(){
        if (session.publicData)
          localStorage.setItem(PUBLIC_DATA, JSON.stringify(session.publicData));
      }

    };

    this.user = {
      isConnected: function() {
        if(session.user) return true;
        else return false;
      },
      get: function(){
        if (!session.user) return false;
        else return session.user;
      },
      set: function(u){
        if(!u) return false;
        self.set('user', u);
      },
      save: function(){
        if (session.user)
          $cookies.putObject(USER_KEY, session.user);
      }

    };

    this.set = function(key, value) {
      session[key] = value;
    };

    this.get = function(key) {
      return session[key];
    };

    return this;
  });
