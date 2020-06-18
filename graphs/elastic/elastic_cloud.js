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


	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')


	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
			
			var dropdownFields = []
			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			var subResults = _.omit(results, "")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
			var dropdownFields = _.sortBy(dropdownFields, function(element){ return element})
			
			const jsonform = {
				"schema": {
					"x_field": {
						"type": "string",
						"title": "Groupby", 
						"enum": dropdownFields
						
					}
				},
				"form": [
					{
						"key": "x_field"
				
					}
				],
				"value":{}
			}

			
			if(retrieveSquareParam(id,"Cs",false) !== undefined){
                jsonform.value.x_field = retrieveSquareParam(id,"Cs",false)['x_field']
			}

			$(targetDiv).jsonForm(jsonform)

		})




}


function elastic_populate_cloud(id){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var Ds = clickObjectsToDataset(id)
	
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	var fields=[retrieveSquareParam(id,"Cs",true)['x_field']]

	var limit = 1;
	var stats = false
	var statField = null
	var incTime = true
	var urlencode = false


	var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode)

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}



function elastic_rawtoprocessed_cloud(id){

	// count into [{"name":"bob", "size":1}. {}]

	var data = retrieveSquareParam(id, 'rawdata_'+'')['aggregations']['time_ranges']['buckets'][0]['field']['buckets']

	var bigfontsize = 120 // biggest font for 20 chars?


	var max = _.max(data, function(obj){
		return obj['doc_count']
	})
	
	var dataout = []
	_.each(data, function(obj){
		//miniobject
		mo = {}
		mo['text'] = obj['key']
		mo['size'] = Math.floor((obj['doc_count']/max['doc_count'])*bigfontsize)
		mo['fullText'] = obj['key']
		mo['count'] = obj['doc_count']
		dataout.push(mo)
	})

	saveProcessedData(id, '', dataout);

}


function elastic_graph_cloud(id){
	
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
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
	
	const x_field = retrieveSquareParam(id,"Cs")['x_field']

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
					// clickObject = btoa('[{"match":{"'+x_field+'":"'+d.text+'"}}]');
					// childFromClick(id, {"y": 1000, "Ds": clickObject} );
					clickObject = {"compare":[], "notexist":[], "timerange":[]}

					if(d.name == "null"){
						clickObject.notexist.push(d.name)
					}else{
						miniObj ={}
						miniObj[x_field] = d.fullText
						clickObject.compare.push(miniObj)
					}
					
					clickObject = btoa(JSON.stringify(clickObject));
					childFromClick(id, {"y": 1000, "Ds": clickObject} );


				})
				.on("mouseover", function(d) {
					theData = d.fullText+", Count: "+d.count
					setHoverInfo(id, theData)
				})
				

	}



}


