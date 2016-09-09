/* test/lib/webrtc */
define ( [
	'1401/settings',
	'1401/system/screen'
], function (
	SETTINGS,
	SCREEN
){

///////////////////////////////////////////////////////////////////////////////
/**	MODULE *******************************************************************\

	Description of MODULE
	
///////////////////////////////////////////////////////////////////////////////
/** PRIVATE MODULE VARIABLES *************************************************/

	var m_pieces = [];

/** PUBLIC API ***************************************************************/

	var WEBRTC = {};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	WEBRTC.Initialize = function () {
		console.log('*** WEBRTC INIT ***');
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	WEBRTC.Construct = function () {
		console.log('*** WEBRTC CONSTRUCT ***');
		SCREEN.DBG_Append('<video id="video" style="float:left;" autoplay></video>');
	};
///	- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	WEBRTC.Start = function () {
		console.log('*** WEBRTC START ***');
		var vid = document.getElementById('video');

		vid.addEventListener('loadedmetadata', function() {
		  console.log('Remote video videoWidth: ' + this.videoWidth +
		    'px,  videoHeight: ' + this.videoHeight + 'px');
		});

		vid.onresize = function() {
		  console.log('Remote video size changed to ' +
		    vid.videoWidth + 'x' + vid.videoHeight);
		};

		var glc = SCREEN.DBG_GetWebGLCanvas();
		var stream = glc.captureStream();

		var videoTracks = stream.getVideoTracks();
		if (videoTracks.length > 0) {
			console.log('Using video device: ' + videoTracks[0].label);
		}

		var servers = null;
		var pc1;
		var pc2;
		var offerOptions = {
		  offerToReceiveAudio: 1,
		  offerToReceiveVideo: 1
		};

		  pc1 = new RTCPeerConnection(servers);
		  console.log('Created local peer connection object pc1');
		  pc1.onicecandidate = function(e) {
		    onIceCandidate(pc1, e);
		  };
		  pc2 = new RTCPeerConnection(servers);
		  console.log('Created remote peer connection object pc2');
		  pc2.onicecandidate = function(e) {
		    onIceCandidate(pc2, e);
		  };
		  pc1.oniceconnectionstatechange = function(e) {
		    onIceStateChange(pc1, e);
		  };
		  pc2.oniceconnectionstatechange = function(e) {
		    onIceStateChange(pc2, e);
		  };
		  pc2.onaddstream = gotRemoteStream;

		  pc1.addStream(stream);
		  console.log('Added local stream to pc1');

		  console.log('pc1 createOffer start');
		  pc1.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError,
		      offerOptions);

		function onCreateSessionDescriptionError(error) {
		  console.log('Failed to create session description: ' + error.toString());
		}

		function onCreateOfferSuccess(desc) {
		  console.log('Offer from pc1\n' + desc.sdp);
		  console.log('pc1 setLocalDescription start');
		  pc1.setLocalDescription(desc, function() {
		    onSetLocalSuccess(pc1);
		  }, onSetSessionDescriptionError);
		  console.log('pc2 setRemoteDescription start');
		  pc2.setRemoteDescription(desc, function() {
		    onSetRemoteSuccess(pc2);
		  }, onSetSessionDescriptionError);
		  console.log('pc2 createAnswer start');
		  // Since the 'remote' side has no media stream we need
		  // to pass in the right constraints in order for it to
		  // accept the incoming offer of audio and video.
		  pc2.createAnswer(onCreateAnswerSuccess, onCreateSessionDescriptionError);
		}

		function onSetLocalSuccess(pc) {
		  console.log(getName(pc) + ' setLocalDescription complete');
		}

		function onSetRemoteSuccess(pc) {
		  console.log(getName(pc) + ' setRemoteDescription complete');
		}

		function onSetSessionDescriptionError(error) {
		  console.log('Failed to set session description: ' + error.toString());
		}

		function gotRemoteStream(e) {
		  video.srcObject = e.stream;
		  console.log('pc2 received remote stream');
		}

		function onCreateAnswerSuccess(desc) {
		  console.log('Answer from pc2:\n' + desc.sdp);
		  console.log('pc2 setLocalDescription start');
		  pc2.setLocalDescription(desc, function() {
		    onSetLocalSuccess(pc2);
		  }, onSetSessionDescriptionError);
		  console.log('pc1 setRemoteDescription start');
		  pc1.setRemoteDescription(desc, function() {
		    onSetRemoteSuccess(pc1);
		  }, onSetSessionDescriptionError);
		}

		function onIceCandidate(pc, event) {
		  if (event.candidate) {
		    getOtherPc(pc).addIceCandidate(new RTCIceCandidate(event.candidate),
		        function() {
		          onAddIceCandidateSuccess(pc);
		        },
		        function(err) {
		          onAddIceCandidateError(pc, err);
		        }
		    );
		    console.log(getName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
		  }
		}

		function onAddIceCandidateSuccess(pc) {
		  console.log(getName(pc) + ' addIceCandidate success');
		}

		function onAddIceCandidateError(pc, error) {
		  console.log(getName(pc) + ' failed to add ICE Candidate: ' + error.toString());
		}

		function onIceStateChange(pc, event) {
		  if (pc) {
		    console.log(getName(pc) + ' ICE state: ' + pc.iceConnectionState);
		    console.log('ICE state change event: ', event);
		  }
		}

		function getName(pc) {
		  return (pc === pc1) ? 'pc1' : 'pc2';
		}

		function getOtherPc(pc) {
		  return (pc === pc1) ? pc2 : pc1;
		}

	};

///////////////////////////////////////////////////////////////////////////////
/** PRIVATE MODULE FUNCTIONS *************************************************/

	function m_PrivateFunction () {
	}

///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
	return WEBRTC;

});
