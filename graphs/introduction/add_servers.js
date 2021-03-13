
graphs_functions_json.add_graphs_json({
	"introduction":{
		"addServers":{
			"populate":"populate_addServers", 
			"rawtoprocessed":"process_addServers",
			"param": "", 
			"graph":"graph_addServers",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_addServers(id){

	promises = []
	promises.push(id)
	return Promise.all(promises)


}


// id:1 = "welcome to squares"
// id:2 = how to, github link
// id:3 = add ip:port
// id:4 = list, stats, delete ip:port


function process_addServers(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	return ""

}

async function graph_addServers(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

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



	// Connector
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)

	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		// .attr("src", "./images/070_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)
		

		theBody = clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.attr("id", "square_bodyhtml_"+id)
				.classed("fontsize", true)
				// .html(bodies[id])
				
			
	
	theBody.append("div").html("<h1>Add remote location:</h1>")

	// name
	theBody.append("div").html("<h3>Name (unique):</h3>")
	theBody.append("div").append("input").attr("id", function(d){ return "square_remoteDataSource_name_"+d.id })
			
	// dst
	theBody.append("div").html("<h3>Please enter the ip:port of your elastic server</h3>")
	theBody.append("div").append("input").attr("id", function(d){ return "square_remoteDataSource_dst_"+d.id }).attr("placeholder", "e.g. 192.168.0.1:9200")
	
	// type
	theBody.append("div").html("<h3>Type:</h3>")
	theBody.append("div").append("select").attr("id", function(d){ return "square_remoteDataSource_type_"+d.id })
	$('#square_remoteDataSource_type_'+id).append($('<option>', { 
		value: "elastic",
		text : "elastic"
	}));	

	// // favs / imports / templates
	// theBody.append("div").html("<h3>Type:</h3>")
	// theBody.append("div").append("select").attr("id", function(d){ return "square_remoteDataSource_templates_"+d.id })
	// $('#square_remoteDataSource_templates_'+id).append($('<option>', { 
	// 	value: "so-*",
	// 	text : "Security Onion (all)"
	// }));					
		
	

	
	// submit
	theBody.append("div").html("<input type='button' value='Add' onclick='addRemoteDataSourceToCookie("+id+"); reloadData([4])' />");

	theBody.append("div").classed("clr", true).html("<br>")

	theBody.append("div").html("<h1>About:</h1>")
	theBody.append("div").html("<h3>These server details are saved in IndexedDB (local to your browser). Data requests originate from your browser, not the Web server.</h3>")



}



