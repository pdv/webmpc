var context;
var kickBuffer;
var pads;

$(document).ready(function() {
   
  // AudioContext
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch(e) {
    alert('Web Audio API is not supported in this browser');
  }

  pads = new Array(64);
  
  // Mode buttons
  var editMode = false; // false = performance
  $('#performance').click(function() { 
    editMode = false;
    $('#performance').color = "red";
    $('#edit').color = "black";
  });
  $('#edit').click(function() { 
    editMode = true;
    $('#performance').background-color = "black";
    $('#edit').background-color = "red";
  });

  //Initialize all the pads
  for (var i = 0; i < 64; i++) {
    
    // Set the pad's onclick
    $('#' + i).mousedown(function() {
      var j = $(this).attr("id")
      if (editMode) {
        displayInfo(j);
      } else {
        playSound(j);
      }
    })

    // Names inside pads
    //$('#' + i).html('<span class="pad-label">' + i + '</span>');
    var gainNode = context.createGain();
    gainNode.gain.value = 1.0;

    pads[i] = {
      'name': "No sound loaded",
      'buffer': null,
      'gainNode': gainNode,
    };

    dragDropListener(i);
  }


  // TESTING ONLY
  console.log("about to test");
  loadSound(0, "sounds/kick.wav");
  var sounds1 = ["sounds/909BD.wav", "sounds/909rim.wav", "sounds/909snare.wav", "sounds/909clap.wav"];
  var sounds2 = ["sounds/909ltom.wav", "sounds/909mtom.wav", "sounds/909hat.wav", "sounds/909hitom.wav"];
  var sounds3 = ["sounds/909hat2.wav", "sounds/909ride.wav", "sounds/909crash.wav"];
  for (var i = 0; i < 4; i++) {
    loadSound(i, sounds1[i]);
  }
  for (var i = 8; i < 12; i++) {
    loadSound(i, sounds2[i-8]);
  }
  for (var i = 16; i < 19; i++) {
    loadSound(i, sounds3[i-16]);
  }
  console.log("done testing");
  // END TESTING

  displayInfo(0);
  // Start up MIDI
  navigator.requestMIDIAccess().then(success, failure);

});

var beingEdited;

function displayInfo(padNumber) {
  if (padNumber == -1) return;
  beingEdited = padNumber;
  $('.trigger').css("border", "2px solid #DDD");
  $('#trigger-name').html(pads[padNumber].name);
  $('#' + padNumber).css("border", "2px solid red");
}



// SOUND HANDLING **********************************

function loadSound(i, url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(
      request.response, 
      function(buffer) { pads[i].buffer = buffer; },
      onError
    )
  }

  request.send();
  pads[i].name = url.slice(7,url.length-4);
  $('#' + i).html('<span class="pad-label">' + pads[i].name + '</span>');
}

function onError() {
  alert('Something went wrong');
}

function playSound(i) {
  if (!pads[i].buffer || i == -1) return;
  var source = context.createBufferSource();
  source.buffer = pads[i].buffer;
  source.connect(pads[i].gainNode);
  source.connect(context.destination);
  source.start(0);
}



// MIDI *********************************************

var midi = null;
var inputs = null;
var outputs = null;
var input = null;
var output = null;
var select = false;

function handleMIDIMessage(ev) {
  
  // Downpress
  
  var trig = parseInt(ev.data[1].toString());

  if (trig == 120) {
    select = true;
  }

  // Transposing the trigger number
  if (0 <= trig && trig <= 7) {
    trig += 56;
  } else if (16 <= trig && trig <= 23) {
    trig += 32;
  } else if (32 <= trig && trig <= 39) {
    trig += 8;
  } else if (48 <= trig && trig <= 55) {
    trig -= 16;
  } else if (64 <= trig && trig <= 71) {
    trig -= 40;
  } else if (80 <= trig && trig <= 87) {
    trig -= 64;
  } else if (96 <= trig && trig <= 103) {
    trig -= 88;
  } else if (112 <= trig && trig <= 119) {
    trig -= 112;
  } else {
    trig = -1;
  }
  
  if (ev.data[2].toString(16) == "7f") {
    // Actually play or display info
    if (select) {
      displayInfo(trig);
    } else {
      playSound(trig);
    }

    $('#' + trig).css({'border': '2px solid #333'});
    output.send(ev.data);
  } else {
    if (trig == beingEdited) {
      $('#' + trig).css({'border': '2px solid red'});
    } else {
      $('#' + trig).css({'border': '2px solid #DDD'});
    }

    output.send(ev.data);
    if (parseInt(ev.data[1].toString()) == 120) {
      select = false;
    }
  }
}

function success(midiAccess) {
  midi = midiAccess;
  inputs = midi.inputs();
  if (inputs.length > 0) {
    input = inputs[0];    // LAUNCHPAD
    input.addEventListener("midimessage", handleMIDIMessage);
    outputs = midi.outputs();
    if (outputs.length) {
      output = outputs[1]; // LAUNCHPAD, hopefully
      //output.send( [0xb0, 0x00, 0x7f] );
    }
  }
}

function failure( error ) {
  console.log("Failed to initialize MIDI");
  console.log((error.code==1) ? "permission denied" : ("error code " + error.code));
}


// UPLOADS ***********************************

function dragDropListener(i) {
  console.log(i);
  var drop = $('#' + i); 

  function cancel(e) {
    if (e.preventDefault) { e.preventDefault(); }
    return false;
  }

  // Tells the browser that we *can* drop on this target
  addEventHandler(drop, 'dragover', cancel);
  addEventHandler(drop, 'dragenter', cancel);

  addEventHandler(drop, 'drop', function (e) {
    console.log('yes');
    e = e || window.event; // get window.event if e argument missing (in IE)   
    if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.

    var dt    = e.dataTransfer;
    var files = dt.files;
    for (var i=0; i<files.length; i++) {
      var file = files[i];
      var reader = new FileReader();
        
      //attach event handlers here...
     
      reader.readAsDataURL(file);
      addEventHandler(reader, 'loadend', function(e, file) {
          var bin           = this.result; 
          console.log(bin);
      }.bindToEventHandler(file));
    }
    return false;
  });

  Function.prototype.bindToEventHandler = function bindToEventHandler() {
    var handler = this;
    var boundParameters = Array.prototype.slice.call(arguments);
    //create closure
    return function(e) {
        e = e || window.event; // get window.event if e argument missing (in IE)   
        boundParameters.unshift(e);
        handler.apply(this, boundParameters);
    }
  };
}

function addEventHandler(obj, evt, handler) {
    if(obj.addEventListener) {
        // W3C method
        obj.addEventListener(evt, handler, false);
    } else if(obj.attachEvent) {
        // IE method.
        obj.attachEvent('on'+evt, handler);
    } else {
        // Old school method.
        obj['on'+evt] = handler;
    }
}