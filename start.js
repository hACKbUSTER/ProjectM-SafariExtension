(function($) {
  var settings = {
    CHANNEL: encodeURIComponent(window.location.pathname),
    VENDOR_KEY: '92dc1a5092d34478934cb16935f6debc',
    RESOLUTION: '480p',
    FRAME_RATE: 15,
    VIDEO_PROFILE: '480p'
  };

  settings.RECORDING_SERVICE_URL = 'https://recordtest.agorabeckon.com:9002/agora/recording/genToken?channelname=' + settings.CHANNEL;

  var client = AgoraRTC.createRtcClient();
  var localStream;
  var remoteStreamList = [];

  function calculateVideoSize(multiple) {
    return {
      width: 320,
      height: 240
    };
  }

  function initLocalStream() {
    if (localStream) {
      // local stream exist already, close the current connection
      client.unpublish(localStream, function(err) {
        alert("Unpublish failed with error: ", err);
        throw new Error(err);
      });
      localStream.close();
    }

    localStream = AgoraRTC.createStream({
      streamID: settings.UID,
      audio  : true,
      video  : true,
      screen : false,
      local  : true
    });

    localStream.setVideoProfile(settings.VIDEO_PROFILE);

    localStream.init(function() {
      console.log("Get UserMedia successfully");
      console.log(localStream);

      client.publish(localStream, function (err) {
        console.log("Timestamp: " + Date.now());
        console.log("Publish local stream error: " + err);
      });

      render();
    }, function(err) {
      alert("Local stream init failed.", err);
      throw new Error(err);
    });

    return localStream;
  }

  function addStreamToList(id, stream) {
    remoteStreamList.push({
      id: id,
      stream: stream,
      audioEnabled: true
    });

    render();
  }

  function removeStreamFromList(id) {
    remoteStreamList = remoteStreamList.filter(function(oneStream) {
      if (oneStream.id === id) {
        oneStream.stream.stop();
      }

      return oneStream.id !== id;
    });

    render();
  }

  function toggleStreamAudio(id) {
    remoteStreamList = remoteStreamList.map(function(oneStream) {
      if (oneStream.id === id) {
        if (oneStream.stream.audioEnabled) {
          oneStream.stream.disableAudio();
        } else {
          oneStream.stream.enableAudio();
        }
      }

      return oneStream;
    });
  }

  // init RTC
  client.init(settings.VENDOR_KEY, function (obj) {
    console.log("AgoraRTC client initialized");
    client.join(settings.VENDOR_KEY, settings.CHANNEL, undefined, function(uid) {
      settings.UID = uid;
      console.log("User " + uid + " join channel successfully");
      console.log("Timestamp: " + Date.now());
      localStream = initLocalStream();
    });
  }, function(err) {
    if (err) {
      console.log(err);
      switch(err.reason) {
        case 'CLOSE_BEFORE_OPEN':
          var message = 'to use voice/video functions, you need to run Agora Media Agent first, if you do not have it installed, please visit url(' + err.agentInstallUrl + ') to install it.';
          alert(message);
          break;
        case 'ALREADY_IN_USE':
          alert("Agora Video Call is running on another tab already.");
          break;
        case "INVALID_CHANNEL_NAME":
          alert("Invalid channel name, Chinese characters are not allowed in channel name.");
          break;
      }
    }
  });

  client.on('stream-added', function (evt) {
    var stream = evt.stream;
    console.log("New stream added: " + stream.getId());
    console.log("Timestamp: " + Date.now());
    console.log("Subscribe ", stream);
    client.subscribe(stream, function (err) {
      console.log("Subscribe stream failed", err);
    });
  });

  client.on('stream-subscribed', function (evt) {
    var stream = evt.stream;
    console.log("Got stream-subscribed event");
    console.log("Timestamp: " + Date.now());
    console.log("Subscribe remote stream successfully: " + stream.getId());
    console.log(evt);

    addStreamToList(stream.getId(), stream);
  });

  client.on("stream-removed", function(evt) {
    var stream = evt.stream;
    var targetStreamId = evt.stream.getId();
    console.log("Stream removed: " + targetStreamId);
    console.log("Timestamp: " + Date.now());
    console.log(evt);

    removeStreamFromList(targetStreamId);
  });

  client.on('peer-leave', function(evt) {
    console.log("Peer has left: " + evt.uid);
    console.log("Timestamp: " + Date.now());
    console.log(evt);

    removeStreamFromList(evt.uid);
  });

  function render() {
    $("div#plugin-video").remove();

    const div = $('<div id="plugin"></div>');
    div.css({
      "top":"0px",
      "bottom":"0px",
      "left":"0px",
      "position":"fixed",
      "width":"160px",
      "height":"640px",
      "z-index":"65535"
    });
    remoteStreamList.forEach((v)=>{
      div.append($(v));
    });
    $("body").append(div);
  }

  // subscribeMouseClickEvents();
  // subscribeMouseHoverEvents();
  // subscribeWindowResizeEvent();
  // $("#room-name-meeting").html(channel);
}(jQuery));
