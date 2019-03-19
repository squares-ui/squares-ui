graphs_functions_json.add_graphs_json({
	"apache":{
		"Flag Grid":{
			"populate":"populate_apache_flag_grid",
			"rawtoprocessed":"process_apache_flag_grid",
			"param": "", 
			"graph":"graph_apache_flag_grid",
			"about": "Analyse ratio of SSL (port 443)"
		}
	}
});


function populate_apache_flag_grid(id){
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	var regex = '{"url": "identify.php"}';
	var Ds = btoa(calcDs(id, [regex]));
	// graph type determines the fields
	var fields = btoa("language");

	apache_connector(id, from, to, Ds, fields);
}



function process_apache_flag_grid(id){
	var data = retrieveSquareParam(id, 'rawdata_'+'');

	//qq("data in :"+data);
	
	tmpdata = new Object();
	data.split("\n").forEach(function(row){
		if(row=="language" || row=="-" || row==""){
			return;
		}
		if(tmpdata[row] != null){
			qq("doesnt exist");
			tmpdata[row] = tmpdata[row] + 1;
		}else{
			qq("does exist");
			tmpdata[row] = 1;
		}	
	})
	//qq("data mid :"+JSON.stringify(tmpdata));
	dataout = new Object();
	dataout['name'] = "flare";
	dataout['children'] = [];

	for (var key in tmpdata) {
		dataout.children.push({"name": key, "size": tmpdata[key]});
	}


	//qq("data out :"+JSON.stringify(dataout));
	saveProcessedData(id, '', dataout);
}


function graph_apache_flag_grid(id){
	
	// https://bl.ocks.org/mbostock/4063582

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


	var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
	color = d3.scaleOrdinal(d3.schemeCategory20.map(fader)),
	format = d3.format(",d");

	  var treemap = d3.treemap()
	    .tile(d3.treemapResquarify)
	    .size([width, height])
	    .round(true)
	    .paddingInner(1);




	  var root = d3.hierarchy(data)
	      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
	      .sum(sumBySize)
	      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

	  treemap(root);


	  var cell = square.selectAll("g")
	    .data(root.leaves())
	    .enter().append("g")
	      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

	  cell.append("rect")
	      .attr("id", function(d) { return d.data.id; })
	      .attr("width", function(d) { return d.x1 - d.x0; })
	      .attr("height", function(d) { return d.y1 - d.y0; })
	      .classed("outline_col_2", true)


	  cell.append("clipPath")
	      .attr("id", function(d) { return "clip-" + d.data.id; })
	      .append("use")
	      .attr("xlink:href", function(d) { return "#" + d.data.id; });

	  cell.append("svg:image")
		.attr('x', 0)
		.attr('y', 0)
	//      .attr("width", function(d) { return d.x1 - d.x0; })
	//      .attr("height", function(d) { return d.y1 - d.y0; })
		.attr('width', 40)
		.attr('height', 48)
		.attr("xlink:href", function(d){ return "./icons/flags/"+ d.data.id.split(/\./)[1] +".png"  })

	  cell.append("text")
	      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
	    .selectAll("tspan")
	      .data(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
	    .enter().append("tspan")
	      .attr("x", 50)
	      .attr("y", function(d, i) { return 23 + i * 10; })
	      .text(function(d) { return d; })




	function sumByCount(d) {
	  return d.children ? 0 : 1;
	}

	function sumBySize(d) {
	  return d.size;
	}






}	









