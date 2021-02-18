graphs_functions_json.add_graphs_json({
	"elastic":{
		"filter":{
			"completeForm": "elastic_completeform_filter",			
			"processForm": "elastic_processform_filter",			
			"populate": "elastic_populate_filter",
			"rawtoprocessed":"elastic_rawtoprocessed_filter",
			"graph":"elastic_graph_filter",
			"about": "",
		}
	}
});

async function elastic_completeform_filter(id, targetDiv){


	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)

	var dropdownFields = []
	
	_.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	const jsonform = {
		"schema": {
			"x_key": {
				"title": "Key",
				"type": "string",
				"enum": dropdownFields
			},
			"x_val": {
				"title": "Value",
				"type": "string"
			}
		},
		"value":{"x_key":null, "x_val":null},
		"form":	[
			{
				"key":"x_key",
			},
			{
				"key":"x_val",
			}
		]
	  }	


	  
 	var thisCs = retrieveSquareParam(id,"Cs",false)
	if(thisCs !== undefined){
		jsonform.value["x_key"] = thisCs['x_key']
		jsonform.value["x_val"] = thisCs['x_val']
	}

	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_filter(id){
	
	//	"filter" type  has a dataset in the Cs, so need to apply that to normal place in the square = Ds
	// is this the right place to do this?
	var thisCs = retrieveSquareParam(id,"Cs",true)
	// var clickObject = {"y": 1000, "Gt":"PieChart", "Cs":{"array":[key]}}
	miniObject = {}
	miniObject[thisCs['x_key']] = thisCs['x_val']
	url.squares[squarearraysearch(id)].Ds = btoa(JSON.stringify({"compare":[miniObject] }))

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var fields = []
	var limit = 100;
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		limit = retrieveSquareParam(id,"Cs",false)['x_size']
	}

	var filter = combineScriptFilter(id)
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

	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

}



function elastic_rawtoprocessed_filter(id, data){

	var dataOut = "bob"

	return dataOut;
}


async function elastic_graph_filter(id, data){
	
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
	



	// Hits of parent
	dataOfParent = await getSavedData(retrieveSquareParam(id, "Pr", false), "raw", "all")
	dataOfParent = dataOfParent['hits']['total']['value']
	var dataOfParentString = dataOfParent
	if(dataOfParent == 10000){
		dataOfParentString = "> 10,000"
	}

	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		
	// clusterDiv.append("img")
	// 	.classed("square_cluster_image", true)
	// 	.classed("fleft", true)
	// 	.attr("src", "./images/070_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Hits Pre Filter:")

			clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.append("div")
			.classed("fontsize", true)
			.text(dataOfParentString);	

	clusterSection.append("div")
	.classed("clr", true)


	// "Filter"
	var filterString = JSON.stringify(atob(retrieveSquareParam(id, "Ds", false)))
	
	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		
	// clusterDiv.append("img")
	// 	.classed("square_cluster_image", true)
	// 	.classed("fleft", true)
	// 	.attr("src", "./images/070_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Filter:")

			clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.append("div")
			.classed("fontsize", true)
			.text(filterString);	

	clusterSection.append("div")
	.classed("clr", true)


	// Hits after filter
	dataOfMine = await getSavedData(id, "raw", "all")
	dataOfMine = dataOfMine['hits']['total']['value']
	var dataOfMineString = dataOfMine
	if(dataOfMine == 10000){
		dataOfMineString = "> 10,000"		
	}


	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		
	// clusterDiv.append("img")
	// 	.classed("square_cluster_image", true)
	// 	.classed("fleft", true)
	// 	.attr("src", "./images/070_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Hits Post Filter:")

			clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.append("div")
			.classed("fontsize", true)
			.text(dataOfMineString + " (%"+Math.floor((dataOfMine/dataOfParent)*100)+")");	

	clusterSection.append("div")
	.classed("clr", true)


}


