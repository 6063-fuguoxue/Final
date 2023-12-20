// -------- Serial Communication --------
// serial variables
let mSerial;
let connectButton;
let readyToReceive;

// -------- Project Variables --------
// let choiceSlider; // For serial communication testing
let gameStartButton; 
let gameRestartButton;
let durationOfPlay = 32; // number of seconds to play the music; better be multiple of 4
let durationPerNote = 1000; 
let bigStroke = 30;
let smallStroke = 9;
let selectedFill = 255;
let unselectedFill = 80;

// Music
let synth;
let piano = ['A4', 'A#4', 'B4', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A5', 'A#5', 'B5', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5']; // For chord-related calculation
let availableNotesList = ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5']; // Available notes for player to choose from
let selectedNotes = ['A5', 'C5', 'E5']; // 3 notes selected by player

// Music Visualization
let noteCircles = [];



let noteIdxToChange = 0; // Current index of note to change
let startAtMillis;
let timer = 0;
let flag = 0;

let stateIndex = 0; // System initialized at state 0
let prevStateIndex = 4;

// face api example from ml5  https://learn.ml5js.org/#/reference/face-api
// credit to Joey Lee.  https://jk-lee.com/
// credit to Bomani Oseni McClendon. https://github.com/ml5js/ml5-library/tree/main/examples/p5js/FaceApi
let faceapi;
let video;
let detections = [];
let prevDetectionsLeng;


// by default all options are set to true
const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
  minConfidence: 0.5,
  MODEL_URLS: {
    Mobilenetv1Model: 'https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/ssd_mobilenetv1_model-weights_manifest.json',
    FaceLandmarkModel: 'https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_landmark_68_model-weights_manifest.json',
    FaceLandmark68TinyNet: 'https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_landmark_68_tiny_model-weights_manifest.json',
    FaceRecognitionModel: 'https://raw.githubusercontent.com/ml5js/ml5-data-and-models/main/models/faceapi/face_recognition_model-weights_manifest.json',
  },
};

function receiveSerial() {
  let line = mSerial.readUntil("\n");
  trim(line);
  if (!line) return;

  if (line.charAt(0) != "{") {
    print("error: ", line);
    readyToReceive = true;
    return;
  }

  // get data from Serial string
  let data = JSON.parse(line).data;
  let a0 = data.A0;
  let d2 = data.D2;
  let d3 = data.D3;

  // Use potentiometer to update the notes
  // bgColor = map(a0.value, 0, 4095, 0, 255); //a0.min and a0.max somehow don't work here
  // choiceSlider.value(floor(map(a0.value, 0, 4095, 0, 4)));
  noteIdxToChange = d3.count % 3; // Loop select the 3 spots of selectedNotes
  // console.log(floor(map(a0.value, 0, 4096, 0, 7)));
  selectedNotes[noteIdxToChange] = availableNotesList[floor(map(a0.value, 0, 4096, 0, availableNotesList.length))]; // Change the notation of the current line

  if (d2.isPressed && stateIndex == 2) {
    stateIndex = 3;
    prevStateIndex = 2;
    // mOsc.start();
    startAtMillis = millis();
    userStartAudio();
  }
  
  console.log(startAtMillis);

  // serial update
  readyToReceive = true;
}

function connectToSerial() {
  if (!mSerial.opened()) {
    mSerial.open(9600);

    readyToReceive = true;
    connectButton.hide();
  }
}

function gameStart() {
  // gameStarted = true;
  stateIndex = 2;
  prevStateIndex = 1;
  gameStartButton.hide();
  noteCircles = [];
  flag = 0;
}

function gameRestart() {
  stateIndex = 0;
  prevStateIndex = 4;
  gameRestartButton.hide();
  noteCircles = [];
  flag = 0;
}



function modelReady() {
  console.log("ready!");
  // console.log(faceapi);
  // faceapi.detect(gotResults);
}

// Since the function is iterative, it in fact functions as "draw()"
function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  
  detections = result;

  background(0,0,0,20);
  // image(video, 0, 0, width, height); // Comment out to avoid showing the webcam video

  // console.log(detections.length);

  if (detections && stateIndex != 2) { // If detected at least 1 face, set to state 1
    if (detections.length > 0) {
      // console.log(detections)
      push();
      translate(width,0);
      scale(-1, 1);
      drawBox(detections);
      drawLandmarks(detections);
      pop();

      gameStartButton.show(); // Show the start button when at least one face is detected
      stateIndex = 1; // State 1: welcome state
    } else { // If no face detected, set to state 0
      gameStartButton.hide(); // If no face detected, hide the start button
      stateIndex = 0; // State 0: idle state
    }  
  }  
}

