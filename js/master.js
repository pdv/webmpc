var context;
var kickBuffer;
var pads;
var editMode = false; // false = performance

$(document).ready(function() {
   
   modeSwitch(false);

  // AudioContext
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch(e) {
    alert('Web Audio API is not supported in this browser');
  }

  pads = new Array(64);
  
  // Mode buttons

  $('#editmode').click(function() {modeSwitch(true)});
  $('#perfmode').click(function() {modeSwitch(false)});

  // Presets
  $('#preset-selector').change(function() {
    preset($(this).val()[6]);
  })

  //Initialize all the pads
  for (var i = 0; i < 64; i++) {
    // Set the pad's onclick
    $('#' + i).mousedown(function() {
      var j = $(this).attr("id")
      if (editMode) {
        displayInfo(j);
      } else {
        playSound(j, 0);
      }
      $(this).css({'border': '2px solid #FF9900'});
      $(this).css({'background-color': '#FF9900'});
    })

    $('#' + i).mouseup(function() {revertBorder($(this));});

    pads[i] = {
      'name': "Empty",
      'buffer': null,
      'gain': 1.0,
      'pitch': 1.0
    };

    dragDropUpload(i);
  }

  resetQueue();
  preset(1);
  displayInfo(0);
  bindConsole();
  $('#close').click(function() {$('#helptext').hide()});
  $('#help').click(function() {$('#helptext').show()});

  // Start up MIDI
  navigator.requestMIDIAccess().then(success, failure);

});

var beingEdited = 0;


// MISC JAWN ***************************************************

function displayInfo(padNumber) {
  if (padNumber == -1) return;
  beingEdited = padNumber;
  $('.trigger').css("border", "2px solid #DDD");
  $('#trigger-name').html(pads[padNumber].name);
  $('#trigger-name').click(function() {
    pads[beingEdited].name = prompt("Rename this pad");
    $('#' + beingEdited).html('<span class="pad-label">' + pads[beingEdited].name + '</span>');
    $(this).html(pads[beingEdited].name);
  });
  $('#' + padNumber).css("border", "2px solid #FF9900");
  $('#detune').val(pads[padNumber].pitch);
  $('#volume').val(pads[padNumber].gain);
  $('#vol-label').html("Volume    " + Math.floor(pads[padNumber].gain*100) + "%");
  $('#detune-label').html("Tune    " + Math.floor((pads[padNumber].pitch-1)*133.33));
}

function preset(pre) {
  
  if (pre == 1) {
    var sounds1 = ["sounds/r909/909BD.wav",   "sounds/r909/909rim.wav",  "sounds/r909/909snare.wav", "sounds/r909/909clap.wav"];
    var sounds2 = ["sounds/r909/909ltom.wav", "sounds/r909/909mtom.wav", "sounds/r909/909hat.wav",   "sounds/r909/909hitom.wav"];
    var sounds3 = ["sounds/r909/909hat2.wav", "sounds/r909/909ride.wav", "sounds/r909/909crash.wav", null];
  } else if (pre == 2) {
    var sounds1 = ["sounds/trap/high kick.wav", "sounds/trap/low kick.wav",  "sounds/trap/snare.wav", "sounds/trap/clap.wav"];
    var sounds2 = ["sounds/trap/low tom.wav",   "sounds/trap/cowbell.wav", "sounds/trap/closed hat.wav",  "sounds/trap/open hat.wav"];
    var sounds3 = ["sounds/trap/rim.wav", "sounds/trap/high tom.wav", "sounds/trap/DAMN SON.mp3", "sounds/trap/shotgun.wav"];
  } else if (pre == 3) {
    var sounds1 = ["sounds/rock/kick.wav", "sounds/rock/rim.wav",  "sounds/rock/snare.wav", "sounds/trap/clap.wav"];
    var sounds2 = ["sounds/rock/mid tom.wav",   "sounds/rock/bell.wav", "sounds/rock/closed hat.wav",  "sounds/rock/crash2.wav"];
    var sounds3 = ["sounds/rock/crash.wav", "sounds/rock/high tom.wav", "sounds/rock/open hat.wav", "sounds/rock/ride.wav"];
  } else if (pre == 4) {
    var sounds1 = ["sounds/jazz/kick.wav", "sounds/jazz/kick2.wav",  "sounds/jazz/snare.wav", "sounds/jazz/rim.wav"];
    var sounds2 = ["sounds/jazz/floor tom.wav",   "sounds/jazz/bell.wav", "sounds/jazz/closed hat.wav",  "sounds/jazz/semi hat.wav"];
    var sounds3 = ["sounds/jazz/crash.wav", "sounds/jazz/high tom.wav", "sounds/jazz/open hat.wav", "sounds/jazz/ride.wav"];
  } else if (pre == 5) {
    for (var i = 0; i < 64; i++) {
      pads[i] = {
        'name': "Empty",
        'buffer': null,
        'gain': 1.0,
        'pitch': 1.0
      };
      $('#' + i).html('<span class="pad-label">' + '</span>');
    };
  }
  if (pre < 5) {
    for (var i = 0; i < 4; i++) {
      var url = sounds1[i];
      pads[i].name = url.slice(12,url.length-4);
      loadSound(i, sounds1[i]);
    }
    for (var i = 8; i < 12; i++) {
      var url = sounds2[i-8];
      pads[i].name = url.slice(12,url.length-4);
      loadSound(i, sounds2[i-8]);
    }
    for (var i = 16; i < 20; i++) {
      var url = sounds3[i-16];
      if (!url) continue;
      pads[i].name = url.slice(12,url.length-4);
      loadSound(i, sounds3[i-16]);
    }
  }

  displayInfo(beingEdited);
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
  $('#' + i).html('<span class="pad-label">' + pads[i].name + '</span>');
}

