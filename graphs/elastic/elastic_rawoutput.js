graphs_functions_json.add_graphs_json({
	"elastic":{
		"RawOutput":{
			"completeForm": "elastic_completeform_rawoutput",			
			"processForm": "elastic_processform_rawoutput",			
			"populate": "elastic_populate_rawoutput",
			"rawtoprocessed":"elastic_rawtoprocessed_rawoutput",
			"graph":"elastic_graph_rawoutput",
			"about": "Simple print to screen.",
		}
	}
});

async function elastic_completeform_rawoutput(id, targetDiv){

	const jsonform = {
		"schema": {
			"x_count":{
				"type": "integer",
				"title": "Rows",
				"default": 4,
				"minimum": 2,
				"maximum": 6
			},
			"x_vv": {
				"title": "Include verbose lines e.g. 'orig_message'",
				"type": "boolean",
			}
		},
		"form": [
			{
			"key": "x_count"
	
			},{
			"key":"x_vv",
			"inlinetitle": "Include verbose lines e.g. 'orig_message' ?",
			"notitle": true,
			}
		],
		"value":{
		}
		
	}

	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_count'] !== undefined){
			jsonform.value.x_count = retrieveSquareParam(id,"Cs",false)['x_count']
		}else{
			jsonform.value.x_count = 5
		}

		if(retrieveSquareParam(id,"Cs",false)['x_vv']){
			jsonform.form[1]['value'] = 1
		}
	}else{
		jsonform.value.x_count = 5
	}

	$(targetDiv).jsonForm(jsonform)




}


async function elastic_populate_rawoutput(id){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]


	var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	
	var limit = 5;
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_count'] !== undefined){
			limit = retrieveSquareParam(id,"Cs",false)['x_count']
		}
	}

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



function elastic_rawtoprocessed_rawoutput(id, data){

	var data = data[0]['data']['hits']['hits']

	
	Cs = retrieveSquareParam(id,"Cs",true)
	incVv = false
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		if(Cs.hasOwnProperty('x_vv')){
			incVv = Cs.x_vv
		}
	}

	qq(incVv)

	var dataout = _.map(data, function(row){
		if (!incVv){
			// all noisy keys here
			delete row._source.previous_log
			delete row._source.previous_output
			delete row._source.message
			delete row._source.full_log
			
		}
		return row._source
	})

	// nothing to do here
	// saveProcessedData(id, '', dataout);
	return dataout;

}


function elastic_graph_rawoutput(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
	.append("xhtml:div") 
	//.append("svg")
		.attr("id", function(d){ return "square_"+d.id })
		.classed("box_binding", true)
		.classed("square_body", true)
		.classed("square_xhtml", true)
		.classed("overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	// var data = retrieveSquareParam(id, 'processeddata');



	// ##################
	_.each(data, function(row){
		
		
		
		
		square.append("pre")
			.classed("square_rawoutput", true)
			.text( JSON.stringify(row,null,2)+"," )

	})




}


