graphs_functions_json.add_graphs_json({
	"elastic":{
		"tsne":{
			"completeForm": "elastic_completeform_tsne",
			"populate": "elastic_populate_tsne",
			"rawtoprocessed":"elastic_rawtoprocessed_tsne",
			"param": "", 
			"graph":"elastic_graph_tsne",
			"about": "tsne",
		}
	}
});



async function elastic_completeform_tsne(id, targetDiv){

	// var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	// var thisIndex = "*"
	// var thisMappings = await getSavedMappings(thisDst, thisIndex)

	// var dropdownFields = []
	
	// _.each(thisMappings, function(val, key){  _.each(val, function(val2){  dropdownFields.push(val2)  })}) 
	// dropdownFields = _.sortBy(dropdownFields, function(element){ return element})

	// const jsonform = {
	// 	"schema": {
	// 		"x_field": {
	// 			"type": "string",
	// 			"title": "Field Analysis", 
	// 			"enum": dropdownFields
	// 		}


	// 	},
	// 	"form": [
	// 		"*"
	// 	],
	// 	"value":{}
	// }
	
	
	// if(retrieveSquareParam(id,"Cs",false) !== undefined){
	// 	Cs = retrieveSquareParam(id,"Cs",false) 

	// 	if(Cs['x_field']){
	// 		jsonform.value['x_field'] = Cs['x_field']
	// 	}



		
	// }

	// $(targetDiv).jsonForm(jsonform)

}


async function elastic_populate_tsne(id){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	var thisIndex = "*"

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]

	var fields = []
	// var thisCs = retrieveSquareParam(id,"Cs",true)
	// fields.push(thisCs['x_field'])
	

	var limit = 1;
	var stats = false
	var statField = null
	var incTime = true
	var urlencode = false
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	// var handle = retrieveSquareParam(id, 'CH')
	// elastic_connector(connectors.handletox(handle, "dst"), connectors.handletox(handle, 'indexPattern'), id, query, "");
	
	var promises = [id]
	var handle = retrieveSquareParam(id, 'CH')

	// query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)


	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		false,
		"",
		true,
		maxAccuracy,
		fields, 
		stats, 
		statField	
	)



	promises.push(elastic_connector(thisDst, thisIndex, id, query, "all") )
	
	return Promise.all(promises)



}


function elastic_rawtoprocessed_tsne(id, data){

	

	var data = data[0]['data']['aggregations']['time_ranges']['buckets']

	return [
		[69.17246,34.528887,"Kabul",4634.875,4],
		[19.81889,41.3275,"Tiran",453.509,8],
		[65.71013,31.61332,"Kandahar",428.849,4]
		// [6.607293,36.354921,"Qacentina",427.085,12],
		// [2.831943,36.480781,"Blida",409.22,12],
		// [3.263,34.67279,"ElDjelfa",388.35,12],
		// [7.76667,36.9,"Annaba",351.556,12],
		// [62.19967,34.34817,"Herat",337.381,4],
		// [6.17414,35.55597,"Batna",307.101,12]
	]


}


