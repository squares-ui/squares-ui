graphs_functions_json.add_graphs_json({
	"elastic":{
		"Globe":{
			"completeForm": "elastic_completeform_globe",
			
			"populate":"elastic_populate_globe",
			"rawtoprocessed":"elastic_rawtoprocessed_globe",
			"graph":"elastic_graph_globe",
			"about": "Globe of Lat Lon"
		}
	}
});

var loc_country_globe_camera = new THREE.PerspectiveCamera(45, 1, 10, 120);


function elastic_completeform_globe(id, targetDiv){

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
					"x_lat": {
						"title": "Latitude",
						"type": "string",
						"enum": dropdownFields
					},
					"x_lon": {
						"title": "Longitude",
						"type": "string",
						"enum": dropdownFields
					},
					"x_track": {
						"title": "Track By (e.g. Source IP, destination country...)",
						"type": "string",
						"enum": dropdownFields
					}
				},

				"form": ["*"],
				
                "value":{}
			}
			
			if(retrieveSquareParam(id,"Cs",false) !== undefined){
				if(retrieveSquareParam(id,"Cs",false)['x_track'] !== undefined){
					jsonform.value.x_track = retrieveSquareParam(id,"Cs",false)['x_track']
				}
				
				if(retrieveSquareParam(id,"Cs",false)['x_lat'] !== undefined){
					jsonform.value.x_track = retrieveSquareParam(id,"Cs",false)['x_lat']
				}
				
				if(retrieveSquareParam(id,"Cs",false)['x_lon'] !== undefined){
					jsonform.value.x_track = retrieveSquareParam(id,"Cs",false)['x_lon']
				}
				
			}else{
				
			}

			$(targetDiv).jsonForm(jsonform)

		}).catch(e => {
			alert(e)
			// setPageStatus(id, 'Critical', 'Fail to "elastic_get_fields" for id:'+id+', ('+e+')');

		})
}



function elastic_populate_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	
	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	Ds = clickObjectsToDataset(id)
	
	fields = []
	if(retrieveSquareParam(id,"Cs",false) !== undefined){
		if(retrieveSquareParam(id,"Cs",false)['x_track'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_track'])
		}
		if(retrieveSquareParam(id,"Cs",false)['x_lat'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_lat'])
		}
		if(retrieveSquareParam(id,"Cs",false)['x_lon'] !== undefined){
			fields.push(retrieveSquareParam(id,"Cs",false)['x_lon'])
		}
	}
	var limit = 1000;

	var query = elastic_query_builder(id, from, to, Ds, fields, limit, true);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
	
}



function elastic_rawtoprocessed_globe(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var data = retrieveSquareParam(id, 'rawdata_'+'');
	var dataCount = {}

	csTrack = retrieveSquareParam(id,"Cs",true)['x_track']
	csLat = retrieveSquareParam(id,"Cs",true)['x_lat']
	csLon = retrieveSquareParam(id,"Cs",true)['x_lon']
	
	// track unique found vars
	nodes = {}
	data2 = {}
	

	// loop through results aggregating sums
	_.each(data, function(obj,i){

		lat = csLat.split('.').reduce(stringDotNotation, obj._source)
		lon = csLon.split('.').reduce(stringDotNotation, obj._source)
		track = csTrack.split('.').reduce(stringDotNotation, obj._source)

		// bad record?
		if( track != "null" && lat && lon ){

			latlonName = lat + "|" + lon

			// Does the lat lon exist?
			if(!data2.hasOwnProperty(latlonName)){
				data2[latlonName] = {}
			}

			// does the field type exist againt the lat lon?
			if(!data2[latlonName].hasOwnProperty(track)){
				data2[latlonName][track] = 1
				nodes[track] = null
			}else{
				
				data2[latlonName][track] = data2[latlonName][track] + 1
			}
		}
	})
	//{"37.4192|-122.0574":{"tcp":6,"udp":13},
	// qq(data2)



	// set nodes
	nodes = _.keys(nodes)



	// calculate highest lon/lat for scaling
	highest = 0
	_.each(data2, function(obj,key){
		values = _.values(obj)
		summed = _.reduce(values, function(memo, num){ return memo + num; }, 0);
		if(summed > highest){
			highest = summed
		}
	})
	// qq("highest: "+highest)
	



	// every latlon needs each key, even if 0. Loop through each key for each entry
	// data3 = []
	// _.each(data2, function(obj,key){
	// 	dataTmp = {}	
	// 	dataTmp['latlon'] = key
		
	// 	_.each(nodes, function(node){

	// 		if(obj.hasOwnProperty(node)){
	// 			dataTmp[node] = obj[node]
			
	// 		}

	// 	})

	// 	data3.push(dataTmp)

	// })
	// // qq(data3)



	dataOut = {}
	dataOut.data = data2
	dataOut.nodes = nodes
	dataOut.highest = highest
	saveProcessedData(id, '', dataOut);
}


function elastic_graph_globe(id){
	

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
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
	
	var data = retrieveSquareParam(id, 'processeddata')['data']
	var nodes = retrieveSquareParam(id, 'processeddata')['nodes']
	var highest = retrieveSquareParam(id, 'processeddata')['highest']

	var globeRadius = 300;
	var markerRadius = 0.5;
	var markerFurther = 1.2;




	//////////////////////

	x = 100
	_.each(data, function(obj,latlon){
		x = x + 100
		y = 0

		_.each(obj, function(obj2,key2){

			myHeight = (obj2 / highest )* globeRadius

			square.append("rect")
			.attr("width", 25)
            .attr("x", x)
            .attr("y",y  )
			.attr("height", myHeight)
			.style("fill", function(d) { 
				//return d.color = color(d.name.replace(/ .*/, "")); 
				return GLB.color(key2)
			});

			y += myHeight

		})


	})




	
}	





