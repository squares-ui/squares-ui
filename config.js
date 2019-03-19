////************************
//// Config details for SAKE
////************************

// Blocksize represents the default window size in seconds that a default graph describes (this is overwritter though a lot, it's merely a starting point)
// Default is 15, bigger windows will affect performance


// odd balls
var GLB = Object ();
GLB.screenLogMax = 10;
GLB.drawLineBezier = false;
GLB.zoomLevels=[0.75, 1, 1.2, 1.5, 2];
// 0 = "EMERGCY", 1 = "Alert"...  "Critical", "Error ", "Warning", "Notice ", "Informa", "Debug  "];
// lower qqLogging means less logging
GLB.qqLogging = 6;


//govern the definitions of a visual square
GLB.square = Object ();
GLB.square.blocksize=(60*60);
GLB.square.snaptogrid = 50;
GLB.square.dragSensitivity = 1;
GLB.square.reshowLoadingIcon = true;
GLB.square.width = 1000;
GLB.square.height = 1000;

// determine how we treat global vars for ThreeJS handling
GLB.threejs = Object();
GLB.threejs.realTimeRender = true; // false renders on setTimeout of interval below.  better for CPU
GLB.threejs.notRealTimeRenderFrequency = 500; // measured in ms


// these are for the square that auto udpates children squares
GLB.tick = Object();
GLB.tick.visualUpdate = 1000; // ms in which the Update graph types update their visuals
GLB.tick.dataUpdateMinimum = 5000; // every ms that JS checks if any squares need data refreshing
