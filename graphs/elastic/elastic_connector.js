//////////////////////////////////////////
//////////////////////////////////////////
/// Functions to build the complex Elastic queries
//////////////////////////////////////////
//////////////////////////////////////////



async function elasticQueryBuildderToRuleThemAllandOr(id, timesArray, limit, incTime, filter, aggsTerm, aggsTermTime, aggsRanges, maxAccuracy, aggFields, stats, statField, outputFields, existFields){
	ee(" -> "+arguments.callee.name+"("+id+")");
	qqq = false




	//// basic
	// id: 12
	// timesArray: [[epoch, epoch], [], ]
	// dataset: {"compare":{}, "notcompare":{}}
	// orNest: {}
	// limit: 1000
	// incTime: true
	// filter: "doc['@timestamp'].value.getMonth()"
	
	//// aggs
	// aggsTerm: boolean
	// aggsTermTime: "getMonth()"
	// aggsRanges: boolean 
	// aggsRangesInput: <<uses timeArray as input>>
	
	// maxAccuracy: boolean
	// fields: ["copntinent.name", "city.name", ""]	
	// stats: true
	// statField: "destination.port"


	if(aggsTerm && aggsRanges){
		alert("elasticQueryBuildderToRuleThemAllandOr: pick aggsTerm || aggsRanges")
		return
	}

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var indexPattern = "*"	  
	var thisMappings = await getMappingsData(thisDst, indexPattern, true)



	// initate recursive loop with empty data
	allPaths = elasticNestCalculator(retrieveSquareParam(id, "Ps", false), [], [])
	// for id=15 : [[14, 13, 12, 1], [2, 1]]

	// intersection to find the IDs that appears in every path (typically the first x, and the last x)
	commonSquares = _.intersection.apply(_, allPaths)  // => [1]
	commonSquares.push(id)
	// qq(commonSquares)  // =>   [1,15]


	// find squares unique to a path
	orPaths = []
	_.each(allPaths, function(path){
		orPaths.push(_.difference(path, commonSquares))
	})
	// qq(orPaths) // =>  [[14,13,12],[2]]

	


	////////////////////////////////
	// create basics
	////////////////////////////////
	var query = 
	{
		"query":{
			"bool":{
				"must":[],
				"must_not":[]
				
			},			
		},
		"aggs":{},
		"size": limit
	}


	////////////////////////////////
	// add query time ranges as the first Must
	////////////////////////////////

	// only add times if this query is being used by Squares.  If we are building a query for pivot, don't include this
	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" timeframes")
	if(incTime == true){
		jsonTimeRanges = []
		_.each(timesArray, function(timeRange){
			var from = moment.unix(timeRange[0]).format()
			var to = moment.unix(timeRange[1]).format()

			// Add time ranges to the SHOULD
			var shouldObj = {"range":{"@timestamp":{}}}
			shouldObj['range']['@timestamp']['gte'] = from
			shouldObj['range']['@timestamp']['lt'] = to
			jsonTimeRanges.push(shouldObj)
		})
		query.query.bool.must.push({"bool": {"minimum_should_match": 1,"should": jsonTimeRanges}})
	}

	
	////////////////////////////////
	// add common Must comments (typically the first, or last, squares in the chain)
	////////////////////////////////
	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" MUST common to every path "+JSON.stringify(commonSquares))
	_.each(commonSquares, function(id){

		var thisDs = retrieveSquareParam(id, "Ds", false)

		// the Must for all squares
		if(thisDs){
			
			thisDs = JSON.parse(atob(thisDs))
			
			if(thisDs.hasOwnProperty("compare")){
				_.each(thisDs['compare'], function(comp){
					qq("adding Must id:"+id+", comp:"+JSON.stringify(comp))
					query.query.bool.must.push(elasticPrepKeyword(_.keys(comp)[0], _.values(comp)[0], thisMappings))
				})
			}

			if(thisDs.hasOwnProperty("notexist")){
				_.each(thisDs['notexist'], function(comp){
					query.query.bool.must_not.push({"exists": {"field": comp}})
				})
			}

			// thisDs.hasOwnProperty("exist")
			// not really to be built into chaings of squares? 
			// should this be more a square definition instead?



		}

		// filters
		var thisFi = retrieveSquareParam(id, "Fi", false)
		if(thisFi){
			query.query.bool.filter = {"script": {"script":thisFi}}
		}

	})
	

	////////////////////////////////
	// some square types demand specific fields exist, add this condition as a new "must" chain seperate from being calculated from parent squares
	////////////////////////////////
	if(existFields){
		_.each(existFields, function(field){
			query['query']['bool']['must'].push({"exists": {"field": field }})
		})		
	}




	////////////////////////////////
	// aggs, by time range (inbetween dates) or by time term (e.g. group by day of week)
	////////////////////////////////
	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" agg by time frames")
		
	if(aggsTerm){
	
		query['aggs']['time_ranges'] = {
			"terms": {
				"size": GLB.dftAggregationSize,
				"script": {
					"source": "doc['@timestamp'].value."+aggsTermTime
				}
			}
		}

	}else if(aggsRanges){

		query['aggs']['time_ranges'] = {
			"range": {
				"field": "@timestamp",
				"ranges": []
			}
		}
		_.each(timesArray, function(timeRange){
			var from = moment.unix(timeRange[0]).format()
			var to = moment.unix(timeRange[1]).format()
			// also add time ranges to the aggregate bucket sizes
			var aggObj = {"from":from, "to":to}
			query['aggs']['time_ranges']['range']['ranges'].push(aggObj)
	
		})
	}

	
	////////////////////////////////
	// AGGS
	////////////////////////////////
	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" agg by query")
	if(aggFields.length>0){
		

		
		var agg = {}
		var node = agg
		for(var i = 0 ; i < aggFields.length ; i++){

			node['field'] = {}
			node['field']['terms'] = {}

			if(await hasFieldKeyword(id, aggFields[i])){
				node['field']['terms']['field'] = (aggFields[i]+".keyword")
			}else{
				node['field']['terms']['field'] = aggFields[i]
			}


			node['field']['terms']['size'] = 20
			if(maxAccuracy){
				node['field']['terms']['size'] = 2147483647	
			}

			if(aggFields.length > i+1){
				// more aggFields, go deeper
				// qq(aggFields.length +">"+ (i + 1))
				node['field']['aggs'] = {}
				node = node['field']['aggs']

			}else if(stats == true){
				// final field, append agg stats
				// qq("'else' "+aggFields.length+ ", i:"+(i+1))

				node['field']['aggs'] = {}
				node['field']['aggs']['stats'] = {}
				node['field']['aggs']['stats']['extended_stats'] = {}
				node['field']['aggs']['stats']['extended_stats']['field'] = statField
			}else{
				// do nothing more?
			}

		}
		query['aggs']['time_ranges']['aggs'] = agg
	}

	////////////////////////////////
	// add "or" data querues, typically in the middle of square chains
	////////////////////////////////
	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" MUST for OR paths")
	var theBigOr = {}
	
	//theBigOr = {"bool":{"minimum_should_match": 1,"should": []}}   // only build this if a paths has critiera, otherwise we have empty clauses in queries
	
	_.each(orPaths.reverse(), function(path){
		
		// qq("validating or:"+JSON.stringify(path))

		var thisOr = {"bool":{ }}

		_.each(path, function(id){
			// qq("validating id:"+id)
			var thisDs = retrieveSquareParam(id, "Ds", false)
			
			if(thisDs){
				thisDs = JSON.parse(atob(thisDs))

				// qq("----")
				// qq(id)
				// qq(thisDs)
				if(thisDs.hasOwnProperty("compare")){
					thisOr.bool.must = []
					_.each(thisDs['compare'], function(comp){
						thisOr.bool.must.push(elasticPrepKeyword(_.keys(comp)[0], _.values(comp)[0], thisMappings))
					})
				}

				if(thisDs.hasOwnProperty("notexist")){
					thisOr.bool.must_not = []
					_.each(thisDs['notexist'], function(comp){
						thisOr.bool.must_not.push({"exists": {"field": comp}})
					})
				}
			}


			var thisFi = retrieveSquareParam(id, "Fi", false)
			if(thisFi){
				thisOr.bool.filter = {"script": {"script":thisFi}}
			}

		})


		if(thisOr.bool.hasOwnProperty("must") && thisOr.bool.must.length>0){
			if(!theBigOr.hasOwnProperty("bool")){
				theBigOr.bool = {}
				theBigOr.bool.minimum_should_match = 1
				theBigOr.bool.should = []
			}
			theBigOr.bool.should.push(thisOr)		
		}

	})


	////////////////////////////////
	// add outputFields for the raw output (e.g. not Aggs)
	////////////////////////////////
	if(outputFields){
		query._source = outputFields
	}
	
	


	qqq && qq("elasticQueryBuildderToRuleThemAllandOr id:"+id+" timeframes")
	if(theBigOr.hasOwnProperty("bool")){
		query.query.bool.must.push(theBigOr)
	}

	return query
}