function onError() {
  alert('Something went wrong');
}

function playSound(i, delay) {
  if (!pads[i].buffer || i == -1) return;
  var source = context.createBufferSource();
  source.buffer = pads[i].buffer;
  var gainNode = context.createGain();
  source.connect(gainNode);
  gainNode.connect(context.destination);
  gainNode.gain.value = pads[i].gain;
  source.playbackRate.value = pads[i].pitch;
  source.start(delay);

  if (recording) {
    var newBeat = Math.floor(beat / interval);
    if (loopTimer.remaining < ((60000 / bpm) / (quant / 4)) / 2) {
      newBeat += interval;
    }
    for (j = 0; j < 4; j++) {
      if (queue[newBeat][j] == i) {
        return;
      } else if (queue[newBeat][j] == -1) {
        queue[newBeat][j] = i;
        return;
      }

    }
  }

}



// MIDI *********************************************

var midi = null;
var inputs = null;
var outputs = null;
var input = null;
var output = null;
var select = false;
var prevMode;

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
      playSound(trig, 0);
    }

    $('#' + trig).css({'border': '2px solid #FF9900'});
    $('#' + trig).css({'background-color': '#FF9900'});
    output.send(ev.data);
  } else {
    revertBorder($('#' + trig));

    output.send(ev.data);
    if (parseInt(ev.data[1].toString()) == 120) {
      select = false;
    }
  }
}

function revertBorder(i) {
  if (i.attr('id') == beingEdited) {
    i.css({'border': '2px solid #FF9900'});
  } else {
    i.css({'border': '2px solid #DDD'});
  }
  i.css("background-color", "white");
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
  pads[i].name = prompt("Enter a name for this sample","Untitled");
  loadSound(i, window.URL.createObjectURL(file));
  window.URL.revokeObjectURL(this.arc);
}

// ********** CONTROLS ********************

function changeVolume (element) {
  pads[beingEdited].gain = element.value;
  $('#vol-label').html("Volume    " + Math.floor(element.value*100) + "%");
}

function changePitch(element) {
  pads[beingEdited].pitch = element.value
  $('#detune-label').html("Tune    " + Math.floor((element.value-1)*133.34));
}

function modeSwitch(m) {
  editMode = m;
  if (!editMode) {
    $('#editmode').css("background-color", "white");
    $('#perfmode').css("background-color", "#FF9900");
    $('#perfmode').css("border", "2px solid #FF9900");
    $('#editmode').css("border", "2px solid #DDD;");
  } else {
     $('#editmode').css("background-color", "#FF9900");
     $('#perfmode').css("background-color", "white");
     $('#editmode').css("border", "2px solid #FF9900");
     $('#perfmode').css("border", "2px solid #DDD");
  }
}

// *************** RECORDING ***************************

var length = 2;
var quant = 8;
var bpm = 120;
var queue = new Array(16);
var recording = false;
var beat = 0;
var playing = false;
var paused = false;
var loopTimer = $.timer(playQueue, (60000 / bpm) / (quant * 2), false);
var quantlev = [0, 32, 16, 8, 4];
var lastpressedstop = false;
var interval = 1;
var counterTimer = $.timer(updateCounter, (60000 / bpm) / 4);
var sixteenths = 0;

