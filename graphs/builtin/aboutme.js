graphs_functions_json.add_graphs_json({
	"builtin":{
		"aboutme":{
			"populate":"populate_aboutme", 
			"rawtoprocessed":"process_aboutme",
			"param": "", 
			"graph":"graph_aboutme",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});


async function populate_aboutme(id){

	var promises = [id]
	return Promise.all(promises)

}
async function process_aboutme(id, data){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	return null
	
}

async function graph_aboutme(id, data){

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			// .classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });

	// var height = document.getElementById("square_"+id).clientHeight;
	// var width  = document.getElementById("square_"+id).clientWidth;
	

	/// Data Hits
	hits = await getSavedData(id, "raw", "all")
	// qq(hits)
	if(hits){
		hits = hits['hits']['total']['value']
	}else{
		hits = 0
	}

	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Data Hits:")
		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text(hits);		
				clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Note: Refers to all hits, whether they match the requirements of this graph type or not.");	


	/// Square defintion
	var squareLoc = squarearraysearch(id);
	var thisDef = _.omit(url.squares[squareLoc], "Ds", "x", "y", "Fi")

	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Square Attributes:")
		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text(JSON.stringify(_.omit(thisDef)))

	/// Dataset
	var thisDs = retrieveSquareParam(id, "Ds", false)
	if(thisDs){
		var squareLoc = squarearraysearch(id);
		var thisDef = _.omit(url.squares[squareLoc], "Ds", "x", "y")

		var clusterSection = square.append("div")
		.classed("square_cluster_section", true)

		var clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Dataset:")
			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text(atob())
	}


	/// Filter
	var thisFi = retrieveSquareParam(id, "Fi", false)
	if(thisFi){
		var squareLoc = squarearraysearch(id);
		var thisDef = _.omit(url.squares[squareLoc], "Ds", "x", "y")

		var clusterSection = square.append("div")
		.classed("square_cluster_section", true)

		var clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Filter Script:")
			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text(retrieveSquareParam(id, "Fi", false))
	}
														



	// Reload button
	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.attr("id", function(d){ return "square_buttonhere_"+d.id })
			
		$("#square_buttonhere_"+id)						
			.append("<input type='button' value='Reload Graph' onclick='drawinBoxes(["+id+"])' />");



}

