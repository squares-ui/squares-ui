graphs_functions_json.add_graphs_json({
	"elastic":{
		"scatterPlot":{
			"completeForm": "elastic_completeform_scatterPlot",
			"populate": "elastic_populate_scatterPlot",
			"rawtoprocessed":"elastic_rawtoprocessed_scatterPlot",
			"param": "", 
			"graph":"elastic_graph_scatterPlot",
			"about": "Treemap for multiple dimensions.",			
			"requireThreeJS": true
		}
	}
});

async function elastic_completeform_scatterPlot(id, targetDiv){
	
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)

	// ["allFields","keywordFields","date","keyword","text","ip","half_float","geo_point","long","boolean","integer","float","[object Object]","fieldTypes"]

	// Ordinal Keys to break down segments on
	var dropdownFieldsKey = []
	var subResultsKey = _.pick(thisMappings, "keyword", "text", "ip", "boolean")
	_.each(subResultsKey, function(val, key){  _.each(val, function(val2){  dropdownFieldsKey.push(val2)  })}) 
	dropdownFieldsKey = _.sortBy(dropdownFieldsKey, function(element){ return element})
	dropdownFieldsKey.unshift("")

	
	var dropdownFields = []
	_.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})


	const jsonform = {
		"schema": {
			"x_x": {
				"title": "X Axis",
				"type": "string",
				"enum": dropdownFields
			},
			"x_y": {
				"title": "Y Axis",
				"type": "string",
				"enum": dropdownFields
			},			
			"x_z": {
				"title": "Z Azis",
				"type": "string",
				"enum": dropdownFields
			},
			"x_field": {
				"type": "string",
				"title": "Group by?", 
				"enum": dropdownFieldsKey
			},
			"x_null": {
				"title": "Include null/undefined ?",
				"type": "boolean",
			}

		},
		"form": [
			"*"
		],
		"value":{}
	}
	
	var thisCs = retrieveSquareParam(id,"Cs",false)
	if(thisCs !== undefined){

		if(thisCs['x_field'] !== null ){
			jsonform.value["x_field"] = thisCs['x_field']
			
		}
		
		if(thisCs['x_x'] !== null ){
			jsonform.value["x_x"] = thisCs['x_x']
			
		}

		if(thisCs['x_y'] !== null ){
			jsonform.value["x_y"] = thisCs['x_y']
			
		}
		if(thisCs['x_z'] !== null ){
			jsonform.value["x_z"] = thisCs['x_z']
			
		}
		if(thisCs['x_null']){
			jsonform.value['x_null'] = 1
			
		}
	}


	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_scatterPlot(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]


	var fields = []
	var thisCs = retrieveSquareParam(id,"Cs",true)
	fields.push(thisCs['x_x'])
	fields.push(thisCs['x_y'])
	fields.push(thisCs['x_z'])
	if(thisCs['x_field'] != ""){
		fields.push(thisCs['x_field'])
	}


	var limit = 1;
	var stats = false
	var statField = null
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

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

	// var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");
	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

	

}





async function elastic_rawtoprocessed_scatterPlot(id, data){

	var data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]
	var thisCs = retrieveSquareParam(id,"Cs",true)
	
	var dataOut = {}
	dataOut.range = {}	
	dataOut.range.x = []
	dataOut.range.y = []
	dataOut.range.z = []


	// calculate which fields are scalar, and which are ordinal
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)
	var allScalar = _.flatten([thisMappings['half_float'], thisMappings['float'], thisMappings['long'], thisMappings['integer']])

	var isScalar = {}
	isScalar['x'] = false
	if(_.contains(allScalar, thisCs['x_x'])){
		isScalar['x'] = true
	}
	isScalar['y'] = false
	if(_.contains(allScalar, thisCs['x_y'])){
		isScalar['y'] = true
	}
	isScalar['z'] = false
	if(_.contains(allScalar, thisCs['x_z'])){
		isScalar['z'] = true
	}




	// qq("---")
	// qq(data)

	_.each(data['field']['buckets'], function(x){
		// qq("############## loop x")
		// qq(x)
		if(isScalar['x']){
			//scalar
			dataOut['range']['x'] = [_.min(x, function(key){ return key.doc_count; })['doc_count'], _.max(x, function(key){ return key.doc_count; })['doc_count']]
		}else{
			dataOut['range']['x'].push(x['key'])
		}

		_.each(x['field']['buckets'], function(y){
			// qq("############## loop y")
			if(isScalar['y']){
				//scalar
				dataOut['range']['y'] = [_.min(y['field']['buckets'], function(key){ return key.doc_count; })['doc_count'], _.max(y['field']['buckets'], function(key){ return key.doc_count; })['doc_count']]
			}else{
				dataOut['range']['y'].push(y['key'])
			}		

			_.each(y['field']['buckets'], function(z){
				// qq("############## loop z")
				// qq(z)
				if(isScalar['z']){
					//scalar
					dataOut['range']['z'] = [_.min(z['field']['buckets'], function(key){ return key.doc_count; })['doc_count'], _.max(z['field']['buckets'], function(key){ return key.doc_count; })['doc_count']]
				}else{
					dataOut['range']['z'].push(z['key'])
				}	

				if(thisCs['x_field'] != ""){
					// qq("id:"+id+" has group by "+thisCs['x_field'])

					_.each(y['field']['buckets'], function(field){
						// qq("############## loop field:"+field['key'])
						

					})
					
				}else{
					// qq("id:"+id+" has NO group by")

				}

			})

		})

	})


	dataOut.data = data

	dataOut.range.x = _.uniq(dataOut.range.x)
	dataOut.range.y = _.uniq(dataOut.range.y)
	dataOut.range.z = _.uniq(dataOut.range.z)

	qq(isScalar)
	qq(dataOut)

	return dataOut


}



