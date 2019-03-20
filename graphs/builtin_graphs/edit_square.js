graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
		"EditSquare":{
			"populate":"populate_editsquare", 
			"rawtoprocessed":"process_editsquare",
			"param": "", 
			"graph":"graph_editsquare",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

function populate_editsquare(id){

	// no back end data to fetch, but tell the system we're ready
	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+","+name+")");
	connector_bypass(id);

}
function process_editsquare(id){
	
	saveProcessedData(id, '', "");
}

function graph_editsquare(id){

	qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);

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
				.append("select")
					.classed("fontsize", true)
					.attr("id", function(d){ return "square_connector_dropdown_"+d.id })
					.attr("name", function(d){ return "square_connector_dropdown_"+d.id })
			clusterDiv.append("div")
					.classed("fontsize", true)
					.attr("id", function(d){ return "square_connector_desc_"+d.id})

		$.each(connectors_json.get_connectors_json(), function (i, item) {
			$('#square_connector_dropdown_'+id).append($('<option>', { 
			value: item.handle,
			text : item.handle+" ("+item.type+" "+item.username+")"
		    }));
		});
		$("#square_connector_dropdown_"+id).val(retrieveSquareParam(id, "CH"));
		$('#square_connector_dropdown_'+id).change(function() {
			// if the dropdown is selected, update the text below
			$("#square_connector_desc_"+id).html("Dest: "+connectors_json.handletodst($('#square_connector_dropdown_'+id).val())+"<br>UserName: "+connectors_json.handletousername($('#square_connector_dropdown_'+id).val()));
			//		$("#square_connector_DS_desc_"+id).html(graphs_functions_json.retrieveGraphParam());
		})



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
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_We_dropdown_"+d.id })
			.attr("name", function(d){ return "square_We_dropdown_"+d.id })
	var  square_We_dropdown = $('#square_We_dropdown_'+id);
	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Window Size:")
		.append("div")
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_Ws_dropdown_"+d.id })
			.attr("name", function(d){ return "square_Ws_dropdown_"+d.id })
	var  square_Ws_dropdown = $('#square_Ws_dropdown_'+id);
	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Refresh:")
		.append("div")
		.append("select")
			.classed("fontsize", true)
			.attr("id", function(d){ return "square_Wr_dropdown_"+d.id })
			.attr("name", function(d){ return "square_Wr_dropdown_"+d.id })
	var  square_Wr_dropdown = $('#square_Wr_dropdown_'+id);

	square_We_dropdown.append($('<option></option>').val(0).html("none"));
	square_Wr_dropdown.append($('<option></option>').val(0).html("none"));
	$.each(timewindows, function(val, obj) {
		square_We_dropdown.append(
			// Window end has to be negative to differentiate from absolute times
			$('<option></option>').val(obj[0] * -1).html(obj[1])
		);
		square_Ws_dropdown.append(
			$('<option></option>').val(obj[0]).html(obj[1])
		);
		square_Wr_dropdown.append(
			$('<option></option>').val(obj[0]).html(obj[1])
		);
	})
	
//	var tmp_Ws = retrieveSquareParam(id, "Ws");
//	var tmp_We = retrieveSquareParam(id, "We");
//	var tmp_Wr = retrieveSquareParam(id, "Wr");
	if(retrieveSquareParam(id, "Ws") == null || retrieveSquareParam(id, "Ws") == 0){	
		$("#square_Ws_dropdown_"+id).val(0);
	}else{
		$("#square_Ws_dropdown_"+id).val(retrieveSquareParam(id, "Ws"));
	}
	$("#square_We_dropdown_"+id).val(retrieveSquareParam(id, "We"));
	if(retrieveSquareParam(id, "Wr") == null || retrieveSquareParam(id, "Wr") == 0){	
		$("#square_Wr_dropdown_"+id).val(0);
	}else{
		$("#square_Wr_dropdown_"+id).val(retrieveSquareParam(id, "Wr"));
	}

	if(aConnector == false){
		clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true)
			.attr("id", function(d){ return "square_saveWe_"+d.id })
		$("#square_saveWe_"+id).append("<input type='button' value='Save Relative Time' onclick='editSquare("+id+", \"Wi\")' />");
	}
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
				.html("DataSet: ")

	clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.append("textarea")
		.classed("fontsize", true)
		.attr("id", function(d){ return "square_Ds_textarea_"+d.id })
		.attr("name", function(d){ return "square_Ds_textarea_"+d.id })
	if(typeof retrieveSquareParam(id, "Ds") != 'undefined'  && /^[A-Za-z0-9+/=][A-Za-z0-9+/=]*$/.test(retrieveSquareParam(id, "Ds"))){
		$("#square_Ds_textarea_"+id).val(atob(retrieveSquareParam(id, "Ds")));
	}
	if(aConnector==false){
		clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true)
			.attr("id", function(d){ return "square_saveDs_"+d.id })
		$("#square_saveDs_"+id).append("<input type='button' value='Save Data Subset' onclick='editSquare("+id+", \"Ds\")' />");
	}



	if(aConnector==true){
		// Submit button
		clusterSection = square.append("div")
			.classed("square_cluster_section", true)
		clusterDiv = clusterSection.append("div")
			.classed("fleft", true);
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "")

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.attr("id", function(d){ return "square_buttonhere_"+d.id })
		$("#square_buttonhere_"+id).append("<input type='button' value='Save Connector' onclick='editNewConnector("+id+")' />");
	}

}

