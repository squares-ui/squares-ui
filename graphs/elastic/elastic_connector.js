

//////////////////////////////////////////
//////////////////////////////////////////
/// supporing functions
//////////////////////////////////////////
//////////////////////////////////////////

// function elastic_version(handle){
// 	// API calls differ, this helps code adjust

// 	var dst = connectors.handletox(handle, "dst")

// 	$.ajax({
// 		type: "GET",
// 		contentType: "application/json",
// 		url: 'http://'+dst+'/',
// 		dataType: "json",
		

// 		success: function (response) {
// 			// ww(1, "setting elasticVersion for handle:"+handle)
// 			connectors.setConnectorAttribute(handle, "elasticVersion", response['version']['number'])
// 		},
// 		error: function (xhr, status) {
// 			switch(status) {
// 				case 404: 
// 					udpateScreenLog(dest+' 400: Malfored Query'); 
// 					break; 
// 				case 500: 
// 					udpateScreenLog(dest+' Server error'); 
// 					break; 
// 				case 0: 
// 					udpateScreenLog(dest+' Request aborted'); 
// 					break; 
// 				default: 
// 					graphGraphError(id, "Connection timeout? CORS?")	
// 					udpateScreenLog(dest+' Unknown error ' + status); 	
// 					break
// 			}
// 		}
//     });	
// }


async function elastic_connector(dst, indexPattern, id, query, name){
	// ee(" -> "+arguments.callee.name+"("+JSON.stringify(id)+", "+indexPattern+", "+id+", "+query+", "+name+")");

	var queryBodyJSON = JSON.stringify(query);
	var response;
	var responseData = {"id":id, "name":name}

	try {
		response = await $.ajax({
			type: "POST",
			contentType: "application/json",
			url: 'http://'+dst+'/'+indexPattern+'/_search?',
			dataType: "json",
			data: queryBodyJSON
		})


		//valdidate data, valid?  hits found?
		if(response.hits.total.value > 0 || retrieveSquareParam(id, "Pr", false)==0 ){
			
			// Results from elastic can have hits, but empty aggregations 1d, and empty 2d. 
			// If aggregrations (1d or 2d) exist, we need to see if they contained anything
			var aggsPass = true
							
			// Check if 1d aggs exist
			if(response.hasOwnProperty("aggregations")){
				aggsPass = false
				_.each(response.aggregations.time_ranges.buckets, function(bucket){
					// check if 2d aggs exist
					if(bucket.hasOwnProperty("field")){
						_.each(bucket.field.buckets, function(bucket2){
							if(bucket2.doc_count > 0){
								aggsPass = true
							}
						})
					
					// cal heatmap
					}else if(bucket.hasOwnProperty("doc_count") && bucket.hasOwnProperty("doc_count") > 0){
						aggsPass = true
					}
				})
			
				// check if agg count looks max size
				if(response.aggregations.time_ranges.buckets.length == GLB.dftAggregationSize){
					responseData['status'] = ["Aggregation limit reached"]
					alert("limit hit")
				}

			}

			if(aggsPass == true  || retrieveSquareParam(id, "Pr", false)==0 ){
				// return({"id":id, "name":name, "data":response})
				responseData['data'] = response
				
			}else{			
				// throw "No Results Matching this Visualisation"
				responseData['data'] = null
				responseData['error'] = "Nothing to render "
			}
		
		}else{
			// throw "No Hits"
			responseData['data'] = null
			responseData['error'] = "No data found"
		}

		return(responseData)

	} catch (error) {
		ww(0, arguments.callee.name+" id:"+id+" e:"+error);
		graphGraphError(id, error)
		// return({"id":id, "name":name, "data":null})
	}
	
    
}



