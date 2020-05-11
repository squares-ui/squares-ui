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

function elastic_completeform_rawoutput(id, targetDiv){

	const jsonform = {}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	// elastic_get_fields(dst, connectionhandle, id)
	// 	.then(function(results){
	
	// 		jsonform.schema.x_field.enum = results
	// 		$(targetDiv).jsonForm(jsonform)

	// 	})




}


function elastic_populate_rawoutput(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)

	Ds = clickObjectsToDataset(id)
	
	var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	

	var limit = 100;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, null);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}



function elastic_rawtoprocessed_rawoutput(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	dataout = _.map(data, function(row){
		return row._source
	})

	// nothing to do here
	saveProcessedData(id, '', dataout);

}


function elastic_graph_rawoutput(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
	.append("xhtml:div") 
	//.append("svg")
		.attr("id", function(d){ return "square_"+d.id })
		.classed("box_binding", true)
		.classed("square_body", true)
		.classed("square_xhtml", true)
		.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');



	// ##################
	_.each(data, function(row){
		square.append("pre")
			.classed("square_rawoutput", true)
			.text( JSON.stringify(row,null,2)+"," )

	})




}


