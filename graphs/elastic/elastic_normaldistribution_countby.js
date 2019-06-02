	graphs_functions_json.add_graphs_json({
	"elastic":{
		"NormDist_Numerical":{
			"completeForm": "elastic_completeform_normdist",
			"populate": "elastic_populate_normdist",
			"rawtoprocessed":"elastic_rawtoprocessed_normdist",
			"param": "", 
			"graph":"elastic_graph_normdist",
			"about": "Normal Distribution of a numberical field",
		}
	}
});


function elastic_completeform_normdist(id, targetDiv){
	
	const jsonform = {
		"schema": {
			"custom_first": {
				"type": "string",
				"title": "(Numerical) Field", 
				"enum": []
			}
		},
		"form": [
		  {
				"key": "custom_first",
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_first.enum = results
			$(targetDiv).jsonForm(jsonform)

		})
}


function elastic_populate_normdist(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	var Ds = calcDs(id, []);
	

	firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	var fields=[firstBy]
	
	var limit = 10000;
	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}


function elastic_rawtoprocessed_normdist(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	
	/////  Caluclate sd and mean

		// get numbers out of json
		data2 = _.map(data, function(i){
			// XXX check if any non numbers?
			return parseInt(i._source[firstBy])
		})

		// calculate Mean
		let sum = data2.reduce((previous, current) => current += previous);
		let avg = sum / data2.length;	
		qq("Mean average (\u03BC) "+avg)
		
		// create an array of the deviance from mean
		data3 = _.each(data2, function(i){
			//qq(i+" "+Math.pow((i - avg), 2))
			return Math.pow((i - avg), 2)
		})

		// Sum all numbers, divide by n and square root
		data4 = Math.sqrt(_.reduce(data3, function(memo, num) { return memo + num}, 0) / data2.length) 
		qq("1 standard deviation (\u03C3) "+ data4)

		// lowest name, not lowest value
		data_lowest = _.min(data2);
		data_highest = _.max(data2);

	////// calculate the grouped bar chart

		var countedby = _.countBy(data, function(i){ return i._source[firstBy] })
		
		var data_formatted = [];
		for (var key in countedby) {
			data_formatted.push({
			  name: key,
			  value: countedby[key],
			})
		  };		
		
		  //data_max = _.max(data2)
		var max = _.max(_.pluck(data_formatted, 'value'))

	data5 = {}
	data5.average = avg
	data5.standarddeviation = data4
	data5.data = data_formatted
	data5.lowest = data_lowest
	data5.highest = data_highest
	
	data5.max = max

	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', data5);

}


function elastic_graph_normdist(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	 margin = {top: 20, right: 30, bottom: 30, left: 40}



	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("svg")
		.attr("id", function(d){ return "square_"+d.id })
		.classed("box_binding", true)
		.classed("square_body", true)
		.classed("square_xhtml", true)
		.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })

	var gChart = square.append("g")
		.attr("transform", "translate(0,0)")
			
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');
	
	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']

	var sd_array = Random_normal_Dist(data.average, data.standarddeviation);
    //min_d = d3.min(sd_array, function (d) { return d.q; });
    //max_d = d3.max(sd_array, function (d) { return d.q; });
	min_d = data.lowest * 0.8
	max_d = data.highest * 1.1
	max_p = d3.max(sd_array, function (d) { return d.p; });

	var x = d3.scaleLinear()
		.rangeRound([0, width-margin.left-margin.right]);
		x.domain([min_d, max_d]).nice;

	var y = d3.scaleLinear()
		.domain([0, max_p])
		.range([height-margin.top-margin.bottom, 0]);	

	var y2 = d3.scaleLinear()
		.domain([0, data.max])
		.range([height-margin.top-margin.bottom, 0]);	


	var gX = gChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate("+margin.left+"," + (height-margin.top) + ")")
		.call(d3.axisBottom(x));

	var line = d3.line()
		.x(function (d) { return x(d.q); })
		.y(function (d) { return y(d.p); });

	gChart.append("path")
		.datum(sd_array)
		.attr("class", "line")
		.attr("d", line)
		//.style("fill", "#fdae61")
		.style("opacity", "0.5")
		.attr("transform", "translate("+margin.left+"," + (margin.top) + ")")

	gChart.selectAll(".bar")
		.data(data.data)
	  .enter().append("rect")
		.attr("class", 'bar')
		.attr("x", function(d) { return x(d.name) + margin.left; })
		.attr("y", function(d) { return margin.top + y2(d.value); })
		.attr("height", function(d) { return height - y2(d.value) - margin.top - margin.bottom})
		.attr("width", 5)
		.on("mouseover", function(d) {
				
			hoverinfo = firstBy+"=" + d.name  + ': count='+d.value;
			setHoverInfo(id, hoverinfo)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			clickObject = btoa('[{"match":{"'+firstBy+'":"'+d.name+'"}}]');
			childFromClick(id, {"y": 1000, "Ds": clickObject} );
		})

	}





