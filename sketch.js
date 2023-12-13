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
let durationPerNote = 800; 
let bigStroke = 30;
let smallStroke = 9;
let selectedFill = 255;
let unselectedFill = 80;

// Music
let mOsc;
let mLfo;
let mEnv;

let FREQS = {
  A3: 220,
  B3: 247,
  C3: 261,
  D3: 294,
  E3: 329,
  F3: 349,
  G3: 392, 
};

// let notationList = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'];
let notationsPrinted = ['A3', 'C3', 'E3', 'F3', 'G3', 'E3', 'F3', 'G3']; 
let notationsPrintedIndex = 0;
let currentNoteIndex = 0;
let startAtMillis;
let timer = 0;

let stateIndex = 0; // System initialized at state 0
let prevStateIndex = 5;

// face api example from ml5  https://learn.ml5js.org/#/reference/face-api
// credit to Joey Lee.  https://jk-lee.com/
// credit to Bomani Oseni McClendon. https://github.com/ml5js/ml5-library/tree/main/examples/p5js/FaceApi
let faceapi;
let video;
let detections;
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
  notationsPrintedIndex = d3.count % 5; // Loop select the five spot of notations
  // console.log(floor(map(a0.value, 0, 4096, 0, 7)));
  notationsPrinted[notationsPrintedIndex] = Object.keys(FREQS)[floor(map(a0.value, 0, 4096, 0, 7))]; // Change the notation of the current line
  notationsPrinted[5] = notationsPrinted[2];
  notationsPrinted[6] = notationsPrinted[3];
  notationsPrinted[7] = notationsPrinted[4];

  if (d2.isPressed && stateIndex == 2) {
    stateIndex = 3;
    prevStateIndex = 2;
    mOsc.start();
    startAtMillis = millis();
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
}

