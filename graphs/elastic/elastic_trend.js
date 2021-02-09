graphs_functions_json.add_graphs_json({
	"elastic":{
		"Trend":{
			"completeForm": "elastic_completeform_trend",
			"populate": "elastic_populate_trend",
			"rawtoprocessed":"elastic_rawtoprocessed_trend",
			"param": "", 
			"graph":"elastic_graph_trend",
			"about": "Trend",
		}
	}
});



async function elastic_completeform_trend(id, targetDiv){

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getSavedMappings(thisDst, thisIndex)

	var dropdownFields = []
	
	_.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	const jsonform = {
		"schema": {
			"x_field": {
				"type": "string",
				"title": "Field Analysis", 
				"enum": dropdownFields
			},
			"x_windowSlide": {
				"title": "Window Slide",
				"type": "string",
				"enum": [
					"TheWindowSize", "Daily", "Weekly", "Fracture"
				]
			},
			"x_windows":{
				"type": "integer",
				"title": "Windows (2->6)",
				"default": 4,
				"minimum": 2,
				"maximum": 6

			}

		},
		"form": [
			"*"
		],
		"value":{}
	}
	
	
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		Cs = retrieveSquareParam(id,"Cs",false) 

		if(Cs['x_field']){
			jsonform.value['x_field'] = Cs['x_field']
		}

		if(Cs['x_windowSlide']){
			jsonform.value['x_windowSlide'] = Cs['x_windowSlide']
		}

		if(Cs['x_windows']){
			jsonform.value['x_windows'] = Cs['x_windows']
		}	

	}else{
		//create default layout
		jsonform.value['x_windowSlide'] = "Daily"
		jsonform.value['x_windows'] = 4

		
	}

	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_trend(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	
	var thisWe = calcGraphTime(id, 'We', 0)
	var to = thisWe
	var from = thisWe + retrieveSquareParam(id, "Ws", true)
	
	var thisCs = retrieveSquareParam(id,"Cs",true)

	var timesArray = []

	var windowSlide = thisCs['x_windowSlide']	
	var windowSize = 0;
	var windowCount = thisCs['x_windows']

	if(windowSlide == "TheWindowSize"){
		windowSize = (to-from)
	}else if(windowSlide == "Daily"){
		windowSize = 60*60*24
	}else if(windowSlide == "Weekly"){
		windowSize = 60*60*24*7
	}else if(windowSlide == "Monthly"){
		windowSize = 60*60*24*7*28
	}else if(windowSlide == "Fracture"){
		windowSize = ((to-from)/windowCount)
	}

	// for (var i = 0 ; i < windowCount ; i++){
	// 	timesArray.push([from - (i*windowSize), to - (i*windowSize)])
	// }

	// var newTo = to
	for (var i = 0 ; i < windowCount ; i++){
		
		newTo = to - (i*windowSize)
		timesArray.push([newTo - windowSize, newTo])
		// newTo = newTo - windowSize
	}


	var fields = [thisCs['x_field']]
	var limit = 1;
	var stats = false
	var statField = ""
	var incTime = true
	var urlencode = false
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	// var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		false,
		"",
		true,
		maxAccuracy,
		fields, 
		stats, 
		statField	
	)


	var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");

	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all"))
	return Promise.all(promises)

	
	
}


function elastic_rawtoprocessed_trend(id, data){

	

	var data = data[0]['data']['aggregations']['time_ranges']['buckets']
	var dataMid = {}

	var dataOut = {}
	dataOut['data'] = []
	// dataOut['timeMin'] = data[0]['from_as_string']
	dataOut['ticks'] = []

	var highestTo = data[0]['to']
	var lowestFrom = data[0]['from']

	_.each(data, function(timerange){

		// miniObj = {"name": result['key'], "data":[]}
		// var miniArray = []

		_.each(timerange['field']['buckets'], function(results){
			// miniArray.push(   {"from_as_string":bucket['from_as_string'], "count":bucket['doc_count']  }   )
		
			if(!dataMid.hasOwnProperty(results['key'])){
				dataMid[results['key']] = {}
			}
			dataMid[results['key']][timerange['from_as_string']] = results['doc_count']
		
		})

		dataOut['ticks'].push(timerange['from_as_string'])

		
		// find extent of this query overall, helps with xAxis tick format later
		if(timerange['from'] < lowestFrom){
			lowestFrom = timerange['from']
		}
		if(timerange['to'] > highestTo){
			highestTo = timerange['to']
		}
	})

	dataOut['timeDiff'] = (highestTo - lowestFrom)/1000
	dataOut['keyCount'] = data.length
	

	_.each(dataMid, function(values,field){
		// mini array
		
		var tmpArr = []
		_.each(values, function(v, k){
			var mo = {}
			mo['from_as_string'] = k
			mo['count'] = v
			tmpArr.push(mo)	
		})
		dataOut['data'].push({"name":field, "data":tmpArr})

	})



	return dataOut



}


