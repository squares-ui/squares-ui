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
		//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"['"+type+"']['"+graphshort+"']['"+value+"']");


		if(graphshort==null || this.local_json["builtin_graphs"] == undefined){
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
		// resolve order = id -> CH -> type -> short names -> dropdown
		$("#systemgraphshere").empty();
		$("#connectorgraphshere").empty();

//		var mySelect = $('#systemgraphshere');
//		mySelect.append(
//			$('<option></option>').val("-").html("--System Graphs--")
//		);
//
//		// add the mandatory built in graphs
//		$.each(graphs_functions_json.typeToShortnameList("builtin_graphs"), function(i, v){
//			mySelect.append(
//				$('<option></option>').val(v).html(v)
//			);
//		});

		//
		var mySelect = $('#connectorgraphshere');
		mySelect.append(
			$('<option></option>').val("-").html("--Connector Graphs--")
		);
		// find the graphs specific to this Connector tyep
		connector_type = connectors_json.handletotype( retrieveSquareParam(id, 'CH') );
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
			ww(7, "graph appropriate = "+JSON.stringify(k));
			toreturn.push(k);
		});
		return toreturn.sort();
	},

}


// connectors_json.handletotype
var connectors_json = {
	// Object to handle connectors
	// Your configuration of hosts/connectors
	//  ["0":{"handle":"dmz web","type":"apache"...},]
	local_json: {},
	get_connectors_json: function(){
		return this.local_json;	
	},
	set_connectors_json: function(new_connectors_json){
		this.local_json = new_connectors_json;
	},
	handletotype: function(handle){
		var toreturn;
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				toreturn  = v['type'];
				return false;
			}
		});
		return toreturn;
	},
	handletodst: function(handle){
		var toreturn;
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				toreturn  = v['dst'];
				return false;
			}
		});
		return toreturn;
	},
	handletousername: function(handle){
		var toreturn
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				toreturn  = v['username'];
				return false;
			}
		});
		return toreturn;
	},
	handletoapikey: function(handle){
		var toreturn
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				toreturn  = v['apikey'];
				return false;
			}
		});
		return toreturn;
	},
	handletox: function(handle, x){
		var toreturn
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				toreturn  = v[x];
				return false;
			}
		});
		return toreturn;
	},
	getAttribute: function(handle, key){
		var toreturn
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				if(v.hasOwnProperty(key)){
					toreturn = v[key]
					return false;
				}else{
					toreturn = null;
				}
			}
		});
		return toreturn;
		
	},
	setAttribute: function(handle, key, value){
		$.each(this.local_json, function(k, v){
			if(String(v['handle']) == String(handle)){
				v[key] = value
			}
		})
		

	},

}
	



function updateurl(){
	// ee(" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	
	existingUrl = window.location
	newUrl = existingUrl.protocol + "//" + existingUrl.hostname + ":" + existingUrl.port + existingUrl.pathname + "#" + btoa(JSON.stringify(url))

	window.history.pushState("object or string", "Title", newUrl);
	// // $('#mailto').attr("href", "mailto:?subject=SQUARES-UI Link"+"&body="+newurl);
	
}	
	
