graphs_functions_json.add_graphs_json({
	"elastic":{
		"ScatterContour":{
			"completeForm": "elastic_completeform_contour",			
			"processForm": "elastic_processform_contour",			
			"populate": "elastic_populate_contour",
			"rawtoprocessed":"elastic_rawtoprocessed_contour",
			"graph":"elastic_graph_contour",
			"about": "contour hits by field.",
		}
	}
});


async function elastic_completeform_contour(id, targetDiv){

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getMappingsData(thisDst, thisIndex)

	// ["allFields","keywordFields","date","keyword","text","ip","half_float","geo_point","long","boolean","integer","float","[object Object]","fieldTypes"]

	// Ordinal Keys to break down segments on
	var dropdownFieldsKey = []
	var subResultsKey = _.pick(thisMappings, "keyword", "text", "ip", "boolean")
	_.each(subResultsKey, function(val, key){  _.each(val, function(val2){  dropdownFieldsKey.push(val2)  })}) 
	dropdownFieldsKey = _.sortBy(dropdownFieldsKey, function(element){ return element})

	// Scalar keys on which to do segment depth
	var dropdownFieldsInt = []
	var subResultsInt = _.pick(thisMappings, "half_float", "long", "integer", "float")
	_.each(subResultsInt, function(val, key){  _.each(val, function(val2){  dropdownFieldsInt.push(val2)  })}) 
	dropdownFieldsInt = _.sortBy(dropdownFieldsInt, function(element){ return element})



	const jsonform = {
		"schema": {
			"x_x": {
				"type": "string",
				"title": "X (Scalar)", 
				"enum": dropdownFieldsInt
			},
			"x_y": {
				"title": "Y (Scalar)",
				"type": "string",
				"enum": dropdownFieldsInt
			},
			"x_group": {
				"title": "Group By",
				"type": "string",
				"enum": dropdownFieldsKey
			},
			"x_scale": {
				"title": "Scale",
				"type": "string",
				"enum": [
					"linear", "log"
				]
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
		
		if(thisCs['x_group']){
			jsonform.value['x_group'] = thisCs['x_group']
		}	

		if(thisCs['x_scale'] !== null){
			jsonform.value['x_scale'] = thisCs['x_scale']
		}

		
	}


	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_contour(id){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");


	var thisCs = retrieveSquareParam(id,"Cs",true)
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var limit = 1;
	var stats = false
	var statField = null
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	var aggFields = []
	var outputFields = []
	var existOrFields = []
	var existAndFields = []

	//

	// existAndFields.push(thisCs['x_group'])
	existAndFields.push(thisCs['x_x'])
	existAndFields.push(thisCs['x_y'])
	
	
	aggFields.push(thisCs['x_group'])
	aggFields.push(thisCs['x_x'])
	aggFields.push(thisCs['x_y'])
	




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
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields,
		existAndFields
	)
	
	
	var promises = [id]
	if(query){
		promises.push(elastic_connector(thisDst, thisIndex, id, query, "all") )
	}
	return Promise.all(promises)

}



function elastic_rawtoprocessed_contour(id, data){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// Data for countours
	// dataCo = {
	// 	"http":[
	// 		{"x":2,"y":3},
	// 		{"x":3,"y":5},
	// 		{"x":4,"y":3},
	// 		{"x":5,"y":4},
	// 		{"x":10,"y":8},
	// 	]
	// }

	// data for circles, tracking how many circles in the same spot
	// dataCi = [
	// 	{"x_x": 1, "x_y":2, "keys":["dns", "http"]},
	// 	{"x_x": 3, "x_y":8, "keys":["dns"]},
	// ]

	data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	
	var dataCo = {}
	var dataCi = []

	_.each(data, function(key){
	
		if(!dataCo.hasOwnProperty(key.key)){
			dataCo[key.key] = []
		}

		_.each(key['field']['buckets'], function(x){

			_.each(x['field']['buckets'], function(y){

				dataCo[key.key].push({"x_x":x.key, "x_y":y.key})

				if(_.where(dataCi, {"x_x": x.key, "x_y": y.key}).length > 0){
					
					for (var i = 0 ; i < dataCi.length; i++) {
						if (dataCi[i]['x_x'] === x.key && dataCi[i]['x_y'] === y.key ) {
							dataCi[i]['fields'].push(key.key)
							break;
						}
					}
				}else{
					dataCi.push({"x_x": x.key, "x_y":y.key, "fields":[key.key]})
				}
				

			})			

		})

	})

	dataOut =  {"dataCountours":dataCo, "dataCircles":dataCi}

	return dataOut

}


function elastic_graph_contour(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	var margin = {top: 20, right: 30, bottom: 30, left: 40}

	var thisCs = retrieveSquareParam(id,"Cs",true)
	var colorScale = d3.scaleOrdinal().range(GLB.color)

	
	// append the svg object to the body of the page
	var svg = square.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

	

	// Add X scale and axis
	var xRange = _.pluck(_.flatten(_.values(data.dataCountours)), "x_x")
	if(_.min(xRange) == 0 && thisCs['x_scale'] && thisCs['x_scale'] == "log"){
		var minX = 1
		var xScale = d3.scaleLog()
	}else{
		var minX = _.min(xRange)
		var xScale = d3.scaleLinear()
	}	
	xScale.domain([minX, _.max(xRange)+1])
		.range([ 0, width - margin.left - margin.right ]);
	svg.append("g")
		.attr("transform", "translate(0," + (height - margin.top - margin.bottom) + ")")		
		.call(d3.axisBottom(xScale));



	// Add Y scale and axis
	var yRange = _.pluck(_.flatten(_.values(data.dataCountours)), "x_y")
	if(_.min(yRange) == 0 && thisCs['x_scale'] && thisCs['x_scale'] == "log"){
		var minY = 1
		var yScale = d3.scaleLog()
	}else{
		var minY = _.min(yRange)
		var yScale = d3.scaleLinear()
	}	
	yScale.domain([minY, _.max(yRange)+1])
		.range([ height - margin.top - margin.bottom, 0 ]);
	svg.append("g")
		.call(d3.axisLeft(yScale));


	//circle radius scale
	var rScale = d3.scaleLinear()
		.domain([1,5])
		.range([3,8]);



	// draw a coloured contour for every data series
	_.each(data.dataCountours, function(val, key){
		
		var densityData = d3.contourDensity()
			.x(function(d) { return xScale(d.x_x); })
			.y(function(d) { return yScale(d.x_y); })
			.size([width - margin.left - margin.right, height - margin.top - margin.bottom])
			.bandwidth(300) 
			.thresholds(30)
			(val)

		svg.selectAll("path")
			.data(densityData)
			.enter()
			.append("path")
			.attr("d", d3.geoPath())
			.attr("fill", "none")
			.attr("stroke",  function(d) { return colorScale(key) })
			// .attr("stroke-width", 3)
			.attr("stroke-width", (d, i) => i % 5 ? 0.5 : 2)
			.attr("stroke-linejoin", "round")

	})


	// draw circles for each dataset
	svg.append("g")
		.selectAll("circle")
		.data(data.dataCircles)
		.enter()
		.append("circle")
		.attr('cx', function(d){
			if(d.x_x == 0 && thisCs['x_scale'] == "log"){
				return xScale(1)
			}else{
				return xScale(d.x_x)
			}
		})
		.attr('cy', function(d){
			if(d.x_y == 0 && thisCs['x_scale'] == "log"){
				return yScale(1)
			}else{
				return yScale(d.x_y)
			}
		})
		.attr('r', function(d){
			return rScale(d.fields.length)
		})
		.style("fill", function(d) { 
			return colorScale(d.fields)
		})
		.on("mouseover", function(d) {			
			hoverinfo = d.x_x+", " + d.x_y+" ("+d.fields.join(",")+")"
			setHoverInfo(id, hoverinfo)
		})                  
		.on("mouseout", function(d) {
			d3.select(this).style("stroke", "");
			clearHoverInfo(id)
		})
		.on("click", function(d){ 
			_.each(d.fields, function(field){
				var clickObject = {"compare":[], "notexist":[], "timerange":[]}

				if(field == "null"){
					clickObject.notexist.push(field)
				}else{
					var miniObj ={}
					miniObj[thisCs.x_group] = field
					clickObject.compare.push(miniObj)
				}

				var miniObj ={}
				miniObj[thisCs.x_x] = d.x_x
				clickObject.compare.push(miniObj)
			
				var miniObj ={}
				miniObj[thisCs.x_y] = d.x_y
				clickObject.compare.push(miniObj)
				
				clickObject = btoa(JSON.stringify(clickObject));
				childFromClick(id, {"y": 1000, "Ds": clickObject});

			})

		})

qq(data.dataCircles.length)
}




