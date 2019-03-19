// Generic AJAX -> SA script for the majority of simple scripts?
function getAttributeApi_Generic(id, attribute, startblock, endblock, filter, topcount, updateNoData, direction, handle){
	// IN : {
	// 	id : Integer. ID or Square that calls the function
	// 	attribute : String. Representing the report type (e.g. "ipv4_initiator")
	// 	startblock : String. ISO standard for beginning of report (e.g. 2016-08-07T18:30:00+01:00)
	// 	endblock : String. ISO standard for beginning of report 
	// 	filter : Array of Strings. Pathbar filters (e.g. [0]="ipv4_initiator=10.0.0.1")
	// 	topcount : Integer. How many results
	// 	updateNoData : Boolean.  Some graphs may not want a lack of results to be in the screen?
	// 	direction : String.  Ascending or Descending [d|a]
	// 	handle : String.  Some Squares have more than one report. This is appended to the saved data as a way to reference it. (e.g. (main|countries|other|usernametable|...)
	//	}
	// Graphs may not need AJAX, and they may not need this file, it's a default easy to use starting point.
	
	//qq("Generic Top X id:"+id+" filter:"+filter);
	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	//ww(arguments.callee.caller.name+" -> "+arguments.callee.name+"()");

	$.ajax({
		type:"post",
			url:"./graphs/SecurityAnalytics/Api_Generic.php"+filter+"&id="+id+"&from="+encodeURIComponent(startblock)+"&to="+encodeURIComponent(endblock)+"&attribute="+attribute+"&direction="+direction+"&sortby=1&topcount="+topcount+"&updateNoData="+updateNoData+"&direction="+direction+"&handle="+handle,
			data: { 
				dst: connectors_json.handletodst(retrieveSquareParam(id, "CH")), 
				username : connectors_json.handletousername(retrieveSquareParam(id, "CH")), 
				apikey : connectors_json.handletoapikey(retrieveSquareParam(id, "CH"))
			},
			dataType: "json",
		success: function(data) {
			if(data['status']['percentage']==100){

				// was the data good?  Should "saveRawData" then call GraphNoData or RawToProcess?  Only I can understand the results
				validdata = false;

				// response has column header name row, then empty row
				if(data.data.length >0 && updateNoData){
					validdata = true;
				}
			
				// get this data saved... code continues in here
				saveRawData(id, validdata, "", data);


					// call the 'rawtoprocessed' function specific to the plugin
					//qq(retrieveSquareParam(id, "Gt"));
					//graph_ajax_fin(id)


			}else{
				// The report has not finished, update the load % and try again
				// a 1 second wait is built into the PHP script between loads
				$("#square_loading_"+id).text("Loading: "+data['status']['percentage']+"%");
				getAttributeApi_Generic(id, data['query']['attribute'], data['query']['startblock'], data['query']['endblock'], filter, data['query']['topcount'], updateNoData, data['query']['direction'], data['query']['handle']);
			}
		},
		error: function( objAJAXRequest, strError ){
			// if post times out, recall with same vars... this is my way to do looping...
			graphGraphError(id, "AJAX Error");	
		}
	});
}
