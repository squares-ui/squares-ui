graphs_functions_json.add_graphs_json({
	"SecurityAnalytics":{
		"Socket Tube":{
			"populate":"populate_SA_socket_tube",
			"rawtoprocessed":"process_SA_socket_tube",
			"param": "", 
			"graph":"graph_SA_socket_tube",
			"about": "Y = Bytes.  X = bytes/packet.  Z = Sessions.  Green = RFC1928."
		}
	}
});





function populate_SA_socket_tube(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var Ds = calcDs(id, []);
	var filters = Array();
	for(var i in Ds){
//		filter+="filter[]="+btoa(  Ds[i]   );
		filters.push(btoa(  Ds[i]   ));
	}

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws")) , "X").format();
	
	var Ds = btoa(calcDs(id, []));
	var fields = ["initiator_port", "initiator_ip", "initiator_mac", "vlan_id", "responder_mac", "responder_ip", "responder_port"];

	var limit = 1000;

	getAttributeTsv_Generic(id, fields, from, to, filters, limit, true, '');

	
}



function process_SA_socket_tube(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	data2 = data;		
	
	data3 = Object();
	data3.initPortObj = Object();
	data3.initIpObj = Object();
	data3.initMacObj = Object();
	data3.vlanObj = Object();
	data3.respMacObj = Object();
	data3.respIpObj = Object();
	data3.respPortObj = Object();


	var lineGroups = ["portToIp", "ipToMac", "macToVlan", "vlanToMac", "macToIp", "ipToPort"];

	data3.lines = Object();
	data3.lines.portToIp = Object();
	data3.lines.ipToMac = Object();
	data3.lines.macToVlan = Object();
	data3.lines.vlanToMac = Object();
	data3.lines.macToIp = Object();
	data3.lines.ipToPort = Object();


	for (var i = 1; i < data2.length ; i++){	

		// take out unique values for creating spheres
		if(data2[i].split("\t")[0] != "" && data2[i].split("\t")[0] != null){
			var [slot_id, element_id, init_port, init_ip, init_mac, vlan, resp_mac, resp_ip, resp_port] = data2[i].split("\t");

			data3.initPortObj[init_port] = 0;
			data3.initIpObj[init_ip] = 0;
			data3.initMacObj[init_mac] = 0;
			data3.vlanObj[vlan] = 0;
			data3.respMacObj[resp_mac] = 0;
			data3.respIpObj[resp_ip] = 0;
			data3.respPortObj[resp_port] = 0;

			// create data for links between init_port -> init_mac, init_mac -> init

			if(vlan==""){
				ww(2, "Vlan corrected from "+vlan+" to '0'");
				vlan="na";
			}
	
			if(typeof data3.lines.portToIp[init_port] !== 'undefined' && typeof data3.lines.portToIp[init_port][init_ip] !== 'undefined' ){
				data3.lines.portToIp[init_port][init_ip]++;
			}else if( typeof data3.lines.portToIp[init_port] !== 'undefined' && typeof data3.lines.portToIp[init_port][init_ip] === 'undefined'  ){
				data3.lines.portToIp[init_port][init_ip] = 1;
			}else if( typeof data3.lines.portToIp[init_port] === 'undefined'   ){
				data3.lines.portToIp[init_port] = Object ();
				data3.lines.portToIp[init_port][init_ip] = 1;
			}
			if(typeof data3.lines.ipToMac[init_ip] !== 'undefined' && typeof data3.lines.ipToMac[init_ip][init_mac] !== 'undefined' ){
				data3.lines.ipToMac[init_ip][init_mac]++;
			}else if( typeof data3.lines.ipToMac[init_ip] !== 'undefined' && typeof data3.lines.ipToMac[init_ip][init_mac] === 'undefined'  ){
				data3.lines.ipToMac[init_ip][init_mac] = 1;
			}else if( typeof data3.lines.ipToMac[init_ip] === 'undefined'   ){
				data3.lines.ipToMac[init_ip] = Object ();
				data3.lines.ipToMac[init_ip][init_mac] = 1;
			}
			if(typeof data3.lines.macToVlan[init_mac] !== 'undefined' && typeof data3.lines.macToVlan[init_mac][vlan] !== 'undefined' ){
				data3.lines.macToVlan[init_mac][vlan]++;
			}else if( typeof data3.lines.macToVlan[init_mac] !== 'undefined' && typeof data3.lines.macToVlan[init_mac][vlan] === 'undefined'  ){
				data3.lines.macToVlan[init_mac][vlan] = 1;
			}else if( typeof data3.lines.macToVlan[init_mac] === 'undefined'   ){
				data3.lines.macToVlan[init_mac] = Object ();
				data3.lines.macToVlan[init_mac][vlan] = 1;
			}
			if(typeof data3.lines.vlanToMac[vlan] !== 'undefined' && typeof data3.lines.vlanToMac[vlan][resp_mac] !== 'undefined' ){
				data3.lines.vlanToMac[vlan][resp_mac]++;
			}else if( typeof data3.lines.vlanToMac[vlan] !== 'undefined' && typeof data3.lines.vlanToMac[vlan][resp_mac] === 'undefined'  ){
				data3.lines.vlanToMac[vlan][resp_mac] = 1;
			}else if( typeof data3.lines.vlanToMac[vlan] === 'undefined'   ){
				data3.lines.vlanToMac[vlan] = Object ();
				data3.lines.vlanToMac[vlan][resp_mac] = 1;
			}
			if(typeof data3.lines.macToIp[resp_mac] !== 'undefined' && typeof data3.lines.macToIp[resp_mac][resp_ip] !== 'undefined' ){
				data3.lines.macToIp[resp_mac][resp_ip]++;
			}else if( typeof data3.lines.macToIp[resp_mac] !== 'undefined' && typeof data3.lines.macToIp[resp_mac][resp_ip] === 'undefined'  ){
				data3.lines.macToIp[resp_mac][resp_ip] = 1;
			}else if( typeof data3.lines.macToIp[resp_mac] === 'undefined'   ){
				data3.lines.macToIp[resp_mac] = Object ();
				data3.lines.macToIp[resp_mac][resp_ip] = 1;
			}
			if(typeof data3.lines.ipToPort[resp_ip] !== 'undefined' && typeof data3.lines.ipToPort[resp_ip][resp_port] !== 'undefined' ){
				data3.lines.ipToPort[resp_ip][resp_port]++;
			}else if( typeof data3.lines.ipToPort[resp_ip] !== 'undefined' && typeof data3.lines.ipToPort[resp_ip][resp_port] === 'undefined'  ){
				data3.lines.ipToPort[resp_mac][resp_ip] = 1;
			}else if( typeof data3.lines.ipToPort[resp_ip] === 'undefined'   ){
				data3.lines.ipToPort[resp_ip] = Object ();
				data3.lines.ipToPort[resp_ip][resp_port] = 1;
			}else{
			}



		}



	}


	data4 = Object();

	data4.spheres = Object();
	//data4.spheres.initPort = Object.keys(data3.initPortObj);	
	//data4.spheres.initIp = Object.keys(data3.initIpObj);	
	//data4.spheres.initMac = Object.keys(data3.initMacObj);	
	//data4.spheres.vlan = Object.keys(data3.vlanObj);	
	//data4.spheres.respMac = Object.keys(data3.respMacObj);	
	//data4.spheres.respIp = Object.keys(data3.respIpObj);	
	//data4.spheres.respPort = Object.keys(data3.respPortObj);	
	data4.spheres.port_initiator = Object.keys(data3.initPortObj);	
	data4.spheres.ipv4_initiator = Object.keys(data3.initIpObj);	
	data4.spheres.ethernet_initiator = Object.keys(data3.initMacObj);	
	data4.spheres.vlan_id = Object.keys(data3.vlanObj);	
	data4.spheres.ethernet_responder = Object.keys(data3.respMacObj);	
	data4.spheres.ipv4_responder = Object.keys(data3.respIpObj);	
	data4.spheres.port_responder = Object.keys(data3.respPortObj);	

	data4.lines = data3.lines;

	saveProcessedData(id, '', data4);
}


