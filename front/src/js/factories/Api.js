app.factory('Api', function($http, $q, Constants, Request) {
  return {

  /**
   * Public Methods
   *
   */

    signin: function(user){
      return Request.send('POST', '/user', user, false);
    },

    signup: function(user){
      return Request.send('POST', '/user/create', user, false);
    },

    searchBid: function(terms){
      return Request.send('POST', '/search', terms, false);
    },

  /**
   * Client Methods
   *
   */

    getAccount: function(){
      return Request.send('GET', '/account', false, true);
    },

    createOperation: function(operation){
      return Request.send('POST', '/operation', operation, true);
    }

  };
});
