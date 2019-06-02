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

	// square
	// 		form
	// 			clustersecion(s)
	//				clusterdiv(s)

	// put everything in a form
	var thisForm = square.append('form')
		.attr("id", function(d){ return "square_editform_"+d.id })
		//.on("submit", function(d){ return validate(this) })
		//.attr("action", "javascript:void(0);")



	// Connector
	clusterSection = thisForm.append("div")
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
				.on('change', function(d){
					selectValue = d3.select("#square_graph_dropdown_"+d.id).property('value')
					// inform the graph code to populate any extra parameters it likes
					$("#square_editformcustom_"+id).empty()
					window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(d.id, 'CH')), selectValue , "completeForm")](d.id, "#square_editformcustom_"+d.id)
				})

		var mySelect = $('#square_graph_dropdown_'+id);

		mySelect.append(
			$('<option></option>').val("").html("")
		);



		
		connector_type = connectors_json.handletotype( retrieveSquareParam(id, 'CH') );
		
		//qq("connector_type for "+id+" found as:"+connector_type+" toshortnamelist:"+graphs_functions_json.typeToShortnameList(connector_type));
		$.each(graphs_functions_json.typeToShortnameList(connector_type), function(i, v){
			mySelect.append(
				$('<option></option>').val(v).html(v)
			);
			
		});

		// Update dropdown, did this graph have Gt set?  Or is it blank?
		if(retrieveSquareParam(id, "Gt", false) == null || retrieveSquareParam(id, "Gt", false) == 0 || retrieveSquareParam(id, "Gt", false) == undefined ){	
			$("#square_graph_dropdown_"+id).prop("selectedIndex", 0);

		}else{
			$("#square_graph_dropdown_"+id).val(retrieveSquareParam(id, "Gt", false));

			// if we had a graph type, shoudl we also auto draw the "custom fields" options?
			selectValue = retrieveSquareParam(id, "Gt", false)
			if(graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), selectValue , "completeForm")){
				window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), selectValue , "completeForm")](id, "#square_editformcustom_"+id)
			}

		}
		

		clusterDiv.append("div")
			.classed("clr", true)

		clusterDiv.append('div')
			.classed("editSquareJsonForm", true)
			.attr("id", function(d){ return "square_editformcustom_"+d.id})
			
		
			

	}
	clusterSection.append("div")
                .classed("clr", true)
	

	// We Ws
	clusterSection = thisForm.append("div")
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

	square_We_dropdown.append($('<option></option>').val("").html("-"));
	square_Ws_dropdown.append($('<option></option>').val("").html("-"));
	square_Wr_dropdown.append($('<option></option>').val("").html("-"));

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
	if(retrieveSquareParam(id, "We", false) == null || retrieveSquareParam(id, "We", false) == 0){	
		$("#square_We_dropdown_"+id).prop("selectedIndex", 0);
	}else{
		$("#square_We_dropdown_"+id).val(retrieveSquareParam(id, "We", false));
	}
	if(retrieveSquareParam(id, "Ws", false) == null || retrieveSquareParam(id, "Ws", false) == 0){	
		$("#square_Ws_dropdown_"+id).prop("selectedIndex", 0);
	}else{
		$("#square_Ws_dropdown_"+id).val(retrieveSquareParam(id, "Ws", false));
	}
	if(retrieveSquareParam(id, "Wr", false) == null || retrieveSquareParam(id, "Wr", false) == 0){	
		$("#square_Wr_dropdown_"+id).prop("selectedIndex", 0);
	}else{
		$("#square_Wr_dropdown_"+id).val(retrieveSquareParam(id, "Wr", false));
	}


	clusterSection.append("div")
                .classed("clr", true)

	// Data Subset
	clusterSection = thisForm.append("div")
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
	if(typeof retrieveSquareParam(id, "Ds", false) != 'undefined'  && /^[A-Za-z0-9+/=][A-Za-z0-9+/=]*$/.test(retrieveSquareParam(id, "Ds", false))){
		$("#square_Ds_textarea_"+id).val(atob(retrieveSquareParam(id, "Ds")));
	}

	
	// Submit button
	clusterSection = thisForm.append("div")
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



	if(aConnector==true){
		$("#square_buttonhere_"+id).append("<input type='button' value='Save Connector' onclick='editNewConnector("+id+")' />");
	}else{
		// d3 can't append buttons, so append html style
		//$("#square_buttonhere_"+id).append("<input type='button' value='Save Graph' onclick='window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam("+id+", \"CH\")), selectValue , \"processform\")]("+id+")' />")
		$("#square_buttonhere_"+id).append("<input type='button' value='Save Graph' onclick='editSquare("+id+")' />")
	}

}

