graphs_functions_json.add_graphs_json({
	"elastic":{
		"PieChart":{
			"completeForm": "elastic_completeform_piechart",			
			"processForm": "elastic_processform_piechart",			
			"populate": "elastic_populate_piechart",
			"rawtoprocessed":"elastic_rawtoprocessed_piechart",
			"graph":"elastic_graph_piechart",
			"about": "PieChart hits by field.",
		}
	}
});


async function elastic_completeform_piechart(id, targetDiv){

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"
	var thisMappings = await getMappingsData(thisDst, thisIndex)

	var dropdownFields = []
	
	_.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	const jsonform = {
		"schema": {
			"x_arr": {
				"type":"array",
				"maxItems": 4,
				"minItems": 1,
				"items":{
					"type": "object",
					"properties":{
						"field":{
							"title": "field",
							"type": "string",
							"enum": dropdownFields,
						}
					}	
				}
			},
			"x_null": {
				"title": "Include null/undefined ?",
				"type": "boolean",
			},
			"x_scale": {
				"title": "Scale",
				"type": "string",
				"enum": [
					"linear", "log", "inverse"
				]
			}
		},
		"form": [
			{
				"type": "array",
				"notitle": true,
				"items": [{
					"key": "x_arr[]"
				}], 
			},
			{
				"key":"x_null",
				"inlinetitle": "Include all null results ?",
				"notitle": true,
			},
			{
				"key":"x_scale",
				"inlinetitle": "Scale",
				"notitle": true,
			}
		],
		"value":{}
	}	
	
	var thisCs = retrieveSquareParam(id,"Cs",false)
	if(thisCs !== undefined){
		
		jsonform.value = {}
		jsonform.value['x_arr'] = []
		if(thisCs['array'] !== null ){
			_.each(thisCs['array'], function(key,num){
				jsonform.value['x_arr'].push({"field": key})
			})
		}else{
			jsonform.value['x_arr'].push({})
		}
	
		if(thisCs['x_null']){
			jsonform.form[1]['value'] = 1
		}	

		if(thisCs['x_scale']){
			jsonform.form[2]['value'] = thisCs['x_scale']
		}


	}else{
		//create default layout
		jsonform.value['x_arr'] = []
		jsonform.value['x_arr'].push({})
		
		jsonform.form[1]['value'] = 1

		jsonform.form[2]['value'] = "log"
	}


	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_piechart(id){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");


	var thisCs = retrieveSquareParam(id,"Cs",true)
	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var limit = 1;
	var stats = false
	var statField = ""
	var incTime = true
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	var aggFields = []
	var outputFields = []
	var existOrFields = []
	var existAndFields = []

	// 

	_.each(thisCs['array'], function(key,num){
		aggFields.push(key)
	})

	_.each(thisCs['array'], function(key,num){
		if(thisCs['x_null']){
			existOrFields.push(key)
		}else{
			existAndFields.push(key)
		}
		outputFields.push(key)
	})

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
		aggFields, 
		stats, 
		statField,
		outputFields,
		existOrFields	,
		existAndFields
	)


	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all") )
	return Promise.all(promises)



}



function elastic_rawtoprocessed_piechart(id, data){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// qq(data)
	
	data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']
	fields = []

	scale = "log"
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		Cs = retrieveSquareParam(id,"Cs",true)		
		if(Cs.hasOwnProperty('x_scale')){
			scale = Cs.x_scale
		}
	}
	
	return elasticToFlare(data, scale)

}


function elastic_graph_piechart(id, data){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

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
	var radius = (width/2)*0.9
	var innerRadius = 0.1 * radius;

	var partition = d3.partition();
	
	// scaling is done in function?
	var x = d3.scaleLinear()
		.range([0, 2 * Math.PI]);
	// var x = d3.scaleLog()
	// 	.range([0, 2 * Math.PI]);


	var y = d3.scaleSqrt()
		.range([0, radius]);

	var arc = d3.arc()
		.startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
		.endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
		.innerRadius(function(d) { return Math.max(0, y(d.y0)); })
		.outerRadius(function(d) { return Math.max(0, y(d.y1)); });

	root = d3.hierarchy(data);
	root.sum(function(d) { return d.size; });
	

	var gChart = square.append('g')
		.attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');

	var colorScale = d3.scaleOrdinal().range(GLB.color)


	slices = gChart.selectAll("path")
		//.data(partition(root).descendants())
		.data(partition(root).descendants().filter(d => d.depth))
		.enter()


	slices.append("path")
		// .filter(function(d, i) { return i < 100 })
		.attr("d", arc)
		.style("fill", function(d) { return colorScale(d.data.name); })
		.on("mouseover", function(d) {
			//hoverinfo = d.data.name  + ': count='+d.data.realSize+', percent='+Math.floor(d.data.percent)+'%';
			hoverinfo = d.data.name  + ': count='+d.data.realSize;
			setHoverInfo(id, hoverinfo)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			
			if(retrieveSquareParam(id,"Cs",true) !== undefined){
				if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){

					keys = retrieveSquareParam(id,"Cs",true)['array']
					vals = d.ancestors().reverse().map(d => d.data.name)
					vals.shift() // remove root val for the Flare

					if(keys.length != vals.length){
						ww(0, "Treemap, diff length found id:"+d.id)
					}
					var clickObject = {}

					for(var i=0;i<vals.length;i++){

						if(vals[i] == "null"){
							if(!clickObject.hasOwnProperty('notexist')){
								clickObject.notexist = []
							}
							clickObject['notexist'].push(keys[i])
						}else{
							
							if(!clickObject.hasOwnProperty('compare')){
								clickObject.compare = []
							}

							miniObj = {}
							
							//miniObj[keys[i]] = JSON.parse(vals[i])
							miniObj[keys[i]] = vals[i]

							clickObject['compare'].push(miniObj)
						}
					}

					clickObject = btoa(JSON.stringify(clickObject));
					childFromClick(id, {"y": 1000, "Ds": clickObject} );
					
				}
			}
		})

	slices.append("text")
		// .filter(function(d, i) { return i < 100 })
		.attr("transform", function(d) {
			var _d = arc.centroid(d);
			_d[0] *= 1;	
			_d[1] *= 1;	
			return "translate(" + _d + ")";
		})
		.style("text-anchor", "middle")
		.style('fill', function(d){
			return invertColor(colorScale(d.data.name), false) 
		})
		.text(function(d) {
			if(d.data.percent < 8) {
				return Math.floor(d.data.percent)+'%';
			}
			return d.data.name
		})








}



