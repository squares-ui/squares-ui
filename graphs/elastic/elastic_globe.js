graphs_functions_json.add_graphs_json({
	"elastic":{
		"Globe":{
			"completeForm": "elastic_completeform_globe",
			"populate":"elastic_populate_globe",
			"rawtoprocessed":"elastic_rawtoprocessed_globe",
			"graph":"elastic_graph_globe",
			"about": "Globe of Lat Lon",
			"requireThreeJS": true
		}
	}
});

if(GLB.threejs.enabled == true){
	var loc_country_globe_camera = new THREE.PerspectiveCamera(45, 1, 10, 120);
}

async function elastic_completeform_globe(id, targetDiv){

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)


	var dropdownFields = []
	subResults = _.omit(thisMappings, "fields")
	_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	var lonlatFields = []
	subResults = _.pick(thisMappings, "float")
	_.each(subResults, function(val, key){  _.each(val, function(val2){  lonlatFields.push(val2)  })}) 
	lonlatFields = _.sortBy(lonlatFields, function(element){ return element})



	const jsonform = {
		"schema": {
			"x_lat": {
				"title": "Latitude (float)",
				"type": "string",
				"enum": lonlatFields
			},
			"x_lon": {
				"title": "Longitude (float)",
				"type": "string",
				"enum": lonlatFields
			},
			"x_track": {
				"title": "Track By (all, e.g. Source IP, destination country...)",
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


}



async function elastic_populate_globe(id){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"


	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	
	var fields = []
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
	var filter = combineScriptFilter(id)
	// var query = elastic_query_builder(id, from, to, Ds, fields, limit, true, true, false, filter);

	
	var incTime = true
	var maxAccuracy = true
	var stats  = false
	var statField = ""

	// var query = elastic_query_builder(id, from, to, Ds, fields, limit, true, true, false, filter);
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		false,
		"",
		true,
		maxAccuracy,
		fields, 
		stats, 
		statField	
	)

	var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");

	
	var promises = []
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)
	
}



