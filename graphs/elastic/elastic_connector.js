function elastic_connector(dst, index, id, from, to, filter, fields, limit){


	// loop through fields[], creating object to search with
	let theMust = {"must":[]};
	
	// add arrays from square
	_.each(filter, function(element){ 
		theMust["must"] = theMust["must"].concat(JSON.parse(element))
	})
	
	// set the time
	var timeRange = [{"range":{
			"@timestamp" : { "gte" : from, "lt" :  to }
		}
	}]	
	// add the time
	theMust["must"] = theMust["must"].concat(timeRange)

	// remove any potential duplicates if square have the same condition by accident
	theMust["must"] = _.uniq(theMust["must"])

	$.ajax({
		
		type: "POST",
		contentType: "application/json",
		url: 'http://'+dst+'/'+index+'/_search?',
		dataType: "json",
		data: JSON.stringify({
			
			"query": {
				"bool": theMust
				
			},
				"size": limit,
				"_source": fields
			}),
			
			success: function (response) {
				
				// if(the data appears valid?  JSON check?)}
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

	return new Promise((resolve, reject) => {
		$.ajax({
		
			type: "GET",
			contentType: "application/json",
			url: 'http://'+dst+'/'+index,
			dataType: "json",

			success: function(data) {
			
				var fields = []

				//  'index' might have a wild card and therefore multiple descriptions to combine, so need to look through each returned index
				_(data).each(function(obj, key){
					// now loop through document properties looking for all field names
					_(obj.mappings.doc.properties).each(function(obj2,key2){
						fields.push(key2);
					})

				});
				
				//sort + unique me
				fields = _.sortBy(_.uniq(fields), function(entry){ return entry});
				resolve(fields)
				
			},
			error: function(error) {
				// switch(status) {
				// 	case 404: 
				// 		udpateScreenLog('#'+id+' remote path not found'); 
				// 		break; 
				// 	case 500: 
				// 		udpateScreenLog('#'+id+' Server error'); 
				// 		break; 
				// 	case 0: 
				// 		udpateScreenLog('#'+id+' Request aborted'); 
				// 		break; 
				// 	default: 
				// 		udpateScreenLog('#'+id+' Unknown error ' + status); 	
				// 		break
				// }
				reject(error)
			}
		})
	})
}
