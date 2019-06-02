graphs_functions_json.add_graphs_json({
	"elastic":{
		"TSNE-JS":{
			"completeForm": "elastic_completeform_tsnejs",
			"populate": "elastic_populate_tsnejs",
			"rawtoprocessed":"elastic_rawtoprocessed_tsnejs",
			"param": "", 
			"graph":"elastic_graph_tsnejs",
			"about": "T-SNE based upon 2 fields",
		}
	}
});


function elastic_completeform_tsnejs(id, targetDiv){
	
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
			},
			"custom_third": {
				"type": "string",
				"title": "Third", 
				"enum": []
			}
		},
		"form": [
		  {
				"key": "custom_first",
		  },
		  {
				"key": "custom_second",
		  },
		  {
				"key": "custom_third",
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_first.enum = results
			jsonform.schema.custom_second.enum = results
			jsonform.schema.custom_third.enum = results
			$(targetDiv).jsonForm(jsonform)

		})
}


function elastic_populate_tsnejs(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	var Ds = calcDs(id, []);
	

	firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	thirdBy = retrieveSquareParam(id,"Cs")['custom_third']
	var fields=[firstBy, secondBy, thirdBy]
	
	var limit = 10000;
	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}


function elastic_rawtoprocessed_tsnejs(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	const thirdBy = retrieveSquareParam(id,"Cs")['custom_third']


	data2 = _.map(data, function(i){
		return [i._source[firstBy], i._source[secondBy], i._source[thirdBy] ]
	})

	var filtereddata = _.filter(data2, function(i) {
		// remove "null" for rows that did not parse into Elastic right
		return i[0] != null;
	})



	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', filtereddata);

}


function elastic_graph_tsnejs(id){
	
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



	var opt = {epsilon: 10};
	var tsne = new tsnejs.tSNE(opt);

	tsne.initDataDist(data)

	for(var k = 0; k < 50; k++) {
		tsne.step(); // every time you call this, solution gets better
	}	

	var Y = tsne.getSolution();

	qq("Y")
	qq(Y)

}


