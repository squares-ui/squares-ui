graphs_functions_json.add_graphs_json({
	"elastic":{
		"TreemapDimensions":{
			"completeForm": "elastic_completeform_treemapdimensions",
			"populate": "elastic_populate_treemapdimensions",
			"rawtoprocessed":"elastic_rawtoprocessed_treemapdimensions",
			"param": "", 
			"graph":"elastic_graph_treemapdimensions",
			"about": "Treemap for multiple dimensions.",
		}
	}
});

function elastic_completeform_treemapdimensions(id, targetDiv){
	
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
									"type": "string",
									"title": "Field",
									"enum": dropdownFields					
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
				 		"items": [{
				 	  		"key": "x_arr[]",
				 	  		
				 		}]
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
			}		

			if(retrieveSquareParam(id,"Cs",true) !== undefined){
				
				if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){
					jsonform.value = {}
					jsonform.value['x_arr'] = []
					_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
						jsonform.value['x_arr'].push({"field": key})
					})
				
				}
				
				if(retrieveSquareParam(id,"Cs",true)['x_scale'] !== null){
					jsonform.form[2]['value'] = retrieveSquareParam(id,"Cs",true)['x_scale']
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


function elastic_populate_treemapdimensions(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)

	fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})	

	var limit = 10000;
	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}





function elastic_rawtoprocessed_treemapdimensions(id){

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
		_.each(fields, function(field){
			//thisRow.push(row['_source'][field])
			
			result = field.split('.').reduce(stringDotNotation, row['_source'])
			// qq("field for id:"+id+" "+field+" = "+result)

			
			thisRow.push(result)
		})
		return thisRow;
	})


	dataout = arrayOfArrayToFlareChildren(data, {"name":"", "children":[]}, scale)

	saveProcessedData(id, '', dataout);

}



function elastic_graph_treemapdimensions(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// https://bl.ocks.org/ganezasan/52fced34d2182483995f0ca3960fe228

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		.attr("id", function(d){ return "square_"+d.id })
		.style("position", "relative")
		.style("width", "100%")
		.style("height", "100%")
		.style("left", 0 + "px")
		.style("top", 0 + "px")

	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	const firstBy = retrieveSquareParam(id,"Cs")['x_first']
	const secondBy = retrieveSquareParam(id,"Cs")['x_second']
	var data = retrieveSquareParam(id, 'processeddata');


	const treemap = d3.treemap()
		.size([width, height])
		.padding(1);

	color = d3.scaleOrdinal().range(d3.schemeCategory20c);

	const root = d3.hierarchy(data, (d) => d.children)
		.sum((d) => d.size);

	const tree = treemap(root);

	const node = square.datum(root).selectAll(".node")
		.data(tree.leaves())
  	.enter().append("div")
		.style("left", (d) => d.x0 + "px")
		.style("top", (d) => d.y0 + "px")
		.style("width", (d) => Math.max(0, d.x1 - d.x0 - 1) + "px")
		.style("height", (d) => Math.max(0, d.y1 - d.y0  - 1) + "px")
		.style("background", function(d) { 
			while (d.depth > 1) d = d.parent; return color(d.data.name);
		})
		.style("position", "absolute")
		.style("overflow", "hidden")
		.style("word-wrap", "break-word")
		.text(function(d){
			return d.ancestors().reverse().map(d => d.data.name).join(" ")
		})
		.on("mouseover", function(d) {
			theData = d.data.name+" & "+d.parent.data.name + ": count="+d.data.realSize
			setHoverInfo(id, theData)
		})
		.on("mouseout", function(d) {
			clearHoverInfo(id)
		})
		.on("click", function(d){
			//clickObject = btoa('[{"term":{"'+firstBy+'":"'+d.parent.data.name+'"}}, {"term":{"'+secondBy+'":"'+d.data.name+'"}}]');
			//childFromClick(id, {"y": 1000, "Ds": clickObject} );

			if(retrieveSquareParam(id,"Cs",true) !== undefined){
				if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){

					keys = retrieveSquareParam(id,"Cs",true)['array']
					vals = d.ancestors().reverse().map(d => d.data.name)
					vals.shift() // remove root val for the Flare

					qq("keys and vals")
					qq(keys)
					qq(vals)

					if(keys.length != vals.length){
						ww(0, "Treemap, diff length found id:"+d.id)
					}
					clickObject = {"compare":[], "notexist":[], "timerange":[]}
				
					equals = []
					notexist = []
										
					for(var i=0;i<vals.length;i++){
						
						if(vals[i] == "null"){
							clickObject.notexist.push(keys[i])
						}else{
							miniObj = {}
							miniObj[keys[i]] = vals[i]
							qq("pushing")
							qq(miniObj)
							clickObject.compare.push(miniObj)
						}
					}
					clickObject = btoa(JSON.stringify(clickObject));
					childFromClick(id, {"y": 1000, "Ds": clickObject} );
				}
			}


		})

}