function updaterefresh(){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	var newurl = window.location.href.replace(/\/#.*$/, "/#"+btoa(JSON.stringify(url)));
	//location.replace(newurl);
	window.history.pushState("object or string", "Title", newurl);
}

function wipereset(){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	Lockr.flush();

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

	addGraphConnector();
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

// error status is a state, not a config, so store it here, and not in URL square definition
var errorStatus = {}
errorStatus['page'] = {"critical":[], "warning":[]}
errorStatus['squares'] = {} // {1: {"critical":[], "warning":[]}, 2:{}}



///// Do we already have an object to build from?
hash = window.location.hash.substring(1)

if(hash
	&& re_str.test(hash)
	&& classOf(JSON.parse(atob(hash)))=="Object" 
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
				"x": -1700,
				"y": -1000
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
	url.Zt = "translate(1529,863) scale(0.57)"

	updateurl();
}


//******************************************************************
//******************************************************************
//*********   User invoked Activity
//******************************************************************
//******************************************************************

var drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);


function dragstarted(d) {
	d3.event.sourceEvent.stopPropagation();
}



function dragged(d) {
	// even a click registers as a drag, so check dx/dy (differnce in x/y) to see if movement took place
	// event.dx isn't the total move dist, it's the move per frame/step

	if(Math.abs(d3.event.dx) > GLB.square.dragSensitivity || Math.abs(d3.event.dy) > GLB.square.dragSensitivity){
		wasMoved = true;

		deleteLines();

		// the X/Y are positions on the monitors X/Y, but also relative to the parent coords, which is relative to the d3 translation, which is affected by the zooom/scale	
		newcoords = d3.mouse(d3.select('#squaregroup').node());
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
		while(loop==true){
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
	squaresToUpdate = findAllChildren(d.id);
	squaresToUpdate.push(d.id);
	drawLines(squaresToUpdate, false);
	drawSquares(squaresToUpdate);
	drawinBoxes(squaresToUpdate);
	updateurl();



}



// Display the Template Overlay
function showTemplateDiv(id){
	// IN : square ID
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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

	// set some default
	clone.id=(parseInt(highestSquareID())+1);
	clone.x = 100;
	clone.y = 100; // remember, x is relative to parent
	clone.Pr = id;
		
	//if(url.squares[squarearraysearch(id)].Pr == null || url.squares[squarearraysearch(id)].Pr == 0){
	//	clone.Gt="EditSquare";
	//}
	
	// merge in the custom fields
	if(newObject.constructor === Object && Object.keys(newObject).length !== 0 ){
		// clone, and make the newObject take priority if a clash? is this wise?
		ww(7, "duplicateSquare() merging with preset ("+JSON.stringify(newObject)+")passed Object");
		clone = $.extend(true, clone, newObject);  

	}


	url.squares.push(clone);
	
	var ids = [clone.id];
	drawLines(ids, false);
	drawSquares(ids);	
	drawinBoxes(ids);
	udpateScreenLog("#"+clone.id+" Created");


	return clone.id;
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
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");

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
			if(retrieveSquareParam(d.id, "Pr") == 0){
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

			if(GLB.drawLineBezier==true && drawBezier==true && d.Pr!=0){
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
			if(retrieveSquareParam(d.id, "Pr") == 0){
				var prRelX = calcCord(d.id, 'x', 0);
			}else{
				var prRelX = calcCord(retrieveSquareParam(d.id, "Pr"), 'x', 0);
			}	
			return (prRelX + myRelX)/2 - (lineFoWidth/2)
		})
		.attr("y", function(d){
			var myRelY = calcCord(d.id, 'y', 0);
			if(retrieveSquareParam(d.id, "Pr") == 0){
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
				text = retrieveSquareParam(d.id, 'Ds', false)
				if(text !== undefined){
					
					out = []

					//obj = _.values(JSON.parse(atob(retrieveSquareParam(d.id, 'Ds', false))))
					obj = JSON.parse(atob(retrieveSquareParam(d.id, 'Ds', false)))
					
					_.each(obj['compare'], function(obj,i){
						out.push(_.values(obj)[0])
					})

					out = out.join(", ")

					return out
				}
			})
			.on("click", function(d){
				alert(atob(retrieveSquareParam(d.id, 'Ds')))
			})

};


function squareMouseOver(d, i){
	// Hide all square menus if you want a cleaner interface?
	if(GLB.hidesquaremenus == true){
			$(".square_menu").removeClass("menu_invisible");
	}
}
function squareMouseOut(d, i){
	if(GLB.hidesquaremenus == true){
		$(".square_menu").addClass("menu_invisible");
	}
}



// Draw the *container* for each Square
function drawSquares(idlist) {
	// IN : Array of integers
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(idlist)+")");

	
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
					newId = duplicateSquare(d.id, {"x": 1000}); 
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
	        		.on("mouseout", function(d){ drawinBoxes([d.id]) })
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
				.on("click", function(d){deleteData(d.id), reloadData([d.id]);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;	
				
			// Move
			var move = menubarcontrols.append("img")
				.attr("title", "Drag square to move")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_move", true)
				.attr("id", function(d){ return "square_menu_move_"+d.id })
				//.on("click", function(d){deleteData(d.id); })
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
			

	// hover over info for any element
	var squareinfo = square_container.append("xhtml:div")
		.classed("square_menu_info", true)
		.classed("square_menu", true)
		.attr("id", function(d){ return "square_info_"+d.id })
				

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
		id = idlist[i]
		graphLoading(id);

	}



	// remove the marker for appending
	squaregroup.selectAll(".newsquare")
		.classed("newsquare", false)


}




//////////////////////////////
// error handling
//////////////////////////////

function addSquareStatus(id, status, tooltip){
	
	if(!errorStatus['squares'].hasOwnProperty(id)){
		errorStatus['squares'][id] = {"critical":[], "warning":[]}
	}

	errorStatus['squares'][id][status] = _.reject(errorStatus['squares'][id][status], function(singleTooltip){
		return tooltip == singleTooltip
	})
	errorStatus['squares'][id][status].push(tooltip)
	renderSquareStatus(id, status)
}

function removeSquareStatus(id, status, tooltip){
	
	// cycle through all statuses, and remove where string match
	errorStatus['squares'][id][status] = _.reject(errorStatus['squares'][id][status], function(singleTooltip){
		return tooltip == singleTooltip
	})
	renderSquareStatus(id, status)
}
function wipeSquareStatus(ids){
	
	
	
	if(!ids.isArray){
		ids = [ids]
	}

	_.each(ids, function(id){
		qq("wiping errorStatus for id:"+id)
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

		if(errorStatus['squares'][id].hasOwnProperty('critical') && errorStatus['squares'][id]['critical'].length > 0){
			cssClass = "svg__colour__critical"
		}else if(errorStatus['squares'][id].hasOwnProperty('warning') && errorStatus['squares'][id]['warning'].length > 0){
			cssClass = "svg__colour__warning"
		}else{
			cssClass = "svg__colour__nofilter"
		}
		
		$('#square_status_img_'+id).addClass(cssClass)

		tooltip = [errorStatus['squares'][id]['critical'].join(", "), errorStatus['squares'][id]['warning'].join(", ")].join(" | ")
		$('#square_status_img_'+id).prop('title', tooltip)
	}
	
}




function addPageStatus(id, status, tooltip){
	errorStatus['page'][status] = _.reject(errorStatus['page'][status], function(singleTooltip){
		return tooltip == singleTooltip
	})
	errorStatus['page'][status].push(tooltip)

	renderPageStatus(id, status)
}
function removePageStatus(id, status, tooltip){
	
	// cycle through all statuses, and remove where string match
	errorStatus['page'][status] = _.reject(errorStatus['page'][status], function(singleTooltip){
		return tooltip == singleTooltip
	})
	renderPageStatus(id, status)
}

function renderPageStatus(id){

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








function setHoverInfo(id, data){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+data+")");

	$("#square_info_"+id).html(data)
	$("#square_info_"+id).css('display', 'block')

	localTimeout = GLB.square.hoverfade;
	setTimeout(
		function(localTimeout){
			$("#square_info_"+id).css('display', 'none')
			$("#square_info_"+id).html("")
		}, localTimeout);

}
function clearHoverInfo(id){
	
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

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// start with a default
	var currentScale = GLB.zoomLevels[0];
	
	if(typeof(url.squares[squarearraysearch(id)].Sc) == null){
		ww(6, "Scale found no existing scale for id:"+id);
		url.squares[squarearraysearch(id)].Sc = 1;
	}else if(typeof(url.squares[squarearraysearch(id)].Sc) != null && url.squares[squarearraysearch(id)].Sc > 0){
		currentScale = url.squares[squarearraysearch(id)].Sc
		ww(6, "Scale found for id:"+id+" as "+currentScale);
	}

	newScale =  GLB.zoomLevels[GLB.zoomLevels.indexOf(currentScale)+1];
	ww(6, "Scale for id:"+id+" now "+newScale); 

	url.squares[squarearraysearch(id)].Sc = newScale;

	drawSquares([id]);	
	drawinBoxes([id]);
	updateurl();

}

// User has Loaded page/Dragged a box/Duplicated a box/Edited a square/other
function drawinBoxes(ids){
	// IN : Array of Integers
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");
	
	// update the status icon
	// setSquareStatus(id, "normal")

	for (var i in ids){
	
		renderSquareStatus(ids[i])
	
		//	var item = url.squares[squarearraysearch(ids[i])];
		var thisDate = new Date();
		var thisEpoch = Math.floor(thisDate.getTime() / 1000); 
		var thisOffset = thisDate.getTimezoneOffset() * 60;
	
		// keep times in epoch, but adjut for this user
		// no need to apply our timezone offset agaisnt thisWe, as moment already does that for us
		var thisWe = (calcGraphTime(ids[i]) );
		var thisWs = retrieveSquareParam(ids[i], "Ws");
		// var thisWr = retrieveSquareParam(ids[i], "Wr");
		// qq("thisWe = "+thisWe)
		var sInDay = 60*60*24;
		
		// draw the time frames at the bottom of the box
		
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
		//$("#square_WeWs_"+ids[i]).text(squareStart + " ( +"+squareDiff+" ) "+squareEnd+" ("+thisWe+")");
		$("#square_WeWs_"+ids[i]).text(squareStart + " ( +"+squareDiff+" ) "+squareEnd);

		
		// draw the actual graph
		if(classOf(Lockr.get("squaredata_"+ids[i]+"_processeddata")) == "Object" 
		|| classOf(Lockr.get("squaredata_"+ids[i]+"_processeddata")) == "Array"	
		|| classOf(Lockr.get("squaredata_"+ids[i]+"_processeddata")) == "String" ){			
			// I have data,  no one has deleted it, must be safe to use
			//ww(6, "drawInBoxes thinks #"+ids[i]+" already has data ready to draw");
			callTheGraph(ids[i], false);

		}else if( thisWe !=null || thisWs !=null || retrieveSquareParam(ids[i], "Gt") !=null || retrieveSquareParam(ids[i], "Ds") !=null ){	
			// I have no data and I differ, time to get my data created
			ww(6, "drawInBoxes() populating #"+ids[i]+": "+ connectors_json.handletotype( retrieveSquareParam(ids[i], 'CH')) +" "+retrieveSquareParam(ids[i], "Gt"));
			window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(ids[i], 'CH')), retrieveSquareParam(ids[i], "Gt") , "populate") ](ids[i]);

		}else if(classOf(retrieveSquareParam(ids[i], "processeddata")) == "Object" 
		|| classOf(retrieveSquareParam(ids[i], "processeddata")) == "Array" ){
			// I have no data, I have no soul, but my parent has data, I'll use that...
			//ww(6, "drawInBoxes thinks #"+ids[i]+" is soul-less and should steal data from parent");
			ww(6, "drawInBoxes() 'callsTheGraph' for  #"+ids[i]+" "+ connectors_json.handletotype( retrieveSquareParam(ids[i], 'CH')) +" "+retrieveSquareParam(ids[i], "Gt"));
			callTheGraph(ids[i], false);
			
		}else{
			graphNoData(ids[i]);
		}


	}
}

function graph_ajax_fin(id){
	// Async ajax has finished for ID
	window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), retrieveSquareParam(id, "Gt") , "rawtoprocessed") ](id);
}



