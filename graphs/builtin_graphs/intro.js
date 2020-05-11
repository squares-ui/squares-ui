
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

function populate_intro(id){
	// no back end data to fetch, but tell the system we're ready
	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+","+name+")");
	// connector_bypass(id);

	// lazy fix, XXX
	//Lockr.flush();
	if(id==3){
		connectors = connectors_json.get_connectors_json()
		if(_.keys(connectors).length > 0){
			
			found = []

			_.each(connectors, function(obj, i){
				//found.push(obj['desc'])
			
				var dst = obj['dst']
				var index = obj['index']

				elastic_test_connector(dst, index);
			})
		}
	}else{
		connector_bypass(id);
	}
}

function process_intro(id){
	
	
	if(id==3){

		data = []

		connectors = connectors_json.get_connectors_json()
		if(_.keys(connectors).length > 0){

			_.each(connectors, function(obj, i){

				var index = obj['index']
				var key = "rawdata_"+index

				found = retrieveSquareParam(id, key, false)

				miniObj = {}
				miniObj[obj['index']] = {found}
				data.push(miniObj)
		
			})
		}

		dataout = []

		_.each(data, function(obj, i){
			
			key = _.keys(obj)[0]
			
			miniObj = {}
			miniObj['desc'] = key
			miniObj['timed_out'] = obj[key]['found']['timed_out']
			miniObj['hits'] = obj[key]['found']['hits']['total']
			

			dataout.push(miniObj)
		})

		saveProcessedData(id, '', dataout);

	}else{

		saveProcessedData(id, '', "");
	}
}

function graph_intro(id){


	qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	var data = retrieveSquareParam(id, 'processeddata');

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
			<div class='fleft square_menu_icon'><img src='images/093_b.png' ></div>
			<div class='clr'></div>
		
			<div class='fleft'><h2>Edit this 'Connector' Square directly to configure which Connector to use:</h2></div>
			<div class='fleft square_menu_icon'><img src='images/128_b.png' ></div>
			<div class='clr'></div>
		
			<div class='fleft'><h2>Save your choice. Finally from this 'Connector' square, start making Child squares:</h2></div>
			<div class='fleft square_menu_icon'><img src='images/103_b.png' ></div>
			<div class='clr'></div>
			
			<div class='fleft'><h2>Set a graph type, define the graph, view the results, click on the graph to drill down.</h2></div>
			<div class='fleft'><h2>Repeat this process exploring your data.</h2></div>
			<div class='clr'></div>
		`
		$("#square_bodyhtml_"+id).html(thisString);
	
	}else if(id == 3){


		var header = d3.select("#square_bodyhtml_"+id).append("div").html("<h1>Connectors Check</h1><br>")
		
		if(data.length > 0){
			d3.select("#square_bodyhtml_"+id).append("div").html("<h3>A look at the configured connectors and whether we can connect and find data.</h1><br>")
		}else{
			d3.select("#square_bodyhtml_"+id).append("div").html("<h1>No Connectors were defined.  Please check /html/connectors/*.json </h1><br>")
		}

		var table  = d3.select("#square_bodyhtml_"+id).append("table")
			.classed("tablesorter", true)
			.attr("id", "square_"+id+"_table")

		var header = table.append("thead").append("tr");
		header
			.selectAll("th")
			.data(["Desc", "Connected", "Data"])
			.enter()
			.append("th")
			.text(function(d) { return d; });

		$("#square_"+id+"_table").append("<tbody></tbody");
		_.each(data, function(obj,i){

			name = obj['desc']

			if(obj['timed_out'] == false){
				connected = "True"
			}else{
				connected = "False"
			}

			if(obj['hits'] > 0 ){
				hits = "True"
			}else{
				hits = "False"
			}



			$("#square_"+id+"_table").find('tbody').append("<tr><td>"+name+"</td><td>"+connected+"</td><td>"+hits+"</td><tr>");

		})

		$("#square_"+id+"_table").tablesorter({
			sortList: [[1,1], [2,2]]
			
		});

		// thisString = "asdasd"
		// $("#square_bodyhtml_"+id).html(thisString);
	}	

}


