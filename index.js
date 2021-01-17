if(GLB.useStrict){
	"use strict";
}
// SQUARES attributes 
// SQUARES attributes 
// Pr = Integer defining Pr square ID
// id = unique id of square
// Gt = String, taken from import_graphs()
// CH = Connection Handle, the name (not type) of the Connection (type can be inferred from this)
// Wi = Windows, array of int [window end (We), window size (Ws), window refresh (Wr)]
//		Note - We/Ws are epoch, and they do NOT carry the 000 for ms at the end.  If your API needs this, handle this in the specific JS files
//		Note - negative value = relative to Prs time frame.  e.g. "-900 seconds compared to Pr"
//		Note - 0 value = no change from Pr
//		Note - positive and < 31536000 = shift relative time forward
//		Note - positive and > 31536000 = absolute epoch, don't 
// 		[0] We = integer, Window end offset.  How many seconds difference the window ends compared to parent
// 		[1] Ws = integer, window size.  Size of the window relative to Window End
//		[2] Wr = integer, window refresh.  Helps the auto updater know how often to bring the window forward
//			e.g. "a 15 minute window, originally ending 1 hour ago, but every 5 minutes bring it forward by 5 mintes".  
// Ds = Data subset. each connection type may implement these in different formats (array, regex, object, etc)
// Gp = String with parameters the graph may choose to use (optional)
// Sc = Scale
// Hx = Hex colour, a way of marking/highlighting on demand, not implemented


// Alertify function 
function reset () {
	$("#toggleCSS").attr("href", "./alertify.js-0.3.11/themes/alertify.default.css");
	alertify.set({
		labels : {
			ok     : "OK",
			cancel : "Cancel"
		},
		delay : 5000,
		buttonReverse : false,
		buttonFocus   : "ok"
	});
}
	


var workspace = {
	// stores the size/location of the SVG workspace used by D3
	// specifically using a closure for async functions
	// x:  0,
	// y: 0,
	// scale: 1,
	getx: function() {
		// return this.x;
	},
	setx: function(newx) {
		// this.x = newx;
	},
	gety: function() {
		// return this.y;
	},
	sety: function(newy) {
		// this.y = newy;
	},
	getScale: function() {
		// return this.scale;
	},
	setScale: function(newScale) {
		// this.scale = newScale;
	}

};

var graphs_jsfiles_json = {
	// used to store JS files thar are dynamically loaded
	// {"apache":["./file1.js", ... ], 
	local_json: {},
	get_graphs_json: function(){
		return this.local_json;	
	},
	set_graphs_json: function(new_graphs_json){
		this.local_json = new_graphs_json;
	}
}

// graphs_functions_json.retrieveGraphParam
var graphs_functions_json = {
	// the structure of all functions used by dynamically loaded graphs
	// {"piechart source":{"populate":"funcname", ...}
	local_json: {},
	get_graphs_json: function(){
		return this.local_json;	
	},
	add_graphs_json: function(new_graphs_json){
		// merge new JSON into exiting one
		// local_json takes priority if duplication
		this.local_json = $.extend(true,new_graphs_json, this.local_json);
	},
	retrieveGraphParam: function(type, graphshort, value){
		// IN : type of connector, <short> name of the graph, the type of field you want back
		// OUT : name of function to call
		////ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"['"+type+"']['"+graphshort+"']['"+value+"']");


		if(graphshort === null || this.local_json["builtin_graphs"] === undefined){
			// no graph set, so relax
			return null;
		}else if(typeof this.local_json["builtin_graphs"][graphshort] !== 'undefined'){
			// see if you are using a builtin_graph
			// XXX this interceptions seems a cheap workaround, better way to detect?
			return this.local_json["builtin_graphs"][graphshort][value];
		}else if(typeof this.local_json[type][graphshort][value] !== null){
			// see if you are using a specific graph
			return this.local_json[type][graphshort][value];
		}else{
			ww(0, "graphs_functions_json.retrieveGraphParam, <value> does not exist");
			return false;
		}

	},
	namesToDropdown: function(id){
		// IN : id of square, that we calculate the Connector Type, then find functions for that Connector
		// resolve order = id -> CK -> type -> short names -> dropdown
		$("#systemgraphshere").empty();
		$("#connectorgraphshere").empty();


		//
		var mySelect = $('#connectorgraphshere');
		mySelect.append(
			$('<option></option>').val("-").html("--Connector Graphs--")
		);

		// find the graphs specific to this Connector tyep
		connector_type = connectors.handletotype( retrieveSquareParam(id, 'CK') );
		ww(4, "connector_type for "+id+" found as:"+connector_type+" toshortnamelist:"+graphs_functions_json.typeToShortnameList(connector_type));
		$.each(graphs_functions_json.typeToShortnameList(connector_type), function(i, v){
			mySelect.append(
				$('<option></option>').val(v).html(v)
			);
			
		});


	},
	typeToShortnameList: function(type){
		// IN: string of type e.g. "apache"
		// OUT : array of graphs names, in files declared in graphs.json
		var toreturn = [];
		$.each(this.local_json[type], function (k, v){
			toreturn.push(k);
		});
		return toreturn.sort();
	},

}


// connectors.handletotype
var connectors = {
	// store maintain object of connections (//ip:port) and all the Indexes known at that location
	
	connectors: [],
	get_connectors: function(){
		return this.connectors;	
	},	
	
	add_connector: function(new_connector){
		// check if Connector is valid JSON, error if not
		if(new_connector.hasOwnProperty("status") && new_connector.status == "errorLoading"){
			ww(2, "Error: Loading "+new_connector.key+", permissions or invalid JSON");
			udpateScreenLog("Error: Loading "+new_connector.key+" ");
		}else{
			this.connectors.push(new_connector);
		}
	},


	handletox: function(handle, x){
		// ee(" -> "+arguments.callee.name+"(handle:"+handle+", x:"+x+")"); 
		var toReturn = null;
		
		// is the attribute specific to the index, or generic to the connector
		
		if(x === "indexDesc" || x === "indexPattern"|| x === "favourites"){
			var justIndices = _.flatten(_.pluck(this.connectors, 'indices'), true)
			if(_.where(justIndices, {'handle': handle}).length > 0){
				toReturn = _.where(justIndices, {'handle': handle})[0][x]
			}else{
				toReturn = null;
			}
			//return toReturn[x]
			
		}else{
			_.each(this.connectors, function(connector){
				if(	_.where(connector['indices'], {'handle': handle}).length > 0){
					toReturn = connector[x]
				}
			})
		}
		return toReturn
	},
	
	indexPatterntox: function(indexPattern, x){
		// ee(" -> "+arguments.callee.name+"(handle:"+handle+", x:"+x+")"); 
		var toReturn = null;
		
		// is the attribute specific to the index, or generic to the connector
		
		if(x === "handle" || x === "indexDesc"|| x === "favourites"){
			var justIndices = _.flatten(_.pluck(this.connectors, 'indices'), true)
			if(_.where(justIndices, {'indexPattern': indexPattern}).length > 0){
				toReturn = _.where(justIndices, {'indexPattern': indexPattern})[0][x]
			}else{
				toReturn = null;
			}
			
			
		}else{
			_.each(this.connectors, function(connector){
				if(	_.where(connector['indices'], {'indexPattern': indexPattern}).length > 0){
					toReturn = connector[x]
				}
			})
		}
		return toReturn
	},

	// keytox: function(key, x){

	// 	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"(index:"+key+", x:"+x+")"); 

	// 	var toReturn = null;

	// 	_.each(this.connectors, function(connector){
	// 		if(key === connector['key']){
	// 			toReturn = connector[x]
	// 		}
	// 	})

	// 	return toReturn
	// },

	// Connector is the destination of the server e.g. 192.168.1.1:9200
	setConnectorAttribute: function(handle, key, value){
		// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"(handle:"+handle+", key:"+key+", value:"+value+")"); 

		_.each(this.connectors, function(connector){
			_.each(connector['indices'], function(index){
				if(index['handle'] === handle){
					ww(5, "Updating key:"+key+" for:"+connector['key']);
					
					connector[key] = value
				}
			})
		})
	},

	// handle is the index at that connector e.g. "index:ids"
	setHandleAttribute: function(handle, key, value){
		// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"(handle:"+handle+", key:"+key+", value:"+value+")"); 

		_.each(this.connectors, function(connector){
			_.each(connector['indices'], function(index){
				if(index['handle'] === handle){
					ww(5, "Updating key:"+key+" for:"+handle);
					index[key] = value
				}
			})
		})
	},
	


	// patterntox: function(indexPattern, x){
	// 	// ee(" -> "+arguments.callee.name+"(indexPattern:"+indexPattern+", x:"+x+")"); 
	// 	var toReturn = null;
		
	// 	// is the attribute specific to the index, or generic to the connector
		
	// 	if(x === "handle" ){
			
	// 		var justIndices = _.flatten(_.pluck(this.connectors, 'indices'), true)
	// 		if(_.where(justIndices, {'indexPattern': indexPattern}).length > 0){
	// 			toReturn = _.where(justIndices, {'indexPattern': indexPattern})[0][x]
	// 		}
			
			
	// 	}
	// 	return toReturn
	// },

}
	



function updateurl(){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");

	var existingUrl = window.location
	var newUrl = existingUrl.protocol + "//" + existingUrl.hostname + ":" + existingUrl.port + existingUrl.pathname + "#" + btoa(JSON.stringify(url))

	window.history.pushState("object or string", "Title", newUrl);
	// // $('#mailto').attr("href", "mailto:?subject=SQUARES-UI Link"+"&body="+newurl);
	
}	
	
function updaterefresh(){
	// //ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	var newurl = window.location.href.replace(/\/#.*$/, "/#"+btoa(JSON.stringify(url)));
	//location.replace(newurl);
	window.history.pushState("object or string", "Title", newurl);
}

function wipereset(){
	// //ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	deleteAllStoredData()


	// currentLocation = window.location
	// url = currentLocation.protocol + "//" + currentLocation.hostname + ":" + currentLocation.port + currentLocation.pathname + "#" + btoa('{"squares":[],"Zt":""}')

	// $(location).attr('href',url);

	// addGraphConnector()
	// //window.location.reload()

	url = {}
	url.v = "1"
	url.squares =  []
	url.Zt = "translate(431,311) scale(0.5)"

	updateurl()
	
	initialLoad()

	addGraphConnector(null);
	window.location.reload()

}
		

var squareEdited = 0;
var re_str = /^[\w =+\/]+$/;
var re_int = /^[\d ]+$/;

// d3 vars,  declared outside a function
var workspaceDiv;
var squaregroup;
var locPage = [];
var zoomPage;
var zoomSquare;
var wasMoved  =false;
var screenLog = [];

var container;

var mouse;
var threeRenderer
var db;


var url = {}
var masterMappings = {}

// error status is a state, not a config, so store it here, and not in URL square definition
var errorStatus = {}
errorStatus['page'] = {"critical":[], "warning":[]}
errorStatus['squares'] = {} // {1: {"critical":[], "warning":[]}, 2:{}}

var linesgroup

///// Do we already have an object to build from?
var hash




//******************************************************************
//******************************************************************
//*********   User invoked Activity
//******************************************************************
//******************************************************************



function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
}