// Squares call this centralised code point to save *raw* data and start drawing
function saveRawData(id, validdata, name, data){
	// IN : Integer ID, "raw|processed", Array|Object
	// Raw data is handled by the graph, this can be messy and have different titles
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+validdata+", "+name+")");

	udpateScreenLog("#"+id+" raw data saved");
	
	if(validdata == true){
		Lockr.set('squaredata_'+id+'_rawdata_'+name, data);	
		window[graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), retrieveSquareParam(id, "Gt") , "rawtoprocessed") ](id);
		
	}else{
		Lockr.set('squaredata_'+id+'_rawdata_'+name, null);	
		graphNoData(id);		
	}

	if(GLB.removeRawDataAfterProcessing == true){
		
		Lockr.rm('squaredata_'+id+"_rawdata");
		Lockr.rm('squaredata_'+id+"_rawdata_");
		
	}

}	


function graphLoading(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");
	// remove the "loading" div in a square
	clearSquareBody(id);

	// holding square whilst data loads/drawn, or we realise there is no data
	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	
	var square = squareContainer
		.append("xhtml:div") 
			.attr("id", function(d){return("square_holding_"+d.id)})
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("square_dft_message", true)
			.on("mousedown", function() { d3.event.stopPropagation(); })
	var width = square.attr("width");
	var loadingImage = square.append("img")
			.attr("src","./images/021_b.png")
			.classed("top_spacing", "true")
			.on("mousedown", function() { d3.event.stopPropagation(); })
	;		

}


