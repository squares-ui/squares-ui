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

function elastic_completeform_sankey(id, targetDiv){

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
						"minItems": 2,
						"items":{
							"type": "object",
							"properties":{
								"field":{
									"title": "Field",
									"type": "string",
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
			
			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['array'] !== null ){
					jsonform.value = {}
					jsonform.value['x_arr'] = []
					_.each(retrieveSquareParam(id,"Cs",false)['array'], function(key,num){
						jsonform.value['x_arr'].push({"field": key})
					})
				}

				if(retrieveSquareParam(id,"Cs",false)['x_null']){
					jsonform.form[1]['value'] = 1
				}

				if(retrieveSquareParam(id,"Cs",false)['x_scale']){
					jsonform.form[2]['value'] = retrieveSquareParam(id,"Cs",false)['x_scale']
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

		}).catch(e => {
			alert(e)
			// setPageStatus(id, 'Critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');

		})
}


function elastic_populate_sankey(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)
	
	// qq(Ds)
	
	fields = []
	_.each(retrieveSquareParam(id,"Cs",true)['array'], function(key,num){
		fields.push(key)
	})

	var limit = 10000;
	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}


function elastic_rawtoprocessed_sankey(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'')['hits']['hits']
	var dataout = {}

	// to have ability to prevent UI overload with nodes, we need to limit
	// however limiting nodes first results in a few nodes, but no links
	// need to calculate links (using original key name)
	// then calulate nodes
	// then retro fit links with node locations

	Cs = retrieveSquareParam(id,"Cs",true)['array']

	incNull = false
	scale = "log"
	if(retrieveSquareParam(id,"Cs",true) !== undefined){
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_null')){
			incNull = retrieveSquareParam(id,"Cs",true).x_null
		}
		if(retrieveSquareParam(id,"Cs",true).hasOwnProperty('x_scale')){
			scale = retrieveSquareParam(id,"Cs",true).x_scale
		}
	}



	//############################
	// generate data2, which is later used to generate links
	//############################
	rawLinks = {}
	_.each(data, function(obj, i){

		for(var j = 0; j < Cs.length-1; j++ ){
			deepSource = Cs[j].split('.').reduce(stringDotNotation, obj._source)
			sources = []
			if( deepSource != "null" ){
				key = deepSource
				if(key.constructor.name !== "Array") {
					key = [key]
				}
				_.each(key, function(el){
					sources.push(el)
				})
			}else if (incNull){
				sources.push(Cs[j]+"_null")
			}


			deepDest = Cs[j+1].split('.').reduce(stringDotNotation, obj._source)
			destinations = []
			if(deepDest != "null" ){
				key = deepDest
				if(key.constructor.name !== "Array") {
					key = [key]
				}
				_.each(key, function(el){
					destinations.push(el)
				})
			}else if (incNull){
				destinations.push(Cs[j+1]+"_null")
			}

			_.each(sources, function(src){
				_.each(destinations, function(dst){

					if (!rawLinks.hasOwnProperty(src)) {
						rawLinks[src] = {}
						
						// to click a Sankey Link we need to know which fields the attributes came from, so lets smuggle them inside the Links to find them later
						rawLinks[src]['sF'] = Cs[j]  // sourceField
						rawLinks[src]['tF'] = Cs[j+1]  //targetField
					}
					if (!rawLinks[src].hasOwnProperty(dst)) {
						rawLinks[src][dst] = 0
					}
					rawLinks[src][dst] += 1
		
				})
			})
			

		}
	})
	// qq("###### RawLinks")
	// qq(rawLinks)
	// "<node>": {
	// 	"<node>": value,
	// 	"sF": "<field>",
	// 	"tF": "<field>"
	// },


	
	// convert from   "28726":{"bro_http":1}   ->> [{"source":192,"target":104,"value":2},{...}]
	tmpLinks = []
	_.each(rawLinks, function(obj, key){
		_.each(obj, function(obj2, key2){
			if(key2 != "sF" && key2 != "tF"){
				tmpLinks.push({"source": (key), "target": (key2), "sF": obj['sF'], "tF": obj['tF'], "value": parseInt(obj2)})
			}
		})
	})
	// qq("###### tmpLinks")
	// qq(tmpLinks)
	// {
    //     "source": "<node>",
    //     "target": "<node>",
    //     "sF": "<field>",
    //     "tF": "<field>",
    //     "value": value
    // }

	
	// limit nodes to prevent UI overload
	// though 'log' can handle more, so a little "helper"
	if(scale == "log"){
		sankeyLinksLimit * 2
	}
	if(tmpLinks.length > sankeyLinksLimit){
		ww(3,"Sankey has too many nodes ("+tmpLinks.length+") culling to "+sankeyLinksLimit)
		tmpLinks = _.first(tmpLinks, sankeyLinksLimit)
	}


	//############################
	// extract the needed nodes
	//############################
	nodes = []
	_.each(tmpLinks, function(link){
		nodes.push(link.source)
		nodes.push(link.target)
	})
	nodes2 = _.uniq(  _.sortBy(nodes)    , true)
	dataout.nodes = []
	for(var i = 0; i < nodes2.length; i++ ){
		dataout.nodes.push({"node":i, "name": nodes2[i]})
	}
	dataout.nodes = _.sortBy(dataout.nodes, function(nodeObj){ return nodeObj.name }  )
	// qq("###### dataout.nodes")
	// qq(dataout.nodes)
	// {
	// 	"node": <node>,
	// 	"name": "<node>"
	// }


	//############################
	// now cycle tmpLinks, applying node names, into dataout.links
	//############################
	dataout.links = []
	_.each(tmpLinks, function(tmpLink, i){
		
		reverseClash = ""

		reverseFound = false
		// check reverse link doesn't exist, this breaks graph
		_.each(tmpLinks, function(tmpLink2, i2){
			if(tmpLink.source == tmpLink2.target && tmpLink.target == tmpLink2.source){
				// qq("checking found match")
				reverseFound = true
				reverseClash = tmpLink.source + ">" + tmpLink.target 
			}
		})

		if(reverseFound == false){
			linkOut = {}
			linkOut.source = _.where(dataout.nodes, {"name":tmpLink.source})[0].node
			linkOut.target = _.where(dataout.nodes, {"name":tmpLink.target})[0].node
			linkOut.sF = tmpLink['sF']
			linkOut.tF = tmpLink['tF']
			
			if(scale == "linear"){
				linkOut.value = tmpLink.value
			}else if(scale == "log"){
				// cheating but log(0) causes UI problems
				// At this rate it's not longer a "count" more of a representation, so until an alternative I'm happy with it
				linkOut.value = Math.log(tmpLink.value) + 1
			}else if(scale == "inverse"){
				linkOut.value = 1/tmpLink.value
			}
			
			dataout.links.push(linkOut)
		}else{
			// reverse found, this causes Saneky charts to infinite loop recursion
			// drop this entry and raise an error, then continue for valid data
			ww(3,"Issue in Sankey graph id:"+id+", loop of source and dest  id:"+id+", Dropping data and continue")
			
			addSquareStatus(id, "warning", "Recursive Loop found, dropping: "+reverseClash)

		}

	})


	// qq("###### dataout.links")
	// qq(dataout.links)
	// {
    //     "source": <node_id>,
    //     "target": <node_id>,
    //     "sF": "<node>",
    //     "tF": "<node>",
    //     "value": value
    // }
	


	// qq("###### overall")
	// qq(dataout)
	// {
	// 	"nodes": [{
	// 			"node": 0,
	// 			"name": "0"
	// 		},{}],
	// 	"links": [{
	// 		"source": <node_id>,
	// 		"target": <node_id>,
	// 		"sF": "<field>",
	// 		"tF": "<field>",
	// 		"value": value
	// 	},{}]



	// sorting allows UI debugging easier
	dataout.links = _.sortBy(dataout.links, function(obj){ 
		return obj.source
	})

	saveProcessedData(id, '', dataout);

}


