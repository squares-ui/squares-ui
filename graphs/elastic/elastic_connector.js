
// function elastic_query_buildera(from, to, filter, fields, limit, incTime = true, incNull = true){


// 	// loop through fields[], creating object to search with
// 	let theFilter = [];
	
// 	// add arrays from square
// 	_.each(filter, function(element){ 
// 		theFilter = theFilter.concat(JSON.parse(element))
// 		qq("##"+element)
// 	})
	
// 	// for Pivot to Kibana, timeframe not needed in query
// 	if( incTime == true){
// 		//format works in Elastic and Kibana
// 		var stringFormat = "YYYY-MM-DD[T]HH:mm:ss[.]SSS"
// 		to   = moment(to, "X").format(stringFormat);
// 		from = moment( from , "X").format(stringFormat);

// 		// set the time
// 		var timeRange = [{"range":{
// 				"@timestamp" : { "gte" : from, "lt" :  to }
// 			}
// 		}]	
// 		// add the time
// 		theFilter = theFilter.concat(timeRange)
// 	}

// 	// remove any potential duplicates if square have the same condition by accident
// 	theFilter = _.uniq(theFilter)



// 	// Has Square asked to not see Null entries?
// 	// if(retrieveSquareParam(id,"Cs",false) != null){
// 	// 	if(retrieveSquareParam(id,"Cs",false)['x_null'] != true){
// 	// 		qq("Filtering out "+fields[0])
// 	// 		theFilter.push({"exists" : { "field" : fields[0] }})
			
// 	// 	}
// 	// }


// 	//
// 	queryBody = {
// 		"query": {
// 			"bool": {
// 				//"must": theFilter,
// 				"filter": theFilter,
// 			}
// 		},
		
// 		"size": limit,
// 		"_source": fields
// 	}

// 	return queryBody;
// }


function clickObjectsToDataset(id, compare, notexist){
	// input array of compare/notexist from square and all parents
	// return a nice object

	prettyObject = {}
	prettyObject['compare'] = []
	prettyObject['notexist'] = []

	//qq(retrieveSquareParam(id,"Cs",true))
	
	
	
	cumulative = calcDs(id, [])
	
	
	// loop each square's dataset
	_.each(cumulative, function(obj, i){
		
		// each square can have multi dimensional compare
		_.each(obj['compare'], function(obj2,key2){
			prettyObject['compare'].push(obj2)
		})

		// each square can have multi dimensional compare
		_.each(obj['notexist'], function(obj2,key2){
			prettyObject['notexist'].push(obj2)
		})

	})

	return prettyObject

}






