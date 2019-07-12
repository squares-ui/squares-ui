graphs_functions_json.add_graphs_json({
	"builtin_graphs":{
		"UpdateCountdown":{
			"populate":"populate_updatecountdown", 
			"rawtoprocessed":"process_updatecountdown",
			"param": "", 
			"graph":"graph_updatecountdown",
			"about": "Visual Countdown to graph update (if Live Play is enabled"
		}
	}
});

var tickObject = new Object();

function populate_updatecountdown(id){

	// no back end data to fetch, but tell the system we're ready
	process_updatecountdown(id)

}
function process_updatecountdown(id){

	// no data to process, but tell the system we're ready
	saveProcessedData(id, '', "");
}

function graph_updatecountdown(id){

	qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	$("#square_"+id).height( height ); 
	var squareContainer = sake.selectAll('#square_container_'+id)
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
	

	var radius = Math.min(width, height) / 1.9,
	    spacing = .09;

	var color = d3.scaleLinear()
	    .range(["hsl(-180,60%,50%)", "hsl(180,60%,50%)"])
	    .interpolate(function(a, b) { var i = d3.interpolateString(a, b); return function(t) { return d3.hsl(i(t)); }; });

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
	//	  if (!document.hidden) field 

			var newPercentage = percentage();

			field.each(function(d) { this._value = d.value; })
			      .data(fields(percentage()))
			      .each(function(d) { d.previousValue = this._value; })
			    .transition()
			      .each(fieldTransition);
			
			epoch = Math.floor(new Date().getTime() / 1000);

			if( newPercentage < oldPercentage){
				// now update the new We to be an absolute (/postive) number
				url.sake.squares[squarearraysearch(id)]['Wi'][0] = (epoch - (epoch % retrieveSquareParam(id, 'Wr')));
				
				udpateScreenLog("#"+id+" cycling");
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
		var Wr = retrieveSquareParam(id, 'Wr');
		return ( epoch % Wr ) / Wr;
	}

	function updateCounter(id){
//		$("#square_updater_"+id+"_centertext").text( countSeconds(  ( calcGraphTime(id, 'We', 0) + Math.abs(retrieveSquareParam(id, 'Ws'))) - Math.floor(new Date().getTime() / 1000)    ) );
		var epoch = Math.floor(new Date().getTime() / 1000);
		var Wr = retrieveSquareParam(id, 'Wr');
		$("#square_updater_"+id+"_centertext").text( countSeconds( Wr-(  epoch % Wr)   ));
	}
}
