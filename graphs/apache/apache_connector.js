function apache_connector(id, from, to, regex, fields){

	// XXX move me to a php redirector so API key not see in SAKE code
	var apikey = "bFcr6ZXH8T89DtT7SJcUpBjBHNmqUpQPHcgaJkNk3gTqWOYh2n";


	$.ajax({
		url: 'http://sake.logshape.com/apache_connector.php?from='+from+'&to='+to+'&regex='+regex+'&fields='+fields,
		//url: 'https://www.7blessings.co.uk/other/apache_connector.php?from='+from+'&to='+to+'&regex='+regex+'&fields='+fields,
		type: "POST",
		crossDomain: true,
		data: {"apikey": apikey},
		dataType: "text",
		success: function (response) {
			// Save the data

			// was the data good?  Should "saveRawData" then call GraphNoData or RawToProcess?  Only I can understand the results
			validdata = false;

			// response has column header name row, then empty row
			if(response.split(/\n/).length > 1){
				validdata = true;
			}
		
			// get this data saved... code continues in here
			saveRawData(id, validdata, "", response);
			
		},
		error: function (xhr, status) {
			switch(status) {
				case 404: 
					udpateScreenLog('#'+id+' File not found'); 
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

