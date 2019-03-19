graphs_functions_json.add_graphs_json({
	"apache":{
		"IP URL Grid":{
			"populate":"populate_apache_ip_url_grid",
			"rawtoprocessed":"process_apache_ip_url_grid",
			"param": "", 
			"graph":"graph_apache_ip_url_grid",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_ip_url_grid(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	var regex = '{},{}';
	var Ds = btoa(calcDs(id, [regex]));
	// graph type determines the fields
	var fields = btoa("srcip,url");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_ip_url_grid(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	
	// successful output is 1 row (CSV headers) and 1 empty row....  so <2 rows means no data
	var testData = data.split("\n");
	if(testData.length <1){
		graphNoData(id);
		return;
	}else{
		qq("Data found for #"+id+", displaying");
	}


	data2 = d3.csvParse(data);	

	saveProcessedData(id, '', data2);
}


function graph_apache_ip_url_grid(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

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
	var bottomPadding=40;



	var radius = 15;	
	

	var data = retrieveSquareParam(id, 'processeddata');

		
	var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05);
	var y = d3.scaleBand().rangeRound([0, height]).paddingInner(0.05);
	x.domain(data.map(function(d) { return d.srcip; }));
  	y.domain(data.map(function(d) { return d.url; }));



	square.selectAll("dot")
		.data(data)
	.enter().append("circle")
		.attr("r", 3.5)
		.attr("fill", "#121b2a")
		.attr("transform", function(d) { return "translate(" + x(d.srcip) + "," + y(d.url) + ")"; })
		.on("mouseenter", function(d) {
			$("#hoverInfo").text(d.srcip+" "+d.url);
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			ipParts = d.srcip.split(".");
			clickObject = btoa('{"srcip":"'+ipParts[0]+'.'+ipParts[1]+'.'+ipParts[2]+'."}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})

	var localText = square
		.append("text")
		.attr("transform", "translate(20,"+(height-bottomPadding)+")")
		.classed("square_menu_text", "true")
		.classed("fill_col_1", "true")
		.style("order", 3)




}





