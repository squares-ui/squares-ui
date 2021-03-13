graphs_functions_json.add_graphs_json({
	"builtin":{
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
	var promises = [id]
	return Promise.all(promises)

}
function process_editsquare(id, data){
	
	return "empty"
}


async function graph_editsquare(id){


	var aConnector = false
	if(retrieveSquareParam(id, "Pr")==0){
		aConnector = true;
	}
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("square_yoverflow", true)
			// .classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });

	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var square = workspaceDiv.selectAll('#square_'+id);

	var thisType = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "type")			

	
	
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
	var clusterSection = thisForm.append("div")
		.classed("square_cluster_section", true)

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)

	if(aConnector == true){	
		
		// Destination server ip:port
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "./images/070_b.png")

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)


			clusterDiv.append("div")
				.classed("clr", true)
		

			clusterDiv.append("div")
				.classed("fleft", true)
				.classed("square_cluster_text", true)

				clusterDiv.append("div")
					.classed("square_cluster_text", true)
					.append("div")
						.classed("fontsize", true)
						.text("Connector Name:")
				clusterDiv.append("div")
					.append("select")
						.classed("fontsize", true)
						.attr("id", function(d){ return "square_co_dropdown_"+d.id })
						.attr("name", function(d){ return "square_co_dropdown_"+d.id })
				// clusterDiv.append("div")
				// 		.classed("fontsize", true)
				// 		.attr("id", function(d){ return "square_co_dropdown_"+d.id})
				
				var justDst = await getAllSavedConnectors()
				_.each(justDst, function(dst){
					
					if(! (dst['name'] == "Dummy" || dst['type'] == "builtin" || dst['type'] == "introduction") ){
						$('#square_co_dropdown_'+id).append($('<option>', { 
							value: dst['name'],
							text : dst['name']
						}));					
					}
				})		
				
				$("#square_co_dropdown_"+id).val(retrieveSquareParam(id, "Co", true));



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
			.classed("clr", true)
			.append("div")
			.classed("fleft", true)
			.append("select")
				.classed("fontsize", true)
				.attr("id", function(d){ return "square_graph_dropdown_"+d.id })
				.attr("name", function(d){ return "square_graph_dropdown_"+d.id })
				.on('change', function(d){
					selectValue = d3.select("#square_graph_dropdown_"+d.id).property('value')
					// inform the graph code to populate any extra parameters it likes
					$("#square_editformcustom_"+id).empty()
					
					// Does the graph type require ThreeJS, or is it enabled?
					if(GLB.threejs.enabled = true || graphs_functions_json.retrieveGraphParam(thisType, selectValue , "requireThreeJS") == false){
						// should the newly chosen graph type be "completeForm" processed
						var isCompleteForm = graphs_functions_json.retrieveGraphParam(thisType, selectValue , "completeForm")
						if(isCompleteForm){							
							window[isCompleteForm](d.id, "#square_editformcustom_"+d.id)
						}
					}else{
						alert("3d needed")
					}

				})
			.append("div")
			.classed("fleft", true)
			.text("asd2")

		var mySelect = $('#square_graph_dropdown_'+id);
		
		
		if(retrieveSquareParam(id, 'Co') == undefined){
			mySelect.append(
				$('<option></option>').val("").html("Root Square has not Connector")
			);
		}else{

			mySelect.append(
				$('<option></option>').val("").html("")
			);
	
			connector_type = thisType
			//qq("connector_type for "+id+" found as:"+connector_type+" toshortnamelist:"+graphs_functions_json.typeToShortnameList(connector_type));
			$.each(graphs_functions_json.typeToShortnameList(connector_type), function(i, v){
				mySelect.append(
					$('<option></option>').val(v).html(v)
				);
				
			});
			mySelect.append(
				$('<option></option>').val("UpdateCountdown").html("UpdateCountdown")
			);
		}


		

		clusterDiv.append("div")
			.classed("clr", true)

		clusterDiv.append('div')
			.classed("editSquareJsonForm", true)
			.attr("id", function(d){ return "square_editformcustom_"+d.id})

		// Update dropdown, did this graph have Gt set?  Or is it blank?
		if(retrieveSquareParam(id, "Gt", false) == null || retrieveSquareParam(id, "Gt", false) == 0 || retrieveSquareParam(id, "Gt", false) == undefined ){	
			$("#square_graph_dropdown_"+id).prop("selectedIndex", 0);

		}else{
			$("#square_graph_dropdown_"+id).val(retrieveSquareParam(id, "Gt", true));

			// if we had a graph type, shoudl we also auto draw the "custom fields" options?
			selectValue = retrieveSquareParam(id, "Gt", true)

			var isCompleteForm = graphs_functions_json.retrieveGraphParam(thisType, selectValue , "completeForm")
			if(isCompleteForm){
				
				window[isCompleteForm](id, "#square_editformcustom_"+id)
			}

		}

	}





	clusterSection.append("div")
                .classed("clr", true)
	

	// We Ws
	var clusterSection = thisForm.append("div")
		.classed("square_cluster_section", true)
	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/021_b.png")
	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);



	if(aConnector == false){	
		var pairing = clusterDiv.append("div")
		pairing.append("div")
			.classed("fleft", true)	
			.classed("fontsize", true)
			.classed("squaretextleft", true)
			.text("Time offset:")
		pairing.append("div")
			.classed("fleft", true)
			.append("select")
			.classed("fontsize", true)
				.attr("id", function(d){ return "square_We_dropdown_"+d.id })
				.attr("name", function(d){ return "square_We_dropdown_"+d.id })
		pairing.append("div")
			.classed("clr", true)
		var  square_We_dropdown = $('#square_We_dropdown_'+id);
		square_We_dropdown.append($('<option></option>').val("").html("-"));
		$.each(timeWindowsEnd, function(val, obj) {
			square_We_dropdown.append(
				$('<option></option>').val(obj[0]).html(obj[1])
			);
		})

		if(retrieveSquareParam(id, "Wr", false) == null || retrieveSquareParam(id, "Wr", false) == 0){	
			$("#square_Wr_dropdown_"+id).prop("selectedIndex", 0);
		}else{
			$("#square_Wr_dropdown_"+id).val(retrieveSquareParam(id, "Wr", false));
		}


	}else{
		var pairing = clusterDiv.append("div")
			pairing.append("div")
				.classed("fleft", true)
				.classed("fontsize", true)
				.classed("squaretextleft", true)
				.text("Window end (local):");
			
			pairing.append("div")
				.classed("fleft", true)
				.append("input")
				.classed("fontsize", true)
					.attr("id", function(d){ return "square_We_text_"+d.id} )
					.attr("name", function(d){ return "square_We_text_"+d.id} )

			
			pairing.append("div")
					.classed("clr", true)
	
			//push existing date to the textbox
			var stringFormat = "YYYY-MM-DD[T]HH:mm:ss"
			var thisWe = retrieveSquareParam(id, "We", true)
			if(thisWe !== null && thisWe != 0){	
				thisString = moment(thisWe, "X").format(stringFormat);
				$("#square_We_text_"+id).val(thisString);
			}
		

			flatpickr("#square_We_text_"+id, {
				time_24hr: true,
				enableTime: true,
				dateFormat: "Y-m-d H:i:S",
			});

	}

	var pairing = clusterDiv.append("div")
			pairing.append("div")
				.classed("fleft", true)
				.classed("fontsize", true)
				.classed("squaretextleft", true)
				.text("Window Size:")
			pairing.append("div")
				.classed("fleft", true)
				.append("select")
				.classed("fontsize", true)
					.attr("id", function(d){ return "square_Ws_dropdown_"+d.id })
					.attr("name", function(d){ return "square_Ws_dropdown_"+d.id })
			pairing.append("div")
				.classed("clr", true)
	var  square_Ws_dropdown = $('#square_Ws_dropdown_'+id);
	square_Ws_dropdown.append($('<option></option>').val("").html("-"));
	
	$.each(timeWindowsSize, function(val, obj) {
		square_Ws_dropdown.append(
			$('<option></option>').val(obj[0]).html(obj[1])
		);
	})

	if(retrieveSquareParam(id, "Ws", false) == null || retrieveSquareParam(id, "Ws", false) == 0){	
		$("#square_Ws_dropdown_"+id).prop("selectedIndex", 0);
	}else{
		$("#square_Ws_dropdown_"+id).val(retrieveSquareParam(id, "Ws", false));
	}


	clusterSection.append("div")
                .classed("clr", true)


	// Data Subset
	var clusterSection = thisForm.append("div")
		.classed("square_cluster_section", true)
		
		var clusterDiv = clusterSection.append("div")
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

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("textarea")
				.classed("fontsize", true)
				.attr("id", function(d){ return "square_Ds_textarea_"+d.id })
				.attr("name", function(d){ return "square_Ds_textarea_"+d.id })
		

		if(typeof retrieveSquareParam(id, "Ds", false) != 'undefined'  && /^[A-Za-z0-9+/=][A-Za-z0-9+/=]*$/.test(retrieveSquareParam(id, "Ds", false))){
			$("#square_Ds_textarea_"+id).val(atob(retrieveSquareParam(id, "Ds")));
		}

		
	clusterSection.append("div")
		.classed("clr", true)


	
	if(aConnector == false){	
		// Additional data source path squares
		var clusterSection = thisForm.append("div")
			.classed("square_cluster_section", true)
			
			var clusterDiv = clusterSection.append("div")
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
						.html("Additional data Feeds Parent Squares (IDs comma separated): ")

				clusterDiv.append("div")
					.classed("square_cluster_text", true)
					.append("input")
					.classed("fontsize", true)
					.attr("id", function(d){ return "square_Ps_input_"+d.id })
					.attr("name", function(d){ return "square_Ps_input_"+d.id })
			

			// create a clone of the array (using Slice), then drop the first Parent (as not an "or" parent)
			var parentIDs = retrieveSquareParam(id, "Ps", false).slice(1)
			$("#square_Ps_input_"+id).val(parentIDs);

	}



	// Submit button
	var clusterSection = thisForm.append("div")
		.classed("square_cluster_section", true)
	var clusterDiv = clusterSection.append("div")
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
		//$("#square_buttonhere_"+id).append("<input type='button' value='Save Graph' onclick='window[graphs_functions_json.retrieveGraphParam(connectors.handletotype( retrieveSquareParam("+id+", \"CH\")), selectValue , \"processform\")]("+id+")' />")
		$("#square_buttonhere_"+id).append("<input type='button' value='Save Graph' onclick='editSquare("+id+")' />")
	}

}

