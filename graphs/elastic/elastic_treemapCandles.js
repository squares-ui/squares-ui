graphs_functions_json.add_graphs_json({
	"elastic":{
		"TreemapCandles":{
			"completeForm": "elastic_completeform_treemapCandle",
			"populate": "elastic_populate_treemapCandle",
			"rawtoprocessed":"elastic_rawtoprocessed_treemapCandle",
			"param": "", 
			"graph":"elastic_graph_treemapCandle",
			"about": "Treemap for multiple dimensions.",			
			"requireThreeJS": true
		}
	}
});

async function elastic_completeform_treemapCandle(id, targetDiv){
	
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)

	var dropdownFields = []
	var dropdownNumbers = []
		
	// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
	var subResults = _.omit(thisMappings, "")
	_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	var dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	var numberDropDown = _.pick(thisMappings, "long", "int", "integer")
	_.each(numberDropDown, function(val, key){  _.each(val, function(val2){  dropdownNumbers.push(val2)  })}) 
	var dropdownFieldsNumber = _.sortBy(dropdownNumbers, function(element){ return element})

	const jsonform = {
		"schema": {
			"x_arr": {
				"type":"array",
				"maxItems": 4,
				"minItems": 1,
				"items":{
					"type": "object",
					"properties":{
						"field":{
							"type": "string",
							"title": "Field",
							"enum": dropdownFields					
						}
					}	
				}
			},
			"x_candle": {
				"type": "string",
				"title": "Candlesticks Value", 
				"enum": dropdownFieldsNumber

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
		"form": [
			{
				"type": "array",
				"notitle": true,
				"items": [{
					"key": "x_arr[]",
					
				}]
			},
			{
				"key":"x_candle",
			},
			{
				"key":"x_null",
				"inlinetitle": "Include null/undefined ?",
				"notitle": true,
			},
			{
					"key":"x_scale",
					"inlinetitle": "Scale",
					"notitle": true,
			}
		],
		"value":{}
	}		

	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		
		if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){
			jsonform.value = {}
			jsonform.value['x_arr'] = []
			_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
				jsonform.value['x_arr'].push({"field": key})
			})
		
		}
		
		if(retrieveSquareParam(id,"Cs",true)['x_scale'] !== null){
			jsonform.form[2]['value'] = retrieveSquareParam(id,"Cs",true)['x_scale']
		}
		if(retrieveSquareParam(id,"Cs",true)['x_candle'] !== null){
			jsonform.form[1]['value'] = retrieveSquareParam(id,"Cs",true)['x_candle']
		}

	}else{
		//create default layout
		jsonform.value['x_arr'] = []
		jsonform.value['x_arr'].push({})
		jsonform.value['x_arr'].push({})
		
		jsonform.form[1]['value'] = 1

		jsonform.form[2]['value'] = "log"


	}
	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_treemapCandle(id){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]


	var fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})	


	var limit = 1;
	var stats = true
	var statField = retrieveSquareParam(id,"Cs",true)['x_candle']
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	// var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)

	


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
	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

	

}





function elastic_rawtoprocessed_treemapCandle(id, data){

	var data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	var fields = []
	
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		
		var Cs = retrieveSquareParam(id,"Cs",true)

		if(Cs['array'] !== null ){
			fields = Cs['array']
		}
		

		incNull = false
		if(Cs.hasOwnProperty('x_null')){
			incNull = Cs.x_null
		}

		scale = "log"
		if(Cs.hasOwnProperty('x_scale')){
			scale = Cs.x_scale
		}
	}

	// saveProcessedData(id, '', elasticToFlare(data, scale))
	return elasticToFlare(data, scale)

}



