graphs_functions_json.add_graphs_json({
	"apache":{
		"DayTimeHits":{
			"populate":"populate_apache_daytime_mountain",
			"rawtoprocessed":"process_apache_daytime_mountain",
			"param": "", 
			"graph":"graph_apache_daytime_mountain",
			"about": "Links of methods and files"
		}
	}
});





function populate_apache_daytime_mountain(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 
	
	var Ds = btoa(calcDs(id, []));
	var fields = btoa("date,time,srcip,url,size");
	apache_connector(id, from, to, Ds, fields);
	
}



function process_apache_daytime_mountain(id){

//	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	data = data.split("\n");
	var headers = data.shift();

	var data2 = Object ();
	for (var i = 0; i < data.length ; i++){	

		if(data[i].split("\t")[0] != "" && data[i].split("\t")[0] != null){

			// For looping
			var thisRow = data[i].split(",");
			// for ease
			var [date, time, srcip, url, size] = thisRow;

			if(size =="-"){
				size = 0;
			}

			// work out thge dan number
			var d = new Date(date);
			var day = d.getDay();

			// create an array for seconds
			var timeArray = time.split(':');

			if(typeof data2[day] !== 'undefined' && typeof data2[day][timeArray[0]] !== 'undefined' ){
				data2[day][timeArray[0]][srcip] = 0;

			}else if(typeof data2[day] !== 'undefined'  && typeof data2[day][timeArray[0]] === 'undefined' ){
				data2[day][timeArray[0]] = Object ();
				data2[day][timeArray[0]][srcip] = 0;

			}else if(typeof data2[day] === 'undefined'){
				data2[day] = Object ();
				data2[day][timeArray[0]] = Object ();
				data2[day][timeArray[0]][srcip] = 0;
			}


		}
	}	


	data3 = Object();
	
	for (var keyDay in data2) {
		if (!data2.hasOwnProperty(keyDay)) continue;
	
		for (var keyHour in data2[keyDay]) {
			if (!data2[keyDay].hasOwnProperty(keyHour)) continue;
		
			if(typeof data3[keyDay] !== 'undefined'  && typeof data3[keyDay][keyHour] === 'undefined' ){
				data3[keyDay][keyHour] = Object.keys(data2[keyDay][keyHour]).length;

			}else if(typeof data3[keyDay] === 'undefined'){
				data3[keyDay] = Object ();
				data3[keyDay][keyHour] = Object.keys(data2[keyDay][keyHour]).length;
			}
		}
	}


	saveProcessedData(id, '', data3);

}


function graph_apache_daytime_mountain(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
		//.append("canvas")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;

	// srcip,date,time,extension,http_response,size
	var data = retrieveSquareParam(id, 'processeddata');
	
	var scene = new THREE.Scene();
	scene.userData.id = id;
	scene.userData.doMousePos = true;

	//var gridXZ = masterGridXZ.clone();  //clone not implemented for grids??
	var gridXZ =  new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
	gridXZ.position.set((grid_size*0.5), 0, (grid_size*0.5));
//	scene.add(gridXZ);

	var element = document.getElementById("square_"+id);
	scene.userData.elementt = element;

	var camera = masterCamera.clone();
	camera.position.x = grid_size*1.5;
	camera.position.y = grid_size*1.5;
	camera.position.z = grid_size*1.5;
	scene.userData.camera = camera;

	var myLight = masterAmbientLight.clone();
	scene.add(myLight);

	var controls = new THREE.OrbitControls( camera);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.panningMode = THREE.HorizontalPanning;
	controls.minDistance = grid_size*1.9;
	controls.maxDistance = grid_size*4;
	controls.maxPolarAngle = Math.PI / 2;
	controls.autoRotate = true;
	controls.autoRotateSpeed = 0.06;
	controls.userRotate = true;
	controls.userRotateSpeed = 0.01;
	controls.target.x = 100;
	controls.target.y = 100;
	controls.target.z = 100;
	scene.userData.controls = controls;


	var raycaster = new THREE.Raycaster();
	scene.userData.raycaster = raycaster;

	// *****
	var boxGeometry = new THREE.BoxGeometry(2, 2, 2);

	var materialGr = new THREE.MeshBasicMaterial( { color: "green"} );
	var materialOr = new THREE.MeshBasicMaterial( { color: "orange"} );
	var materialBl = new THREE.MeshBasicMaterial( { color: "blue"} );

	var markerGr = new THREE.Mesh(boxGeometry, materialGr);
	var markerOr = new THREE.Mesh(boxGeometry, materialOr);
	var markerBl = new THREE.Mesh(boxGeometry, materialBl);

	var rfc1918 = new RegExp("^(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\..*");
	dayNames = ["Sun", "Mon", "Tue", "Wed", "Thurs", "Fri", "Sat"];

	var geometry = new THREE.Geometry();

	for (var keyDay in data) {
		if (!data.hasOwnProperty(keyDay)) continue;
	
		for (var keyHour in data[keyDay]) {
			if (!data[keyDay].hasOwnProperty(keyHour)) continue;


			var vertex1 = new THREE.Vector3();
			vertex1.x = keyDay / 7 * grid_size;
			vertex1.y = 0;
			vertex1.z = keyHour / 24 * grid_size;
			geometry.vertices.push( vertex1 );
			
			var vertex2 = new THREE.Vector3();
			vertex2.x = keyDay / 7 * grid_size;
			vertex2.y = data[keyDay][keyHour] / 100 * grid_size;
			vertex2.z = keyHour / 24 * grid_size;
			geometry.vertices.push( vertex2 );


			var thisMarker = markerBl.clone();		
			
			thisMarker.position.x = keyDay / 7 * grid_size;
			thisMarker.position.y = data[keyDay][keyHour] / 100 * grid_size;
			thisMarker.position.z = keyHour / 24 * grid_size;
			thisMarker.sakeName = dayNames[keyDay]+" "+keyHour+"H:00";

			let clickObject = btoa('');
			thisMarker.sakeAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject} , {} ) };
			thisMarker.sakeAction = function(){ alert("Not implemented for this square") };
			scene.add(thisMarker);
		}
	}



	material = new THREE.LineBasicMaterial( { color: 0x456569, linewidth: 200 } );
	var myLines = new THREE.LineSegments( geometry, material );
	myLines.updateMatrix();
	
	scene.add(myLines);

	//scene.add(myLines);
	threeScenes["square_"+id] = scene;



}	

 