function elastic_graph_sankey(id){
	
	

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
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

			
	var height = document.getElementById("square_"+id).clientHeight - 10 ; // this graph is vulnerable to bottom line being clipped
	var width  = document.getElementById("square_"+id).clientWidth;
	

	var data = retrieveSquareParam(id, 'processeddata');


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
		.nodePadding(2)
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

			clickObject = {"compare":[], "notexist":[], "timerange":[]}

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
	  ;



	var node = square.append("g").selectAll(".node")
			.data(data.nodes)
		.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { 
				return "translate(" + d.x + "," + d.y + ")";
			})
			.call(d3.drag()
			.subject(function(d) {
			  return d;
			})
			.on("start", function() {
			  this.parentNode.appendChild(this);
			})
			.on("drag", dragmove));
				
		// add the rectangles for the nodes
		node.append("rect")
			.attr("height", function(d) { return d.dy; })
			.attr("width", sankey.nodeWidth())
			.style("fill", function(d) { 
				//return d.color = color(d.name.replace(/ .*/, "")); 
				return GLB.color(d.name)
			})
			.style("stroke", function(d) { 
				return d3.rgb(d.color).darker(2); 
			})
			.on("mouseover", function(d) {
				hoverinfo = d.name + ", count=" + d.value;
				setHoverInfo(id, hoverinfo)
			})
			.on("mouseout", function(d) {
				clearHoverInfo(id)
			})
			.call(d3.drag()
			.subject(function(d) {
			  return d;
			})
			.on("start", function() {
			  this.parentNode.appendChild(this);
			})
			.on("drag", dragmove))
			.on("click", function(d){ 
				// difficult to do on the node, are we treating it as the source or destination?
				// e.g. if a gateway is a source of some traffic, and the destination of other, it's rendered on the graph behaving as both
				// clicking on the link determines the relation for us
			})

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
			.attr("text-anchor", "start");



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


