graphs_functions_json.add_graphs_json({
	"apache":{
		"MethodFileSize":{
			"populate":"populate_apache_methodfilesize_tube",
			"rawtoprocessed":"process_apache_methodfilesize_tube",
			"param": "", 
			"graph":"graph_apache_methodfilesize_tube",
			"about": "Links of methods and files"
		}
	}
});





function populate_apache_methodfilesize_tube(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 
	
	var Ds = btoa(calcDs(id, []));
	var fields = btoa("method,url,size");
	apache_connector(id, from, to, Ds, fields);
	
}



function process_apache_methodfilesize_tube(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	var elements = ["method", "url", "size"];
	var linesGroups = ["methodToUrl", "urlToSize"]
	
	data3 = Object();
	data3.keys = Object();
	data3.lines = Object();

	for (var i = 0; i < elements.length ; i++){
		data3.keys[elements[i]] = Object();
	}
	for (var i = 0; i < linesGroups.length ; i++){
		data3.lines[linesGroups[i]] = Object();
	}
	// remove the header line
	data = data.split("\n");
	var headers = data.shift();
	for (var i = 0; i < data.length ; i++){	
		// take out unique values for creating spheres
		if(data[i].split("\t")[0] != "" && data[i].split("\t")[0] != null){

			var thisRow = data[i].split(",");
			// this is how we track the keys for drawing dots, we don't need to count as well
			for (var j = 0; j < elements.length ; j++){
				// e.g. data3.method = Object();
				data3.keys[elements[j]][thisRow[j]] = 0;
			}

			// now link elements across columns
			// elements always has 1 more element than linesGroups, so use i and i+1 to access them both?
			// for each group of lines 
			for (var k = 0; k < linesGroups.length ; k++){

				// does lines[1] exist, and lines[1][2] ?
				if(typeof data3.lines[linesGroups[k]][thisRow[k]] !== 'undefined' && typeof data3.lines[linesGroups[k]][thisRow[k]][thisRow[k+1]] !== 'undefined' ){
					data3.lines[linesGroups[k]][thisRow[k]][thisRow[k+1]]++;
				// does lines[1] exist alone?
				}else if(typeof data3.lines[linesGroups[k]][thisRow[k]] !== 'undefined' && typeof data3.lines[linesGroups[k]][thisRow[k]][thisRow[k+1]] === 'undefined' ){
					data3.lines[linesGroups[k]][thisRow[k]][thisRow[k+1]] = 1;
				// is this the first time lines[1] has been seen (never mind lines[1][2] ?
				}else if(typeof data3.lines[linesGroups[k]][thisRow[k]] === 'undefined' ){
					data3.lines[linesGroups[k]][thisRow[k]] = Object ();
					data3.lines[linesGroups[k]][thisRow[k]][thisRow[k+1]] = 1;
				}
			}	
		}
	}

	data4 = Object();
	data4.spheres = Object();

	for (var i = 0; i < elements.length ; i++){
		data4.spheres[elements[i]] = Object.keys(data3.keys[elements[i]]);
	}
	data4.lines = data3.lines;

	saveProcessedData(id, '', data4);
}


function graph_apache_methodfilesize_tube(id){
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


	var logMaxGuesstimate = 2000; // revise how we do this.  1,000,000 events too big for chat?  too big for browser?

	var elements = ["method", "url", "size"];
	var linesGroups = ["methodToUrl", "urlToSize"]
	var twopies = 2 * Math.PI;

	// add all the markers to the scene
	for (var j = 0; j < elements.length; j++){
		// radius, stick closer to middle, if less items
		radius = Math.log(data["spheres"][elements[j]].length) / Math.log(2000) * grid_size;

		for (var i = 0; i < data["spheres"][elements[j]].length ; i++){

			x = (j / elements.length) * grid_size;
			// opposite = radius * sin degrees
			y = radius * Math.sin( i / data["spheres"][elements[j]].length * twopies) + (grid_size/2); 
			// adjacent = radius * cos degrees
			z = radius * Math.cos( i / data["spheres"][elements[j]].length * twopies) + (grid_size/2); 
			
			var thisMarker = markerBl.clone();		
			if(elements[j] == "initIp" || elements[j] == "respIp"){
				if(rfc1918.test(data["spheres"][elements[j]][i]) ){
					thisMarker = markerGr.clone();		
					x = x + 5;
				}else{
					thisMarker = markerOr.clone();		
				}

			}else if(elements[j] == "initPort"){
				if(data["spheres"][elements[j]][i] < 1025){
					thisMarker = markerOr.clone();		
				}
			}

			thisMarker.position.x = x;
			thisMarker.position.y = y;
			thisMarker.position.z = z;

			thisMarker.sakeName = elements[j]+": "+data["spheres"][elements[j]][i];

//			let clickObject = btoa(elements[j]+'="'+data["spheres"][elements[j]][i]+'"');
			let clickObject = btoa('{"'+elements[j]+'":"'+data["spheres"][elements[j]][i]+'"}');

			thisMarker.sakeAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject} , {} ) };
			scene.add(thisMarker);
		}

	}



	var geometry = new THREE.Geometry();
	for (var j = 0; j < linesGroups.length; j++){
		var radius1 = Math.log(data["spheres"][elements[j]].length) / Math.log(2000) * grid_size;
		var radius2 = Math.log(data["spheres"][elements[j+1]].length) / Math.log(2000) * grid_size;

		for (var k1 in data.lines[linesGroups[j]]) {
			if (!data.lines[linesGroups[j]].hasOwnProperty(k1)) continue;

			for (var k2 in data.lines[linesGroups[j]][k1]){
				if (! data.lines[linesGroups[j]][k1].hasOwnProperty(k2)) continue;
				
				//qq(k1+" "+k2+" = "+data.lines.portToIp[k1][k2]);
				//qq(j+" "+k1+" > "+k2);

				var vertex1 = new THREE.Vector3();
				vertex1.x = (j / elements.length) * grid_size;
				vertex1.y = radius1 * Math.sin( data["spheres"][elements[j]].indexOf(k1) / data["spheres"][elements[j]].length * twopies) + (grid_size/2);
				vertex1.z = radius1 * Math.cos( data["spheres"][elements[j]].indexOf(k1) / data["spheres"][elements[j]].length * twopies) + (grid_size/2);
				
				var vertex2 = new THREE.Vector3();
				vertex2.x = ((j+1) / elements.length) * grid_size;
				vertex2.y = radius2 * Math.sin( data["spheres"][elements[j+1]].indexOf(k2) / data["spheres"][elements[j+1]].length * twopies) + (grid_size/2);
				vertex2.z = radius2 * Math.cos( data["spheres"][elements[j+1]].indexOf(k2) / data["spheres"][elements[j+1]].length * twopies) + (grid_size/2);
				
				geometry.vertices.push( vertex1 );
				geometry.vertices.push( vertex2 );
			}

		}
	}

	material = new THREE.LineBasicMaterial( { color: 0x000044, linewidth: 1 } );
	var myLines = new THREE.LineSegments( geometry, material );
	myLines.updateMatrix();
	scene.add(myLines);








	//scene.add(myLines);
	threeScenes["square_"+id] = scene;



}	

 



