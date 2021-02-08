
graphs_functions_json.add_graphs_json({
	"introduction":{
		"instructions":{
			"populate":"populate_instructions", 
			"rawtoprocessed":"process_instructions",
			"param": "", 
			"graph":"graph_instructions",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_instructions(id){

	promises = []
	promises.push(id)
	// instructions squares should get fresh data every time
	return Promise.all(promises)

}


// id:1 = "welcome to squares"
// id:2 = how to, github link
// id:3 = add ip:port
// id:4 = list, stats, delete ip:port


function process_instructions(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	return ""

}

async function graph_instructions(id, data){

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
			
		
	thisString = `
		<h1>Quick Instructions</h1>
		
		<div class='fleft'><h2>Use the icons across the bottom to create a new Connector:</h2></div>
		<div class='fleft square_menu_icon'><img src='squares-ui-icons/159122-technology-icon-collection/svg/browser-8.svg' ></div>
		<div class='clr'></div>
	
		<div class='fleft'><h2>Edit this 'Connector' Square directly to configure which Connector to use:</h2></div>
		<div class='fleft square_menu_icon'><img src='squares-ui-icons/159687-interface-icon-assets/svg/edit.svg' ></div>
		<div class='clr'></div>
	
		<div class='fleft'><h2>Save your choice. Finally from this 'Connector' square, start making Child squares:</h2></div>
		<div class='fleft square_menu_icon'><img src='squares-ui-icons/126466-multimedia-collection/svg/copy.svg' ></div>
		<div class='clr'></div>
		
		<div class='fleft'><h2>Set a graph type, define the graph, view the results, click on the graph to drill down.</h2></div>
		<div class='fleft'><h2>Repeat this process exploring your data.</h2></div>
		<div class='clr'></div>
	`
	theBody.html(thisString);


}