function dragged(d) {
	// for individual squares, not entire workspace
	// even a click registers as a drag, so check dx/dy (differnce in x/y) to see if movement took place
	// event.dx isn't the total move dist, it's the move per frame/step

	if(Math.abs(d3.event.dx) > GLB.square.dragSensitivity || Math.abs(d3.event.dy) > GLB.square.dragSensitivity){
		var wasMoved = true;

		deleteLines();

		// the X/Y are positions on the monitors X/Y, but also relative to the parent coords, which is relative to the d3 translation, which is affected by the zooom/scale	
		var newcoords = d3.mouse(d3.select('#squaregroup').node());
		d3.select(this.parentNode.parentNode.parentNode.parentNode)
			.attr("x", function(d,i){
				var strippedName = parseInt(this.id.replace(/^square_main_/g,""));
				var parentId = url.squares[squarearraysearch(strippedName)].Pr;
				d.x = snapToGrid(newcoords[0]-calcCord(parentId, 'x', 0));
			})
			.attr("y", function(d,i){
				var strippedName = parseInt(this.id.replace(/^square_main_/g,""));
				var parentId = url.squares[squarearraysearch(strippedName)].Pr;
				d.y = snapToGrid(newcoords[1]-calcCord(parentId, 'y', 0));
			});

		/// for every frame, just redraw local square
		var ids = [d.id];	
		var redrawList = new Array();
		redrawList.push(d.id);
		var loop = true; // XXX must be a way to while(findChildren(id)>0){

		// Keep looping until no new children are found
		while(loop===true){
			var newList = findChildren(redrawList);
			$.merge(redrawList, newList);
			if(newList.length<1){
				loop=false;
			}
		}
		drawLines(redrawList, true);
		drawSquares(redrawList);	
	}
}



function dragended(d) {

	// could trim this to just children squares? 
	var squaresToUpdate = findAllChildren(d.id);
	squaresToUpdate.push(d.id);
	drawLines(squaresToUpdate, false);
	drawSquares(squaresToUpdate);
	drawinBoxes(squaresToUpdate);
	updateurl();



}



// Display the Template Overlay
function showTemplateDiv(id){
	// IN : square ID
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	clearSquareBody(id);
	window[graphs_functions_json.retrieveGraphParam("builtin_graphs", "Templates", "graph") ](id);
	

}

// Duplicate a square when requested
function duplicateSquare(id, newObject){
	// IN : Integer
	// .extend clones the object, rather than linking to it
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+JSON.stringify(newObject)+")");

	// clone the original
	var clone = jQuery.extend({}, url.squares[squarearraysearch(id)]);

	// empty the criteria, so we inherit our details from above
	delete clone.CH;
	delete clone.Gt;
	delete clone.Gp;
	delete clone.Wi;
	delete clone.Ds;
	delete clone.Cs;
	delete clone.Fi;

	clone.Pr = id;
		
	// merge in the custom fields
	if(newObject.constructor === Object && Object.keys(newObject).length !== 0 ){
		// clone, and make the newObject take priority if a clash? is this wise?
		ww(7, "duplicateSquare() merging with preset ("+JSON.stringify(newObject)+")passed Object");
		clone = $.extend(true, clone, newObject);  

	}

	newID = newSquare(clone);
	
	udpateScreenLog("#"+newID+" Connector has been created");
	drawSquares([newID]);
	drawLines([newID], false);
	drawinBoxes([newID]);
	drawLines(everyID(), false);  //line colours have changed
	udpateScreenLog("#"+clone.id+" Created");
	updateurl();
	
	return clone.id;

}
	

function addGraphConnector(handle){
	// handle : optional, "CH" from the connector json

	// in UTC
	var thisEpoch = Math.floor(new Date().getTime() / 1000); // UTC
	var lastBlockEnd = thisEpoch - (thisEpoch % GLB.square.blocksize)-1; 

	var mo = {
		
		"Pr":0,
		"Gt":"EditSquare",
		"Gp": null,
		"Wi": [lastBlockEnd,-900,0],
	}

	if(handle){
		mo['CH'] = handle
	}

	newID = newSquare(mo);

	udpateScreenLog("#"+newID+" Connector has been created");
	drawSquares([newID]);
	drawLines([newID], false);
	drawinBoxes([newID]);
	drawLines(everyID(), false);  //line colours have changed
	udpateScreenLog("#"+clone.id+" Created");
	updateurl();
	
}


function panzoom(){
	//https://gist.github.com/mootari/64ff2d2b0b68c7e1ae6c6475f1015e1c


	//perform the pan zoom
	var box = workspaceDiv.select('#squaregroup').node().getBBox();
	var scale = Math.min(window.innerWidth / box.width, window.innerHeight / box.height);

	// Reset transform.
	var transform = d3.zoomIdentity;
	// Center [0, 0].
	transform = transform.translate(window.innerWidth / 2, window.innerHeight / 2);
	// Apply scale.
	transform = transform.scale(scale);
	// Center elements.
	transform = transform.translate(-box.x - box.width / 2, -box.y - box.height / 2);
	zoom.transform(squaregroup, transform);

	
	// XXX need to update URL, otherwise first drag moves around

}
	
function newSquare(obj){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(obj)+")");

	// clean out it's data


	var newID = highestSquareID()+1
	obj['id'] = newID
	
	var relX = (obj['x'] == null ) ? 400 : obj['x']
	var relY = (obj['y'] == null ) ? 800 : obj['y']

	
	// if matches after 100, just place on top
	for (var i = 0; i <= 100; i++){
		
		var clash = false

		for (var tmpId in url.squares){
			var loopX = calcCord(url.squares[tmpId].id, 'x', 0)
			var loopY = calcCord(url.squares[tmpId].id, 'y', 0)
			var newX = calcCord(obj['Pr'], 'x', relX)
			var newY = calcCord(obj['Pr'], 'y', relY)
			if(loopX === newX && loopY === newY ){
				qq("new square location used")
				clash = true
			}
		}	

		// if(isRelativePosTaken(obj['Pr'], relX, relY) === true){
		if(clash === true){
			qq(relX+":"+relY+"  taken, increasing")
			relX += 100
			relY += 100
		}else{
			qq(relX+":"+relY+"  not taken, using")
			i = 101
		}

	}
	obj['x'] = relX
	obj['y'] = relY

	url.squares.push(obj)

	return obj['id']
}



//******************************************************************
//******************************************************************
//*********   Main workflow 
//******************************************************************
//******************************************************************	

function deleteLines(){
	d3.selectAll(".squarekey_all").remove();
	d3.selectAll(".path_all").remove();
	d3.selectAll(".bezier_dot").remove();
	d3.selectAll(".bezier_line").remove();
}

function futureHalfHeight(id){
	// XXX redner a square on page load, then measure it?
	// XXX do that for each square css class?
	return 500;
}
function futureHalfWidth(id){
	return 500;
}