function elastic_graph_tsne(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	//https://bl.ocks.org/Fil/972e78a78e3f3ceb81051cc649460bbf
	//https://bl.ocks.org/Fil/b07d09162377827f1b3e266c43de6d2a

	const squareContainerbob = workspaceDiv.selectAll('#square_container_'+id)
	const squarebob = squareContainerbob
		.append("xhtml:div") 
			.attr("id", function(d){ return "square_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)			
			.style("position", "relative")			
		.on("mousedown", function() { d3.event.stopPropagation(); })

	
    
     const margin = 10,
	 	height = document.getElementById("square_"+id).clientHeight - margin - margin,
	 	width  = document.getElementById("square_"+id).clientWidth - margin - margin,
        // scalepop = d3.scaleSqrt().domain([0, 10000]).range([0.2, 24]),
		scalepop = d3.scaleSqrt().domain([0, 1]).range([1, 2]),
        scalecountry = d3.scaleOrdinal(d3.schemeCategory20b),
        centerx = d3.scaleLinear()
			.range([width / 2 - height / 2 + margin, width / 2 + height / 2 - margin]),
		centery = d3.scaleLinear()
			.range([margin, height - margin]);


	const canvas = squarebob.append("canvas")
		.attr("width", width)
		.attr("height", height)
		.attr("transform",
			"translate(" + margin + "," + margin + ")");
	

	const model = new tsnejs.tSNE({
		dim: 2,
		perplexity: 30,
	});

	// initialize data with pairwise distances
	// const dists = data.map(d => data.map(e => d3.geoDistance(d, e)));

	// const dists = data.map(function(d){
	// 	data.map(function(e){
	// 		return d3.geoDistance(d, e)
	// 	})
	// })

	// dists = data.map(
	// 	a => data.map(
	// 	  b => distance(a.tags, b.tags) + Math.abs(a.score - b.score)/10
	// 	)
	//   );

	// const dists = data.map(
	// 	a => data.map(
	// 	  b => d3.geoDistance(a,b)
	// 	)
	// );
	  

	
	// //qq(data.map(a => data.map(b => d3.geoDistance(a, b))))
	// qq(data.map(a => data.map(b => a+"||"+b)))
	
	// qq("--")
	// qq(d3.geoDistance([53.3,-1.4],[51.5, 0.127]))

	// qq("--")

	// const dists = [[0,0.6804390148427758,0.07177915779665144,0.8740848875904706,0.9237498629238627,0.9285246546889949,0.8557651241596955,0.10039815295680171,0.8842071765299033],[0.6804390148427758,0,0.6579213425704871,0.19917930590293614,0.24523152707084359,0.25501834094275166,0.18036126461709995,0.5906614162213323,0.21163626541607125],[0.07177915779665144,0.6579213425704871,0,0.846095850672721,0.8971801766681498,0.8992829738396363,0.8282262496484192,0.07013204607922327,0.8551963774542366],[0.8740848875904706,0.19917930590293614,0.846095850672721,0,0.053066184041216546,0.055844330548634885,0.018820409965588578,0.7810206810883502,0.015227994872947617],[0.9237498629238629,0.24523152707084364,0.8971801766681498,0.053066184041216546,0,0.03214307946228972,0.06944185676751823,0.8315825448698154,0.049862027546167205],[0.9285246546889949,0.25501834094275166,0.8992829738396362,0.055844330548634906,0.03214307946228966,0,0.07466473910752708,0.8347872252263449,0.04432603132330135],[0.8557651241596955,0.1803612646171,0.8282262496484192,0.018820409965588602,0.06944185676751823,0.07466473910752708,0,0.7629502525516668,0.03244859953320923],[0.10039815295680173,0.5906614162213324,0.07013204607922326,0.7810206810883502,0.8315825448698154,0.8347872252263449,0.7629502525516668,0,0.7905616672795086],[0.8842071765299034,0.21163626541607122,0.8551963774542366,0.015227994872947608,0.04986202754616723,0.044326031323301346,0.03244859953320928,0.7905616672795086,0]]
	// const dists = [[0,0.6804390148427758,0.07177915779665144], [0.6804390148427758,0,0.6579213425704871], [0.07177915779665144,0.6579213425704871,0]]
	// const dists = [[0,0.6804390148427758,0.07177915779665144], [0.6804390148427758,0,0.6579213425704871], [0.07177915779665144,0.6579213425704871,0]]
	// const dists = [[0.2, 0.1, 0.2], [0.1, 1, 0.3], [0.2, 0.1, 1]]
	
	

	dists = []
	tmpcount = 50

	for (let i = 0; i < tmpcount; i++) {

		var tmp = []
		for (let j = 0; j <  tmpcount; j++) {

			tmp.push(Math.random(0,1))

		}
		dists.push(tmp)
	}



	qq(dists)

	model.initDataDist(dists);



	const forcetsne = d3.forceSimulation(
		data.map(d => (d.x = width / 2, d.y = height / 2, d))
	)
		.alphaDecay(0.005)
		.alpha(0.1)
		.force('tsne', function (alpha) {
			// every time you call this, solution gets better
			model.step();

			// Y is an array of 2-D points that you can plot
			let pos = model.getSolution();

			centerx.domain(d3.extent(pos.map(d => d[0])));
			centery.domain(d3.extent(pos.map(d => d[1])));

			data.forEach((d, i) => {
				d.x += alpha * (centerx(pos[i][0]) - d.x);
				d.y += alpha * (centery(pos[i][1]) - d.y);
			});
		})
		.force('collide', d3.forceCollide().radius(d => 1.5 + scalepop(d[3])))
		.on('tick', function () {

			let nodes = data.map((d, i) => {
				
				return {
					x: d.x,
					y: d.y,
					r: scalepop(d[3]),
					color: scalecountry(d[4]),
				};
			});

			draw(canvas, nodes);

		});

	function draw(canvas, nodes) {
		let context = canvas.node().getContext("2d");
		context.clearRect(0, 0, width, width);

		for (var i = 0, n = nodes.length; i < n; ++i) {
			var node = nodes[i];
			context.beginPath();
			context.moveTo(node.x, node.y);
			context.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
			context.lineWidth = 0.5;
			context.fillStyle = node.color;
			context.fill();
		}
	}


}

