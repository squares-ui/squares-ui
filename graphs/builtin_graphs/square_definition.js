graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
		"SquareDefinition":{
			"populate":"populate_graphdefinition", 
			"rawtoprocessed":"process_graphdefinition",
			"param": "", 
			"graph":"graph_graphdefinition",
			"about": ""
		}
	}
});

function populate_graphdefinition(id){

	connector_bypass(id);

}
function process_graphdefinition(id){
	
	saveProcessedData(id, '', "");
}

function graph_graphdefinition(id){

	var foreignObject = sake.selectAll('#foreignObject_'+id)
	var square = foreignObject
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;

	// Graph type
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/125_b.png")
	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);
	clusterDiv.append("div")
		.classed("fleft", true)
			.classed("fontsize", true)
			.text("Graph Type:")
		.append("div")
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_graph_dropdown_"+d.id })
			.attr("name", function(d){ return "square_graph_dropdown_"+d.id })
	var mySelect = $('#square_graph_dropdown_'+id);
	mySelect.append(
		$('<option></option>').val(null).html("--System Graphs--")
	);
	$.each(graphs_functions_json.typeToShortnameList("builtin_graphs"), function(i, v){
		mySelect.append(
			$('<option></option>').val(v).html(v)
		);
	});
	mySelect.append(
		$('<option></option>').val("-").html("--Connector Graphs--")
	);
	connector_type = connectors_json.handletotype( retrieveSquareParam(id, 'CH') );
	//qq("connector_type for "+id+" found as:"+connector_type+" toshortnamelist:"+graphs_functions_json.typeToShortnameList(connector_type));
	$.each(graphs_functions_json.typeToShortnameList(connector_type), function(i, v){
		mySelect.append(
			$('<option></option>').val(v).html(v)
		);
		
	});
	clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		.attr("id", function(d){ return "square_saveGt_"+d.id })
	$("#square_saveGt_"+id).append("<input type='button' value='Save Graph Type' onclick='editSquare(\""+id+"\", \"Gt\")' />");
	

	clusterDiv.append("div")
		.classed("clr", true)

	// We Ws
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/021_b.png")
	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);
	clusterDiv.append("div")
			.classed("fontsize", true)
			.classed("fleft", true)
			.text("Window Size:")
		.append("div")
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_Ws_dropdown_"+d.id })
			.attr("name", function(d){ return "square_Ws_dropdown_"+d.id })
	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Relative:")
			.classed("fleft", true)
		.append("div")
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_We_dropdown_"+d.id })
			.attr("name", function(d){ return "square_We_dropdown_"+d.id })
	var  square_We_dropdown = $('#square_We_dropdown_'+id);
	var  square_Ws_dropdown = $('#square_Ws_dropdown_'+id);
	var timewindows = new Array();
	timewindows.push([-1 * 0, "0 secs"]); 
	timewindows.push([-1 * 10, "10 secs"]); 
	timewindows.push([-1 * 30, "30 secs"]); 
	timewindows.push([-1 * (GLB.square.blocksize/60), ""+1*(GLB.square.blocksize/60)+' Mins']); 
	timewindows.push([-2 * (GLB.square.blocksize/60), ""+2*(GLB.square.blocksize/60)+' Mins']); 
	timewindows.push([-3 * (GLB.square.blocksize/60), ""+3*(GLB.square.blocksize/60)+' Mins']); 
	timewindows.push([-1 * 60 * 60, '1 Hours']); 
	timewindows.push([-12 * 60 * 60, '12 Hours']); 
	timewindows.push([-1 * 60 * 60 * 24, '1 Day']); 
	timewindows.push([-1 * 60 * 60 * 24 * 7, '1 Week']); 
	timewindows.push([-1 * 60 * 60 * 24 * 7 * 4, '1 Month']); 
	$.each(timewindows, function(val, obj) {
		square_We_dropdown.append(
			$('<option></option>').val(obj[0]).html(obj[1])
		);
		square_Ws_dropdown.append(
			$('<option></option>').val(obj[0]).html(obj[1])
		);
	})
	clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		.attr("id", function(d){ return "square_saveWe_"+d.id })
	$("#square_saveWe_"+id).append("<input type='button' value='Save Relative Time' onclick='editSquare(\""+id+"\", \"We\")' />");


	clusterDiv.append("div")
		.classed("clr", true)

	// Data Subset
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/061_b.png")
	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);
	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Data Set:")
			.classed("fleft", true)
		.append("div")
		.append("textarea")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_Ds_dropdown_"+d.id })
			.attr("name", function(d){ return "square_Ds_dropdown_"+d.id })
	clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		.attr("id", function(d){ return "square_saveDs_"+d.id })
	$("#square_saveDs_"+id).append("<input type='button' value='Save Data Subset' onclick='editSquare("+id+", \"Ds\")' />");


	clusterDiv.append("div")
		.classed("clr", true)



}