function gameRestart() {
  stateIndex = 0;
  prevStateIndex = 5;
  gameRestartButton.hide();
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
  gameRestartButton.position(width / 2 + 100, height / 2 + 100);
  gameRestartButton.mousePressed(gameRestart);
  gameRestartButton.hide(); 

  // // Slider: For serial communication testing
  // choiceSlider = createSlider(0, 4, 0, 1);
  // choiceSlider.position(width / 2, height / 4*3);
  // choiceSlider.hide();

  // Set up OSC
  mOsc = new p5.Oscillator("sine");
  mOsc.disconnect();
  mOsc.freq(0);
  mOsc.amp(0.0);

  mLfo = new p5.Oscillator("sine");
  mLfo.disconnect();
  mLfo.freq(0);
  mLfo.amp(60);
  mLfo.start();

  mEnv = new p5.Envelope();
  mEnv.setADSR(0.05, 0.1, 0.8, 0.5);

  mOsc.connect(p5.SoundOut);
  mOsc.freq(mLfo);
  mOsc.amp(mEnv);
  // mOsc.start();

  // noLoop();
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

function sendAndReceive() {
  // update serial: request new data
  if (mSerial.opened() && readyToReceive) {
    readyToReceive = false;
    mSerial.clear();
    
    
    if (detections.length && prevDetectionsLeng == 0) {     
      mSerial.write(1);
      // mSerial.write(0xab);
    } 
    if (detections.length == 0 && prevDetectionsLeng) {
      mSerial.write(0);
      // mSerial.write(0xab);
    } 
    if ((stateIndex == 0 || stateIndex == 1) && prevStateIndex == 5) {
      mSerial.write(2);
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

function musicComposition() {
  // stateIndex = 2;
  // stroke(255);
  noFill();
  // ellipse(0, height/2, height/2, height/2);
  // ellipse(0, height/2, height, height);
  // line(width/2, 0, width/2, height);
  // line(width/2 + width/6, 0, width/2 + width/6, height);
  // line(width/2 + width/6*2, 0, width/2 + width/6*2, height);
  textSize(50);

  stroke(notationsPrintedIndex == 0 ? selectedFill : unselectedFill);
  // strokeWeight(notationsPrintedIndex == 0 ? bigStroke : smallStroke);
  text(notationsPrinted[0], height/4 - 50, height/2);
  ellipse(0, height/2, height/2, height/2);

  stroke(notationsPrintedIndex == 1 ? selectedFill : unselectedFill);
  // strokeWeight(notationsPrintedIndex == 1 ? bigStroke : smallStroke);
  text(notationsPrinted[1], height/2 - 50, height/2);
  ellipse(0, height/2, height, height);

  stroke(notationsPrintedIndex == 2 ? selectedFill : unselectedFill);
  // strokeWeight(notationsPrintedIndex == 2 ? bigStroke : smallStroke);
  text(notationsPrinted[2], width/2 - 50, height/2);
  line(width/2, 0, width/2, height);

  stroke(notationsPrintedIndex == 3 ? selectedFill : unselectedFill);
  // strokeWeight(notationsPrintedIndex == 3 ? bigStroke : smallStroke);
  text(notationsPrinted[3], width/6 + width/2 - 50, height/2);
  line(width/2 + width/6, 0, width/2 + width/6, height);

  stroke(notationsPrintedIndex == 4 ? selectedFill : unselectedFill);
  // strokeWeight(notationsPrintedIndex == 4 ? bigStroke : smallStroke);
  text(notationsPrinted[4], width/6*2 + width/2 - 50, height/2);  
  line(width/2 + width/6*2, 0, width/2 + width/6*2, height);
}

function musicPlaying() {
  // Play the music  
  timer = millis() - startAtMillis;
  currentNoteIndex = floor(timer/durationPerNote) % 8;
  let mF = FREQS[notationsPrinted[currentNoteIndex]];
  mOsc.freq(mF);
  mLfo.freq(mF / 3);
  mEnv.play();  

  // Draw on the canvas
  noFill();

  strokeWeight(currentNoteIndex == 0 ? bigStroke : smallStroke);
  stroke(38, 70, 83);
  ellipse(0, height/2, height/2, height/2);

  strokeWeight(currentNoteIndex == 1 ? bigStroke : smallStroke);
  stroke(42, 157, 143);
  ellipse(0, height/2, height, height);
  
  strokeWeight((currentNoteIndex == 2 || currentNoteIndex == 5) ? bigStroke : smallStroke);
  stroke(233, 196, 106);
  line(width/2, 0, width/2, height);

  strokeWeight((currentNoteIndex == 3 || currentNoteIndex == 6) ? bigStroke : smallStroke);
  stroke(244, 162, 97);
  line(width/2 + width/6, 0, width/2 + width/6, height);

  strokeWeight((currentNoteIndex == 4 || currentNoteIndex == 7) ? bigStroke : smallStroke);
  stroke(231, 111, 81);
  line(width/2 + width/6*2, 0, width/2 + width/6*2, height);

  textSize(50);
  noStroke();

  fill(notationsPrintedIndex == 0 ? selectedFill : unselectedFill);
  text(notationsPrinted[0], height/4 - 50, height/2);

  fill(notationsPrintedIndex == 1 ? selectedFill : unselectedFill);
  text(notationsPrinted[1], height/2 - 50, height/2);

  fill(notationsPrintedIndex == 2 ? selectedFill : unselectedFill);
  text(notationsPrinted[2], width/2 - 50, height/2);

  fill(notationsPrintedIndex == 3 ? selectedFill : unselectedFill);
  text(notationsPrinted[3], width/6 + width/2 - 50, height/2);

  fill(notationsPrintedIndex == 4 ? selectedFill : unselectedFill);
  text(notationsPrinted[4], width/6*2 + width/2 - 50, height/2);  

  // Switch to the ending state
  if (timer/1000 >= durationOfPlay) {
    stateIndex = 4;
    prevStateIndex = 3;
  }
}

function endingState() {
  // Testing
  textAlign(CENTER);
  textSize(30);
  stroke(255);
  strokeWeight(3);
  text("Thank you! ", windowWidth/2, windowHeight/2, windowWidth/2 + 100, windowHeight/2 + 100);
  gameRestartButton.show();
  
}

function draw() {
  background(0,0,0,20);
  fill(255);
  rect(mouseX, mouseY, 100, 100);
  // console.log(type(FREQS));

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