function elastic_query_builder(id, from, to, dataset, fields, limit, incTime = true, incNull = true, urlEncode){

	// examples of data
	// dataset = {"compare:[], "notexist":[]}
	// fields = ["message", "source_ip"]
	// for pivot to Kibana we don't use time in the query, to incTime exists
	// incNull is a preference on each square, so incNull exists

	// //for reference
	// query = {
	// 	"query": {
	// 	  	"bool": {
	// 			"must":[
	// 				{
	// 					"term": {
	// 						"<field>": "<value>"
	// 					}
	// 				},{
	// 					"term": {
	// 						"<field>.keyword": "<value>"
	// 					}
	// 				},{
	// 					"range": {
	// 						"@timestamp": {
	// 						"gte": "2020-05-01T00:00:00+00:00",
	// 						"lt": "2020-05-01T10:59:59+00:00"
	// 						}
	// 					}
	// 				}
	// 			]
	// 		},{
	// 		"must_not": [
	// 				{
	// 					"exists": {
	// 						"field": "<field_name>"
	// 					}
	// 				}
	// 			]
	// 		}
	// 	},
	// 	"size": 100,
	// 	"_source": [
	// 	]
	// }


	query = {
		"query": {
		  	"bool": {
				"must":[],
				"must_not": []
			}
		},
		"size": limit,
		"_source": fields
	}

	handle = retrieveSquareParam(id, 'CH')
	mappings = connectors_json.getAttribute(handle, "mappings")
	// qq(mappings)

	if(incTime == true){
		// Pivot from workspacecontainer to Elastic uses time separate, so in that instance, donm't include time in overall API request
		var stringFormat = "YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]"
		
		
		// to   = moment(to, "X").utc().format(stringFormat);
		// from = moment(from , "X").utc().format(stringFormat);

		query['query']['bool']['must'].push({
			"range": {
				"@timestamp": {
					"gte": moment.unix(from).format(),
					"lt": moment.unix(to).format()
				}
			}
		})
	}

	if(dataset['compare']){

		// Compile all the Must, as in "Must exist" or "must compare"
		// "Must" means a match of key value pairs
		_.each(dataset['compare'], function(comp){
			//filter.must.push({"term": equal})
	


			key = _.keys(comp)[0]
			val = _.values(comp)[0]

			// qq(">>>>>>>>>>>>>")
			// qq(comp)
			// qq(key)
			// // qq(mappings)


			if(mappings){
				
				// if the key is 1d (e.g. sourceip) We just get the value
				// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
				key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
				
				// if(mappings && mappings[key] && mappings[key]['fields'] && mappings[key]['fields']['keyword'] && mappings[key]['fields']['keyword']['type'] && mappings[key]['fields']['keyword']['type'] == "keyword"){
				// 	miniObj = {}
				// 	miniObj[key+".keyword"] = val
				// 	miniObj = {"term": miniObj}
				// 	query['query']['bool']['must'].push(miniObj)
				// 	qq("using .keyword for non 2dimensional object")
								
				if (key2['fields'] && key2['fields']['keyword'] && key2['fields']['keyword']['type'] && key2['fields']['keyword']['type'] == "keyword" ){

					miniObj = {}
					
					if(urlEncode == true){
						miniObj[key+".keyword"] = risonEncode(val)
					}else{
						miniObj[key+".keyword"] = val
					}
					
					
					
					miniObj = {"term": miniObj}
					query['query']['bool']['must'].push(miniObj)
					// qq("2d object using .keyword")


				}else{
					miniObj = {}
					
					if(urlEncode == true){
						miniObj[key] = risonEncode(val)
					}else{
						miniObj[key] = val
					}
					
					miniObj = {"term": miniObj}
					query['query']['bool']['must'].push(miniObj)
					// qq("NOT using .keyword")
					
				}	
				
				// qq(miniObj)
			}else{
				ww(0, "No Mappings for id:"+id+", cannot build up Elastic Query, results will be wrong")
			}
		})

	}



	if(dataset['notexist']){

		// Compile "Mustnot" as in "must not exist" (or null)
		//
		_.each(dataset['notexist'], function(notex){
			query['query']['bool']['must_not'].push({"exists": {"field": notex}})
		})
	
	}

	// qq("final query..............")
	// qq(query)

	return query

	


}

function elastic_connector(dst, index, id, query){

	queryBodyJSON = JSON.stringify(query);
	
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: 'http://'+dst+'/'+index+'/_search?',
		dataType: "json",
		data: queryBodyJSON,

		success: function (response) {
				
				// is data valid?  404/fail/timeout/
					validdata = true;
				//}
				
				// get this data saved... code continues in here
				saveRawData(id, validdata, "", response.hits.hits);
				
			},
			error: function (xhr, status) {
			switch(status) {
				case 404: 
					udpateScreenLog('#'+id+' remote path not found'); 
					break; 
				case 500: 
					udpateScreenLog('#'+id+' Server error'); 
					break; 
				case 0: 
					udpateScreenLog('#'+id+' Request aborted'); 
					break; 
				default: 
					udpateScreenLog('#'+id+' Unknown error ' + status); 	
					break
			}
		}
        });
}





function elastic_get_fields(dst, index, id){
	// scrape index definitions to know what fields exist in the mappings
	// return all answers grouped by type allowing originating function to filter for results
	// return {"long":["id","score"],"text":["name","details"], .... }
	// common properties are date, keyword, text, long, ip, float, etc
	// used for jsonform in edit_Square... however this should be moved over to elastic_return_mappings in the long run?

	return new Promise((resolve, reject) => {
		$.ajax({
		
			type: "GET",
			contentType: "application/json",
			url: 'http://'+dst+'/'+index,
			dataType: "json",

			success: function(data) {
			
				var fields = {}

				//  'index' might have a wild card and therefore multiple descriptions to combine, so need to look through each returned index
				_(data).each(function(obj, key){
					
					// now loop through document properties looking for all field names
					_(obj.mappings.doc.properties).each(function(obj2,key2){
						
						// is field dynamic?  (a deeper dynamic type)
						if(obj2.dynamic == "true"){

							_.each(obj2['properties'], function(obj3,key3){
								
								if(!(obj3.type in fields)){
									fields[obj3.type] = []
								}
								fields[obj3.type].push(key2+"."+key3)
							
							})

						}else{
							// is this a new Type?
							if(!(obj2.type in fields)){
								fields[obj2.type] = []
							}

							fields[obj2.type].push(key2)

						}
						
					})

				});
				
				// Unique each array of fields
				_.each(fields, function(obj,key){
					fields[key] = _.uniq(obj)
				})

				// create an allfields
				//allFields = _.sortBy(_.union(_.flatten(_.values(fields))), function(thingy){ return thingy; });
				fieldNames = _.keys(fields)
				// keep separated so they dont interfere with each other
				//fields['allfields'] = allFields
				fields['fields'] = fieldNames

				resolve(fields)
					
				
			},
			error: function(error) {
				
				
				switch(status) {
					case 404: 
						udpateScreenLog('#'+id+' remote path not found'); 
						break; 
					case 500: 
						udpateScreenLog('#'+id+' Server error'); 
						break; 
					case 0: 
						udpateScreenLog('#'+id+' Request aborted'); 
						break; 
					default: 
						udpateScreenLog('#'+id+' Unknown error ' + status); 	
						break
				}
				reject(error)
			}
		})
	})
}








