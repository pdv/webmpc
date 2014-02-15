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
    $('#' + i).html('<span class="pad-label">' + i + '</span>');
    var gainNode = context.createGain();
    gainNode.gain.value = 1.0;

    pads[i] = {
      'name': i.toString(),
      'buffer': null,
      'gainNode': gainNode,
    };

    addDropListener(i);
  }


  // TESTING ONLY
  console.log("about to test");
  loadSound(0, "sounds/kick.wav");
  console.log("done testing");
  // END TESTING

  // Start up MIDI
  navigator.requestMIDIAccess().then(success, failure);

});

function displayInfo(padNumber) {

  console.log(padNumber);
  $('#trigger-name').html(pads[padNumber].name);

}



// SOUND HANDLING

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
}

function onError() {
  alert('Something went wrong');
}

function playSound(i) {
  if (!pads[i].buffer) return;
  console.log("yep");
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
  if (ev.data[2].toString(16) == "7f") {
    var trig = parseInt(ev.data[1].toString());
    console.log("The button pressed was: " + trig);

    if (trig == 120) {
      select = true;
    }

    if (0 <= trig && trig <= 7) {
      playSound(trig + 56);
    } else if (16 <= trig && trig <= 23) {
      playSound(trig + 32);
    } else if (32 <= trig && trig <= 39) {
      playSound(trig + 8);
    } else if (48 <= trig && trig <= 55) {
      playSound(trig - 16);
    } else if (64 <= trig && trig <= 71) {
      playSound(trig - 38);
    } else if (80 <= trig && trig <= 87) {
      playSound(trig - 64);
    } else if (96 <= trig && trig <= 103) {
      playSound(trig - 88);
    } else if (112 <= trig && trig <= 119) {
      playSound(trig - 112);
    }

    output.send(ev.data);
  } else {
    output.send(ev.data);
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

function addDropListener(t) {
  var drop = $('#' + t); 

  function cancel(e) {
    if (e.preventDefault) { e.preventDefault(); }
    return false;
  }
  
  // Tells the browser that we *can* drop on this target
  addEventHandler(drop, 'dragover', cancel);
  addEventHandler(drop, 'dragenter', cancel);

  addEventHandler(drop, 'drop', function (e) {
    if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.

    var dt    = e.dataTransfer;
    var files = dt.files;
    var file = files[0];
    var reader = new FileReader();
        
    //attach event handlers here...
   
    reader.readAsDataURL(file);
    addEventHandler(reader, 'loadend', function(e, file) {
      loadSound(t, this.result);
      return false;
    });
  });
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