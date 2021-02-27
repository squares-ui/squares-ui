graphs_functions_json.add_graphs_json({
	"builtin":{
		"squareerror":{
			"populate":"populate_squareerror", 
			"rawtoprocessed":"process_squareerror",
			"param": "", 
			"graph":"graph_squareerror",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});


async function populate_squareerror(id){

	var promises = [id]
	return Promise.all(promises)

}
async function process_squareerror(id, data){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	return null
	
}

async function graph_squareerror(id, data){

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("square_dft_message", true)
			// .classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });

		square.append("img")
			.attr("src", data['image'])
			.on("mousedown", function() { d3.event.stopPropagation(); })

		square.append("div") 
			.attr("id", function(d){ return "square_error_"+d.id })
			.html(data['msg'])
			.on("mousedown", function() { d3.event.stopPropagation(); });



}

