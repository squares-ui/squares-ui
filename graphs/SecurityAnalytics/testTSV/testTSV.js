// This project cannot import new graphs 100% automatically
// Each graph must have a file like this
// First (declare, mandatory) - push myself to import_graphs()   The fields here represent the variable names below.  Try and stick to the naming scheme
// Second (function, mandatory) - we must pull in data from *any* source (CSV, TSV, API). This data has to finish in an array @ o.squares[squarearraysearch(id)].data
// Third (function, mandatory) - We must draw/graph the data 
// Fourth (function, optional) - function to repeatedly call API for results

// Push this files details to the main page array
import_graphs.push({
	"short":"Test TSV", 
	"populate":"populate_testTSV", 
	"rawtoprocessed":"rawToProcessed_testTSV",
	"param": "", 
	"graph":"graph_testTSV",
	"about": "Something gancy"
});

function populate_testTSV(id){

	//qq("populating id:"+id);
	var Tf = moment(calcGraphTime(id, 'Tf', 0)/1000, "X").format();
	var Tt = moment(calcGraphTime(id, 'Tt', 0)/1000, "X").format();
	
	getAttributetsv_Generic(id, Tf, Tt, ['initiator_ip', 'responder_ip', 'tcp_responder'], 10, true, '');


}

function rawToProcessed_testTSV(id){
	//qq("*** here is the data***");
	
	Lockr.rm('squaredata_'+id+'_processeddata');
	d3.select("#square_"+id).selectAll("*").remove();
	
	var data = retrieveSquareParam(id, 'rawdata_'+'');

qq(">>"+data);
qq(">>"+tsvJSON(data));
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


function graph_testTSV(id){

	//qq("graphing id:"+id+" ");

	var width = squareTemplate.width-4;
	var height = squareTemplate.bodyheight-4;
	var margin = {top: squareTemplate.icondim+squareTemplate.iconspacer+2, right: 0, bottom: 0, left: 0};
	
	var data = retrieveSquareParam(id, 'processeddata');

	//qq("me "+JSON.stringify(data));
	
	var r = (width-20)/2,                           
	color = d3.scale.category20c();     
	
	var optionsdiv = d3.select("#square_"+id).append("div")
		.attr("id", "square_"+id+"_optionsdiv");
		
	// add the buttons to control pie chart scaling
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Linear" )
		.on("click", function(){
			updateSquareParam(id, 'lin');
			rawToProcessed_testTSV(id);
		});
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Logarithmic" )
		.on("click", function(){
			updateSquareParam(id, 'log');
			rawToProcessed_testTSV(id);
		});
	d3.select("#square_"+id+"_optionsdiv").append("input")
		.attr("type","button")
		.attr("class","button")
		.attr("value", "Inverse" )
		.on("click", function(){
			updateSquareParam(id, 'inv');
			rawToProcessed_testTSV(id);			
		});	
	
	var svg = d3.select("#square_"+id).append("svg")
	.data([data]) 
		.attr("width", "100%")
		.attr("height", "100%")
		.attr("x", margin.left).attr("y", margin.top)	
	.append("svg:g")
		.attr("transform", "translate(" + r + "," + r + ")")
	
    var arc = d3.svg.arc()              
        .outerRadius(r);

    var pie = d3.layout.pie()           
        .value(function(d) { return d.value; });    

    var arcs = svg.selectAll("g.slice")     
        .data(pie)                          
        .enter()                            
            .append("svg:g")                
                .attr("class", "slice");    

        arcs.append("svg:path")
                //.attr("fill", function(d, i) { return color(i); } ) 
				.attr("fill", function(d, i) { return stringtocol(data[i].label); } ) 
                .attr("d", arc);                                    

        arcs.append("svg:text")                                     
                .attr("transform", function(d) {                    
                //we have to make sure to set these before calling arc.centroid
                d.innerRadius = (r*.5);
                d.outerRadius = (r*1);
                
				return "translate(" + arc.centroid(d) + ")";        
            })
            .attr("text-anchor", "middle")                          
            .text(function(d, i) { 
				
				return "."+data[i].label; 
			})
			
			
			;       
		  
}
