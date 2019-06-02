graphs_functions_json.add_graphs_json({
	"SecurityAnalytics":{
		"App Group":{
			"populate":"populate_SA_appgroup_piechart",
			"rawtoprocessed":"process_SA_appgroup_piechart",
			"param": "", 
			"graph":"graph_SA_appgroup_piechart",
			"about": "Length = session.  Width = Bytes."
		}
	}
});


function populate_SA_appgroup_piechart(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var Ds = calcDs(id, []);
	var filter = "?";
	for(var i in Ds){
		filter+="&filter[]="+btoa(  Ds[i]   );
	}

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws")) , "X").format();
	
	var Ds = btoa(calcDs(id, []));
	var fields = "application_group";

	var limit = 1000;

	getAttributeApi_Generic(id, fields, from, to, filter, limit, true, 'd', '');

}



function process_SA_appgroup_piechart(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');

	data2 = new Array();
	for(var i = 0; i < data.data.length ; i++){
		tmpObj = new Object();
		tmpObj.name = data.data[i]["columns"][0];
		tmpObj.bytes = data.data[i]["columns"][1];
		tmpObj.sessions= data.data[i]["columns"][2];
		//tmpObj.bytes = data.data[i]["columns"][1];
		data2.push(tmpObj);
	}	

	saveProcessedData(id, '', data2);
}


function graph_SA_appgroup_piechart(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

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
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var radius=(width/2), innerRadius = 0.1 * radius;

	var data = retrieveSquareParam(id, 'processeddata');

	var maxBytes = Math.max.apply(Math,data.map(function(o){return o.bytes;}))
	var maxSessions = Math.max.apply(Math,data.map(function(o){return o.sessions;}))


	var pie = d3.pie()
		.sort(null)
	    	.value(function(d) { 
			// width
			// return 50;
			return Math.log(d.bytes) / maxBytes; 
		});	

	var arc = d3.arc()
		.innerRadius(innerRadius)
		.outerRadius(function (d) { 
			// length
			return innerRadius + (  (Math.log(d.data.sessions) / Math.log(maxSessions)) * (radius - innerRadius)); 
		});

	var outlineArc = d3.arc()
	        .innerRadius(innerRadius)
	        .outerRadius(radius);

	
	var gChart = square.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
		

	
	var arcs = gChart.selectAll(".solidArc")
		.data(pie(data))
		.enter()
	
	arcs.append("path")
		.attr("fill", "blue")
		.classed("arc", "true")
		.attr("stroke", "gray")
		.attr("d", arc)
		.on("click", function(d){
			clickObject = btoa('application_group="'+d.data.name+'"');
			childFromClick(id, {"y": 1000, "Ds": clickObject} , {} );
		})

        arcs.append("svg:text")                                     
	        .classed("fill_col_1", "true")
        	.attr("transform", function(d) {                    
			// we e have to make sure to set these before calling arc.centroid
	        	d.innerRadius = (radius);
	         	d.outerRadius = (radius);
			return "translate(" + arc.centroid(d) + ")";        
		})
	   	.attr("text-anchor", "middle")                          
        	.text(function(d, i) { 
			return d.data.name; 
		})







}


