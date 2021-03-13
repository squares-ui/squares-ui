graphs_functions_json.add_graphs_json({
	"elastic":{
		"AsterPlot":{
			"completeForm": "elastic_completeform_aster",			
			"processForm": "elastic_processform_aster",			
			"populate": "elastic_populate_aster",
			"rawtoprocessed":"elastic_rawtoprocessed_aster",
			"graph":"elastic_graph_aster",
			"about": "aster hits by field.",
		}
	}
});


async function elastic_completeform_aster(id, targetDiv){

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
			"x_field": {
				"type": "string",
				"title": "Field Analysis", 
				"enum": dropdownFieldsKey
			},
			"x_width": {
				"title": "Segment Width (count)",
				"type": "string",
				"enum": dropdownFieldsKey
			},
			"x_depth": {
				"title": "Segment Depth (sum)",
				"type": "string",
				"enum": dropdownFieldsInt
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

		if(thisCs['x_field'] !== null ){
			jsonform.value["x_field"] = thisCs['x_field']
			
		}

		if(thisCs['x_width'] !== null ){
			jsonform.value["x_width"] = thisCs['x_width']
			
		}
		
		if(thisCs['x_null']){
			jsonform.value['x_null'] = 1
		}	

		if(thisCs['x_depth'] !== null ){
			jsonform.value["x_depth"] = thisCs['x_depth']
			
		}

		
	}


	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_aster(id){
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

	if(thisCs['x_null']){
		existOrFields.push(thisCs['x_field'])
	}else{
		existAndFields.push(thisCs['x_field'])
	}


	aggFields.push(thisCs['x_field'])
	aggFields.push(thisCs['x_width'])
	aggFields.push(thisCs['x_depth'])




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



function elastic_rawtoprocessed_aster(id, data){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// data={
	// 	"data":[
	// 		{"name":"path1", "width": 5, "depth":10},
	// 		{"name":"path2", "width": 6, "depth":2},
	// 	],
	// 	"max":7
	// }
	// Depth = total hits, Width = unique values

	data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	
	var dataMid = []
	var dataMax = _.max(data, function(key){ return key.doc_count; })['doc_count']

	_.each(data, function(key){

		var dataDepth = 0
		var dataWidth = 0
		
		// loop through each 
		_.each(key['field']['buckets'], function(width){
			dataDepth += width['doc_count']
		})

		dataWidth = key['field']['buckets'].length

		dataMid.push({"name": key['key'], "width":  dataWidth, "depth":dataDepth  })

	})

	dataMid = _.sortBy(dataMid, "name")
	dataOut =  {"data":dataMid, "max": dataMax}

	return dataOut

}


function elastic_graph_aster(id, data){
	
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

	var gChart = square.append('g')
		.attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');

	var x_field = retrieveSquareParam(id,"Cs")['x_field']
	var thisCs = retrieveSquareParam(id,"Cs",false)

	var radius = (width/2)*0.9
	var innerRadius = 0.3 * radius;
	
	var colorScale = d3.scaleOrdinal().range(GLB.color)


	var pie = d3.pie()
		.sort(null)
		.value(function(d) { return d.width; });

	var arc = d3.arc()
		.innerRadius(innerRadius)
		.outerRadius(function (d) { 
			return (radius - innerRadius) * (d.data.depth / data.max) + innerRadius; 
		});

	var slices = gChart.selectAll("path")
		.data(pie(data.data))
		.enter()



	slices.append("path")
		.style("fill", function(d) { return colorScale(d.data.name); })
		.attr("d", arc)
		.on("mouseover", function(d) {
			//hoverinfo = d.data.name  + ': count='+d.data.realSize+', percent='+Math.floor(d.data.percent)+'%';
			hoverinfo = d.data.name  + ": count("+thisCs['x_width']+")="+d.data.width+", sum("+thisCs['x_depth']+")="+d.data.depth;
			setHoverInfo(id, hoverinfo)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			var clickObject = {"compare":[], "notexist":[], "timerange":[]}

			if(d.data.name == "null"){
				clickObject.notexist.push(d.data.name)
			}else{
				var miniObj ={}
				miniObj[x_field] = d.data.name
				clickObject.compare.push(miniObj)
			}
			
			clickObject = btoa(JSON.stringify(clickObject));
			childFromClick(id, {"y": 1000, "Ds": clickObject} );


		})



	slices.append("text")
		.attr("transform", function(d) {
			var _d = arc.centroid(d);
			_d[0] *= 1;	
			_d[1] *= 1;	
			return "translate(" + _d + ")";
		})
		.style("text-anchor", "middle")
		.style('fill', function(d){
			return invertColor(colorScale(d.data.name), false) 
		})
		.text(function(d) {
			if(d.data.percent < 8) {
				return Math.floor(d.data.width)+'%';
			}
			return d.data.name
		})







}




