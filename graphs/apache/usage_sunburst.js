graphs_functions_json.add_graphs_json({
	"apache":{
		"Usage Sunburst":{
			"populate":"populate_apache_usage_sunburst",
			"rawtoprocessed":"process_apache_usage_sunburst",
			"param": "", 
			"graph":"graph_apache_usage_sunburst",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_usage_sunburst(id){
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	var Ds = btoa(calcDs(id, []));
	// graph type determines the fields
	var fields = btoa("url,size");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_usage_sunburst(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	data2 = d3.csvParse(data, function(d) {
		if(d.size=="-"){
			return {
			  url: d.url, 
			  size: 0, 
			  };

		}else{
			return {
			  url: d.url, 
			  size: +d.size, 
			  };

		}
	});

	// nest and sum each speficif URL
	var data3 = d3.nest()
	    .key(function(d) { return d.url; })
	    .rollup(function(leaves) { return leaves.length; })
	    .entries(data2);

	// create an object with a root node
	var data4 = new Object();
	data4.key="/";
	data4.children = new Array();
	data3.forEach(function(child){
		data4.children.push(child);
	})

	
	saveProcessedData(id, '', data4);
}


function graph_apache_usage_sunburst(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var radius=(width/2);

	var data = retrieveSquareParam(id, 'processeddata');

	var partitionLayout = d3.partition()
	  .size([2 * Math.PI, radius])

	var arcGenerator = d3.arc()
	  .startAngle(function(d) { return d.x0; })
	  .endAngle(function(d) { return d.x1; })
	  .innerRadius(function(d) { return d.y0  })
	  .outerRadius(function(d) { return d.y1 });

	var rootNode = d3.hierarchy(data)

	rootNode.sum(function(d) {
	  return d.value;
	});

	partitionLayout(rootNode);

	var arcs = square.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
		.selectAll('path')
		.data(rootNode.descendants())
		.enter()


	arcs.append('path')
		.classed("arc", "true")
		.attr('d', arcGenerator)
		.on("mouseenter", function(d) {
			$("#hoverInfo").text(d.data.key);
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			clickObject = btoa('{"url":"'+d.data.key+'"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})


//        arcs.append("text")                                     
//	        .classed("fill_col_1", "true")
//        	.attr("transform", function(d) {                    
//	        	d.innerRadius = (r*0.5);
//	         	d.outerRadius = (r*1);
//			return "translate(" + arc.centroid(d) + ")";        
//		})
//	   	.attr("text-anchor", "middle")                          
//        	.text(function(d, i) { 
//			return data.name; 
//		})

}


