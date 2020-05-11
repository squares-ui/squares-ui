graphs_functions_json.add_graphs_json({
	"elastic":{
		"TimeMap":{
			"completeForm": "elastic_completeform_timemap",
			"populate": "elastic_populate_timemap",
			"rawtoprocessed":"elastic_rawtoprocessed_timemap",
			"param": "", 
			"graph":"elastic_graph_timemap",
			"about": "Timemap",
		}
	}
});

function elastic_completeform_timemap(id, targetDiv){
	
	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	// no keys needed?
	return

}


function elastic_populate_timemap(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)

	fields = ["@timestamp"]
	// _.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
	// 	fields.push(key)
	// })	

	var limit = 10000;
	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}





function elastic_rawtoprocessed_timemap(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	fields = []

	
	Ws = retrieveSquareParam(id, "Ws", true)
	if(Ws <= 300){ chunks = 10} //5mins and less
	else if(Ws <= 900){ chunks = 15} //15 mins
	else if(Ws <= 3600){ chunks = 12} //1 hour
	else if(Ws <= 43200){ chunks = 12} //12 hours
	else if(Ws <= 86400){ chunks = 24} //day
	else if(Ws <= 604800){ chunks = 31} //week

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)

	chunksize = (to-from) / chunks

	thisObj = {}

	// define array of time slots
	for(var i=0; i<chunks; i++){
		chunkstart = from + (i * chunksize)
		thisObj[chunkstart] = 0
	}
	
	// for each row, where do I fit
	_.each(data, function(row){
		timestamp = moment(row._source['@timestamp']).unix()
		// find the first moment in this time chunk
		slot = (Math.floor((timestamp-from) / chunksize)  * chunksize) + from
		// if(!thisObj.hasOwnProperty(slot)){
		// 	qq("slot:"+slot+" does not appear in:")
		// 	qq(thisObj)
		// }
		thisObj[slot]++
	})
	// qq("thisObj")
	// qq(thisObj)

	dataout = []
	_.each(thisObj, function(obj,key){
		dataout.push({
			"name":moment.unix(parseInt(key)).format('MMM ddd Do, HH:mm:ss'), 
			"value":obj,
			"from":parseInt(key),
			"to":parseInt(key)+chunksize
		})

	})
	// qq("dataout")
	// qq(dataout)

	saveProcessedData(id, '', dataout);

}



function elastic_graph_timemap(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// https://bl.ocks.org/ganezasan/52fced34d2182483995f0ca3960fe228

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
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

	var data = retrieveSquareParam(id, 'processeddata');
	color = d3.scaleOrdinal().range(d3.schemeCategory20c);

	var x = d3.scaleBand()
    	.rangeRound([0, width], .1)
		.paddingInner(0.1)
		.domain(data.map(function(d) { return d.name; }));

	var y = d3.scaleLinear()
		.range([0, height*0.9])
		.domain([0, d3.max(data, function(d) { return d.value; })]);
	

	// Add bar chart
	bars = square.selectAll(".bar")
		.data(data)
	.enter()
	
	bars.append("rect")
		.attr("class", "bar")
		.attr("x", function(d) { return x(d.name); })
		.attr("width", x.bandwidth())
		.attr("height", function(d) { return y(d.value) ; })
		.attr("y", function(d) { return   (height/2) -  (y(d.value) / 2)   })
		.style("fill", function(d) { return GLB.color(d.name); })
	.on("mouseover", function(d) {
		theData = d.name +": "+d.value
		setHoverInfo(id, theData)
	})
	.on("mouseout", function(d) {
		clearHoverInfo(id)
	})
	.on("click", function(d){
		
		childFromClick(id, {"y": 1000, "Wi":[d.to, (d.to-d.from), 0]} );

	})

	bars.append("text")
		.attr('transform', (d,i)=>{
			return 'translate( '+x(d.name)+' , '+(height/2)+'),'+ 'rotate(-90)';
		})
		.text(function(d) {
			return d.name
		})
	


}




