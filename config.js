////************************
//// Config details for SQUARES
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
GLB.qqLogging = 7;
GLB.hidesquaremenus = false;
GLB.saveRawData = true // Code can pass data straight through to render, but saving helps debug

GLB.useStrict = false;  // global strictness


//govern the definitions of a visual square
GLB.square = Object ();
GLB.square.blocksize=(15*60);
GLB.square.snaptogrid = 50;
GLB.square.dragSensitivity = 1;
GLB.square.reshowLoadingIcon = true;
GLB.square.width = 1000;
GLB.square.height = 1000;
GLB.square.hoverfade = 5000;

GLB.colorMain = "#88fff7"
// color range offered to all squres (though they can use specifics locally if needed)
// here are many options, you only need one uncommented
//GLB.color = d3.scaleOrdinal(d3.schemeCategory10);
//GLB.color = d3.scaleOrdinal().range(["#213b25","#3a604a","#4f7754","#a19f7c","#77744f","#775c4f","#603b3a","#3b2137","#170e19","#2f213b","#433a60","#4f5277","#65738c","#7c94a1","#a0b9ba","#c0d1cc"]);
//GLB.color = d3.scaleOrdinal().range(["#be4a2f","#d77643","#ead4aa","#e4a672","#b86f50","#733e39","#3e2731","#a22633","#e43b44","#f77622","#feae34","#fee761","#63c74d","#3e8948","#265c42","#193c3e","#124e89","#0099db","#2ce8f5","#ffffff","#c0cbdc","#8b9bb4","#5a6988","#3a4466","#262b44","#181425","#ff0044","#68386c","#b55088","#f6757a","#e8b796","#c28569"])
//GLB.color = d3.scaleOrdinal().range(["#050914","#110524","#3b063a","#691749","#9c3247","#d46453","#f5a15d","#ffcf8e","#ff7a7d","#ff417d","#d61a88","#94007a","#42004e","#220029","#100726","#25082c","#3d1132","#73263d","#bd4035","#ed7b39","#ffb84a","#c6d831","#77b02a","#429058","#2c645e","#15c4a","#052137","#0e0421","#0c0b42","#032769","#144491","#488bd4","#78d7ff","#b0fff1","#c7d4e1","#928fb8","#5b537d","#392946","#24142c","#0e0f2c","#132243","#1a466b","#10908e","#28c074","#3dff6e","#f8ffb8","#f0c297","#cf968c","#8f5765","#52294b","#0f022e","#3503b","#64004c","#9b0e3e","#d41e3c","#ed4c40","#ff9757","#d4662f","#9c341a","#691b22","#450c28","#2d002e"])
GLB.color = ['#3F6833', '#967302', '#2F575E', '#99440A', '#58140C', '#052B51', '#511749', '#3F2B5B', '#508642', '#CCA300', '#447EBC', '#C15C17', '#890F02', '#0A437C', '#6D1F62', '#584477', '#629E51', '#E5AC0E', '#64B0C8', '#E0752D', '#BF1B00', '#0A50A1', '#962D82', '#614D93', '#7EB26D', '#EAB839', '#6ED0E0', '#EF843C', '#E24D42', '#1F78C1', '#BA43A9', '#705DA0', '#9AC48A', '#F2C96D', '#65C5DB', '#F9934E', '#EA6460', '#5195CE', '#D683CE', '#806EB7', '#B7DBAB', '#F4D598', '#70DBED', '#F9BA8F', '#F29191', '#82B5D8', '#E5A8E2', '#AEA2E0', '#E0F9D7', '#FCEACA', '#CFFAFF', '#F9E2D2', '#FCE2DE', '#BADFF4', '#F9D9F9', '#DEDAF7' ]


// determine how we treat global vars for ThreeJS handling
GLB.threejs = Object();
GLB.threejs.enabled = true;  // hether to load ThreeJS libraries
GLB.threejs.realTimeRender = true; // true = performance, false renders on setTimeout of interval below.  better for CPU
GLB.threejs.notRealTimeRenderFrequency = 500; // measured in ms
GLB.threejs.showperformance = false;
GLB.threejs.fps_TimeOut = 1000/60;  // bigger number is long delay = lower fps for low power machines.  1000=1fps,  16=60fps

// When a query aggregates, how many fields should we return?
GLB.dftAggregationSize = 100 // not fully implemented everywhere

// these are for the square that auto udpates children squares
GLB.tick = Object();
GLB.tick.visualUpdate = 1000; // ms in which the Update graph types update their visuals
GLB.tick.dataUpdateMinimum = 5000; // every ms that JS checks if any squares need data refreshing

var timeWindowsEnd = new Array();
timeWindowsEnd.push([-10, "-10 Seonds"]); 
timeWindowsEnd.push([-30, "-30 Secs "]); 
timeWindowsEnd.push([-60 * 2, '-2 Mins ']); 
timeWindowsEnd.push([-60 * 5, '-5 Mins ']); 
timeWindowsEnd.push([-60 * 15, '-15 Mins ']); 
timeWindowsEnd.push([-60 * 60, '-1 Hours ']); 
timeWindowsEnd.push([-60 * 60 * 12, '-12 Hours ']); 
timeWindowsEnd.push([-60 * 60 * 24, '-1 Day ']); 
timeWindowsEnd.push([-60 * 60 * 24 * 7, '-1 Week ']); 
timeWindowsEnd.push([-60 * 60 * 24 * 7 * 4, '-1 Month ']); 
timeWindowsEnd.push([10, "+10 Seonds "]); 
timeWindowsEnd.push([30, "+30 Secs "]); 
timeWindowsEnd.push([60 * 2, '+2 Mins ']); 
timeWindowsEnd.push([60 * 5, '+5 Mins ']); 
timeWindowsEnd.push([60 * 15, '+15 Mins ']); 
timeWindowsEnd.push([60 * 60, '+1 Hours ']); 
timeWindowsEnd.push([60 * 60 * 12, '+12 Hours ']); 
timeWindowsEnd.push([60 * 60 * 24, '+1 Day ']); 
timeWindowsEnd.push([60 * 60 * 24 * 7, '+1 Week ']); 
timeWindowsEnd.push([60 * 60 * 24 * 7 * 4, '+1 Month ']); 

