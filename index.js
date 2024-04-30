import { initShaders } from "/cuon-utils.js";
import { Matrix4 } from "/cuon-matrix.js";
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js'

// Vertex shader program
const VSHADER_SOURCE = `
  precision mediump float;
  attribute vec2 a_Position;
  attribute vec2 a_UV
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_RotationMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_RotationMatrix * u_ModelMatrix * vec4(aPosition, 0.0, 1.0);
    // v_UV = a_UV;
  }
  `;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
    // gl_FragColor = vec4(v_UV, 0.0, 1.0);
  }`;

// Global Variables
let canvas;
let gl; 
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_RotationMatrix;

let g_globalAngle = 0.0;
let g_globalAngleX = 0.0;
let g_globalAngleY = 0.0;

let g_torsoAngle = 0.0;

let g_UpperRightArmAngle = 0.0;
let g_LowerRightArmAngle = 0.0;

let g_UpperLeftArmAngle = 0.0;
let g_LowerLeftArmAngle = 0.0;

let g_UpperRightLegAngle = 0.0;
let g_LowerRightLegAngle = 0.0;

let g_UpperLeftLegAngle = 0.0;
let g_LowerLeftLegAngle = 0.0;

let g_RFootAngle = 0.0;
let g_LFootAngle = 0.0;

let g_headAngle = 0.0;

let g_speed = 1000.0;

let mousemoveCanvas = false;
let animate = false;
let specialAnimate = false;

var stats = new Stats();

var shiftHeld = false;
var tabPressed = false;

stats.dom.style.left = "auto";
stats.dom.style.right = 0;
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

// Colors
var black = [0.0, 0.0, 0.0, 1.0];
var brown = [0.607, 0.403, 0.243, 1.0];
var navy = [0.0, 0.0, 0.5, 1.0];
var light_green = [144/255, 238/255, 144/255, 1.0];

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_Size = gl.getUniformLocation(gl.program, "u_Size");
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_RotationMatrix = gl.getUniformLocation(gl.program, "u_RotationMatrix");

  if(a_Position < 0 || a_UV < 0 || u_FragColor < 0 || u_Size < 0 || u_ModelMatrix < 0 || u_ProjectionMatrix < 0 || u_ViewMatrix < 0 || u_RotationMatrix < 0){
    console.log("Failed to get the storage location of attribute or uniform variable");
  }
}

function addActionsFromHTML() {

  canvas.addEventListener("mousedown", function(ev) {
    mousemoveCanvas = true;
  })

  canvas.addEventListener("mouseup", function(ev) {
    mousemoveCanvas = false;
  })

  canvas.addEventListener("mousemove", function(ev) {
    if (mousemoveCanvas) {
      g_globalAngleX = ev.clientX - canvas.width / 2;
      g_globalAngleY = ev.clientY - canvas.height / 2;
      renderScene();
    }
  })

  document.getElementById("angleSlide").addEventListener("mousemove", function() { 
    g_globalAngle = this.value;
    renderScene();
  })

  document.getElementById("RUASlide").addEventListener("mousemove", function() {
    g_UpperRightArmAngle = this.value;
    renderScene();
  })

  document.getElementById("RLAslide").addEventListener("mousemove", function() {
    g_LowerRightArmAngle = this.value;
    renderScene();
  })

  document.getElementById("LUASlide").addEventListener("mousemove", function() {
    g_UpperLeftArmAngle = this.value;
    renderScene();
  })

  document.getElementById("LLAslide").addEventListener("mousemove", function() {
    g_LowerLeftArmAngle = this.value;
    renderScene();
  })

  document.getElementById("torsoSlide").addEventListener("mousemove", function() {
    g_torsoAngle = this.value;
    renderScene();
  })

  document.getElementById("RULSlide").addEventListener("mousemove", function() {
    g_UpperRightLegAngle = this.value;
    renderScene();
  })

  document.getElementById("RLLSlide").addEventListener("mousemove", function() {
    g_LowerRightLegAngle = this.value;
    renderScene();
  })

  document.getElementById("LULSlide").addEventListener("mousemove", function() {
    g_UpperLeftLegAngle = this.value;
    renderScene();
  })

  document.getElementById("LLLSlide").addEventListener("mousemove", function() {
    g_LowerLeftLegAngle = this.value;
    renderScene();
  })

  document.getElementById("headSlide").addEventListener("mousemove", function() {
    g_headAngle = this.value;
    renderScene();
  })

  document.getElementById("animateButtonYes").addEventListener("click", function() {
    animate = true;
    specialAnimate = false;
    renderScene();
  })

  document.getElementById("animateButtonNo").addEventListener("click", function() {
    animate = false;
    specialAnimate = false;
    renderScene();
  })

  document.getElementById("RFOOTSlide").addEventListener("mousemove", function() {
    g_RFootAngle = this.value;
    renderScene();
  })

  document.getElementById("LFOOTSlide").addEventListener("mousemove", function() {
    g_LFootAngle = this.value;
    renderScene();
  })

  document.getElementById("speedSlide").addEventListener("mousemove", function() {
    g_speed = this.value;
    renderScene();
  })

  // Get Shift Tab Click to work

  canvas.addEventListener('keydown', function(event) {
    if (event.key === "Shift") {
        shiftHeld = true;
    }
    if (event.key === "Tab") {
        tabPressed = true;
        event.preventDefault();  // Prevent the default shift-tab behavior
    }
  });

  canvas.addEventListener('keyup', function(event) {
    if (event.key === "Shift") {
        shiftHeld = false;
    }
    if (event.key === "Tab") {
        tabPressed = false;
    }
  });

  canvas.addEventListener('click', function(event) {
      if (shiftHeld && tabPressed) {
          console.log('Shift+Tab and click!');
          specialAnimate = true;
          animate = true;
      }
  });
}

function renderScene() {

  //console.log("Rendering...");

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var globalRot = new Matrix4().rotate(g_globalAngle,0,1,0).rotate(-g_globalAngleY,1,0,0).rotate(-g_globalAngleX,0,1,0);
  gl.uniformMatrix4fv(u_RotationMatrix, false, globalRot.elements);

  if(animate){
    if(specialAnimate){
      drawSpecialAnimation();
    }else{
      drawAnimation();
    }
  }else{
    drawBody();
  }
}

var g_startTime = performance.now()/g_speed;
var g_seconds = performance.now()/g_speed - g_startTime;

function tick() {
  //console.log("Tick");
  stats.begin();
  g_seconds = performance.now()/g_speed - g_startTime;
  renderScene();
  stats.end();
  requestAnimationFrame(tick);
}

function drawSpecialAnimation() {
  console.log("Animating but special lol");
  const identityMatrix = new Matrix4();
  identityMatrix.translate(0,.3,0);

  // Create Torso
  var torso = new Matrix4(identityMatrix);
  //torso.rotate(g_torsoAngle, 0, 1, 0);
  torso.scale(1.5,1.8,0.8);
  drawCube(torso, light_green);

  // Create Head
  var head = new Matrix4(torso).scale(0.666, 0.555, 1.25);
  //head.rotate(g_headAngle,0,1,0);
  head.rotate(5 * Math.sin(g_seconds), 0, 1, 0);
  head.translate(0, 0.36, 0);
  drawCube(head, brown);

  // Create Hair
  var hair = new Matrix4(head);
  hair.translate(0,0.15,0);
  hair.scale(1,0.2,1);
  drawCube(hair, black);

  // Create Upper Right Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  //Rarm.rotate(g_UpperRightArmAngle, 1, 0, 0);
  //Rarm.rotate(10 * Math.sin(g_seconds) +55, 1, 0, 0);
  Rarm.rotate(65 * Math.abs(Math.sin(g_seconds)) + 89, 0, 0, 1);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Right Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  //LRam.rotate(g_LowerRightArmAngle, 1, 0, 0);
  //LRam.rotate(10 * Math.sin(g_seconds) + 55, 1, 0, 0);
  LRam.rotate(65 * Math.abs(Math.sin(g_seconds)), 0, 0, 1);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Left Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(-0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  //Rarm.rotate(g_UpperLeftArmAngle, 1, 0, 0);
  //Rarm.rotate(10 * Math.cos(g_seconds) + 55, 1, 0, 0);
  Rarm.rotate(-65 * Math.abs(Math.sin(g_seconds)) - 89, 0, 0, 1);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Left Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  //LRam.rotate(g_LowerLeftArmAngle, 1, 0, 0);
  //LRam.rotate(10 * Math.cos(g_seconds) + 55, 1, 0, 0);
  LRam.rotate(-65 * Math.abs(Math.sin(g_seconds)), 0, 0, 1);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Right Leg
  var URLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  //URLeg.rotate(g_UpperRightLegAngle, 1, 0, 0);
  //URLeg.rotate(10 * Math.sin(g_seconds) + 35, 1, 0, 0);
  URLeg.rotate(45 * Math.abs(Math.sin(g_seconds)), 0, 0, 1);
  URLeg.translate(0.1, -0.15, 0);
  URLeg.scale(0.5, 1.15, 0.5);
  drawCube(URLeg, navy);
  
  // Create Lower Right Leg
  var LRLeg = new Matrix4(URLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  //LRLeg.rotate(-g_LowerRightLegAngle, 1, 0, 0);
  //LRLeg.rotate(10 * Math.sin(g_seconds) - 35, 1, 0, 0);
  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var RFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  //RFoot.rotate(g_RFootAngle, 1, 0, 0);
  RFoot.translate(0, -0.17, 0);
  RFoot.scale(0.5, 0.2, 0.5);
  drawCube(RFoot, black);
  
  // Create Upper Left Leg
  var URLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  //URLeg.rotate(g_UpperLeftLegAngle, 1, 0, 0);
  //URLeg.rotate(10 * Math.cos(g_seconds) + 35, 1, 0, 0);
  URLeg.rotate(-45 * Math.abs(Math.sin(g_seconds)), 0, 0, 1);
  URLeg.translate(-0.1, -0.15, 0);
  URLeg.scale(0.5, 1.15, 0.5);
  drawCube(URLeg, navy);
  
  // Create Lower Left Leg
  var LRLeg = new Matrix4(URLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  //LRLeg.rotate(-g_LowerLeftLegAngle, 1, 0, 0);
  //LRLeg.rotate(10 * Math.cos(g_seconds) - 35, 1, 0, 0);
  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var LFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  //LFoot.rotate(g_LFootAngle, 1, 0, 0);
  LFoot.translate(0, -0.17, 0);
  LFoot.scale(0.5, 0.2, 0.5);
  drawCube(LFoot, black);
}

function drawAnimation() {
  console.log("Animating");

  const identityMatrix = new Matrix4();
  identityMatrix.translate(0,.3,0);

  // Create Torso
  var torso = new Matrix4(identityMatrix);
  //torso.rotate(g_torsoAngle, 0, 1, 0);
  torso.scale(1.5,1.8,0.8);
  drawCube(torso, light_green);

  // Create Head
  var head = new Matrix4(torso).scale(0.666, 0.555, 1.25);
  //head.rotate(g_headAngle,0,1,0);
  head.rotate(5 * Math.sin(g_seconds), 0, 1, 0);
  head.translate(0, 0.36, 0);
  drawCube(head, brown);

  // Create Hair
  var hair = new Matrix4(head);
  hair.translate(0,0.15,0);
  hair.scale(1,0.2,1);
  drawCube(hair, black);

  // Create Upper Right Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  //Rarm.rotate(g_UpperRightArmAngle, 1, 0, 0);
  Rarm.rotate(10 * Math.sin(g_seconds) +55, 1, 0, 0);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Right Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  //LRam.rotate(g_LowerRightArmAngle, 1, 0, 0);
  LRam.rotate(10 * Math.sin(g_seconds) + 55, 1, 0, 0);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Left Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(-0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  //Rarm.rotate(g_UpperLeftArmAngle, 1, 0, 0);
  Rarm.rotate(10 * Math.cos(g_seconds) + 55, 1, 0, 0);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Left Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  //LRam.rotate(g_LowerLeftArmAngle, 1, 0, 0);
  LRam.rotate(10 * Math.cos(g_seconds) + 55, 1, 0, 0);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Right Leg
  var URLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  //URLeg.rotate(g_UpperRightLegAngle, 1, 0, 0);
  URLeg.rotate(10 * Math.sin(g_seconds) + 35, 1, 0, 0);
  URLeg.translate(0.1, -0.15, 0);
  URLeg.scale(0.5, 1.15, 0.5);
  drawCube(URLeg, navy);
  
  // Create Lower Right Leg
  var LRLeg = new Matrix4(URLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  //LRLeg.rotate(-g_LowerRightLegAngle, 1, 0, 0);
  LRLeg.rotate(10 * Math.sin(g_seconds) - 35, 1, 0, 0);
  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var RFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  //RFoot.rotate(g_RFootAngle, 1, 0, 0);
  RFoot.translate(0, -0.17, 0);
  RFoot.scale(0.5, 0.2, 0.5);
  drawCube(RFoot, black);
  
  // Create Upper Left Leg
  var URLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  //URLeg.rotate(g_UpperLeftLegAngle, 1, 0, 0);
  URLeg.rotate(10 * Math.cos(g_seconds) + 35, 1, 0, 0);
  URLeg.translate(-0.1, -0.15, 0);
  URLeg.scale(0.5, 1.15, 0.5);
  drawCube(URLeg, navy);
  
  // Create Lower Left Leg
  var LRLeg = new Matrix4(URLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  //LRLeg.rotate(-g_LowerLeftLegAngle, 1, 0, 0);
  LRLeg.rotate(10 * Math.cos(g_seconds) - 35, 1, 0, 0);
  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var LFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  //LFoot.rotate(g_LFootAngle, 1, 0, 0);
  LFoot.translate(0, -0.17, 0);
  LFoot.scale(0.5, 0.2, 0.5);
  drawCube(LFoot, black);
}

function drawBody(){
  const identityMatrix = new Matrix4();
  identityMatrix.translate(0,.3,0);

  // Create Torso
  var torso = new Matrix4(identityMatrix);
  torso.rotate(g_torsoAngle, 0, 1, 0);
  torso.scale(1.5,1.8,0.8);
  drawCube(torso, light_green);

  // Create Head
  var head = new Matrix4(torso).scale(0.666, 0.555, 1.25);
  head.rotate(g_headAngle,0,1,0);
  head.translate(0, 0.36, 0);
  drawCube(head, brown);

  // Create Hair
  var hair = new Matrix4(head);
  hair.translate(0,0.15,0);
  hair.scale(1,0.2,1);
  drawCube(hair, black);

  // Create Upper Right Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  Rarm.rotate(g_UpperRightArmAngle, 1, 0, 0);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Right Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  LRam.rotate(g_LowerRightArmAngle, 1, 0, 0);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Left Arm
  var Rarm = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(-0.25, 0.16, 0); // Make the pivot point at the shoulder and reset the scale system
  Rarm.rotate(g_UpperLeftArmAngle, 1, 0, 0);
  Rarm.translate(0, -0.1, 0);
  Rarm.scale(0.5, 1, 0.5);
  drawCube(Rarm, light_green);

  // Create Lower Left Arm
  var LRam = new Matrix4(Rarm).scale(2,1,2).translate(0, -0.15, 0);
  LRam.rotate(g_LowerLeftArmAngle, 1, 0, 0);
  LRam.translate(0, -0.11, 0);
  LRam.scale(0.5, 1, 0.5);
  drawCube(LRam, brown);

  // Create Upper Right Leg
  var URLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  URLeg.rotate(g_UpperRightLegAngle, 1, 0, 0);
  URLeg.translate(0.1, -0.15, 0);
  URLeg.scale(0.5, 1.15, 0.5);
  drawCube(URLeg, navy);
  
  // Create Lower Right Leg
  var LRLeg = new Matrix4(URLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  LRLeg.rotate(-g_LowerRightLegAngle, 1, 0, 0);
  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var RFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  RFoot.rotate(g_RFootAngle, 1, 0, 0);
  RFoot.translate(0, -0.17, 0);
  RFoot.scale(0.5, 0.2, 0.5);
  drawCube(RFoot, black);
  
  // Create Upper Left Leg
  var ULLeg = new Matrix4(torso).scale(0.666, 0.555, 1.25).translate(0, -0.22, 0);
  ULLeg.rotate(g_UpperLeftLegAngle, 1, 0, 0);
  ULLeg.translate(-0.1, -0.15, 0);
  ULLeg.scale(0.5, 1.15, 0.5);
  drawCube(ULLeg, navy);
  
  // Create Lower Left Leg
  var LRLeg = new Matrix4(ULLeg).scale(2,0.83,2).translate(0, -0.15, 0);
  LRLeg.rotate(-g_LowerLeftLegAngle, 1, 0, 0);

  LRLeg.translate(0, -0.15, 0);
  LRLeg.scale(0.5, 1.1, 0.5);
  drawCube(LRLeg, brown);

  var LFoot = new Matrix4(LRLeg).scale(2,0.909,2);
  LFoot.rotate(g_LFootAngle, 1, 0, 0);
  LFoot.translate(0, -0.17, 0);
  LFoot.scale(0.5, 0.2, 0.5);
  drawCube(LFoot, black);
}

function drawSquare(identityMatrix,rgba) {
  
  gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

  const SM1 = new Matrix4();
  
  SM1.set(identityMatrix);
  SM1.translate(0, 0, 0);
  SM1.rotate(180, 0, 0, 1);
  SM1.scale(0.25, 0.25, 0.25);

  gl.uniformMatrix4fv(u_ModelMatrix, false, SM1.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  SM1.set(identityMatrix); // Reset Coord System
  SM1.translate(0, 0, 0);
  SM1.rotate(0, 0, 0, 1);
  SM1.scale(0.25, 0.25, 0.25);

  gl.uniformMatrix4fv(u_ModelMatrix, false, SM1.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function drawCube(identityMatrix,rgba) {
  const M1 = new Matrix4(identityMatrix);

  // Draw Front Face
  rgba[3] = 1;
  M1.translate(0, 0, 0.125);  // Move forward in the z-axis
  drawSquare(M1,rgba);

  // Draw Back Face
  rgba[3]= 0.9;
  M1.set(identityMatrix);
  M1.translate(0, 0, -0.125);  // Move back in the z-axis
  drawSquare(M1,rgba);

  // Draw Top Face
  rgba[3]= 0.8;
  M1.set(identityMatrix);
  M1.rotate(-90, 1, 0, 0);  // Rotate 90 degrees around the x-axis
  M1.translate(0, 0, 0.125);  // Move up in the z-axis
  drawSquare(M1,rgba);

  // Draw Bottom Face
  rgba[3]= 0.8;
  M1.set(identityMatrix);
  M1.rotate(90, 1, 0, 0);  // Rotate -90 degrees around the x-axis
  M1.translate(0, 0, 0.125);  // Move down in the z-axis
  drawSquare(M1,rgba);

  // Draw Left Face
  rgba[3]= 0.9;
  M1.set(identityMatrix);
  M1.rotate(-90, 0, 1, 0);  // Rotate 90 degrees around the y-axis
  M1.translate(0, 0, 0.125);  // Move left in the z-axis
  drawSquare(M1,rgba);

  // Draw Right Face
  rgba[3]= 1;
  M1.set(identityMatrix);
  M1.rotate(90, 0, 1, 0);  // Rotate -90 degrees around the y-axis
  M1.translate(0, 0, 0.125);  // Move right in the z-axis
  drawSquare(M1,rgba);

}

function main(){

  setupWebGL();
  connectVariablesToGLSL();
  addActionsFromHTML();

  // Set clear color
  gl.clearColor(200, 200, 200, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT);

  const vertices = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5]);

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.enable(gl.DEPTH_TEST);

  requestAnimationFrame(tick);
}

main();
