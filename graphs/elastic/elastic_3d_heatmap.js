	graphs_functions_json.add_graphs_json({
	"elastic":{
		"3dHeatmap":{
			"completeForm": "elastic_completeform_3dheatmap",
			"populate": "elastic_populate_3dheatmap",
			"rawtoprocessed":"elastic_rawtoprocessed_3dheatmap",
			"param": "", 
			"graph":"elastic_graph_3dheatmap",
			"about": "3D plot of log occurance",
			"requireThreeJS": true
		}
	}
});


function elastic_completeform_3dheatmap(id, targetDiv){
	
	var dst = connectors.handletox( retrieveSquareParam(id, 'CH'), "dst")
	var indexPattern = connectors.handletox( retrieveSquareParam(id, 'CH'), 'indexPattern')

	getSavedMappings(dst, indexPattern)
		.then(function(results){
			
			var dropdownFields = []

			// _.omit keys of data types we dont want, or _.pick the ones we do, i.e. omit "text", or pick "ip"
			var subResults = _.omit(results['data'], "fields", "allFields", "keywordFields")
			_.each(subResults, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
			var dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

			const jsonform = {
				"schema": {
					"x_x": {
						"type":"array",						
						"items":{
							"type": "object",
							"properties":{
								"field":{
                                    "title": "Field",
                                    "type": "string",
                                    "enum": dropdownFields,
                                },
                                "scale":{
                                    "title": "Scale",
                                    "type": "string",
                                    "enum": [
                                      "linear", "log", "inverse"
                                    ],
			
								}
							}	
						}
					},
					"x_y": {
						"type":"array",						
						"items":{
							"type": "object",
							"properties":{
								"field":{
                                    "title": "Field",
                                    "type": "string",
									"enum": dropdownFields				
                                },
                                "scale":{
                                    "title": "Scale",
                                    "type": "string",
                                    "enum": [
                                      "linear", "log", "inverse"
                                    ]			
								}
							}	
						}
					},
					"x_z": {
						"type":"array",						
						"items":{
							"type": "object",
							"properties":{
								"field":{
                                    "title": "Field",
                                    "type": "string",
									"enum": dropdownFields				
                                },
                                "scale":{
                                    "title": "Scale",
                                    "type": "string",
                                    "enum": [
                                      "linear", "log", "inverse"
                                    ]			
								}
							}	
						}
					},

				},
				
				
				"form": [
					{
                        "title": "X",
                        "id":"square_edit_fields_x"+id,
                        "key": "x_x[]",
                        "onChange": function (e) {
                            var caller = e.target || e.srcElement;
                            var value = $(e.target).val();
                            if(caller.name=="x_x[].field"){
                                // changing field type, so check if "scale" needs showing
                                $("#square_edit_fields_x"+id).children().eq(2).hide()
                                qq("hiding "+"#square_edit_fields_x"+id)

                                _.each(subResults, function(val, key){
                                    if(_.contains(val, value) && _.contains(["float", "int", "integer", "long"], key)){
                                        $("#square_edit_fields_x"+id).children().eq(2).show()
                                        qq("showing "+"#square_edit_fields_x"+id)
                                    }
                                })
                            }
                        }
                    },
					{
                        "title": "Y",
                        "id":"square_edit_fields_y"+id,
                        "key": "x_y[]",
                        "onChange": function (e) {
                            var caller = e.target || e.srcElement;
                            var value = $(e.target).val();
                            if(caller.name=="x_y[].field"){
                                // changing field type, so check if "scale" needs showing
                                $("#square_edit_fields_y"+id).children().eq(2).hide()
                                qq("hiding "+"#square_edit_fields_y"+id)

                                _.each(subResults, function(val, key){
                                    if(_.contains(val, value) && _.contains(["float", "int", "integer", "long"], key)){
                                        $("#square_edit_fields_y"+id).children().eq(2).show()
                                        qq("showing "+"#square_edit_fields_y"+id)
                                    }
                                })
                            }
                        }
                    },
					{
                        "title": "Z",
                        "id":"square_edit_fields_z"+id,
                        "key": "x_z[]",
                        "onChange": function (e) {
                            var caller = e.target || e.srcElement;
                            var value = $(e.target).val();
                            if(caller.name=="x_z[].field"){
                                // changing field type, so check if "scale" needs showing
                                $("#square_edit_fields_z"+id).children().eq(2).hide()
                                qq("hiding "+"#square_edit_fields_z"+id)

                                _.each(subResults, function(val, key){
                                    if(_.contains(val, value) && _.contains(["float", "int", "integer", "long"], key)){
                                        $("#square_edit_fields_z"+id).children().eq(2).show()
                                        qq("showing "+"#square_edit_fields_z"+id)
                                    }
                                })
                            }
                        }
                    },

				],
				"value":{}
			}
            
            
            // if(retrieveSquareParam(id,"Cs",false) !== undefined){
                jsonform.schema.x_x.default = retrieveSquareParam(id,"Cs",false)['x_x[].field']
                jsonform.schema.x_y.default = retrieveSquareParam(id,"Cs",false)['x_y[].field']
                jsonform.schema.x_z.default = retrieveSquareParam(id,"Cs",false)['x_z[].field']
            // }
            
            $(targetDiv).jsonForm(jsonform)

            $("#square_edit_fields_x"+id).children().eq(2).hide()
            // $("#square_edit_fields_x"+id).children().eq(2).children().eq(1).children().removeAttr("selected");
            $("#square_edit_fields_y"+id).children().eq(2).hide()
            $("#square_edit_fields_z"+id).children().eq(2).hide()

		})
}


function elastic_populate_3dheatmap(id){
	return
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
    
    var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var Ds = calcDs(id, []);
	
	firstBy = retrieveSquareParam(id,"Cs")['x_first']
	secondBy = retrieveSquareParam(id,"Cs")['x_second']
	thirdBy = retrieveSquareParam(id,"Cs")['x_third']
	var fields=[firstBy, secondBy, thirdBy]
	
    var limit = 10000;
    
	var query = elastic_query_builder(from, to, Ds, fields, limit, null);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);
}


