(function(){
	var app = angular.module('projectRtc', [],
		function($locationProvider){$locationProvider.html5Mode(true);}
    );
	var client = new PeerManager();
	var mediaConfig = {
        audio:true,
        video: {
			mandatory: {},
			optional: []
        }
    };

    app.factory('camera', ['$window', function($window){
    	var camera = {};
    	camera.isOn = false;
    	camera.preview = $window.document.getElementById('localVideo');

    	camera.start = function(){
			return requestUserMedia(mediaConfig)
			.then(function(stream){			
				attachMediaStream(camera.preview, stream);
				client.setLocalStream(stream);
				camera.stream = stream;
				camera.isOn = true;
			})
			.catch(Error('Failed to get access to local media.'));
		};
    	camera.stop = function(){
			client.send('leave');
    		client.setLocalStream(null);
			camera.stream.stop();
			camera.preview.src = '';
			camera.isOn = false;
		};
		return camera;
    }]);

	app.controller('RemoteStreamsController', ['camera', '$location', '$http', function(camera, $location, $http){
		var rtc = this;
		rtc.remoteStreams = [];
		rtc.loadData = function () {
			// get list of streams from the server
			$http.get('/streams.json').success(function(data){
				// filter own stream
				rtc.remoteStreams = data.filter(function(stream) {
			      	return stream.id != client.getId();
			    });
			});
		};

		rtc.view = function(stream){
			client.peerInit(stream.id);
		};
		rtc.call = function(stream){
			var id = stream.id || stream;
			if(!camera.isOn){
				camera.start()
				.then(function(result) {
					client.pushStream(id);
				})
				.catch(function(err) {
					console.log(err);
				});
			} else {
				client.pushStream(id);
			}
		};

		//initial load
		rtc.loadData();
    	if($location.url() != '/'){
      		rtc.call($location.url().slice(1));
    	};
	}]);

	app.controller('LocalStreamController',['camera', '$window', function(camera, $window){
		var localStream = this;
		localStream.name = 'Guest';
		localStream.link = '';

		localStream.toggleCam = function(){
			if(camera.isOn){
				camera.stop();
			} else {
				camera.start()
				.then(function(result) {
					localStream.link = $window.location.host + '/' + client.getId();
					client.send('readyToStream', { name: localStream.name });
				})
				.catch(function(err) {
					console.log(err);
				});
			}
		};
	}]);
})();