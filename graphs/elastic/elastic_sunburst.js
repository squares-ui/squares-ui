graphs_functions_json.add_graphs_json({
	"elastic":{
		"Sunburst":{
			"completeForm": "elastic_completeform_sunburst",			
			"processForm": "elastic_processform_sunburst",			
			"populate": "elastic_populate_sunburst",
			"rawtoprocessed":"elastic_rawtoprocessed_sunburst",
			"graph":"elastic_graph_sunburst",
			"about": "Sunburst hits by field.",
		}
	}
});


function elastic_completeform_sunburst(id, targetDiv){

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			var dropdownFields = []
			
			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			subResults = _.omit(results, "")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
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
							"key": "x_arr[]",				 	  		
						 
						}], 
				   	},
					{
						"key":"x_null",
						"inlinetitle": "Include null/undefined ?",
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

			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['array'] !== null ){
					jsonform.value = {}
					jsonform.value['x_arr'] = []
					_.each(retrieveSquareParam(id,"Cs",false)['array'], function(key,num){
						jsonform.value['x_arr'].push({"field": key})
					})
				}
				
				if(retrieveSquareParam(id,"Cs",false)[' x_null']){
					jsonform.form[1]['value'] = 1
				}

				if(retrieveSquareParam(id,"Cs",false)['x_scale']){
					jsonform.form[2]['value'] = retrieveSquareParam(id,"Cs",false)['x_scale']
				}

			}else{
				//create default layout
				jsonform.value['x_arr'] = []
				jsonform.value['x_arr'].push({})
				
				jsonform.form[1]['value'] = 1

				jsonform.form[2]['value'] = "log"


			}


			$(targetDiv).jsonForm(jsonform)

		})



}


function elastic_populate_sunburst(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	
	Ds = clickObjectsToDataset(id)

	// fields = clickObjectsToDataset(id)
	fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})

	var limit = 10000;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);

}



function elastic_rawtoprocessed_sunburst(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'')['hits']['hits']
	fields = []
	
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		Cs = retrieveSquareParam(id,"Cs",true)

		if(Cs['array'] !== null ){
			fields = Cs['array']
		}

		incNull = false
		if(Cs.hasOwnProperty('x_null')){
			incNull = Cs.x_null
		}
		
		scale = "log"
		if(Cs.hasOwnProperty('x_scale')){
			scale = Cs.x_scale
		}


	}

	data = _.map(data, function(row){
		thisRow = []
		
		// 

		_.each(fields, function(field){
			// qq("------field:"+field+"------")
			// qq(row['_source'])
			
			if(incNull){
				//thisRow.push(JSON.stringify(row['_source'][field]))
				thisRow.push( field.split('.').reduce(stringDotNotation, row['_source']) )
				// qq("incNull = true, so add this row")
				
			}else if(field.split('.').reduce(stringDotNotation, row['_source']) != "null"){
				result = field.split('.').reduce(stringDotNotation, row['_source'])
				thisRow.push(result)
				// qq("stringdotnotation : field contains "+field)
				// qq(result)

			}else if(row['_source'].hasOwnProperty(field)){
				thisRow.push(JSON.stringify(row['_source'][field]))
				// qq("adding because row contains "+field)
				// qq(row['_source'])

			}else{
				// qq("skipping this row incNull:"+incNull+" source....")
				// qq(field)
				// qq(row['_source'])
			}
		})
		
		return thisRow;
	
	})


	dataout = arrayOfArrayToFlareChildren(_.sortBy(data), {"name":"", "children":[]}, scale)
	saveProcessedData(id, '', dataout);
}


function elastic_graph_sunburst(id){
	
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
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
	var radius = (width/2)*0.9, innerRadius = 0.1 * radius;

	var data = retrieveSquareParam(id, 'processeddata');
	
	var partition = d3.partition();
	
	var x = d3.scaleLinear()
		.range([0, 2 * Math.PI]);



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

	slices = gChart.selectAll("path")
		//.data(partition(root).descendants())
		.data(partition(root).descendants().filter(d => d.depth))
	  .enter().append("g")

	slices.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return GLB.color(d.data.name); })
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
		.attr("transform", function(d) {
			var _d = arc.centroid(d);
			_d[0] *= 1;	
			_d[1] *= 1;	
			return "translate(" + _d + ")";
		})
		.style("text-anchor", "middle")
		.style('fill', function(d){
			return invertColor(GLB.color(d.data.name), false) 
		})
		.text(function(d) {
			if(d.data.percent < 8) {
				return Math.floor(d.data.percent)+'%';
			}
			return d.data.name
		})



	






}