function drawBox(detections) {
  for (let i = 0; i < detections.length; i += 1) {
    const alignedRect = detections[i].alignedRect;
    const x = alignedRect._box._x;
    const y = alignedRect._box._y;
    const boxWidth = alignedRect._box._width;
    const boxHeight = alignedRect._box._height;

    noFill();
    stroke(161, 95, 251);
    strokeWeight(2);
    rect(x, y, boxWidth, boxHeight);
  }
}

function drawLandmarks(detections) {
  noFill();
  stroke(161, 95, 251);
  strokeWeight(2);

  for (let i = 0; i < detections.length; i += 1) {
    const mouth = detections[i].parts.mouth;
    const nose = detections[i].parts.nose;
    const leftEye = detections[i].parts.leftEye;
    const rightEye = detections[i].parts.rightEye;
    const rightEyeBrow = detections[i].parts.rightEyeBrow;
    const leftEyeBrow = detections[i].parts.leftEyeBrow;

    drawPart(mouth, true);
    drawPart(nose, false);
    drawPart(leftEye, true);
    drawPart(leftEyeBrow, false);
    drawPart(rightEye, true);
    drawPart(rightEyeBrow, false);
  }
}

function drawPart(feature, closed) {
  beginShape();
  for (let i = 0; i < feature.length; i += 1) {
    const x = feature[i]._x;
    const y = feature[i]._y;
    vertex(x, y);
  }

  if (closed === true) {
    endShape(CLOSE);
  } else {
    endShape();
  }
}
let numToSend = 0;
function sendAndReceive() {
  // update serial: request new data
  if (mSerial.opened() && readyToReceive) {
    readyToReceive = false;
    mSerial.clear();
    
    if (detections.length == 0 && prevDetectionsLeng) {
      mSerial.write(30);
    } 
    if (detections.length && prevDetectionsLeng == 0) {     
      mSerial.write(31);
    }     
    if ((stateIndex == 0 || stateIndex == 1) && prevStateIndex == 4) {
      mSerial.write(32);
    }
    // if (stateIndex == 3) {
    //   // mSerial.write(chordToArduino.length); 
    //   for (let i=0; i<chordToArduino.length; i++) {
    //     mSerial.write(chordToArduino[i]); 
    //   }
    //   mSerial.write(13);
    // }
    if (stateIndex == 2) {
      mSerial.write(33); 
    }
    if (stateIndex == 4) {
      mSerial.write(34); 
    }
    
    mSerial.write(0xab);

    prevDetectionsLeng = detections.length;
    
  }

  // update serial: read new data
  if (mSerial.availableBytes() > 8) {
    receiveSerial();
  }
}

// -------- Game Start! --------
// State 2
let r,g,b;
function musicComposition() {
  r = map(availableNotesList.indexOf(selectedNotes[0]), 0, 7, 0, 255);
  g = map(availableNotesList.indexOf(selectedNotes[1]), 0, 7, 0, 255);
  b = map(availableNotesList.indexOf(selectedNotes[2]), 0, 7, 0, 255);
  background(r, g, b, 50);
  noStroke();
  textSize(100);
  textAlign(CENTER, CENTER);

  fill(noteIdxToChange == 0 ? selectedFill : unselectedFill);
  // strokeWeight(noteIdxToChange == 2 ? bigStroke : smallStroke);
  text(selectedNotes[0], width/5*1, height/2);

  fill(noteIdxToChange == 1 ? selectedFill : unselectedFill);
  // strokeWeight(noteIdxToChange == 3 ? bigStroke : smallStroke);
  text(selectedNotes[1], width/2, height/2);

  fill  (noteIdxToChange == 2 ? selectedFill : unselectedFill);
  // strokeWeight(noteIdxToChange == 4 ? bigStroke : smallStroke);
  text(selectedNotes[2], width/5*4, height/2); 
}

// State 3
let chordToArduino = [];
// let sendChord = false;
class Chord {
  constructor(_note) {
    this.note = _note;
    this.chordNotes = [];
  }
  play() {
    
    append(this.chordNotes, this.note); // First, append the defined note to the chord

    let noteNum = floor(random(2, 6)); // define number of notes in this chord, ranging from 2 to 5
    switch (noteNum) {
      case 2: 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 3]); // Major 3rd
        break;
      case 3: 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 3]); 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 7]); 
        break;
      case 4: 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 4]); 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 9]); 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 12]); 
        break;
      case 5: 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 2]); 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 5]); 
        append(this.chordNotes, piano[piano.indexOf(this.note) - 8]);  
        append(this.chordNotes, piano[piano.indexOf(this.note) - 12]); 
        break;
    } 

    // note duration (in seconds)
    let dur = 1.5;

    // time from now (in seconds)
    let time = 0;

    // velocity (volume, from 0 to 1)
    let vel = 0.1;

    chordToArduino = []; // Clean up the array to send to Arduino

    // notes can overlap with each other
    let noteCircleColor = color(random(255), random(255), random(255));
    for (let i=0; i < this.chordNotes.length; i++) {
      console.log(this.chordNotes);
      synth.play(this.chordNotes[i], vel, 0, dur);
      let T = millis();
      noteCircles.push(new noteCircle(piano.indexOf(this.chordNotes[i]), T, noteCircleColor));
      append(chordToArduino, piano.indexOf(this.chordNotes[i])); 
    }    
    print(chordToArduino);
  }
}