function graphNoData(id){

	// remove the "loading" div in a square
	clearSquareBody(id);

	// add a "no data" div to a square
	var squareContainer = workspaceDiv.selectAll('#square_container_'+id)
	var square = squareContainer
		.append("xhtml:div") 
			.attr("id", function(d){ return "square_nodata_"+d.id })
			.classed("box_binding", true)
			.classed("square_body", true)
			.classed("square_xhtml", true)
			.classed("square_dft_message", true)
			.on("mousedown", function() { d3.event.stopPropagation(); })
	var width = square.attr("width");
	var loadingImage = square.append("img")
			.attr("src","./images/168_b.png")
			.classed("top_spacing", "true")
			.on("mousedown", function() { d3.event.stopPropagation(); })

}
function graphGraphError(id, msg){

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
			.text("'"+msg+"'")
		.on("mousedown", function() { d3.event.stopPropagation(); });
	var width = square.attr("width");
	var loadingImage = square.append("img")
			.attr("src","./images/162_b.png")
			.classed("top_spacing", "true")
			.on("mousedown", function() { d3.event.stopPropagation(); })

}
function graphAboutMe(id){
	// if this graph type was persistent, then it would override all other attributes, making it annoying
	// so it is a short lived function, not a square "type"

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

	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Coords (relative):</div");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>x"+retrieveSquareParam(id, 'x')+", y"+retrieveSquareParam(id, 'y')+"</div");
	$("#square_aboutme_"+id).append("<div class='clr'></div>");

	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Coords (absolute):</div");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>x"+calcCord(id, 'x', 0)+", y"+calcCord(id, 'y', 0)+"</div");
	$("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Parent ID:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>#"+retrieveSquareParam(id, 'Pr')+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Graph Type:</div");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>'"+retrieveSquareParam(id, 'Gt')+"'</div");
	var desc = graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), retrieveSquareParam(id, "Gt") , "about") ;
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+desc+"</div");
	$("#square_aboutme_"+id).append("<div class='clr'></div>");

	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Window End:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+moment.unix(calcGraphTime(id)).format("MMM ddd Do, HH:mm:ss")+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");
	
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Window Size:</div");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>"+countSeconds(retrieveSquareParam(id, "Ws"))+"</div");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");
	
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_header'>Parent Line Style:</div>");
	// $("#square_aboutme_"+id).append("<div class='square_aboutMe_body'>'"+getLineCol(id)+"'</div>");
	// $("#square_aboutme_"+id).append("<div class='clr'></div>");

	$("#square_aboutme_"+id).append("<div class='square_aboutMe_header fleft'>Data Subset: (including recursive from parents)</div>");
	$("#square_aboutme_"+id).append("<div class='square_aboutMe_body fleft'>"+JSON.stringify(clickObjectsToDataset(id))+"</div>");
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

// Squares call this centralised code point to save *processed* data and start drawing
function saveProcessedData(id, name, data){
	// IN : Integer ID, string, Array|Object
	// Procesed data is needed by the main script, so it has to be "squaredata_x_processeddata"
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+","+name+")");

	var myHash = String(CryptoJS.MD5(JSON.stringify(url.squares[squarearraysearch(id)])));
	Lockr.set('squaredata_'+id+'_hash', myHash);	
	Lockr.set('squaredata_'+id+'_processeddata'+name, data);	

	if(GLB.clearRawData == true){
		ww(1, " Clearing raw data for "+id);
		Lockr.rm('squaredata_'+id+"_rawdata");
		Lockr.rm('squaredata_'+id+"_rawdata_");
	}

	udpateScreenLog("#"+id+" data processed");
	callTheGraph(id, true);
}

// Squares call this to see if the saved data matches their own hash.  If not, it's stale from another page
function checkSavedDataIsMine(id){
	var myHash = String(CryptoJS.MD5(JSON.stringify(url.squares[squarearraysearch(id)])))
	// if I'm a root square, return cumulativesquarearraysearch(id)]))) 
	if(myHash == Lockr.get('squaredata_'+id+'_hash', myHash)){
		// hash matches, this is my data
	}else{
		// saved data appears to be stale cache. remove
		ww("stale data found for id="+id+", deleting");
		deleteData(id);
	}
}


// Some data is ready, call the 'drawing function'
function callTheGraph(id, nudgeChildren){
	// IN: Integer, Binary (whether to chase down all children and draw them too)
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+nudgeChildren+")");
	clearSquareBody(id);


	// call the function that is defined as "graph" for the graph type of this square
	var theDynamicGraphFunction = graphs_functions_json.retrieveGraphParam(connectors_json.handletotype( retrieveSquareParam(id, 'CH')), retrieveSquareParam(id, "Gt") , "graph");
	
	//qq("for id:"+id+" graph type is "+theDynamicGraphFunction)

	if(theDynamicGraphFunction != null){
		// ok the graph names exists
		window[theDynamicGraphFunction](id);
	}else{
		ww(0, "window["+theDynamicGraphFunction+"] not found for id:"+id);
	}	
	

	if(nudgeChildren == true){
		// Now look for children of mine that need data to inherit
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


function udpateScreenLog(newMsg){

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


//******************************************************************
//******************************************************************
//*********   Supporting Function
//******************************************************************
//******************************************************************	


function cloneTemplate(caller, target){
	// Copy config from "dst_id" and copy to "src_id"
	/// IN : INT source ID, INT dest ID
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+caller+", "+target+")");

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
	deleteData([caller.id])
	
	drawSquares([caller.id])

	drawinBoxes([caller.id])
	//hideOverlay();
	updateurl();

	updateurl();

}


function cloneChildren(caller, target){
	// Copy config from "dst_id" and copy to "src_id"
	// IN : INT source ID, INT dest ID
	// OUT : na
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+caller+", "+target+")");

	// for the calling square, remove existing children first?
	// if(removeChildren == true){
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
		if(newArray[i].Pr == target){
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
		
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+uid+")");

	favourites = connectors_json.handletox(retrieveSquareParam(id, "CH"), "favourites");

	// need to pass in uid and id
	favourite = _.where(favourites, {"uid": uid})[0]
	
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
	deleteData([id])
	
	drawSquares([id])

	drawinBoxes([id])
	updateurl();

}


// push a template to the screen
function pushTemplate(square, template){
	// IN : integer (ID of square to sprout from),  integer (id of master_templates array)
	
	// remove existing children
	var deleteList = new Array();
	deleteList.push(square);
	var loop = true;
	while(loop==true){
		var newList = findChildren(deleteList);
		$.merge(deleteList, newList);
		if(newList.length<1){
			loop=false;
		}
	}		
	for(var j in deleteList){
		// XXX improve this, don't add source in first place?
		if(deleteList[j] != square){
			ww(6, "deleting id:"+deleteList[j]);
			url.squares.splice(squarearraysearch(deleteList[j]), 1);
			workspaceDiv.select("#square_main_"+deleteList[j]).remove();
			deleteData(deleteList[j]);
		}
	}
	
	// copy the prebuilt template, add highestID to each square so it can sit with existing squaers
	highestID = highestSquareID();
	tweakableJSON = new Object;
	$.extend(tweakableJSON, master_templates[template]["structure"]);


	$.each(tweakableJSON, function(i, obj) {
		obj['id']+=highestID;
		if(obj['Pr'] == 1){
			// this it the linking square, point it to it's new master
			obj['Pr']=square;
		}else{	
			obj['Pr']+=highestID;
		}
		url.squares.push(obj);
	});

	// merge Primary square with the new Template
//	url.squares = $.merge(url.squares, tweakableJSON);
	
	// draw 
	drawLines(everyID(), false);
	drawSquares(everyID());	
	drawinBoxes(everyID());
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
		if (url.squares[i].id==id){
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
		ww(6, "Reloading / refreshing data for id:"+ids[i]+" as instructd by "+arguments.callee.caller.name);
		if(GLB.square.reshowLoadingIcon == true){
			graphLoading(ids[i])	
		}
		deleteData(ids[i]); 
	}	
	

	// start the data calculating
	drawinBoxes(ids);
}