function graph_SA_socket_tube(id){
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

	//closeParts = ["initPort", "initIp", "initMac", "vlan", "respMac", "respIp", "respPort"];
	closeParts = ["port_initiator", "ipv4_initiator", "ethernet_initiator", "vlan_id", "ethernet_responder", "ipv4_responder", "port_responder"];

	var twopies = 2 * Math.PI;

	// add all the markers to the scene
	for (var j = 0; j < closeParts.length; j++){
		// radius, stick closer to middle, if less items
ww(6, j+", "+closeParts[j]+", "+data["spheres"][closeParts[j]]);
		radius = Math.log(data["spheres"][closeParts[j]].length) / Math.log(2000) * grid_size;

		for (var i = 0; i < data["spheres"][closeParts[j]].length ; i++){

			x = (j / closeParts.length) * grid_size;
			// opposite = radius * sin degrees
			y = radius * Math.sin( i / data["spheres"][closeParts[j]].length * twopies) + (grid_size/2); 
			// adjacent = radius * cos degrees
			z = radius * Math.cos( i / data["spheres"][closeParts[j]].length * twopies) + (grid_size/2); 
			
			var thisMarker = markerBl.clone();		
			if(closeParts[j] == "initIp" || closeParts[j] == "respIp"){
				if(rfc1918.test(data["spheres"][closeParts[j]][i]) ){
					thisMarker = markerGr.clone();		
					x = x + 5;
				}else{
					thisMarker = markerOr.clone();		
				}

			}else if(closeParts[j] == "initPort"){
				if(data["spheres"][closeParts[j]][i] < 1025){
					thisMarker = markerOr.clone();		
				}
			}

			thisMarker.position.x = x;
			thisMarker.position.y = y;
			thisMarker.position.z = z;

			thisMarker.sakeName = closeParts[j]+": "+data["spheres"][closeParts[j]][i];

			let clickObject = btoa(closeParts[j]+'="'+data["spheres"][closeParts[j]][i]+'"');
			thisMarker.sakeAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject} , {} ) };
			scene.add(thisMarker);
		}

	}

	var geometry = new THREE.Geometry();
	var lineGroups = ["portToIp", "ipToMac", "macToVlan", "vlanToMac", "macToIp", "ipToPort"];


	
	for (var j = 0; j < lineGroups.length; j++){
		var radius1 = Math.log(data["spheres"][closeParts[j]].length) / Math.log(2000) * grid_size;
		var radius2 = Math.log(data["spheres"][closeParts[j+1]].length) / Math.log(2000) * grid_size;

		for (var k1 in data.lines[lineGroups[j]]) {
			if (!data.lines[lineGroups[j]].hasOwnProperty(k1)) continue;

			for (var k2 in data.lines[lineGroups[j]][k1]){
				if (! data.lines[lineGroups[j]][k1].hasOwnProperty(k2)) continue;
				
				//qq(k1+" "+k2+" = "+data.lines.portToIp[k1][k2]);
				//qq(j+" "+k1+" > "+k2);

				var vertex1 = new THREE.Vector3();
				vertex1.x = (j / closeParts.length) * grid_size;
				vertex1.y = radius1 * Math.sin( data["spheres"][closeParts[j]].indexOf(k1) / data["spheres"][closeParts[j]].length * twopies) + (grid_size/2);
				vertex1.z = radius1 * Math.cos( data["spheres"][closeParts[j]].indexOf(k1) / data["spheres"][closeParts[j]].length * twopies) + (grid_size/2);
				
				var vertex2 = new THREE.Vector3();
				vertex2.x = ((j+1) / closeParts.length) * grid_size;
				vertex2.y = radius2 * Math.sin( data["spheres"][closeParts[j+1]].indexOf(k2) / data["spheres"][closeParts[j+1]].length * twopies) + (grid_size/2);
				vertex2.z = radius2 * Math.cos( data["spheres"][closeParts[j+1]].indexOf(k2) / data["spheres"][closeParts[j+1]].length * twopies) + (grid_size/2);
				
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

 



