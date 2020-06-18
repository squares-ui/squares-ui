graphs_functions_json.add_graphs_json({
	"elastic":{
		"FieldVariance":{
			"completeForm": "elastic_completeform_fieldvariance",			
			"processForm": "elastic_processform_fieldvariance",			
			"populate": "elastic_populate_fieldvariance",
			"rawtoprocessed":"elastic_rawtoprocessed_fieldvariance",
			"graph":"elastic_graph_fieldvariance",
			"about": "Sample records and show which fields are in",
		}
	}
});

function elastic_completeform_fieldvariance(id, targetDiv){


	var dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	var connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			const jsonform = {
				"schema": {
				  "x_size": {
					"type": "string",
					"title": "SampleSize",
				  }
				},
				"form": [
				  {
					"key": "x_size"
			
				  }
				],
				"value":{
				}
                
			}

			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['x_size'] !== undefined){
					jsonform.value.x_size = retrieveSquareParam(id,"Cs",false)['x_size']
				}else{
					jsonform.value.x_size = 200
				}
			}else{
				jsonform.value.x_size = 200
			}

			$(targetDiv).jsonForm(jsonform)

		})




}


function elastic_populate_fieldvariance(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var Ds = clickObjectsToDataset(id)
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	var fields=["*"]

	var limit = 100;
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		limit = retrieveSquareParam(id,"Cs",false)['x_size']
	}

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}



function elastic_rawtoprocessed_fieldvariance(id){

	
	var data = retrieveSquareParam(id, 'rawdata_'+'')['hits']['hits']
	
	// dataMid = {"answers":["a", "b", "a"]}
	var dataMid = {}

	// dataMid2 = {"answers":["a", "b"]}
	var dataMid2 = {}

	// {"answers":{"populated":"80", "variance":"0.2"}}
	var dataOut = {}
	
	////////////////////

	var totalRows = _.size(data)

	var mappings = connectors_json.getAttribute(retrieveSquareParam(id, 'CH'), "mappings")
	// qq(mappings)

	//populate every field from every record into one big array
	_.each(data, function(obj,key){
		_.each(obj['_source'],function(obj,key){
			// if(!(key in dataMid)){
			// 	dataMid[key] = []
			// }
			// dataMid[key].push(obj)
		

			// is field dynamic?  (a deeper dynamic type)
			if(typeof obj === "object" && obj !== null ){
				_.each(obj, function(obj2,key2){
					
					if(!(key+"."+key2 in dataMid)){
						dataMid[key+"."+key2] = []
					}
					dataMid[key+"."+key2].push(obj2)
				})

			}else{
				// is this a new Type?
				if(!(key in dataMid)){
					dataMid[key] = []
				}

				dataMid[key].push(obj)
				
			}
				
		})
	})
	// dataMid = {"gid":[1,1,2],"interface":["eth2",...],...}
	

	// .message is noisy, and simply replicates the indexed data
	delete dataMid['message']

	// with flattened obj, we can look how often each key was populated
	_.each(dataMid,function(obj,key){
		if(!(key in dataOut)){
			dataOut[key] = {}
		}
		dataOut[key].occurancePercentage = Math.ceil((_.size(obj) / totalRows ) * 100)
		dataOut[key].occurance = Math.ceil(_.size(obj))
		if(mappings.hasOwnProperty(key)){
			dataOut[key].type = mappings[key]['type']
		}	

	})	



	// now flatten/sort/uniq each key to find uniqueness
	var dataMid2 = {}
	_.each(dataMid,function(obj,key){
		dataMid2[key] = _.uniq(_.sortBy(_.flatten(dataMid[key], function(num){ return num}  )  ))

	})
	
	//now find variance
	_.each(dataMid2,function(obj,key){
		if(!(key in dataOut)){
			dataOut[key] = {}
		}
		dataOut[key].variancePercentage = Math.ceil((_.size(obj) / totalRows ) * 100)
		dataOut[key].variance = Math.ceil(_.size(obj))
	})


	// now get some examples of each to help the analyst
	_.each(dataMid2,function(obj,key){
		if(!(key in dataOut)){
			dataOut[key] = {}
		}
		dataOut[key].samples = _.first(_.uniq(obj),5)
		
	})



	// this is a very noisy graphy type, delete raw data always
	ww(id, " Clearing raw data for "+id);
	Lockr.rm('squaredata_'+id+"_rawdata");


	saveProcessedData(id, '', dataOut);
}


function elastic_graph_fieldvariance(id){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
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
	
	var table = d3.select("#square_"+id).append("table")
		.classed("tablesorter", true)
		.attr("id", "square_"+id+"_table")

	

	var header = table.append("thead").append("tr");
	header
		.selectAll("th")
		.data(["Field", "Type", "Sample", "Occurance %", "Variance %"])
	.enter()
		.append("th")
		.classed("fontsize", true)
		.text(function(d) { return d; });

	$("#square_"+id+"_table").append("<tbody></tbody");
	//$("#square_"+id+"_table").find('tbody').append("<tr><td>111</td><td>111</td><td>111</td></tr>");
	_.each(data, function(obj,key){
		
		clickObject = {"y": 1000, "Gt":"PieChart", "Cs":{"array":[key]}}

		if(obj.samples.length == 5){
			obj.samples.push("[...]")
		}
		samples = obj.samples.join(", ").substring(0,20)

		if(samples.length == 25){
			samples = samples +"..."
		}
		samplesHover = obj.samples.join(", ")

		$("#square_"+id+"_table").find('tbody').append("<tr><td onclick='childFromClick("+retrieveSquareParam(id,"Pr",false)+", "+JSON.stringify(clickObject)+") ' >"+key+"</td0><td>"+obj['type']+"</td><td title='"+samplesHover+"'>"+samples+"</td><td>"+obj['occurance']+" ("+obj['occurancePercentage']+"%)</td><td>"+obj['variance']+" ("+obj['variancePercentage']+"%)</td><tr>");


	})

	$("#square_"+id+"_table").tablesorter({
		sortList: [[3,1], [4,2]]
		
	});

}