function elasticNestCalculator(PrIds, path, theReturn){

	// PrIds = [] or all parent Ids (master parent, and "or" parents)
	// calculate arrays for each path to root square
	// then _.intersection() for "common" requirements

	_.each(PrIds, function(prId){
		
		path.push(prId)
		
		//is this prID a root?
		var theParent = retrieveSquareParam(prId, "Pr", false)
		if(theParent == "0" || !theParent){
			// top of square, commit path and return
			
			theReturn.push(path)
			
			return theReturn

		}else{
			// keep going up
			elasticNestCalculator(retrieveSquareParam(prId, "Ps", false), path, theReturn)
			path = [];
		}

		

	})

	// an array of paths back to root square
	// [[11,8,3,2,1],[10,9,3,2,1],[5,2,1],[6,4,2,1],[7,4,2,1]]
	return theReturn
	

}

function elasticPrepKeyword(key, val, mappings){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+key+", "+val+")");
	var miniObj = {}
	if(_.contains(mappings.keywordFields, key)){
		miniObj[key+".keyword"] = val			
	}else{
		miniObj[key] = val
	}	
	miniObj = {"term": miniObj}
	
	// miniObj = {"term": {"key.keyword":"value"}}
	return miniObj;
}






//////////////////////////////////////////
//////////////////////////////////////////
///  Elastic API AJAX Post
//////////////////////////////////////////
//////////////////////////////////////////




