(function($) {
  var settings = {
    CHANNEL: encodeURIComponent(window.location.pathname),
    VENDOR_KEY: '92dc1a5092d34478934cb16935f6debc',
    RESOLUTION: '480p',
    FRAME_RATE: 15,
    VIDEO_PROFILE: '480p',
    PREFIX: 'projectMPlugin',
  };

  var client = AgoraRTC.createRtcClient();
  var localStream;
  var remoteStreamList = [];
  var $container = $('<div id="' + settings.PREFIX + '"></div>');
  $("body").append($container);

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
      local  : true,
    });

    localStream.setVideoProfile(settings.VIDEO_PROFILE);

    localStream.init(function() {
      console.log("Get UserMedia successfully");
      console.log(localStream);

      client.publish(localStream, function () {
        console.log('Published successfully');
      }, function (err) {
        console.error("Timestamp: " + Date.now());
        console.error("Publish local stream error: ", err);
      });

      var selector = settings.PREFIX + '0';
      var $dom = $('<div class="one-stream" style="display: none;"><div id="' + selector + '" data-stream-id="' + selector + '"></div><span class="mute-icon"></span></div>');

      $container.append($dom);
      localStream.play(selector);

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
        oneStream.$dom.remove();
      }

      return oneStream.id !== id;
    });

    render();
  }

  function toggleStreamAudio(id) {
    remoteStreamList = remoteStreamList.map(function(oneStream) {
      if (oneStream.id === id) {
        if (oneStream.audioEnabled) {
          oneStream.$dom.addClass('muted');
          oneStream.stream.disableAudio();
          oneStream.audioEnabled = false;
        } else {
          oneStream.$dom.removeClass('muted');
          oneStream.stream.enableAudio();
          oneStream.audioEnabled = true;
        }
      }

      return oneStream;
    });

    render();
  }

  // init RTC
  client.init(settings.VENDOR_KEY, function (obj) {
    console.log("AgoraRTC client initialized");
    client.join(settings.VENDOR_KEY, settings.CHANNEL, undefined, function(uid) {
      settings.UID = uid;
      console.log("User " + uid + " join channel successfully");
      console.log("Timestamp: " + Date.now());
      localStream = initLocalStream();
    }, function(err) {
      console.error('Failed to execute join channel. Timestamp: ', Date.now());
      console.error(err);
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
    remoteStreamList.map(function(oneStream) {
      var selector = settings.PREFIX + oneStream.id;

      if (!oneStream.$dom) {
        var $dom = $('<div class="one-stream"><div id="' + selector + '" data-stream-id="' + selector + '"></div><span class="mute-icon"></span></div>');

        $dom.find('.mute-icon').click(toggleStreamAudio.bind(null, oneStream.id));
        $container.append($dom);
        oneStream.stream.play(selector);
        oneStream.$dom = $dom;
      }

      return oneStream;
    });
  }

  // subscribeWindowResizeEvent();
}(jQuery));
