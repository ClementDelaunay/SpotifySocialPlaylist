app.factory('Request', function($http, $q, Session, Constants) {
  return {

    send: function(verb, route, data, auth){
      var config = {method: verb, url: Constants.serverUrl+Constants.apiPath+route}
      if(auth) config.headers = {'Authorization': Session.token.get()};
      if(verb == 'POST') config.data = data;

      var deferred = $q.defer();
      $http(config).success(function(data) {
        deferred.resolve(data);
      })
      .error(function(err) {
        deferred.reject(err);
        console.log(err);
      });

      return deferred.promise;
    },
    json: function(file, cb){
      $http.get('data/'+file+'.json').success(function(data) {
        cb(data);
      });
    }

  };
});
