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

async function elastic_completeform_fieldvariance(id, targetDiv){

	const jsonform = {
		"schema": {
			"x_size": {
				"type": "string",
				"title": "SampleSize"
			},
			"x_unknown": {
				"title": "",
				"type": "boolean"
			}
		},
		"form": [
			{
				"key": "x_size"
			},
			{
				"key":"x_unknown",			
				"inlinetitle": "Include unindexed fields types?",
				"notitle": true
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

		if(retrieveSquareParam(id,"Cs",true)['x_unknown'] !== null){
			jsonform.form[1]['value'] = retrieveSquareParam(id,"Cs",true)['x_unknown']
		}
	}else{
		jsonform.value.x_size = 200
		jsonform.form[1]['value'] = 0
	}

	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_fieldvariance(id){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var thisCs = retrieveSquareParam(id,"Cs",true)
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var limit = 1;
	var stats = false
	var statField = ""
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	var aggFields = []
	var outputFields = []
	var existOrFields = []
	var existAndFields = []

	// 
	
	
	if(thisCs !== undefined){
		limit = thisCs['x_size']
	}


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
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields,
		existAndFields	
	)

	
	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

}



async function elastic_rawtoprocessed_fieldvariance(id, data){

	var thisCo = await nameToConnectors(retrieveSquareParam(id, 'Co', true))
	var thisDst = thisCo['dst']
	var indexPattern = "*"
	var thisMappings = await getSavedMappings(thisDst, indexPattern, true)

	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		
		var Cs = retrieveSquareParam(id,"Cs",true)

		incUnknown = false
		if(Cs.hasOwnProperty('x_unknown')){
			incUnknown = Cs.x_unknown
		}
	
	}

	data = data[0]['data']['hits']['hits']
	
	////////////////////
	// dataMid = {"ip":["1", "2", "1"]}
	var dataMid = {}			

	// dataMid2 = {"answers":["a", "b"]}
	var dataMid2 = {}

	// {"answers":{"populated":"80", "variance":"0.2"}}
	var dataOut = {}
	////////////////////

	var totalRows = _.size(data)
	
	// Loop every hit
	_.each(data, function(logObj, i){
		// map Log out
		aggregatedKeys = nestedElasticResultsGroupedByField(logObj['_source'], {}, [])
		// {"key": ["value"], "key2":[...]}

		// message is noisy, and simply replicates the indexed data
		delete aggregatedKeys['message']
		delete aggregatedKeys['log.full']

		// loop through findings, push to master aggregate 'dataMid'
		_.each(aggregatedKeys, function(arr, key){
			
			if(incUnknown || _.contains(thisMappings['allFields'], key)){

				if(!dataMid.hasOwnProperty(key)){
					dataMid[key] = []
				}			
				
				_.each(arr, function(value){
					dataMid[key].push(value)
				})
			
			}

		})

	})
	// dataMid = {"gid":[1,1,2],"interface":["eth2",...],...}


	// with flattened obj, we can look how often each key was populated
	_.each(dataMid,function(obj,key){
		if(!(key in dataOut)){
			dataOut[key] = {}
		}
		dataOut[key].occurancePercentage = Math.ceil((_.size(obj) / totalRows ) * 100)
		dataOut[key].occurance = Math.ceil(_.size(obj))
		
		if(thisMappings.hasOwnProperty(key)){
			dataOut[key].type = thisMappings[key]['type']
		}else{
			dataOut[key].type = "Unknown"
		}

		_.each(thisMappings, function(obj2,key2){
			if(key2 != "keywordFields" && _.contains(obj2, key)){
				dataOut[key].type = key2						
			}
		})




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
	// ww(4, "Specific, clearing raw data for "+id);
	// Lockr.rm('squaredata_'+id+"_rawdata_");


	return dataOut
	
		
}


function elastic_graph_fieldvariance(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// qq("fieldVarience Drawing")
	// qq(data)


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

	$("#square_"+id+"_table").append("<tbody></tbody>");
	_.each(data, function(obj,key){
		// qq(".")
		

		if(obj.samples.length == 5){
			obj.samples.push("[...]")
		}
		var samples = obj.samples.join(", ").substring(0,20)

		if(samples.length == 25){
			samples = samples +"..."
		}
		var samplesHover = obj.samples.join(", ")

		var clickObject = {"y": 1000, "Gt":"PieChart", "Cs":{"array":[key]}, "Ds": retrieveSquareParam(id, "Ds", false)}

		$("#square_"+id+"_table").find('tbody').append("<tr><td onclick='childFromClick("+retrieveSquareParam(id,"Pr",false)+", "+JSON.stringify(clickObject)+") ' >"+key+"</td><td>"+obj['type']+"</td><td title='"+samplesHover+"'>"+samples+"</td><td>"+obj['occurance']+" ("+obj['occurancePercentage']+"%)</td><td>"+obj['variance']+" ("+obj['variancePercentage']+"%)</td><tr>");
		


	})

	$("#square_"+id+"_table").tablesorter({
		sortList: [[3,1], [4,2]]
	});
	

}

