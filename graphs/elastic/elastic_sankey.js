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


function elastic_completeform_sankey(id, targetDiv){
	
	const jsonform = {
		"schema": {
			"custom_first": {
				"type": "string",
				"title": "col1", 
				"enum": []
			},
			"custom_second": {
				"type": "string",
				"title": "col2", 
				"enum": []
			},
			"custom_third": {
				"type": "string",
				"title": "col3", 
				"enum": []
			}
		},
		"form": [
		  {
				"key": "custom_first",
		  },
		  {
				"key": "custom_second",
		  },
		  {
				"key": "custom_third",
		  }
		]
	}

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			jsonform.schema.custom_first.enum = results
			jsonform.schema.custom_second.enum = results
			jsonform.schema.custom_third.enum = results
			$(targetDiv).jsonForm(jsonform)

		})
}


function elastic_populate_sankey(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws", true)) , "X").format();
	var Ds = calcDs(id, []);
	
	firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	secondBy = retrieveSquareParam(id,"Cs")['custom_second']
	thirdBy = retrieveSquareParam(id,"Cs")['custom_third']
	var fields=[firstBy, secondBy, thirdBy]
	
	var limit = 10000;
	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, from, to, Ds, fields, limit);

}


function elastic_rawtoprocessed_sankey(id){


	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
  const secondBy = retrieveSquareParam(id,"Cs")['custom_second']
  const thirdBy = retrieveSquareParam(id,"Cs")['custom_third']


	// first compile list of raw nodes, as this is the lookup table for creating links
	// so strip out from each row, then unique, and then convert to [{"node":n, "name":<name>}, ..]
	nodesOne = []
	nodesOne = _.map(_.filter(data,function(obj) {return obj._source[firstBy]}), function(i){
		// XXX check if any non numbers?
		return i._source[firstBy]
	})	
	nodesTwo = []
	nodesTwo = _.map(_.filter(data,function(obj) {return obj._source[secondBy]}), function(i){
		// XXX check if any non numbers?
		return i._source[secondBy]
	})	

	nodesThree = []
	nodesThree = _.map(_.filter(data,function(obj) {return obj._source[thirdBy]}), function(i){
		// XXX check if any non numbers?
		return i._source[thirdBy]
	})	

	nodes = []
	nodesPre = []
	nodesPre = _.compact(_.flatten([_.uniq(nodesOne), _.uniq(nodesTwo), _.uniq(nodesThree)]))
	
	for (i = 0; i < nodesPre.length; i++) { 
		nodes.push({"node":i, "name":nodesPre[i]})
	}
	
	//// now create links
	//// as a->b and b->c are different link counts, we need to double up the last bit
	var links = []
	// elastic JSON -> [[a, b, c], [a, d, g], 
	dataFiltered = _.filter(data,function(obj) {
		// XXX should check every column for null and not just the first?  At least this suggests the parser had something, and row not entirely useless..
		return obj._source[firstBy]
	});
	
	data2 = _.map(dataFiltered, function(i){
		// XXX check if any non numbers?
		return [i._source[firstBy], i._source[secondBy], i._source[thirdBy]]
	})	

	// 
	var jrab = {} //JsonResult
	var jrbc = {}
	for (i = 0; i < data2.length; i++) { 

		// a-b (or 1-2)
		if(jrab[data2[i][0]] == undefined){
			jrab[data2[i][0]] = {}
		}
		if(jrab[data2[i][0]][data2[i][1]] == undefined){
			jrab[data2[i][0]][data2[i][1]] = {'value':0} 
		}
		jrab[data2[i][0]][data2[i][1]].value = jrab[data2[i][0]][data2[i][1]].value +1
	
		//b-c (or 3-4)
		if(jrbc[data2[i][1]] == undefined){
			jrbc[data2[i][1]] = {}
		}
		if(jrbc[data2[i][1]][data2[i][2]] == undefined){
			jrbc[data2[i][1]][data2[i][2]] = {'value':0} 
		}
		jrbc[data2[i][1]][data2[i][2]].value = jrbc[data2[i][1]][data2[i][2]].value +1

	}



	// flatten back to array 
	arab = []
	for ( [keyx, valuex] of Object.entries(jrab)) {
		for ( [keyy, valuey] of Object.entries(valuex)) {
			arab.push({"source":_.indexOf(nodesPre, keyx), "target":_.indexOf(nodesPre, keyy), "value":valuey.value})
			// qq("PUSHING "+keyx+"="+_.indexOf(nodesPre, keyx)+", "+keyy+"="+_.indexOf(nodesPre, keyy)+" count="+valuey.value)
		}
	}
	// flatten back to array 
	arbc = []
	for ( [keyx, valuex] of Object.entries(jrbc)) {
		// qq("1"+keyx)
		for ( [keyy, valuey] of Object.entries(valuex)) {
			// qq("2"+keyy)
			arbc.push({"source":_.indexOf(nodesPre, keyx), "target":_.indexOf(nodesPre, keyy), "value":valuey.value})
			
		}
	}

	dataout = {}
	dataout.nodes = nodes
	dataout.links = _.union(arab, arbc)
	saveProcessedData(id, '', dataout);

}


function elastic_graph_sankey(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	//https://bl.ocks.org/d3noob/013054e8d7807dff76247b81b0e29030


	var squareContainer = sake.selectAll('#square_container_'+id)
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

			
	var height = document.getElementById("square_"+id).clientHeight - 10 ; // this graph is vulnerable to bottom line being clipped
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');

	const firstBy = retrieveSquareParam(id,"Cs")['custom_first']
	const secondBy = retrieveSquareParam(id,"Cs")['custom_second']
  	const thirdBy = retrieveSquareParam(id,"Cs")['custom_third']

	var units = "Widgets";


	var sankey = d3.sankey()
		.nodeWidth(36)
		.nodePadding(20)
		.size([width, height]);

	var path = sankey.link();

	sankey
		.nodes(data.nodes)
		.links(data.links)
		.layout(32);
	
	var link = square.append("g").selectAll(".link")
      .data(data.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });



		var node = square.append("g").selectAll(".node")
			.data(data.nodes)
		.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { 
				return "translate(" + d.x + "," + d.y + ")";
			})
				
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
			.on("click", function(d){
				// Decipher which column a node element is in

				reference = JSON.parse(JSON.stringify(d, getCircularReplacer()))

				if(jQuery.isEmptyObject(reference.targetLinks)){
					// empty sourceLinks means column 1
					clickObject = btoa('[{"match":{"'+firstBy+'":"'+d.name+'"}}]');
				}else if(jQuery.isEmptyObject(reference.sourceLinks)){
					// empty sourceLinks means column 3
					clickObject = btoa('[{"match":{"'+thirdBy+'":"'+d.name+'"}}]');
				}else{
					// middle column
					clickObject = btoa('[{"match":{"'+secondBy+'":"'+d.name+'"}}]');
				}
				childFromClick(id, {"y": 1000, "Ds": clickObject} );
				
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











}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};


