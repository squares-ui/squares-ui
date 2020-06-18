graphs_functions_json.add_graphs_json({
	"elastic":{
		"CalendarHeatmap":{
			"completeForm": "elastic_completeform_calendarHeatmap",
			"populate": "elastic_populate_calendarHeatmap",
			"rawtoprocessed":"elastic_rawtoprocessed_calendarHeatmap",
			"param": "", 
			"graph":"elastic_graph_calendarHeatmap",
			"about": "3 deep Sankey chart",
		}
	}
});


function elastic_completeform_calendarHeatmap(id, targetDiv){

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
			
			var dropdownFields = []

			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			var subResults = _.omit(results, "")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
			dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

			const jsonform = {
				"schema": {
				  "x_field": {
					"type": "string",
					"title": "Top by:", 
					"enum": dropdownFields
					
				  },
				  "x_max": {
					"title": "Maximum accuracy?",
					"type": "boolean",
				 }
				},
				"form": [
				  {
					"key": "x_field"
				  },
				  {
					"key":"x_max",
					"inlinetitle": "Maximum accuracy?",
					"notitle": true,
				  }
				],
                "value":{}
			}
			
			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['x_field'] !== null ){
					jsonform.value.x_field = retrieveSquareParam(id,"Cs",false)['x_field']
				}
				if(retrieveSquareParam(id,"Cs",false)['x_max']){
					jsonform.form[1]['value'] = 1
				}
			}

			$(targetDiv).jsonForm(jsonform)

		}).catch(e => {
			alert(e)
			// setPageStatus(id, 'Critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');

		})
}

// month = days / hour
// week = days / hour
// day = hour / minute
// hour = clock face?
// calendarHeatMapSizes[windowSize] = [first time breakdown for elastic, second breakdown by elastic, windows size for clicked square svg]
var calendarHeatMapSizes = []
calendarHeatMapSizes.push([-60 * 60 * 24 * 7 * 4, "getDayOfMonth()", "getHour()", -60 * 60])
calendarHeatMapSizes.push([-60 * 60 * 24 * 7, "getDayOfMonth()", "getHour()", -60 * 60])
calendarHeatMapSizes.push([-60 * 60 * 24, "getHour()", "getMinute()", -60] )
calendarHeatMapSizes.push([-60 * 60, "getMinute()", "getMinute()", -60])
calendarHeatMapSizes.push([0, "getMinute()", "getMinute()", 0])


function elastic_populate_calendarHeatmap(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]
	
	var Ds = clickObjectsToDataset(id)
	
	// qq(Ds)
	
	var fields;
	var maxAccuracy = false
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		Cs = retrieveSquareParam(id,"Cs",true)

		if(Cs['x_field'] !== undefined){
			fields = retrieveSquareParam(id,"Cs",true)['x_field']
		}
		if(Cs.hasOwnProperty('x_max')){
			maxAccuracy = true
		}

	}

	var limit = 1;
	var stats = false
	var statField = ""
	var incTime = true
	var urlencode = false

	// check calendarHeatMapSizes, what time breakdown does the elastic Script need?
	var Ws = retrieveSquareParam(id, "Ws", true)
	var aggTimeScriptNames = _.find(calendarHeatMapSizes, function(arr){ 
		qq(arr[0] +" vs "+ Ws)
		return parseInt(arr[0]) >= parseInt(Ws) 
	});

	var query = elasticQueryBuildderAggScriptDayHour(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, [aggTimeScriptNames[1], aggTimeScriptNames[2]], maxAccuracy)

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}


function elastic_rawtoprocessed_calendarHeatmap(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'')

	saveProcessedData(id, '', data);

}


