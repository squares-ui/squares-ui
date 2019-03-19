graphs_functions_json.add_graphs_json({
	"apache":{
		"IP Hierarchy":{
			"populate":"populate_apache_ip_hierarchy",
			"rawtoprocessed":"process_apache_ip_hierarchy",
			"param": "", 
			"graph":"graph_apache_ip_hierarchy",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_ip_hierarchy(id){
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	var Ds = btoa(calcDs(id, []));
	// graph type determines the fields
	var fields = btoa("srcip,size");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_ip_hierarchy(id){

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

	// splitting keys into an array is required before passing data into burrow
	data2.forEach(function(row) {
		row.taxonomy = row.srcip.substring(1).split(".");
	});

	saveProcessedData(id, '', data2);
}


function graph_apache_ip_hierarchy(id){

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

	var radius = 15;	
	
	$("#square_"+id).height( height ); // ugly 5

	var data = retrieveSquareParam(id, 'processeddata');

	var tree = d3.tree()
	    .size([360, width/2 ])
	    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth/2; });

	var svg = square.append("g")
		.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

	var root = d3.hierarchy(burrow(data));

	tree(root);

	var link = svg.selectAll(".link")
		.data(root.descendants().slice(1))
	.enter().append("path")
		.classed("link", true)
		.classed("theme_fruity_link", true)
		.attr("d", function(d) {
			return "M" + project(d.x, d.y)
			+ "C" + project(d.x, (d.y + d.parent.y) / 2)
			+ " " + project(d.parent.x, (d.y + d.parent.y) / 2)
			+ " " + project(d.parent.x, d.parent.y);
		});

	var node = svg.selectAll(".node")
		.data(root.descendants())
	.enter().append("g")
		.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
		.attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

	node.append("circle")
		.attr("r", 1.5);

	node.append("text")
		.attr("dy", "0.31em")
		.attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
		.classed("small_words", true)
		.classed("theme_col_3_unsat", true)
		.style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; })
		.attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
		.text(function(d) { return d.data.name; })
		.on("mouseenter", function(d) {
			$("#hoverInfo").text(d.data.name);
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"url":"'+stringPath+'"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})





}	


function project(x, y) {
	var angle = (x - 90) / 180 * Math.PI, radius = y;
	return [radius * Math.cos(angle), radius * Math.sin(angle)];
}





