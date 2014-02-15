var context;
var kickBuffer;
var pads;
var editMode = false; // false = performance

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
  $('#mode-switch').click(modeSwitch);

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

    pads[i] = {
      'name': "No sound loaded",
      'buffer': null,
      'gain': 1.0,
      'pitch': 1.0
    };

    dragDropUpload(i);
  }


  // TESTING ONLY
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
  $('#detune').val(pads[padNumber].pitch);
  $('#volume').val(pads[padNumber].gain);
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
  console.log(pads[i].gain);
  var gainNode = context.createGain();
  source.connect(gainNode);
  gainNode.connect(context.destination);
  gainNode.gain.value = pads[i].gain;
  source.playbackRate.value = pads[i].pitch;
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
    $('#mode-switch').css("background-color", "red");
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
      $('#mode-switch').css("background-color", "white");
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

function dragDropUpload(i) {
  var trigger = $('#' + i);
  uploading = i;
  
  // Cancel default actions for dragover and dragenter
  $('#' + i).on(
      'dragover',
      function(e) {
          e.preventDefault();
          e.stopPropagation();
      }
  )
  $('#' + i).on(
      'dragenter',
      function(e) {
          e.preventDefault();
          e.stopPropagation();
      }
  )

  // Drop
  $('#' + i).on(
      'drop',
      function(e){
          if(e.originalEvent.dataTransfer){
              var files = e.originalEvent.dataTransfer.files;
              if(files.length) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFiles(files, i);
              }   
          }
      }
  );
}

function handleFiles(files, i) {
  window.URL = window.URL || window.webkitURL;
  var file = files[0];
  loadSound(i, window.URL.createObjectURL(file));
  window.URL.revokeObjectURL(this.arc);
}

// ********** CONTROLS ********************

function changeVolume (element) {
  pads[beingEdited].gain = element.value;
}

function changePitch(element) {
  pads[beingEdited].pitch = element.value
}

function modeSwitch() {
  editMode = !editMode;
  if (!editMode) {
    $('#mode-switch').css("background-color", "white");
  } else {
     $('#mode-switch').css("background-color", "red");
  }
}