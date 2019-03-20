graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
		"DescribeSquare":{
			"populate":"populate_describesquare", 
			"rawtoprocessed":"process_describesquare",
			"param": "", 
			"graph":"graph_describesquare",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

function populate_describesquare(id){

	// no back end data to fetch, but tell the system we're ready
	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+","+name+")");
	connector_bypass(id);

}
function process_describesquare(id){
	
	saveProcessedData(id, '', "");
}

function graph_describesquare(id){


	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
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
	
	var square = sake.selectAll('#square_'+id);

	var aConnector = false;
	if(retrieveSquareParam(id, "Pr")==0){
		aConnector = true;
	}
	

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);

	// Connector
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)

	if(aConnector == true){	
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "./images/070_b.png")

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Connector:")
			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text(retrieveSquareParam(id, "CH"));




	}else{
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
		clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true)
			.attr("id", function(d){ return "square_saveGt_"+d.id })
		$("#square_saveGt_"+id).append("<input type='button' value='Save Graph Type' onclick='editSquare("+id+", \"Gt\")' />");
		

		clusterDiv.append("div")
			.classed("clr", true)


	}
	clusterSection.append("div")
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
			.text("Window end offset:")
		.append("div")
			.text(retrieveSquareParam(id, "We"));


	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Window Size:")
		.append("div")
			.text(countSeconds(retrieveSquareParam(id, "Ws")));


	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Refresh:")
		.append("div")
			.text(countSeconds(retrieveSquareParam(id, "Wr")));

	clusterSection.append("div")
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
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.html("DataSet: ")

	var thisDataSet = "";
	if(retrieveSquareParam(id, "Ds") != null){
		thisDataSet = atob(retrieveSquareParam(id, "Ds"));
	}
	clusterDiv.append("div")
		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text(thisDataSet);



}

