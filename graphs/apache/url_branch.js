graphs_functions_json.add_graphs_json({
	"apache":{
		"URL Path Branch":{
			"populate":"populate_apache_url_branch",
			"rawtoprocessed":"process_apache_url_branch",
			"param": "", 
			"graph":"graph_apache_url_branch",
			"about": "Dump rows to square"
		}
	}
});


function populate_apache_url_branch(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0);
	var from = (to - retrieveSquareParam(id, "Ws")); 

	// {"fields": "size,url","regex": [{"srcip": "1"},{"http_response": "^[^2]"}]}
	//var regex = '{"url": "^[^\\*]$"},{}';
	var Ds = btoa(calcDs(id, []));
	// graph type determines the fields
	var fields = btoa("size,url");

	apache_connector(id, from, to, Ds, fields);

}



function process_apache_url_branch(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	
	var data2 = d3.csvParse(data);

	data2.forEach(function(row) {
		row.taxonomy = row.url.split("/");
	});
	
	
	
	
	saveProcessedData(id, '', data2);
}


function graph_apache_url_branch(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	var radius=(width/2);

	var data = retrieveSquareParam(id, 'processeddata');

	var bottomPadding=40;

	var tree = d3.tree()
		.size([360, radius - 20])
		.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });	
	
	var treeGrid = square.append("g")
			.attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");
		
	var tooltip = treeGrid.append("text")
		.classed("fill_col_1", "true")//add the tooltip class
		.style("visibility", "hidden")
	
	

	var root = d3.hierarchy(burrow(data));
	tree(root);


	var link = treeGrid.selectAll(".link")
		.data(root.descendants().slice(1))
	.enter().append("path")
		.attr("class", "link")
		.attr("d", function(d) {
			return "M" + project(d.x, d.y)
				+ "C" + project(d.x, (d.y + d.parent.y) / 2)
				+ " " + project(d.parent.x, (d.y + d.parent.y) / 2)
				+ " " + project(d.parent.x, d.parent.y);
		});

	var node = treeGrid.selectAll(".node")
		.data(root.descendants().slice(1))
	.enter().append("g")
		.attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
		.attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

	node.append("circle")
		.attr("r", 10)
		.classed("fill_col_1", "true")
		.on("mouseenter", function(d) {
			fullPath = [];
			for (var i = 0; i < d.ancestors().length; i++) {
				// prepend the array with the parent path
				fullPath.unshift(d.ancestors()[i].data.name);
			}
			fullPath.splice(0, 1);
			stringPath = fullPath.join("/");
			
			$("#hoverInfo").text(stringPath);
			$("#hoverInfo").css("visibility", "visible");
			$("#hoverInfo").css({top:  d3.event.clientY, left: d3.event.clientX+10 });
		})
		.on("mouseout", function(d){
			$("#hoverInfo").css("visibility", "hidden");
		})
		.on("click", function(d){
			fullPath = [];
			for (var i = 0; i < d.ancestors().length; i++) {
				// prepend the array with the parent path
				fullPath.unshift(d.ancestors()[i].data.name);
			}
			fullPath.splice(0, 1);
			stringPath = fullPath.join("/");
			
			clickObject = btoa('{"url":"'+stringPath+'"}');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})


 
	gFullPath = square.append("text")
		.attr("transform", "translate(20,"+(height-bottomPadding)+")")
		.classed("fill_col_1", "true")
		.classed("square_menu_text", "true")
		.attr("id", "gFullPath_"+id);

		
}
function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [(radius * Math.cos(angle) ), radius * Math.sin(angle)];
}
function projectText(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [(radius * Math.cos(angle)+10 ), radius * Math.sin(angle)];
}











