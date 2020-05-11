graphs_functions_json.add_graphs_json({
	"elastic":{
		"Countyby":{
			"completeForm": "elastic_completeform_countby",			
			"processForm": "elastic_processform_countby",			
			"populate": "elastic_populate_countby",
			"rawtoprocessed":"elastic_rawtoprocessed_countby",
			"graph":"elastic_graph_countby",
			"about": "Simple count with high level counting stats.",
		}
	}
});

function elastic_completeform_countby(id, targetDiv){


	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
	
			const jsonform = {
				"schema": {
				  "x_field": {
					"type": "string",
					"title": "Groupby", 
					"enum": results['text']
					
				  }
				},
				"form": [
				  {
					"key": "x_field"
			
				  }
				],
                "value":{}
			}

			$(targetDiv).jsonForm(jsonform)

		})




}


function elastic_populate_countby(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)
	
	//var fields = [];  // use this to see all fields in raw output
	//var fields = ["@timestamp", "type", "client_ip", "method", "port", "server_response"];
	var fields=[retrieveSquareParam(id,"Cs",true)['x_field']]

	var limit = 10000;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}



function elastic_rawtoprocessed_countby(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	const firstBy = retrieveSquareParam(id,"Cs")['x_field']


	var dataout = {}

	//// how many rows
	dataout.length = data.length
	
	//// how many unique addresses
	dataout.unique = _.uniq(  
		_.map(data, function(row){  
			return firstBy.split('.').reduce(stringDotNotation, row._source)
			//return row._source[firstBy]  
		})
	).length
	
	//// range of 1st normal distribution
	// {"1.2.3.4":123, "5.6.7.8":456, ...}
	var datacounter = {}
	for (i = 0; i < data.length; i++) { 
		// if(!(data[i]._source[firstBy] in datacounter)){
		// 	datacounter[data[i]._source[firstBy]] = 0;
		// }
		// datacounter[data[i]._source[firstBy]]++;
	
		deepVal = firstBy.split('.').reduce(stringDotNotation, data[i]._source)

		if(!(deepVal in datacounter)){
			datacounter[deepVal] = 0;
		}
		datacounter[deepVal]++;
	

	}
	// datacounter = {"value1":134,"value2":227,...}
	qq(datacounter)
	
	
	
	
			// create mean
			mean = _.reduce(
				_.values(datacounter)   , function(memo, num){ 
					return memo + num; 
				}, 0) / _.keys(datacounter).length
			dataout.mean = mean



			// normal distribution deviance from mean
			datadeviance = _.map(datacounter, function(num, key){
				//qq(i+" "+Math.pow((i - avg), 2))
				
				return Math.pow((num - mean), 2)
			})



			//qq(">>"+JSON.stringify(datadeviance))
			onesd = Math.sqrt(_.reduce(datadeviance, function(memo, num) { return memo + num}, 0) / _.keys(datacounter).length) 
			dataout.onesd = onesd

			// //// how many sigma4+
			// var foursigma = 4 * dataout.onesd
			
			// var foursigmahit = 0
			// for (var key in datacounter) {
			// 	if(datacounter[key] > foursigma){
			// 		foursigmahit ++
			// 	}
			// }
			// dataout.foursigmahit = foursigmahit

			// var foursigmahits = []
			// for (var key in datacounter) {
			// 	if(datacounter[key] > foursigma){
			// 		foursigmahits.push(key)
			// 	}
			// }
			// dataout.foursigmahits = foursigmahits

			sigmahits = {}
			sigmaArray = [0,1,2,3,4]
			
			for (var key in datacounter) {

				if(datacounter[key] < (1*onesd)){
					if( !sigmahits.hasOwnProperty('0<1') ){
						sigmahits["0<1"] = []	
					}
					sigmahits["0<1"].push(key)
				}else if(datacounter[key] < (2*onesd)){
					if( !sigmahits.hasOwnProperty('1<2') ){
						sigmahits["1<2"] = []	
					}
					sigmahits["1<2"].push(key)
					
				}else if(datacounter[key] < (3*onesd)){
					if( !sigmahits.hasOwnProperty('2<3') ){
						sigmahits["2<3"] = []	
					}
					sigmahits["2<3"].push(key)
					
				}


			}
			// sigmahits = {"<1":["value1","value2"],....}
			dataout.sigmahits = sigmahits



	saveProcessedData(id, '', dataout);

}


function elastic_graph_countby(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
		//.append("svg")
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
			.attr("width", "1000")
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');
	const firstBy = retrieveSquareParam(id,"Cs")['x_field']

	clusterSection = square.append("div")


	// ##################
	clusterDiv = clusterSection.append("div")
	.classed("square_countby", true)
		.text("Total rows: " +data.length)


	// ##################
	clusterDiv = clusterSection.append("div")
		.classed("square_countby", true)
		.text("Unique '"+firstBy+"': "+data.unique)

	// ##################
	clusterDiv = clusterSection.append("div")
		.classed("square_countby", true)
		.text("Mean avg occurace: "+Math.round(data.mean))



	// // ##################
	// clusterDiv = clusterSection.append("div")
	// 	.classed("square_countby", true)
	// 	.text("1 Standard Deviation : "+Math.round(data.onesd))




	// // ##################
	// // if mean-sd < 0, then set to 0
	// if(Math.ceil(data.mean-data.onesd)< 0){
	// 	onesdmin = 1;
	// }else{
	// 	onesdmin = Math.ceil(data.mean-data.onesd);
	// }	
	// clusterDiv = clusterSection.append("div")
	// 	.classed("square_countby", true)
	// 	.text("Majority of keys '"+firstBy+"' less than: < "+Math.floor(data.mean+data.onesd)+ " times")



	// // ##################
	// sigma = 3
	// clusterDiv = clusterSection.append("div")
	// 	.classed("square_countby", true)
	
	// 	clusterDiv.append("div")
	// 		.classed("fleft", true)
	// 		.text("Entires with occurance count above "+sigma+"Sigma ("+Math.floor(sigma*data.onesd)+" hits): "+data.foursigmahits.join(","))
		
	// 	// clusterDiv.append("div")
	// 	// 	.style("font-weight", "bold")
	// 	// 	.style("text-decoration", "underline")
	// 	// 	.classed("fleft", true)
	// 	// 	.text()
	// 	// 	.on("click", function() {  childFromClick(id, {"y": 1000, "Gt":"Pie Chart", "Cs":{"x_field":firstBy}} , {} )
	// 	//    });


	// 	clusterDiv.append("div")
	// 		.classed("clr", true)


	// clusterSection.append("div")
	// 	.classed("clr", true)


	// ##################
	qq(data.sigmahits)

	_.each(data.sigmahits, function(obj,key){

		clusterDiv = clusterSection.append("div")
			.classed("square_countby", true)
		
			clusterDiv.append("div")
				.text("Values in Sigma range "+key+":")

			clusterDiv.append("div")
				.text(obj.join(","))

			clusterDiv.append("div")
				.classed("clr", true)


		clusterSection.append("div")
			.classed("clr", true)

	})




}


