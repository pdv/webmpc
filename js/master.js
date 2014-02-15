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
    $('#performance').color = "black";
    $('#edit').color = "red";
  });

  //Initialize all the pads
  for (var i = 0; i < 64; i++) {
    
    // Set the pad's onclick
    $('#' + i).click(function() {
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
      'url': null,
      'buffer': null,
      'gainNode': gainNode,
    };

    loadSound(i);
  }

  pads[0].url = "sounds/kick.wav";
  loadSound(0);

});

function displayInfo(padNumber) {

  console.log(padNumber);
  $('#trigger-name').html(pads[padNumber].name);

}



// SOUND HANDLING

function loadSound(i) {
  if (!pads[i].url) return;
  var request = new XMLHttpRequest();
  request.open('GET', pads[i].url, true);
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