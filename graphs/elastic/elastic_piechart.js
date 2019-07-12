graphs_functions_json.add_graphs_json({
	"elastic":{
		"Pie Chart":{
			"completeForm": "elastic_completeform_piechart",			
			"processForm": "elastic_processform_piechart",			
			"populate": "elastic_populate_piechart",
			"rawtoprocessed":"elastic_rawtoprocessed_piechart",
			"graph":"elastic_graph_piechart",
			"about": "PieChart hits by field.",
		}
	}
});

function elastic_completeform_piechart(id, targetDiv){

	// called by editsquare allowing each square graph type to have custom 'parameters'
	// This function can potentially make multiple (async) queries to API and then apply output to a master JSON object.
	// Sync not an option
	// Async difficult to handle
	// promise.all appears to be the best way.  Construct the list of promises that will each master the jsonform{}

	const jsonform = {
		"schema": {
		  "custom_field": {
			"type": "string",
			"title": "Groupby", 
			"enum": []
			
		  }
		},
		"form": [
		  {
			"key": "custom_field"
	
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_field.enum = results
			$(targetDiv).jsonForm(jsonform)

		})




}


function elastic_populate_piechart(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	var Ds = calcDs(id, []);
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	var fields=[retrieveSquareParam(id,"Cs",true)['custom_field']]

	var limit = 10000;

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}



function elastic_rawtoprocessed_piechart(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	var totalrows = data.length

	info = retrieveSquareParam(id,"Cs")['custom_field']
	
	var justValue = _.map(data, function(row){return row._source[info]})
	var countedPort = _.countBy(justValue, function(item){ return item })

	// convert "key":count  -->  "name":"<key>","value":count
	var data_formatted = [];
	for (var key in countedPort) {
		data_formatted.push({
		  name: key,
		  count: countedPort[key],
		  percent: (countedPort[key]/totalrows*100),
		  type: info
		})
	  };	

	saveProcessedData(id, '', data_formatted);

}


function elastic_graph_piechart(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

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
	
	var radius=(width/2)*0.9, innerRadius = 0.1 * radius;

	var data = retrieveSquareParam(id, 'processeddata');

	var gChart = square.append('g')
	.attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');


	var arc = d3.arc()
		.innerRadius(radius * 0.8)
		.outerRadius(radius);
	


	var pie = d3.pie()
		.value(function(d) { return d.count; })
		
	
	var arcs = gChart.selectAll('path')
			.data(pie(data))
		.enter()
			.append("g")		 
		
		
	arcs.append('path')
			.attr('d', arc)	
			.style("fill", function(d){ return GLB.color(d.data.name) })
			.style('stroke', 'black')
			.on("click", function(d){
				clickObject = btoa('[{"match":{"'+d.data.type+'":"'+d.data.name+'"}}]');
				childFromClick(id, {"y": 1000, "Ds": clickObject} );
			})
			.on("mouseover", function(d) {
				
				hoverinfo = d.data.name  + ': count='+d.data.count+', percent='+Math.floor(d.data.percent)+'%';
				setHoverInfo(id, hoverinfo)
			})
			.on("mouseout", function(d) {
				clearHoverInfo(id)
			})
	
	arcs.append("text")
		.attr("transform", function(d) {
			var _d = arc.centroid(d);
			_d[0] *= 1;	
			_d[1] *= 1;	
			return "translate(" + _d + ")";
		})
		.style("text-anchor", "middle")
		.text(function(d) {
			if(d.data.percent < 8) {
				return Math.floor(d.data.percent)+'%';
			}
			return d.data.name
		})

		


	






}


