#include <ArduinoJson.h>
#include "Adafruit_Thermal.h"
#include "SoftwareSerial.h"
#include <EEPROM.h>
#define TX_PIN 0 // Arduino transmit  YELLOW WIRE  labeled RX on printer
#define RX_PIN 1 // Arduino receive   GREEN WIRE   labeled TX on printer

SoftwareSerial mySerial(RX_PIN, TX_PIN); // Declare SoftwareSerial obj first
Adafruit_Thermal printer(&mySerial);     // Pass addr to printer constructor

// project variables
// a0 Pin: potentiometer value detection
int a0Val = 0;
// d2 pin: connected to button1, controls the write/erase action of music note
int d2Val = 0;
// d3 pin: connected to button2, switch to new line upon pressing
int d3ClickCount = 0;
int d3Val = 0;
int chordArray[5] = {100, 100, 100, 100, 100}; // array with 5 placeholders to store chord note indexes
int chordArrayIndex = 0;

const int ledPin = 4;

int prevD3Val = 0;

int prevByteIn = 10;
int byteIn = 11;

// String Line = "";

void sendData() {
  StaticJsonDocument<128> resJson;
  JsonObject data = resJson.createNestedObject("data");
  JsonObject A0 = data.createNestedObject("A0");
  JsonObject D2 = data.createNestedObject("D2");
  JsonObject D3 = data.createNestedObject("D3");

  A0["value"] = a0Val;
  D2["isPressed"] = d2Val;
  D3["isPressed"] = d3Val;
  D3["count"] = d3ClickCount;

  String resTxt = "";
  serializeJson(resJson, resTxt);

  Serial.println(resTxt);
}

void setup() {
  // Serial setup
  mySerial.begin(9600);  // Initialize SoftwareSerial
  printer.begin();        // Init printer (same regardless of serial type)
  Serial.begin(9600);
  Serial.setTimeout(50);
  while (!Serial) {}
  pinMode(ledPin, OUTPUT);
}

// String createLine() {
//   String Line = "";
//   // for (int j = 0; j<sizeof(chordArray); j++) {
//   //   Line += String(chordArray[j]);
//   // }  
//   for (int i = 0; i<24; i++) {
//     bool note = false;
//     for (int j = 0; j<sizeof(chordArray); j++) {
//       if (i == chordArray[j]) {
//         note = true;
//       }
//     }
//     if (note) {
//       Line += "A";
//     } else {
//       Line += " ";
//     }
//   }
//   return Line;
// }

void loop() {
  // read pins
  a0Val = analogRead(A0);
  d2Val = digitalRead(2);
  d3Val = digitalRead(3);

  // calculate if d3 was clicked
  if (d3Val && d3Val != prevD3Val) {
    d3ClickCount++;
  }
  // if (d2Val) {
  //   d3ClickCount = 0;
  // }

  prevD3Val = d3Val;

  // check if there was a request for data, and if so, send new data
  if (Serial.available() > 0) {
    prevByteIn = byteIn;
    byteIn = Serial.read();
    if (byteIn == 0xAB) {
      Serial.flush();
      sendData();
    } else if (byteIn == 31) {
      digitalWrite(ledPin, HIGH);
      printer.justify('C');
      printer.println("Let's play! ");
      printer.println();
      printer.println();
      printer.println();
      printer.sleep();      // Tell printer to sleep
    } else if (byteIn == 30) {
      digitalWrite(ledPin, LOW);
      printer.wake();       // MUST wake() before printing again, even if reset
      printer.setDefault(); // Restore printer to defaults
    } else if (byteIn == 32){ 
      d3ClickCount = 0;
    } else if (byteIn == 33) { // State 2: music composition
      printer.wake();       // MUST wake() before printing again, even if reset
      printer.setDefault(); // Restore printer to defaults
    } else if (byteIn == 34) {
      printer.println();
      printer.println();
      printer.println("It was so happy to play with you!");
      printer.println();
      printer.println("You are a very talented musician. . .");
      printer.println();
      printer.println("Feel free to take my notes away :D");
      printer.println();
      printer.println();
      printer.println();
      printer.sleep();      // Tell printer to sleep
    } else {
      printer.justify('L');
      // if (byteIn == 34) {
      //   printer.println(createLine());
      // } else {
      //   if (prevByteIn == 0xab) {
      //     for (int j = 0; j<sizeof(chordArray); j++) {
      //       chordArray[j] = 100;
      //     }
      //   } else {
      //     chordArray[chordArrayIndex] = byteIn;
      //     chordArrayIndex += 1;
      //   }
      // }
      printer.inverseOn();
      String Line = "";
      for (int i=0; i<byteIn*5; i++) {
        Line += " ";
      }

      printer.justify('C');
      printer.println(Line);
      printer.inverseOff();
      printer.println();
    }
  }

  delay(2);
}