function elastic_graph_treemapCandle(id, data){
	

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
	
	
	var Cs = retrieveSquareParam(id,"Cs",true)

	var colorScale = d3.scaleOrdinal().range(GLB.color)


	const treemap = d3.treemap()
		.size([grid_size, grid_size])
		.padding(10)



	const root = d3.hierarchy(data, (d) => d.children)
		.sum((d) => d.size);


	const tree = treemap(root);

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

	// var greyish = 0xcccccc;

	
	var flatCords = treeToFlat(id, tree)
	// qq("....")
	// qq(flatCords)


	var maxMax = _.max(flatCords, function(coords){ return coords.max; } )['max']
	// qq("maxMax found at :"+  maxMax)


	if(Cs['x_scale'] == "linear"){
		var yScale = d3.scaleLinear()
			.domain([0.1, maxMax*1.1])
			.range([1, grid_size/2]);
	}else if(Cs['x_scale'] == "log"){
		var yScale = d3.scaleLog()
			.clamp(true)
			.domain([0.1, maxMax*1.1])
			.range([1, grid_size/2]);
	}

	var recordsWithNull = 0

	_.each(flatCords, function(coords){

		// qq(coords)

		if(coords['std_deviation'] == null || coords['std_deviation'] == 0){

			// qq("Candle: name:"+coords['name']+", top:0 tallness:0" )
			// no data, so draw a simple box under the grid
			// create the standard deviation box 
			// x & z = position on flat 
			// y = standard deviation
			recordsWithNull = recordsWithNull + 1
			
			var markerGeometry = new THREE.CubeGeometry(coords['width'],  1, coords['height']);
			var material = new THREE.MeshBasicMaterial( { color: colorScale(coords['name']) } );
			var stdDev = new THREE.Mesh(markerGeometry, material);
			stdDev.position.x = coords['x0'] + (coords['width'] /2)
			stdDev.position.y = -2
			stdDev.position.z = coords['y0'] + (coords['height'] /2)
			// qq("adding val:"+coords['name']+", x:"+coords['x0']+", y:"+coords['y0'])
			stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") + ", avg:"+Math.floor(coords['avg'])+", max:"+coords['max']
			

			let clickObject = {"compare":[]}
			_.each(coords['chain'], function(chai){
				miniObj = {}
				miniObj[chai['key']] = chai['val']
				clickObject['compare'].push(miniObj)

			})
			stdDev.squaresAction = function(){ childFromClick(id, {"y": 1000, "Ds": btoa(JSON.stringify(clickObject))} , {} ) };
			scene.add(stdDev);

		}else{
			// data, so draw a height box with minmax ba
			// create the standard deviation box 
			// x & z = position on flat 
			// y = standard deviation
			
			var top = yScale(coords['avg'] + coords['std_deviation']+1)
			var bottom = yScale(coords['avg'] - coords['std_deviation'] + 1)
			var tallness = top-bottom
			var height = yScale(coords['avg'] +1)
			var shiftHeight = (yScale((2 * coords['std_deviation'])+1)/2)
			
			// qq("Candle: name:"+coords['name']+", top:"+top+" tallness:"+tallness )

			// qq("####################")
			// qq("name:"+_.pluck(coords['chain'], "val").join(", "))
			// qq("val:"+coords['name'])
			// qq("avg:"+coords['avg']+", scaled:"+yScale(coords['avg']))
			// qq("min:"+coords['min']+", scaled:"+yScale(coords['min']))
			// qq("max:"+coords['max']+", scaled:"+yScale(coords['max']))
			// qq("std:"+coords['std_deviation']+", scaled:"+yScale(coords['std_deviation']+1))
			// qq("max-min:"+(coords['max']-coords['min'])+", scaled:"+(yScale(coords['max']) - yScale(coords['min'])))

			// qq("top:"+top)
			// qq("bottom:"+bottom)
			// qq("tallness:"+tallness)
			// qq("height:"+height)
			// qq("shiftHeight:"+shiftHeight)


			var markerGeometry = new THREE.CubeGeometry(coords['width'],  tallness, coords['height']);
			var material = new THREE.MeshBasicMaterial( { color: colorScale(coords['name']) } );
			var stdDev = new THREE.Mesh(markerGeometry, material);
			stdDev.position.x = coords['x0'] + (coords['width'] /2)
			stdDev.position.y = height
			stdDev.position.z = coords['y0'] + (coords['height'] /2)
			
			//stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") + ", avg:"+Math.floor(coords['avg'])+", max:"+coords['max']+", min:"+coords['min']
			// stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") + ", avg:"+Math.floor(coords['avg'])+", max:"+coords['max']
			stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") + ", avg:"+coords['avg'].toFixed(3)+", max:"+coords['max']

			let clickObject = {"compare":[]}
			_.each(coords['chain'], function(chai){
				miniObj = {}
				miniObj[chai['key']] = chai['val']
				clickObject['compare'].push(miniObj)

			})
			stdDev.squaresAction = function(){ childFromClick(id, {"y": 1000, "Ds": btoa(JSON.stringify(clickObject))} , {} ) };
			scene.add(stdDev);



			
			// create the min max box
			// x & z = position on flat 
			// y = standard deviation
			var markerGeometry = new THREE.CubeGeometry(10,  yScale(coords['max']) - yScale(coords['min']), 10);
			var material = new THREE.MeshBasicMaterial( { color: "black" } );
			var minMax = new THREE.Mesh(markerGeometry, material);
			minMax.position.x = coords['x0'] + (coords['width'] /2)
			minMax.position.y = yScale(coords['min'] + ((coords['max']-coords['min'])/2))
			minMax.position.z = coords['y0'] + (coords['height'] /2)
			//stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") + ", avg:"+Math.floor(coords['avg'])+", max:"+coords['max']+", min:"+coords['min']
			// stdDev.squaresName = _.pluck(coords['chain'], "val").join(", ") +", max:"+coords['max']
			scene.add(minMax);
		}

	})



	threeScenes["square_"+id] = scene;

	
	if(recordsWithNull > 0){
		addSquareStatus(id, "warning", recordsWithNull+" records had no statistics, rendering flat.")
	}
	

}


function treeToFlat(id, data){

	// qq("--------------treetoFlat")
	return treeToFlatRecursive(id, data['data'], data, [], [])

}

function treeToFlatRecursive(id, dataNode, childrenNode, returnList, clickArray){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name);
	

	if(childrenNode.hasOwnProperty("children")){
		
		for ( var i = 0 ; i < childrenNode['children'].length; i++){
			
			var a = dataNode['children'][i]
			var b = childrenNode['children'][i]

			clickArray.push({"key": retrieveSquareParam(id,"Cs",true)['array'][clickArray.length]  , "val": dataNode['children'][i]['name']})

			treeToFlatRecursive(id, a, b, returnList, clickArray)

			clickArray.pop()
		}

	}else{

		// miniObject
		var mO = {}
		mO['x0'] = childrenNode['x0']
		mO['y0'] = childrenNode['y0']
		mO['width'] = childrenNode['x1'] - childrenNode['x0']
		mO['height'] = childrenNode['y1'] - childrenNode['y0']
		
		mO['name'] = dataNode['name']
		mO['avg'] = dataNode['stats']['avg']
		mO['min'] = dataNode['stats']['min']
		mO['max'] = dataNode['stats']['max']
		mO['std_deviation'] = dataNode['stats']['std_deviation']
		mO['size'] = dataNode['stats']['size']

		mO['chain'] = JSON.parse(JSON.stringify(clickArray))


		returnList.push(mO)

	}

	return returnList

}