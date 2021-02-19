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
	var thisMappings = await getMappingsData(thisDst, thisIndex)

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
				"title": "Y Axis (height)",
				"type": "string",
				"enum": dropdownFields
			},			
			"x_z": {
				"title": "Z Azis",
				"type": "string",
				"enum": dropdownFields
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

	var outputFields = []
	var thisCs = retrieveSquareParam(id,"Cs",true)
	outputFields.push(thisCs['x_x'])
	outputFields.push(thisCs['x_y'])
	outputFields.push(thisCs['x_z'])

	var existFields = []
	if(!thisCs['x_null']){
		existFields.push(thisCs['x_x'])
		existFields.push(thisCs['x_y'])
		existFields.push(thisCs['x_z'])		
	}

	var limit = 10000;
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
		false,
		maxAccuracy,
		fields, 
		stats, 
		statField,
		outputFields,
		existFields
	)

	// var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");
	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

	

}





async function elastic_rawtoprocessed_scatterPlot(id, data){

	var data = data[0]['data']['hits']['hits']
	var thisCs = retrieveSquareParam(id,"Cs",true)
	
	var dataOut = {}
	dataOut.data = {}	// output data
	dataOut.scalar = {}  // if any axis is scalar
	dataOut.domain = {"x": [], "y": [], "z": []}  // domain for any axis that is scalar
	dataOut.max = 1  // highest key
	dataOut.twod = {"xy":[], "yx":[], "yz":[]}  // bar charts against each 2d axis

	// calculate which fields are scalar, and which are ordinal
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)
	var allScalar = _.flatten([thisMappings['half_float'], thisMappings['float'], thisMappings['long'], thisMappings['integer']])


	var isScalar = {}
	isScalar['x'] = false
	if(_.contains(allScalar, thisCs['x_x'])){
		dataOut.scalar['x'] = true
	}
	isScalar['y'] = false
	if(_.contains(allScalar, thisCs['x_y'])){
		dataOut.scalar['y'] = true
	}
	isScalar['z'] = false
	if(_.contains(allScalar, thisCs['x_z'])){
		dataOut.scalar['z'] = true
	}



	_.each(data, function(row){

		x = _.get(row._source, thisCs['x_x'].split("."))
		y = _.get(row._source, thisCs['x_y'].split("."))
		z = _.get(row._source, thisCs['x_z'].split("."))

		
		if(!dataOut.data.hasOwnProperty(x)){
			dataOut.data[x] = {}
		}

		if(!dataOut.data[x].hasOwnProperty(y)){
			dataOut.data[x][y] = {}
		}

		if(!dataOut.data[x][y].hasOwnProperty(z)){
			dataOut.data[x][y][z] = {"value":1}
		}else{
			dataOut.data[x][y][z]['value'] += 1

			// 
			if(dataOut.data[x][y][z]['value'] > dataOut.max){
				dataOut.max = dataOut.data[x][y][z]['value']
			}
		}
		
		dataOut.domain.x.push(x)
		dataOut.domain.y.push(y)
		dataOut.domain.z.push(z)
		

	})

	if(dataOut.scalar['x']){
		dataOut.domain.x = [_.min(dataOut.domain.x), _.max(dataOut.domain.x)]
	}else{
		dataOut.domain.x = _.uniq(dataOut.domain.x)
	}

	if(dataOut.scalar['y']){
		dataOut.domain.y = [_.min(dataOut.domain.y), _.max(dataOut.domain.y)]
	}else{
		dataOut.domain.y = _.uniq(dataOut.domain.y)
	}

	if(dataOut.scalar['z']){
		dataOut.domain.z = [_.min(dataOut.domain.z), _.max(dataOut.domain.z)]
	}else{
		dataOut.domain.z = _.uniq(dataOut.domain.z)
	}

	// qq(dataOut)
	return dataOut
	
	// {"data":{"United States":{"dns":{"53":{"value":9849}},"ntp":{"123":{"value":50}}},"United Kingdom":{"ntp":{"123":{"value":65}}},"Germany":{"ntp":{"123":{"value":7}}},"Netherlands":{"ntp":{"123":{"value":15}}},"Canada":{"ntp":{"123":{"value":10}}},"Japan":{"ntp":{"123":{"value":1}}},"Ukraine":{"ntp":{"123":{"value":2}}},"Ireland":{"ntp":{"123":{"value":1}}}},
	// "scalar":{"z":true},
	// "domain":{"x":[],"y":[],"z":[53,123]},
	// "max":9849}


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
	
	colRange = ["#ffe2aa","#ffa900"]
	var linearColour = d3.scaleLinear()
	.domain([0,data.max])
	.range(colRange)


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



	var xScaleOffset = null;
	if(data.scalar['x']){
		var xScale = d3.scaleLinear()
	}else{
		var xScale = d3.scaleBand()
	}
	xScale.domain(data.domain.x)
	xScale.range([1, grid_size]);
	if(!data.scalar['x']){
		xScaleOffset = xScale.bandwidth() / 2
	}


	var yScaleOffset = null;
	if(data.scalar['y']){
		var yScale = d3.scaleLinear()
	}else{
		var yScale = d3.scaleBand()
	}
	yScale.domain(data.domain.y)
	yScale.range([1, grid_size]);
	if(!data.scalar['y']){
		yScaleOffset = yScale.bandwidth() / 2
	}
	
	var zScaleOffset = null;
	if(data.scalar['z']){		
		var zScale = d3.scaleLinear()
	}else{
		var zScale = d3.scaleBand()
	}
	zScale.domain(data.domain.z)
	zScale.range([1, grid_size]);
	if(!data.scalar['z']){
		zScaleOffset = zScale.bandwidth() / 2
	}



	const lineMaterial = new THREE.LineBasicMaterial({
		color: 0x808080
	});

	_.each(data.data, function(xv,xk){

		_.each(xv, function(yv, yk){

			_.each(yv, function(zv, zk){

				// qq(xk+":"+yk+":"+zk+"="+zv['value'])
				
				var markerGeometry = new THREE.CubeGeometry(50, 50, 50);
				var material = new THREE.MeshBasicMaterial( { color: linearColour(zv['value']) } );
				var marker = new THREE.Mesh(markerGeometry, material);

				

				var xWithOffset = xScale(xk)
				if(!data.scalar['x']){
					xWithOffset += xScaleOffset
				}

				var yWithOffset = yScale(yk)
				if(!data.scalar['y']){
					yWithOffset += yScaleOffset
				}
				
				var zWithOffset = zScale(zk)
				if(!data.scalar['z']){
					zWithOffset += zScaleOffset
				}


				marker.position.x = xWithOffset
				marker.position.y = yWithOffset
				marker.position.z = zWithOffset




				// qq(xk+":"+marker.position.x+",   "+yk+":"+marker.position.y+",   "+zk+":"+marker.position.z+",   value:"+zv['value'])
				
				let clickObject = {"compare":[]}
				var miniObj = {}
				miniObj[thisCs['x_x']] = xk
				clickObject['compare'].push(miniObj)
				miniObj = {}
				miniObj[thisCs['x_y']] = yk
				clickObject['compare'].push(miniObj)
				miniObj = {}
				miniObj[thisCs['x_z']] = zk
				clickObject['compare'].push(miniObj)
				
				marker.squaresAction = function(){ childFromClick(id, {"y": 1000, "Ds": btoa(JSON.stringify(clickObject))} , {} ) };


				marker.squaresName = xk+", "+yk+", "+zk+":"+zv['value']

				scene.add(marker);

				var points = [];
				points.push( new THREE.Vector3( xWithOffset, yWithOffset, zWithOffset ) );
				points.push( new THREE.Vector3( xWithOffset, 0, zWithOffset ) );

				var geometry = new THREE.BufferGeometry().setFromPoints( points );

				var line = new THREE.Line( geometry, lineMaterial );
				scene.add( line );

			})

		})


	})




	
	threeScenes["square_"+id] = scene;



}