function elastic_graph_trend(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			
		.on("mousedown", function() { d3.event.stopPropagation(); })

	var margin = {top: 10, right: 110, bottom: 30, left: 60}
	var height = document.getElementById("square_"+id).clientHeight - margin.top - margin.bottom
	var width  = document.getElementById("square_"+id).clientWidth - margin.left - margin.right
	
	var g = square.append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

	//calculate count range once
	var dataCount = []
	var tickValues = []
	var refWindows = []

	var colorScale = d3.scaleOrdinal().range(GLB.color)

	_.each(data['data'], function(obj, i){
		dataCount.push( _.pluck(obj['data'], 'count')  )
		_.each(obj['data'], function(obj, j){

			// push as strings, easier to do "if exist"
			if(_.indexOf(tickValues, obj['from_as_string']) == -1){
				tickValues.push( obj['from_as_string'])
			}
			refWindows.push(-1*j)
		})

	})
	dataCount = _.flatten(dataCount)
	
	// make each tickValue a date object
	_.each(tickValues, function(tick, i){
		tickValues[i] = new Date(tick)
	})
		

	// xAxis
	var xBottom = d3.scaleTime()
		.domain(  
			//d3.extent(_.map(data[0]['data'], function(obj){ return new Date(obj['from_as_string']) }))
			[new Date(data['ticks'][0]), new Date(data['ticks'][data['ticks'].length-1])]
		)
		.rangeRound([0, width - margin.right])
	const xAxisBottom = d3.axisBottom(xBottom)
		// .tickFormat(d3.timeFormat("%b %d %H:%m"))
		.tickFormat(function(date){
			if (data['timeDiff'] >= 604800) {
			  return d3.timeFormat('%b %d')(date);
			} else {
			  return d3.timeFormat('%a %H:%m')(date);
			}
		  })
		.ticks(data['keyCount'])
	g.append('g')
		.attr('transform', 'translate(0,' + height + ')')
		.call(xAxisBottom)


	// y Scale of hits
	var y = d3.scaleLog()
		.domain([   
			1, _.max(dataCount)+10
		])
		.range([height, 0])
		.clamp(true)
	const yAxis = d3.axisLeft(y)
		 .tickFormat(d3.format('.0s'))
	g.append('g')
		.attr("class", "yaxis")
		.call(yAxis); 



	// the lines function
	const line = d3.line()
		//.x(d => x(d.from_as_string))
		.x(function(d){ 
			return xBottom(new Date(d.from_as_string))
		})
		.y(function(d){			
			return y(d.count)
		})

	
	// Gridline
	var gridlines = d3.axisTop()
		.tickFormat("")
		.tickSize(-height)
		.ticks(data['keyCount'])
		.scale(xBottom);

	g.append("g")
		.attr("class", "grid")
		.call(gridlines);


		
	// Data Line lines
	g.selectAll()
		.data(data['data'])
	.enter()
		.append('path')
		.attr('fill',  function(d) { 
			return colorScale(d.name)
		})
		.attr('stroke', function(d) { 
			return colorScale(d.name)
		})
		.attr('stroke-width', 10)
		.datum(d => d.data)
		.attr('d', line);


	// Data Line Title 
	g.selectAll()
		.data(data['data']).enter()
	.append('text')
		.html(d => d.name)
		.attr('fill', d => d.color)
		.attr('alignment-baseline', 'middle')
		.attr('x', width - margin.right)
		.attr('dx', '.5em')
		.attr('y', function(d){
			// alert(JSON.stringify(d.data))
			return y(_.last(d.data)['count'])
		});


	// Data Line circle
	g.selectAll()
		.data(data['data']).enter()
	.append("circle")
		.attr('cx', width - margin.right)
		.attr('cy', function(d){
			// alert(JSON.stringify(d.data))
			return y(_.last(d.data)['count'])
		})


		.attr('r', 8)
		.style("fill", function(d) { 
			return colorScale(d.name)
		})
		.on("click", function(d){ 
			var clickObject = {"compare":[]}
			var key = retrieveSquareParam(id, 'Cs', true)['x_field']
			var miniobj = {}
			
			miniobj[key] = d.name
			
			clickObject.compare.push(miniobj)	
			clickObject = btoa(JSON.stringify(clickObject));
			childFromClick(id, {"y": 1000, "Ds": clickObject} );

	})

	
	// xaxis ticks clickability
	d3.selectAll(".xaxis .tick text")
		.on('click', function(value,index){
			var clickObject = {"compare":[]}
			
			var key = retrieveSquareParam(id, 'Cs', true)['x_field']
			var miniobj = {}
			miniobj[key] = this['__data__']
			clickObject.compare.push(miniobj)	
	
			clickObject = btoa(JSON.stringify(clickObject));
			childFromClick(id, {"y": 1000, "Ds": clickObject} );
	  	});

	// style the axis
	// d3.selectAll(".xaxis .tick").each(function(d,i){
	// 	var tick = d3.select(this),
	// 		text = tick.select('text'),
	// 		bBox = text.node().getBBox();
	  
	// 	tick.insert('rect', ':first-child')
	// 	  .attr('x', bBox.x - 3)
	// 	  .attr('y', bBox.y - 3)
	// 	  .attr('height', bBox.height + 6)
	// 	  .attr('width', bBox.width + 6)
	// 	  .style('fill', d3.schemeCategory20[i % 20]);      
	//   });

}

