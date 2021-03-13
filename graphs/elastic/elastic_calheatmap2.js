graphs_functions_json.add_graphs_json({
	"elastic":{
		"Calendar HeatMap":{
			"completeForm": "elastic_completeform_calHeatMap",
			"populate": "elastic_populate_calHeatMap",
			"rawtoprocessed":"elastic_rawtoprocessed_calHeatMap",
			"param": "", 
			"graph":"elastic_graph_calHeatMap",
			"about": "calHeatMap",
		}
	}
});



async function elastic_completeform_calHeatMap(id, targetDiv){


	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getMappingsData(thisDst, thisIndex)

	var dropdownFields = []

	// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
	var subResults = _.pick(thisMappings, "date")
	_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	const jsonform = {
		"schema": {
			"x_field": {
			"type": "string",
			"title": "Top by:", 
			"enum": dropdownFields
			
			}
		},
		"form": [
			{
			"key": "x_field"
			}
		],
		"value":{}
	}
	
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_field'] !== null ){
			jsonform.value.x_field = retrieveSquareParam(id,"Cs",false)['x_field']
		}
	}

	$(targetDiv).jsonForm(jsonform)

}




async function elastic_populate_calHeatMap(id){
	
	// ee(" -> "+arguments.callee.name+"("+id+")");

	var thisCs = retrieveSquareParam(id,"Cs",true)
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var limit = 1;
	var stats = false
	var statField = null
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	var aggFields = []
	var outputFields = []
	var existOrFields = []

	//

	var promises = [id]

	var aggBy = "getMonthValue"
	// var query = await elasticQueryBuildderAggScriptDayHour(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, aggBy+"()", false, filter)
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		true,
		[aggBy+"()"],
		false,
		maxAccuracy,
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields
	)
	promises.push(elastic_connector(thisDst, thisIndex, id, query, aggBy))
	


	var aggBy = "DayHourCompound"
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		true,
		["dayOfWeek", "getHour()"],
		false,
		maxAccuracy,
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields	
	)
	promises.push(elastic_connector(thisDst, thisIndex, id, query, aggBy))


	var aggBy = "getMinute"
	// var query = await elasticQueryBuildderAggScriptDayHour(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, aggBy+"()", false, filter)
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		true,
		[aggBy+"()"],
		false,
		maxAccuracy,
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields	
	)
	promises.push(elastic_connector(thisDst, thisIndex, id, query, aggBy))
	

	var aggBy = "getSecond"
	// var query = await elasticQueryBuildderAggScriptDayHour(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, aggBy+"()", false, filter)
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		true,
		[aggBy+"()"],
		false,
		maxAccuracy,
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields	
	)
	promises.push(elastic_connector(thisDst, thisIndex, id, query, aggBy))
	

	return Promise.all(promises)

}





function elastic_rawtoprocessed_calHeatMap(id, data){
	

	var dataout = {}

	var thisData = _.where(data, {"name":"getMonthValue"})[0]['data']
	dataout['month'] = []
	if(thisData && thisData.hasOwnProperty('aggregations')){
		for(i = 1; i < 13; i++){
			var isFound;
			isFound = _.find(thisData['aggregations']['time_ranges']['buckets'], function(obj){ 				
				return obj['key'] == i; 
			});
			if(isFound === undefined){
				dataout['month'].push({"key":i, "doc_count":0})
			}else{
				dataout['month'].push(isFound)
			}
		}
	}else{
		// no matches, just compile a list of 000000
		for(i = 1; i < 13; i++){
			dataout['month'].push({"key":i, "doc_count":0})
		}
	}
	


	var thisData = _.where(data, {"name":"DayHourCompound"})[0]['data']['aggregations']['time_ranges']['buckets']
	dataout['DayHourCompound'] = []

	_.each(thisData, function(day){

		var dayKey = day.key

		_.each(day.time_ranges.buckets, function(hour){

			var hourKey = hour.key

			dataout['DayHourCompound'].push({"day":dayKey, "hour":hourKey, "value":hour.doc_count})

		})

	})



	var thisData = _.where(data, {"name":"getMinute"})[0]['data']
	dataout['minute'] = []
	if(thisData && thisData.hasOwnProperty('aggregations')){
		for(i = 0; i < 60; i++){
			var isFound;
			isFound = _.find(thisData['aggregations']['time_ranges']['buckets'], function(obj){ 				
				return obj['key'] == i; 
			});
			if(isFound === undefined){
				dataout['minute'].push({"key":i, "doc_count":0})
			}else{
				dataout['minute'].push(isFound)
			}
		}
	}else{
		for(i = 0; i < 60; i++){
			dataout['minute'].push({"key":i, "doc_count":0})
		}
	}

	var thisData = _.where(data, {"name":"getSecond"})[0]['data']
	dataout['second'] = []
	if(thisData && thisData.hasOwnProperty('aggregations')){
		for(i = 0; i < 60; i++){
			var isFound;
			isFound = _.find(thisData['aggregations']['time_ranges']['buckets'], function(obj){ 				
				return obj['key'] == i; 
			});
			if(isFound === undefined){
				dataout['second'].push({"key":i, "doc_count":0})
			}else{
				dataout['second'].push(isFound)
			}
		}
	}else{
		for(i = 0; i < 60; i++){
			dataout['second'].push({"key":i, "doc_count":0})
		}
			
	}

	return dataout
}



