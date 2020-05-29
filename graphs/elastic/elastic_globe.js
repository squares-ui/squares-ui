graphs_functions_json.add_graphs_json({
	"elastic":{
		"Globe":{
			"completeForm": "elastic_completeform_globe",
			
			"populate":"elastic_populate_globe",
			"rawtoprocessed":"elastic_rawtoprocessed_globe",
			"graph":"elastic_graph_globe",
			"about": "Globe of Lat Lon"
		}
	}
});

var loc_country_globe_camera = new THREE.PerspectiveCamera(45, 1, 10, 120);


function elastic_completeform_globe(id, targetDiv){

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
			
			var dropdownFields = []

			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			subResults = _.omit(results, "")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
			dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

			const jsonform = {
				"schema": {
					"x_lat": {
						"title": "Latitude",
						"type": "string",
						"enum": dropdownFields
					},
					"x_lon": {
						"title": "Longitude",
						"type": "string",
						"enum": dropdownFields
					},
					"x_track": {
						"title": "Track By (e.g. Source IP, destination country...)",
						"type": "string",
						"enum": dropdownFields
					},
					"x_null": {
						"title": "Include null/undefined ?",
						"type": "boolean",
					},
					"x_scale": {
						"title": "Scale",
						"type": "string",
						"enum": [
						  "linear", "log", "inverse"
						]
					}

				},

				"form": ["*"],
				
                "value":{}
			}
			
			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['x_track'] !== undefined){
					jsonform.value.x_track = retrieveSquareParam(id,"Cs",false)['x_track']
				}
				
				if(retrieveSquareParam(id,"Cs",false)['x_lat'] !== undefined){
					jsonform.value.x_lat = retrieveSquareParam(id,"Cs",false)['x_lat']
				}
				
				if(retrieveSquareParam(id,"Cs",false)['x_lon'] !== undefined){
					jsonform.value.x_lon = retrieveSquareParam(id,"Cs",false)['x_lon']
				}
				
			}else{
				
			}

			$(targetDiv).jsonForm(jsonform)

		}).catch(e => {
			alert(e)
			// setPageStatus(id, 'Critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');

		})
}



function elastic_populate_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)
	
	fields = []
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_track'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_track'])
		}
		if(retrieveSquareParam(id,"Cs",false)['x_lat'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_lat'])
		}
		if(retrieveSquareParam(id,"Cs",false)['x_lon'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_lon'])
		}
	}
	var limit = 10000;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
	
}



function elastic_rawtoprocessed_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	
	
	incNull = false
	scale = "log"
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_null')){
			incNull = retrieveSquareParam(id,"Cs",true).x_null
		}
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_scale')){
			scale = retrieveSquareParam(id,"Cs",true).x_scale
		}
	}
	
	
	var dataCount = {}

	csTrack = retrieveSquareParam(id,"Cs",true)['x_track']
	csLat = retrieveSquareParam(id,"Cs",true)['x_lat']
	csLon = retrieveSquareParam(id,"Cs",true)['x_lon']
	
	// track unique found vars
	nodes = {}
	data2 = {}
	

	// loop through results aggregating sums
	_.each(data, function(obj,i){

		lat = csLat.split('.').reduce(stringDotNotation, obj._source)
		lon = csLon.split('.').reduce(stringDotNotation, obj._source)
		track = csTrack.split('.').reduce(stringDotNotation, obj._source)


		// bad record?
		if( track != "null" && lat != "null" && lon != "null" ){

			// To Lower amount locations we can toFixed, but this will break clicking on it.
			// consider adding "like" not "match" on this field?
			//latlonName = lat.toFixed(4) + "|" + lon.toFixed(4)
			latlonName = lat + "|" + lon

			// Does the lat lon exist?
			if(!data2.hasOwnProperty(latlonName)){
				data2[latlonName] = {}
			}

			// does the field type exist againt the lat lon?
			if(!data2[latlonName].hasOwnProperty(track)){
				data2[latlonName][track] = 1
				nodes[track] = null
			}else{
				
				data2[latlonName][track] = data2[latlonName][track] + 1
			}
		}
	})
	//{"37.4192|-122.0574":{"tcp":6,"udp":13},
	// qq(data2)




	//apply scaling lin/log/inv
	_.each(data2, function(obj,key){
		_.each(obj, function(obj2, key2){
			if(scale == "linear"){
				//do nothing
			}else if(scale == "log"){
				// log(1) = 0, add 1 for graphical representation
				data2[key][key2] = Math.log(obj2)+1
			}else if(scale == "inverse"){
				data2[key][key2] = 1/obj2
			}
		})
	})
	
	


	// set nodes
	nodes = _.keys(nodes)



	// calculate highest lon/lat for scaling
	highest = 0
	qq(data2)
	
	_.each(data2, function(obj,key){
		values = _.values(obj)
		summed = _.reduce(values, function(memo, num){ return memo + num; }, 0);
		

		if(scale == "linear"){
			scaled=summed
		}else if(scale == "log"){
			scaled = Math.log(summed)+1
			qq(summed)
			qq(Math.log(summed))
		}else if(scale == "inverse"){
			scaled = 1/summed
		}
		
		if(scaled > highest){
			highest = scaled
		}

	})	
	// qq("scale was:"+scale+" highest: "+highest)


	dataOut = {}
	dataOut.data = data2
	dataOut.nodes = nodes
	dataOut.highest = highest
	saveProcessedData(id, '', dataOut);
}


