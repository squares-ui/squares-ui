	graphs_functions_json.add_graphs_json({
	"elastic":{
		"3DGroupedNormal":{
			"completeForm": "elastic_completeform_3dGroupedNormal",
			"populate": "elastic_populate_3dGroupedNormal",
			"rawtoprocessed":"elastic_rawtoprocessed_3dGroupedNormal",
			"param": "", 
			"graph":"elastic_graph_3dGroupedNormal",
			"about": "Height represents total Sigma difference over three fields. High dot represents away from Standard Deviation (above or below)",
		}
	}
});


function elastic_completeform_3dGroupedNormal(id, targetDiv){
	


	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	connectionhandle = connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index')

	elastic_get_fields(dst, connectionhandle, id)
		.then(function(results){
  
            const jsonform = {
                "schema": {
                    "x_first": {
                        "type": "string",
                        "title": "GroupBy", 
                        "enum": results['text'],
                        "required": true
                    },
                    "x_second": {
                        "type": "string",
                        "title": "Field 1", 
                        "enum": results['text'],
                        "required": true
                    },
                    "x_third": {
                        "type": "string",
                        "title": "Field 2", 
                        "enum": results['text'],
                        "required": true
                    },
                    "x_fourth": {
                        "type": "string",
                        "title": "Field 3", 
                        "enum": results['text'],
                        "required": true
                    },
        
                },
                "form":[
                    {"key":"x_first"},
                    {"key":"x_second"},
                    {"key":"x_third"},
                    {"key":"x_fourth"},
                ],
                "value":{}
                
            }   
            
            if(retrieveSquareParam(id,"Cs",false) !== undefined){
                jsonform.schema.x_first.default = retrieveSquareParam(id,"Cs",false)['x_first']
                jsonform.schema.x_second.default = retrieveSquareParam(id,"Cs",false)['x_second']
                jsonform.schema.x_third.default = retrieveSquareParam(id,"Cs",false)['x_third']
                jsonform.schema.x_fourth.default = retrieveSquareParam(id,"Cs",false)['x_fourth']
            }        
        
            $(targetDiv).jsonForm(jsonform)

		})
}


function elastic_populate_3dGroupedNormal(id){
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var Ds = calcDs(id, []);
	
	firstBy = retrieveSquareParam(id,"Cs")['x_first']
	secondBy = retrieveSquareParam(id,"Cs")['x_second']
	thirdBy = retrieveSquareParam(id,"Cs")['x_third']
    fourthBy = retrieveSquareParam(id,"Cs")['x_fourth']
    var fields=[firstBy, secondBy, thirdBy, fourthBy]
	
	var limit = 10000;

    var query = elastic_query_builder(from, to, Ds, fields, limit, null);

	elastic_connector(connectors_json.handletodst( retrieveSquareParam(id, 'CH')), connectors_json.handletox( retrieveSquareParam(id, 'CH'), 'index'), id, query);

}


function elastic_rawtoprocessed_3dGroupedNormal(id){

	var data = retrieveSquareParam(id, 'rawdata_'+'')['hits']['hits'];

	const firstBy = retrieveSquareParam(id,"Cs")['x_first']
    const secondBy = retrieveSquareParam(id,"Cs")['x_second']
    const thirdBy = retrieveSquareParam(id,"Cs")['x_third']
    const fourthBy = retrieveSquareParam(id,"Cs")['x_fourth']


    data3 = {}



    var datashrunk = _.map(data, function(row){
        return [row._source[firstBy], row._source[secondBy], row._source[thirdBy], row._source[fourthBy]]
    })
    //qq(datashrunk)

    // [a,b,c,d] ===> {"a": [[b,c,d],[e,f,g]], "b"...}

    data3.entries = {}
    data3.counters = {}
        data3.counters.secondBy = {}
        data3.counters.thirdBy = {}
        data3.counters.fourthBy = {}
    data3.normaldistribution = {}
        data3.normaldistribution.secondBy = {}
        data3.normaldistribution.thirdBy = {}
        data3.normaldistribution.fourthBy = {}

    for (i = 0; i < datashrunk.length; i++) { 
        


        // data3.entries = {
        //     "10.0.0.1": [["a.js","80", "POST"], ["b.exe","80", "GET"], ["c.jpg","443", "HEAD"]],
        //     "10.0.0.2": [["a.js","80", "POST"], ["a.js","80", "GET"], ["c.jpg","443", "HEAD"]],
        //     "10.0.0.3": [["a.js","80", "POST"], ["a.js","80", "GET"], ["c.jpg","443", "HEAD"], ["c.jpg","443", "HEAD"]]
        // }
        // add the row 
        if (typeof data3.entries[datashrunk[i][0]] == "undefined" || !(data3.entries[datashrunk[i][0]] instanceof Array)) {
            data3.entries[datashrunk[i][0]] = []
        }
        data3.entries[datashrunk[i][0]].push([datashrunk[i][1],datashrunk[i][2],datashrunk[i][3]])



        // data3.counters = {
        //     "secondBy":{"a.js": 5,  "b.exe": 1,"c.jpg": 4},
        //     "thirdBy":{"80": 6,"443": 4},
        //     "fourthBy":{"POST": 3,"GET": 3,"HEAD": 4
        //     }
        // }
        // count the value
        if(!(datashrunk[i][1] in data3.counters.secondBy)){
            data3.counters.secondBy[datashrunk[i][1]] = 0;
        }
        data3.counters.secondBy[datashrunk[i][1]]++;
        
        if(!(datashrunk[i][2] in data3.counters.thirdBy)){
            data3.counters.thirdBy[datashrunk[i][2]] = 0;
        }
        data3.counters.thirdBy[datashrunk[i][2]]++;
        
        if(!(datashrunk[i][3] in data3.counters.fourthBy)){
            data3.counters.fourthBy[datashrunk[i][3]] = 0;
        }
        data3.counters.fourthBy[datashrunk[i][3]]++;

    }
    
    
    // data3.normaldistribution = {
    //     "secondBy": {"mean":3.3, "nd":0.4},
    //     "thirdBy": {"mean":5, "nd":0.5},
    //     "fourthBy": {"mean":3.3, "nd":0.1},
    // }
    // now with every total, calculate the mean and norman distribution (nd) for each
    for (const [key, value] of Object.entries(data3.counters)) {
        
        //// mean 
        total = _.reduce(value, function(memo, num){
            return memo + num;
        }, 0)
        mean = total / _.size(value)
        data3.normaldistribution[key].mean = mean

        ////normal distribution 
        
        // create an array of the deviance from mean
        
        datadeviation = _.each(_.values(value), function(i){
			//qq(i+" "+Math.pow((i - avg), 2))
			return Math.pow((i - mean), 2)
		})

		// Sum all numbers, divide by n and square root
		datand = Math.sqrt(_.reduce(datadeviation, function(memo, num) { return memo + num}, 0) / _.values(value).length) 
        //qq("1 standard deviation (\u03C3) "+ datand)
        data3.normaldistribution[key].nd = datand


    }
    
    data3.groupcount = 3
    saveProcessedData(id, '', data3);

}


