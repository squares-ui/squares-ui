graphs_functions_json.add_graphs_json({
	"elastic":{
		"Cloud":{
			"completeForm": "elastic_completeform_cloud",			
			"processForm": "elastic_processform_cloudt",			
			"populate": "elastic_populate_cloud",
			"rawtoprocessed":"elastic_rawtoprocessed_cloud",
			"graph":"elastic_graph_cloud",
			"about": "Cloud.",
		}
	}
});

function elastic_completeform_cloud(id, targetDiv){

	// called by editsquare allowing each square graph type to have custom 'parameters'
	// This function can potentially make multiple (async) queries to API and then apply output to a master JSON object.
	// Sync not an option
	// Async difficult to handle
	// promise.all appears to be the best way.  Construct the list of promises that will each master the jsonform{}

	const jsonform = {
		"schema": {
		  "custom_field": {
			"type": "string",
			"title": "Groupby", 
			"enum": []
			
		  }
		},
		"form": [
		  {
			"key": "custom_field"
	
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_field.enum = results
			$(targetDiv).jsonForm(jsonform)

		})




}


function elastic_populate_cloud(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");


	var to = moment(calcGraphTime(id, 'We', 0), "X").format();

	
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	
	var Ds = calcDs(id, []);
	
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	var fields=[retrieveSquareParam(id,"Cs",true)['custom_field']]

	var limit = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'dft_limit');

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}



function elastic_rawtoprocessed_cloud(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	var totalrows = data.length

	var field = retrieveSquareParam(id,"Cs")['custom_field']

	// count into {"first":1, "second":15}	
	var data2 = _.countBy(data, function(obj){
		return obj._source[field]
	})

	var max = _.max(_.each(data2, function(val, key){  return val }))


	// turn into array of objects
	var data3 = []
	var bigfontsize = 300
	_.each(data2, function(val, key){
		//data3.push({"text":key, "size":(val/totalrows)*100})
		data3.push({"text":key, "size":Math.floor((val/max)*bigfontsize)})
	})

	data3 = _.sortBy(data3, function(o){
		return o.size
	}).reverse()
	saveProcessedData(id, '', data3);

}


function elastic_graph_cloud(id){
	
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	

	var data = retrieveSquareParam(id, 'processeddata');
	
	// http://jsfiddle.net/ymmh9dLq/
	

	const custom_field = retrieveSquareParam(id,"Cs")['custom_field']

	const fill = d3.scaleOrdinal(d3.schemeCategory10);

	var layout = d3.layout.cloud()
		.size([width, height])
		.words(data)
		.padding(5)
		.rotate(function() { return ~~(Math.random() * 2) * 90; })
		.font("Impact")
		.fontSize(function(d) {
			return d.size
		})
		.on("end", draw);

	layout.start();

	function draw(words) {
		square.append("svg")
				.attr("width", layout.size()[0])
				.attr("height", layout.size()[1])
			.append("g")
				.attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
				.selectAll("text")
				.data(words)
			.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Impact")
				.style("fill", function(d, i) { return GLB.color(i) })
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; })
				.on("click", function(d){
					clickObject = btoa('[{"match":{"'+custom_field+'":"'+d.text+'"}}]');
					childFromClick(id, {"y": 1000, "Ds": clickObject} );
				})
				.on("mouseover", function(d) {
					theData = d.text+", Count: "+d.size
					setHoverInfo(id, theData)
				})
				

	}



}