async function elastic_graph_scatterPlot(id, data){
	

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// https://bl.ocks.org/ganezasan/52fced34d2182483995f0ca3960fe228

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
	.append("xhtml:div") 
	//.append("svg")
		.attr("id", function(d){ return "square_"+d.id })
		.classed("box_binding", true)
		.classed("square_body", true)
		.classed("square_xhtml", true)
		// .classed("y_overflow", true)
		.attr("width", "1000")
	.on("mousedown", function() { d3.event.stopPropagation(); })

	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var thisCs = retrieveSquareParam(id,"Cs",true)
	

	var colorScale = d3.scaleOrdinal().range(GLB.color)


	var scene = new THREE.Scene();
	scene.userData.id = id;
	
	var grid = masterGridXZ.clone()
	scene.add(grid);
  
	
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


	///// work out scales  (ordinal or scalar)
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)

	var allScalar = _.flatten([thisMappings['half_float'], thisMappings['float'], thisMappings['long'], thisMappings['integer']])
	if(_.contains(allScalar, thisCs['x_x'])){
		qq("x_x is scalar")
		var xScale = d3.scaleLinear()
	}else{
		qq("x_x is not scalear")
		var xScale = d3.scaleLog()
	}
	xScale.domain(data.range.x)
	xScale.range([1, grid_size/2]);


	
	if(_.contains(allScalar, thisCs['x_y'])){
		qq("x_y is scalar")
		var yScale = d3.scaleLinear()
	}else{
		qq("x_y is not scalear")
		var yScale = d3.scaleLog()
	}
	yScale.domain(data.range.y)
	yScale.range([1, grid_size/2]);


	
	if(_.contains(allScalar, thisCs['x_z'])){
		qq("x_z is scalar")
		var zScale = d3.scaleLinear()
	}else{
		qq("x_z is not scalear")
		var zScale = d3.scaleLog()
	}
	zScale.domain(data.range.z)
	zScale.range([1, grid_size/2]);

	qq(data.data)
	qq(data.range)

	_.each(data.data['field']['buckets'], function(x){

		_.each(x['field']['buckets'], function(y){

			_.each(y['field']['buckets'], function(z){

				_.each(z, function(z){

					// qq(field)
					// qq(x['doc_count'])
					// qq(y['doc_count'])
					// qq(z['doc_count'])

					var markerGeometry = new THREE.CubeGeometry(50, 50, 50);
					var material = new THREE.MeshBasicMaterial( { color: colorScale("bob") } );
					var marker = new THREE.Mesh(markerGeometry, material);

					marker.position.x = xScale(x['doc_count'])
					marker.position.y = yScale(y['doc_count'])
					marker.position.z = zScale(z)

					marker.squaresName = thisCs['x_x']+":"+x['key']+", "+thisCs['x_y']+":"+y['key']+", "+thisCs['x_z']+":"+z['key']+", count:"

					qq("---")
					qq(x['doc_count'])
					qq(y['doc_count'])
					qq(z['doc_count'])
					qq(z)
					
					scene.add(marker);
				})

			})

		})



	})




	
	threeScenes["square_"+id] = scene;



}
