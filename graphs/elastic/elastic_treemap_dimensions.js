graphs_functions_json.add_graphs_json({
	"elastic":{
		"TreemapDimensions":{
			"completeForm": "elastic_completeform_treemapdimensions",
			"populate": "elastic_populate_treemapdimensions",
			"rawtoprocessed":"elastic_rawtoprocessed_treemapdimensions",
			"param": "", 
			"graph":"elastic_graph_treemapdimensions",
			"about": "Treemap for multiple dimensions.",
		}
	}
});


function elastic_completeform_treemapdimensions(id, targetDiv){
	
	const jsonform = {
		"schema": {
		  "custom_first": {
			"type": "string",
			"title": "First", 
			"enum": []
		  },
		  "custom_second": {
			"type": "string",
			"title": "Second", 
			"enum": []
		  }
		},
		"form": [
		  {
			"key": "custom_first",
			
		  },
		  {
			"key": "custom_second",
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_first.enum = results
			jsonform.schema.custom_second.enum = results
			$(targetDiv).jsonForm(jsonform)

		})
}


function elastic_populate_treemapdimensions(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	var Ds = calcDs(id, []);
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	//var fields=[retrieveSquareParam(id,"Cs",true)['custom_field'],"client_ip"]

	firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	var fields=[firstBy, secondBy]
	
	var limit = 10000;
	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}


function elastic_rawtoprocessed_treemapdimensions(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']

	data2 = _.map(data, function(i){
		return {firstBy: i._source[firstBy], secondBy: i._source[secondBy]}
	})

	// now nest the results into layers
	// http://bl.ocks.org/phoebebright/raw/3176159/
	var nested_data = d3.nest()
		.key(function(d) { return d.firstBy; })
		.key(function(d) { return d.secondBy; })
		.rollup(function(leaves) { return leaves.length; })
		.entries(data2);	


	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', {"key":"flare:", "values":nested_data});

}


function elastic_graph_treemapdimensions(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		.attr("id", function(d){ return "square_"+d.id })
		.style("position", "relative")
		.style("width", "100%")
		.style("height", "100%")
		.style("left", 0 + "px")
		.style("top", 0 + "px")

			
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']

	const treemap = d3.treemap().size([width, height]);

	color = d3.scaleOrdinal().range(d3.schemeCategory20c);

	const root = d3.hierarchy(data, (d) => d.values)
    .sum((d) => d.value);
	const hoverinfo = d3.select("#hoverInfo")


	const tree = treemap(root);

	const node = square.datum(root).selectAll(".node")
		.data(tree.leaves())
  	.enter().append("div")
		.style("left", (d) => d.x0 + "px")
		.style("top", (d) => d.y0 + "px")
		.style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
		.style("height", (d) => Math.max(0, d.y1 - d.y0  - 1) + "px")
		.style("background", function(d){ return GLB.color(d.parent.data.key)})
		
		.style("position", "absolute")
		.style("overflow", "hidden")
		.style("word-wrap", "break-word")
		.text((d) => d.data.key+" "+d.parent.data.key)
		.on("click", function(d) {

		})	
		.on("mouseover", function(d) {
			theData = d.data.key+" & "+d.parent.data.key + ": count="+d.data.value
			setHoverInfo(id, theData)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			clickObject = btoa('[{"match":{"'+firstBy+'":"'+d.parent.data.key+'"}}, {"match":{"'+secondBy+'":"'+d.data.key+'"}}]');
			childFromClick(id, {"y": 1000, "Ds": clickObject} );
		})

}


