/* test/lib/webrtc */
define ( [
  '1401/settings',
  '1401/system/screen'
], function (
  SETTINGS,
  SCREEN
){

///////////////////////////////////////////////////////////////////////////////
/** WEBRTC MIRRORING DEMO ****************************************************\

  This is a rewritten and clarified version of: 
  https://webrtc.github.io/samples/src/content/capture/canvas-pc/


/** PUBLIC API ***************************************************************/

  var WEBRTC = {};
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  WEBRTC.Initialize = function () {
    console.log('*** WEBRTC INIT ***');
  };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  WEBRTC.Construct = function () {
    console.log('*** WEBRTC CONSTRUCT ***');
    SCREEN.DBG_Append('<video id="webgl_mirror" style="float:left;" autoplay></video>');
  };
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/*/ Implements a peer-to-peer connection between a source (taken from
  the WebGL canvas via canvas.captureScreen() method) and a remote peer
  connection (video element). This code works though only because it doesn't
  implement a remote webapp, relying on closures. However, this cleaned-up
  example shows the flow of connection creation; a way of conveying the
  remote peer connection stuff over the network will make this actually
  useful.
/*/ WEBRTC.Start = function () {

    // CANVAS MIRROR VIDEO ELEMENT SETUP ////////////////////////////////

    var videoElement = document.getElementById('webgl_mirror');
    videoElement.addEventListener('loadedmetadata', function() {
      console.log('Remote video videoWidth: ' + this.videoWidth +
        'px,  videoHeight: ' + this.videoHeight + 'px');
    });
    videoElement.onresize = function() {
      console.log('Remote video size changed to ' +
        videoElement.videoWidth + 'x' + videoElement.videoHeight);
    };


    // GET MEDIASTREAM SOURCE FROM WEBGL ////////////////////////////////

    var glc   = SCREEN.DBG_GetWebGLCanvas();
    var stream  = glc.captureStream();

    var videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      console.log('Using video device: ' + videoTracks[0].label);
    }


    // WEBRTC SETUP /////////////////////////////////////////////////////

    // create source peer connections (pconn)
    var rtc_config_opts = null;
    var pc_src = new RTCPeerConnection( rtc_config_opts );
    var pc_rec = new RTCPeerConnection( rtc_config_opts );

    // ensure that when one pconn gets a candidate connection
    // server, the other one knows about it too
    pc_src.onicecandidate = function(e) {
      ShareIceCandidate(pc_src, e);
    };
    pc_rec.onicecandidate = function(e) {
      ShareIceCandidate(pc_rec, e);
    };

    // provide diagnostic information about 
    // connection state changes
    pc_src.oniceconnectionstatechange = function(e) {
      PrintIceStateChangeInfo(pc_src, e);
    };
    pc_rec.oniceconnectionstatechange = function(e) {
      PrintIceStateChangeInfo(pc_rec, e);
    };

    // set handler for when a stream becomes available
    // to attach to a video object
    pc_rec.onaddstream = function ( e ) {
      videoElement.srcObject = e.stream;
      console.log('pc_rec received remote stream');
    };

    // add the active stream to the source peer connection
    // so it's ready to send data when connection is made!
    pc_src.addStream(stream);

    // specify offer options before making the offer
    var offerOptions = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1
    };

    // make the offer to remote, which will respond with an answer
    // NOTE: createOffer() and createAnswer() return a Promise
    pc_src.createOffer( offerOptions )
      .then( function( offer ) {
        console.log('Offer from pc_src\n' + offer.sdp);
        console.log('pc_src setLocalDescription start');
        /*NOTE*DEPRECATED SYNTAX*/
        pc_src.setLocalDescription( 
          offer,
          function(){PrintSessionSuccess(pc_rec);},
          PrintSessionError
        );

       console.log('pc_rec setRemoteDescription start');
        /*NOTE*DEPRECATED SYNTAX*/
        pc_rec.setRemoteDescription(
          offer, 
          function(){PrintSessionSuccess(pc_rec);},
          PrintSessionError
        );

        console.log('pc_rec createAnswer start');
        // Since the 'remote' side has no media stream we need
        // to pass in the right constraints in order for it to
        // accept the incoming offer of audio and video.
        pc_rec.createAnswer()
          .then(function(answer) {
            console.log('Answer from pc_rec:\n' + answer.sdp);
            console.log('pc_rec setLocalDescription start');
            pc_rec.setLocalDescription(
              answer, 
              function(){PrintSessionSuccess(pc_rec);},
              PrintSessionError
            );

            console.log('pc_src setRemoteDescription start');
            pc_src.setRemoteDescription(
              answer, 
              function(){PrintSessionSuccess(pc_rec);},
              PrintSessionError
            );
          });
      }).catch( function (error) { 
        console.log('failed to create session description');
      });

  //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function PrintSessionSuccess(pc) {
      console.log(u_GetName(pc) + ' setRemoteDescription complete');
    }
  //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function PrintSessionError(error) {
      console.log('Failed to set session description: ' + error.toString());
    }
  //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function ShareIceCandidate(pc, event) {
      if (event.candidate) {
        u_GetOtherPc(pc).addIceCandidate(new RTCIceCandidate(event.candidate),
            function() {
              console.log(u_GetName(pc) + ' addIceCandidate success');
            },
            function(error) {
              console.log(u_GetName(pc) + ' failed to add ICE Candidate: ' + error.toString());
            }
        );
        console.log(u_GetName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
      }
    }
  //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function PrintIceStateChangeInfo(pc, event) {
      if (pc) {
        console.log(u_GetName(pc) + ' ICE state: ' + pc.iceConnectionState);
        console.log('ICE state change event: ', event);
      }
    }
  //  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function u_GetName(pc) {
      return (pc === pc_src) ? 'pc_src' : 'pc_rec';
    }
  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function u_GetOtherPc(pc) {
      return (pc === pc_src) ? pc_rec : pc_src;
    }
  };


///////////////////////////////////////////////////////////////////////////////
/** RETURN MODULE ************************************************************/
  return WEBRTC;

});
