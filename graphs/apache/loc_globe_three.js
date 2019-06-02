graphs_functions_json.add_graphs_json({
	"apache":{
		"Location Country":{
			"populate":"populate_apache_loc_country_globe",
			"rawtoprocessed":"process_apache_loc_country_globe",
			"param": "", 
			"graph":"graph_apache_loc_country_globe",
			"about": "Location of IP addresses"
		}
	}
});

var loc_country_globe_camera = new THREE.PerspectiveCamera(45, 1, 10, 120);




function populate_apache_loc_country_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 
	
	var Ds = btoa(calcDs(id, []));
	var fields = btoa("srcip");
	apache_connector(id, from, to, Ds, fields);
	
}



function process_apache_loc_country_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	// successful output is 1 row (CSV headers) and 1 empty row....  so <2 rows means no data
	var testData = data.split("\n");
	if(testData.length <2){
		graphNoData(id);
		return;
	}else{
		ww(7, "Data found for #"+id+", displaying");
	}

	data2 = data.split("\n");

	// lose the CSV header
	data2.shift();

	// unique the array
	data3 = Array.from(new Set(data2));

	if(Lockr.get("glb_freegeoip", null) == null){
		Lockr.set("glb_freegeoip", {"1.1.1.1": [5,6]});
	}

	data4 = Array();

	data3.forEach(function(row){

		if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(row+"1")){
			data4.push(row+"1");
			var resolvedIPs = Lockr.get("glb_freegeoip");
			if(resolvedIPs[row+"1"] != undefined){
				ww(4, "GeoIP Lookup not required :"+row);
			}else{
				ww(4, "GeoIP lookup required :"+row);
				$.ajax({
					url: "https://freegeoip.net/json/"+row+"1",
					type: "GET",
					dataType: "text",
					
					success: function (response) {
						response2 = JSON.parse(response);

						var resolvedIPs = Lockr.get("glb_freegeoip");
						resolvedIPs[response2.ip] = [response2.latitude, response2.longitude, response2.country_code+","+response2.city];
						Lockr.set("glb_freegeoip", resolvedIPs);
						graph_apache_loc_country_globe(id);
					}
				});
			}
		}else{
			qq(1,"GeoIP abort, invalid IPv4 found "+row);
		}

	})


	saveProcessedData(id, '', data4);
}


function graph_apache_loc_country_globe(id){
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
			.classed("square_threeJS", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	var data = retrieveSquareParam(id, 'processeddata');
	
	var globeRadius = 30;
	var markerRadius = 0.5;
	var markerFurther = 1.2;

	var scene = new THREE.Scene();
	scene.userData.id = id;

	var camera = masterCamera.clone();
	camera.position.x = 60;
	camera.position.y = 60;
	camera.position.z = 60;
	scene.userData.camera = camera;

	var controls = new THREE.OrbitControls( camera);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.panningMode = THREE.HorizontalPanning;
	controls.minDistance = 50;
	controls.maxDistance = 100;
	controls.maxPolarAngle = Math.PI / 2;
	controls.autoRotate = true;
	controls.autoRotateSpeed = 0.06;
	controls.userRotate = true;
	controls.userRotateSpeed = 0.01;
	scene.userData.controls = controls;

	var myLight = masterAmbientLight.clone();
	scene.add(myLight);

	var raycaster = new THREE.Raycaster();
	scene.userData.raycaster = raycaster;


	var element = document.getElementById("square_"+id);
	scene.userData.elementt = element;


	// add the planet/globe.  async is the best way?
	new THREE.ImageLoader()
		.setCrossOrigin( '*' )
		.load( './icons/earthmap1k.jpg' , function ( image ) {

			var texture = new THREE.CanvasTexture( image );
			var material = new THREE.MeshBasicMaterial( { color: 0x999999, map: texture } );
			var sphereGeometry = new THREE.SphereGeometry(globeRadius, 30, 30);

			var sphere = new THREE.Mesh(sphereGeometry, material);
			sphere.position.x=0;
			sphere.position.y=0;
			sphere.position.z=0;

			//sphere.sakeName = "Earth";

			var scene = threeScenes["square_"+id];
			scene.add(sphere);
			threeScenes["square_"+id] = scene;
		//	render_Three();	
	});	

	// add markers
	//var material = new THREE.MeshLambertMaterial({ color : "0x"+Math.floor(Math.random()*16777215).toString(16)} );
	var material = new THREE.MeshLambertMaterial({ color: "white"  });
	var marker= new THREE.SphereGeometry(markerRadius, 9, 9);
	var mergedGeometry = new THREE.Geometry();

	var phi, theta, x, z, y;
	var geometry = new THREE.Geometry();

	ip_lookup = Lockr.get("glb_freegeoip");
	for (var i=0; i < data.length; i++ ) {
		if(data[i] != ""){
			lat    = ip_lookup[data[i]][0];
			lon    = ip_lookup[data[i]][1];
			
			ipParts = data[i].split("\.");
			let clickIP = ipParts[0]+"."+ipParts[1]+"."+ipParts[2]+".";
			let handle = ip_lookup[data[i]][2]+"("+clickIP+")";  //let important here, as var used in callbacks

			phi   = (90-lat)*(Math.PI/180),
			theta = (lon+180)*(Math.PI/180),
			x = -((globeRadius * markerFurther) * Math.sin(phi)*Math.cos(theta)),
			z =  ((globeRadius * markerFurther) * Math.sin(phi)*Math.sin(theta)),
			y =  ((globeRadius * markerFurther) * Math.cos(phi));
		
			var sphere = new THREE.Mesh(marker, material);
			sphere.position.x = x;
			sphere.position.y = y;
			sphere.position.z = z;
			sphere.sakeName = handle; 	
			
			let clickObject = btoa('{"srcip":"'+clickIP+'"}');
			sphere.sakeAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject} , {} ) };
			
			scene.add(sphere);
		
			var vertex1 = new THREE.Vector3();
			vertex1.x = 0;
			vertex1.y = 0;
			vertex1.z = 0;
			
			var vertex2 = new THREE.Vector3();
			vertex2.x = x;
			vertex2.y = y;
			vertex2.z = z;
			
			geometry.vertices.push( vertex1 );
			geometry.vertices.push( vertex2 );
		}
	}
	var lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
	var myLines = new THREE.LineSegments( geometry, lineMaterial );
	myLines.updateMatrix();
	
	scene.add(myLines);
	//var markers = new THREE.Mesh(mergedGeometry, material);
	

	//markers.sakeName = "marker";
	//scene.add(markers);

	threeScenes["square_"+id] = scene;



	
}	



