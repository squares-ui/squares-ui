

//////////////////////////////////////////
//////////////////////////////////////////
/// supporing functions
//////////////////////////////////////////
//////////////////////////////////////////


function elastic_connector(dst, index, id, query){

	var queryBodyJSON = JSON.stringify(query);
	
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: 'http://'+dst+'/'+index+'/_search?',
		dataType: "json",
		data: queryBodyJSON,

		success: function (response) {
				
				// is data valid?  404/fail/timeout/
					var validdata = true;
				//}
				
				// get this data saved... code continues in here
				saveRawData(id, validdata, "", response);
				
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



function clickObjectsToDataset(id, compare, notexist){
	// input array of compare/notexist from square and all parents
	// return a nice object

	var prettyObject = {}
	prettyObject['compare'] = []
	prettyObject['notexist'] = []

	//qq(retrieveSquareParam(id,"Cs",true))
	
	
	
	var cumulative = calcDs(id, [])
	
	
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
				var fieldNames = _.keys(fields)
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





function elastic_prep_mappings(handle){
	// Connectors need their mapping understood in SQUARES
	// this function checks if the mapping is cached upon page load
	// if found, do nothing.  If not found, initiate elastic_return_mappings
	var dst = connectors_json.handletodst(handle)
	var index = connectors_json.handletox(handle, 'index')

	// has the connector been populated with it's mappings?
	if(connectors_json.getAttribute(handle, "mappings") == null){
		elastic_return_mappings(dst, index)
		.then(function(results){
			// get the mappings, then push to the connector
			connectors_json.setAttribute(handle, "mappings", results)
			qq("Checking Mappings, now collected for :"+handle)
			ww(7, "Connector "+retrieveSquareParam(id, 'CH')+" mappings now set")
		}).catch(e => {
			//setPageStatus(id, 'critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');
		})

		
	}else{
		ww(7, "Checking Mappings, not needed for :"+handle)
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
				var theChosen = {}
				var theKey = ""
				_.each(data, function(obj,key){
					theChosen = obj
					theKey = key
				})
				
				// qq("using "+theKey)
				
				var mappings = theChosen['mappings']['doc']['properties']
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


function elastic_test_connector(id, dst, index){
	// query for 0 records, but see if we can connect, used for health testing

	var query = {"size":0, "_source":[]}

	var queryBodyJSON = JSON.stringify(query);
	
	$.ajax({
		type: "POST",
		contentType: "application/json",
		url: 'http://'+dst+'/'+index+'/_search?',
		dataType: "json",
		data: queryBodyJSON,

		success: function (response) {
				
				// is data valid?  404/fail/timeout/
					var validdata = true;
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




function elasticToFlare(data, scale){
	// in = elastic response
	// out = d3 flare {"data": {"name": "", "children": [..]}

	// for graphs that only use 1 time range, just enter it straight away
	dataout = {"name": "", "children":[]}
	
	dataout['children'] = elasticToFlareLoop(data, dataout['children'], scale)
	return dataout

}
function elasticToFlareLoop(data, dataout, scale){

	for ( var i = 0 ; i < data.length; i++){
	
		if(data[i].hasOwnProperty("field")){

			var mo = {}
			mo['name'] = data[i]['key']
			mo['children'] = []
			dataout.push(mo)
			
			elasticToFlareLoop(data[i]['field']['buckets'], dataout[dataout.length-1]['children'])

		}else{
					
			for ( var i = 0 ; i < data.length; i++){

				var mo = {}
				mo['name'] = data[i]['key']
				mo['realSize'] = data[i]['doc_count']
				
				if(scale == "log"){
					// cheating but log(0) causes UI problems
					// At this rate it's not longer a "count" more of a representation, so until an alternative I'm happy with it
					mo['size'] = Math.log(data[i]['doc_count']) + 1
				}else if(scale == "inverse"){
					mo['size'] = 1 / data[i]['doc_count']
				}else{
					// default to linear
					mo['size'] = data[i]['doc_count']
				}

				// if stats are present
				if(data[i].hasOwnProperty('stats')){
					mo['stats'] = _.clone(data[i]['stats'])
					

				}




				dataout.push(mo)			
			}
		}
	}
	return dataout
}


function hasFieldKeyword(handle, field){
	// some fields must have their keyword specified as "<field>.keyword"
	var mappings = connectors_json.getAttribute(handle, "mappings")
	
	if(mappings){
		key2 = field.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
		if (key2['fields'] && key2['fields']['keyword'] && key2['fields']['keyword']['type'] && key2['fields']['keyword']['type'] == "keyword" ){
			return true
		}else{
			return false
		}
	}else{	
		ww("0", "hasFieldKeyword had no Mappings, handle:"+handle+" field:"+field)
		
		addPageStatus("warning", "Mappings for "+handle+" not loaded.")

		return false
	}
}




//////////////////////////////////////////
//////////////////////////////////////////
/// query builder supporing
//////////////////////////////////////////
//////////////////////////////////////////




function elastic_must_add(query, dataset, mappings){

	// Compile all the Must, as in "Must exist" or "must compare"
	// "Must" means a match of key value pairs
	_.each(dataset['compare'], function(comp){
		//filter.must.push({"term": equal})

		var key = _.keys(comp)[0]
		var val = _.values(comp)[0]

		// qq(">>>>>>>>>>>>>")
		// qq(comp)
		// qq(key)
		// // qq(mappings)

		if(mappings){
			
			// if the key is 1d (e.g. sourceip) We just get the value
			// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
			var key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
			
			var miniObj = {}

			if (key2['fields'] && key2['fields']['keyword'] && key2['fields']['keyword']['type'] && key2['fields']['keyword']['type'] == "keyword" ){


				miniObj[key+".keyword"] = val
				
				miniObj = {"term": miniObj}
				query['query']['bool']['must'].push(miniObj)
				// qq("2d object using .keyword")

			}else{

				miniObj[key] = val
				
				miniObj = {"term": miniObj}
				query['query']['bool']['must'].push(miniObj)
				// qq("NOT using .keyword")
				
			}	
			
			// qq(miniObj)
		}else{
			ww(0, "No Mappings for id:"+id+", cannot build up Elastic Query, results will be wrong")
		}
	})

	return query;
}

function elastic_mustNot_add(query, dataset){
	
	// Compile "Mustnot" as in "must not exist" (or null)
	//
	_.each(dataset['notexist'], function(notex){
		query['query']['bool']['must_not'].push({"exists": {"field": notex}})
	})

	return query
}



function elasticMustMustNot(must, mustnot, timerange){
	
	// must = [{"field":"value"},{...}]
	// mustnot = ["field1"","field2"]
	// timerange = [epoch,epoch]

	//output is 
	



}









//////////////////////////////////////////
//////////////////////////////////////////
/// query builders
//////////////////////////////////////////
//////////////////////////////////////////






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


	var query = {
		"query": {
		  	"bool": {
				"must":[],
				"must_not": []
			}
		},
		"size": limit,
		"_source": fields
	}

	var handle = retrieveSquareParam(id, 'CH')
	var mappings = connectors_json.getAttribute(handle, "mappings")
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
	


			var key = _.keys(comp)[0]
			var val = _.values(comp)[0]
 
			// qq(">>>>>>>>>>>>>")
			// qq(comp)
			// qq(key)
			// // qq(mappings)


			if(mappings){
				
				// if the key is 1d (e.g. sourceip) We just get the value
				// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
				var key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
				
				// if(mappings && mappings[key] && mappings[key]['fields'] && mappings[key]['fields']['keyword'] && mappings[key]['fields']['keyword']['type'] && mappings[key]['fields']['keyword']['type'] == "keyword"){
				// 	miniObj = {}
				// 	miniObj[key+".keyword"] = val
				// 	miniObj = {"term": miniObj}
				// 	query['query']['bool']['must'].push(miniObj)
				// 	qq("using .keyword for non 2dimensional object")
								
				if (key2['fields'] && key2['fields']['keyword'] && key2['fields']['keyword']['type'] && key2['fields']['keyword']['type'] == "keyword" ){

					var miniObj = {}
					
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

















function elastic_2d_aggregate(id, timesArray, thenBy, dataset, fields, limit, incTime = true, incNull = true){
	// timesArray = [["2020-05-30T14:00:00+01:00", "2020-05-30T14:00:59+01:00"], [...], ]
	// thenBy = "port"

	//{
	// "query": {
	// 	"bool": {
	// 	  "should": [
	// 		{
	// 		  "range": {
	// 			"@timestamp": {
	// 			  "gte": "2020-05-30T14:00:00+01:00",
	// 			  "lt": "2020-05-30T14:00:59+01:00"
	// 			}
	// 		  }
	// 		},{
	// 		  "range": {
	// 			"@timestamp": {
	// 			  "gte": "2020-05-30T01:00:00+01:00",
	// 			  "lt": "2020-05-30T02:01:59+01:00"
	// 			}
	// 		  }
	// 		}
	// 	  ],
	// 	  "minimum_should_match" : 1
	// 	}
	//},
	//"aggs" : {
	// 	"time_ranges" : {
	// 		"range" : {
	// 		  "field" : "@timestamp",
	// 		  "ranges" : [
	// 			{
	// 			  "from": "2020-05-30T14:00:00+01:00",
	// 			  "to": "2020-05-30T14:00:59+01:00"
	// 			},
	// 			{
	// 				"from": "2020-05-30T01:00:00+01:00",
	// 				"to": "2020-05-30T02:01:59+01:00"
	// 			}
	// 		  ]
	// 		},
	// 		"aggs" : {
	// 		  "port" : { "terms" : { "field" : "port" } }
	// 		}
	// 	  }
	//   },    
	//   "size": 0	
	// }




  
  


	// nesting field -> time_ranges
	var query = {
		"query": {
		  "bool": {
			"should": [],
			"minimum_should_match" : 1,
			"must":[],
			"must_not": []
		  }
		},
		"aggs" : {
			"x_field" : { 
				"terms" : { 
					"field" : thenBy 
				},
				"aggs":{
					"time_ranges" : {
						"range" : {
							"field" : "@timestamp",
							"ranges" : []
						}
					}
				}
			}
		},
		"size": limit,
		"_source": fields
	  }

	  var handle = retrieveSquareParam(id, 'CH')
	  var mappings = connectors_json.getAttribute(handle, "mappings")



	////////////////////////////////
	// build range of times
	////////////////////////////////

	  _.each(timesArray, function(timeRange){

		var from = timeRange[0]
		var to = timeRange[1]

		// Add time ranges to the data query
		var shouldObj = {"range":{"@timestamp":{}}}
		shouldObj['range']['@timestamp']['gte'] = from
		shouldObj['range']['@timestamp']['lt'] = to
		query['query']['bool']['should'].push(shouldObj)

		// add time ranges to the aggregate bucket sizes
		var aggObj = {"from":from, "to":to}
		query['aggs']['x_field']['aggs']['time_ranges']['range']['ranges'].push(aggObj)

	  })

	  if(hasFieldKeyword(retrieveSquareParam(id, 'CH'), thenBy) == true){
	  	// add the 2nd layer "and then by"
		query['aggs']['x_field']['terms']['field'] = thenBy+".keyword"
	  }else{
		query['aggs']['x_field']['terms']['field'] = thenBy
	  }



	////////////////////////////////
	// match
	////////////////////////////////
	if(dataset['compare']){

		// Compile all the Must, as in "Must exist" or "must compare"
		// "Must" means a match of key value pairs
		_.each(dataset['compare'], function(comp){
			//filter.must.push({"term": equal})
	


			var key = _.keys(comp)[0]
			var val = _.values(comp)[0]
 
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

					var miniObj = {}
					
					miniObj[key+".keyword"] = val
					
					miniObj = {"term": miniObj}
					query['query']['bool']['must'].push(miniObj)
					// qq("2d object using .keyword")


				}else{
					var miniObj = {}
		
					miniObj[key] = val
					
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


	////////////////////////////////
	// Not
	////////////////////////////////
	if(dataset['notexist']){
		// Compile "Mustnot" as in "must not exist" (or null)
		//
		_.each(dataset['notexist'], function(notex){
			query['query']['bool']['must_not'].push({"exists": {"field": notex}})
		})
	
	}


	  return query;

}




function elasticDeepAggsWithStags(id, from, to, dataset, fields, statField, limit, stats){

	//query = {
//   "query": {
//     "bool": {
//       "should": [
//         {
//           "range": {
//             "@timestamp": {
//               "gte": "2020-06-01T09:14:00+01:00",
//               "lt": "2020-06-01T09:14:15+01:00"
//             }
//           }
//         }
//       ]
//     }
//   },
//   "aggs": {
//     "source_ip": {
//       "terms": {
//         "field": "source_ip"
//       },
//       "aggs": {
//         "destination_ip": {
//           "terms": {
//             "field": "destination_ip"
//           },
//           "aggs": {
//             "destination_port": {
//               "terms": {
//                 "field": "destination_port"
//               },
//               "aggs": {
//                 "stats" : { "extended_stats" : { "field" : "server_name_length" } }
//               }
//             }
              
//           }
//         }
//       }
//     }
//   },
//   "size": 0
// }


	query = {
		"query": {
			"bool": {
				"must":[]
			}
		},
		"aggs": {
			// goes here
		},
		"size": limit
	}


	var handle = retrieveSquareParam(id, 'CH')
	var mappings = connectors_json.getAttribute(handle, "mappings")
	// qq(mappings)

	if(true || incTime == true){
		query['query']['bool']['must'].push({
			"range": {
				"@timestamp": {
					"gte": moment.unix(from).format(),
					"lt": moment.unix(to).format()
				}
			}
		})
	}

	////////////////////////////////
	// MUST
	////////////////////////////////
	if(dataset['compare']){
		query = elastic_must_add(query, dataset, mappings)
	}

	
	////////////////////////////////
	// MUST_NOT
	////////////////////////////////
	if(dataset['notexist']){
		query = elastic_mustNot_add(query, dataset)
	}

	// loop through the multi layer fields for aggs
	var agg = {}
	var node = agg
	//_.each(fields, function(field, i){
	for(var i = 0 ; i < fields.length ; i++){

		node['field'] = {}
		node['field']['terms'] = {}
		
		if(hasFieldKeyword(retrieveSquareParam(id, 'CH'), fields[i]) == true){
			node['field']['terms']['field'] = (fields[i]+".keyword")
			
		}else{
			
			node['field']['terms']['field'] = fields[i]

		}
		

		if(fields.length > i+1){
			// more fields, go deeper
			// qq(fields.length +">"+ (i + 1))

			node['field']['aggs'] = {}

			node = node['field']['aggs']

			

		}else{
			// final field, append agg stats
			// qq("'else' "+fields.length+ ", i:"+(i+1))

			node['field']['aggs'] = {}
			node['field']['aggs']['stats'] = {}
			node['field']['aggs']['stats']['extended_stats'] = {}
			node['field']['aggs']['stats']['extended_stats']['field'] = statField
		}


	}
	query['aggs'] = agg

	//qq(query)

	return query

}

function elasticQueryBuildderToRuleThemAll(id, timesArray, dataset, fields, limit, stats, statField, incTime, urlencode){
	// timesArray = [["2020-05-30T14:00:00+01:00", "2020-05-30T14:00:59+01:00"], [...], ], 
	// dataset = compare, not match, etc
	// fields = ["field1", ].   Multiple fields for stacked aggs,
	// limit = 1, though we are doing aggs, still output 1 real entry?
	// stats = boolean, whether to include extended_stats (avg, mean, std_Dev)
	// statfield = "field1", the field on which to do stats
	// incTime = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// urlenccode = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?


	var query = {
		"query": {
			"bool": {
				"should": [
					// array of time range 
				],
				"minimum_should_match": 1,
				"must": [
					// array of must (/match)
				],
				"must_not": [
					// array of fields that should not be present
				]
			}
		},
		"aggs": {
			"time_ranges": {
				"range": {
					"field": "@timestamp",
					"ranges": [
						// array of time ranges
					]
				},
				"aggs": {}
			}
		},
		"size": limit
	}
	
	var mappings = connectors_json.getAttribute(retrieveSquareParam(id, 'CH'), "mappings")


	////////////////////////////////
	// build range of times, 1+
	////////////////////////////////

	_.each(timesArray, function(timeRange){

		var from = moment.unix(timeRange[0]).format()
		var to = moment.unix(timeRange[1]).format()


		// "gte": moment.unix(from).format(),
		// "lt": moment.unix(to).format()

		// Add time ranges to the SHOULD
		var shouldObj = {"range":{"@timestamp":{}}}
		shouldObj['range']['@timestamp']['gte'] = from
		shouldObj['range']['@timestamp']['lt'] = to
		query['query']['bool']['should'].push(shouldObj)

		// also add time ranges to the aggregate bucket sizes
		var aggObj = {"from":from, "to":to}
		query['aggs']['time_ranges']['range']['ranges'].push(aggObj)

	})

	////////////////////////////////
	// MUST
	////////////////////////////////
	if(dataset['compare']){
		query = elastic_must_add(query, dataset, mappings)
	}

	
	////////////////////////////////
	// MUST_NOT
	////////////////////////////////
	if(dataset['notexist']){
		query = elastic_mustNot_add(query, dataset)
	}


	////////////////////////////////
	// AGGS
	////////////////////////////////
	var agg = {}
	var node = agg
	for(var i = 0 ; i < fields.length ; i++){

		node['field'] = {}
		node['field']['terms'] = {}
		
		if(hasFieldKeyword(retrieveSquareParam(id, 'CH'), fields[i]) == true){
			node['field']['terms']['field'] = (fields[i]+".keyword")
		}else{
			node['field']['terms']['field'] = fields[i]
		}
		node['field']['terms']['size'] = 10000
		
		if(fields.length > i+1){
			// more fields, go deeper
			// qq(fields.length +">"+ (i + 1))
			node['field']['aggs'] = {}
			node = node['field']['aggs']

		}else if(stats == true){
			// final field, append agg stats
			// qq("'else' "+fields.length+ ", i:"+(i+1))

			node['field']['aggs'] = {}
			node['field']['aggs']['stats'] = {}
			node['field']['aggs']['stats']['extended_stats'] = {}
			node['field']['aggs']['stats']['extended_stats']['field'] = statField
		}else{
			// do nothing more?
		}

	}
	query['aggs']['time_ranges']['aggs'] = agg


	return query;

	// {
	// 	"query": {
	// 		"bool": {
	// 			"should": [{
	// 					"range": {
	// 						"@timestamp": {
	// 							"gte": "2020-05-30T14:00:00+01:00",
	// 							"lt": "2020-05-30T14:00:59+01:00"
	// 						}
	// 					}
	// 				}, {
	// 					"range": {
	// 						"@timestamp": {
	// 							"gte": "2020-05-30T01:00:00+01:00",
	// 							"lt": "2020-05-30T02:01:59+01:00"
	// 						}
	// 					}
	// 				}
	// 			],
	// 			"minimum_should_match": 1,
	// 			"must": [
	// 				{
	// 					"term": {
	// 						"<field>": "<value>"
	// 					}
	// 				}, {
	// 					"term": {
	// 						"<field>.keyword": "<value>"
	// 					}
	// 				}
	// 			],
	// 			"must_not": [{
	// 				"exists": {
	// 					"field": "<field_name>"
	// 				}
	// 			}]
	// 		}
	// 	},
	// 	"aggs": {
	// 		"time_ranges": {
	// 			"range": {
	// 				"field": "@timestamp",
	// 				"ranges": [{
	// 						"from": "2020-05-30T14:00:00+01:00",
	// 						"to": "2020-05-30T14:00:59+01:00"
	// 					}
	// 				]
	// 			},
	// 			"aggs": {
	// 				"source_ip": {
	// 					"terms": {
	// 						"field": "source_ip"
	// 					},
	// 					"aggs": {
	// 						"destination_ip": {
	// 							"terms": {
	// 								"field": "destination_ip"
	// 							},
	// 							"aggs": {
	// 								"destination_port": {
	// 									"terms": {
	// 										"field": "destination_port"
	// 									},
	// 									"aggs": {
	// 										"stats": {
	// 											"extended_stats": {
	// 												"field": "server_name_length"
	// 											}
	// 										}
	// 									}
	// 								}
	
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	},
	// 	"size": 10
	// }
	






}







function elasticQueryBuildderAggScriptDayHour(id, timesArray, dataset, fields, limit, stats, statField, incTime, urlencode, aggTimeScriptNames, maxAccuracy){
	// timesArray = [["2020-05-30T14:00:00+01:00", "2020-05-30T14:00:59+01:00"], [...], ], 
	// dataset = compare, not match, etc
	// fields = ["field1", ].   Multiple fields for stacked aggs,
	// limit = 1, though we are doing aggs, still output 1 real entry?
	// stats = boolean, whether to include extended_stats (avg, mean, std_Dev)
	// statfield = "field1", the field on which to do stats
	// incTime = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// urlenccode = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// aggTimeScriptNames = java functions ["", ""]
	// maxAccuracy = boolean, whether to use max(Int) size, or not

	var query = {
		"query": {
			"bool": {
				"should": [
					// array of time range 
				],
				"minimum_should_match": 1,
				"must": [
					// array of must (/match)
				],
				"must_not": [
					// array of fields that should not be present
				]
			}
		},
		"aggs": {
			"time": {
				"terms": {
					"script": {
						"source": "doc['@timestamp'].value."+aggTimeScriptNames[0]
					}
				},
				"aggs": {
					"time": {
						"terms": {
							
							"script": {
								"source": "doc['@timestamp'].value."+aggTimeScriptNames[1]
							}
						}
						// "aggs": {
						// 	"field": {
						// 		"terms": {
						// 			"field": fields,
						// 			"size": 2,
						// 			"order": {
						// 				"_count": "desc"
						// 			}
						// 		}
						// 	}
						// }
					}
				}
			}
		},
		"size": limit
	}
	
	var mappings = connectors_json.getAttribute(retrieveSquareParam(id, 'CH'), "mappings")

	////////////////////////////////
	// max accuracy
	////////////////////////////////
	if(maxAccuracy){
		query['aggs']['time']['terms']['size'] = 2147483647
		query['aggs']['time']['aggs']['time']['terms']['size'] = 2147483647
	}else{
		// do nothing, if size not declared it defaults
	}



	////////////////////////////////
	// build range of times, 1+
	////////////////////////////////

	_.each(timesArray, function(timeRange){

		var from = moment.unix(timeRange[0]).format()
		var to = moment.unix(timeRange[1]).format()


		// "gte": moment.unix(from).format(),
		// "lt": moment.unix(to).format()

		// Add time ranges to the SHOULD
		var shouldObj = {"range":{"@timestamp":{}}}
		shouldObj['range']['@timestamp']['gte'] = from
		shouldObj['range']['@timestamp']['lt'] = to
		query['query']['bool']['should'].push(shouldObj)


	})


	////////////////////////////////
	// MUST
	////////////////////////////////
	if(dataset['compare']){
		query = elastic_must_add(query, dataset, mappings)
	}


	////////////////////////////////
	// MUST_NOT
	////////////////////////////////
	if(dataset['notexist']){
		query = elastic_mustNot_add(query, dataset)
	}

	return query;


}

