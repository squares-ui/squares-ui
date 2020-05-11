graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
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
	connector_bypass(id);

}
function process_templates(id){
	
	saveProcessedData(id, '', "");
}

function graph_templates(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);


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
		aConnector = true;
	}
	


	// Apply Template
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
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
				.text("Apply Template")
		// clusterDiv.append("div")
		// 	.classed("square_cluster_text", true)
		// 	.append("div")
		// 		.classed("fontsize", true)
		// 		.text(retrieveSquareParam(id, "CH"));



	////////////////////////////////////
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
				.text("Clone 'Graph Type' (not dataset) to me from:")
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



	////////////////////////////////////
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





	////////////////////////////////////
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
				.text("Move me to:")
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



	////////////////////////////////////
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
				.text("Apply 'Favourite' to me:")
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
		

		favourites = connectors_json.handletox(retrieveSquareParam(id, "CH"), "favourites");
		_.each(favourites, function(favourite){
			mySelectt.append(
				$('<option></option>').val(favourite.uid).html(favourite.printable)
			);	
		})

		$("#square_template_apply_favourite").append("<input type='button' id='template_id_apply_favourite' value='Import Favourite' />");
		$("#template_id_apply_favourite").bind("click",  function(){  importSquareFavourite(id, $('#template_apply_favourite').val())}  );





}