// Delete all data for an ID
function deleteData(id){
	// IN : Integer
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	Lockr.rm('squaredata_'+id+"_hash");
	Lockr.rm('squaredata_'+id+"_rawdata");
	Lockr.rm('squaredata_'+id+"_rawdata_");
	Lockr.rm('squaredata_'+id+"_processeddata");		

	wipeSquareStatus([id])

}	


	
// Delete a Square and all it's children
function deleteChain(id, deleteID){
	// IN : Integer of ID to look at.  BOOL whether to delete this ID (true), or just it's children (false)
	
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 
	
	// delete the children
	deleteList = findAllChildren(id);
	for (var i = 0; i < deleteList.length ; i++){
		deleteChildSquare(deleteList[i]);
	}
	
	if(deleteID == true){
		// delete myself
		deleteChildSquare(id);
	}
	
	drawLines(everyID(), false);
	updateurl();
	
}

function deleteChildSquare(id){
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 

	ww(4, "deleting id="+id);

	udpateScreenLog("#"+id+" Deleted");

	url.squares.splice(squarearraysearch(id), 1);

	workspaceDiv.select("#square_main_"+id).remove();
	deleteData(id);
	squaregroup.select("#line_"+id).remove();
}


// recursive 
function findParents(id){
	// IN : int
	// OUT : array of parents
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")"); 

	var currentID = id;
	var newParent=0;
	var parents = [];

	while (1==1){
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
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(findList)+")"); 
	var children = new Array()
	for (var i in url.squares){
		// check if not looking at myself
		if(findList.indexOf(url.squares[i].id) == -1){
			if(findList.indexOf(retrieveSquareParam(url.squares[i].id, 'Pr'))> -1){
				//ww(4, "!"+JSON.stringify(findList)+"       "+retrieveSquareParam(url.squares[i].id, 'Pr')+"    "+findList.indexOf(retrieveSquareParam(url.squares[i].id, 'Pr')));
				children.push(url.squares[i].id);
			}else{
				//ww(4, "£"+JSON.stringify(findList)+"       "+retrieveSquareParam(url.squares[i].id, 'Pr')+"    "+findList.indexOf(retrieveSquareParam(url.squares[i].id, 'Pr')));
			}
		}else{
			//ww(7, "%"+JSON.stringify(findList)+"       "+retrieveSquareParam(url.squares[i].id, 'Pr')+"    "+findList.indexOf(retrieveSquareParam(url.squares[i].id, 'Pr')));
    		}    
	}
	ww(6, "findChildren() found "+JSON.stringify(children));
	return children;
}

function findAllChildren(id){
	// IN : single ID
	// OUT : Array of Integers (combined children IDs), originating ID *NOT* in the return

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(id)+")"); 
	var returnList = new Array();
	returnList.push(id);

	var loop = true;
	while(loop==true){
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

	ww(6, "findAllChildren found "+JSON.stringify(returnList));
	return returnList;
}


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
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+key+", "+recursive+")");

	if(recursive == null || recursive == undefined){
		recursive = true;
	}
	

	// ww(7, url.squares[squarearraysearch(id)]["ds"])   
	var squareLoc = squarearraysearch(id);
	var item = url.squares[squareLoc];

	// The order....
	// if (non inheritable attribute || recursive==false)
	// if (I'm a root square)
	// default to recisrive lookups


	if(item.Pr == 0){

		// first square, must inherit from the pathbar, and not from another square
		if(key=="We"){
			
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
		}else if(key=="Ws"){
			// if(typeof item['Wi'] != 'undefined' && item['Wi'].length>1){
			// 	// reply
			 	return parseInt(item['Wi'][1]);
			// }else{
				// deduce from URL alone (this should be created/validated on page load)
				//  return (-1 * (url.ca.end - url.ca.start));
			// }	
		}else if(key=="Wr"){
			if(typeof item['Wi'] != 'undefined' && item['Wi'].length>2){
				// reply
				return parseInt(item['Wi'][2]);
			}else{
				// deduce from URL alone (this should be created/validated on page load)
				return 0;
			}	
		}else if(key=="CH"){
			//ww(6, "Pr=0 returning CH="+url.squares[i]['CH']+" from url");
			return item['CH'];
		}else if(key=="Ds"){
			//ww(6, "Pr=0 returning Ds="+url.Ds+" from url");
			return item['Ds'];

		}else if(key=="Gt"){
			//ww(6, "Pr=0 returning graphtype=Info from url");
			return item['Gt'];
		}else if(key=="Hx"){
			//ww(6, "Pr=0 returning graphtype=Info from url");
			return "ffffff";
		}else if(/^(raw|processed)data[a-zA-Z0-9_]*$/.test(key)){
			//ww(6, "found '"+key+"' id:"+id+" key:"+key+" "+key+"="+Lockr.get('squaredata_'+id+'_processeddata'));
			return Lockr.get('squaredata_'+id+'_'+key);
		
		}else if(key=="x" || key=="y"){
			// if x or Y is missing, presume 0.  Helps cut down on URL size a inty bit
			if(!item.hasOwnProperty(key)){
				return 0
			}else{
				return item[key];
			}

		}else{
			// no Gp, Pathbar can't handle it?
			//ww(o, "Pr = 0, key = "+key+", no data found?");
			if(typeof item[key] != undefined){
				//qq("returning "+item[key])
				return item[key];

				

				
			}else{
				return null;
			}
		}

	}else if(     (recursive == false  && !/^(raw|processed)data/.test(key) )   || ['Pr', 'Ds', 'x', 'y', 'Sc'].indexOf(key) >= 0){

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
				if(classOf(item[key]).match(/(String|Number|Object|Array)/)){
					return item[key];
				}else{
					return retrieveSquareParam(item.Pr, key,true);
				}
				
		}

	}

	// This is recursive and will look through all parents until an answer is found.
	// ww("retrieveSquareParam id:"+id+" key:"+key);


	
	if(/^(raw|processed)data/.test(key)
		&& ((classOf(Lockr.get('squaredata_'+id+'_'+key)) == "Object")
		|| (classOf(Lockr.get('squaredata_'+id+'_'+key)) == "Array")
		|| (classOf(Lockr.get('squaredata_'+id+'_'+key)) == "String"))){
		// Looking for data, raw, processed, or (raw|processed) with a handle too
		//ww(6, "URL Param requsted and found id:"+id+" key:"+key);
			return Lockr.get('squaredata_'+id+'_'+key);
	}
	
	//nothing left to return, throw error
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"(ERROR "+id+", "+key+")");
	return null

}