function elasticMustMustNot(must, mustnot, timerange){
	
	// must = [{"field":"value"},{...}]
	// mustnot = ["field1"","field2"]
	// timerange = [epoch,epoch]

	//output is 
	



}







function elastic_prep_mappings(handle){
	// Connectors need their mapping understood in SQUARES
	// this function checks if the mapping is cached upon page load
	// if found, do nothing.  If not found, initiate elastic_return_mappings
	dst = connectors_json.handletodst(handle)
	index = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	// has the connector been populated with it's mappings?
	if(connectors_json.getAttribute(handle, "mappings") == null){
		elastic_return_mappings(dst, index)
		.then(function(results){
			// get the mappings, then push to the connector
			connectors_json.setAttribute(retrieveSquareParam(id, 'CH'), "mappings", results)
			qq("Checking Mappings, NEEDED for :"+handle)
			ww(7, "Connector "+retrieveSquareParam(id, 'CH')+" mappings now set")
		}).catch(e => {
			//setPageStatus(id, 'critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');
		})

		
	}else{
		qq("Checking Mappings, not needed for :"+handle)
	}
}


function elastic_return_mappings(dst, index){
	// fetch the Elastic index mappings
	// store them in global var for SQUARES to 

	return new Promise((resolve, reject) => {
		$.ajax({
		
			type: "GET",
			contentType: "application/json",
			url: 'http://'+dst+'/'+index,
			dataType: "json",

			success: function(data) {
			
				// JSON are not always in the right order, but I'm going to use it anyway
				// XXX - improvement, parse each Key, string->data, compare epoch, find newest (or oldest) config
				theChosen = {}
				theKey = ""
				_.each(data, function(obj,key){
					theChosen = obj
					theKey = key
				})
				
				// qq("using "+theKey)
				
				mappings = theChosen['mappings']['doc']['properties']
				//qq(mappings)
				
				resolve(mappings)
					
				
			},
			error: function(error) {
				switch(status) {
					case 404: 
						udpateScreenLog('#'+id+' remote path not found'); 
						break; 
					case 500: 
						udpateScreenLog('#'+id+' Server error'); 
						break; 
					case 0: 
						udpateScreenLog('#'+id+' Request aborted'); 
						break; 
					default: 
						udpateScreenLog('#'+id+' Unknown error ' + status); 	
						break
				}
				reject(error)
			}
		})
	})
}


function elastic_test_connector(dst, index){
	// query for 0 records, but see if we can connect, used for health testing

	var query = {"size":0, "_source":[]}

	queryBodyJSON = JSON.stringify(query);
	
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: 'http://'+dst+'/'+index+'/_search?',
		dataType: "json",
		data: queryBodyJSON,

		success: function (response) {
				
				// is data valid?  404/fail/timeout/
					validdata = true;
				//}
				
				// get this data saved... code continues in here
				saveRawData(id, validdata, index, response);
				
			},
			error: function (xhr, status) {
			switch(status) {
				case 404: 
					udpateScreenLog('#'+id+' remote path not found'); 
					break; 
				case 500: 
					udpateScreenLog('#'+id+' Server error'); 
					break; 
				case 0: 
					udpateScreenLog('#'+id+' Request aborted'); 
					break; 
				default: 
					udpateScreenLog('#'+id+' Unknown error ' + status); 	
					break
			}
		}
        });
}
