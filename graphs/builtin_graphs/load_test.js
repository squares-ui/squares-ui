graphs_functions_json.add_graphs_json({
	"apache":{
		"Load Test":{
			"populate":"populate_apache_load_test",
			"rawtoprocessed":"process_apache_load_test",
			"param": "", 
			"graph":"graph_apache_load_test",
			"about": "Location of IP addresses"
		}
	}
});





function populate_apache_load_test(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	process_apache_load_test(id);
	
}



function process_apache_load_test(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	saveProcessedData(id, '', []);
}


function graph_apache_load_test(id){
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

	var grid_size = 200;
	var grid_cuts = 20;

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

	var material = new THREE.MeshBasicMaterial( { color: "white"} );
	var sphereGeometry = new THREE.SphereGeometry(2, 4, 4);
	var geometry = new THREE.Geometry();



	var particleCount = 100000;

	var data = Array ();
	for (var i = 0; i < particleCount; i++) {
		var point = Object ();
		point.x = Math.floor(Math.random() * grid_size)+1;
		point.y = Math.floor(Math.random() * grid_size)+1;
		point.z = Math.floor(Math.random() * grid_size)+1;
		point.code = 99 + Math.floor(Math.random() * 499);
		data.push(point);
	}

	var sprite = new THREE.TextureLoader().load( "/sake/www/point_images/orange_circle.png");
	material = new THREE.PointsMaterial( { size: 5 , map:sprite, alphaTest: 0.5, transparent: true});
	for (var i = 0; i < data.length; i++) {

		var vertex = new THREE.Vector3();
		vertex.x = data[i]["x"];			
		vertex.y = data[i]["y"];			
		vertex.z = data[i]["z"];			

		geometry.vertices.push( vertex );
	}

	particles = new THREE.Points( geometry, material );
	scene.add( particles );
	threeScenes["square_"+id] = scene;


}	

 



