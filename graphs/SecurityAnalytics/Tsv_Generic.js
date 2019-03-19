// Generic AJAX -> SA script for the majority of simple scripts?
function getAttributeTsv_Generic(id, fields, startblock, endblock, filter, topcount, updateNoData, handle){
	// IN : {
	// 	id : Integer. ID or Square that calls the function
	// 	fields = Array, TSV headers e.g. ["ipv4_initiator", "..."]
	// 	startblock : String. ISO standard for beginning of report (e.g. 2016-08-07T18:30:00+01:00)
	// 	endblock : String. ISO standard for beginning of report 
	// 	filter : Array of Strings. Pathbar filters (e.g. [0]="ipv4_initiator=10.0.0.1")
	// 	topcount : Integer.  An optional way to limit results?
	// 	updateNoData : Boolean.  Some graphs may not want a lack of results to be in the screen?
	// 	handle : String.  Some Squares have more than one report. This is appended to the saved data as a way to reference it. (e.g. (main|countries|other|usernametable|...)
	//	}
	// Graphs may not need AJAX, and they may not need this file, it's a default easy to use starting point.
	
	ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");
	
	$.ajax({
		type:"POST",
			url:"./graphs/SecurityAnalytics/Tsv_Generic.php?id="+id+"&from="+encodeURIComponent(startblock)+"&to="+encodeURIComponent(endblock),
			data: { 
				fields:fields, 
				filter:filter,
				topcount: topcount, 
				updateNoData:updateNoData, 
				handle: handle,
				dst: connectors_json.handletodst(retrieveSquareParam(id, "CH")), 
				username : connectors_json.handletousername(retrieveSquareParam(id, "CH")), 
				apikey : connectors_json.handletoapikey(retrieveSquareParam(id, "CH"))
			},
			dataType: "text",
		success: function(data) {
			// crude attempt to see if return is valid TSV output
			var re_success = /^#slot_id/;
			if(re_success.test(data)){

				if(data.length <1 && updateNoData){
					// no data AND this plugin/square is happy to report that to the user
					squareSimpleMessage([id], "No Data")
				}else{
			
					// was the data good?  Should "saveRawData" then call GraphNoData or RawToProcess?  Only I can understand the results
					validdata = false;

					// response has column header name row, then empty row
					if(data.length >1 && updateNoData){
						validdata = true;
					}

					// get this data saved... code continues in here
					saveRawData(id, validdata, "", data.split("\n", 1000));

				}

			}else{
				alert("TSV Returned data does not match expected output (id="+id+")");
			}
		},
		error: function( objAJAXRequest, strError ){
			// if post times out, recall with same vars... this is my way to do looping...
				//getAttributetsv_Generic(id, data['query']['attribute'], data['query']['startblock'], data['query']['endblock'], filter, data['query']['topcount'], updateNoData, data['query']['direction'],data['query']['handle']);
			alert("getAttributetsv_Generic time out?  code here needs addressing" + strError);
		}
	});
}