function elastic_graph_calHeatMap(id, data){
	

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


	var height = document.getElementById("square_"+id).clientHeight - 10 ; // this graph is vulnerable to bottom line being clipped
	var width  = document.getElementById("square_"+id).clientWidth;
	
	// image layout (strips take top half, then devided by stipe count... pie charts to have bottom half, with equal width)
	// hor strip, month
	// hor strip, day of week
	// pie HH, pie MM, pie DD
	
	var secCount = 2
	var stripCount = 3

	var stripHeight = height / secCount / stripCount
	var stripWidth = width*0.95

	var pieCount = 2
	var pieWidth = width/3
	var pieHeight= height / 2


	var radius = pieWidth/2
	var arc = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);


	var colRange = ["#ffe2aa","#ffa900"]


	////////////////////////////// top hor stripe

	
	// bar chart Month
	
	thisData = data['month']
	var thisTop = stripHeight * 0
	var x = d3.scaleBand()
		.range([0, stripWidth])
		.padding(0.1)
		.domain(thisData.map(function(d) { return d.key; }));
	var y = d3.scaleLinear()
		.range([stripHeight*0.8, 0])
		.domain([0, d3.max(thisData, function(d) { return d.doc_count; })]);
		

	var max = _.max(_.pluck(thisData, 'doc_count'))
	var linearColour = d3.scaleLinear()
	.domain([0,max])
	.range(colRange)

	var minigt1 = square.append("g")
		.attr('transform', 'translate(0,' + (thisTop) + ')');

	var g = minigt1.selectAll(".bar")
		.data(thisData)
		.enter()
		
	g.append("rect")
		.filter(function(d) { return d.doc_count > 0; })
		.attr("class", "bar")
		.attr("x", function(d) { return Math.floor(x(d.key)); })
		.attr("width", x.bandwidth())
		.attr("y", function(d) { return Math.floor(y(d.doc_count) + stripHeight*0.1) })
		.attr("height", function(d) { return Math.floor(stripHeight - y(d.doc_count)) })
		.style("fill", function (d) {
			return linearColour(d.doc_count)
		})
		.on("mouseover", function(d) {
			setHoverInfo(id, "Month: "+d.key+", #"+d.doc_count)
		})
		.on("click", function(d){ 
			var clickObject = {"y": 1000, "Fi": "doc['@timestamp'].value.getMonth().getValue()=="+d.key.toString() }
			
			childFromClick(id,  clickObject);		
		})

	g.append("text")
		.attr("width", x.bandwidth())
		.style("text-anchor", "middle")
		.attr("transform", function(d) { return "translate(" +  Math.floor(x(d.key)+(x.bandwidth()/2)) + ", "+ Math.floor(stripHeight*0.95) +")"; })
		.attr("dy", ".35em")
		.text(function(d) { 
			
			return GLB.Months[parseInt(d.key)]['short']
			
		});
	

	
	// // bar chart day of week
	thisData = data['DayHourCompound']
	var thisTop = stripHeight * 1.4

	var minigt1 = square.append("g")
		.attr('transform', 'translate('+(width*0.05)+',' + (thisTop) + ')');

	// var rowLabels = d3.set(thisData.map((d) => {return d.hour})).values().sort()
	var xScale = d3.scaleBand()
		.domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24])
		.padding(0.1)
		.range([0, stripWidth])
		
	var colLabels = d3.set(thisData.map((d) => {return d.day})).values().sort()
	var yScale = d3.scaleBand()
		.domain([7,6,5,4,3,2,1])
		.padding(0.1)
		.range([stripHeight, 0])

	var max = _.max(_.pluck(thisData, 'value'))
	var linearColour = d3.scaleLinear()
		.domain([0,max])
		.range(colRange)

	var g = minigt1.selectAll(".bar")
		.data(thisData)
		.enter()
		
	g.append("rect")
		.attr('width', d => xScale.bandwidth())
		.attr('height', d => yScale.bandwidth())
		.attr('x', d => xScale(d.hour))
		.attr('y', d => yScale(d.day))
		.attr('fill', d => linearColour(d.value))		
		.on("mouseover", function(d) {
			hoverinfo = GLB.Days[parseInt(d.day)]['short']+", "+d.hour+"h: "+d.value
			setHoverInfo(id, hoverinfo)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			var clickObject = {"y": 1000, "Fi": "doc['@timestamp'].value.getDayOfWeekEnum().getValue()=="+d.day.toString()+" && doc['@timestamp'].value.getHour()=="+d.hour.toString() }							
			childFromClick(id,  clickObject);	
		})


	const yAxis = d3.axisLeft(yScale)		
		.tickFormat(function(key){
			return GLB.Days[parseInt(key)]['short'];
		})
	minigt1.append('g')
		.attr("class", "yaxis")
		.call(yAxis); 
	

	// ////////////////////////////// bottom pie charts


	var labelArc = d3.arc()
		.outerRadius(radius - 40)
		.innerRadius(radius - 40);
	var pie = d3.pie()
		.sort(null)
		.value(function (d) {
			return  1;
		});

	


		// Piechart : Minute
		thisData = data['minute']
		var thisLeft = pieWidth * 0.33
		var max = _.max(_.pluck(thisData, 'doc_count'))
		var linearColour = d3.scaleLinear()
			.domain([0,max])
			.range(colRange)

		var minigb2 = square.append("g")
			.attr('transform', 'translate(' + Math.floor(pieWidth/2 + thisLeft) + ',' + Math.floor(pieHeight + pieWidth/2) + ')');
		var g = minigb2.selectAll(".arc")
			.data(pie(thisData))
			.enter().append("g")
			.attr("class", "arc")

		g.append("path")
			.filter(function(d) { return d.data.doc_count > 0; })	
			.attr("d", arc)
			.style("fill", function (d) {
				return linearColour(d.data.doc_count)
			})				
			.on("mouseover", function(d) {
				if(d.data.doc_count>0){
					setHoverInfo(id, "Minute:"+ d.data.key+", #"+d.data.doc_count)
				}
				d3.select(this).style("stroke", "red");
			})
			.on("click", function(d){ 
				var clickObject = {"y": 1000, "Fi": "doc['@timestamp'].value.getMinute()=="+d.data.key.toString() }
				childFromClick(id,  clickObject);		
			})
			.on("mouseout", function(d) {
				d3.select(this).style("stroke", "");
			});

		g.append("text")
			.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
			.attr("dy", ".35em")
			.text(function(d) { return d.data.key; });



	// Piechart : second
	thisData = data['second']
	var thisLeft = pieWidth * 1.66
	var max = _.max(_.pluck(thisData, 'doc_count'))
	var linearColour = d3.scaleLinear()
		.domain([0,max])
		.range(colRange)

	var minigb3 = square.append("g")
		.attr('transform', 'translate(' + Math.floor(pieWidth/2 + thisLeft) + ',' + Math.floor(pieHeight + pieWidth/2) + ')');
	var g = minigb3.selectAll(".arc")
		.data(pie(thisData))
		.enter()
		
		.append("g")
		.attr("class", "arc")
	
	g.append("path")
		.filter(function(d) { return d.data.doc_count > 0; })	
		.attr("d", arc)
		.style("fill", function (d) {
			return linearColour(d.data.doc_count)
		})
		.on("mouseover", function(d) {
			if(d.data.doc_count>0){
				setHoverInfo(id, "Second:"+ d.data.key+", #"+d.data.doc_count)
			}
			d3.select(this).style("stroke", "red");
		})
		.on("click", function(d){ 
			var clickObject = {"y": 1000, "Fi": "doc['@timestamp'].value.getSecond()=="+d.data.key.toString() }
			childFromClick(id,  clickObject);		
		})              
		.on("mouseout", function(d) {
			d3.select(this).style("stroke", "");
		});
	
	g.append("text")
		.attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.text(function(d) { return d.data.key; });

		
}