function elastic_graph_calendarHeatmap(id){
	
	

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	//https://bl.ocks.org/d3noob/013054e8d7807dff76247b81b0e29030


	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })

	var data = retrieveSquareParam(id, 'processeddata')

	var height = document.getElementById("square_"+id).clientHeight - 10 ; // this graph is vulnerable to bottom line being clipped
	var width  = document.getElementById("square_"+id).clientWidth;
	

	var timeOne = []
	var timeTwo = []
	var flat = []
	var max = 0
	_.each(data['aggregations']['time']['buckets'], function(bucketDay){
		timeOne.push(parseInt(bucketDay['key']))
		_.each(bucketDay['time']['buckets'], function(bucketHour){
			timeTwo.push( parseInt(bucketHour['key']) )
			
			var ma = []
			// _.each(bucketHour['field']['buckets'], function(top){
			// 	var mo = {}
			// 	mo['key'] = top['key']
			// 	mo['value'] = top['doc_count']
			// 	mo['percentage'] = Math.floor(parseInt(top['doc_count']) / parseInt(bucketHour['doc_count'])*100)+"%"
			// 	ma.push(mo)
			// })
			flat.push({"timeOne":parseInt(bucketDay['key']), "timeTwo":parseInt(bucketHour['key']), "value":parseInt(bucketHour['doc_count']), "top": ma})
		})
	})

	var flattimeTwo = _.uniq(timeTwo).sort(function(a, b){return a-b})
	var flattimeOne = _.uniq(timeOne).sort(function(a, b){return a-b})
	var flatmax = _.max(_.pluck(flat,['value']))

	


	flat = _.chain(flat)
	  .sortBy('timeTwo')
	  .sortBy('timeOne')
	  .value();



   
	var linearColour = d3.scaleLinear()
	  .domain([1,max])
	  .range(["white", "blue"])


	// check calendarHeatMapSizes, what time breakdown does the elastic Script need?
	var Ws = retrieveSquareParam(id, "Ws", true)
	var aggTimeScriptNames = _.find(calendarHeatMapSizes, function(arr){ return arr[0] >= Ws });


	// is the size of this window, great than 1 hour?  then do grid, else do a watch face
	if(aggTimeScriptNames[3] <= -3600){

			// for each entry, work out the y row
			_.each(flat, function(obj){
				obj['row']=_.indexOf(timeOne, obj['timeOne'])
			})

			verGridSize = Math.floor(height / (timeOne.length+1))
			horGridSize = Math.floor(width / (timeTwo.length+1))
			qq("horGridSize:"+horGridSize+", verGridSize:"+verGridSize)

			var dayLabels = square.selectAll(".dayLabel")
				.data(timeOne)
				.enter().append("text")
				.text(function (d) { return d; })
				.attr("x", 10)
				.attr("y", function (d, i) { 
					return i * verGridSize + (verGridSize/2)
				})
				.style("text-anchor", "end")
				.attr("transform", "translate(10," + verGridSize / 1.5 + ")")
				.attr("class", function (d, i) { return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis"); });

			var hourLabels = square.selectAll(".timeLabel")
				.data(timeTwo)
				.enter().append("text")
					.text(function(d) { return d; })
					.attr("x", function(d, i) { 
						return ((i+1) * horGridSize)  + (horGridSize/2)
					})
					.attr("y", function(d, i) { 
						return verGridSize/3
					})             
					.style("text-anchor", "middle")
					// .attr("transform", "translate(" + verGridSize / 2 + ", 10)")
					.attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });

			var cards = square.selectAll(".timeTwo")
				.data(flat, function(d) {return d.day+':'+d.hour;});


			cards.enter().append("rect")
				.attr("x", function(d) { 
					return (d.timeTwo+1) * horGridSize
				})
				.attr("y", function(d) { 
					return ((d.row+1) * verGridSize) - (verGridSize/2)
				})
				.attr("width", horGridSize)
				.attr("height", verGridSize)
				.style("fill", function(d){ 
					return linearColour(d.value)
				})
				.on("click", function(d){ 
					qq("day:"+d.timeOne+", timeTwo:"+d.timeTwo+" "+d.value)
				})
				.on("mouseover", function(d) {
					// var miniData = []
					// _.each(d.top, function(top){
					// 	miniData.push(top.key+":"+top.value+"("+top.percentage+")")
					// })
					// theData = miniData.join("|")
					// setHoverInfo(id, theData)
				})
				.on("click", function(d){ 
					// attributes are : "target", 	"sourceField", 		"targetField", 		"value", 		"dy",		"ty", 		 "sy",  "source"
					
					var to = calcGraphTime(id, 'We', 0)
					var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)

					var target = new Date(0);
					target.setUTCSeconds(to);
					target.setDate(d.timeOne)
					target.setHours(d.timeTwo)
					

					childFromClick(id, {"y": 1000,  "Wi":[ target.getTime() / 1000, aggTimeScriptNames[3], 0]} );

				})

			cards.enter().append("text")
				.text(function(d) { return d.value; })
				.attr("x", function(d, i) { 
					return (d.timeTwo+1) * horGridSize
				})
				.attr("y", function(d, i) { 
					return ((d.row+1) * verGridSize) - (verGridSize/2)
				})
				.style("text-anchor", "middle")
				.attr("transform", "translate(" + horGridSize / 2 + ", 10)")
				// .attr("class", function(d, i) { return ((i >= 7 && i <= 16) ? "timeLabel mono axis axis-worktime" : "timeLabel mono axis"); });




		}else{

			
			var radius = Math.min(width, height) / 2;

			var arcValue = d3.arc()
				.outerRadius(radius - 10)
				.innerRadius(radius - 70);
					
			var arcMins = d3.arc()
				.outerRadius(radius - 60)
				.innerRadius(radius - 100);
			

			var pie = d3.pie()
				.sort(null)
				.value(function (d) {
				return  1;
			});
			
			var gChart = square.append('g')
				.attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');
	
			
			var g = gChart.selectAll(".arc")
				.data(pie(flat))
				.enter().append("g")
				.attr("class", "arc");
		
			g.append("path")
				.attr("d", arcValue)
				.style("fill", function (d) {
					return linearColour(d.data.value)
				})
				.on("mouseover", function(d) {
					var miniData = []
					_.each(d.top, function(top){
						miniData.push(top.key+":"+top.value+"("+top.percentage+")")
					})
					theData = miniData.join("|")
					setHoverInfo(id, theData)
				})
				.on("click", function(d){ 
					// attributes are : "target", 	"sourceField", 		"targetField", 		"value", 		"dy",		"ty", 		 "sy",  "source"
					
					var to = calcGraphTime(id, 'We', 0)
					var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)

					var target = new Date(0);
					target.setUTCSeconds(to);
					target.setMinutes(d.timeOne)
					//target.setHours(d.timeTwo)
			
					childFromClick(id, {"y": 1000,  "Wi":[ target.getTime() / 1000, aggTimeScriptNames[3], 0]} );

				})
		
			g.append("text")
				.attr("transform", function (d) {
					return "translate(" + arcValue.centroid(d) + ")";
				})
				.attr("dy", ".35em")
				.style("text-anchor", "middle")
				.text(function (d) {
					return d.data.value;
				});

			g.append("text")
				.attr("transform", function (d) {
					return "translate(" + arcMins.centroid(d) + ")";
				})
				.attr("dy", ".35em")
				.style("text-anchor", "middle")
				.text(function (d, i) {
					return ":"+String(i).padStart(2, '0');
				});




	}

}