var timeWindowsSize = new Array();
timeWindowsSize.push([-10, "10 Secs"]); 
timeWindowsSize.push([-30, "30 Secs"]); 
timeWindowsSize.push([-60 * 2, '2 Mins']); 
timeWindowsSize.push([-60 * 5, '5 Mins']); 
timeWindowsSize.push([-60 * 15, '15 Mins']); 
timeWindowsSize.push([-60 * 60, '1 Hours']); 
timeWindowsSize.push([-60 * 60 * 4, '4 Hours']); 
timeWindowsSize.push([-60 * 60 * 12, '12 Hours']); 
timeWindowsSize.push([-60 * 60 * 24, '1 Day']); 
timeWindowsSize.push([-60 * 60 * 24 * 7, '1 Week']); 
timeWindowsSize.push([-60 * 60 * 24 * 7 * 4, '1 Month']); 

var timeWindowsRefresh = new Array();
timeWindowsRefresh.push([10, "10 Secs"]); 
timeWindowsRefresh.push([30, "30 Secs"]); 
timeWindowsRefresh.push([60 * 2, '2 Mins']); 
timeWindowsRefresh.push([60 * 5, '5 Mins']); 
timeWindowsRefresh.push([60 * 15, '15 Mins']); 
timeWindowsRefresh.push([60 * 60, '1 Hours']); 
timeWindowsRefresh.push([60 * 60 * 12, '12 Hours']); 
timeWindowsRefresh.push([60 * 60 * 24, '1 Day']); 



GLB.Months = [ 
    {"full":"-", "short":"-"},
    {"full":"January", "short":"Jan"},
    {"full":"February", "short":"Feb"},
    {"full":"March", "short":"Mar"},
    {"full":"April", "short":"Apr"},
    {"full":"May", "short":"May"},
    {"full":"June", "short":"Jun"},
    {"full":"July", "short":"Jul"},
    {"full":"August", "short":"Aug"},
    {"full":"September", "short":"Sep"},
    {"full":"October", "short":"Oct"},
    {"full":"November", "short":"Nov"},
    {"full":"December", "short":"Dec"}
  ]
  
GLB.Days = [ 
    {"full":"-", "short":"-"},
    {"full":"Monday", "short":"Mon"},
    {"full":"Tuesday", "short":"Tues"},
    {"full":"Wednesday", "short":"Wed"},
    {"full":"Thursday", "short":"Thu"},
    {"full":"Friday", "short":"Fri"},
    {"full":"Saturday", "short":"Sat"},
    {"full":"Sunday", "short":"Sun"}
]


GLB.favourites = [
  {	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145c",
    "printable": "Source",
    "Gt": "PieChart",
    "Cs":{"array":["observer.name","event.category","event.module"],"x_scale":"linear","x_null":true}
  },{
    "uid":"b3f804d73f990a227894ef92d61dd58f",
    "printable":"File mime source and Name",
    "Gt":"Sankey",
    "Cs":{"array":["file.mime_type","file.source"],"x_scale":"linear", "x_null":1}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145m",
    "printable": "Trend of Event Types",
    "Gt": "Trend",
    "Cs":{"x_field":"event.dataset","x_windowSlide":"TheWindowSize","x_windows":"6"}
  },{				
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145l",
    "printable": "Bytes xFer/Port/Protocol",
    "Gt": "TreemapCandles",
    "Cs":{"array":["network.protocol","destination.port"],"x_candle":"network.bytes","x_scale":"linear","x_null":true}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145e",
    "printable": "Connection States",
    "Gt": "PieChart",
    "Cs":{"array":["connection.state_description","destination.port"],"x_scale":"log"}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145o",
    "printable": "Trend DNS",
    "Gt": "Trend",
    "Cs":{"x_field":"dns.subdomain","x_windowSlide":"TheWindowSize","x_windows":"6"}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145g",
    "printable": "PKI Certs",
    "Gt": "Sankey",
    "Cs":{"array":["ssl.version","ssl.validation_status","ssl.next_protocol"],"x_scale":"linear","x_null":true}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145i",
    "printable": "HTTP Response Codes",
    "Gt": "Sankey",
    "Cs":{"array":["http.method","http.status_code"],"x_scale":"linear","x_null":true}
  },{	
    "uid": "elastic_a3dcb4d229de6fde0db5686dee47145s",
    "printable": "Calendar Heatmap",
    "Gt": "Calendar HeatMap",
    "Cs":{"x_field":"@timestamp"}
  },
  {"printable":"Agent IP and Type","Gt":"PieChart","Cs":{"array":["agent.ip","data.type"],"x_scale":"log"},"uid":"b9f3749ace1c2161112c689451f5638e"},
  {"printable":"Destination Globe by Dst Port","Gt":"Globe","Cs":{"x_lat":"destination.geo.location.lat","x_lon":"destination.geo.location.lon","x_track":"destination.port","x_scale":"linear"},"uid":"499c12478e8f7898a71241437007435e"}

]