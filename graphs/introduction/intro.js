
graphs_functions_json.add_graphs_json({
	"introduction":{
		"intro":{
			"populate":"populate_intro", 
			"rawtoprocessed":"process_intro",
			"param": "", 
			"graph":"graph_intro",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_intro(id){

	promises = []
	promises.push(id)
	// intro squares should get fresh data every time
	return Promise.all(promises)


}


// id:1 = "welcome to squares"
// id:2 = how to, github link
// id:3 = add ip:port
// id:4 = list, stats, delete ip:port


function process_intro(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	return ""
}

async function graph_intro(id, data){

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
		<h1>Welcome to SQUARES-UI !</h1>
		<br>
		<h2>An interface to Explore data, with a twist: each page is more than just 1 time frame, 1 graph type, and 1 data subselection.</h2>
		<br>
		<h2>Enjoy !</h2>
		<br>
		<a href='https://github.com/squares-ui/squares-ui'>GitHub</a>
		<br>
		<a href=''>Youtube</a>
	`	
	
	theBody.html(thisString);





}



