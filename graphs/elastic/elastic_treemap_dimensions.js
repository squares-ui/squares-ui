graphs_functions_json.add_graphs_json({
	"elastic":{
		"TreemapDimensions":{
			"completeForm": "elastic_completeform_treemapdimensions",
			"populate": "elastic_populate_treemapdimensions",
			"rawtoprocessed":"elastic_rawtoprocessed_treemapdimensions",
			"param": "", 
			"graph":"elastic_graph_treemapdimensions",
			"about": "Treemap for multiple dimensions.",
			"requireThreeJS": true
		}
	}
});

async function elastic_completeform_treemapdimensions(id, targetDiv){
	
	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')
	var thisMappings = await getSavedMappings(dst, indexPattern)


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
				"notitle": true,
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
		"value":{}
	}		

	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		
		if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){
			jsonform.value = {}
			jsonform.value['x_arr'] = []
			_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
				jsonform.value['x_arr'].push({"field": key})
			})
		
		}

		if(retrieveSquareParam(id,"Cs",true)['x_null'] !== null){
			jsonform.form[1]['value'] = retrieveSquareParam(id,"Cs",true)['x_null']
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

}


async function elastic_populate_treemapdimensions(id){
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var Ds = clickObjectsToDataset(id)

	var fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})	

	var limit = 1;
	var stats = false
	var statField = ""
	var incTime = true
	var urlencode = false
	var filter = combineScriptFilter(id)

	var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)


	var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");
	
	var promises = []
	promises.push(elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "all"))
	return Promise.all(promises)

}





function elastic_rawtoprocessed_treemapdimensions(id, data){

	// var data = data[0]['data']['aggregations']['time_ranges']['buckets']
	var data = data[0]['data']['aggregations']['time_ranges']['buckets'][0]['field']['buckets']


	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		
		var Cs = retrieveSquareParam(id,"Cs",true)

		incNull = false
		if(Cs.hasOwnProperty('x_null')){
			incNull = Cs.x_null
		}

		scale = "log"
		if(Cs.hasOwnProperty('x_scale')){
			scale = Cs.x_scale
		}
	}


	// saveProcessedData(id, '', elasticToFlare(data, scale))
	return elasticToFlare(data, scale)
}



function elastic_graph_treemapdimensions(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
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
	
	// const firstBy = retrieveSquareParam(id,"Cs")['x_first']
	// const secondBy = retrieveSquareParam(id,"Cs")['x_second']
	
	// ['children'][0] is for the first bucket, timerange, so just load it
	// var data = retrieveSquareParam(id, 'processeddata')['children'][0]
	// data = data['children']

	const treemap = d3.treemap()
		.size([width, height])
		.padding(1)
		;

	var colorScale = d3.scaleOrdinal().range(GLB.color)

	// qq("#### data")
	// _.each(data, function(obj,key){ qq(obj)})
	// qq(data)

	
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
			while (d.depth > 1) d = d.parent; return colorScale(d.data.name);
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

			// qq("----------keys")
			// qq(retrieveSquareParam(id,"Cs",true)['array'])
			// qq(retrieveSquareParam(id,"Cs",true)['array'].length)
			
			// qq("----------")
			// qq(d.ancestors().reverse().map(d => d.data.name))
			// qq(d.ancestors().reverse().map(d => d.data.name).length)

			if(retrieveSquareParam(id,"Cs",true) !== undefined){
				if(retrieveSquareParam(id,"Cs",true)['array'] !== null ){

					var keys = retrieveSquareParam(id,"Cs",true)['array']
					var vals = d.ancestors().reverse().map(d => d.data.name)
					vals.shift() // remove root val for the Flare

					if(keys.length != vals.length){
						ww(0, "Treemap, diff length found id:"+d.id)
					}
					var clickObject = {"compare":[], "notexist":[], "timerange":[]}
				
					var equals = []
					var notexist = []
										
					for(var i=0;i<vals.length;i++){
						
						if(vals[i] == "null"){
							clickObject.notexist.push(keys[i])
						}else{
							miniObj = {}
							miniObj[keys[i]] = vals[i]
							clickObject.compare.push(miniObj)
						}
					}
					clickObject = btoa(JSON.stringify(clickObject));
					childFromClick(id, {"y": 1000, "Ds": clickObject} );
				}
			}


		})

}



