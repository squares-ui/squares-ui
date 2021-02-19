
graphs_functions_json.add_graphs_json({
	"introduction":{
		"demoMode":{
			"populate":"populate_demoMode", 
			"rawtoprocessed":"process_demoMode",
			"param": "", 
			"graph":"graph_demoMode",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_demoMode(id){

	promises = []
	promises.push(id)
	// demoMode squares should get fresh data every time
	return Promise.all(promises)

}




function process_demoMode(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	return ""

}

async function graph_demoMode(id, data){

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
		<h1>Square-UI.com Demo Mode Enabled</h1>
		
		<div class='fleft'><h2>Squares-ui has detected you are browsing the 'Web hosted demo platform', dummy data will be used (i.e. no real connection to backend data).</h2></div>
		<div class='clr'></div>
	
		<div class='fleft'><h2>The rest of the platform is unaffected, you can move, pivot, etc.</h2></div>		
		<div class='clr'></div>
	
		<div class='fleft'><h2>The square below this is a Root Square, feel free to start building blocks from here.</h2></div>		
		<div class='clr'></div>
		
		<div class='fleft'><h2>To properly experience Squares-UI, visit the GitHub page to learn how to pull the projuect local and conenct to your Security Onion.</h2></div>		
		<div class='clr'></div>
	`
	theBody.html(thisString);


}