function clickObjectsToDataset(id, compare, notexist){
	// input array of compare/notexist from square and all parents
	// return a nice object
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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

function combineScriptFilter(id){
	// query.bool.filter.script.script: "doc['@timestamp'].value.getMinute()==18 || doc['@timestamp'].value.getMinute()==19"

	var allParents = findParents(id)
	var allFilters = []

	_.each(allParents, function(parentID){
		filter = retrieveSquareParam(parentID, "Fi", false )
		if(filter !== undefined){
			allFilters.push(filter )
		}

	})
	allFilters.push(retrieveSquareParam(id, "Fi", false ))

	return allFilters.join(" && ")

}



function deepGetFieldNamesRecursive(obj, tmp, path){
	
	
	qqq = false
	qqq && qq("------------------------------------------------------------------------")
	// qqq && qq(path)
	qqq && qq(tmp)
	keys = _.keys(obj)
	
	
	if(obj[keys[0]].hasOwnProperty("mappings")){
		// this is root level of indecides
		// loop each index		
		_.each(obj, function(index, key){
			deepGetFieldNamesRecursive(index['mappings']['properties'], tmp, path)
		})

	}else if(_.contains(keys, "type")){
		// direct key:type
		
		// get the field type
		if(obj.type == "object"){
			//too dynamic, can't index/fitler an object?
		}else{
			qqq && qq("'type' found, adding '"+path.join(".")+"' to '"+obj.type+"'")
			if(!(obj.type in tmp)){
				tmp[obj.type] = []
			}
			tmp[obj.type].push(path.join("."))     

			// also see if this field has fields.keyword.type = keyword
			if(obj.hasOwnProperty("fields") && obj['fields'].hasOwnProperty("keyword") && obj['fields']['keyword'].hasOwnProperty("type") && obj['fields']['keyword']['type'] == "keyword"){
				// if(!tmp.hasOwnProperty("keywordFields")){
				// 	tmp['keywordFields'] = []
				// }
				tmp['keywordFields'].push(path.join("."))
			}

			// and push every field to a "all fields key for quick search later on"
			tmp['allFields'].push(path.join("."))

		}

	}else if(_.contains(keys, "properties")  ){
		// go deeper
		// path.push()    
		qqq && qq("properties found for: ")

		_.each(obj['properties'], function(val, key){
			path2 = JSON.parse(JSON.stringify(path))
			path2.push(key)        
			deepGetFieldNamesRecursive(val, tmp, path2)
		})
	


	}else{
		// lots of things, root object?  Loop through all
		_.each(obj, function(val, key){
			qqq && qq("in root object, next is: "+key)
			path = [key]
			deepGetFieldNamesRecursive(val, tmp, path)
		})
	}
	return tmp
}
async function elastic_prep_mappings(dst, indexPattern, id){
	// scrape index definitions to know what fields exist in the mappings
	// return all answers grouped by type allowing originating function to filter for results
	// return {"long":["id","score"],"text":["name","details"], .... }
	// common properties are date, keyword, text, long, ip, float, etc
	// used for jsonform in edit_Square... however this should be moved over to elastic_return_mappings in the long run?

	// XXX this should be cached?  Bad load to query every time
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

		var fields = {}
		let data;

		try{
			data = await $.ajax({
				type: "GET",
				contentType: "application/json",
				url: 'http://'+dst+'/'+indexPattern+"/_mapping/",
				dataType: "json"
			})
			


			fields = deepGetFieldNamesRecursive(data, {"allFields":[], "keywordFields":[] }, [])
			

			// Unique each array of fields
			_.each(fields, function(obj,key){
				fields[key] = _.uniq(obj)
			})


			// get a list of types
			fields['fieldTypes'] = _.omit(_.keys(fields), "keywordFields", "allFields")

			return fields

		} catch (error) {
			ww(0, "arguments.callee.name :"+error);
		}
}




function elastic_test_connector(id, dst, index){
	// query for 0 records, but see if we can connect, used for health testing
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var query = {"size":0, "_source":[]}

	var queryBodyJSON = JSON.stringify(query);
	
	return new Promise((resolve, reject) => {
		
		$.ajax({
			type: "POST",
			contentType: "application/json",
			url: 'http://'+dst+'/'+index+'/_search?',
			dataType: "json",
			data: queryBodyJSON,

			success: function (response) {
					
				// saveRawData(id, validdata, index, response);
				resolve({"id":id, "name":index, "data":response})
			},
			error: function (xhr, status) {
				// Any ajax error should still resolve (not reject) as the process is not broken for "test_connector"
				switch(status) {
					case 404: 
						resolve({"id":id, "name":index, "data":{}, "error":404})
						reject (status+' remote path not found')
						break; 
					case 500: 
						resolve({"id":id, "name":index, "data":{}, "error":500})
						reject (status+' Server error')
						break; 
					case 0: 
						resolve({"id":id, "name":index, "data":{}, "error":"unknown"})	
						udpateScreenLog('#'+id+' Request aborted'); 
						reject (status+' Request aborted')
						break; 
					default: 
						resolve({"id":id, "name":index, "data":{}, "error": "Timeout"})
						udpateScreenLog('#'+id+' Unknown error ' + status); 	
						reject (status+' Unknown error ' + status)
						break
				}
			}
		});
	})
}




function elasticToFlare(data, scale, incNull){
	// in = elastic response
	// out = d3 flare {"data": {"name": "", "children": [..]}
	// for graphs that only use 1 time range, just enter it straight away
	dataout = {"name": "", "children":[]}
	dataout['children'] = elasticToFlareLoop(data, dataout['children'], scale, incNull)
	return dataout
	
}

function elasticToFlareLoop(data, dataout, scale){
	
	for ( var i = 0 ; i < data.length; i++){
		// ww(7, "i:"+i)

		if(data[i].hasOwnProperty("field") && data[i]['field']['buckets'].length == 0){
			// parent object, but no fields within (aka multi dimensional values are null)

			if(incNull){
				var mo = {}
				mo['name'] = data[i]['key']
				mo['children'] = []
				dataout.push(mo)

				elasticToFlareLoop([{"key": "null", "doc_count": data[i]['doc_count']}], dataout[dataout.length-1]['children'], scale, incNull)
			}else{
				elasticToFlareLoop([], dataout[dataout.length-1]['children'], scale, incNull)
			}

		}else if(data[i].hasOwnProperty("field")){
			// parent object, loop through children
			
			var mo = {}
			mo['name'] = data[i]['key']
			mo['children'] = []
			dataout.push(mo)
			
			elasticToFlareLoop(data[i]['field']['buckets'], dataout[dataout.length-1]['children'], scale, incNull)

		}else{
			// ww(7, i+": NO has field")
			for ( var i = 0 ; i < data.length; i++){

				var mo = {}
				mo['name'] = data[i]['key']
				mo['realSize'] = data[i]['doc_count']
				
				if(scale == "log"){
					// cheating but log(0) causes UI problems
					// At this rate it's not longer a "count" more of a representation, so until an alternative I'm happy with it
					mo['size'] = Math.log(data[i]['doc_count']) + 1
					// qq("log size "+mo['name']+" set to "+mo['size'])
				}else if(scale == "inverse"){
					mo['size'] = 1 / data[i]['doc_count']
					// qq("inv size "+mo['name']+" set to "+mo['size'])
				}else{
					// default to linear
					mo['size'] = data[i]['doc_count']
					// qq("lin size "+mo['name']+" set to "+mo['size'])
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


function hasFieldKeyword(id, keyword){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+keyword+")");

	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')

	if(_.contains(masterMappings[dst][indexPattern].keywordFields, keyword)){
		return true
	}else{
		return false
	}
}




//////////////////////////////////////////
//////////////////////////////////////////
/// query builder supporing
//////////////////////////////////////////
//////////////////////////////////////////




function elastic_must_add(query, dataset, mappings){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+query+")");

	// Compile all the Must, as in "Must exist" or "must compare"
	// "Must" means a match of key value pairs
	_.each(dataset['compare'], function(comp){
		//filter.must.push({"term": equal})

		var key = _.keys(comp)[0]
		var val = _.values(comp)[0]

		// if the key is 1d (e.g. sourceip) We just get the value
		// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
		var key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
		
		var miniObj = {}

		if(_.contains(mappings.keywordFields, key)){
			

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






function elastic_query_builder(id, from, to, dataset, fields, limit, incTime = true, incNull = true, urlEncode, filter){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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


	if(incTime == true){
		// Pivot from workspacecontainer to Elastic uses time separate, so in that instance, donm't include time in overall API request

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
				var miniObj = {}
 
			// qq(">>>>>>>>>>>>>")
			// qq(comp)
			// qq(key)
			// // qq(mappings)


				
			// if the key is 1d (e.g. sourceip) We just get the value
			// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
			// var key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
			
			// if(mappings && mappings[key] && mappings[key]['fields'] && mappings[key]['fields']['keyword'] && mappings[key]['fields']['keyword']['type'] && mappings[key]['fields']['keyword']['type'] == "keyword"){
			// 	miniObj = {}
			// 	miniObj[key+".keyword"] = val
			// 	miniObj = {"term": miniObj}
			// 	query['query']['bool']['must'].push(miniObj)
			// 	qq("using .keyword for non 2dimensional object")
							

			
			// if(_.contains(masterMappings[dst][indexPattern].keywordFields, key2)){
			if(hasFieldKeyword(id, key)){
			
				if(urlEncode == true){
					miniObj[key+".keyword"] = risonEncode(val)
				}else{
					miniObj[key+".keyword"] = val
				}
				
				miniObj = {"term": miniObj}
				query['query']['bool']['must'].push(miniObj)
				// qq("2d object using .keyword")


			}else{
				
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

		})

	}


	if(dataset['notexist']){

		// Compile "Mustnot" as in "must not exist" (or null)
		//
		_.each(dataset['notexist'], function(notex){
			query['query']['bool']['must_not'].push({"exists": {"field": notex}})
		})
	
	}

	////////////////////////////////
	// Filter
	////////////////////////////////
	if(filter){
		query['query']['bool']['filter'] = {"script":{"script":filter}}
	}

	// qq("final query..............")
	// qq(query)

	return query

	


}









function elastic_2d_aggregate(id, timesArray, thenBy, dataset, fields, limit, incTime = true, incNull = true){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
					"size": GLB.dftAggregationSize,
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

	//   if(_.contains(masterMappings[dst][indexPattern].keywordFields, fields[i])){
	  if(hasFieldKeyword(id, fields[i])){
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


				
			// if the key is 1d (e.g. sourceip) We just get the value
			// if the key is 2d (e.g. destination_ip.countrycode2) we need to check index Mappings if it has the .keyword, which means going deep
			key2 = key.split(".").join(".properties.").split('.').reduce(stringDotNotation, mappings)
			
			// if(mappings && mappings[key] && mappings[key]['fields'] && mappings[key]['fields']['keyword'] && mappings[key]['fields']['keyword']['type'] && mappings[key]['fields']['keyword']['type'] == "keyword"){
			// 	miniObj = {}
			// 	miniObj[key+".keyword"] = val
			// 	miniObj = {"term": miniObj}
			// 	query['query']['bool']['must'].push(miniObj)
			// 	qq("using .keyword for non 2dimensional object")
							
			// if(_.contains(masterMappings[dst][indexPattern].keywordFields, fields[i])){
			if(hasFieldKeyword(id, fields[i])){

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
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
		
		// if(_.contains(masterMappings[dst][indexPattern].keywordFields, fields[i])){
		if(hasFieldKeyword(id, fields[i])){
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

function elasticQueryBuildderToRuleThemAll(id, timesArray, dataset, fields, limit, stats, statField, incTime, urlencode, filter){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// timesArray = [["2020-05-30T14:00:00+01:00", "2020-05-30T14:00:59+01:00"], [...], ], 
	// dataset = compare, not match, etc
	// fields = ["field1", ].   Multiple fields for stacked aggs,
	// limit = 1, though we are doing aggs, still output 1 real entry?
	// stats = boolean, whether to include extended_stats (avg, mean, std_Dev)
	// statfield = "field1", the field on which to do stats
	// incTime = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// urlenccode = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?

	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')

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
	
	//var mappings = connectors.handletox(retrieveSquareParam(id, 'CH'), "mappings")


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
		query = elastic_must_add(query, dataset, masterMappings[dst][indexPattern])
	}

	
	////////////////////////////////
	// MUST_NOT
	////////////////////////////////
	if(dataset['notexist']){
		query = elastic_mustNot_add(query, dataset)
	}

	////////////////////////////////
	// Filter
	////////////////////////////////
	if(filter){
		query['query']['bool']['filter'] = {"script":{"script":filter}}
	}



	////////////////////////////////
	// AGGS
	////////////////////////////////
	var agg = {}
	var node = agg
	for(var i = 0 ; i < fields.length ; i++){

		node['field'] = {}
		node['field']['terms'] = {}
		

		// if(_.contains(masterMappings[dst][indexPattern].keywordFields, fields[i])){
		if(hasFieldKeyword(id, fields[i])){
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







async function elasticQueryBuildderAggScriptDayHour(id, timesArray, dataset, fields, limit, stats, statField, incTime, urlencode, aggTime, maxAccuracy, filter){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// timesArray = [["2020-05-30T14:00:00+01:00", "2020-05-30T14:00:59+01:00"], [...], ], 
	// dataset = compare, not match, etc
	// fields = ["field1", ].   Multiple fields for stacked aggs,
	// limit = 1, though we are doing aggs, still output 1 real entry?
	// stats = boolean, whether to include extended_stats (avg, mean, std_Dev)
	// statfield = "field1", the field on which to do stats
	// incTime = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// urlenccode = boolean, pivot to Elastic interface does need time.  Move this usecase out of here?
	// aggTimeScriptNames = date tiem function for Elastic e.g. "getHour"
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
			"time_ranges": {
				"terms": {
					"size": GLB.dftAggregationSize,
					"script": {
						"source": "doc['@timestamp'].value."+aggTime
					}
				}
			}
		},
		"size": limit
	}
	
	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')
	var thisMappings = await getSavedMappings(dst, indexPattern, true)

	////////////////////////////////
	// max accuracy
	////////////////////////////////
	if(maxAccuracy){
		query['aggs']['time_ranges']['terms']['size'] = 2147483647
		// query['aggs']['time_ranges']['aggs']['time_ranges']['terms']['size'] = 2147483647
	}else{
		// do nothing, if size not declared it defaults
	}



	////////////////////////////////
	// build range of times, 1+
	////////////////////////////////

	_.each(timesArray, function(timeRange){

		var from = moment.unix(timeRange[0]).format()
		var to = moment.unix(timeRange[1]).format()

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
		query = elastic_must_add(query, dataset, thisMappings)
	}

	////////////////////////////////
	// MUST_NOT
	////////////////////////////////
	if(dataset['notexist']){
		query = elastic_mustNot_add(query, dataset)
	}


	////////////////////////////////
	// Filter
	////////////////////////////////
	if(filter){
		query['query']['bool']['filter'] = {"script":{"script":filter}}
	}

	return query;


}