function elastic_graph_globe(id){


	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata')['data']
	// var nodes = retrieveSquareParam(id, 'processeddata')['nodes']
	var highest = retrieveSquareParam(id, 'processeddata')['highest']

	var globeRadius = 30;
	// var markerRadius = 0.5;
	var markerFurther = 1.1;  //multiplier * globeRadius

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
		.load( './globe.jpg' , function ( image ) {

			var texture = new THREE.CanvasTexture( image );
			var material = new THREE.MeshBasicMaterial( { color: 0x999999, map: texture } );
			var sphereGeometry = new THREE.SphereGeometry(globeRadius, 30, 30);

			var sphere = new THREE.Mesh(sphereGeometry, material);
			sphere.position.x=0;
			sphere.position.y=0;
			sphere.position.z=0;

		
			var scene = threeScenes["square_"+id];
			scene.add(sphere);
			threeScenes["square_"+id] = scene;
		
	});	


	var phi, theta, x, z, y;
	var geometry = new THREE.Geometry();



	// for each lat|lon calculate the angles and positions
	_.each(data, function(obj,latlon){
		
		myY = 0
		heightOffset = 0

		
		lat = parseFloat(latlon.split("|")[0])
		lon = parseFloat(latlon.split("|")[1])

		phi   = (90-lat)*(Math.PI/180)
		theta = (lon+180)*(Math.PI/180)
		
		qq("lat: "+lat+ ", lon:"+lon)
		qq("phi: "+phi+", theta:"+theta)

		_.each(obj, function(obj2,key2){

			myTallness = (obj2 / highest) * ((markerFurther-1)*globeRadius)
			
			// qq("obj:"+obj2+" highest:" +highest+" ratio: "+(obj2 / highest)+ " myTallness:"+myTallness)

			farOutness = globeRadius + heightOffset + (myTallness/2)
			


			x = -farOutness * Math.sin(phi)*Math.cos(theta)
			z =  farOutness * Math.sin(phi)*Math.sin(theta)
			y =  farOutness * Math.cos(phi)

			mySize = 0.3

			var material = new THREE.MeshBasicMaterial( {color: GLB.color(key2)  } );
			
			// I'd rather use cubes for a stacked bar chart,  but need to work out rotation...
			// var geometry = new THREE.BoxGeometry( mySize, myTallness, mySize );
			// var cube = new THREE.Mesh(geometry, material);

			var sphereGeometry = new THREE.SphereGeometry(myTallness/3, 9, 9);
			var sphere = new THREE.Mesh(sphereGeometry, material);
			
			sphere.position.x=x;
			sphere.position.y=y;
			sphere.position.z=z;

			sphere.squaresName = key2


			let clickObject = {"compare":[]}
			miniObj = {}

			key = retrieveSquareParam(id, 'Cs', true)['x_lat']
			miniobj = {}
			miniobj[key] = lat
			clickObject.compare.push(miniobj)
			
			key = retrieveSquareParam(id, 'Cs', true)['x_lon']
			miniobj = {}
			miniobj[key] = lon
			clickObject.compare.push(miniobj)

			key = retrieveSquareParam(id, 'Cs', true)['x_track']
			miniobj = {}
			miniobj[key] = key2
			clickObject.compare.push(miniobj)		

			sphere.squaresAction = function(){ childFromClick(id, {"y": 1000, "Ds": btoa(JSON.stringify(clickObject))} , {} ) };

			scene.add(sphere);

			heightOffset += myTallness

		})


	})


	var lineMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 1 } );
	var myLines = new THREE.LineSegments( geometry, lineMaterial );
	myLines.updateMatrix();
	
	scene.add(myLines);

	threeScenes["square_"+id] = scene;



	
}	




