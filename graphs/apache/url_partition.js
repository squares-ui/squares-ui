graphs_functions_json.add_graphs_json({
	"apache":{
		"URL Partition":{
			"populate":"populate_apache_url_partition",
			"rawtoprocessed":"process_apache_url_partition",
			"param": "", 
			"graph":"graph_apache_url_partition",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_url_partition(id){
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	//var regex = '{"url": "^[^\\*]$"},{}';
	var regex = '{"url": "e"},{}';
	var Ds = btoa(calcDs(id, [regex]));
	// graph type determines the fields
	var fields = btoa("url,size");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_url_partition(id){

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

	var data3 = d3.nest()
	.key( function(d) { return d.url; })
	.rollup(function(d) { 
		return d3.sum(d, function(g) {return g.size; });
	})
	.entries(data2);

	saveProcessedData(id, '', data);
}


function graph_apache_url_partition(id){

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

	var localText = squareContainer
		.append("text")
		.style("order", 3)
		.classed("square_generic_text", true)


	var radius = 15;	
	

	var data = retrieveSquareParam(id, 'processeddata');


var format = d3.format(",d");

var color = d3.scaleOrdinal(d3.schemeCategory10);

var stratify = d3.stratify()
    .parentId(function(d) { 
	    return d.data.key.substring(0, d.key.lastIndexOf("/")); });

var partition = d3.partition()
    .size([height, width])
    .padding(1)
    .round(true);



var root = stratify(data)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });


var cell = square
    .selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + d.y0 + "," + d.x0 + ")"; });


  cell.append("rect")
      .attr("id", function(d) { return "rect-" + d.key; })
      .attr("width", function(d) { return d.y1 - d.y0; })
      .attr("height", function(d) { return d.x1 - d.x0; })
    .filter(function(d) { return !d.children; })
      .style("fill", function(d) { while (d.depth > 1) d = d.parent; return color(d.key); });

  cell.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.key; })
    .append("use")
      .attr("xlink:href", function(d) { return "#rect-" + d.key + ""; });

  cell.append("text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.key + ")"; })
      .attr("x", 4)
    .selectAll("tspan")
      .data(function(d) { return [d.key.substring(d.key.lastIndexOf("/") + 1), " " + format(d.value)]; })
    .enter().append("tspan")
      .attr("y", 13)
      .text(function(d) { return d; });

  cell.append("title")
      .text(function(d) { return d.key + "\n" + format(d.value); });	



}