function elastic_rawtoprocessed_3dheatmap(id){
    return
	var data = retrieveSquareParam(id, 'rawdata_'+'');

	const firstBy = retrieveSquareParam(id,"Cs")['x_first']
    const secondBy = retrieveSquareParam(id,"Cs")['x_second']
    const thirdBy = retrieveSquareParam(id,"Cs")['x_third']

	

    // elastic JSON -> [[a, b, c], [a, d, g], 
    data2 = _.map(data, function(i){
        // XXX check if any non numbers?
        return [i._source[firstBy], i._source[secondBy], i._source[thirdBy]]
    })

    qq(data2)

    var jr = {} //JsonResult
//    var jr = [];

    var threedscales = {"x":[], "y":[], "z":[]}
    var xordinal = []
    var yordinal = []
    var zordinal = []
    var max = 0;

    for (i = 0; i < data2.length; i++) { 

        if(jr[data2[i][0]] == undefined){
            jr[data2[i][0]] = {}
        }
        if(jr[data2[i][0]][data2[i][1]] == undefined){
            jr[data2[i][0]][data2[i][1]] = {} 
        }
        if(jr[data2[i][0]][data2[i][1]][data2[i][2]] == undefined){
            jr[data2[i][0]][data2[i][1]][data2[i][2]] = {'value':0} 
        }
        jr[data2[i][0]][data2[i][1]][data2[i][2]].value = jr[data2[i][0]][data2[i][1]][data2[i][2]].value +1

        if(jr[data2[i][0]][data2[i][1]][data2[i][2]].value > max){
            max = jr[data2[i][0]][data2[i][1]][data2[i][2]].value
        }


        // stripe out every key found for ordinal scales later
        xordinal.push(data2[i][0])
        yordinal.push(data2[i][1])
        zordinal.push(data2[i][2])

    }

    // uniq all found keys
    threedscales.x = _.uniq(xordinal)
    threedscales.y = _.uniq(yordinal)
    threedscales.z = _.uniq(zordinal)

    

    data3 = {}
    data3.data = jr
    data3.scales = threedscales
    data3.max = max

	// nested_data = array, needs to be wrapped
	saveProcessedData(id, '', data3);

}


