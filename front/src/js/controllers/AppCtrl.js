app.controller('AppCtrl', function($window, $scope, $rootScope, $timeout, $state, $stateParams, Constants, Api, Session, Utils, Facebook) {

	var self = this;
	$rootScope.prefixTitle = "Music";
  $scope.currentState = $state;
	$scope.domReady = false;
  this.utils = Utils;
	this.publicData = Session.publicData.get();
  this.states = {
    user:['account'],
    public:['signin']
  }
	this.session = Session;

	$rootScope.socketio = io(Constants.serverUrl);

	$rootScope.socketio.on('connected', function(socketId){
		$rootScope.socketId = socketId;
		$timeout(function(){
			$rootScope.domReady = true;
			if(Session.user.isConnected()) $rootScope.socketio.emit('login', Session.user.get());
		});
  });

	$(document).on('click', 'a', function(){
		$(this).blur();
	});

	this.login = function(e){
		Facebook.login(function(response) {
			if(response.status == "connected"){
				self.getUserData();
			}
			else{
				Session.clear(function(){
					$state.go('signin');
				});
			}
    });

	};

	this.setAuth = function(user){
    Session.user.set(user);
    Session.user.save();
    $state.go('playing');
		$rootScope.socketio.emit('login', Session.user.get());
  }

	this.getUserData = function() {
      Facebook.api('/me', function(response) {
        self.setAuth(response);
      });
  };

	this.checkFbAuth = function(){
		Facebook.getLoginStatus(function(response) {
			 if(response.status === 'connected') {
					self.getUserData();
			 }
			 else {
					Session.clear(function(){
						$state.go('signin');
					});
			 }
		 });
	}

	$scope.$watch('currentState.current.name', function(newState, oldState) {
    self.checkFbAuth();
  });

	(function Init() {
		self.checkFbAuth();
  })();

  this.logout = function(){
    Session.clear(function(){
        $window.location.reload();
    });
  };
});