async function elastic_connector(dst, indexPattern, id, query, name){
	ee(" -> "+arguments.callee.name+"("+JSON.stringify(id)+", "+indexPattern+", "+id+", "+query+", "+name+")");


	var queryBodyJSON = JSON.stringify(query);
	var response;
	var responseData = {"id":id, "name":name, "error": null}



	// In demo mode, just reply with "yes it works"
	if(GLB.demoMode){		
		responseData.data = {"took":1,"timed_out":false,"_shards":{"total":1,"successful":1,"skipped":0,"failed":1,"failures":[]},"hits":{"total":{"value":1,"relation":"eq"},"max_score":null,"hits":[]}}		
		return(responseData)
	}


	
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
			if(response.hasOwnProperty("aggs")){
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
				responseData['error'] = "Nothing to render"
			}
		
		}else{
			// throw "No Hits"
			responseData['data'] = null
			responseData['error'] = "No data found"
		}

		return(responseData)

	} catch (error) {
		ww(0, arguments.callee.name+" id:"+id+" e:"+JSON.stringify(error));
		graphGraphError(id, JSON.stringify(error))
		// return({"id":id, "name":name, "data":null})
	}
	
    
}


function elastic_test_connector(id, name, dst){
	// query for 0 records, but see if we can connect, used for health testing
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// In demo mode, just reply with "yes it works"
	if(GLB.demoMode){
		qq("Faking test_connector for id"+id)
		return new Promise((resolve, reject) => {
			fakeResponse = {"took":4,"timed_out":false,"_shards":{"total":65,"successful":64,"skipped":0,"failed":1,"failures":[]},"hits":{"total":{"value":0,"relation":"eq"},"max_score":null,"hits":[]}}
			resolve({"id":id, "name": name, "dst": dst, "data":fakeResponse})
		})
	}


	var query = {"size":0, "_source":[]}

	var queryBodyJSON = JSON.stringify(query);
	
	return new Promise((resolve, reject) => {
		
		$.ajax({
			type: "POST",
			contentType: "application/json",
			url: 'http://'+dst+'/*/_search?',
			dataType: "json",
			data: queryBodyJSON,

			success: function (response) {
					
				// saveRawData(id, validdata, index, response);
				resolve({"id":id, "name": name, "dst": dst, "data":response})
			},
			error: function (xhr, status) {
				// Any ajax error should still resolve (not reject) as the process is not broken for "test_connector"
				
				switch(status) {
					case 404: 
						resolve({"id":id, "name": name, "dst": dst, "data":{"error":"404"}})
						// reject (status+' remote path not found')
						break; 
					case 500: 
						resolve({"id":id, "name": name, "dst": dst, "data":{"error":"500"}})
						// reject (status+' Server error')
						break; 
					case 0: 
						resolve({"id":id, "name": name, "dst": dst, "data":{"error":"unknown"}})	
						// udpateScreenLog('#'+id+' Request aborted'); 
						// reject (status+' Request aborted')
						break; 
					default: 
						resolve({"id":id, "name": name, "dst": dst, "data":{"error": "Timeout"}})
						// udpateScreenLog('#'+id+' Unknown error ' + status); 	
						// reject (status+' Unknown error ' + status)
						break
				}
			}
		});
	})
}







