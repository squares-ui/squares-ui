graphs_functions_json.add_graphs_json({
	"apache":{
		"SSL PieCharts":{
			"populate":"populate_apache_ssl_piecharts",
			"rawtoprocessed":"process_apache_ssl_piecharts",
			"param": "", 
			"graph":"graph_apache_ssl_piecharts",
			"about": "Analyse ratio of SSL (port 443)"
		}
	}
});


function populate_apache_ssl_piecharts(id){
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 
	qq("from: "+from+" to:"+to);
	
	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	var Ds = btoa(calcDs(id, []));
	// graph type determines the fields
	var fields = btoa("srcip,size,port");
	apache_connector(id, from, to, Ds, fields);
	
}



function process_apache_ssl_piecharts(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	// successful output is 1 row (CSV headers) and 1 empty row....  so <2 rows means no data
	var testData = data.split("\n");
	if(testData.length <3){
		graphNoData(id);
		return;
	}else{
		qq("Data found for #"+id+", displaying");
	}

	data2 = d3.csvParse(data);	

	var data3 = Object ();
	data3.portAll = new Object();
	data3.portAll.requests=0;
	data3.portAll.bytes=0;
	data3.port80 = new Object();
	data3.port80.requests=0;
	data3.port80.bytes=0;
	data3.port443 = new Object();
	data3.port443.requests=0;
	data3.port443.bytes=0;

	data2.forEach(function(row){
		var actualBytes = parseInt(row.size) || 0;
		data3.portAll.requests++;
		data3.portAll.bytes = data3.portAll.bytes + actualBytes;
		if(row.port == "80"){
			data3.port80.requests++;
			data3.port80.bytes = data3.port80.bytes + actualBytes;
		}else if(row.port == "443"){
			data3.port443.requests++;
			data3.port443.bytes = data3.port443.bytes + actualBytes;
		}

	})


	saveProcessedData(id, '', data3);
}


function graph_apache_ssl_piecharts(id){

	//  https://bl.ocks.org/syntagmatic/eebcb592d3fdd9ac4a5c92361c1e7066

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;

	var thisSVG = square
		.append("svg")
		.attr("width", "100%")
		.attr("height", "100%")

	var radius = 15;	

	var data = retrieveSquareParam(id, 'processeddata');
	var tau = 2 * Math.PI; 
	var arc = d3.arc()
		.outerRadius(height / 4 - 10)
		.innerRadius(height / 4 - 60)
		.startAngle(0)

	var fo = thisSVG.append("svg:foreignObject")
	    	.attr("width", width)
	    	.attr("height", height)
		.attr("id", function(d){ return "fo_"+d.id })
	fo.append('xhtml:div')
	    	.classed("graph_updater_centertext", true)
	fo.append('xhtml:div')
	    	.classed("graph_updater_centertext", true)
		.attr("id", function(d){ return "square_updater_"+d.id+"_centertext" })
		.html(data.port443.requests+"/"+data.portAll.requests+"<br>Requests<br><br>")

	fo.append('xhtml:div')
	    	.classed("graph_updater_centertext", true)

	fo.append('xhtml:div')
	    	.classed("graph_updater_centertext", true)
		.attr("id", function(d){ return "square_updater_"+d.id+"_centertext" })
		.html(countBytes(data.port443.bytes)+"/"+countBytes(data.portAll.bytes)+"<br>Bytes")


	var requestsG = thisSVG.append("g").attr("transform", "translate(" + width / 2 + "," + height / 4 + ")");
	var foreground = requestsG.append("path")
		.datum({endAngle: (data.port443.requests/data.portAll.requests) * tau})
		.classed("theme_col_3_unsat", true)
		.attr("d", arc)
		.on("mouseenter", function(d) {
			$("#hoverInfo").text("Port 443");
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"port":"443"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})
	var foreground = requestsG.append("path")
		.datum({startAngle: (data.port443.requests/data.portAll.requests) * tau, endAngle: tau})
		.classed("theme_col_4_unsat", true)
		.attr("d", arc)
		.on("mouseenter", function(d) {
			$("#hoverInfo").text("Port 80");
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"port":"80"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})

	var bytesG = thisSVG.append("g").attr("transform", "translate(" + width / 2 + "," + (height / 4 * 3) + ")");
	var foreground = bytesG.append("path")
		.datum({endAngle: (data.port443.bytes/data.portAll.bytes) * tau})
		.classed("theme_col_3_unsat", true)
		.attr("d", arc)
		.on("mouseenter", function(d) {
			$("#hoverInfo").text("Port 443");
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"port":"443"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})
	var foreground = bytesG.append("path")
		.datum({startAngle: (data.port443.bytes/data.portAll.bytes) * tau, endAngle: tau})
		.classed("theme_col_4_unsat", true)
		.attr("d", arc)
		.on("mouseenter", function(d) {
			$("#hoverInfo").text("Port 80");
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"port":"80"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})






}	







