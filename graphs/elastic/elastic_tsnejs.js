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
	
	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			var dropdownFields = []
			
			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			subResults = _.omit(results, "")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
			dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

			const jsonform = {
				"schema": {
					"x_arr": {
						"type":"array",
						"maxItems": 4,
						"minItems": 1,
						"items":{
							"type": "object",
							"properties":{
								"field":{
									"title": "field",
									"type": "string",
									"enum": dropdownFields,
								}
							}	
						}
					}
				},
				"form": [
					{
				 		"type": "array",
						 "notitle": true,
						 "items": [{
							"key": "x_arr[]",				 	  		
						 
						}], 
				   	}
				],
				"value":{}
			}	

			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['array'] !== null ){
					jsonform.value = {}
					jsonform.value['x_arr'] = []
					_.each(retrieveSquareParam(id,"Cs",false)['array'], function(key,num){
						jsonform.value['x_arr'].push({"field": key})
					})
				}
				
				if(retrieveSquareParam(id,"Cs",false)[' x_null']){
					jsonform.form[1]['value'] = 1
				}

				if(retrieveSquareParam(id,"Cs",false)['x_scale']){
					jsonform.form[2]['value'] = retrieveSquareParam(id,"Cs",false)['x_scale']
				}

			}else{
				//create default layout
				jsonform.value['x_arr'] = []
				jsonform.value['x_arr'].push({})
				
				jsonform.form[1]['value'] = 1

				jsonform.form[2]['value'] = "log"


			}


			$(targetDiv).jsonForm(jsonform)

		})


}


function elastic_populate_tsnejs(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	
	Ds = clickObjectsToDataset(id)

	// fields = clickObjectsToDataset(id)
	fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})

	var limit = 10000;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}


function elastic_rawtoprocessed_tsnejs(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'')['hits']['hits']
	fields = []
	var Cs = {}
	var dataout = []

	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		Cs = retrieveSquareParam(id,"Cs",true)

		if(Cs['array'] !== null ){
			fields = Cs['array']
		}

		incNull = false
		if(Cs.hasOwnProperty('x_null')){
			incNull = Cs.x_null
		}
		
		scale = "log"
		if(Cs.hasOwnProperty('x_scale')){
			scale = Cs.x_scale
		}


	}


	


	_.each(data, function(row){
		qq("--")
		qq(row)
		
		var miniArray = []

		_.each(fields, function(field){
			qq("field")
			if(row['_source'][field] != null){
				miniArray.push(  row['_source'][field] )
				miniArray.push(  row['_source'][field] )
				miniArray.push(  row['_source'][field] )
			}
		})
		
		if(miniArray.length > 0){
			dataout.push(miniArray)
		}

	})

	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', dataout);

}


function elastic_graph_tsnejs(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
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
	qq(data)
	
	//data = [[1.0, 0.1, 0.2], [0.1, 1.0, 0.3], [0.2, 0.1, 1.0]];
	//qq(data)

	// data = [[139.69171,35.6895,"Tokyo",38001.018,392],[77.21667,28.66667,"Delhi",25703.168,356],[77.21667,28.66667,"Delhi",25703.168,356]]
	
	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']



	var tsne = new tsnejs.tSNE({
		dim: 2,
		perplexity: 30,
	});

	tsne.initDataDist(data)

	for(var k = 0; k < 10; k++) {
		qq("stepping")
		tsne.step(); // every time you call this, solution gets better
	}	

	var Y = tsne.getSolution();

	qq("Y")
	qq(Y)

}


