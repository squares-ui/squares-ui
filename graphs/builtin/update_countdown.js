graphs_functions_json.add_graphs_json({
	"builtin":{
		"UpdateCountdown":{
			"completeForm": "completeform_updatecountdown",
			"populate":"populate_updatecountdown", 
			"rawtoprocessed":"process_updatecountdown",
			"param": "", 
			"graph":"graph_updatecountdown",
			"about": "Visual Countdown to graph update (if Live Play is enabled"
		}
	}
});

var tickObject = new Object();


async function completeform_updatecountdown(id, targetDiv){

	var times = [10,30,120,300,900,3600,43200,86400]

	var jsonFormEnum = []
	var titleMap = {}

	_.each(times, function(time, i){
		jsonFormEnum.push(time)
		titleMap[time] = countSeconds(time)
	})


	const jsonform = {
		"schema": {
			"x_size": {
			"type": "string",
			"title": "Update Frequency",
			"enum": jsonFormEnum
			}
		},
		"form": [
			{
			"key": "x_size",
			"titleMap" : titleMap
			}
		],
		"value":{}
		
	}

	jsonform.value.x_size = 300
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_size'] !== null){
			jsonform.value.x_size = retrieveSquareParam(id,"Cs",false)['x_size']		
		}
	}
	
	$(targetDiv).jsonForm(jsonform)

	// $(targetDiv).jsonForm(jsonform)

	
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }

function populate_updatecountdown(id){

	// no back end data to fetch, but tell the system we're ready
	// process_updatecountdown(id)
	var promises = [id]
	return Promise.all(promises)


}
function process_updatecountdown(id, data){

	// no data to process, but tell the system we're ready
	// saveProcessedData(id, '', "intentionallyEmpty");
	return ""
}

function graph_updatecountdown(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	$("#square_"+id).height( height ); 
	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;

	// XXX overset We here? stop it being stale?
	//var Wr = retrieveSquareParam(id, 'Wr')
	
	
				
	
	var Wr = retrieveSquareParam(id,"Cs",true)['x_size']

	var radius = Math.min(width, height) / 1.9,
	    spacing = .09;

	var arcBody = d3.arc()
	    .startAngle(0)
	    .endAngle(function(d) { return d.value * 2 * Math.PI; })
	    .innerRadius(function(d) { return d.index * radius; })
	    .outerRadius(function(d) { return (d.index + spacing) * radius; })
	    .cornerRadius(6);

	var arcCenter = d3.arc()
	    .startAngle(0)
	    .endAngle(function(d) { return d.value * 2 * Math.PI; })
	    .innerRadius(function(d) { return (d.index + spacing / 2) * radius; })
	    .outerRadius(function(d) { return (d.index + spacing / 2) * radius; });


	var svgg = square.append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


	var txtCounter = square.append("svg:foreignObject")
	    .attr("width", width)
	    .attr("height", height)
	.append('xhtml:div')
	    .classed("graph_updater_centertext", true)
		.attr("id", function(d){ return "square_updater_"+d.id+"_centertext" })
		.text("...")

	var field = svgg.selectAll("g")
	    .data(fields(percentage()))
	  .enter().append("g");


	field.append("path")
		.attr("class", "arc-body")
		.style("fill", GLB.colorMain)

	clearTimeout(tickObject[id]);
	function tick(oldPercentage) {
		//   if (!document.hidden) field 

			var newPercentage = percentage();

			field.each(function(d) { this._value = d.value; })
			      .data(fields(percentage()))
			      .each(function(d) { d.previousValue = this._value; })
			    .transition()
			      .each(fieldTransition);
			
			var epoch = Math.floor(new Date().getTime() / 1000);

			if( newPercentage < oldPercentage){
				// into next cycle
				// now update the new We to be an absolute (/postive) number
				
				// qq("from "+url.squares[squarearraysearch(id)]['Wi'][0])
				//url.squares[squarearraysearch(id)]['Wi'][0] = (epoch - (epoch % Wr));
				// qq("to "+url.squares[squarearraysearch(id)]['Wi'][0])
				
				
				if(!url.squares[squarearraysearch(id)].hasOwnProperty("Wi")){
					url.squares[squarearraysearch(id)].Wi = []
				}
				
				qq("updating wi[0] for id:"+id+" from "+url.squares[squarearraysearch(id)]['Wi'][0])
				url.squares[squarearraysearch(id)]['Wi'][0] = (epoch - (epoch % Wr));
				qq("updating wi[0] for id:"+id+" to "+url.squares[squarearraysearch(id)]['Wi'][0])

				udpateScreenLog("#"+id+" cycling");
				drawinBoxes([id])
				reloadData(findAllChildren(id));
				

			}
		
			updateCounter(id);
			tickObject[id] = setTimeout(function(){  tick(newPercentage)  }, 1000 - Date.now() % 1000);
	}
	tick(percentage());

	d3.select(self.frameElement).style("height", height + "px");

	function fieldTransition() {
	  var field = d3.select(this).transition();

	  field.select(".arc-body")
	      .attrTween("d", arcTween(arcBody))

	  field.select(".arc-center")
	      .attrTween("d", arcTween(arcCenter));

	}

	function arcTween(arc) {
	  return function(d) {
	    var i = d3.interpolateNumber(d.previousValue, d.value);
	    return function(t) {
	      d.value = i(t);
	      return arc(d);
	    };
	  };
	}

	function fields(percentage) {
		return [
			{index: .7, value: percentage},
		];
	}

	function percentage(){
		var epoch = Math.floor(new Date().getTime() / 1000);
		return ( epoch % Wr ) / Wr;
	}

	function updateCounter(id){
//		$("#square_updater_"+id+"_centertext").text( countSeconds(  ( calcGraphTime(id, 'We', 0) + Math.abs(retrieveSquareParam(id, 'Ws'))) - Math.floor(new Date().getTime() / 1000)    ) );
		var epoch = Math.floor(new Date().getTime() / 1000);
		$("#square_updater_"+id+"_centertext").text( countSeconds( Wr-(  epoch % Wr)   ));
	}
}
