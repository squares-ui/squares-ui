graphs_functions_json.add_graphs_json({
	"apache":{
		"Hits by URL":{
			"populate":"populate_apache_hits_url",
			"rawtoprocessed":"process_apache_hits_url",
			"param": "", 
			"graph":"graph_apache_hits_url",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_hits_url(id){
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	//var regex = '{"url": "^[^\\*]$"},{}';
	var regex = '{},{}';
	var Ds = btoa(calcDs(id, [regex]));
	// graph type determines the fields
	var fields = btoa("url,size");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_hits_url(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	var data2 = d3.csvParse(data, function(d){
		if(d.size=="-"){
			d.size=1;
		}

		return {
			url: d.url,
			size: +d.size
		}
	});

	



	saveProcessedData(id, '', data2);
}


function graph_apache_hits_url(id){

	//  https://bl.ocks.org/syntagmatic/eebcb592d3fdd9ac4a5c92361c1e7066

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	var radius=(width/2);
	var barWidth=2;
	var bottomPadding=40;
	var padding=10;

	var data = retrieveSquareParam(id, 'processeddata');

	var nested_data = d3.nest()
		.key(function(d) { return d.size; })
		.entries(data);
	
	var x = d3.scaleLog()
		.range([0, width-padding-padding])
		.domain([1, d3.max(nested_data.map(function(d) { return d.values[0].size; }))]);

	var y = d3.scaleLinear()
		.range([height-(bottomPadding*2), 0])
		.domain([0, d3.max(nested_data, function(d){  return d.values.length })]);
	
	var gChart = square.append("g")
		.attr("transform", "translate(0,0)")
		
	gChart.append("g")
	  .call(d3.axisBottom(x).ticks())
	  .attr("transform", "translate(0,"+(height-(bottomPadding*2))+")");
	  
	  
	gChart.selectAll(".bar")
		.data(nested_data)
	.enter().append("rect")
		.classed("fill_col_2", "true")
		.attr("x", function(d) { return x(d.values[0].size); })
		.attr("y", function(d) { return y(d.values.length); })
		.attr("width", barWidth)
		.attr("height", function(d) { return height - y(d.values.length) - (bottomPadding*2) })	
		.on("mouseenter", function(d) {
			$("#hoverInfo").text(countBytes(d.values[0].size));
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"size":"'+d.values[0].size+'"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})



	gMinMax = square.append("svg:foreignObject")
		.attr("width", width)
		.attr("transform", "translate(0,"+(height - bottomPadding)+")");
	 
	gMinMax.append("xhtml:div")
		.classed("square_menu_text", "true")
		.classed("fleft", "true")
		.text("Mean Download :" + stringToBytes(Math.floor(d3.mean(data, function(d) { return d.size; }))))

	gMinMax.append("xhtml:div")
		.classed("fleft", "true")
		.text("....................")

	gMinMax.append("xhtml:div")
		.classed("square_menu_text", "true")
		.classed("fleft", "true")
		.text("Biggest Download :" + stringToBytes(Math.floor(d3.max(data, function(d) { return d.size; }))))
		







}











