var context;
window.onload = init;
var kickBuffer;
var pads;

$(document).ready(function() {
  var editMode = false; // false = performance
  pads = new Array(64);
  
  $('#performance').click(function() { editMode = false });
  $('#edit').click(function() { editMode = true });

  for (int i = 0; i < 64; i++) {
    
    // Set the pad's onclick
    $('#' + i).click(function() {
      if (editMode) {
        displayInfo(i);
      } else {
        playSound(i);
      }
    })

    pads[i] = {
      name = i.toString(),

    }
  }

});

displayInfo(var padNumber) {
  $('#trigger-name').html(pads[padNumber].name);
  
}



/**


function init() {

  // Fix up prefixing
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch(e) {
    alert('Web Audio API is not supported in this browser');
  }

  loadSound('sounds/kick.wav');
  var kicker = document.getElementById("kick-trigger");
  kicker.onclick = function() {playSound(kickBuffer);}
}
**/

function loadSound(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(
      request.response, 
      function(buffer) { kickBuffer = buffer; },
      onError
    )
  }

  request.send();
}

function onError() {
  alert('Something went wrong');
}

function playSound(buffer) {
  if (!buffer) return;
  console.log("yep");
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}