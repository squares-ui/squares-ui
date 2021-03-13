
graphs_functions_json.add_graphs_json({
	"introduction":{
		"listServers":{
			"populate":"populate_listServers", 
			"rawtoprocessed":"process_listServers",
			"param": "", 
			"graph":"graph_listServers",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_listServers(id){

	// XXX Shouldn't be handled here
	await deleteStoredData([id])

	promises = []
	promises.push(id)

	_.each(_.where(await getAllSavedConnectors(), {"type":"elastic"}), function(connector){
		if(connector['name'] !== "Dummy"){
			var dst = connector['dst']
			var name = connector['name']
			promises.push(elastic_test_connector(id, name, dst) )
		}
	})
	// qq(promises)
	return Promise.all(promises)

}


// id:1 = "welcome to squares"
// id:2 = how to, github link
// id:3 = add ip:port
// id:4 = list, stats, delete ip:port


async function process_listServers(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");
	
	var dataout = []
	
	// this function runs once per connector installed, each time updating with latest info
	_.each(data, function(dstResults){
		miniObj = {}

		miniObj['name'] = dstResults['name']
		miniObj['dst'] = dstResults['dst']
		miniObj['type'] = dstResults['type']

		if(dstResults['data'].hasOwnProperty('took')){

			miniObj['status'] = "Yes"
			miniObj['hits'] = dstResults['data']['hits']['total']['value']

		}else{
			
			miniObj['status'] = dstResults['data']['error']
			miniObj['hits'] = "-"
		}
		
		dataout.push(miniObj)
	})

		
	return dataout
		

}

async function graph_listServers(id, data){

	// qq(data)
	// qq("data here")

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
				
		

	var header = theBody.append("div").html("<h1>Remote data locations</h1><br>")
	
	// if(data.length < 1){
	// 	theBody.append("div").html("<h1>No Connectors were defined.  Please check <html>/connectors/*.json <br><br>Please complete &lt;all_fields&gt;</h1><br>")
	// 	return
	// }
	
	theBody.append("div").html("<h3>A look at the configured connectors and whether we can connect and find data.</h1><br>")
	
	var table  = theBody.append("table")
		.classed("tablesorter", true)
		.attr("id", "square_"+id+"_table")

	var header = table.append("thead").append("tr");
	header
		.selectAll("th")
		.data(["Name", "Connection", "Hits", "Pivot", "Del"])
		.enter()
		.append("th")
		.text(function(d) { return d; });

	$("#square_"+id+"_table").append("<tbody></tbody");
	_.each(data, function(obj,i){
		
		var newImg = "<img src='./squares-ui-icons/159122-technology-icon-collection/svg/browser-8.svg' class='squaresmenuslot imageListServers' onclick='addGraphConnector({\"Co\":\""+obj['name']+"\"})' alt='showConnectors' title='Create new Connector' />"
		var deleteImg = "<img src='./squares-ui-icons/126466-multimedia-collection/svg/garbage.svg' class='squaresmenuslot imageListServers' onclick='deleteConnectors(\""+obj['name']+"\"); reloadData([4])' alt='deleteConnectors' title='Delete Connector' />"
		
		if(obj['hits'] > 0){
			var thisHits = "Yes"
		}else{
			var thisHits = "No"
		}

		$("#square_"+id+"_table").find('tbody').append("<tr><td>"+obj['name']+"</td><td>"+obj['status']+"</td><td>"+thisHits+"</td><td style='border:0px; padding:0px;'>"+newImg+"</td><td style='border:0px; padding:0px;' >"+deleteImg+"</td><tr>");

	})

	$("#square_"+id+"_table").tablesorter({
		sortList: [[1,1], [2,2]]
		
	});

	// thisString = "asdasd"
	// $("#square_bodyhtml_"+id).html(thisString);
	
	



}



