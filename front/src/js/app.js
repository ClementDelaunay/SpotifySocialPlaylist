'use strict';
var app = angular.module('SocialPlaylist', [
  'ui.router',
  'ngProgress',
  'ngCookies',
  'facebook'
]);

app.config(function(FacebookProvider) {
   FacebookProvider.init('YOUR_FB_APP_ID');
})

app.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  /**
   * Public Routes
   *
   */

  .state('signin', {
    url: '/signin',
    views: {
      main: {
          templateUrl: 'views/signin.html'
      }
    }
  })

  .state('playing', {
    url: '/playing',
    views: {
      main: {
          templateUrl: 'views/playing.html'
      }
    }
  })


  $urlRouterProvider.otherwise('/signin');

});