function calcGraphTime(id){
	// IN : Integer
	// OUT : Integer

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// array of all parents (original reverses, I want this unreversed) and add my own ID for me to count
	var parents = findParents(id).reverse()
	parents.unshift(id)
	

	totalWe = 0;
	sInAYear = 60*60*24*265;

	for(var i = 0 ; i < parents.length ; i++){
		
		thisWe = retrieveSquareParam(parents[i], "We", false)
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
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+key+", "+cumulative+")");
	
	// We = negative.  Time is relative to the parent (which may also be relative..)
	// We = null. No change to parent
	// We = Positive. Time is absolute EPOCH time reference
	// Ws = is size of time window, should always be negative to relate to We

	if(key=="Ws"){
		alert("Should you be doing a lookup for Ws? (i.e. only calc for We) from:"+arguments.callee.caller.name);
	}

	//ww(6, "calcGraphTime("+id+", "+key+", "+cumulative+")");
	
	// for any other square work it out


	if(retrieveSquareParam(id, "Pr", false) == 0){
		//ww(7, "found a root node, does it have a time? id:"+id+" return val:"+retrieveSquareParam(id, key));
		return (retrieveSquareParam(id, key, true) + cumulative);	

	}else if(retrieveSquareParam(id, key, true) > 1){
		// time frame is absolute
		//ww(7, "Time Absolute id:"+id+" "+key+"="+retrieveSquareParam(id, key));
		return (retrieveSquareParam(id, key, true) + cumulative);
	}else if(retrieveSquareParam(id, key, true) == null){
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

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+xory+", "+cumulative+")");
	// IN : Integer, String (which x or y value), Integer of current relative cord
	// OUT : Integer

	// if asking about id==0 you reached the top, no more to calculate.
	if(id==0){
		return cumulative;
	}else{	
		cumulative += parseInt(retrieveSquareParam(id, xory));
		return calcCord(retrieveSquareParam(id, "Pr"), xory, cumulative);
	}

}

