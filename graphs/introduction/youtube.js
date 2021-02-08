graphs_functions_json.add_graphs_json({
	"introduction":{
		"youtube":{
			"completeForm": "completeform_youtube",
			"populate":"populate_youtube", 
			"rawtoprocessed":"process_youtube",
			"param": "", 
			"graph":"graph_youtube",
			"about": "",			
		}
	}
});


async function completeform_youtube(id, targetDiv){

	const jsonform = {
		"schema": {
			"x_link": {
				"type": "string",
				"title": "Video ID"
			},
		},
		"form": [
			{
				"key": "x_link"
			},
		],
		"value":{}		
	}

	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_link']){
			jsonform.value.x_link = retrieveSquareParam(id,"Cs",false)['x_link']
		}
	}else{
		jsonform.value.x_link = "dQw4w9WgXcQ"
	}

	$(targetDiv).jsonForm(jsonform)

}

async function populate_youtube(id){
	
	
	promises = []
	promises.push(id)
	return Promise.all(promises)

}


async function process_youtube(id, data){	
	return ""
	
}

async function graph_youtube(id, data){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			// .classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });

	// var height = document.getElementById("square_"+id).clientHeight;
	// var width  = document.getElementById("square_"+id).clientWidth;
	
	// var square = workspaceDiv.selectAll('#square_'+id);

	theLink = "dQw4w9WgXcQ" // lol
	var thisCs = retrieveSquareParam(id,"Cs",false)
	if(thisCs.hasOwnProperty("x_link") && thisCs['x_link'] != ""){
		theLink = thisCs['x_link']
	}

	$('#square_'+id).append('<iframe width="100%" height="100%" src="https://www.youtube.com/embed/'+theLink+'" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')


}



