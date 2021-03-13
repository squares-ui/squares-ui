graphs_functions_json.add_graphs_json({
	"elastic":{
		"Heatmap":{
			"completeForm": "elastic_completeform_heatmapS",			
			"processForm": "elastic_processform_heatmapS",			
			"populate": "elastic_populate_heatmapS",
			"rawtoprocessed":"elastic_rawtoprocessed_heatmapS",
			"graph":"elastic_graph_heatmapS",
			"about": "heatmapS hits by field.",
		}
	}
});


async function elastic_completeform_heatmapS(id, targetDiv){

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getMappingsData(thisDst, thisIndex)

	// ["allFields","keywordFields","date","keyword","text","ip","half_float","geo_point","long","boolean","integer","float","[object Object]","fieldTypes"]

	// Ordinal Keys to break down segments on
	var dropdownFieldsKey = []
	var subResultsKey = thisMappings; _.pick(thisMappings, "keyword", "text", "ip", "boolean")
	_.each(subResultsKey, function(val, key){  _.each(val, function(val2){  dropdownFieldsKey.push(val2)  })}) 
	dropdownFieldsKey = _.sortBy(dropdownFieldsKey, function(element){ return element})


	const jsonform = {
		"schema": {
			"x_row": {
				"type": "string",
				"title": "Rows (Ordinal)", 
				"enum": dropdownFieldsKey
			},
			"x_col": {
				"title": "Cols (Ordinal)",
				"type": "string",
				"enum": dropdownFieldsKey
			},
			"x_null": {
				"title": "Include partial null/undefined ?",
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

		if(thisCs['x_row'] !== null ){
			jsonform.value["x_row"] = thisCs['x_row']
			
		}

		if(thisCs['x_col'] !== null ){
			jsonform.value["x_col"] = thisCs['x_col']
			
		}
		if(thisCs['x_null']){
			jsonform.value['x_null'] = 1
		}	
		
	}


	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_heatmapS(id){
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



	aggFields.push(thisCs['x_row'])
	aggFields.push(thisCs['x_col'])


	if(thisCs['x_null']){
		existOrFields.push(thisCs['x_row'])
		existOrFields.push(thisCs['x_col'])
	}else{
		existAndFields.push(thisCs['x_row'])
		existAndFields.push(thisCs['x_col'])
	}

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



function elastic_rawtoprocessed_heatmapS(id, data){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");



	data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	
	var dataMid = []
	var dataMax = _.max(data, function(key){ return key.doc_count; })['doc_count']

	_.each(data, function(arr){

		var key = arr.key

		_.each(arr.field.buckets, function(arr2){

			var key2 = arr2.key

			dataMid.push({"row":key, "col":key2, "value":arr2.doc_count})

		})

	})

	// dataMid = _.sortBy(dataMid, "row")
	dataOut =  {"data":dataMid, "max": dataMax}

	return dataOut

}


function elastic_graph_heatmapS(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	

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
	const margin = {top: 30, right: 30, bottom: 30, left: 200}

	var thisCs = retrieveSquareParam(id,"Cs",false)


    const svg = square.append("g")
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var rowLabels = d3.set(data.data.map((d) => {return d.row})).values().sort()
	var xScale = d3.scaleBand()
		.domain(rowLabels)
		.range([0, width - margin.left - margin.right]);
	
	var colLabels = d3.set(data.data.map((d) => {return d.col})).values().sort()
	var yScale = d3.scaleBand()
		.domain(colLabels)
		.range([0, height - margin.top - margin.bottom]);
		

	var colRange = ["#ffe2aa","#ffa900"]
	var linearColour = d3.scaleLinear()
		.domain([0,data.max])
		.range(colRange)

	cellSize = 20
	svg.selectAll("rect")
		.data(data.data)
		.enter().append("rect")
		.attr('width', d => xScale.bandwidth())
		.attr('height', d => yScale.bandwidth())
		.attr('x', d => xScale(d.row))
		.attr('y', d => yScale(d.col))
		.attr('fill', d => linearColour(d.value))		
		.on("mouseover", function(d) {
			hoverinfo = d.row+", "+d.col+": "+d.value
			setHoverInfo(id, hoverinfo)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			var clickObject = {"compare":[], "notexist":[], "timerange":[]}

			var miniObj ={}
			miniObj[thisCs.x_col] = d.col
			clickObject.compare.push(miniObj)
		
			var miniObj ={}
			miniObj[thisCs.x_row] = d.row
			clickObject.compare.push(miniObj)
			
			clickObject = btoa(JSON.stringify(clickObject));
			childFromClick(id, {"y": 1000, "Ds": clickObject});

		})

    
	
	// y Scale of hits
	const yAxis = d3.axisLeft(yScale)		 
	svg.append('g')
		.attr("class", "yaxis")
		.call(yAxis); 
	
	const xAxis = d3.axisBottom(xScale)		 
	svg.append('g')
		.attr("class", "xaxis")
		.attr('transform', 'translate(0,' + (height - margin.top - margin.bottom) + ')')
		.call(xAxis)
		

}