function elastic_graph_3dGroupedNormal(id){
	
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
    controls.target.x = 0;
    controls.target.y = grid_size*0.5;
    controls.target.z = 0;
    scene.userData.controls = controls;

    greyish = 0xcccccc;

    var polargrid = new THREE.PolarGridHelper( grid_size, 8, 7, 32 );
    scene.add(polargrid);


	var raycaster = new THREE.Raycaster();
	scene.userData.raycaster = raycaster;

	var geometry = new THREE.Geometry();


    var keyCount = 0;
    for (const [key, value] of Object.entries(data.entries)) {
        for (i = 0; i < value.length; i++) { 

            // x = Math.random() * 100
            // z = Math.random() * 100
            radialOffset = 0.3

            // calculate place on circle, and distance from center 
            rotation = (keyCount / data.groupcount) 
            x = grid_size * ((i / value.length)+radialOffset) * Math.cos(rotation)
            z = grid_size * ((i / value.length)+radialOffset) * Math.sin(rotation)
            
            // height = sum of Normal Distribution over all 3
            // so if first column is in 4sigma (high or low), second is 4 sigma, third is 1sigma, that's sum=9
            // for each field, get value -> comapre to normaldist
            rawValue = data.counters.secondBy[value[i][0]];
            mean = data.normaldistribution.secondBy.mean;
            nd = data.normaldistribution.secondBy.nd;
            sigmaone = calcSigma(rawValue, mean, nd)
            
            rawValue = data.counters.thirdBy[value[i][1]];
            mean = data.normaldistribution.thirdBy.mean;
            nd = data.normaldistribution.thirdBy.nd;
            sigmatwo = calcSigma(rawValue, mean, nd)

            rawValue = data.counters.fourthBy[value[i][2]];
            mean = data.normaldistribution.fourthBy.mean;
            nd = data.normaldistribution.fourthBy.nd;
            sigmathree = calcSigma(rawValue, mean, nd)
            
            // magic number.  3 parameters * 4sigma (max) = theoretical max of 12 sigma
            y = grid_size /  12 * (Math.sqrt(Math.pow(sigmaone, 2)) + Math.sqrt(Math.pow(sigmatwo, 2)) + Math.sqrt(Math.pow(sigmathree, 2)) )
            

            var vertex1 = new THREE.Vector3();
            vertex1.x = x
            vertex1.y = 0;
            vertex1.z = z
            geometry.vertices.push( vertex1 );
            var vertex2 = new THREE.Vector3();
            vertex2.x = x
            vertex2.y = y
            vertex2.z = z
            geometry.vertices.push( vertex2 );

            var sphereGeometry = new THREE.SphereGeometry(5, 2,2);
            var material = new THREE.MeshBasicMaterial( { color: GLB.color(value[i][0]), transparent:true} );


            var sphere = new THREE.Mesh(sphereGeometry, material);
            sphere.position.x = x
            sphere.position.y = y
            sphere.position.z = z
            sphere.workspacecontainerName = key+": "+value[i][0]+":\u03BC"+sigmaone +" "+value[i][1]+":\u03BC"+sigmatwo+", "+value[i][2]+":\u03BC"+sigmathree

            let clickObject = btoa('[{"match":{"'+firstBy+'":"'+key+'"}} ]');
           
            sphere.workspacecontainerAction = function(){ childFromClick(id, {"y": 1000, "Ds": clickObject, "Gt":null} ) };

            scene.add(sphere);
        }
        keyCount++ // (track which Group we're using)
    }

    material = new THREE.LineBasicMaterial( { color: 0x456569, linewidth: 200 } );
	var myLines = new THREE.LineSegments( geometry, material );
	myLines.updateMatrix();
	scene.add(myLines);


	threeScenes["square_"+id] = scene;

}




function calcSigma(rawValue, mean, sd){
                
    // get +/- diff from value from mean
    diff = rawValue - mean;
    // make +
    diff = Math.sqrt(Math.pow(diff, 2)) 
    // calculate sigma, max = 4
    sigma = Math.floor(diff / nd);
    sigma = Math.min(Math.max(sigma, -4), 4)
    if(rawValue > mean){
        return sigma;
    }else{
        return -sigma;        
    }
}