// Delets
function drawLines(ids, drawBezier){
	
	// IN : Array of integers
	////ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");

	deleteLines();

	var lines = d3.select("#linegroup")
	.selectAll(".path_all")
    	.data(url.squares)
	.enter();

	lines.append("path")
		.attr("id", function(d){ return "path"+d.id})
		.attr("class",  function(d){ return getLineCol(d.id)})
		.attr("d", function(d){ 

			// http://blogs.sitepointstatic.com/examples/tech/svg-curves/cubic-curve.html
			var myRelX = calcCord(d.id, 'x', 0);
			var myRelY = calcCord(d.id, 'y', 0);
			var myBendX = 0;
			var myBendY = 0;
			var prBendX = 0;
			var prBendY = 0;
			if(retrieveSquareParam(d.id, "Pr") === 0){
				var prRelX = calcCord(d.id, 'x', 0);
				var prRelY = calcCord(d.id, 'y', 0);
			}else{
				var prRelX = calcCord(retrieveSquareParam(d.id, "Pr"), 'x', 0);
				var prRelY = calcCord(retrieveSquareParam(d.id, "Pr"), 'y', 0);
			}	
			var bendX = 0.4;
			var bendY = 0.1
			myBendX = myRelX - ((myRelX -prRelX)* bendX);
			myBendY = myRelY - ((myRelY -prRelY)* bendY);
			prBendX = prRelX + ((myRelX -prRelX)* bendX);
			prBendY = prRelY + ((myRelY -prRelY)* bendY);

			if(GLB.drawLineBezier===true && drawBezier===true && d.Pr!=0){
				//draw the dots for bezier curve
				// I suppose this could be done in it's own ".append", but then all the abve maths needs doing again?
				squaregroup
					.append("line")
					.classed("bezier_line", "true")
					.attr("x1", myRelX).attr("y1", myRelY).attr("x2", myBendX).attr("y2", myBendY)
				// squaregroup
				// 	.append("circle")
				// 	.classed("bezier_dot", "true")
				// 	.attr("r", 25)
				// 	.attr("cx", myBendX).attr("cy", myBendY)
				
				squaregroup
					.append("line")
					.classed("bezier_line", "true")
					.attr("x1", prBendX).attr("y1", prBendY).attr("x2", prRelX).attr("y2", prRelY)
				// squaregroup
				// 	.append("circle")
				// 	.classed("bezier_dot", "true")
				// 	.attr("r", 25)
				// 	.attr("cx", prBendX).attr("cy", prBendY)
			}

			return "M"+myRelX+","+myRelY+" C"+myBendX+","+myBendY+" "+prBendX+","+prBendY+" "+prRelX+","+prRelY
		})
		.classed("path_all", true)

	
	var lineFoWidth	= 350
	
	var linesfo = lines.append("foreignObject")
	.classed("squarekey_all", true)	
		.attr("x", function(d){
			var myRelX = calcCord(d.id, 'x', 0);
			if(retrieveSquareParam(d.id, "Pr") === 0){
				var prRelX = calcCord(d.id, 'x', 0);
			}else{
				var prRelX = calcCord(retrieveSquareParam(d.id, "Pr"), 'x', 0);
			}	
			return (prRelX + myRelX)/2 - (lineFoWidth/2)
		})
		.attr("y", function(d){
			var myRelY = calcCord(d.id, 'y', 0);
			if(retrieveSquareParam(d.id, "Pr") === 0){
				var prRelY = calcCord(d.id, 'y', 0);
			}else{
				var prRelY = calcCord(retrieveSquareParam(d.id, "Pr"), 'y', 0);
			}	
			return (prRelY + myRelY)/2
		})
		.attr("width", lineFoWidth)
		.attr("height", "30")

	var linesfodiv = linesfo.append("xhtml:div")
		.attr("id", function(d){ return "square_lineskey_"+d.id })
		
		linesfodiv.append("div")
			.style("text-align", "center")
			.text(function(d){ 
				var textOut = []
				
				handle = retrieveSquareParam(d.id, "CH", false)
				
				if(handle){
					textOut.push(handle)
				}

				var text = retrieveSquareParam(d.id, 'Ds', false)
				if(text !== undefined){
					
					out = []

					//obj = _.values(JSON.parse(atob(retrieveSquareParam(d.id, 'Ds', false))))
					obj = JSON.parse(atob(retrieveSquareParam(d.id, 'Ds', false)))
					
					_.each(obj['compare'], function(obj,i){
						textOut.push(_.values(obj)[0])
					})

					// out = out.join(", ")

					// return out
				}

				var filter = retrieveSquareParam(d.id,"Fi",false)
				if(filter !== undefined){
					// best effort to tidy it up
					stripped = filter.replace(/.*'].value./,'')
					textOut.push(stripped)
				}


				return textOut.join(", ")
			})
			.on("click", function(d){
				alert(atob(retrieveSquareParam(d.id, 'Ds')))
			})

};


function squareMouseOver(d, i){
	// Hide all square menus if you want a cleaner interface?
	if(GLB.hidesquaremenus === true){
			$(".square_menu").removeClass("menu_invisible");
	}
}
function squareMouseOut(d, i){
	if(GLB.hidesquaremenus === true){
		$(".square_menu").addClass("menu_invisible");
	}
}



// Draw the *container* for each Square
function drawSquares(idlist) {
	// IN : Array of integers
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(idlist)+")");

	
	for (var i in idlist){
		squaregroup.select("#square_main_"+idlist[i]).remove();
	}

	// retrieve small subset of squares
	var subset = subSet(idlist);

	// create the new square_main
	// set newsquare so that the Fore knows who to redraw, clear this at the end
	var wrapper = squaregroup.selectAll("#squaregroup")
		.data(subset)
	.enter().append("g")
		.attr("id", function(d){ return "square_main_"+ d.id })
		.classed("square_main", true)
		.classed("newsquare", true)  //tmp market, don't remove

	// foreign object = XML inside a SVG tag
	// get box-shadow colour first...

	var foreignObject = workspaceDiv.selectAll('.newsquare')
		.append("foreignObject")
		.classed("square_foreignObject", true)
		.attr("id", function(d){ return "foreignObject_"+d.id })
	        .on("mouseover", squareMouseOver)
			.on("mouseout", squareMouseOut)
			.attr("transform", "scale(0.8)")
			.on("dblclick.zoom", function() { d3.event.stopPropagation(); } )
			.on("mousewheel.zoom", function() { d3.event.stopPropagation(); })
			.on("DOMMouseScroll.zoom", function() { d3.event.stopPropagation(); })
			.style("height", function(d){
				return (document.getElementById("foreignObject_"+d.id).clientHeight * retrieveSquareParam(d.id, "Sc") );
			})
			.style("width", function(d){
				return (document.getElementById("foreignObject_"+d.id).clientWidth * retrieveSquareParam(d.id, "Sc") );
			})

	var square_container = foreignObject
		.append("xhtml:div")
		.attr("id", function(d){ return "square_container_"+d.id })
		.classed("square_container", true)
		.classed("shine", true)
		


		var menubarcontrols = square_container.append("xhtml:div")
			.classed("square_menu_icons", true)
			.classed("square_menu", true)

			// Clone
			var clone = menubarcontrols.append("img")
				.attr("title", "Create Child Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_clone", true)
				.on("click", function(d){ 
					var newId = duplicateSquare(d.id, {"x": 1000}); 
					// editMe(newId); 
				})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;	

			// Info
			var info = menubarcontrols.append("img")
				.attr("title", "Query Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_info", true)
				.on("click", function(d){ graphAboutMe(d.id); })
				.on("mousedown", function() { d3.event.stopPropagation(); })
	        		// .on("mouseout", function(d){ drawinBoxes([d.id]) })
				;	

			// Edit
			var edit = menubarcontrols.append("img")
				.attr("title", "Edit Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_edit", true)
				.on("click", function(d){ editMe(d.id);  })
				.on("mousedown", function() { d3.event.stopPropagation();  })
				;	
			
			// Reload
			var reload = menubarcontrols.append("img")
				.attr("title", "Reload data and redraw Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_reload", true)
				.on("click", function(d){ reloadData([d.id])}  )
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;	
				

				

			// Move
			var move = menubarcontrols.append("img")
				.attr("title", "Drag square to move")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_move", true)
				.attr("id", function(d){ return "square_menu_move_"+d.id })
				.on("mousedown", function() { d3.event.stopPropagation(); })
					.call(drag)
				;	
				
				
			// Pivot to 
			var pivot = menubarcontrols.append("img")
				.attr("title", "Pivot to Kibana")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_pivot", true)
				.on("click", function(d){pivotToX(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				
				

			// Apply Template
			var template = menubarcontrols.append("img")
				.attr("title", "Cloning and Templates")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_template", true)
				.on("click", function(d){  showTemplateDiv(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

			// Apply scale
			var scale = menubarcontrols.append("img")
				.attr("title", "Scale up")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_scale", true)
				.on("click", function(d){scaleSquare(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

			// Bring "to top"
			var toBottom = menubarcontrols.append("img")
				.attr("title", "Order: Send to Bottom")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_tobottom", true)
				.on("click", function(d){ moveToBottom(d.id); })
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				
			
				
			// Status
			var status = menubarcontrols.append("img")
				.attr("title", "Status")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_status", true)
				// .classed("svg__colour__warning", true)
				// .classed("svg__colour__critical", true)
				.attr("id", function(d){ return "square_status_img_"+d.id })
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;					

			// Delete
			var deleteSquare = menubarcontrols.append("img")
				.attr("title", "Delete")	
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_delete", true)
				.on("click", function(d){
					if(findChildren([d.id]).length>0){
						alertify.confirm("Are you sure?", function (e) {
							if (e) {
								deleteChain(d.id, true);		
							}
						});
					}else{
						deleteChain(d.id, true);
					}
					
				})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;	
			


	// Inform user of Window End and Window Size
	var WeWs = square_container.append("xhtml:div")
		.classed("square_menu_WeWs", true)
		.classed("square_menu", true)
		.on("mousedown", function() { d3.event.stopPropagation(); })

			// Square ID
			var squareDivID = WeWs.append("div")
				.classed("square_menu_text", true)
				.classed("fsquare_menu_WeWs_id", "true")
				.text(function(d){ return "ID : #"+d.id })
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

			// Square Times
			var squareTimes = WeWs.append("div")
				.attr("id", function(d){ return "square_WeWs_"+d.id })
				.classed("square_menu_text", true)
				.classed("fsquare_menu_WeWs_times", "true")
				.text(function(d){ return "#"+d.id })
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

	// hover over info for any element
	var squareinfo = square_container.append("xhtml:div")
		.classed("square_menu_info", true)
		.classed("square_menu", true)
		.attr("id", function(d){ return "square_info_"+d.id })
				


	// move the square so that [0,0] is the middle, and not the corner
	squaregroup.selectAll(".newsquare")
		.attr("transform", function(d){
			
			var myX = -0.5 * document.getElementById("foreignObject_"+d.id).clientWidth;
			var myY = -0.5 * document.getElementById("foreignObject_"+d.id).clientHeight;
			
			// XXX MAGIC NUMBER ALERT.... why is this not 50% transform  ????
			// Meh, works for now (guilt)
			myX = -400;
			myY = -350;

			return "translate("+(calcCord(d.id, 'x', 0)+myX)+", "+(calcCord(d.id, 'y', 0)+myY)+")"
		})
	
	
	
	for (var i in idlist){
		//graphLoading(idlist[i]);
		
		graphGraphError(idlist[i], "Loading")	

	}



	// remove the marker for appending
	squaregroup.selectAll(".newsquare")
		.classed("newsquare", false)


}




//////////////////////////////
// status/error handling
//////////////////////////////

function addSquareStatus(id, status, tooltip){
	// the little heard icon for each square
	// this is handled in memory (not url) as it's temp, and shouldnt' be stored

	if(!errorStatus['squares'].hasOwnProperty(id)){
		errorStatus['squares'][id] = {"critical":[], "warning":[]}
	}

	errorStatus['squares'][id][status] = _.reject(errorStatus['squares'][id][status], function(singleTooltip){
		return tooltip === singleTooltip
	})
	errorStatus['squares'][id][status].push(tooltip)
	renderSquareStatus(id, status)
}

function removeSquareStatus(id, status, tooltip){
	
	// cycle through all statuses, and remove where string match
	errorStatus['squares'][id][status] = _.reject(errorStatus['squares'][id][status], function(singleTooltip){
		return tooltip === singleTooltip
	})
	renderSquareStatus(id, status)
}
function wipeSquareStatus(ids){
	
	// qq(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+")");
	
	if(!ids.isArray){
		ids = [ids]
	}

	_.each(ids, function(id){
		// ww(7, "wiping errorStatus for id:"+id)
		renderSquareStatus(id)
		delete errorStatus['squares'][id]
	})
	
}

function renderSquareStatus(id){

	// render can be called from general load, so might not have any issues logged for anything yet
	if(errorStatus['squares'].hasOwnProperty(id)){
		$('#square_status_img_'+id).removeClass("svg__colour__critical");
		$('#square_status_img_'+id).removeClass("svg__colour__warning");
		$('#square_status_img_'+id).removeClass("svg__colour__nofilter");

		var cssClass = ''
		if(errorStatus['squares'][id].hasOwnProperty('critical') && errorStatus['squares'][id]['critical'].length > 0){
			cssClass = "svg__colour__critical"
		}else if(errorStatus['squares'][id].hasOwnProperty('warning') && errorStatus['squares'][id]['warning'].length > 0){
			cssClass = "svg__colour__warning"
		}else{
			cssClass = "svg__colour__nofilter"
		}
		
		$('#square_status_img_'+id).addClass(cssClass)

		var tooltip = [errorStatus['squares'][id]['critical'].join(", "), errorStatus['squares'][id]['warning'].join(", ")].join(" | ")
		$('#square_status_img_'+id).prop('title', tooltip)
	}
	
}




function addPageStatus(status, tooltip){
	// status = critical, warning


	errorStatus['page'][status] = _.reject(errorStatus['page'][status], function(singleTooltip){
		return tooltip === singleTooltip
	})
	errorStatus['page'][status].push(tooltip)

	renderPageStatus(status)
}
function removePageStatus(status, tooltip){
	
	// cycle through all statuses, and remove where string match
	errorStatus['page'][status] = _.reject(errorStatus['page'][status], function(singleTooltip){
		return tooltip === singleTooltip
	})
	renderPageStatus(status)
}

function renderPageStatus(){

	$('#pageStatus').removeClass("svg__colour__critical");
	$('#pageStatus').removeClass("svg__colour__warning");
	$('#pageStatus').removeClass("svg__colour__nofilter");

	if(errorStatus['page']['critical'].length > 0){
		cssClass = "svg__colour__critical"
	}else if(errorStatus['page']['warning'].length > 0){
		cssClass = "svg__colour__warning"
	}else{
		cssClass = "svg__colour__nofilter"
	}
	
	$('#pageStatus').addClass(cssClass)

	tooltip = [errorStatus['page']['critical'].join(", "), errorStatus['page']['warning'].join(", ")].join(" | ")
	$('#pageStatus').prop('title', tooltip)

}

//////////////////////////////
// end of status/error handling
//////////////////////////////






function setHoverInfo(id, data){

	////ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+data+")");

	$("#square_info_"+id).html(data)
	$("#square_info_"+id).css('display', 'block')

	var localTimeout = GLB.square.hoverfade;
	setTimeout(
		function(localTimeout){
			$("#square_info_"+id).css('display', 'none')
			$("#square_info_"+id).html("")
		}, localTimeout);

}
function clearHoverInfo(id){
	
	var localTimeout = GLB.square.hoverfade;
	setTimeout(
		function(localTimeout){
			$("#square_info_"+id).css('display', 'none')
			$("#square_info_"+id).html("")
		}, 10);
}


function moveToBottom(id){
	// IN : integer
	// OUT : nothing
	
	// put square to the end of the square array
	url.squares.unshift( url.squares.splice( squarearraysearch(id) ,1)[0] ) ;

	// could be on top of anyone, so just redraw?
	drawSquares(everyID());
	drawinBoxes(everyID());
	
}


function scaleSquare(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// start with a default
	var currentScale = GLB.zoomLevels[0];
	
	if(typeof(url.squares[squarearraysearch(id)].Sc) === null){
		ww(6, "Scale found no existing scale for id:"+id);
		url.squares[squarearraysearch(id)].Sc = 1;
	}else if(typeof(url.squares[squarearraysearch(id)].Sc) != null && url.squares[squarearraysearch(id)].Sc > 0){
		currentScale = url.squares[squarearraysearch(id)].Sc
		ww(6, "Scale found for id:"+id+" as "+currentScale);
	}

	var newScale =  GLB.zoomLevels[GLB.zoomLevels.indexOf(currentScale)+1];
	ww(6, "Scale for id:"+id+" now "+newScale); 

	url.squares[squarearraysearch(id)].Sc = newScale;

	drawSquares([id]);	
	drawinBoxes([id]);
	updateurl();

}

// User has Loaded page/Dragged a box/Duplicated a box/Edited a square/other
async function drawinBoxes(ids){
	// IN : Array of Integers
	
	// ee(" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");

	// update the status icon
	// setSquareStatus(id, "normal")
	for (var i in ids){
		let id = ids[i]
		// qq("drawinBoxes("+id+")")

		renderSquareStatus(id)
	
		////// draw the bottom text

		//	var item = url.squares[squarearraysearch(ids[i])];
		var thisDate = new Date();
		var thisEpoch = Math.floor(thisDate.getTime() / 1000); 
		
		// keep times in epoch, but adjut for this user
		// no need to apply our timezone offset agaisnt thisWe, as moment already does that for us
		var thisWe = (calcGraphTime(id) );
		var thisWs = retrieveSquareParam(id, "Ws");
		var sInDay = 60*60*24;
		// draw the time frames at the bottom of the box
		var momentFormat = ''
		if(Math.abs(thisWe) > 21600 || thisWs > 21600 || Math.floor(thisEpoch / sInDay) > Math.floor(thisWe / sInDay)  ){
			// if a big window, or before today
			momentFormat = 'MMM ddd Do, HH:mm:ss';
		}else{
			momentFormat = 'ddd Do, HH:mm:ss'
		}
		// moment.unix().format will auto show it in local time format.
		// moment.unix().utc().format() to change
		var squareStart = moment.unix(thisWe + thisWs).format(momentFormat);	
		var squareDiff = countSeconds(thisWs);
		var squareEnd = moment.unix(thisWe).format(momentFormat);
		$("#square_WeWs_"+id).text(squareStart + " ( +"+squareDiff+" ) "+squareEnd);


		var theResult = await checkSavedDataIsMine(id)
		var theData = await getSavedData(id, "processed", "")

		if(theResult && theData && retrieveSquareParam(id, "Gt")!=="intro"){
			// Hash checks out, and data exists
			qq("drawinBoxes("+id+"): hash checks out and processed data exists")
			callTheGraph(id, true);

		}else{
			qq("drawinBoxes("+id+"): hash fail or no data")

			// delete all saved data, , get raw data, save it, raw_to_processed, save it,
			deleteStoredData([id])
			.catch(e => ww(0, e));
			
			//save new hash
			saveNewData(id, "hash", "", createSquareHash(id))
			.catch(e => ww(0, e));

			var thisGT = retrieveSquareParam(id, "Gt")
			var thisCH = retrieveSquareParam(id, 'CH', true)
			// var thisDst = connectors.handletox(thisCH, "dst")
			// var thisIndex = connectors.handletox(thisCH, 'indexPattern')
			
			

			// raw to processed
			window[graphs_functions_json.retrieveGraphParam(connectors.handletox ( thisCH, "type"), thisGT , "populate") ](id)
				.then(async function(values){
			
					var dataToProgess = false
					_.each(values, function(value){						
						if(value['data'] !== null){
							if(GLB.saveRawData == true){
								saveNewData(value.id, "raw", value.name, value.data)
							}
							dataToProgess = true

							if(value.hasOwnProperty("status") && value['status'].length > 0){
								addSquareStatus(id, "warning", value['status'])
							}
						}
					})
					
					// Does data exist?  Or maybe the graph requires no Promises (e.g. UpdateCountdown)
					if(dataToProgess || values.length==0){
						thisGT = retrieveSquareParam(id, "Gt")
						thisType = connectors.handletox( thisCH, "type")
						// qq("drawing '"+graphs_functions_json.retrieveGraphParam(thisType, thisGT , "rawtoprocessed")+"' for id:"+id)
						procData = await window[graphs_functions_json.retrieveGraphParam(thisType, thisGT , "rawtoprocessed") ](id, values)
						
						saveNewData(id, "processed", "", procData)
						.catch(e => ww(0, "saveNewData: id:"+id+"m, error:"+e));

						

						callTheGraph(id, true);
					}else{
						// Only report the issue of the first Promise error?  Better way to represent errors of each Promise?
						graphGraphError(id, values[0].error)
					}
				})


		}

	}
}


// Some data is ready, call the 'drawing function'
async function callTheGraph(id, nudgeChildren){
	// IN: Integer, Binary (whether to chase down all children and draw them too)
	// ee(" -> "+arguments.callee.name+"("+id+", "+nudgeChildren+")");
	clearSquareBody(id);


	// call the function that is defined as "graph" for the graph type of this square
	var theDynamicGraphFunction = graphs_functions_json.retrieveGraphParam(connectors.handletox ( retrieveSquareParam(id, 'CH'), "type"), retrieveSquareParam(id, "Gt") , "graph");
	
	//qq("for id:"+id+" graph type is "+theDynamicGraphFunction)

	if(theDynamicGraphFunction != null){
		// ok the graph names exists
		
		// qq("checking 3d: "+id)
		// qq(GLB.threejs.enabled)
		// qq(graphs_functions_json.retrieveGraphParam(connectors.handletox( retrieveSquareParam(id, 'CH'), "type"), retrieveSquareParam(id, "Gt") , "requireThreeJS"))
		// qq("checked 3d: "+id)

		if(graphs_functions_json.retrieveGraphParam(connectors.handletox( retrieveSquareParam(id, 'CH'), "type"), retrieveSquareParam(id, "Gt") , "requireThreeJS") == true && GLB.threejs.enabled == false){
			// ThreeJS not enabled in config file
			
			graphGraphError(id, "Square Type '"+retrieveSquareParam(id, "Gt")+"' requires ThreeJS enabling in config")
		
		}else{

			var savedData = await getSavedData(id, "processed", "")

			if(savedData != null){
				// qq("Now "+theDynamicGraphFunction+"("+id+")")
				clearSquareBody(id)
				window[theDynamicGraphFunction](id, savedData);
			}else{
				
				graphGraphError(id, "No Results")
				// qq("No Results id:"+id)
			}
		
		}

	}else{
		ww(0, "window["+theDynamicGraphFunction+"] not found for id:"+id);
	}	
	

	if(nudgeChildren === true){
		// Now look for children of mine that need new data to inherit
		var promptTheseChildren = findChildren([id]);
		//ww(6, "callTheGraph nudging for parent id:"+id+" children:"+JSON.stringify(promptTheseChildren));

		for (var i in promptTheseChildren){
			if(!( retrieveSquareParam(promptTheseChildren[i], "We") !=null 
				|| retrieveSquareParam(promptTheseChildren[i], "Ws") !=null 
				|| retrieveSquareParam(promptTheseChildren[i], "Gt") != null 
				|| retrieveSquareParam(promptTheseChildren[i], "Pb") !=null )
			){	
				// you appear to be the same as me, call your 'drawing function' too
				udpateScreenLog("#"+id+" rendering");
				callTheGraph(promptTheseChildren[i], true);
			}
		}
	}
}


function graphGraphError(id, msg, imagePath="./squares-ui-icons/159687-interface-icon-assets/png/cancel.png"){
	// ee(" -> graphGraphError ("+id+", "+msg+")");

	// this isn't a graph type "/graphs/builtin_graphs/error" as it's not permanent, e.g. shouldn't be saved in the URL on load.  It's a temp error

	// remove the "loading" div in a square
	clearSquareBody(id);

	// add a "no data" div to a square
	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
		.append("xhtml:div") 
		.attr("id", function(d){ return "square_error_"+d.id })
		.classed("box_binding", true)
		.classed("square_body", true)
		.classed("square_xhtml", true)
		.classed("square_dft_message", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });	

	var loadingImage = squareContainer.append("img")
		.attr("src",imagePath)
		.on("mousedown", function() { d3.event.stopPropagation(); })

	var square = squareContainer
		.append("div") 
			.attr("id", function(d){ return "square_error_"+d.id })
			.text(msg)
		.on("mousedown", function() { d3.event.stopPropagation(); });
	
}


function graphAboutMe(id){
	// AboutMe is a momentary thing and should redefine what the square is
	// so this is handled as a function, and not a graph type

	// remove the "loading" div in a square
	clearSquareBody(id);

	// add a "no data" div to a square
	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
			.attr("id", function(d){ return "square_error_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("square_dft_message", true)
		.on("mousedown", function() { d3.event.stopPropagation(); });
	var width = square.attr("width");

	var aboutMe = square.append("xhtml:div")
			.attr("id", function(d){ return "square_aboutme_"+d.id })
			.classed("square_aboutMe", "true")				
			.on("mousedown", function() { d3.event.stopPropagation(); })
				
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Square ID:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>#"+id+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");
	var squareLoc = squarearraysearch(id);
	
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Definition:</div");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+JSON.stringify(_.omit(url.squares[squareLoc], "Ds"))+"</div");
	$("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Coords (relative):</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>x"+retrieveSquareParam(id, 'x')+", y"+retrieveSquareParam(id, 'y')+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Coords (absolute):</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>x"+calcCord(id, 'x', 0)+", y"+calcCord(id, 'y', 0)+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Parent ID:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>#"+retrieveSquareParam(id, 'Pr')+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Graph Type:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>'"+retrieveSquareParam(id, 'Gt')+"'</div");
	// var desc = graphs_functions_json.retrieveGraphParam(connectors.handletox ( retrieveSquareParam(id, 'CH'), "type"), retrieveSquareParam(id, "Gt") , "about") ;
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+desc+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Window End:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+moment.unix(calcGraphTime(id)).format("MMM ddd Do, HH:mm:ss")+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");
	
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Window Size:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+countSeconds(retrieveSquareParam(id, "Ws"))+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");
	
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Parent Line Style:</div>");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>'"+getLineCol(id)+"'</div>");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header '>Data Subset: (including recursive from parents)</div>");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body '>"+JSON.stringify(clickObjectsToDataset(id))+"</div>");
	$("#square_aboutme_"+id).append("<div class='clr'></div>");
	

}


function clearSquareBody(id){

	// empty possible bodies, probably needs optimising
	// XXX standardise, accept an array not single number
	$("#square_"+id).remove();
	$("#square_holding_"+id).remove();
	$("#square_nodata_"+id).remove();
	$("#square_error_"+id).remove();

}






function udpateScreenLog(newMsg){

	if (document.location.href.indexOf('scripted_fields.html') === -1){ 

		// trim too many logs and add enw log
		if(screenLog.length>GLB.screenLogMax){
			screenLog.shift();
		}
		screenLog.push(newMsg);

		//update screenLog
		$("#screenLog").html(screenLog.join("<br>"));

		// scroll div to bottom
		$("#screenLog").scrollTop($("#screenLog")[0].scrollHeight);
	}
}



//******************************************************************
//******************************************************************
//*********   Supporting Function
//******************************************************************
//******************************************************************	


function cloneTemplate(caller, target){
	// Copy config from "dst_id" and copy to "src_id"
	/// IN : INT source ID, INT dest ID
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+caller+", "+target+")");

	// make caller = the full JSON of the square
	var caller =url.squares[squarearraysearch(caller)];

	delete caller.Gt;
	if(retrieveSquareParam(target, 'Gt') != null){
		
		caller.Gt = retrieveSquareParam(target, 'Gt')
	}
	
	
	delete caller.Cs;
	if(retrieveSquareParam(target, 'Cs') != null){
		qq("Cs not null from target")
		caller.Cs = retrieveSquareParam(target, 'Cs')
	}else{
		qq("Cs null from target")
		qq(retrieveSquareParam(target, 'Cs'))
		qq(typeof retrieveSquareParam(target, 'Cs'))
	}
	
	clearSquareBody(caller.id);
	drawSquares([caller.id])

	deleteStoredData([caller.id])
	.then(function(){
		drawinBoxes([caller.id])
	})

	//hideOverlay();
	updateurl();


}


function cloneChildren(caller, target){
	// Copy config from "dst_id" and copy to "src_id"
	// IN : INT source ID, INT dest ID
	// OUT : na
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+caller+", "+target+")");

	// for the calling square, remove existing children first?
	// if(removeChildren === true){
	deleteChain(caller, false);
	// }
	
	// pull out children ID into temp array and remove myself
	var clonesID = findAllChildren(target);
	qq("Children ID found to clone to me are "+clonesID)
	

	// create new fuller array from Children ID array
	var newArray = new Array();
	var sliceClone = JSON.parse(JSON.stringify(url.squares));  // array de referencing trick

	for(var i in clonesID){
		newArray.push(sliceClone.slice( squarearraysearch(clonesID[i]),(parseInt(squarearraysearch(clonesID[i]))+1) )[0]);
	}

	// update this array ready for merge to end of main array
	var tmpHighestSquareID = highestSquareID();
	for(var i in newArray){
		// update immediate children of target to now be children of caller
		if(newArray[i].Pr === target){
			newArray[i].Pr = caller;
		}else{
			newArray[i].Pr += tmpHighestSquareID;
		}
		newArray[i].id += tmpHighestSquareID;

	}
	ww(7, "array after changes"+JSON.stringify(newArray));


	// push new array into main URL
	url.squares = $.merge(url.squares, newArray);

	clearSquareBody(caller);
	drawLines(findAllChildren(caller), false);
	
	drawSquares([caller]);
	drawSquares(findAllChildren(caller));
	
	drawinBoxes([caller]);
	drawinBoxes(findAllChildren(caller));

	updateurl();
	
	// collapse empty spaces in array space? XXX
	// collapseSquares();
}


function importSquareFavourite(id, uid){
		
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+uid+")");

	var favourites = connectors.handletox(retrieveSquareParam(id, "CH", true), "favourites");

	// need to pass in uid and id
	var favourite = _.where(favourites, {"uid": uid})[0]
	
	// make caller = the full JSON of the square
	var square = url.squares[squarearraysearch(id)];

	delete square.Gt;
	if(favourite.Gt != null){
		qq("Setting GT")
		square.Gt = favourite.Gt
	}
		
	delete square.Cs;
	if(favourite.Cs != null){
		qq("Setting Cs")
		square.Cs = favourite.Cs
	}
	
	

	clearSquareBody(id);
	
	drawSquares([id])
	deleteStoredData([id])
	.then(function(){
		drawinBoxes([id])
	})
	

	updateurl();

}





function childFromClick(id, childCustomObject){
	//IN int of square that initiated.  OBJECT for us to use when creating the 			

	childID = duplicateSquare(id, childCustomObject)
	reloadData(findAllChildren(childID));
	return childID;

} 


// Update the variable each Square can modify
function updateSquareParam(id, param){
	// IN : Integer, String
	// NOTE : Each Square only has one variable, use object if needed?

	ww(6, "setting id:"+id+" Gp to "+param);
	url.squares[squarearraysearch(id)].Gp = param;

}
	
	
// Rounding function for snap-to-grid
function snapToGrid(val){
	// IN : Integer (x or y position)
	// OUT : Integer
	
	return (GLB.square.snaptogrid * Math.round(val/GLB.square.snaptogrid));
}


function getLineCol(id){

// Workout the colour of a link
	// IN : Integer
	
	// Black lines mean same time/graph type
	// Orange lines for change of time
	// Blue lines for change of PB

//	item = url.squares[squarearraysearch(id)];
	
	if( retrieveSquareParam(id, 'We') != null ){
		// Time not null);
		return "line_colour_one";
	}else if( retrieveSquareParam(id, 'Ds') != null ){
		// DataSet not null
		return "line_colour_two";
	}else if( retrieveSquareParam(id, 'Gt') !=""){  
		// Graph type has changed
		return "line_colour_three";
	}else{
		// panis
		return "line_colour_four";
	}	

}

// Give me an ID, I'll return it's array position
function squarearraysearch(id){
	// IN : Integer of ID
	// OUT : Integer location of ID in main array
	for(var i in url.squares){
		if (url.squares[i].id===id){
			return i;
		}
	}
	return 0;
}

// 
function subSet(ids){
	// IN : Array if Integers of IDs
	// OUT : Array of complete Squares for the IDs
	
	var newsubset = []
	for (var i in ids){
		newsubset.push(url.squares[squarearraysearch(ids[i])])
	}
	return newsubset;
}

// If bad data or auto updating, reload a Square's data
function reloadData(ids){
	// IN : Integer

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");
	
	wipeSquareStatus(ids)

	for (var i in ids){
		let leti = ids[i]
		// ww(6, "Reloading / refreshing data for id:"+ids[i]+" as instructd by "+arguments.callee.caller.name);
		if(GLB.square.reshowLoadingIcon === true){
			graphGraphError(leti, "Loading")	
		}
		deleteStoredData([leti])
		.then(function(){
			drawinBoxes([leti])
		})
	
	}	
	

	// start the data calculating
	
}






// Delete a Square and all it's children
function deleteChain(id, deleteID){
	// IN : Integer of ID to look at.  
	// IN : BOOL whether to delete this ID (true), or just it's children (false)
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 
	
	// delete the children
	var deleteList = findAllChildren(id);
	for (var i = 0; i < deleteList.length ; i++){
		deleteChildSquare(deleteList[i]);
	}
	
	if(deleteID === true){
		// delete myself
		deleteChildSquare(id);
	}
	
	drawLines(everyID(), false);
	updateurl();
	
}

function deleteChildSquare(id){
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 

	// ww(7, "deleting id="+id);

	
	url.squares.splice(squarearraysearch(id), 1);
	workspaceDiv.select("#square_main_"+id).remove();
	deleteStoredData([id]);
	squaregroup.select("#line_"+id).remove();
	
	udpateScreenLog("#"+id+" Deleted");
}


// recursive 
function findParents(id){
	// IN : int
	// OUT : array of parents
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 

	var currentID = id;
	var newParent=0;
	var parents = [];

	while (1===1){
		newParent = retrieveSquareParam(currentID, "Pr");
		if(newParent != 0){
			parents.push(newParent);
			currentID = newParent;	
		}else{
			break;
		}
	}
	
	// reverse as I want highest ID first, like a family tree
	return parents.reverse();	
}


// Single level lookup for objects that identify their Pr as that of the lookup target
function findChildren(findList){
	// IN : Array of Integers (IDs)
	// OUT : Array of Integers (combined children IDs)
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(findList)+")"); 
	var children = new Array()
	for (var i in url.squares){
		// check if not looking at myself
		if(findList.indexOf(url.squares[i].id) === -1){
			if(findList.indexOf(retrieveSquareParam(url.squares[i].id, 'Pr'))> -1){
				children.push(url.squares[i].id);
			}
    	}    
	}
	// ww(7, "findChildren() found "+JSON.stringify(children));
	return children;
}

function findAllChildren(id){
	// IN : single ID
	// OUT : Array of Integers (combined children IDs), originating ID *NOT* in the return

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")"); 
	var returnList = new Array();
	returnList.push(id);

	var loop = true;
	while(loop===true){
		var newList = findChildren(returnList);
		$.merge(returnList, newList);
		if(newList.length<1){
			loop=false;
		}
	}

	var index = returnList.indexOf(id);
	if (index > -1) {
		returnList.splice(index, 1);
	}

	if(returnList.length!=0){
		ww(6, "findAllChildren found "+JSON.stringify(returnList));
	}
	return returnList;
}




//******************************************************************
//******************************************************************
//*********   Saved data management
//******************************************************************
//******************************************************************	


async function checkSavedDataIsMine(id){
	var myHash = createSquareHash(id)
	var hashForData = await getSavedData(id, "hash", "")

	if (myHash !== hashForData){
		return false
	}else{                
		return true
	}
	
}

var getSavedData = Dexie.async(function* (id, keyType, keyName) {
	// ee("getSavedData ("+id+", "+keyType+", "+keyName+")"); 
	try {
		var bob = yield db.squares.get({squareid: id, keyType: keyType, keyName: keyName})
		if(bob && bob.hasOwnProperty("data")){
			return bob['data']
		}else{
			return null
		}

	} catch (error) {
		qq("XXXX getSavedData :"+error);
	}

})


var saveNewData = Dexie.async(function* (id, keyType, keyName, value) {	
	// qq("Saving: "+id+", "+keyType+":~"+roughSizeOfObject(value)+"Bytes")

	try {
		yield db.squares.put({squareid: id, keyType: keyType, keyName:keyName, data: value})                
	} catch (error) {
		qq("XXXX saveNewData :"+error);
	}

})




var deleteSavedData = Dexie.async(function* (id, keyType, keyName) {
	// ee("deleteSavedData ("+id+", "+keyType+")"); 
	try {
		yield db.squares.get({squareid: id, keyType: keyType, keyName: keyName})
	} catch (error) {
		qq("XXXX deleteSavedData :"+error);
	}
})


var deleteStoredData = Dexie.async(function* (ids) {
	// ee("deleteStoredData ("+JSON.stringify(ids)+")"); 
	try {
		yield db.squares.where('squareid').anyOf(ids).delete()
	} catch (error) {
		// qq("XXXX deleteStoredData :"+error);
	}
})

function deleteAllStoredData(){
	// clear the indexeddb table
	db.squares.clear()
}




function saveMappingsData(dst, indexPattern, value){

	// ee(" -> "+arguments.callee.name+"("+dst+", "+indexPattern+", ~"+roughSizeOfObject(value)+"Bytes)");

	// global var method
	if(!masterMappings.hasOwnProperty(dst)){
		masterMappings[dst] = {}
	}
	if(!masterMappings[dst].hasOwnProperty(indexPattern)){
		masterMappings[dst][indexPattern] = {}
	}
	masterMappings[dst][indexPattern] = value

}

var saveMappingsDataIndexeddb = Dexie.async(function* (dst, indexPattern, value) {
	// ee(" -> "+arguments.callee.name+"("+dst+", "+indexPattern+", ~"+roughSizeOfObject(value)+"Bytes)");
	try {
		yield dbMappings.squaresMappings.put({dst: dst, indexPattern: indexPattern, data: value})
	} catch (error) {
		qq("XXXX saveMappingsDataIndexeddb :"+error);
	}

})



var getSavedMappings = Dexie.async(function* (dst, indexPattern, incSummaries = false) {
	// ee("getSavedMappings ("+dst+", "+indexPattern+")"); 
	try {
		var bob = yield dbMappings.squaresMappings.get({dst: dst, indexPattern: indexPattern})
		if(incSummaries){
			return bob['data']
		}else{
			return _.omit(bob['data'], "fieldTypes", "allFields", "keywordFields")
		}
	} catch (error) {
		qq("XXXX getSavedMappings :"+error);
	}
})




function createSquareHash(id){
	var clone = jQuery.extend({}, url.squares[squarearraysearch(id)]);
	
	//remove arbitary attributes
	delete clone["x"]
	delete clone["y"]

	//add attr to make sure this square hash is specific
	thisCH = retrieveSquareParam(id, 'CH', true)

	clone["We"] = calcGraphTime(id)
	clone["Ws"] = retrieveSquareParam(id, "Ws")
	clone["Dst"] = connectors.handletox(thisCH, "dst")
	clone["indexPattern"] = connectors.handletox(thisCH, 'indexPattern')


	return String(CryptoJS.MD5(JSON.stringify(clone)))
}


//******************************************************************
//******************************************************************



function setSquareParam(id, key, value, redraw){
	// Should really use this more...

	url.squares[squarearraysearch(id)][key] = value;

	updateIDs =  [id].concat(findAllChildren(id));
	
	reloadData(updateIDs);
	drawLines(updateIDs, false);
	drawSquares(updateIDs);
	updateurl();
	

}






// Find attribute of a Square. Look up for inheritence if needed
function retrieveSquareParam(id, key, recursive){
	// IN : Integer, string (what attribute)
	// OUT : value

	if(recursive === null || recursive === undefined){
		recursive = true;
	}
	

	// ww(7, url.squares[squarearraysearch(id)]["ds"])   
	var squareLoc = squarearraysearch(id);
	var item = url.squares[squareLoc];

	// The order....
	// if (non inheritable attribute || recursive===false)
	// if (I'm a root square)
	// default to recisrive lookups

	
	if(item.hasOwnProperty("Pr") && item.Pr === 0){
		// first square, can only inherit from taskbar, no recursive queries allowed
		switch(key){

			case "We":
			
				// if(typeof item['Wi'] != 'undefined' && item['Wi'].length>0 && item['Wi'][0]<0){
				// 	// negative value means relative to URL
				// 	return parseInt(item['Wi'][0]) + parseInt(url.ca.end);
				// if(typeof item['Wi'] != 'undefined' && item['Wi'].length>0 && item['Wi'][0]>0){
				// 	// positive value means absolute
					return parseInt(item['Wi'][0]);
				// }else{
				// 	// no figure (or 0?) means just return URL
				// 	return url.ca.end;
				// }
			case "Ws":
				// if(typeof item['Wi'] != 'undefined' && item['Wi'].length>1){
				// 	// reply
					return parseInt(item['Wi'][1]);
				// }else{
					// deduce from URL alone (this should be created/validated on page load)
					//  return (-1 * (url.ca.end - url.ca.start));
				// }	
			case "Wr":
				if(typeof item['Wi'] != 'undefined' && item['Wi'].length>2){
					// reply
					return parseInt(item['Wi'][2]);
				}else{
					// deduce from URL alone (this should be created/validated on page load)
					return 0;
				}	
			case "CH":
				//ww(6, "Pr=0 returning CK="+url.squares[i]['CK']+" from url");
				return item['CH'];


			case "Ds":
				//ww(6, "Pr=0 returning Ds="+url.Ds+" from url");
				return item['Ds'];

			case "Gt":
				//ww(6, "Pr=0 returning graphtype=Info from url");
				return item['Gt'];
			case "Hx":
				//ww(6, "Pr=0 returning graphtype=Info from url");
				return "ffffff";
		
			case "x":
			case "y":
				// if x or Y is missing, presume 0.  Helps cut down on URL size a inty bit
				if(!item.hasOwnProperty(key)){
					return 0
				}else{
					return item[key];
				}

			default:

			

				if(typeof item[key] != undefined){
					//qq("returning "+item[key])
					return item[key];
				
				}else{
					return null;
				}
		}

	}else if( (recursive === false  && !/^(raw|processed)data/.test(key) )   || ['Pr', 'Ds', 'x', 'y', 'Sc'].indexOf(key) >= 0){
		// query is for non-data, and something that shouldn't be inherited

		switch(key){
			case "Sc":
				// scale = 1 as a default
				if(typeof item[key] != undefined){
					return item[key];
				}else{
					return 1;
				}
			
			case "We":
				if(typeof item['Wi'] != 'undefined'  && !ISNAN(item["Wi"][0])){
					return item["Wi"][0];
				}else{
					return null
				}				
			case "Ws":
				if(typeof item['Wi'] != 'undefined'  && !ISNAN(item["Wi"][1])){
					return item["Wi"][1];
				}else{
					return null
				}				

			case "Wr":
				if(typeof item['Wi'] != 'undefined'  && !ISNAN(item["Wi"][2])){
					return item["Wi"][2];
				}else{
					return null
				}				

			
			default:
				// if not specified, use default return
				if(typeof item[key] != undefined){
					//qq("returning "+item[key])
					return item[key];

					

					
				}else{
					return null;
				}
		}	


	}else{
		// data or inheritable attribute, recursive queries permitted

		switch(key){
			case "We":
				if(typeof item['Wi'] != 'undefined'  && !ISNAN(item["Wi"][0])){
					return item["Wi"][0];
				}else{
					return retrieveSquareParam(item.Pr, key, true);
				}
				
			case "Ws":
				//alert(id+" "+item['Wi']+" "+!ISNAN(item["Wi"]))
				if(typeof item['Wi'] != 'undefined' && !ISNAN(item["Wi"][1]) ){
						return item["Wi"][1];
					}else{
						return retrieveSquareParam(item.Pr, key, true);
					}
				
			case "Wr":
				if(typeof item['Wi'] != 'undefined' && !ISNAN(item["Wi"][2]) ){
					return item["Wi"][2];
				}else{
					return retrieveSquareParam(item.Pr, key, true);
				}
				
			
			case "CH":
			case "Gt":
			case "Gp":
			case "Ds":
			case "Hx":
			case "Cs":
			case "Fi":
				if(classOf(item[key]).match(/(String|Number|Object|Array)/)){
					return item[key];
				}else{
					return retrieveSquareParam(item.Pr, key,true);
				}
		


			default:
				// can't case switch regex (easily) so....
			
				if(/^(raw|processed)data/.test(key)){
						alert("# error:"+arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
						
						
						return
					// 	getSavedData(id, key).then(function(savedData){
						
					// 	if(classOf(savedData) === "Object" 
					// 		|| classOf(savedData) === "Array"	
					// 		|| classOf(savedData) === "String"){
					// 		// Looking for data, raw, processed, or (raw|processed) with a handle too
					// 		//ww(6, "URL Param requsted and found id:"+id+" key:"+key);
								
					// 			return savedData
					// 	}else if (recursive===true){
					// 		return retrieveSquareParam(item.Pr, key, true);
					// 	}else{
					// 		return null;
					// 	}	

					// })

			}
		}

	}

	
	ww(2, "retrieveSquareParam failed, id:"+id+" key:"+key);
	return null

}



function calcGraphTime(id){
	// IN : Integer
	// OUT : Integer

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// array of all parents (original reverses, I want this unreversed) and add my own ID for me to count
	var parents = findParents(id).reverse()
	parents.unshift(id)
	

	var totalWe = 0;
	var sInAYear = 60*60*24*265;

	for(var i = 0 ; i < parents.length ; i++){
		
		var thisWe = retrieveSquareParam(parents[i], "We", false)
		// qq("Calctime for id:"+id+" adding thisWe:"+thisWe+" from:"+parents[i]+" totalWe:"+totalWe )

		if(!ISNAN(thisWe) && thisWe <= sInAYear){
			// relative times are <1 year
			totalWe += thisWe

		}else if(!ISNAN(thisWe) && thisWe > sInAYear){
			//Over 1 year is an absolute time, return it
			totalWe += thisWe
			return totalWe
		
		}else{
			// not a number, so ignore
			//qq("nope")
		}


	}
	
	// qq("Calctime for id:"+id+" totalWe:"+totalWe+" thisWe:"+thisWe)
	// qq("calcGraphTime id:"+id+" returning"+totalWe)
	return totalWe;

}



	
// calculate times relative to the parent
function calcGraphTime___old(id, key, cumulative){
	// IN : Integer, String (which time value), Integer of current relative time
	// OUT : Integer
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+key+", "+cumulative+")");
	
	// We = negative.  Time is relative to the parent (which may also be relative..)
	// We = null. No change to parent
	// We = Positive. Time is absolute EPOCH time reference
	// Ws = is size of time window, should always be negative to relate to We

	if(key==="Ws"){
		alert("Should you be doing a lookup for Ws? (i.e. only calc for We) from:"+arguments.callee.caller.name);
	}

	//ww(6, "calcGraphTime("+id+", "+key+", "+cumulative+")");
	
	// for any other square work it out


	if(retrieveSquareParam(id, "Pr", false) === 0){
		//ww(7, "found a root node, does it have a time? id:"+id+" return val:"+retrieveSquareParam(id, key));
		return (retrieveSquareParam(id, key, true) + cumulative);	

	}else if(retrieveSquareParam(id, key, true) > 1){
		// time frame is absolute
		//ww(7, "Time Absolute id:"+id+" "+key+"="+retrieveSquareParam(id, key));
		return (retrieveSquareParam(id, key, true) + cumulative);
	}else if(retrieveSquareParam(id, key, true) === null){
		// time frame is either null (no change) 
		//ww(7, "delve deeper for keyless square "+id+ "cumulative = "+cumulative);
		return calcGraphTime(retrieveSquareParam(id, "Pr", true), key, cumulative);
	}else{
		// time frame is negative (i.e. relative)
		//ww(7, "delve deeper for "+id+ "cumulative = "+cumulative);
		return calcGraphTime(retrieveSquareParam(id, "Pr", true), key, (cumulative + parseInt(retrieveSquareParam(id, key))));
	}
}
	
// calculate cumulitive x or Y coordinate looking at parents position
function calcCord(id, xory, cumulative){

	////ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+xory+", "+cumulative+")");
	// IN : Integer, String (which x or y value), Integer of current relative cord
	// OUT : Integer

	// if asking about id===0 you reached the top, no more to calculate.
	if(id===0){
		return cumulative;
	}else{	
		cumulative += parseInt(retrieveSquareParam(id, xory));
		return calcCord(retrieveSquareParam(id, "Pr"), xory, cumulative);
	}

}

function calcDs(id, cumulative){
	// IN: integer ID of square, Array of either strings, or OBjects (depending what Connector uses for filtering data
	// OUT: array DataSet
	
	
	////ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+classOf(cumulative)+" "+JSON.stringify(cumulative)+")");

	var thisDs;
	// if asking about id===0 you reached the top, no more to calculate.
	if(id===0){
		return cumulative.reverse();
	}	
	
	// for any other square work it out
	for(var i in url.squares){			
		//ww(7, i+" "+JSON.stringify(url.squares[i]));
		if(url.squares[i]['id']===id){
			if(url.squares[i].Ds != null){
				var parsed = JSON.parse(atob(url.squares[i].Ds))
				cumulative.push(parsed);
			}
			return calcDs(url.squares[i].Pr, cumulative);
		}
	}
	

}


// Find next ID for a square (as it's an array not an object)
function highestSquareID(){
	// IN : null
	// OUT : Integer
	
	var highest=0;
	for(var i in url.squares){
		if(url.squares[i].id>highest){
			highest=url.squares[i].id;
		}
	}
	//ww(7, "Highest Found "+highest);
	return highest;
}


async function editNewConnector(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+" ("+typeof(id)+")");
	ww(7, "Connecter #"+id+" changed");

	var item = url.squares[squarearraysearch(id)];
	item.Pr = 0;
	
	// qq($("#square_connector_dropdown_"+id).val())



	if($("#square_index_dropdown_"+id).val()){
		item.CH = $("#square_index_dropdown_"+id).val()
	}

	var tz = new Date().getTimezoneOffset();  // in minutes
	item.Wi[0] = moment($("#square_We_text_"+id).val(), "YYYY-MM-DD hh:mm:ss").unix() + (tz*60)
	item.Wi[1] = parseInt($("#square_Ws_dropdown_"+id).val());  
	// item.Wi[2] handled below
	
	if(parseInt($("#square_Wr_dropdown_"+id).val()) > 0){
		item.Gt = "UpdateCountdown";
		item.Wi[2] = parseInt($("#square_Wr_dropdown_"+id).val());  
	}else{
		// no Refresh window, means I'm an old connector
		item.Gt = "DescribeSquare";
	}
	
	if($('#square_Ds_textarea_'+id).val() != null && $('#square_Ds_textarea_'+id).val()!=""){
		item.Ds = btoa($('#square_Ds_textarea_'+id).val());
	}else{
		delete item.Ds;
	}


	// if we've edited the square, every square beneath us needs redrawing with inherited atributes
	var updateDataList = new Array();
	updateDataList = findAllChildren(id);
	// add originating ID back in
	updateDataList.push(id);	

	thisCH = retrieveSquareParam(id, 'CH', true)	

	// do it here on load, also do it during new square creation
	// elastic_version(thisCH)
	thisDst = connectors.handletox(thisCH, "dst")
	thisIndex = connectors.handletox(thisCH, 'indexPattern')

	drawLines(everyID(), false);  //line colours have changed
	drawSquares(updateDataList);


	var value = await elastic_prep_mappings(thisDst, thisIndex, id)				
	saveMappingsData(thisDst, thisIndex, value)
	await saveMappingsDataIndexeddb(thisDst, thisIndex, value)
	await deleteStoredData(updateDataList)
	
	drawinBoxes(updateDataList);
	
	
	updateurl();


}




function editMe(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	clearSquareBody(id);
	window[graphs_functions_json.retrieveGraphParam("builtin_graphs", "EditSquare", "graph") ](id);


}

// Apply changes inputted by user	
function editSquare(id){
	// IN : String (which attribute to modify)
	// OUT : na (but calls other functions
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	var item = url.squares[squarearraysearch(id)];


	// delete entire Window sub object
	delete item.Wi;
	if($("#square_We_dropdown_"+id+" option:selected").val() || $("#square_Ws_dropdown_"+id+" option:selected").val() || $("#square_Wr_dropdown_"+id+" option:selected").val()){
		item.Wi = [];
		
		item.Wi[0] = parseInt($("#square_We_dropdown_"+id+" option:selected").val());  			
		item.Wi[1] = parseInt($("#square_Ws_dropdown_"+id+" option:selected").val());  
		
		if(parseInt($("#square_Wr_dropdown_"+id+" option:selected").val()) != 0){
			item.Wi[2] = parseInt($("#square_Wr_dropdown_"+id+" option:selected").val());
			// if Window Refresh is set, we... for this one time only... allow a (non root) square to have two mods from parent
			item.Gt = "UpdateCountdown";
		}	

	}

	delete item.Gt;
	if($('#square_graph_dropdown_'+id).val() != ""){
		item.Gt = $("#square_graph_dropdown_"+id+" option:selected").val();
	}

	delete item.Ds;
	// check that it wasn't just 'deleted')
	if($('#square_Ds_textarea_'+id).val() != ""){
		item.Ds = btoa($('#square_Ds_textarea_'+id).val());
	}

	// now handle "custom" flags, fields that are bespoke to that graph type
	// should always start with "x_" which tells us to put this under "Cs"
	delete item.Cs;

	// ## This might get ugly.  JsonForm compiles a report on "submit" but we don't use their Submit method
	// to move to JsonForm submit means rewriting ediqSquare to be 1 big form = big job = not today
	// also I don't see how JsonForm handles images/tab layout the way I use it today
	// but a likely rewrite in the future

	
	// apply input mapping to non checkbox
	$('#square_editform_'+id+' *').filter(':input').not('input[type=checkbox]').each(function(){

		
		if(/^x_arr/.test(this.name)){
			// field specific array, name needs "fixing"

			if (!item.hasOwnProperty("Cs")) {
				item.Cs = {}
				item.Cs.array = []
			}			
			item.Cs.array.push(this.value)


		}else if(/^x_/.test(this.name)){
			// other stuff

			if (!item.hasOwnProperty("Cs")) {
				item.Cs = {}
			}			
			item.Cs[this.name] = this.value
		}
	});	
	// Checkbox (jsonform Boolean) always has value=1, so now map input for checked
	$('#square_editform_'+id+' *').filter('input[type=checkbox]:checked').each(function () {
		if(/^x_/.test(this.name)){
			if (!item.hasOwnProperty("Cs")) {
				item.Cs = {}
			}	
			var status = (this.checked ? $(this).val() : "");
			//item.Cs[this.name] = (this.checked ? $(this).val() : "");
			item.Cs[this.name] = true;
		}
	});





	


	// if we've edited the square, every square beneath us needs redrawing with inherited atributes
	var updateDataList = new Array();
	updateDataList = findAllChildren(id);
	// add originating ID back in
	updateDataList.push(id);	
	
	// recreate data for children squares
	drawLines(everyID(), false);  //line colours have changed
	wipeSquareStatus(updateDataList)
	drawSquares(updateDataList);
	deleteStoredData(updateDataList)
	.then(function(){
		drawinBoxes(updateDataList);
	})


	
	updateurl();

}
	


// Build a list of every square ID
function everyID(){
	// OUT : Array of Integers
	
	var idlist = [];
	for (var id in url.squares){
		idlist.push(url.squares[id].id);
	}	
	// ww(7, "everyID = "+JSON.stringify(idlist));
	return idlist
}

// In Devleopment
function downloadAsImage1() {

	ww(7, "Downloading Image...");

	// // https://blog.taucharts.com/svg-to-png/
	// var html = document.querySelector("#workspaceDiv").parentNode.innerHTML;
	// var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);

	// var canvas = document.querySelector("canvas"),
	// 	context = canvas.getContext("2d");

	// var image = new Image;
	// image.src = imgsrc;
	// image.onload = function () {
	// 	context.drawImage(image, 0, 0);
	// 	var canvasdata = canvas.toDataURL("image/png");
	// 	var a = document.createElement("a");
	// 	a.textContent = "save";
	// 	a.download = "export_" + Date.now() + ".png";
	// 	a.href = canvasdata;
	// 	document.body.appendChild(a);
	// 	canvas.parentNode.removeChild(canvas);
	// };
	
}

// In Devleopment
function downloadAsImage() {

	var html = d3.select("svg")
	  .attr("version", 1.1)
	  .attr("xmlns", "http://www.w3.org/2000/svg")
	  .node().parentNode.innerHTML;

	d3.select("body").append("a")
	  .attr("id", "linky")
	  .attr("title", "file.svg")
	  .attr("href-lang", "image/svg+xml")
	  .attr("href", "data:image/svg+xml;base64,\n" + btoa(html))
	  .text("Download");

	document.getElementById('#linky').click();	
}

// Allow any Square to pivot it's Pathbar/Time to Security Analytics
function pivotToX(id){
	// IN : Integer

	var indexPattern = connectors.handletox ( retrieveSquareParam(id, 'CH'), 'indexPattern')


	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	
	var stringFormat = "YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]"
	var kibanaTo   = moment(to, "X").utc().format(stringFormat);
	var kibanaFrom = moment( from , "X").utc().format(stringFormat);

	// var Ds = calcDs(id, []);
	// var Ds = clickObjectsToDataset(id)

	var fields=["*"]
	var limit = 10000;

	var dst = connectors.handletox ( retrieveSquareParam(id, 'CH'), "dst")
	// XXX remove port number, in config we should split that out as two fields? (or have a new field for the pivot address separate?)
	var elasticIP = dst.split(":")[0]

	var path = "https://"+elasticIP+"/kibana/app/kibana#/discover?"
	var urlStruct = "_g=" + rison.encode({
		//"filters":[],
		"refreshInterval":{
			"pause":true,
			"value":0
		},
		"time":{
			"from":kibanaFrom,
			"mode":"quick",
			"to":kibanaTo
		}
	})

	// basic structure
	var urlStructJSON = {
		"columns": ["_source"],
		"filters": [],
		"index": "e78287b0-4e9f-11eb-a354-fff6baaa6242",
		"interval": "auto",
		"query": {
			"language": "lucene",
			"query": ""
		},
		"sort": ["@timestamp", "desc"]
	}
	
	// push basic "index" filter
	// urlStructJSON['filters'].push(
	// 	{
    //         "$state": {
    //             "store": "appState"
    //         },
    //         "match": {
    //             "_index": {
    //                 "query": index,
    //                 "type": "phrase"
    //             }
    //         },
    //         "meta": {
    //             "alias": null,
    //             "disabled": false,
    //             "index": "*:logstash-*",
    //             "key": "match",
    //             "negate": false,
    //             "type": "custom",
    //             "value": "%7B%22_index%22:%7B%22query%22:%22*bro*%22,%22type%22:%22phrase%22%7D%7D"
    //         }
    //     }
	// )
	

	//var elasticQuery = elastic_query_builder(id, from, to, Ds, fields, limit, false, null, true)['query'];
	// build array of all valid Ds fields for parents with a Ds
	var elasticQuery = []
	var familyTree = findParents(id)
	familyTree.push(id)
	_.each(familyTree, function(eachId){
		var Ds = retrieveSquareParam(eachId, "Ds", false)
		if(Ds  != null){
			Ds = JSON.parse(atob(Ds))
			var query = elastic_query_builder(eachId, from, to, Ds, fields, limit, false, null, true)['query']

			urlStructJSON['filters'].push(
				{
					"$state": {
						"store": "appState"
					},
					"meta": {
						"alias": null,
						"disabled": false,
						"index": "*:logstash-*",
						"key": "bool",
						"negate": false,
						"type": "custom",
						"value": JSON.stringify(query['bool'])
					},
					"bool": query['bool']
				}
			)


		}
	})


	var thisQuery = "&_a=" + rison.encode(urlStructJSON)

	var kibanaQuery = path + urlStruct + thisQuery

	// qq(urlStructJSON)
	// qq(elasticQuery)
	// qq(JSON.stringify(elasticQuery))
	// qq( encodeURI(JSON.stringify(elasticQuery)))
	// qq(encodeURIComponent(JSON.stringify(elasticQuery)))
	qq(kibanaQuery)

	window.open(kibanaQuery);


}


function pivotNewTab(id){

	var to = calcGraphTime(id, 'We', 0)
	var size = retrieveSquareParam(id, "Ws", true)

	preDs = calcDs(id, [])
	postDs = {"compare":[], "notexist":[]}

	// loop each square's dataset
	_.each(preDs, function(obj, i){
		
		// each square can have multi dimensional compare
		_.each(obj['compare'], function(obj2,key2){
			postDs['compare'].push(obj2)
		})

		// each square can have multi dimensional compare
		_.each(obj['notexist'], function(obj2,key2){
			postDs['notexist'].push(obj2)
		})

	})


	newSquare = {}
	newSquare.id = 1
	newSquare.Pr = 0
	newSquare.Gt = "DescribeSquare"
	newSquare.CH = retrieveSquareParam(id, "CK")
	newSquare.Wi = [to, size]
	newSquare.Ds = btoa(JSON.stringify(postDs))
	
	newUrl = {}
	newUrl.v = "1"
	newUrl.squares =  [newSquare]
	
	newUrl.Zt = "translate(431,311) scale(0.5)"

	existingUrl = window.location
	newUrl =  existingUrl.protocol + "//" + existingUrl.hostname + ":" + existingUrl.port + existingUrl.pathname + "#" + btoa(JSON.stringify(newUrl))

	window.open(newUrl);


}



// http://stackoverflow.com/questions/4187146/display-two-decimal-places-no-rounding
// Math.floor with 'decimal places'
function floorFigure(figure, decimals){
	// IN : Int, int
	if (!decimals) decimals = 2;
	var d = Math.pow(10,decimals);
	return (parseInt(figure*d)/d).toFixed(decimals);
};

// Generate a hex colour from a String
function stringtocol(string){
	// IN : String
	// OUT : String ("#ababab")
	// converting the Key->hash->colour, we get the same colour for any 'Key' every time even 
	// accross different graphs, and "eth1" has a COMPLETELY different and predictable colour to "eth2"
	
	var hashmd5 = "";
	hashmd5 = String(CryptoJS.MD5(string));
	var strippedhash = hashmd5.replace(/g-zG-Z/g, "");
	var shortenedhash = strippedhash.slice(0,6);
	return "#"+shortenedhash;
}
	


// populate the Template overlay
// function doTemplates(){
// 	for (var j in master_templates){
// 		$("#templateshere").append("<div class='fleft twist'><input type='button' value='Apply' onClick='pushTemplate(1, "+j+")' /></div><div class='fleft twist'>"+master_templates[j]["Desc"]+"</div><div class='clr'></div>");
		
// 	}		
// }




function compileGraphs(){
	
	// get all graphs and add to the overlay
	$.get( "./compile_graphs.php", function( data ) {
		
	
		// results are needed elsewhere, so store them outside this function
		$.each(data, function(k, v) {
			var existing_json = graphs_jsfiles_json.get_graphs_json();
			existing_json[k] = v;
			graphs_jsfiles_json.set_graphs_json(existing_json);
		})
		// read the results back and load JS
		var jsStilltoLoad = 0;
		
		$.each(graphs_jsfiles_json.get_graphs_json(), function(k, v){
			$.each(v, function(i, val){
				jsStilltoLoad++;
				$.getScript("./graphs/"+val )
				.done(function( script, textStatus ) {
					jsStilltoLoad--;
					// multiple of these, finishing at different times, so after each load so if any left to do.  If not, populate graphs?
					if(jsStilltoLoad===0){
						//ww(7, "jsStilltoLoad = "+jsStilltoLoad+"!!!!!!!!");
						ww(5, "compileGraphs() finished all downloads");
						

						compileConnectors();
						

					}
				})
				.fail(function( jqxhr, settings, exception ) {
					$( "div.log" ).text( "Triggered ajaxError handler." );
				});
			});
		})
	})
}

function compileConnectors(){
	// get all connectors and add to the overlay
	$.get( "./compile_connectors.php", function( data ) {
		$.each(data, function(k, v) {
			connectors.add_connector(v)
		})
		
		// XXX needs improving - move to resolve? 
		// Only do initial load if this is the main squares-page
		if (document.location.href.indexOf('scripted_fields.html') === -1){ 
			// compileGraphs and conmpileConnectors finished (moved this functionality to promises???
			initialLoad();
		}
				
	});

}

async function initialLoad(){

	tmpEveryID = everyID()

	ww(5,"***PageLoad drawLines ***");
	drawLines(tmpEveryID, false);

	ww(5,"***PageLoad drawSquares ***");
	drawSquares(tmpEveryID);


	ww(5,"***Prepare Mappings ***");
	for(var i in tmpEveryID){
		
		var id = tmpEveryID[i]
		
		// only get Mappings if the square has a connector handle (i.e. not inherinting squares)
		if(retrieveSquareParam(id, 'CH', false)){

			thisCH = retrieveSquareParam(id, 'CH', true)
			thisDst = connectors.handletox(thisCH, "dst")
			thisIndex = connectors.handletox(thisCH, 'indexPattern')
			
			if(connectors.handletox(thisCH, "type") === "elastic"){
				
				value = await elastic_prep_mappings(thisDst, thisIndex, id)				
				saveMappingsData(thisDst, thisIndex, value)
				await saveMappingsDataIndexeddb(thisDst, thisIndex, value)
				
							
				// elastic_version(retrieveSquareParam(id, 'CH', true))
			
			}
		
		}
	
	}
	ww(5,"***PageLoad drawinBoxes***");
	drawinBoxes(tmpEveryID);

	

}



function resize_workspace(){
	$("#workspaceDiv").css("width", "99%");
	$("#workspaceDiv").css("height", document.getElementById('workspacecontainer').clientHeight-10);
}

function qqLoggingChange(){
	if(GLB.qqLogging === 7){
		GLB.qqLogging = 0;
	}else{
		GLB.qqLogging++;
	}
}





function zoomed(){	
		//ww(6,"zooooomed");
		// move and scale the "squaregroup" for zoom effect. Floor it to shorten URL
		squaregroup.attr("transform",  d3.event.transform)

		// squaregroup
		// {"_groups":[[{"__zoom":{"k":0.43527531847787715,"x":545.0557806151778,"y":632.5716410660139}}]],"_parents":[{}]}

		// squaregroup.attr("transform")			
		// translate(543.0557806151778,629.5716410660139) scale(0.43527531847787715)

		var roundingZero = 1
		var roundingTwo = 100

		var zoomString = squaregroup.attr("transform")	
		var zoomRegex = /[0-9\.]+/g
		var zoomMatches = zoomString.match(zoomRegex)
		
		
		var newZoomString = "translate(" + Math.round((zoomMatches[0]) * roundingZero) / roundingZero + "," + Math.round((zoomMatches[1]) * roundingZero) / roundingZero + ") scale("+Math.round((zoomMatches[2]) * roundingTwo) / roundingTwo+")"

		// save this zoom/transform base64 into the URL for pageload/bookmarks etc
		url.Zt = newZoomString;
	
}

function zoomEnd(){
	updateurl();
}


var drag = d3.drag()
	.on("start", dragstarted)
	.on("drag", dragged)
	.on("end", dragended);

var zoom = d3.zoom()
	.scaleExtent([.03, 10])
	.on("zoom", zoomed)
	.on("end", zoomEnd)

function onLoad(){		
	
	
	db = new Dexie("squares");
	db.version(1).stores({
		squares: "[squareid+keyType+keyName], squareid, keyType, keyName, [squareid+keyType]"

	});

	dbMappings = new Dexie("squaresMappings");
	dbMappings.version(1).stores({
		squaresMappings: "dst, indexPattern, [dst+indexPattern]"

	});




	//////////////////////////////
	// squares-ui / d3 stuff
	//////////////////////////////
	


	workspaceDiv = d3.select("#workspaceDiv")
		.call(zoom);

	// used to contain the squares and transform them as one
	squaregroup = workspaceDiv.append("g")
		.attr("id", "squaregroup")



	// auto update canvas size
	$(window).resize(function() {
		resize_workspace();
	});
	resize_workspace();

	
	// used to store all the lines connecting squares		
	d3.select("#squaregroup")
		.append("g")
		.attr("id", "linegroup");


	hash = window.location.hash.substring(1)


	if(hash
		&& re_str.test(hash)
		&& classOf(JSON.parse(atob(hash)))==="Object" 
		&& JSON.parse(atob(hash))
		&& JSON.parse(atob(hash)).hasOwnProperty("squares")
		&& JSON.parse(atob(hash)).hasOwnProperty("Zt")
		){
			// URL is compliant
			ww(5, "Valid URL found");
			url = JSON.parse(atob(hash));
	
	}else{
		// No compliant URL at all, let's build our own object
		ww(5, "No valid URL found, show 'Intro' squares");
		
		// id=1 should be empty.  
		// For square 1, the code should always reference the PathBar, and not the object.  
		// Every other square will reference the Pr instead			
		//url.squares = new Array();
	


		url = {}
		url.v = "1"
		url.squares =  [{
					"id": 1,
					"Pr": 0,
					"Gt": "intro",
					"Wi": [],
					"x": -800,
					"y": -50
				}, {
					"id": 2,
					"Pr": 1,
					"Gt": "intro",
					"Wi": [],
					"x": 1100,
					"y": 200
				}, {
					"id": 3,
					"Pr": 1,
					"Gt": "intro",
					"Wi": [],
					"x": 200,
					"y": 1100
				}
			]
		url['Zt'] = "translate(1530,863) scale(0.57)"
	
			qq("tim")
			qq(url)

		updateurl();
	}

	
	if(url.Zt!=null){
		var newTransform = url['Zt'].split(/[\(\) ,]/);;

		zoom.transform(squaregroup, d3.zoomIdentity.translate(newTransform[1], newTransform[2]).scale(newTransform[5]))
		zoom.transform(workspaceDiv, d3.zoomIdentity.translate(newTransform[1], newTransform[2]).scale(newTransform[5]))
	}

	
	

	//////////////////////////////
	// ThreeJS  stuff
	//////////////////////////////
	if(GLB.threejs.enabled === false){
		// go straight to render
		// otherwise wait until threeJS is loaded
		compileGraphs();

	}else{

		qq("loading Three components")
 		$.getScript('./Three/three.js', function() { 
			 
			// // qq("three.js loaded, loading further libraries") 
			$.getScript('./lib/stats.js', function() { 
				//qq("stats.js loaded") 
				$.getScript('./lib/threex.rendererstats.js', function() { 
					//qq("renderstats.js loaded")
				
				
					$.getScript('./myThree.js', function() { 
						//qq("myThree.js loaded") 
					
						if(GLB.threejs.realTimeRender === true){
							// set off real time rendering
							animate_Three();
						}else{
							// setTimeout for slower refresh, but better on low spec machines
							setTimeoutThree(GLB.threejs.notRealTimeRenderFrequency);
						}
						
						compileGraphs();
		
					});				
				
				
				
				});
		
			});

			
			$.getScript('./Three/dat.gui.js', function() {
				//qq("dat.gui.js loaded")
			});
			$.getScript('./Three/OrbitControls.js', function() { 
				//qq("OrbitControls.js loaded") 
			});





			threeRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
			// // XXX goes crazy if OS fonts are 125%... needs reviewing!!!
			// //threeRenderer.setPixelRatio(window.devicePixelRatio);

			// //container = document.getElementById("workspacecontainer")
			// //threeRenderer.setSize( container.clientWidth, container.clientHeight );

			threeRenderer.domElement.id = 'workspacecanvas';
			// container = document.getElementById( 'workspacecontainer' );
			// container.appendChild( threeRenderer.domElement );
			document.getElementById( 'workspacecontainer' ).appendChild( threeRenderer.domElement );

			//mouse = new THREE.Vector2(), INTERSECTED;
			mouse = new THREE.Vector2();

			// // threeRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
			// // // allow for screens of retina, or large OS font
			// // const yourPixelRatio = window.devicePixelRatio
			// // threeRenderer.setPixelRatio( 1/yourPixelRatio );
			// // threeRenderer.domElement.id = 'workspacecanvas';
			// // container = document.getElementById( 'workspacecontainer' );
			// // container.appendChild( threeRenderer.domElement );
		
			// set realx/realy for threeJS raycasting
			$("#workspaceDiv").mousemove(function( event ) {
				mouse.realx = ( event.clientX  ) ;
				mouse.realy = ( event.clientY );
			});
			$("#workspaceDiv").mouseup(function( event ) {

				for (var prop in threeScenes) {

					if(!threeScenes.hasOwnProperty(prop)) continue;

					var element = threeScenes[prop].userData.elementt;
					var scene = threeScenes[prop];
					var camera = threeScenes[prop].userData.camera;
					var raycaster = threeScenes[prop].userData.raycaster;
					var square_id = threeScenes[prop].userData.id;
					let rect = element.getBoundingClientRect();
					if ( rect.bottom < 0 || rect.top  > threeRenderer.domElement.clientHeight ||
						rect.right  < 0 || rect.left > threeRenderer.domElement.clientWidth ) {
						// ww(7, "square_"+square_id+" not in render scope, RETURN");
						continue;  // it's off screen
					}
					var width  = Math.floor(rect.right - rect.left);
					var height = Math.floor(rect.bottom - rect.top);
					var left   = Math.floor(rect.left);
					var top    = Math.floor(rect.top);	
					if(mouse.realx > rect.left && mouse.realx < rect.right && mouse.realy > rect.top && mouse.realy < rect.bottom){
						// mouse is in this div/square
						// qq("mouse is in "+scene.userData.id);
						mouse.x = ((((mouse.realx - rect.left) / width ) * 2 ) - 1);
						mouse.y = ((((mouse.realy - rect.top) / height ) * 2 ) - 1) * -1;

						raycaster.setFromCamera( mouse, camera );
						var intersects = raycaster.intersectObjects( scene.children );


						ww(7, "INTERSECT for square_"+square_id+" has "+intersects.length+" matches");
						if ( intersects.length > 0 ) {
							//for(var i = 0 ; i < intersects.length ; i++ ){
							//	if(intersects[i].object.sakeName != null && intersects[i].object.sakeName != ""){
							//		intersects[i].object.sakeAction();
							//	}
							//}
							if(intersects[0].object.squaresName != null && intersects[0].object.squaresName != ""){
								intersects[0].object.squaresAction();
							}
							
						}

					}
				}
			});

			if(GLB.threejs.showperformance === true){
				rendererStats.domElement.style.position	= 'absolute'
				rendererStats.domElement.style.left	= '0px'	
				rendererStats.domElement.style.bottom	= '0px'
				document.body.appendChild( rendererStats.domElement )
				
				stats0.showPanel( 0 );
				stats0.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
				document.body.appendChild( stats0.dom );
				stats1.showPanel( 1 );
				stats1.domElement.style.cssText = 'position:absolute;top:0px;left:80px;';
				document.body.appendChild( stats1.dom );
				stats2.showPanel( 2 );
				stats2.domElement.style.cssText = 'position:absolute;top:0px;left:160px;';
				document.body.appendChild( stats2.dom );
			}
		
			



		 });	
	}





}