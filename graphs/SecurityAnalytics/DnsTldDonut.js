// This project cannot import new graphs 100% automatically
// Each graph must have a file like this
// First (declare, mandatory) - push myself to import_graphs()   The fields here represent the variable names below.  Try and stick to the naming scheme
// Second (function, mandatory) - we must pull in data from *any* source (CSV, TSV, API). This data has to finish in an array @ o.squares[squarearraysearch(id)].data
// Third (function, mandatory) - We must draw/graph the data 
// Fourth (function, optional) - function to repeatedly call API for results

graphs_functions_json.add_graphs_json({
	"SecurityAnalytics":{
		"DNS TLD Donut":{
			"populate":"populate_Squarednstlddonut", 
			"rawtoprocessed":"rawToProcessed_Squarednstlddonut",
			"param": "", 
			"graph":"graph_Squarednstlddonut",
			"about": "DNS Requests, counted in Packets, grouped by TLD, inversed (rarest TLD is the largest slice)."
		}
	}
});

function populate_Squarednstlddonut(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var filter = "?";
	for(var i in retrieveSquareParam(id, 'Ds')){
		filter+="&filter[]="+btoa(retrieveSquareParam(id, 'Ds')[i]);
	}

	var to = moment(calcGraphTime(id, 'We', 0), "X").format();
	var from =  moment( (calcGraphTime(id, 'We', 0) - retrieveSquareParam(id, "Ws")) , "X").format();
	
	var Ds = btoa(calcDs(id, []));
	var fields = "dns_query";

	getAttributeApi_Generic(id, fields, from, to, filter, 10, true, 'd', '');
}

function rawToProcessed_Squarednstlddonut(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');
		
	var tmpobject = new Object();
	var tlda = new Array();
	var tld="";
	
	// Loop through all and split out the TLD
	for (var row in data.data){
		tlda = data.data[row]["columns"][0].split(".");
		tld = tlda[tlda.length-1];	
		// if key doesn't exist, set it to an int
		if(tmpobject[tld] == null){
			tmpobject[tld]=0;
		}
		tmpobject[tld] = tmpobject[tld] + parseInt(data.data[row]["columns"][1]);
		
	}
	
	// loop and push object key value pairs to an array
	var preLockr = new Array();
	for (var key in tmpobject){
		
		
		if(url.sake.squares[squarearraysearch(id)].Gp == "lin"){
			preLockr.push({"label": key, "value": tmpobject[key]})
		}else if(url.sake.squares[squarearraysearch(id)].Gp == "inv"){
			preLockr.push({"label": key, "value": (1/tmpobject[key])})
		}else if(url.sake.squares[squarearraysearch(id)].Gp == "log"){
			preLockr.push({"label": key, "value": Math.log(tmpobject[key])})
		}else{
			preLockr.push({"label": key, "value": tmpobject[key]})
		}
			
			
			
	}

	saveProcessedData(id, '', preLockr);
	
}

function graph_Squarednstlddonut(id){

	//qq("graphing id:"+id+" ");

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")");

	//  https://bl.ocks.org/syntagmatic/eebcb592d3fdd9ac4a5c92361c1e7066

	var squareContainer = sake.selectAll('#square_container_'+id)
	var square = squareContainer
		//.append("xhtml:div") 
		.append("div")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })

	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');

	//qq("me "+JSON.stringify(data));
	var radius=(width/2);
	
	var r = (width-20)/2,                           
	color = d3.scaleOrdinal(d3.schemeCategory20); 
	
	var optionsdiv = d3.select("#square_"+id).append("div")
		.attr("id", "square_"+id+"_optionsdiv");
		
	// add the buttons to control pie chart scaling
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Linear" )
		.on("click", function(){
			updateSquareParam(id, 'lin');
			rawToProcessed_Squarednstlddonut(id);
		});
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Logarithmic" )
		.on("click", function(){
			updateSquareParam(id, 'log');
			rawToProcessed_Squarednstlddonut(id);
		});
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Inverse" )
		.on("click", function(){
			updateSquareParam(id, 'inv');
			rawToProcessed_Squarednstlddonut(id);			
		});	
	
	var svg = d3.select("#square_"+id).append("svg")
	.data([data]) 
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("x", "10")
		.attr("y", "10")	
	.append("svg:g")
		.attr("transform", "translate(" + r + "," + r + ")")



    var arc = d3.arc()              
        .outerRadius(r)
        .innerRadius(r*0.5)

    var pie = d3.pie()           
        .value(function(d) { return d.value; });    

    var arcs = svg.selectAll("g.slice")     
        .data(pie)                          
        .enter()                            
        	.append("svg:g")                

        arcs.append("svg:path")
                .attr("d", arc)
                .classed("slice", "true")
		.classed("arc", "true")

			
}
