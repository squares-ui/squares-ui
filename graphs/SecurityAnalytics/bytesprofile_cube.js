graphs_functions_json.add_graphs_json({
	"SecurityAnalytics":{
		"Bytes Profile":{
			"populate":"populate_SA_bytes_profile",
			"rawtoprocessed":"process_SA_bytes_profile",
			"param": "", 
			"graph":"graph_SA_bytes_profile",
			"about": "Y = Bytes.  X = bytes/packet.  Z = Sessions.  Green = RFC1928."
		}
	}
});





function populate_SA_bytes_profile(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var Ds = calcDs(id, []);
	var filter = "?";
	for(var i in Ds){
		filter+="&filter[]="+btoa(  Ds[i]   );
	}

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws")) , "X").format();
	
	var Ds = btoa(calcDs(id, []));
	var fields = "ipv4_responder";

	var limit = 1000;

	getAttributeApi_Generic(id, fields, from, to, filter, limit, true, 'd', '');
	
}



function process_SA_bytes_profile(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	// successful output is 1 row (CSV headers) and 1 empty row....  so <2 rows means no data
	saveProcessedData(id, '', data.data);
}


function graph_SA_bytes_profile(id){
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
	scene.add(gridXZ);

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

	var maxBytes = 0;
	var maxPackets = 0;
	var maxSessions = 0;
	var bytesperPacket = 1500;
	var rfc1918 = new RegExp("^(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\..*");
	var broadcast = new RegExp("^2(?:2[4-9]|3\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d?|0)){3}$");	

	var geometry = new THREE.CylinderGeometry( 3, 3, grid_size, 32 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
	var cylinder = new THREE.Mesh( geometry, material );
	cylinder.position.z= (grid_size/2);
	cylinder.position.x = ((512/bytesperPacket)*grid_size);
	cylinder.rotation.x = Math.PI/2;
	scene.add( cylinder );



	var materialGr = new THREE.MeshBasicMaterial( { color: "green"} );
	var materialOr = new THREE.MeshBasicMaterial( { color: "orange"} );
	var materialBl = new THREE.MeshBasicMaterial( { color: "black"} );
	
	var sphereGeometry = new THREE.SphereGeometry(2, 4, 4);
	var geometry = new THREE.Geometry();


	for (var i = 0; i < data.length; i++){
		if(data[i]["columns"][1] > maxBytes) maxBytes = data[i]["columns"][1];
		if(data[i]["columns"][2] > maxPackets) maxPackets = data[i]["columns"][2];
		if(data[i]["columns"][3] > maxSessions) maxSessions = data[i]["columns"][3];

	}

	// T shape.......
	// x 	=		avg bytes / packet
	// y 	= 		bytes
	// z	= 		log sessions?
	// spehereSize =	packets / sessions 
	// colour = 		RFC1918

	for (var i = 0; i < data.length; i++){
		//qq(data[i]);	
		myB = data[i]["columns"][1];
		myP = data[i]["columns"][2];
		myS = data[i]["columns"][3];

		var vertex1 = new THREE.Vector3();
		vertex1.x = (myB / myP) / bytesperPacket * grid_size;
		vertex1.y = 0;
		vertex1.z = (Math.log(myS) / Math.log(maxSessions)) * grid_size;
		geometry.vertices.push( vertex1 );
		
		var vertex2 = new THREE.Vector3();
		vertex2.x = (myB / myP) / bytesperPacket * grid_size;
		vertex2.y = (Math.log(myB) / Math.log(maxBytes)) * grid_size;
		vertex2.z = (Math.log(myS) / Math.log(maxSessions)) * grid_size;
		geometry.vertices.push( vertex2 );

		

		if(rfc1918.test(data[i]["columns"][0])){
			var thisMaterial = materialGr.clone()
		}else if(broadcast.test(data[i]["columns"][0])){
			var thisMaterial = materialBl.clone()
		}else{
			var thisMaterial = materialOr.clone()
		}	
		
		var sphere = new THREE.Mesh(sphereGeometry, thisMaterial);
		sphere.position.x = (myB / myP) / bytesperPacket * grid_size;
		sphere.position.y = (Math.log(myB) / Math.log(maxBytes)) * grid_size;
		sphere.position.z = (Math.log(myS) / Math.log(maxSessions)) * grid_size;
		sphere.sakeName = data[i]["columns"][0]+" {bytes:"+countBytes(myB)+", sessions:"+myS+", packets:"+myP+"} {avg bytes per packet:"+(myB / myP)+"}";

		let thisIP = data[i]["columns"][0];
		let clickObject = btoa('ipv4_responder="'+thisIP+'"');
		sphere.sakeAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject} , {} ) };


		scene.add(sphere);



	}

	material = new THREE.LineBasicMaterial( { color: 0x456569, linewidth: 200 } );
	var myLines = new THREE.LineSegments( geometry, material );
	myLines.updateMatrix();
	
	scene.add(myLines);
	threeScenes["square_"+id] = scene;


}	

 



