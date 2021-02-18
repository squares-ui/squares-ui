graphs_functions_json.add_graphs_json({
	"builtin":{
		"DescribeSquare":{
			"populate":"populate_describesquare", 
			"rawtoprocessed":"process_describesquare",
			"param": "", 
			"graph":"graph_describesquare",
			"about": "",
			"datasetdesc": "heeeeeeeeere"
		}
	}
});

async function populate_describesquare(id){



	var promises = [id]
	var thisCo = await nameToConnectors(retrieveSquareParam(id, 'Co', true))
	
	if(thisCo['type'] == "elastic"){

		var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
		var thisIndex = "*"

		var to = calcGraphTime(id, 'We', 0)
		var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
		var timesArray = [[from, to]]

		var fields = []

		var limit = 1;
		var stats = false
		var statField = null
		var incTime = true
		var urlencode = false
		var filter = retrieveSquareParam(id,"Fi",true)

		var handle = retrieveSquareParam(id, 'CH')
		var maxAccuracy = true

		// query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)
		var query = await elasticQueryBuildderToRuleThemAllandOr(
			id, 
			timesArray, 
			limit,
			incTime,
			filter,
			false,
			"",
			true,
			maxAccuracy,
			fields, 
			stats, 
			statField	
		)

		promises.push(elastic_connector(thisDst, thisIndex, id, query, "all") )
	}
	
	return Promise.all(promises)

}
async function process_describesquare(id, data){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	return data = data[0]['data']['hits']['total']['value']
	
}

async function graph_describesquare(id, data){

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			// .classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });

	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var square = workspaceDiv.selectAll('#square_'+id);

	var aConnector = false;
	if(retrieveSquareParam(id, "Pr")==0){
		aConnector = true;
	}
	var thisCo = await nameToConnectors(retrieveSquareParam(id, 'Co', true))


	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+") aConnector="+aConnector);

	// Connector


	if(aConnector == true){	

		var clusterSection = square.append("div")
		.classed("square_cluster_section", true)

		var clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "./images/070_b.png")

		clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			.classed("square_cluster_text", true)

			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text("Connector:")
			clusterDiv.append("div")
				.classed("square_cluster_text", true)
				.append("div")
					.classed("fontsize", true)
					.text(thisCo['name']);				

	}else{

		
		var clusterSection = square.append("div")
		.classed("square_cluster_section", true)

		var clusterDiv = clusterSection.append("div")
			.classed("fleft", true)
			
		
		clusterDiv.append("img")
			.classed("square_cluster_image", true)
			.classed("fleft", true)
			.attr("src", "./images/125_b.png")

		clusterDiv = clusterSection.append("div")
			.classed("square_cluster_text", true)
			.classed("fleft", true);

		clusterDiv
			// .append("div")
			// 	.classed("fleft", true)
			// 	.classed("fontsize", true)
			// 	.text("Connector Handle:")
			.append("div")
				.classed("fontsize", true)
				.text(retrieveSquareParam(id, "CH"));
				
		clusterDiv.append("div")
			.classed("clr", true)
			
		clusterDiv
			// .append("div")
			// .classed("fleft", true)
			// 	.classed("fontsize", true)
			// 	.text("Graph Type:")
			.append("div")
				.classed("fontsize", true)
				.text(retrieveSquareParam(id, "Gt"));
	

	}
	
	clusterSection.append("div")
                .classed("clr", true)
	

	// Hits : 
	var clusterSection = square.append("div")
	.classed("square_cluster_section", true)

	var clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		
	clusterDiv.append("img")
		.classed("square_cluster_image", true)
		.classed("fleft", true)
		.attr("src", "./images/070_b.png")

	clusterDiv = clusterSection.append("div")
		.classed("fleft", true)
		.classed("square_cluster_text", true)

		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text("Hits:")

		if(data == 10000){
			dataString = "> 10,000"
		}else{
			dataString = data
		}

			clusterDiv.append("div")
		.classed("square_cluster_text", true)
		.append("div")
			.classed("fontsize", true)
			.text(dataString);	

	clusterSection.append("div")
	.classed("clr", true)

	// We Ws
	var clusterSection = square.append("div")
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

	var stringFormat = "YYYY-MM-DD, HH:mm:ss"
	var prettyString = moment(retrieveSquareParam(id, "We"), "X").format(stringFormat);

	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Window end:")
		.append("div")
			.text(prettyString);


	clusterDiv.append("div")
			.classed("fontsize", true)
			.text("Window Size:")
		.append("div")
			.text(countSeconds(retrieveSquareParam(id, "Ws")));


	// clusterDiv.append("div")
	// 		.classed("fontsize", true)
	// 		.text("Refresh:")
	// 	.append("div")
	// 		.text(countSeconds(retrieveSquareParam(id, "Wr")));

	clusterSection.append("div")
                .classed("clr", true)









	// Data Subset
	clusterSection = square.append("div")
		.classed("square_cluster_section", true)
	clusterDiv = clusterSection.append("div")
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

	var thisDataSet = "";
	if(retrieveSquareParam(id, "Ds") != null){
		thisDataSet = atob(retrieveSquareParam(id, "Ds"));
	}
	clusterDiv.append("div")
		clusterDiv.append("div")
			.classed("square_cluster_text", true)
			.append("div")
				.classed("fontsize", true)
				.text(thisDataSet);



}