//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
// Mappings
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////




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
			addPageStatus("critical", "Network error connecting to '"+dst+"' have you enabled CORS?")

			ww(0, "arguments.callee.name, id:"+id+",  "+JSON.stringify(error));
			return null
		}
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
	return tmp}



//////////////////////////////////////////
//////////////////////////////////////////
///   Supporting elastic functions
//////////////////////////////////////////
//////////////////////////////////////////


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


async function hasFieldKeyword(id, keyword){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+keyword+")");

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	


	if(_.contains(masterMappings[thisDst][thisIndex].keywordFields, keyword)){
		// qq(keyword+".keyword")
		return true
	}else{
		// qq(keyword+".____")
		return false
	}
}













////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// code grave yard
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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


function elastic_version(handle){
	// API calls differ, this helps code adjust

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

	var dst = connectors.handletox(handle, "dst")

	$.ajax({
		type: "GET",
		contentType: "application/json",
		url: 'http://'+dst+'/',
		dataType: "json",
		

		success: function (response) {
			// ww(1, "setting elasticVersion for handle:"+handle)
			connectors.setConnectorAttribute(handle, "elasticVersion", response['version']['number'])
		},
		error: function (xhr, status) {
			switch(status) {
				case 404: 
					udpateScreenLog(dest+' 400: Malfored Query'); 
					break; 
				case 500: 
					udpateScreenLog(dest+' Server error'); 
					break; 
				case 0: 
					udpateScreenLog(dest+' Request aborted'); 
					break; 
				default: 
					graphGraphError(id, "Connection timeout? CORS?")	
					udpateScreenLog(dest+' Unknown error ' + status); 	
					break
			}
		}
    });	
}






function elastic_query_builder(id, from, to, dataset, fields, limit, incTime = true, incNull = true, urlEncode, filter){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	alert("Code graveyard aasdqwdwertdr id:"+id)
	return


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

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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

	// qq(timesArray)

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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



function clickObjectsToDataset(id, compare, notexist){
	// input array of compare/notexist from square and all parents
	// return a nice object
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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






function elastic_must_add(query, dataset, mappings){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+query+")");

	alert(arguments.callee.name+" in graveyard id:"+id)
	return

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
	
	alert(arguments.callee.name+" in graveyard id:"+id)
	return

	// Compile "Mustnot" as in "must not exist" (or null)
	//
	_.each(dataset['notexist'], function(notex){
		query['query']['bool']['must_not'].push({"exists": {"field": notex}})
	})

	return query
}



function elasticMustMustNot(must, mustnot, timerange){
	
	alert(arguments.callee.name+" in graveyard id:"+id)
	return

	// must = [{"field":"value"},{...}]
	// mustnot = ["field1"","field2"]
	// timerange = [epoch,epoch]

	//output is 
	
}

