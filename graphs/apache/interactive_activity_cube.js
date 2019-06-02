graphs_functions_json.add_graphs_json({
	"apache":{
		"ActivityCube":{
			"populate":"populate_apache_activity_cube",
			"rawtoprocessed":"process_apache_activity_cube",
			"param": "", 
			"graph":"graph_apache_activity_cube",
			"about": "Location of IP addresses"
		}
	}
});





function populate_apache_activity_cube(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 
	
	var Ds = btoa(calcDs(id, []));
	var fields = btoa("srcip,date,time,extension,http_response,size");
	apache_connector(id, from, to, Ds, fields);
	
}



function process_apache_activity_cube(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	// successful output is 1 row (CSV headers) and 1 empty row....  so <2 rows means no data
	var testData = data.split("\n");
	if(testData.length <3){
		graphNoData(id);
		return;
	}else{
		ww(7, "Data found for #"+id+", displaying");
	}

	data2 = data.split("\n");

	// lose the CSV header
	data2.shift();

	saveProcessedData(id, '', data2);
}


function graph_apache_activity_cube(id){
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
	

	var grid_size = 200;
	var grid_cuts = 20;

	var dataLength = data.length;
	var ipFirstHalf = Array();
	var ipSecondHalf = Array();
	var allIPs = Array();
	var ipParts = Array();
	var timeParts = Array();
	var thisEpoch = 0;
	var monthString = "JanFebMarAprMayJunJulAugSepOctNovDec";
	var timeFirst = 0, timeLast = 0;
	var http_colours = ["", "yellow", "green", "black", "orange", "red"];
	var thisRow;

	for (var i = 0; i < dataLength; i++) {
		thisRow = data[i].split(",");
		if(thisRow.length>1){	
			ipParts = thisRow[0].split("\.");

			if(ipFirstHalf.indexOf(ipParts[0]+"."+ipParts[1]) === -1) {
				ipFirstHalf.push(ipParts[0]+"."+ipParts[1]);
			}
			if(ipSecondHalf.indexOf(ipParts[2]+"."+ipParts[3]) === -1) {
				ipSecondHalf.push(ipParts[2]+"."+ipParts[3]);
			}

			dateParts = thisRow[1].match(/(\d{2})\/(\S{3})\/(\d{4})/);
			timeParts = thisRow[2].match(/(\d{2}):(\d{2}):(\d{2})/);
			
			thisEpoch = Date.UTC(+dateParts[3], monthString.indexOf(dateParts[2]) / 3 , +dateParts[1], +timeParts[1], +timeParts[2]);
			
			if( thisEpoch < timeFirst || timeFirst == 0 ){
				timeFirst = thisEpoch;
			}
			if( thisEpoch > timeLast || timeLast == 0){
				timeLast = thisEpoch;
			}

			if(allIPs.indexOf(thisRow[0]) === -1){
				allIPs.push(thisRow[0]);
			}
	
		}
	}
	ipFirstHalf.sort();
	ipSecondHalf.sort();
	
	var scene = new THREE.Scene();
	scene.userData.id = id;
	scene.userData.doMousePos = true;

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

	var gridYZ = new THREE.GridHelper(grid_size, grid_cuts);
	gridYZ.position.set( 0, (grid_size*0.5), (grid_size*0.5) );
	gridYZ.rotation.z = Math.PI/2;
	scene.add(gridYZ);

	var raycaster = new THREE.Raycaster();
	scene.userData.raycaster = raycaster;

	var material = new THREE.MeshBasicMaterial( { color: "black"} );
	var sphereGeometry = new THREE.SphereGeometry(2, 4, 4);
	var geometry = new THREE.Geometry();

	for (var i = 0; i < allIPs.length; i++){
		ipParts = allIPs[i].split("\.");
		
		var vertex1 = new THREE.Vector3();
		vertex1.x = 0;
		vertex1.y = Math.floor((ipFirstHalf.indexOf(ipParts[0]+"."+ipParts[1]) / ipFirstHalf.length) * grid_size);
		vertex1.z = Math.floor((ipSecondHalf.indexOf(ipParts[2]+"."+ipParts[3]) / ipSecondHalf.length) * grid_size);
		
		var vertex2 = new THREE.Vector3();
		vertex2.x = grid_size;
		vertex2.y = Math.floor((ipFirstHalf.indexOf(ipParts[0]+"."+ipParts[1]) / ipFirstHalf.length) * grid_size);
		vertex2.z = Math.floor((ipSecondHalf.indexOf(ipParts[2]+"."+ipParts[3]) / ipSecondHalf.length) * grid_size);
		
		geometry.vertices.push( vertex1 );
		geometry.vertices.push( vertex2 );

		var sphere = new THREE.Mesh(sphereGeometry, material);
		sphere.position.x = grid_size*1.01;
		sphere.position.y = Math.floor((ipFirstHalf.indexOf(ipParts[0]+"."+ipParts[1]) / ipFirstHalf.length) * grid_size);
		sphere.position.z = Math.floor((ipSecondHalf.indexOf(ipParts[2]+"."+ipParts[3]) / ipSecondHalf.length) * grid_size);

		sphere.name="bob";
		scene.add(sphere);

	}
	material = new THREE.LineBasicMaterial( { color: 0x000044, linewidth: 1 } );
	var myLines = new THREE.LineSegments( geometry, material );
	myLines.updateMatrix();
	
	scene.add(myLines);
	threeScenes["square_"+id] = scene;


	var scene = threeScenes["square_"+id];
	for(var j = 0; j < 6 ; j++){
		var geometry = new THREE.Geometry();


		switch (j){
			case 0:
			case 1:
			case 2:
				ww(7, "Activity Cuve loading green");
				var sprite = new THREE.TextureLoader().load( "/sake/www/point_images/green_circle.png");
				material = new THREE.PointsMaterial( { size: 4 , map:sprite, alphaTest: 0.5, transparent: true});
				break;
			case 3:
			case 4:
				ww(7, "Activity Cuve loading orange");
				var sprite = new THREE.TextureLoader().load( "/sake/www/point_images/orange_circle.png");
				material = new THREE.PointsMaterial( { size: 5 , map:sprite, alphaTest: 0.5, transparent: true});
				break;
			case 5:
				ww(7, "Activity Cuve loading red");
				var sprite = new THREE.TextureLoader().load( "/sake/www/point_images/red_circle.png");
				material = new THREE.PointsMaterial( { size: 8 , map:sprite, alphaTest: 0.5, transparent: true});
				break;
		}



		for (var i = 0; i < dataLength; i++) {

			thisRow = data[i].split(",");
			dateParts = thisRow[1].match(/(\d{2})\/(\S{3})\/(\d{4})/);
			timeParts = thisRow[2].match(/(\d{2}):(\d{2}):(\d{2})/);
			
			thisEpoch = Date.UTC(+dateParts[3], monthString.indexOf(dateParts[2]) / 3 , +dateParts[1], +timeParts[1], +timeParts[2]);
			x = Math.floor((thisEpoch - timeFirst) / (timeLast - timeFirst) * grid_size);
			ipParts = thisRow[0].split("\.");
			y = Math.floor((ipFirstHalf.indexOf(ipParts[0]+"."+ipParts[1]) / ipFirstHalf.length) * grid_size);
			z = Math.floor((ipSecondHalf.indexOf(ipParts[2]+"."+ipParts[3]) / ipSecondHalf.length) * grid_size);

			if(thisRow[4].toString().charAt(0) == j.toString()){
				var vertex = new THREE.Vector3();
				vertex.x = x;
				vertex.y = y;
				vertex.z = z;
				geometry.vertices.push( vertex );
			}

		}
		particles = new THREE.Points( geometry, material );
		scene.add(particles);
	}
	threeScenes["square_"+id] = scene;



}	

 