function bindConsole() {

  // LENGTH
  for (var i = 1; i < 5; i++) {
    $('#' + i + 'bar').click(function() {
      for (var j = 1; j < 5; j++) {
        $('#' + j + 'bar').removeClass("active");
      }
      $(this).addClass("active");

      if (playing) {
        counterTimer.stop();
        loopTimer.stop();
        sixteenths = 0;
        beat = 0;
        loopTimer.play();
        counterTimer.play();
        resizeQueue($(this).attr("id")[0]);
      } else {
        length = $(this).attr("id")[0];
        resetQueue();
      }
      lastpressedstop = false;
    });
  }

  // QUANTIZATION
  for (var i = 1; i < 5; i++) {
    $('#' + i + 'quant').click(function() {
      for (var j = 1; j < 5; j++) {
        $('#' + j + 'quant').removeClass("active");
      }
      $(this).addClass("active");
      newquant = quantlev[$(this).attr("id")[0]];
      if (playing) {
        loopTimer.stop();
        counterTimer.stop();
        sixteenths = 0;
        beat = 0; 
        reQuant(newquant);
        loopTimer.play();
        counterTimer.play();
      } else {
        quant = newquant;
        resetQueue();
      }
      lastpressedstop = false;
    });

  }


  // Play
  $('#play').mousedown(function() {
    if (playing) {
      loopTimer.stop();
    }

    if ($(this).attr("class") != "active") {
      $(this).addClass("active");
    }
    $('#pause').removeClass("active");

    playing = true;
    if (!paused) {
      sixteenths = 0;
      beat = 0;
    }
    paused = false;
    playQueue();
    loopTimer = $.timer(playQueue, (60000 / bpm) / (quant / 4), false);
    counterTimer = $.timer(updateCounter, (60000 / bpm) / 4);
    loopTimer.play();
    counterTimer.play();
    lastpressedstop = false;
  });

  // Pause
  $('#pause').click(function() {
    if (paused) {
      loopTimer.play();
      counterTimer.play();
      $(this).removeClass("active");
      $('#play').addClass("active");
      paused = false;
    } else {
      if (playing) {
        loopTimer.pause();
        counterTimer.pause();
        $(this).addClass("active");
        $('#play').removeClass("active");
        paused = true;
      }
    }
    lastpressedstop = false;
  })

  // Record
  $('#record').click(function() {
    if ($(this).hasClass("active")) {
      $(this).removeClass("active");
      recording = false;
    } else {
      $(this).addClass("active");
      recording = true;
    }
  });

  // Stop
  $('#stop').click(function() {
    if ($('#play').addClass("active")) {
      $('#play').removeClass("active");
      $('#pause').removeClass("active");
      beat = 0;
      sixteenths = 0;
      playing = false;
      paused = false;
      loopTimer.stop();
      counterTimer.stop();
    }

    if (lastpressedstop) {
      resetQueue();
    } else {
      lastpressedstop = true;
    }

  })
}

function resetQueue() {
  console.log("cleared, " + (quant*length));
  for (var i = 0; i < (quant * length); i++) {
    queue[i] = [-1, -1, -1, -1, -1];
  }
}

function playQueue() {
  console.log("beat: " + beat + " ||| " + queue[beat][0] + " " + queue[beat][1] + " " + queue[beat][2] + " " + queue[beat][3]);
  for (var i = 0; i < 5; i++) {
    if (queue[beat][i] != -1) {
      playSound(queue[beat][i]);
      $('#' + queue[beat][i]).css({'background-color': '#FF9900'});
      var colorTimer = window.setTimeout(function() {
        $('.trigger').css({'background-color': 'white'});
      }, 100);
    }
  }

  beat++;
  if (beat >= (quant * length)) {
    beat = 0;
  }
  
}

function updateCounter() {
  sixteenths++;
  bars = (Math.floor(sixteenths / 16) % length) + 1;
  $('#counter').html(bars + "." + (Math.floor(sixteenths / 4) % 4 + 1) + "." + (sixteenths % 4 + 1));

}

function changeBPM(element) {
  bpm = element.value;
  $('#bpm-label').html(bpm + " BPM");
  loopTimer.set({time: (60000 / bpm) / (quant / 4)});
  counterTimer.set({time: (60000 / bpm) / 4});
}

function resizeQueue(newSize) {
  if (newSize == length) return;
  if (newSize * quant > queue.length) {
    var newQueue = new Array(newSize * quant);
    for (var i = 0; i < (newSize * quant); i++) {
      if (i < queue.size) {
        newQueue[i] = queue[i];
      } else {
        newQueue[i] = [-1, -1, -1, -1, -1];
      }
    }
  } else {
    var newQueue = queue.slice(0, newSize * quant);
  }
  queue = newQueue;
  length = newSize;
}

function reQuant(newQuant) {
  if (newQuant == quant) return;
  if (newQuant < quant) {
    interval = (quant / newQuant);
    return;
  } else {
    var newQueue = new Array(length * newQuant);
    for (var i = 0; i < queue.length; i++) {
      newQueue[i * (newQuant / quant)] = queue[i];
    }
    for (var i = 0; i < newQueue.length; i++) {
      if (!newQueue[i]) {
        newQueue[i] = [-1, -1, -1, -1, -1];
      }
    }
    queue = newQueue;
  }
  quant = newQuant;
  loopTimer.set({time: (60000 / bpm) / (quant / 4)});
}