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

async function elastic_completeform_cloud(id, targetDiv){

	// called by editsquare allowing each square graph type to have custom 'parameters'
	// This function can potentially make multiple (async) queries to API and then apply output to a master JSON object.
	// Sync not an option
	// Async difficult to handle
	// promise.all appears to be the best way.  Construct the list of promises that will each master the jsonform{}


	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')
	var thisMappings = await getSavedMappings(dst, indexPattern)


	var dropdownFields = []
	
	_.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})
			
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
	var filter = combineScriptFilter(id)

	var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)
	var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");

	
	var promises = []
	promises.push(elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "all"))
	return Promise.all(promises)

}



function elastic_rawtoprocessed_cloud(id, data){

	// count into [{"name":"bob", "size":1}. {}]

	// var data = retrieveSquareParam(id, 'rawdata_'+'')['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	
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
		mo['count'] = obj['doc_count']
		dataout.push(mo)
	})

	// saveProcessedData(id, '', dataout);
	return dataout


}


function elastic_graph_cloud(id, data){
	
	
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
	
	var colorScale = d3.scaleOrdinal().range(GLB.color)


	// http://jsfiddle.net/ymmh9dLq/
	
	const x_field = retrieveSquareParam(id,"Cs")['x_field']

	var layout = d3.layout.cloud()
		.size([width, height])
		.words(data)
		.padding(5)
		.rotate(function() { return ~~(Math.random() * 2) * 90; })
		.fontSize(function(d) {
			return d.size
		})
		.on("end", draw);

	layout.start();



	function draw(words) {
		
		square
			.append("g")
				.attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
				.selectAll("text")
				.data(words)
			.enter().append("text")
				.classed("cloudText", true)
				.style("font-size", function(d) { return d.size + "px"; })
				.style("fill", function(d, i) { 
					return colorScale(i)
				})
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { 
					if(d['text'].length>8){
						return d.text.substring(1, 5);
					}else{
						return d.text; 
					}
				})
				.on("click", function(d){
					var clickObject = {"compare":[], "notexist":[], "timerange":[]}

					if(d.name == "null"){
						clickObject.notexist.push(d.name)
					}else{
						var miniObj ={}
						miniObj[x_field] = d.text
						clickObject.compare.push(miniObj)
					}
					
					clickObject = btoa(JSON.stringify(clickObject));
					childFromClick(id, {"y": 1000, "Ds": clickObject} );


				})
				.on("mouseover", function(d) {
					var theData = d.text+", Count: "+d.count
					setHoverInfo(id, theData)
				})
				

	}



}


