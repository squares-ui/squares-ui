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

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var Ds = calcDs(id, []);
	

	firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	thirdBy = retrieveSquareParam(id,"Cs")['custom_third']
	var fields=[firstBy, secondBy, thirdBy]
	
	var limit = 10000;
	var query = elastic_query_builder(from, to, Ds, fields, limit, null);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}


function elastic_rawtoprocessed_tsnejs(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	const thirdBy = retrieveSquareParam(id,"Cs")['custom_third']



    // t-sne relies on scalar not nominal.  So for nominal I will count as % the rarity of user columns to find "odd" and place together?
    
    //// for each field from user, work out total count and % of rest
	dataCount = {}
	dataCount.first = {}
	dataCount.second = {}
	dataCount.third = {}
	_.each(data, function(row){
		if(dataCount.first[row._source[firstBy]] == undefined){
			dataCount.first[row._source[firstBy]] = 0;
		}
		dataCount.first[row._source[firstBy]]++

		if(dataCount.second[row._source[secondBy]] == undefined){
			dataCount.second[row._source[secondBy]] = 0;
		}
		dataCount.second[row._source[secondBy]]++

		if(dataCount.third[row._source[thirdBy]] == undefined){
			dataCount.third[row._source[thirdBy]] = 0;
		}
		dataCount.third[row._source[thirdBy]]++

	})

	
    // for (const [keyx, valuex] of Object.entries(dataCount)) {
    //     for (const [keyy, valuey] of Object.entries(valuex)) {
    //         for (const [keyz, valuez] of Object.entries(valuey)) {	
				


	// 		}
	// 	}
	// }

	data3 = _.map(data, function(row){
		return [dataCount.first[row._source[firstBy]] / data.length, dataCount.second[row._source[secondBy]] / data.length, dataCount.third[row._source[thirdBy]] / data.length ]

	})

	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', data3);

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

	data = [[139.69171,35.6895,"Tokyo",38001.018,392],[77.21667,28.66667,"Delhi",25703.168,356],[77.21667,28.66667,"Delhi",25703.168,356]]
	
	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']



	var tsne = new tsnejs.tSNE({
		dim: 2,
		perplexity: 30,
});

	tsne.initDataDist(data)

	for(var k = 0; k < 1; k++) {
		qq("stepping")
		tsne.step(); // every time you call this, solution gets better
	}	

	var Y = tsne.getSolution();

	qq("Y")
	qq(Y)

}


