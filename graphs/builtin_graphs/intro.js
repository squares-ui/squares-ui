
graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
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

	// XXX Shouldn't be handled here
	await deleteStoredData([id])

	promises = []
	if(id==3){
		_.each(connectors.get_connectors(), function(connector){
			var dst = connector['dst']
			_.each(connector['indices'], function(index){
				promises.push(elastic_test_connector(id, dst, index['indexPattern']) )

			})
		})
	}
	
	// intro squares should get fresh data every time
	return Promise.all(promises)


}



function process_intro(id, data){
	//qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	if(id==3){
	
		
			var dataout = []
			
			// this function runs once per connector installed, each time updating with latest info
			_.each(data, function(indexResults){
				miniObj = {}
				miniObj['indexPattern'] = indexResults['name']
				

				if(indexResults['data'].hasOwnProperty('took')){
					miniObj['status'] = "Success"
					
					miniObj['hits'] = indexResults['data']['hits']['total']['value']
					// if(indexResults['data']['hits']['total']['value'] != 0){
					// 	
					// }else{
					// 	miniObj['hits'] = "0"
					// }

				}else{
					miniObj['status'] = indexResults['error']
					miniObj['hits'] = "-"
				}
				
				dataout.push(miniObj)
			})

				
			return dataout
		
	}else{
		return "empty"
	}
}

function graph_intro(id, data){

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
				
				
	
	if(id == 1){
		
		thisString = `
			<h1>Welcome to SQUARES-UI !</h1>
			<br>
			<h2>An interface to Explore data, with a twist: each page is more than just 1 time frame, 1 graph type, and 1 data subselection.</h2>
			<br>
			<h2>Enjoy !</h2>
			<br>
			<h2>GitHub</h2>
			<a href='https://github.com/squares-ui/squares-ui'>GitHub Pages</a>
			<h2>Video Tutorial</h2>
			<a href='https://github.com/squares-ui/squares-ui'>Link</a>
		`	
		
		$("#square_bodyhtml_"+id).html(thisString);


	}else if(id == 2){
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
		$("#square_bodyhtml_"+id).html(thisString);
	
	}else if(id == 3){


		var header = d3.select("#square_bodyhtml_"+id).append("div").html("<h1>Connectors Check</h1><br>")
		
		if(data.length < 1){
			d3.select("#square_bodyhtml_"+id).append("div").html("<h1>No Connectors were defined.  Please check <html>/connectors/*.json <br><br>Please complete &lt;all_fields&gt;</h1><br>")
			return
		}
		
		d3.select("#square_bodyhtml_"+id).append("div").html("<h3>A look at the configured connectors and whether we can connect and find data.</h1><br>")
		
		var table  = d3.select("#square_bodyhtml_"+id).append("table")
			.classed("tablesorter", true)
			.attr("id", "square_"+id+"_table")

		var header = table.append("thead").append("tr");
		header
			.selectAll("th")
			.data(["indexPattern", "Connected", "Data", ""])
			.enter()
			.append("th")
			.text(function(d) { return d; });

		$("#square_"+id+"_table").append("<tbody></tbody");
		_.each(data, function(obj,i){



			var img = "<img style='width:32px; margin-left:32px' class='squaresmenuslot fleft squaresmenu_addconnector' onclick='addGraphConnector(\""+connectors.indexPatterntox(obj['indexPattern'], "handle")+"\")' alt='showConnectors' title='Create new Connector' />"

			$("#square_"+id+"_table").find('tbody').append("<tr><td>"+obj['indexPattern']+"</td><td>"+obj['status']+"</td><td>"+obj['hits']+"</td><td>"+img+"</td><tr>");

		})

		$("#square_"+id+"_table").tablesorter({
			sortList: [[1,1], [2,2]]
			
		});

		// thisString = "asdasd"
		// $("#square_bodyhtml_"+id).html(thisString);
	}	

}