function elastic_graph_3dordinal(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// http://bl.ocks.org/bbest/2de0e25d4840c68f2db1

	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("y_overflow", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })
	var height = document.getElementById("square_"+id).clientHeight;
	var width  = document.getElementById("square_"+id).clientWidth;
	
	var data = retrieveSquareParam(id, 'processeddata');
	
	const firstBy = retrieveSquareParam(id,"Cs")['x_first']
	const secondBy = retrieveSquareParam(id,"Cs")['x_second']
    const thirdBy = retrieveSquareParam(id,"Cs")['x_third']

    var grid_size = 200;
    var grid_cuts = 20;    

    
    var xScale = d3.scaleBand()
        .domain(data.scales.x)
        .range([0, grid_size]);
    var yScale = d3.scaleBand()
        .domain(data.scales.y)
        .range([0, grid_size]);
    var zScale = d3.scaleBand()
        .domain(data.scales.z)
        .range([0, grid_size]);
    var sizeScale = d3.scaleLinear()
        .domain([0,data.max])
        .range([1.5, 8]);
    var opacityScale = d3.scaleLinear()
        .domain([0,data.max])
        .range([1, 0.1]);


    var scene = new THREE.Scene();
    scene.userData.id = id;
    scene.userData.doMousePos = true;

    var element = document.getElementById("square_"+id);
    scene.userData.elementt = element;

    var camera = masterCamera.clone();
    camera.position.x = grid_size*1.5;
    camera.position.y = grid_size*1.5;
    camera.position.z = grid_size*1.5;
    scene.userData.camera = camera;

    var myLight = masterAmbientLight.clone();
    scene.add(myLight);

    var controls = new THREE.OrbitControls( camera);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.panningMode = THREE.HorizontalPanning;
    controls.minDistance = grid_size*1.9;
    controls.maxDistance = grid_size*4;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.userRotate = true;
    controls.userRotateSpeed = 0.01;
    controls.target.x = 100;
    controls.target.y = 100;
    controls.target.z = 100;
    scene.userData.controls = controls;

    greyish = 0xcccccc;

	var gridXY = new THREE.GridHelper(grid_size, grid_cuts, greyish, greyish);
    //gridXY.position.set((grid_size*0.5), (grid_size*0.5), 0 );
    gridXY.position.set((grid_size*0.5),0, (grid_size*0.5) );
	gridXY.rotation.y = Math.PI/2;
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(grid_size, grid_cuts, greyish, greyish);
    //gridYZ.position.set( 0, (grid_size*0.5), (grid_size*0.5) );
    gridYZ.position.set( 0,(grid_size*0.5),(grid_size*0.5)     );
	gridYZ.rotation.z = Math.PI/2;
    scene.add(gridYZ);
    
    var gridXZ = new THREE.GridHelper(grid_size, grid_cuts, greyish, greyish);
    //gridXZ.position.set( (grid_size*0.5), 0, (grid_size*0.5) );
    gridXZ.position.set( (grid_size*0.5),(grid_size*0.5),0 );
	gridXZ.rotation.x = Math.PI/2;
	scene.add(gridXZ);


	var raycaster = new THREE.Raycaster();
	scene.userData.raycaster = raycaster;

	var geometry = new THREE.Geometry();



    for (const [keyx, valuex] of Object.entries(data.data)) {
        for (const [keyy, valuey] of Object.entries(valuex)) {
            for (const [keyz, valuez] of Object.entries(valuey)) {
                
                var markerGeometry = new THREE.SphereGeometry(3, 3, 3);
                var material = new THREE.MeshBasicMaterial( { color: "black"} );
                //////
                var markerX = new THREE.Mesh(markerGeometry, material);
                markerX.position.x = xScale(keyx)
                markerX.position.y = 0
                markerX.position.z = 0
                markerX.workspacecontainerName = keyx
                let clickObjectX = btoa('[{"match":{"'+firstBy+'":"'+keyx+'"}}]');
                markerX.workspacecontainerAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObjectX} , {} ) };
                scene.add(markerX);
                //////
                var markerY = new THREE.Mesh(markerGeometry, material);
                markerY.position.x = 0
                markerY.position.y = yScale(keyy)
                markerY.position.z = 0
                markerY.workspacecontainerName = keyy
                let clickObjectY = btoa('[{"match":{"'+secondBy+'":"'+keyy+'"}}]');
                markerY.workspacecontainerAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObjectY} , {} ) };
                scene.add(markerY);
                //////
                var markerZ = new THREE.Mesh(markerGeometry, material);
                markerZ.position.x = 0
                markerZ.position.y = 0
                markerZ.position.z = zScale(keyz)
                markerZ.workspacecontainerName = keyz
                let clickObjectZ = btoa('[{"match":{"'+thirdBy+'":"'+keyz+'"}}]');
                markerZ.workspacecontainerAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObjectZ} , {} ) };
                scene.add(markerZ);
                //////


                var sphereGeometry = new THREE.SphereGeometry(sizeScale(valuez.value), 6, 6);
                var material = new THREE.MeshBasicMaterial( { color: GLB.color(keyx+keyy+keyz), opacity: opacityScale(valuez.value), transparent:true} );

                var sphere = new THREE.Mesh(sphereGeometry, material);
                sphere.position.x = xScale(keyx)
                sphere.position.y = yScale(keyy)
                sphere.position.z = zScale(keyz)
                sphere.workspacecontainerName = keyx+", "+keyy+", "+keyz                
                let clickObject = btoa('[{"match":{"'+firstBy+'":"'+keyx+'"}}, {"match":{"'+secondBy+'":"'+keyy+'"}}, {"match":{"'+thirdBy+'":"'+keyz+'"}} ]');
                sphere.workspacecontainerAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject, "Gt":"RawOutput"} , {} ) };
                scene.add(sphere);

            }
        }
    }



	threeScenes["square_"+id] = scene;

}