// Check if the circles are still on canvas
function isOnCanvas(item) {
  if (item.x + item.d_mapped/2 < 0) {
    return false;
  } else {
    return true;
  }
}

let timeStamp;
function musicPlaying() {
  background(r, g, b, 50);
  // Play the Music
  timer = millis() - startAtMillis; // Timer since entering State 3
  currentNoteIndex = floor(timer/durationPerNote) % 3;

  if ((timer - flag - durationPerNote >= 0) || (timer == 0)) {
    new Chord(selectedNotes[currentNoteIndex]).play(); // Step 1: Generate a chord for this note
    flag = timer;
    // Send chord information to Arduino
    if (mSerial.opened() && readyToReceive) {
      mSerial.write(chordToArduino.length); 
      mSerial.write(0xab);
    }    
  }

  // Music Visualization
  // Filter out the circles that go out of the canvas
  noteCircles = noteCircles.filter(isOnCanvas);
  // Draw the circles that represents the MIDI notes
  for (i = 0; i < noteCircles.length; i++) {
    noteCircles[i].draw();
  }
  // Update the positions of the circles  
  for (i = 0; i < noteCircles.length; i++) {
    noteCircles[i].update();
  }

  // Switch to the ending state
  if (timer/1000 >= durationOfPlay) {
    stateIndex = 4;
    prevStateIndex = 3;
    timeStamp = millis();
  }
}

// State 4
function endingState() {
  // Testing
  stateIndex = 4;
  prevStateIndex = 3;
  textAlign(CENTER, CENTER);
  textSize(100);
  stroke(255);

  text("Thank you! ", windowWidth/2, windowHeight/2);
  if ((millis() - timeStamp) > 3000) {
    gameRestart();
  }  
  noteCircles = [];  
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Load up your video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide(); // Hide the video element, and just show the canvas
  faceapi = ml5.faceApi(video, detectionOptions, modelReady);
  textAlign(RIGHT);

  // Set up serial
  readyToReceive = false;
  mSerial = createSerial();

  // Button: connect to serial
  connectButton = createButton("Connect To Serial");
  connectButton.position(width / 2, height / 2);
  connectButton.mousePressed(connectToSerial);

  // Button: game start
  gameStartButton = createButton("OK!");
  gameStartButton.position(width / 2, height / 2);
  gameStartButton.mousePressed(gameStart);
  gameStartButton.hide();  

  // Button: game restart
  gameRestartButton = createButton("Restart!");
  gameRestartButton.position(width / 2, height / 2);
  gameRestartButton.mousePressed(gameRestart);
  gameRestartButton.hide(); 

  // Set up PolySynth
  synth = new p5.PolySynth();
  synth.setADSR(0.2, 0.2, 0.5, 0.2);

  // noLoop();
}

class noteCircle {
  constructor(_idx, _timeStamp, _color) {
    this.d = 20;
    this.timeStamp = _timeStamp; // The time when the note is played
    this.x = width + this.d/2;
    this.y = map(_idx, 0, piano.length, height - 50, 50);
    this.color = _color;
  }
  draw() {
    // //set colors
    // patternColors([color(255), this.color]);
    // //set pattern
    // pattern(PTN.noiseGrad(0.5));
    // ellipsePattern(this.x, this.y, this.d, this.d);
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.d, this.d);
  }
  update() {
    // Update the position of the noteCircle
    this.x = width + this.d/2 - (millis() - this.timeStamp)/10;
  }
}

function draw() {
  background(0,0,0,50);
  
  // update serial: request new data
  sendAndReceive();

  switch (stateIndex) {
    case 0: faceapi.detect(gotResults); break; // State 0: idle state, constantly detect faces
    case 1: faceapi.detect(gotResults); break; // State 1: welcome state, constantly detect faces
    case 2: musicComposition(); break; // State 2: music composition state
    case 3: musicPlaying(); break; // State 3: music playing state
    case 4: endingState(); break; // State 4: ending state
  }
  
}

// TODO: https://p5js.org/reference/#/p5.PolySynth