function elastic_rawtoprocessed_globe(id, data){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = data[0]['data']['hits']['hits']
	
	
	var incNull = false
	var scale = "log"
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_null')){
			incNull = retrieveSquareParam(id,"Cs",true).x_null
		}
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_scale')){
			scale = retrieveSquareParam(id,"Cs",true).x_scale
		}
	}
	
	
	var dataCount = {}
	

	var csTrack = retrieveSquareParam(id,"Cs",true)['x_track']
	var csLat = retrieveSquareParam(id,"Cs",true)['x_lat']
	var csLon = retrieveSquareParam(id,"Cs",true)['x_lon']
	
	// track unique found vars
	var nodes = {}
	var data2 = {}
	

	
	// loop through results aggregating sums
	var recordLacking = 0;
	_.each(data, function(obj,i){

		var lat = csLat.split('.').reduce(stringDotNotation, obj._source)
		var lon = csLon.split('.').reduce(stringDotNotation, obj._source)
		var track = csTrack.split('.').reduce(stringDotNotation, obj._source)


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
		}else{
			recordLacking++;
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
	var nodes = _.keys(nodes)



	// calculate highest lon/lat for scaling
	var highest = 0
	var scaled
	// qq(data2)
	
	_.each(data2, function(obj,key){
		var values = _.values(obj)
		var summed = _.reduce(values, function(memo, num){ return memo + num; }, 0);
		

		if(scale == "linear"){
			scaled=summed
		}else if(scale == "log"){
			scaled = Math.log(summed)+1
			// qq(summed)
			// qq(Math.log(summed))
		}else if(scale == "inverse"){
			scaled = 1/summed
		}
		
		if(scaled > highest){
			highest = scaled
		}

	})	
	// qq("scale was:"+scale+" highest: "+highest)


	var dataOut = {}
	dataOut.data = data2
	dataOut.nodes = nodes
	dataOut.highest = highest
	
	// many records lacking full lat/lon (even if they match)?
	addSquareStatus(id, "warning", recordLacking+" Records matched the query but had no Lat/Lon to render.")

	return dataOut


}


function elastic_graph_globe(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
	
	// var data = retrieveSquareParam(id, 'processeddata')['data']
	// var nodes = retrieveSquareParam(id, 'processeddata')['nodes']

	var highest = data['highest']

	var globeRadius = grid_size/3;
	// var markerRadius = 0.5;
	var markerFurther = 1.1;  //multiplier * globeRadius

	var scene = new THREE.Scene();
	scene.userData.id = id;

	var camera = masterCamera.clone();
	scene.userData.camera = camera;

	var controls = new THREE.OrbitControls( camera);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.panningMode = THREE.HorizontalPanning;
	// controls.minDistance = 50;
	// controls.maxDistance = 100;
	controls.maxPolarAngle = Math.PI / 2;
	controls.autoRotate = true;
	controls.autoRotateSpeed = 0.06;
	controls.userRotate = true;
	controls.userRotateSpeed = 0.01;
	controls.target = new THREE.Vector3(grid_size/2,grid_size/3,grid_size/2);
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
		.load( './images/globe.jpg' , function ( image ) {

			var texture = new THREE.CanvasTexture( image );
			var material = new THREE.MeshBasicMaterial( { color: 0x999999, map: texture } );
			var sphereGeometry = new THREE.SphereGeometry(globeRadius, 30, 30);

			var sphere = new THREE.Mesh(sphereGeometry, material);
			sphere.position.x=grid_size/2;
			sphere.position.y=grid_size/3;
			sphere.position.z=grid_size/2;

		
			var scene = threeScenes["square_"+id];
			scene.add(sphere);
			threeScenes["square_"+id] = scene;
		
	});	


	var phi, theta, x, z, y;


	var colorScale = d3.scaleOrdinal().range(GLB.color)

	var material = new THREE.LineBasicMaterial({
		color: 0xff0000,
		transparent: true,
		opacity: 0.3
	});

	// for each lat|lon calculate the angles and positions
	_.each(data.data, function(obj,latlon){
		
		myY = 0
		heightOffset = grid_size/4
		topOfLine = (globeRadius * 1.2)+ heightOffset 

		lat = parseFloat(latlon.split("|")[0])
		lon = parseFloat(latlon.split("|")[1])

		phi   = (90-lat)*(Math.PI/180)
		theta = (lon+180)*(Math.PI/180)
		// qq("lat: "+lat+ ", lon:"+lon)
		// qq("phi: "+phi+", theta:"+theta)

		var x = -topOfLine * Math.sin(phi)*Math.cos(theta) + grid_size/2
		var z =  topOfLine * Math.sin(phi)*Math.sin(theta) + grid_size/2
		var y =  topOfLine * Math.cos(phi) + grid_size/3

		// draw the cocktail stick
		var points = [];
		points.push( new THREE.Vector3( grid_size/2, grid_size/3, grid_size/2 ) );
		points.push( new THREE.Vector3( x,y,z ) );

		var geometry = new THREE.BufferGeometry().setFromPoints( points );
		var line = new THREE.Line( geometry, material );
		scene.add( line );

		_.each(obj, function(obj2,key2){

			myTallness = (obj2 / highest) * ((markerFurther-1)*globeRadius)
			
			// qq("obj:"+obj2+" highest:" +highest+" ratio: "+(obj2 / highest)+ " myTallness:"+myTallness)

			farOutness = globeRadius + heightOffset + (myTallness/2)
			


			x = -farOutness * Math.sin(phi)*Math.cos(theta) + grid_size/2
			z =  farOutness * Math.sin(phi)*Math.sin(theta) + grid_size/2
			y =  farOutness * Math.cos(phi) + grid_size/3


			var material = new THREE.MeshBasicMaterial( {color: colorScale(key2)  } );
			
			// I'd rather use cubes for a stacked bar chart (performance),  but need to work out rotation...
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

			var key = retrieveSquareParam(id, 'Cs', true)['x_lat']
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


	// var lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
	// var myLines = new THREE.LineSegments( geometry, lineMaterial );
	// myLines.updateMatrix();
	
	// scene.add(myLines);

	threeScenes["square_"+id] = scene;



	
}	




