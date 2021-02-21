graphs_functions_json.add_graphs_json({
	"builtin":{
		"Templates":{
			"populate":"populate_templates", 
			"rawtoprocessed":"process_templates",
			"param": "", 
			"graph":"graph_templates",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

function populate_templates(id){

	// no back end data to fetch, but tell the system we're ready
	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+","+name+")");
	
	promises = [id]
	return Promise.all(promises)


}
function process_templates(id, data){
	
	return ""
}

function graph_templates(id, data){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);


	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
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
	
	var square = workspaceDiv.selectAll('#square_'+id);

	var aConnector = false;
	if(retrieveSquareParam(id, "Pr")==0){
		qq("Tempate for a connector")
		aConnector = true;
	}
	
	// Title
	var clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		// .attr("src", "./images/139_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Templates and Management")


	/////////////////Apply Favourite///////////////////
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/239_b.png")

	
	var favourites = GLB.favourites

	if(favourites.length>0){

		clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true);

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Apply a 'Template' to me:")
				.append("div")
				.append("select")
					.classed("fontsize", true)
					.attr("id", function(d){ return "template_apply_favourite" })
					.attr("name", function(d){ return "template_apply_favourite" })

		clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true)
			
			clusterDiv.append("div")
				.attr("id", function(d){ return "square_template_apply_favourite" })
			var mySelectt = $('#template_apply_favourite');
			

			_.each(favourites, function(favourite){
				mySelectt.append(
					$('<option></option>').val(favourite.uid).html(favourite.printable+" ("+favourite.Gt+")")
				);	
			})

			$("#square_template_apply_favourite").append("<input type='button' id='template_id_apply_favourite' value='Import Favourite' />");
			$("#template_id_apply_favourite").bind("click",  function(){  importSquareFavourite(id, $('#template_apply_favourite').val())}  );

		}else{



			clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true);

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					// CSS breaks on "-", replace with char friendly unicode
					.html("No favourites saved for: "+retrieveSquareParam(id, 'CH', true).replaceAll("-", "&#8209;") )
					
				
					clusterDiv = clusterSection.append("div")
					.classed("square_cluster_text", true)
					.classed("fleft", true)
					
					clusterDiv.append("div")

		}








	///////////////clone config from/////////////////////
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/239_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Clone the definition to me from:")
			.append("div")
			.append("select")
				.classed("fontsize", true)
				.attr("id", function(d){ return "template_id_dst" })
				.attr("name", function(d){ return "template_id_dst" })

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		
		clusterDiv.append("div")
			.attr("id", function(d){ return "square_template_pull_graph" })
		var mySelectt = $('#template_id_dst');
		$.each(everyID(), function(i, v){
			mySelectt.append(
				$('<option></option>').val(v).html("Square #"+v)
			);
		});
		$("#square_template_pull_graph").append("<input type='button' id='template_id_dst_button' value='Clone Config' />");
		$("#template_id_dst_button").bind("click",  function(){  cloneTemplate(id, parseInt($('#template_id_dst').val()) )}  );



	//////////////////Clone children from//////////////////
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/239_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Clone the children to me from:")
			.append("div")
			.append("select")
				.classed("fontsize", true)
				.attr("id", function(d){ return "template_id_src" })
				.attr("name", function(d){ return "template_id_src" })

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		
		clusterDiv.append("div")
			.attr("id", function(d){ return "square_template_pull_children" })
		var mySelectt = $('#template_id_src');
		$.each(everyID(), function(i, v){
			mySelectt.append(
				$('<option></option>').val(v).html("Square #"+v)
			);
		});
		$("#square_template_pull_children").append("<input type='button' id='template_id_src_button' value='Clone Children' />");
		$("#template_id_src_button").bind("click",  function(){  cloneChildren(id, parseInt($('#template_id_src').val()))}  );





	///////////////////Move me to /////////////////
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
		.classed("fleft", true);
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/239_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true);

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Move this square to underneath:")
			.append("div")
			.append("select")
				.classed("fontsize", true)
				.attr("id", function(d){ return "template_id_move" })
				.attr("name", function(d){ return "template_id_move" })

	clusterDiv = clusterSection.append("div")
		.classed("square_cluster_text", true)
		.classed("fleft", true)
		
		clusterDiv.append("div")
			.attr("id", function(d){ return "square_template_move_me" })
		var mySelectt = $('#template_id_move');
		$.each(everyID(), function(i, v){
			mySelectt.append(
				$('<option></option>').val(v).html("Square #"+v)
			);
		});
		$("#square_template_move_me").append("<input type='button' id='template_id_move_button' value='Move' />");
		$("#template_id_move_button").bind("click",  function(){  setSquareParam(id, "Pr", parseInt($('#template_id_move').val()), true)}  );




	// ///////////////////// pivot to a new tab///////////////
	// clusterSection = square.append("div")
	// 	.classed("square_cluster_section", true)
	// clusterDiv = clusterSection.append("div")
	// 	.classed("fleft", true);
	// clusterDiv.append("img")
	// 	.classed("square_cluster_image", true)
	// 	.classed("fleft", true)
	// 	.attr("src", "./images/239_b.png")

	// clusterDiv = clusterSection.append("div")
	// 	.classed("square_cluster_text", true)
	// 	.classed("fleft", true);

	// 	clusterDiv.append("div")
	// 		.classed("square_cluster_text", true)
	// 		.append("div")
	// 			.classed("fontsize", true)
	// 			.text("Pivot this square to a new browser Tab")
	// 		.append("div")
			

	// clusterDiv = clusterSection.append("div")
	// 	.classed("square_cluster_text", true)
	// 	.classed("fleft", true)
		
	// 	clusterDiv.append("div")
	// 		.attr("id", function(d){ return "square_template_pivot_new_root" })
		

	// 	$("#square_template_pivot_new_root").append("<input type='button' id='template_pivot_new_root' value='Piot New Tab' />");
	// 	$("#template_pivot_new_root").bind("click",  function(){  pivotNewTab(id) }  );



	/////////////////Create a Favourite///////////////////
	
	if(GLB.devMode){
		favString = {}
		
		favString['printable'] = "x"
		favString['Gt'] = retrieveSquareParam(id,"Gt",true)
		favString['Cs'] = retrieveSquareParam(id,"Cs",true)
		
		// favString['uid'] =  String(CryptoJS.MD5(connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")))
		favString['uid'] =  String(CryptoJS.MD5(JSON.stringify(favString)))
		
		clusterSection = square.append("div")
			.classed("square_cluster_section", true)
		clusterDiv = clusterSection.append("div")
			.classed("fleft", true);
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "./images/239_b.png")


		clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true);

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("This square as a Favourite:")
				.append("div")
				.append("div")
					.classed("fontsize", true)
					.text(JSON.stringify(favString))

		clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true)
			
			clusterDiv.append("div")
				.attr("id", function(d){ return "square_template_asa_favourite" })
				
	}	
		




}


