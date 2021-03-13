graphs_functions_json.add_graphs_json({
	"elastic":{
		"Sankey":{
			"completeForm": "elastic_completeform_sankey",
			"populate": "elastic_populate_sankey",
			"rawtoprocessed":"elastic_rawtoprocessed_sankey",
			"param": "", 
			"graph":"elastic_graph_sankey",
			"about": "3 deep Sankey chart",
		}
	}
});

sankeyLinksLimit = 180

async function elastic_completeform_sankey(id, targetDiv){

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
				"minItems": 2,
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
				"inlinetitle": "Include partial null/undefined ?",
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
		if(thisCs['array'] !== undefined ){
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
		jsonform.value['x_arr'].push({})

		jsonform.form[1]['value'] = 1

		jsonform.form[2]['value'] = "log"
		
	}

	$(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_sankey(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
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
		existOrFields,
		existAndFields
	)


	var promises = [id]
	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all") )
	return Promise.all(promises)



}


function elastic_rawtoprocessed_sankey(id, data){

	var data = data[0]['data']
	var dataout = {}

	var scale = "log"
	var thisCs = retrieveSquareParam(id,"Cs",true)

	if(thisCs !== undefined){
		// if(thisCs.hasOwnProperty('x_null')){
		// 	incNull = thisCs.x_null
		// }
		if(thisCs.hasOwnProperty('x_scale')){
			scale = thisCs.x_scale
		}
	}


	var dataOut = elasticAggToSankeyLoop(thisCs['array'], 0, data['aggregations']['time_ranges']['buckets'][0]['field']['buckets'], {"nodes":[{"node":0, "name":""}], "links":[]} , [], [] )
	
	
	_.each(dataOut['links'], function(link){
		
		
		// go through "valueReal" and calculate height for rendering
		if(scale == "linear"){
			link.value = link.valueReal
		}else if(scale == "log"){
			// cheating but log(0) causes UI problems
			// At this rate it's not longer a "count" more of a representation, so until an alternative I'm happy with it
			link.value = Math.log(link.valueReal) + 1
		}else if(scale == "inverse"){
			link.value = 1/link.valueReal
		}
	


	
	})


	



	return dataOut
}


function elastic_graph_sankey(id, data){
	
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

			
	var height = document.getElementById("square_"+id).clientHeight - 1 ; // this graph is vulnerable to bottom line being clipped
	var width  = document.getElementById("square_"+id).clientWidth;
	

	// var data = retrieveSquareParam(id, 'processeddata');

	var colorScale = d3.scaleOrdinal().range(GLB.color)

	// handled by data processing, but safety catch here to prevent page breaking
	var badData = false;
	_.each(data.links, function(obj,i){
		if(obj.source == obj.target){
			ww(0,obj.source +"=="+ obj.target)
			badData = true
			return		
		}
	})
	if(badData == true){
		ww(0,"Issue in Sankey graph id:"+id+", source and destination are same, error in graph id:"+id)
		return
	}


	// handled by 
	if(data.nodes.length >= sankeyLinksLimit){
		addSquareStatus(id, "warning", "Too many Nodes, some are not shown, consider drawing a smaller data set.")
	}


	_.each(data.links, function(obj,i){

		_.each(data.links, function(obj2,i2){

			if(obj.source == obj2.target && obj.target == obj2.source){
				ww(0,obj.source +"=="+ obj2.target+", "+obj.target +"=="+ obj2.source)
				badData = true
				return		
			}	
		})
	})
	if(badData == true){
		ww(0,"Issue in Sankey graph id:"+id+", loop of source and dest  id:"+id)
		return
	}




	var sankey = d3.sankey()
		.nodeWidth(36)
		.nodePadding(0)
		.size([width, height])
		

		
	var path = sankey.link();

	sankey
		.nodes(data.nodes)
		.links(data.links)
		.layout(0)  // keeps nodes alphabetical, set to x (32?) if this gets messy. XXX convert to a jsonform question?
		
	
		
		
	var link = square.append("g").selectAll(".link")
			.data(data.links)
		.enter().append("path")
			.attr("class", "link")
			.attr("d", path)
			.style("stroke-width", function(d) { return Math.max(1, d.dy); })
			.on("click", function(d){ 
				// attributes are : "target", 	"sourceField", 		"targetField", 		"value", 		"dy",		"ty", 		 "sy",  "source"

				var clickObject = {"compare":[], "notexist":[], "timerange":[]}

				if(d.source.name == d.sF+"_null"){
					clickObject.notexist.push(d.sF)
				}else{
					miniObj = {}
					miniObj[d.sF] = d.source.name
					clickObject.compare.push(miniObj)
				}
				
				if(d.target.name == d.tF+"_null"){
					clickObject.notexist.push(d.tF)
				}else{
					miniObj = {}
					miniObj[d.tF] = d.target.name
					clickObject.compare.push(miniObj)
				}


				clickObject = btoa(JSON.stringify(clickObject));
				childFromClick(id, {"y": 1000, "Ds": clickObject} );

			})
			.on("mouseover", function(d) {
				d3.select(this).style("stroke", "red");
				hoverinfo = d.source.name+", "+d.target.name+": " + d.valueReal;
				setHoverInfo(id, hoverinfo)
			})                  
			.on("mouseout", function(d) {
				d3.select(this).style("stroke", "");
				clearHoverInfo(id)
			});
	  



	var node = square.append("g").selectAll(".node")
			.data(data.nodes)
		.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { 
				return "translate(" + d.x + "," + d.y + ")";
			})
			// .call(d3.drag()
			// .subject(function(d) {
			//   return d;
			// })
			// .on("start", function() {
			//   this.parentNode.appendChild(this);
			// })
			// .on("drag", dragmove));
				
			
		// add the rectangles for the nodes
		node.append("rect")
			.attr("height", function(d) { return d.dy; })
			.attr("width", sankey.nodeWidth())
			.style("fill", function(d) { 
				//return d.color = color(d.name.replace(/ .*/, "")); 
				return colorScale(d.name)
			})
			.style("stroke", function(d) { 
				return d3.rgb(d.color).darker(2); 
			})
			// .call(d3.drag()
			// .subject(function(d) {
			//   return d;
			// })
			// .on("start", function() {
			//   this.parentNode.appendChild(this);
			// })
			// .on("drag", dragmove))
			// .on("click", function(d){ 
			// 	// difficult to do on the node, are we treating it as the source or destination?
			// 	// e.g. if a gateway is a source of some traffic, and the destination of other, it's rendered on the graph behaving as both
			// 	// clicking on the link determines the relation for us
			// })

		// add in the title for the nodes
		node.append("text")
			.attr("x", -6)
			.attr("y", function(d) { return d.dy / 2; })
			.attr("dy", ".35em")
			.attr("text-anchor", "end")
			.attr("transform", null)
			.text(function(d) { return d.name; })
			.filter(function(d) { return d.x < width / 2; })
			.attr("x", 6 + sankey.nodeWidth())
			.attr("text-anchor", "start")



	// the function for moving the nodes
	function dragmove(d) {
// 		d3.select(this).attr("transform", 
// 			"translate(" + (
// 				//d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
// 				0
			
// 			)
// 			+ "," + (
// //				d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
// 0
// 			) + ")");
// 		sankey.relayout();
// 		link.attr("d", path);
	}







}

// const getCircularReplacer = () => {
//   const seen = new WeakSet();
//   return (key, value) => {
//     if (typeof value === "object" && value !== null) {
//       if (seen.has(value)) {
//         return;
//       }
//       seen.add(value);
//     }
//     return value;
//   };
// };