function calcDs(id, cumulative){
	// IN: integer ID of square, Array of either strings, or OBjects (depending what Connector uses for filtering data
	// OUT: array DataSet
	
	
	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+classOf(cumulative)+" "+JSON.stringify(cumulative)+")");

	var thisDs;
	// if asking about id==0 you reached the top, no more to calculate.
	if(id==0){
		return cumulative.reverse();
	}	
	
	// for any other square work it out
	for(var i in url.squares){			
		//ww(7, i+" "+JSON.stringify(url.squares[i]));
		if(url.squares[i]['id']==id){
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


function editNewConnector(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+" ("+typeof(id)+")");
	ww(7, "Connected #"+id+" changed");

	var item = url.squares[squarearraysearch(id)];

	item.Pr = 0;
	
	if(!$("#square_connector_dropdown_"+id).val() == ''){
		item.CH = $("#square_connector_dropdown_"+id).val()
	}
	
	item.Wi[0] = moment($("#square_We_text_"+id).val()).unix();  
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
	updateDataList = new Array();
	updateDataList = findAllChildren(id);
	// add originating ID back in
	updateDataList.push(id);	
	for (var i in updateDataList){
		deleteData(updateDataList[i])
	}
	// recreate data for children squares

	drawLines(everyID(), false);  //line colours have changed
	drawSquares(updateDataList);
	drawinBoxes(updateDataList);
	//hideOverlay();
	updateurl();


}

function addGraphConnector(){
	
	var newID = highestSquareID()+1

	// in UTC
	var thisEpoch = Math.floor(new Date().getTime() / 1000); // UTC
	lastBlockEnd = thisEpoch - (thisEpoch % GLB.square.blocksize)-1; 


	url.squares.push({
			"id": newID ,
			"Pr":0,
			"Gt":"EditSquare",
			"Gp": null,
			"Wi": [lastBlockEnd,-900,0],
	});

	udpateScreenLog("#"+newID+" Connector has been created");
	drawSquares([newID]);
	drawLines([newID], false);
	drawinBoxes([newID]);
	drawLines(everyID(), false);  //line colours have changed
	updateurl();

	// do it here on load, also do it during new square creation
	handle = retrieveSquareParam([newID], 'CH')
	elastic_prep_mappings(handle)

}


function editMe(id){

	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	clearSquareBody(id);
	window[graphs_functions_json.retrieveGraphParam("builtin_graphs", "EditSquare", "graph") ](id);

	// duplicate.  remove.
	// $("#square_graph_dropdown_"+id).val(retrieveSquareParam(id, "Gt", false));
	// $("#square_We_dropdown_"+id).val(retrieveSquareParam(id, "We"));
	// $("#square_Ws_dropdown_"+id).val(retrieveSquareParam(id, "Ws"));
	// $("#square_Wr_dropdown_"+id).val(retrieveSquareParam(id, "Wr"));
	// if(retrieveSquareParam(id, "Ds") != null){
	// 	$("#square_Ds_dropdown_"+id).val(atob(retrieveSquareParam(id, "Ds") ));
	// }

}

// Apply changes inputted by user	
function editSquare(id){
	// IN : String (which attribute to modify)
	// OUT : na (but calls other functions
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

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
	updateDataList = new Array();
	updateDataList = findAllChildren(id);
	// add originating ID back in
	updateDataList.push(id);	
	
	for (var i in updateDataList){
		deleteData(updateDataList[i])
		
	}
	// recreate data for children squares
	drawLines(everyID(), false);  //line colours have changed
	wipeSquareStatus(updateDataList)
	drawSquares(updateDataList);
	drawinBoxes(updateDataList);
	//hideOverlay();
	updateurl();

}
	


// // Hide the "Edit Square" Overlay
// function hideOverlay(){

// 	// hide the overlay
// 	$('#editsquareform').css('display', 'none');
// 	$('#templatediv').css('display', 'none');
// 	$('#overlay_connector').css('display', 'none');
// 	// clean the inputs
// 	$('#form_time input[type=radio]').attr("checked", false);
// 	$('#form_graph input[type=radio]').attr("checked", false);
// 	$('#textareapb').attr("readonly", false);
// 	$('#modify_time').attr("disabled", true);
// 	$('#modify_graph').attr("disabled", false);
// 	$('#modify_pb').attr("disabled", true);	
// }

// Build a list of every square ID
function everyID(){
	// OUT : Array of Integers
	
	idlist = [];
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

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	
	var stringFormat = "YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]"
	kibanaTo   = moment(to, "X").utc().format(stringFormat);
	kibanaFrom = moment( from , "X").utc().format(stringFormat);

	// var Ds = calcDs(id, []);
	Ds = clickObjectsToDataset(id)

	var fields=["*"]
	var limit = 10000;

	var elasticQuery = elastic_query_builder(id, from, to, Ds, fields, limit, false, null, true)['query'];

	dst = connectors_json.handletodst( retrieveSquareParam(id, 'CH'))
	// XXX remove port number, in config we should split that out as two fields? (or have a new field for the pivot address separate?)
	elasticIP = dst.split(":")[0]

	path = "https://"+elasticIP+"/app/kibana#/discover?"
	urlStruct = "_g=" + rison.encode({
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

	// qq(elasticQuery)
	// qq(JSON.stringify(elasticQuery))
	// qq( encodeURI(JSON.stringify(elasticQuery)))
	// qq(encodeURIComponent(JSON.stringify(elasticQuery)))

	urlStructJSON = {
		//"columns": ["_source"],
		"filters": [{
				"$state": {
					"store": "appState"
				},
				"meta": {
					"alias": null,
					"disabled": false,
					"index": "*:logstash-*",
					"key": "query",
					"negate": false,
					"type": "custom",
					"value": JSON.stringify(elasticQuery)
				},
				"query": elasticQuery
				
			}
		],
		"index": "*:logstash-*",
		"interval": "auto",
		"query": {
			"language": "lucene",
			"query": ""
		},
		"sort": ["@timestamp", "desc"]
	}
	thisQuery = "&_a=" + rison.encode(urlStructJSON)

	var kibanaQuery = path + urlStruct + thisQuery

	// qq(kibanaQuery)

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
	newSquare.CH = retrieveSquareParam(id, "CH")
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
	
// Present ways to bookmark the current page in different ways
function bookmarks(){
	alert("went to bookmarks")
	return
	var string = "<span class='limitedalertify'>";
	
	/////////////
	
	string += "<span class='graph_info_title'>Exact URL</span><br>Exact URL, may include 'relative/soft' time references.  Ideal for Live Monitoring, Wallboards, Bookmars.<br>";
	string += "<div class='divscroll'>"+window.location.href.replace(/\/#.*$/, "/#"+btoa(JSON.stringify(url))) +"</div><br>";
	
	/////////////
	
	var adjustedurl = jQuery.extend(true, {}, url);
	for (var j in adjustedurl.squares){

	}
	
	string += "<br><br><span class='graph_info_title'>Dereferenced URL</span><br>Adjusted so that Squares are locked to absolute timeframes.   Ideal for Investigations/Tickets/Case management.<br><br>";
	string +=  "<div class='divscroll'>"+window.location.href.replace(/\/#.*$/, "/#"+btoa(JSON.stringify(adjustedurl)))+"</div><br>";

	/////////////
	
	var trimmedurl = jQuery.extend(true, {}, url);
	trimmedurl.squares.splice(squarearraysearch(1), 1);

	string += "<br><br><span class='graph_info_title'>Template</span><br>The Structure of Squares (not id = 1).  This 'template' can be applied/pushed to future investigations.  To deploy, enter this into templates.json<br><br>";
	string += "<div class='scrolly'>"+(JSON.stringify(trimmedurl.squares))+"</div>";

	string += "</span>";
	alertify.alert(string);

}

// populate the Template overlay
function doTemplates(){
	for (var j in master_templates){
		$("#templateshere").append("<div class='fleft twist'><input type='button' value='Apply' onClick='pushTemplate(1, "+j+")' /></div><div class='fleft twist'>"+master_templates[j]["Desc"]+"</div><div class='clr'></div>");
		
	}		
}


// Display the Template Overlay
function showConnectorDiv(id){
	// IN : square ID
	
	// show overlay form
	//d3.select("#transparent_screen").style("display", "block");
	//d3.select("#overlay_connector").style("display", "block");

}

function compileGraphs(){
	// get all graphs and add to the overlay
	$.get( "./compile_graphs.php", function( data ) {
		// results are needed elsewhere, so store them outside this function
		$.each(data, function(k, v) {
			existing_json = graphs_jsfiles_json.get_graphs_json();
			existing_json[k] = v;
			graphs_jsfiles_json.set_graphs_json(existing_json);
		})
		// read the results back and load JS
		jsStilltoLoad = 0;
		
		$.each(graphs_jsfiles_json.get_graphs_json(), function(k, v){
			$.each(v, function(i, val){
				jsStilltoLoad++;
				$.getScript("./graphs/"+val )
				.done(function( script, textStatus ) {
					jsStilltoLoad--;
					// multiple of these, finishing at different times, so after each load so if any left to do.  If not, populate graphs?
					if(jsStilltoLoad==0){
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
			existing_connectors = connectors_json.get_connectors_json();
			existing_connectors[k] = v;
			connectors_json.set_connectors_json(existing_connectors);
			
		})

		// compileGraphs and conmpileConnectors finished (moved this functionality to promises???
		initialLoad();
				
	});

}

function initialLoad(){
	// if you change page, squares will try and use other pages data, so check
	ww(5,"***Check Saved Data Hash***");
	
	var tmpEveryID = everyID();
	for(var i in tmpEveryID){
		checkSavedDataIsMine(tmpEveryID[i]);
	}
	
	ww(5,"***PageLoad drawLines ***");
	drawLines(everyID(), false);

	ww(5,"***PageLoad drawSquares ***");
	drawSquares(everyID());

	// don't like doing this here. Use promises to look for downloads?
	ww(5,"***PageLoad drawinBoxes***");
	drawinBoxes(everyID());

	for(var i in tmpEveryID){
		id = tmpEveryID[i]
		
		if(retrieveSquareParam(id, 'Pr') == 0){
			// I'm a root, ensure my database "mappings" are prepared for speed
			if(connectors_json.handletotype( retrieveSquareParam(id, 'CH')) == "elastic"){
				
				handle = retrieveSquareParam(id, 'CH')
				
				// do it here on load, also do it during new square creation
				elastic_prep_mappings(handle)
			}
		
		}
	}

}

function resize_workspace(){
	$("#workspaceDiv").css("width", "99%");
	$("#workspaceDiv").css("height", document.getElementById('workspacecontainer').clientHeight-10);
}

function qqLoggingChange(){
	if(GLB.qqLogging == 7){
		GLB.qqLogging = 0;
	}else{
		GLB.qqLogging++;
	}
}





// used to make flares from nested data of different depths
//https://stackoverflow.com/questions/20913689/complex-d3-nest-manipulation
//http://jsfiddle.net/DcHyp/3/
// for usage look at a graphs "raw to processed2"
// removed



	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////

$( document ).ready(function() {


	
	
	//////////////////////////////
	// squares-ui / d3 stuff
	//////////////////////////////
	
	var zoom = d3.zoom()
		.scaleExtent([.03, 10])
		.on("zoom", zoomed)
		.on("end", zoomEnd)
		

	function zoomed(){	
			//ww(6,"zooooomed");
			// move and scale the "squaregroup" for zoom effect. Floor it to shorten URL
			squaregroup.attr("transform",  d3.event.transform)

			// squaregroup
			// {"_groups":[[{"__zoom":{"k":0.43527531847787715,"x":545.0557806151778,"y":632.5716410660139}}]],"_parents":[{}]}

			// squaregroup.attr("transform")			
			// translate(543.0557806151778,629.5716410660139) scale(0.43527531847787715)

			roundingZero = 1
			roundingTwo = 100

			zoomString = squaregroup.attr("transform")	
			zoomRegex = /[0-9\.]+/g
			zoomMatches = zoomString.match(zoomRegex)
			
			
			newZoomString = "translate(" + Math.round((zoomMatches[0]) * roundingZero) / roundingZero + "," + Math.round((zoomMatches[1]) * roundingZero) / roundingZero + ") scale("+Math.round((zoomMatches[2]) * roundingTwo) / roundingTwo+")"

			// save this zoom/transform base64 into the URL for pageload/bookmarks etc
			url.Zt = newZoomString;
		
			updateurl();


	}
	function zoomEnd(){
		updateurl();
	}

	workspaceDiv = d3.select("#workspaceDiv")
		.call(zoom);

	// used to contain the squares and transform them as one
	squaregroup = workspaceDiv.append("g")
		.attr("id", "squaregroup")

	if(url.Zt!=null){
		var newTransform = url['Zt'].split(/[\(\) ,]/);;

		zoom.transform(squaregroup, d3.zoomIdentity.translate(newTransform[1], newTransform[2]).scale(newTransform[5]))
		zoom.transform(workspaceDiv, d3.zoomIdentity.translate(newTransform[1], newTransform[2]).scale(newTransform[5]))
	}

	// used to store all the lines connecting squares		
	linesgroup = d3.select("#squaregroup")
		.append("g")
		.attr("id", "linegroup");	
	

	// auto update canvas size
	$(window).resize(function() {
		resize_workspace();
	});
	resize_workspace();

	
	



	//////////////////////////////
	// ThreeJS  stuff
	//////////////////////////////
	if(GLB.threejs.enabled == false){
		// go straight to render
		// otherwise wait until threeJS is loaded
		compileGraphs();
	}else{

 		$.getScript('https://threejs.org/build/three.js', function() { 
			 
			// qq("three.js loaded, loading further libraries") 
			$.getScript('./lib/stats.js', function() { qq("stats.js loaded") });
			$.getScript('./lib/threex.rendererstats.js', function() { qq("renderstats.js loaded") });
			
			$.getScript('./Three/dat.gui.js', function() { qq("dat.gui.js loaded") });
			$.getScript('./Three/OrbitControls.js', function() { qq("OrbitControls.js loaded") });
			
			$.getScript('./myThree.js', function() { 
				
				qq("myThree.js loaded") 
			
				if(GLB.threejs.realTimeRender == true){
					// set off real time rendering
					animate_Three();
				}else{
					// setTimeout for slower refresh, but better on low spec machines
					setTimeoutThree(GLB.threejs.notRealTimeRenderFrequency);
				}
				
				compileGraphs();

			});

			threeRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
			// // XXX goes crazy if OS fonts are 125%... needs reviewing!!!
			// //threeRenderer.setPixelRatio(window.devicePixelRatio);

			// //container = document.getElementById("workspacecontainer")
			// //threeRenderer.setSize( container.clientWidth, container.clientHeight );

			threeRenderer.domElement.id = 'workspacecanvas';
			container = document.getElementById( 'workspacecontainer' );
			container.appendChild( threeRenderer.domElement );

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
						ww(7, "square_"+square_id+" not in render scope, RETURN");
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

			if(GLB.threejs.showperformance == true){
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








});
