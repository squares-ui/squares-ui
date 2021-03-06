if(GLB.useStrict){
	"use strict";
}

// SQUARES attributes 
// Pr = [] of parent ID.  PR[0] = main parents, Pr[1] and onwards are "or" semi parents 
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
// Fi = Fields scripting (elastic only)
// 




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
		// ee(" -> "+arguments.callee.name+"['"+type+"']['"+graphshort+"']['"+value+"']");

		if(graphshort === null ){
			// no graph set, so relax
			return null;

		}else if(typeof this.local_json["builtin"][graphshort] !== 'undefined'){
			// if the GraphType is a "builtin" then hijack and return.  
			// this allows "builtin" graphs to be present in any technology square chain 
			return this.local_json["builtin"][graphshort][value];

		}else if(this.local_json[type][graphshort] && typeof this.local_json[type][graphshort][value] !== null){
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



function updateurl(){
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");

	var existingUrl = window.location
	var newUrl = existingUrl.protocol + "//" + existingUrl.hostname + ":" + existingUrl.port + existingUrl.pathname + "#" + btoa(JSON.stringify(url))

	window.history.replaceState("", "Squares-UI", newUrl);
	
}	
	
function updaterefresh(){
	// //ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	var newurl = window.location.href.replace(/\/#.*$/, "/#"+btoa(JSON.stringify(url)));
	//location.replace(newurl);
	window.history.pushState("", "Squares-UI", newurl);
}

function wipereset(){
	// //ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(url)+")");
	deleteAllStoredData()


	// currentLocation = window.location
	// url = currentLocation.protocol + "//" + currentLocation.hostname + ":" + currentLocation.port + currentLocation.pathname + "#" + btoa('{"squares":[],"Zt":""}')
	// $(location).attr('href',url);

	url = {}
	url.v = "1"
	url.squares =  []
	url.Zt = "translate(431,311) scale(0.5)"

	updateurl()
	
	initialLoad()

	addGraphConnector({});
	window.location.reload()

}
		


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
errorStatus['page'] = {"info":[], "critical":[], "warning":[]}
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

	
	// qq("--------")
	// ee(" -> "+arguments.callee.name+"("+d.id+")");

	if(Math.abs(d3.event.dx) > GLB.square.dragSensitivity || Math.abs(d3.event.dy) > GLB.square.dragSensitivity){
		// var wasMoved = true;

		deleteLines();

		// the X/Y are positions on the monitors X/Y, but also relative to the parent coords, which is relative to the d3 translation, which is affected by the zooom/scale	
		var newcoords = d3.mouse(d3.select('#squaregroup').node());
		d3.select(this.parentNode.parentNode.parentNode.parentNode)
			.attr("x", function(d,i){
				var strippedName = parseInt(this.id.replace(/^square_main_/g,""));
				// var parentId = url.squares[squarearraysearch(strippedName)].Pr[0];
				var parentId = retrieveSquareParam(strippedName, "Pr", false) ;
				var newX = snapToGrid(newcoords[0]-calcCord(parentId, 'x', 0));
				// qq("(dragged) id:"+strippedName+", Pr:"+parentId+", newX:"+newX)
				d.x = newX
			})
			.attr("y", function(d,i){
				var strippedName = parseInt(this.id.replace(/^square_main_/g,""));
				// var parentId = url.squares[squarearraysearch(strippedName)].Pr[0];
				var parentId = retrieveSquareParam(strippedName, "Pr", false) ;
				var newY = snapToGrid(newcoords[1]-calcCord(parentId, 'y', 0));
				// qq("(dragged) id:"+strippedName+", Pr:"+parentId+", newY:"+newY)
				d.y = newY
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
		drawLines(redrawList, false);
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





// Duplicate a square when requested
function duplicateSquare(id, newObject){
	// IN : Integer
	// .extend clones the object, rather than linking to it
	ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+JSON.stringify(newObject)+")");

	// clone the original
	var clone = jQuery.extend({}, url.squares[squarearraysearch(id)]);


	// empty the criteria, so we inherit our details from above
	delete clone.CH;
	delete clone.Co;
	delete clone.Gt;
	delete clone.Gp;
	delete clone.Wi;
	delete clone.Ds;
	delete clone.Cs;
	delete clone.Fi;
	delete clone.Pr;
	delete clone.x;
	delete clone.y;

	clone.Pr = []
	clone.Pr.push(id);
	clone.x = 800
	clone.y = 800
		
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
	

function addGraphConnector(square){
	// handle : optional, "CH" from the connector json

	// in UTC
	var thisEpoch = Math.floor(new Date().getTime() / 1000); // UTC
	var lastBlockEnd = thisEpoch - (thisEpoch % GLB.square.blocksize)-1; 

	var mo = {
		
		"Pr":[0],
		"Gt":"EditSquare",
		"Gp": null,
		"Wi": [lastBlockEnd,-900,0],
	}

	// if(name){
	// 	mo['Co'] = name
	// }

	$.extend(mo, square)

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
			var newX = calcCord(obj['Pr'][0], 'x', relX)
			var newY = calcCord(obj['Pr'][0], 'y', relY)
			if(loopX === newX && loopY === newY ){
				// qq("new square location used")
				clash = true
			}
		}	

		// if(isRelativePosTaken(obj['Pr'], relX, relY) === true){
		if(clash === true){
			// qq(relX+":"+relY+"  taken, increasing")
			relX += 100
			relY += 100
		}else{
			// qq(relX+":"+relY+"  not taken, using")
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

// function futureHalfHeight(id){
// 	// XXX redner a square on page load, then measure it?
// 	// XXX do that for each square css class?
// 	return 500;
// }
// function futureHalfWidth(id){
// 	return 500;
// }




function drawLines(ids, drawBezier){
	// IN : Array of square IDs to draw for
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(ids)+")");

	deleteLines();

	var relationships = []

	//map out all relationships
	_.each(url.squares, function(square){

		if(square.Pr[0] != 0){
			_.each(square.Pr, function(pr, i){
				var tags = []
				// the first parent ID in the array is the "master" 
				// subsequent parent IDs are "or" parents
				if(i == 0){
					tags.push("parent")
				}
				relationships.push({"src": square.id, "dst": pr, "tags":tags})
			})
		}

	})
	// qq(relationships) 
	// [{"src":2,"dst":1,"tags":["parent"]},


	// create the group
	var lines = d3.select("#linegroup")
	.selectAll(".path_all")
    	.data(relationships)
	.enter();

	
	// loop through the lines adding details
	lines.append("path")
		.attr("id", function(d){ return "path"+d.src})
		.attr("class",  function(d){ 
			var classString = ""
			
			classString += getLineCol(d.src)
			
			classString += " path_all"

			if(_.contains(d.tags, "parent")){
				classString += " path_solid"
			}else{
				classString += " path_dotted"
			}
			return classString
		})
		.attr("d", function(d){ 

			// http://blogs.sitepointstatic.com/examples/tech/svg-curves/cubic-curve.html
			var myRelX = calcCord(d.src, 'x', 0);
			var myRelY = calcCord(d.src, 'y', 0);
			var myBendX = 0;
			var myBendY = 0;
			var prBendX = 0;
			var prBendY = 0;
			if(d.dst === 0){
				var prRelX = myRelX;
				var prRelY = myRelY;
			}else{
				var prRelX = calcCord(d.dst, 'x', 0);
				var prRelY = calcCord(d.dst, 'y', 0);
			}	
			var bendX = 0.4;
			var bendY = 0.1
			myBendX = myRelX - ((myRelX -prRelX)* bendX);
			myBendY = myRelY - ((myRelY -prRelY)* bendY);
			prBendX = prRelX + ((myRelX -prRelX)* bendX);
			prBendY = prRelY + ((myRelY -prRelY)* bendY);

			if((GLB.drawLineBezier===true || drawBezier===true )&& d.dst!=0){
				//draw the dots for bezier curve
				// I suppose this could be done in it's own ".append", but then all the abve maths needs doing again?
				squaregroup
					.append("line")
					.classed("bezier_line", "true")
					.attr("x1", myRelX).attr("y1", myRelY).attr("x2", myBendX).attr("y2", myBendY)
				
				squaregroup
					.append("line")
					.classed("bezier_line", "true")
					.attr("x1", prBendX).attr("y1", prBendY).attr("x2", prRelX).attr("y2", prRelY)
			}

			return "M"+myRelX+","+myRelY+" C"+myBendX+","+myBendY+" "+prBendX+","+prBendY+" "+prRelX+","+prRelY
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
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+JSON.stringify(idlist)+")");

	
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
		.classed("newsquare", true)  //tmp marker, don't remove

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
		.classed("squareShine", true)
		

		////// Ds/filter "Brick"
		var squareFilter = square_container.append("xhtml:div")
			.classed("square_menu_filter", true)
			.classed("square_menu", true)
			.classed("square_menu_text", true)
			.attr("id", function(d){ return "square_filter_"+d.id })
			.text(function(d){ 
				
				var textOut = []

				var thisDs = retrieveSquareParam(d.id, 'Ds', false)
				if(thisDs !== undefined){					
					obj = JSON.parse(atob(thisDs))				
					_.each(obj['compare'], function(obj,i){
						textOut.push("Dataset: "+_.values(obj)[0])
					})
				}

				var filter = retrieveSquareParam(d.id,"Fi",false)
				if(filter !== undefined){				
					stripped = filter.replace(/.*'].value./,'')
					textOut.push("Filter: "+stripped)
				}


				return textOut.join(", ")
			})
			.on("mousedown", function() { d3.event.stopPropagation(); })
			;	
			

		////// ID and time[from, to] Brick





		////// menu Brick
		var menubarcontrols = square_container.append("xhtml:div")
			.classed("square_menu_icons", true)
			.classed("square_menu", true)


			// Apply Template
			var template = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/organization.svg")	
				.attr("title", "Cloning and Templates")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_template", true)
				.on("click", function(d){  showTemplateDiv(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;

			// Edit
			var edit = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/edit.svg")	
				.attr("title", "Edit Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_edit", true)
				.on("click", function(d){ editMe(d.id);  })
				.on("mousedown", function() { d3.event.stopPropagation();  })
				;	

			// Info
			var info = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/list.svg")	
				.attr("title", "Query Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_info", true)
				.on("click", function(d){ graphAboutMe(d.id); })
				.on("mousedown", function() { d3.event.stopPropagation(); })
	        		// .on("mouseout", function(d){ drawinBoxes([d.id]) })
				;	

			// Move
			var move = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/move-1.svg")	
				.attr("title", "Drag square to move")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_move", true)
				.attr("id", function(d){ return "square_menu_move_"+d.id })
				.on("mousedown", function() { d3.event.stopPropagation(); })
					.call(drag)
				;				







			// Clone
			var clone = menubarcontrols.append("img")
				.attr("src", "squares-ui-icons/126466-multimedia-collection/svg/copy.svg")
				.attr("title", "Create Child Square")			
				.classed("square_menu_icon", true)
				// .classed("square_menu_icon_clone", true)
				.on("click", function(d){ 
					var newId = duplicateSquare(d.id, {"x": 1000}); 
					// editMe(newId); 
				})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;	



			// Reload
			var reload = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/126466-multimedia-collection/svg/reload.svg")	
				.attr("title", "Reload data and redraw Square")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_reload", true)
				.on("click", function(d){ reloadData([d.id])}  )
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

				
				
			// Pivot to 
			var pivot = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/orientation.svg")	
				.attr("title", "Pivot to Kibana")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_pivot", true)
				.on("click", function(d){pivotToX(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;							

				

			// Apply scale
			var scale = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/search.svg")	
				.attr("title", "Scale up")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_scale", true)
				.on("click", function(d){scaleSquare(d.id);})
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;				

			// Bring "to top"
			var toBottom = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/159687-interface-icon-assets/svg/download-1.svg")	
				.attr("title", "Order: Send to Bottom")			
				.classed("square_menu_icon", true)
				.classed("square_menu_icon_tobottom", true)
				.on("click", function(d){ moveToBottom(d.id); })
				.on("mousedown", function() { d3.event.stopPropagation(); })
				;							
				
			// Status
			var status = menubarcontrols.append("img")
				.attr("src", "./squares-ui-icons/215482-creative-outlines/svg/heart.svg")	
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
				.attr("src", "./squares-ui-icons/126466-multimedia-collection/svg/garbage.svg")	
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
	// var WeWs = square_container.append("xhtml:div")
	// 	.classed("square_menu_WeWs", true)
	// 	.classed("square_menu", true)
	// 	.on("mousedown", function() { d3.event.stopPropagation(); })

	// 		// Square ID
	// 		var squareDivID = WeWs.append("div")
	// 			.classed("square_menu_text", true)
	// 			.classed("fsquare_menu_WeWs_id", "true")
	// 			.text(function(d){ return "ID : #"+d.id })
	// 			.on("mousedown", function() { d3.event.stopPropagation(); })
	// 			;				

	// 		// Square Times
	// 		var squareTimes = WeWs.append("div")
	// 			.attr("id", function(d){ return "square_WeWs_"+d.id })
	// 			.classed("square_menu_text", true)
	// 			.classed("fsquare_menu_WeWs_times", "true")
	// 			.text(function(d){ return "#"+d.id })
	// 			.on("mousedown", function() { d3.event.stopPropagation(); })
	// 			;	


	// Square ID
	var squareDivID = square_container.append("div")
		.classed("square_menu_text", true)
		.classed("square_menu_WeWs_id", "true")
		.text(function(d){ return "ID : #"+d.id })
		.on("mousedown", function() { d3.event.stopPropagation(); })
		;				

	// Square Times
	var squareTimes = square_container.append("div")
		.attr("id", function(d){ return "square_WeWs_"+d.id })
		.classed("square_menu_text", true)
		.classed("square_menu_WeWs_times", "true")
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
			

			// shift is to offset the width/height of the box
			var shiftX = -0.5 * document.getElementById("foreignObject_"+d.id).clientWidth;
			var shiftY = -0.5 * document.getElementById("foreignObject_"+d.id).clientHeight;			
			// XXX MAGIC NUMBER ALERT.... why is this not 50% transform  ????
			// Meh, works for now (guilt)
			shiftX = -401;
			shiftY = -351;

			var oldX = calcCord(d.id, 'x', 0)
			shiftedX = oldX + shiftX
			
			var oldY = calcCord(d.id, 'y', 0)
			shiftedY = oldY + shiftY
			
			// qq("(drawSquares) id:"+d.id+", X:"+shiftedX+" Y:"+shiftedY)
			
			return "translate("+shiftedX+", "+shiftedY+")"
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
		errorStatus['squares'][id] = {"info": [], "critical":[], "warning":[]}
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

		// var tooltip = [errorStatus['squares'][id]['critical'].join(", "), errorStatus['squares'][id]['warning'].join(", "), errorStatus['squares'][id]['info'].join(", ")].join(", ")

		var allMsgs = []
		_.each(errorStatus['squares'][id]['critical'], function(msg){
			allMsgs.push(msg)
		})
		_.each(errorStatus['squares'][id]['warning'], function(msg){
			allMsgs.push(msg)
		})
		_.each(errorStatus['squares'][id]['info'], function(msg){
			allMsgs.push(msg)
		})

		$('#square_status_img_'+id).prop('title', allMsgs.join(", "))

		//oppurtunistic return
		return allMsgs
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


	for (var i in ids){
		
		let id = ids[i]
		// qq("drawinBoxes("+id+")")

		renderSquareStatus(id)
	
		////// draw the bottom text
		var thisDate = new Date();
		var thisEpoch = Math.floor(thisDate.getTime() / 1000); 
		
		// keep times in epoch, but adjut for this user
		// no need to apply our timezone offset agaisnt thisWe, as moment already does that for us
		var thisWe = (calcGraphTime(id) );
		var thisWs = retrieveSquareParam(id, "Ws", true);
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


		if(theResult && theData){
			// Hash checks out, data exists OR 
			// qq("drawinBoxes("+id+"): saved data is good")
			callTheGraph(id, true);
		
		}else{
			
			var thisType = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "type")			
			var thisGT = retrieveSquareParam(id, "Gt")


			// delete all saved data, , get raw data, save it, raw_to_processed, save it,
			deleteStoredData([id])
				.catch(e => ww(0, e));
			
			//save new hash
			saveNewData(id, "hash", "", createSquareHash(id))
				.catch(e => ww(0, e));
			
			// qq("pre .then for id:"+id)

			// raw to processed
			// qq("window[populate] id:"+id)
			window[graphs_functions_json.retrieveGraphParam(thisType, thisGT , "populate") ](id)
			.then(async function(values){
				
				// JS Promise only returns one variable.  So the square 'id' is smuggled in the first Promise.
				// extract and shift, then re calculate connector, type, graph type, etc
				var thisId = values[0]
				values.shift()

				//recalculate as this is async
				var thisName = retrieveSquareParam(id, 'Co', true)
				var thisType = await nameToConnectorAttribute(thisName, "type")			
				var thisGT = retrieveSquareParam(id, "Gt")

				var dataToProgess = true

					
				dataToProgess = false
				_.each(values, function(value){	


					if(value['data'] !== null){
						
						// set a marker that something was found
						dataToProgess = true

						// save the raw data?
						if(GLB.saveRawData == true){
							saveNewData(value.id, "raw", value.name, value.data)
						}
						
						// set square health status
						if(value.hasOwnProperty("status") && value['status'].length > 0){
							addSquareStatus(thisId, "warning", value['status'])
						}

						if(value['data'].hasOwnProperty("hits") && value['data']['hits']['total']['value'] == 10000){
							addSquareStatus(thisId, "warning", "Max hit count reached (10,000)")
						}

						// add basic stats to the graph
						if(value['data'].hasOwnProperty("took")){
							addSquareStatus(thisId, "info", "took "+value['data']['took']+"ms")
						}

						if(value['data'].hasOwnProperty("hits")){
							addSquareStatus(thisId, "info", value['data']['hits']['total']['value']+" hits")
						}
						
						
						if(value['data'].hasOwnProperty("aggregations")){
							aggTotal = 0
							_.each(value['data']['aggregations']['time_ranges']['buckets'], function(bucket){
								aggTotal += bucket['doc_count']
							})
							addSquareStatus(thisId, "info", aggTotal+" aggs")
						}
					}
				})

			


				var thisFunc = graphs_functions_json.retrieveGraphParam(thisType, thisGT , "rawtoprocessed")

				// Does data exist?  Or maybe the graph requires no Promises (e.g. UpdateCountdown)
				if(dataToProgess || values.length==0){
					// qq("drawing id:"+id+" ("+thisType+"."+thisGT+"="+thisFunc+") dataToProgess:"+dataToProgess+", vales.length:"+values.length)					
					

					var procData
					// in demo mode, use precalcualted data, do not attmept to process anything
					if(GLB.demoMode && thisName == "Dummy"){
						procData = demoResponseElasticData(thisGT)
					}else{
						procData = await window[graphs_functions_json.retrieveGraphParam(thisType, thisGT , "rawtoprocessed") ](thisId, values)						
					}
					
					saveNewData(thisId, "processed", "", procData)
						.catch(e => ww(0, "saveNewData: id:"+thisId+", error:"+e));
					

					callTheGraph(thisId, true);
				}else{
					// Only report the issue of the first Promise error?  Better way to represent errors of each Promise?
					// qq("not drawing id:"+id+" ("+thisType+"."+thisGT+"="+thisFunc+") dataToProgess:"+dataToProgess+", vales.length:"+values.length)
					graphGraphError(thisId, JSON.stringify(values[0].error))
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

	
	var thisType = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "type")			
	
	// call the function that is defined as "graph" for the graph type of this square
	var theDynamicGraphFunction = graphs_functions_json.retrieveGraphParam(thisType, retrieveSquareParam(id, "Gt") , "graph");
	
	//qq("for id:"+id+" graph type is "+theDynamicGraphFunction)

	if(theDynamicGraphFunction != null){
		// ok the graph names exists
		
		// ThreeJS not enabled in config file
		if(graphs_functions_json.retrieveGraphParam(thisType, retrieveSquareParam(id, "Gt") , "requireThreeJS") == true && GLB.threejs.enabled == false){
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


function udpateScreenLog(newMsg){

	// if (document.location.href.indexOf('scripted_fields.html') === -1){ 
		
		// trim too many logs and add enw log
		if(screenLog.length>GLB.screenLogMax){
			screenLog.shift();
		}
		screenLog.push(newMsg);

		//update screenLog
		$("#screenLog").html(screenLog.join("<br>"));

		// scroll div to bottom
		$("#screenLog").scrollTop($("#screenLog")[0].scrollHeight);
	// }
}



//******************************************************************
//******************************************************************
//*********   Builin graph types
//******************************************************************
//******************************************************************	
function clearSquareBody(id){
	// empty possible bodies, probably needs optimising
	// XXX standardise, accept an array not single number
	$("#square_"+id).remove();
	$("#square_holding_"+id).remove();
	$("#square_nodata_"+id).remove();
	$("#square_error_"+id).remove();
}
function editMe(id){
	clearSquareBody(id);
	window[graphs_functions_json.retrieveGraphParam("builtin", "EditSquare", "graph") ](id);
}
function graphGraphError(id, msg){
	clearSquareBody(id);
	var data = {"msg": msg, "image": "./squares-ui-icons/159687-interface-icon-assets/png/cancel.png"}
	window[graphs_functions_json.retrieveGraphParam("builtin", "squareerror", "graph") ](id, data);
}
async function graphAboutMe(id){
	clearSquareBody(id);
	var data = null
	window[graphs_functions_json.retrieveGraphParam("builtin", "aboutme", "graph") ](id, data);
}
function showTemplateDiv(id){
	clearSquareBody(id);
	window[graphs_functions_json.retrieveGraphParam("builtin", "Templates", "graph") ](id);
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
		if(newArray[i].Pr[0] === target){
			newArray[i].Pr[0] = caller;
		}else{
			newArray[i].Pr[0] += tmpHighestSquareID;
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

	// find UID from favourites
	var favourite = _.where(_.flatten(_.values(GLB.favourites)), {"uid": uid})[0]
	
	
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
	
	if( retrieveSquareParam(id, 'We', false) != null ){
		// Time not null);
		return "line_colour_one";
	}else if( retrieveSquareParam(id, 'Ds', false) != null ){
		// DataSet not null
		return "line_colour_two";
	}else if( retrieveSquareParam(id, 'Gt', false) !=""){  
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
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	
	var failedMatches = []
	
	for(var i in url.squares){
		if (url.squares[i].id===id){
			// qq("squarearraysearch match id:"+id+" at squareId:"+url.squares[i].id+" i:"+i)
			return i;
		// }else{
			// failedMatches.push("("+typeof(url.squares[i].id)+")"+url.squares[i].id+"!=("+typeof(id)+")"+id)
		}
	}
	// qq("squarearraysearch no match "+failedMatches.join(" | "))
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
	// IN : Integern

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
	
	
	// todo XXX need to go through square "Pr" removing "or" links to me


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



// function findAllParentPaths(id){
// 	// IN : integer ID
// 	// OUT : multiple arrays, eachis a different path to root, [[4,3,2,1],[5,2,1],]
// 	return findAllParentPathsRecursive(retrieveSquareParam(id, "Ps", false), [], [])
// }



// function findAllParentPathsRecursive(ids, currentPath, masterReturn){
// 	_.each(ids, function(id){
// 		currentPath.push(id)
// 	})
// }	

function addRemoteDataSourceToCookie(id){

	newConnectors($("#square_remoteDataSource_name_"+id).val(), $("#square_remoteDataSource_dst_"+id).val(), $("#square_remoteDataSource_type_"+id).val(), $("#square_remoteDataSource_templates_"+id).val())


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
		ww(0, "getSavedData :"+error);
	}

})


var saveNewData = Dexie.async(function* (id, keyType, keyName, value) {	
	// ee(" -> "+arguments.callee.name+"("+id+", "+keyType+", "+keyName+":~"+roughSizeOfObject(value)+"Bytes")

	try {
		yield db.squares.put({squareid: id, keyType: keyType, keyName:keyName, data: value})                
	} catch (error) {
		ww(0, "saveNewData :"+error);
	}

})




var deleteSavedData = Dexie.async(function* (id, keyType, keyName) {
	// ee("deleteSavedData ("+id+", "+keyType+")"); 
	try {
		yield db.squares.get({squareid: id, keyType: keyType, keyName: keyName})
	} catch (error) {
		ww(0, "deleteSavedData :"+error);
	}
})


var deleteStoredData = Dexie.async(function* (ids) {
	// ee("deleteStoredData ("+JSON.stringify(ids)+")"); 
	try {
		yield db.squares.where('squareid').anyOf(ids).delete()
	} catch (error) {
		// ww(0, "deleteStoredData :"+error);
	}
})

function deleteAllStoredData(){
	// clear the indexeddb table
	ww(1, "Flushing Data")
	db.squares.clear()
}




function saveMappingsData(dst, indexPattern, value){
	ee(" -> "+arguments.callee.name+"("+dst+", "+indexPattern+", ~"+roughSizeOfObject(value)+"Bytes)");

	
	// global var method
	if(!masterMappings.hasOwnProperty(dst)){
		masterMappings[dst] = {}
	}
	if(!masterMappings[dst].hasOwnProperty(indexPattern)){
		masterMappings[dst][indexPattern] = {}
	}
	masterMappings[dst][indexPattern] = value

}

function getMappingsData(dst, index, incSummaries = false){
	ee(" -> "+"("+dst+", "+index+")");

	if(incSummaries){
		return masterMappings[dst][index]
	}else{
		return _.omit(masterMappings[dst][index], "fieldTypes", "allFields", "keywordFields")
	}

	// return _.omit(masterMappings[dst][index], "fieldTypes", "allFields", "keywordFields")

}

var saveMappingsDataIndexeddb = Dexie.async(function* (dst, indexPattern, value) {
	// ee(" -> "+arguments.callee.name+"("+dst+", "+indexPattern+", ~"+roughSizeOfObject(value)+"Bytes)");
	try {
		yield dbMappings.squaresMappings.put({dst: dst, indexPattern: indexPattern, data: value})
	} catch (error) {
		ww(9, "saveMappingsDataIndexeddb :"+error);
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
		ww(9, "getSavedMappings :"+error);
	}
})





var newConnectors  = Dexie.async(function* (name, dst, type, templates) {
	// ee(" -> "+arguments.callee.name+"("+dst+", "+indexPattern+", ~"+roughSizeOfObject(value)+"Bytes)");
	try {
		yield dbConnectors.dbConnectors.put({name: name, dst: dst, type: type, templates:templates})
	} catch (error) {
		ww(0, "newConnectors :"+error);
	}

})

var getAllSavedConnectors = Dexie.async(function* () {
	
	try {
		var bob = yield dbConnectors.dbConnectors.toArray()		
		return bob

	} catch (error) {
		ww(0, "getAllSavedConnectors :"+error);
	}

})


var deleteConnectors = Dexie.async(function* (name) {
	// ee("deleteSavedData ("+id+", "+keyType+")"); 
	try {
		yield dbConnectors.dbConnectors.where('name').anyOf(name).delete()
	} catch (error) {
		ww(0, "deleteConnectors :"+error);
	}
})


var nameToConnectors = Dexie.async(function* (name) {
	// ee("getSavedMappings ("+dst+", "+indexPattern+")"); 
	try {
		var bob = yield dbConnectors.dbConnectors.get({name: name})
		return bob
		
	} catch (error) {
		ww(9, "nameToConnectors :"+error);
	}
})
var typeToConnectors = Dexie.async(function* (type) {
	// ee("getSavedMappings ("+dst+", "+indexPattern+")"); 
	try {
		var bob = yield dbConnectors.dbConnectors.get({type: type})
		return bob
		
	} catch (error) {
		ww(9, "nameToConnectors :"+error);
	}
})

var nameToConnectorAttribute = Dexie.async(function* (name, attr) {
	// ee("getSavedMappings ("+dst+", "+indexPattern+")"); 
	try {
		var bob = yield dbConnectors.dbConnectors.get({name: name})
		return bob[attr]
		
	} catch (error) {
		ww(9, "nameToConnectors :"+error);
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
	
	// clone["Dst"] = connectors.handletox(thisCH, "dst")
	// clone["indexPattern"] = connectors.handletox(thisCH, 'indexPattern')
	clone["Co"] = retrieveSquareParam(id, "Co", true)
	// clone["indexPattern"] = connectors.handletox(thisCH, 'indexPattern')


	return String(CryptoJS.MD5(JSON.stringify(clone)))
}


//******************************************************************
//******************************************************************



function setSquareParam(id, key, value, redraw){
	// Should really use this more...

	if(key == "Pr"){
		//shift to remove the first ID
		url.squares[squarearraysearch(id)][key].shift()
		url.squares[squarearraysearch(id)][key].unshift(value)

	}else{
		url.squares[squarearraysearch(id)][key] = value;
	}

	updateIDs =  [id].concat(findAllChildren(id));
	
	reloadData(updateIDs);
	drawLines(updateIDs, false);
	drawSquares(updateIDs);
	updateurl();
	

}






// Find attribute of a Square. Look up for inheritence if needed
function retrieveSquareParam(id, key, recursive, recursiveCount){
	// IN : Integer, string (what attribute)
	// OUT : value
	// ee(" -> "+arguments.callee.name+"("+id+", "+key+", "+recursive+", "+recursiveCount+")");
	// if(arguments.callee.caller){ ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+key+", "+recursive+")") }else{ ee(" -> "+arguments.callee.name+"("+id+", "+key+", "+recursive+")") }
	
	if(!recursiveCount){
		recursiveCount=0
		// qq("recursive count now 0")
	}else{
		recursiveCount = recursiveCount+1
		
		if(recursiveCount>20){
			ww(0, "recCount exceeded")
			return
		}

		// qq("recur count = "+recursiveCount)
	}
	


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

	
	if(item.hasOwnProperty("Pr") && item.Pr[0] === 0){
		// first square, can only inherit from taskbar, no recursive queries allowed
		// ww(4, "answer for root square")

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
		
			case "Co":
				//ww(6, "Pr=0 returning Ds="+url.Ds+" from url");
				return item['Co'];

			case "x":
			case "y":
				// if x or Y is missing, presume 0.  Helps cut down on URL size a inty bit
				if(!item.hasOwnProperty(key)){
					return 0
				}else{
					return item[key];
				}

			case "Pr":
				return item['Pr'][0];

			default:

				if(typeof item[key] != undefined){
					//qq("returning "+item[key])
					return item[key];				
				}else{
					return null;
				}
		}

	}else if( (recursive === false  && !/^(raw|processed)data/.test(key) )   || ['Pr', 'Ps', 'Ds', 'x', 'y', 'Sc'].indexOf(key) >= 0){
		// query is for non-data, and something that shouldn't be inherited
		// ww(4, "answer non recursive")

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

			case "Pr":
				return item['Pr'][0];			

			case "Ps":
				return item['Pr'];	

			default:
				// if not specified, use default return
				if(typeof item[key] != undefined){
					// qq("returning "+item[key])
					return item[key];					
				}else{
					// qq("returning "+item[key])
					return null;

				}
		}	


	}else{
		// data or inheritable attribute, recursive queries permitted
		// ww(4, "answer recursive")
		

		switch(key){
			case "We":
				if(typeof item['Wi'] != 'undefined'  && !ISNAN(item["Wi"][0])){
					return item["Wi"][0];
				}else{
					return retrieveSquareParam(item.Pr[0], key, true, recursiveCount);
				}
				
			case "Ws":
				//alert(id+" "+item['Wi']+" "+!ISNAN(item["Wi"]))
				if(typeof item['Wi'] != 'undefined' && !ISNAN(item["Wi"][1]) ){
						return item["Wi"][1];
					}else{
						return retrieveSquareParam(item.Pr[0], key, true, recursiveCount);
					}
				
			case "Wr":
				if(typeof item['Wi'] != 'undefined' && !ISNAN(item["Wi"][2]) ){
					return item["Wi"][2];
				}else{
					return retrieveSquareParam(item.Pr[0], key, true, recursiveCount);
				}
				
			
			case "CH":
			case "Gt":
			case "Gp":
			case "Ds":
			case "Hx":
			case "Cs":
			case "Fi":
			case "Co":
				if(classOf(item[key]).match(/(String|Number|Object|Array)/)){
					return item[key];
				}else{
					return retrieveSquareParam(item.Pr[0], key, true, recursiveCount);
				}
		
			case "Pr":
				return item['Pr'][0];

			case "Ps":
				// Ps = ParentS = all parent, including "or" parents
				return item['Pr'];

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



	
	
// calculate cumulitive x or Y coordinate looking at parents position
function calcCord(id, xory, cumulative){

	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+", "+xory+", "+cumulative+")");
	// ee(" -> "+arguments.callee.name+"("+id+", "+xory+", "+cumulative+")");
	// IN : Integer, String (which x or y value), Integer of current relative cord
	// OUT : Integer



	// if ID is listed as 0, or null then yiou are being asked about a ghost. 
	if(id === 0 || !id ){
		// qq("parent === 0")
		return cumulative 

	}else{	
		var addToCumulative = parseInt(retrieveSquareParam(id, xory, false));
		// qq("add to cumulative "+addToCumulative)
		cumulative = cumulative + addToCumulative 

		var theResult = calcCord(retrieveSquareParam(id, "Pr", false), xory, cumulative);
		
		// qq("theResult = "+theResult)
		if(theResult){
			return theResult
		}else{
			// qq("urg")
			return cumulative
		}
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
			return calcDs(url.squares[i].Pr[0], cumulative);
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

// Find next ID for a square (as it's an array not an object)
function squareIDExist(id){
	// IN : null
	// OUT : Integer
	
	var found = false
	
	for(var i in url.squares){
		if(url.squares[i].id == id){
			found = true
		}
	}
	
	return found;
}


async function editNewConnector(id){

	//ee(arguments.callee.caller.name+" -> "+arguments.callee.name+" ("+typeof(id)+")");
	ww(7, "Connecter #"+id+" changed");

	var item = url.squares[squarearraysearch(id)];
	item.Pr = [0];
	

	// remote data connector source name
	delete item.CH
	delete item.Co
	if($("#square_co_dropdown_"+id).val()){
		item.Co = $("#square_co_dropdown_"+id).val()
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

	// thisCH = retrieveSquareParam(id, 'CH', true)	

	// do it here on load, also do it during new square creation
	// elastic_version(thisCH)
	
	
	drawLines(everyID(), false);  //line colours have changed
	drawSquares(updateDataList);

	
	var thisCo = retrieveSquareParam(id, 'Co', true)
	
	if(thisCo['type'] == "elastic"){
		
		thisDst = thisCo['dst']
		thisType = thisCo['type']
		thisIndex = "*"

		var value = await elastic_prep_mappings(thisDst, thisIndex, id)				
		saveMappingsData(thisDst, thisIndex, value)
		await saveMappingsDataIndexeddb(thisDst, thisIndex, value)
		await deleteStoredData(updateDataList)
	
	}

	drawinBoxes(updateDataList);
	
	
	updateurl();


}


function dumpURLToConsole(){
	_.each(url.squares, function(square){
		qq(square)
	})

}



// Apply changes inputted by user	
function editSquare(id){
	// IN : String (which attribute to modify)
	// OUT : na (but calls other functions
	// ee(arguments.callee.caller.name+" -> "+arguments.callee.name+"("+id+")");

	// qq(retrieveSquareParam(id, 'Pr', false))
	// qq(retrieveSquareParam(id, 'Ps', false))
	var item = url.squares[squarearraysearch(id)];
	// qq(item)

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



	// deal with "additional" "or" parents. 
	if($('#square_Ps_input_'+id).val() != ""){
		// qq("edit square parents combined  item.Pr:"+JSON.stringify(item.Pr)+" + "+$('#square_Ps_input_'+id).val())
	
		var additionalParents = $.map($('#square_Ps_input_'+id).val().split(','), function(value){
			// only accept square IDs that exist on the page right now
			if(squareIDExist(value)){
				return parseInt(value, 10);			
			}else{
				return null
			}
		});

		item.Pr = $.merge([item.Pr[0]],  additionalParents)
	}else{
		// qq("edit square parents single : "+JSON.stringify([item.Pr[0]]))
		item.Pr = [item.Pr[0]]
	}


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
	updateDataList.unshift(id);	
	

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


// Allow any Square to pivot it's Pathbar/Time to Security Analytics
async function pivotToX(id){
	// IN : Integer

	// Build the big query
	var fields=[]
	var limit = 10000;

	var to = calcGraphTime(id, 'We', 0)
	var from = calcGraphTime(id, 'We', 0) + retrieveSquareParam(id, "Ws", true)
	var timesArray = [[from, to]]


	var stats = false
	var statField = null
	var incTime = false
	var urlencode = false
	var filter = combineScriptFilter(id)
	var maxAccuracy = true

	// var query = elasticQueryBuildderToRuleThemAll(id, timesArray, Ds, fields, limit, stats, statField, incTime, urlencode, filter)
	
	var query = await elasticQueryBuildderToRuleThemAllandOr(
		id, 
		timesArray, 
		limit,
		incTime,
		filter,
		false,
		"",
		false,
		maxAccuracy,
		fields, 
		stats, 
		statField,
		null,
		null
	)


	delete query.aggs
	qq(query)



	var stringFormat = "YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]"
	var kibanaTo   = moment(to, "X").utc().format(stringFormat);
	var kibanaFrom = moment( from , "X").utc().format(stringFormat);

	var thisDst = await nameToConnectorAttribute(retrieveSquareParam(id, 'Co', true), "dst")
	
	
	// var thisIndex = "*:so-*"
	// thisIndex = "2289a0c0-6970-11ea-a0cd-ffa0f6a1bc29"

	// XXX remove port number, in config we should split that out as two fields? (or have a new field for the pivot address separate?)
	var elasticIP = thisDst.split(":")[0]

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
		// "index": thisIndex,
		"interval": "auto",
		"query": {
			"language": "kuery",
			"query": ""
		},
		"sort": ["@timestamp", "desc"]
	}
	


	urlStructJSON['filters'].push(
		{
			"$state": {
				"store": "appState"
			},
			"meta": {
				"alias": null,
				"disabled": false,
				// "index": thisIndex,
				"key": "bool",
				"negate": false,
				"type": "custom",
				"value": encodeURI(JSON.stringify(query))
			},
			"query": query.query
		}
	)


	var thisQuery = "&_a=" + rison.encode(urlStructJSON)

	var kibanaQuery = path + urlStruct + thisQuery

	// qq(urlStruct)
	qq(urlStructJSON)
	// qq(thisQuery)
	// qq(elasticQuery)
	// qq(JSON.stringify(elasticQuery))
	// qq( encodeURI(JSON.stringify(elasticQuery)))
	// qq(encodeURIComponent(JSON.stringify(elasticQuery)))
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
	newSquare.Pr = [0]
	newSquare.Gt = "DescribeSquare"
	newSquare.CH = retrieveSquareParam(id, "CH")
	newSquare.Wi = [to, size]
	newSquare.Ds = btoa(JSON.stringify(postDs))
	newSquare.Fi = combineScriptFilter(id)
	
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
						// ww(5, "compileGraphs() finished all downloads");
						

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
	// $.get( "./compile_connectors.php", function( data ) {
	// 	$.each(data, function(k, v) {
	// 		connectors.add_connector(v)
	// 	})
		
	// 	// XXX needs improving - move to resolve? 
	// 	// Only do initial load if this is the main squares-page
	// 	// if (document.location.href.indexOf('scripted_fields.html') === -1){ 
	// 		// compileGraphs and conmpileConnectors finished (moved this functionality to promises???
			initialLoad();
		// }
				
	// });

}

async function initialLoad(){

	tmpEveryID = everyID()

	// ww(5,"***PageLoad drawLines ***");
	drawLines(tmpEveryID, false);

	// ww(5,"***PageLoad drawSquares ***");
	drawSquares(tmpEveryID);


	// plant the "built in" type
	// bob.push({"name": , "dst":"", "templates":"", "type": "builtin"})
	var connectors = await getAllSavedConnectors()
	
	checkBuiltin = _.where(connectors, {"type": "builtin"})
	if(checkBuiltin.length < 1){
		await newConnectors("Builtin", "", "builtin", [])
	}
	checkIntroduction = _.where(connectors, {"type": "introduction"})
	if(checkIntroduction.length < 1){
		await newConnectors("Introduction", "", "introduction", [])
	}
	

		// ww(5,"***Prepare Mappings ***");
		for(var i in tmpEveryID){
			
			var id = tmpEveryID[i]
			

			// only get Mappings if the square has a connector handle (i.e. not inherinting squares)
			var thisCo = retrieveSquareParam(id, 'Co', false)
			

			if(thisCo && thisCo != "builtin"){

				// thisCH = retrieveSquareParam(id, 'CH', true)			
				var thisName = retrieveSquareParam(id, 'Co', true)
				var thisCo = await nameToConnectors(thisName)
				var thisDst = thisCo['dst']
				
				var thisIndex = "*"
				
				if(thisName !== "Dummy"){

					var value = await elastic_prep_mappings(thisDst, thisIndex, id)		
					saveMappingsData(thisDst, thisIndex, value)
					await saveMappingsDataIndexeddb(thisDst, thisIndex, value)
					
								
					// elastic_version(retrieveSquareParam(id, 'CH', true))
				
				}
			
			}
		
		}	
	


	// ww(5,"***PageLoad drawinBoxes***");
	drawinBoxes(tmpEveryID);

	

}



function resize_workspace(){
	// $("#workspaceDiv").css("width", "99%");
	// $("#workspaceDiv").css("height", document.getElementById('workspacecontainer').clientHeight-10);
	// $("#workspaceDiv").css("height", document.getElementById('workspacecontainer').clientHeight-10);
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
	


	dbMappings = new Dexie("squaresMappings");
	dbMappings.version(1).stores({
		squaresMappings: "dst, indexPattern, [dst+indexPattern]"

	});

	dbConnectors = new Dexie("dbConnectors");
	dbConnectors.version(1).stores({
		dbConnectors: "name, dst, type, templates"
	});



	//	is this a dummy page?
	if(window.location.hostname == "www.squares-ui.com"	){
		GLB.demoMode = true
	}

	if(GLB.demoMode){
		ww(1, "www.Squares-ui.com Test platform detected, dummy data enabled.")
		
		var thisDst = "IgnoreThisError"
		var thisIndexPattern = "*"

		newConnectors("Dummy", thisDst, "elastic", "elastic")
		
		
		var tmpMappings = {
			"allFields": ["@timestamp", "@version", "client.address", "client.bytes", "client.ip", "client.ip_bytes", "client.packets", "client.port", "connection.bytes.missed", "connection.history", "connection.local.originator", "connection.local.responder", "connection.state", "connection.state_description", "destination.geo.city_name", "destination.geo.continent_name", "destination.geo.country_iso_code", "destination.geo.country_name", "destination.geo.ip", "destination.geo.location.lat", "destination.geo.location.lon", "destination.geo.region_iso_code", "destination.geo.region_name", "destination.geo.timezone", "destination.ip", "destination.port", "destination_geo.ip", "destination_geo.latitude", "destination_geo.location", "destination_geo.longitude", "dhcp.assigned_ip", "dhcp.lease_time", "dhcp.message_types", "dhcp.requested_address", "dns.answers", "dns.authoritative", "dns.highest_registered_domain", "dns.id", "dns.parent_domain", "dns.parent_domain_length", "dns.query.class", "dns.query.class_name", "dns.query.length", "dns.query.name", "dns.query.rejected", "dns.query.type", "dns.query.type_name", "dns.recursion.available", "dns.recursion.desired", "dns.reserved", "dns.response.code", "dns.response.code_name", "dns.subdomain", "dns.subdomain_length", "dns.top_level_domain", "dns.truncated", "dns.ttls", "ecs.version", "event.category", "event.dataset", "event.duration", "event.module", "file.analyzer", "file.aslr", "file.bytes.missing", "file.bytes.overflow", "file.bytes.seen", "file.bytes.total", "file.code_integrity", "file.compile_timestamp", "file.debug_data", "file.dep", "file.depth", "file.extracted.cutoff", "file.extracted.filename", "file.is_64bit", "file.is_exe", "file.is_orig", "file.local_orig", "file.machine", "file.mime_type", "file.name", "file.os", "file.resp_filenames", "file.resp_mime_types", "file.section_names", "file.seh", "file.source", "file.subsystem", "file.table.cert", "file.table.export", "file.table.import", "file.timed_out", "geoip.ip", "geoip.latitude", "geoip.location", "geoip.longitude", "hash.ja3s", "hash.md5", "hash.sha1", "host.domain", "host.hostname", "host.mac", "http.method", "http.request.body.length", "http.response.body.length", "http.status_code", "http.status_message", "http.trans_depth", "http.uri", "http.useragent", "http.version", "http.virtual_host", "ingest.timestamp", "intel.indicator", "log.file.path", "log.id.fuid", "log.id.orig_fuids", "log.id.resp_fuids", "log.id.uid", "log.id.uids", "log.offset", "message", "network.bytes", "network.community_id", "network.protocol", "network.transport", "notice.action", "notice.message", "notice.note", "notice.p", "notice.peer_description", "notice.sub_message", "notice.suppress_for", "observer.name", "rule.score", "rule.uuid", "scan.exiftool", "server.address", "server.bytes", "server.ip", "server.ip_bytes", "server.packets", "server.port", "software.name", "software.type", "software.version.major", "software.version.minor", "software.version.unparsed", "source.geo.city_name", "source.geo.continent_name", "source.geo.country_iso_code", "source.geo.country_name", "source.geo.ip", "source.geo.location.lat", "source.geo.location.lon", "source.geo.region_iso_code", "source.geo.region_name", "source.geo.timezone", "source.ip", "source.port", "source_geo.ip", "source_geo.latitude", "source_geo.location", "source_geo.longitude", "ssh.authentication.attempts", "ssh.direction", "ssh.server", "ssl.certificate.chain_fuids", "ssl.cipher", "ssl.curve", "ssl.established", "ssl.last_alert", "ssl.next_protocol", "ssl.resumed", "ssl.validation_status", "ssl.version", "tags", "weird.name", "weird.notice", "weird.peer", "winlog.event_id", "winlog.version", "x509.basic_constraints.ca", "x509.certificate.curve", "x509.certificate.exponent", "x509.certificate.issuer", "x509.certificate.key.algorithm", "x509.certificate.key.length", "x509.certificate.key.type", "x509.certificate.not_valid_after", "x509.certificate.not_valid_before", "x509.certificate.serial", "x509.certificate.signing_algorithm", "x509.certificate.subject", "x509.certificate.version", "x509.san_dns", "agent.id", "agent.ip", "agent.name", "data.extra_data", "data.file", "data.hardware.cpu_cores", "data.hardware.cpu_mhz", "data.hardware.cpu_name", "data.hardware.ram_free", "data.hardware.ram_total", "data.hardware.ram_usage", "data.hardware.serial", "data.hotfix", "data.netinfo.iface.adapter", "data.netinfo.iface.ipv4.address", "data.netinfo.iface.ipv4.broadcast", "data.netinfo.iface.ipv4.dhcp", "data.netinfo.iface.ipv4.gateway", "data.netinfo.iface.ipv4.metric", "data.netinfo.iface.ipv4.netmask", "data.netinfo.iface.ipv6.address", "data.netinfo.iface.ipv6.dhcp", "data.netinfo.iface.ipv6.netmask", "data.netinfo.iface.mac", "data.netinfo.iface.mtu", "data.netinfo.iface.name", "data.netinfo.iface.rx_bytes", "data.netinfo.iface.rx_dropped", "data.netinfo.iface.rx_errors", "data.netinfo.iface.rx_packets", "data.netinfo.iface.state", "data.netinfo.iface.tx_bytes", "data.netinfo.iface.tx_dropped", "data.netinfo.iface.tx_errors", "data.netinfo.iface.tx_packets", "data.netinfo.iface.type", "data.os.architecture", "data.os.build", "data.os.hostname", "data.os.major", "data.os.minor", "data.os.name", "data.os.os_release", "data.os.platform", "data.os.release", "data.os.release_version", "data.os.sysname", "data.os.version", "data.port.inode", "data.port.local_ip", "data.port.local_port", "data.port.pid", "data.port.process", "data.port.protocol", "data.port.remote_ip", "data.port.remote_port", "data.port.rx_queue", "data.port.state", "data.port.tx_queue", "data.title", "data.type", "data.uid", "data.win.rmSessionEvent.rmSessionId", "data.win.rmSessionEvent.uTCStartTime", "event.code", "event.severity", "event.severity_label", "event.timestamp", "host.name", "host.syscheck.changed_attributes", "host.syscheck.event", "host.syscheck.mode", "host.syscheck.mtime_after", "host.syscheck.mtime_before", "host.syscheck.path", "host.syscheck.sha1_after", "host.syscheck.sha1_before", "log.full", "log.id.id", "log.location", "log.previous_log", "log.previous_output", "manager.name", "process.args", "process.cmd", "process.egroup", "process.euser", "process.fgroup", "process.name", "process.nice", "process.nlwp", "process.pgrp", "process.pid", "process.ppid", "process.priority", "process.processor", "process.resident", "process.rgroup", "process.ruser", "process.session", "process.sgroup", "process.share", "process.size", "process.start_time", "process.state", "process.stime", "process.suser", "process.tgid", "process.tty", "process.utime", "process.vm_size", "rule.category", "rule.firedtimes", "rule.gdpr", "rule.gpg13", "rule.groups", "rule.hipaa", "rule.info", "rule.level", "rule.mail", "rule.mitre.id", "rule.mitre.tactic", "rule.mitre.technique", "rule.name", "rule.nist_800_53", "rule.pci_dss", "rule.tsc", "user.escalated", "winlog.channel", "winlog.computer", "winlog.eventRecordID", "winlog.eventSourceName", "winlog.event_data.accountName", "winlog.event_data.address", "winlog.event_data.addressLength", "winlog.event_data.attributes", "winlog.event_data.authenticationPackageName", "winlog.event_data.averageResume", "winlog.event_data.binary", "winlog.event_data.biosInitDuration", "winlog.event_data.callerProcessId", "winlog.event_data.callerProcessName", "winlog.event_data.checkpointDuration", "winlog.event_data.clientProcessId", "winlog.event_data.countOfCredentialsReturned", "winlog.event_data.currentStratumNumber", "winlog.event_data.data", "winlog.event_data.deviceName", "winlog.event_data.deviceNameLength", "winlog.event_data.deviceTime", "winlog.event_data.deviceVersionMajor", "winlog.event_data.deviceVersionMinor", "winlog.event_data.dirtyPages", "winlog.event_data.driverInitDuration", "winlog.event_data.effectiveState", "winlog.event_data.elevatedToken", "winlog.event_data.extraInfo", "winlog.event_data.extraString", "winlog.event_data.extraStringLength", "winlog.event_data.failureReason", "winlog.event_data.finalStatus", "winlog.event_data.flags", "winlog.event_data.fullResume", "winlog.event_data.hiberPagesWritten", "winlog.event_data.hiberReadDuration", "winlog.event_data.hiberWriteDuration", "winlog.event_data.hiveName", "winlog.event_data.hiveNameLength", "winlog.event_data.identity", "winlog.event_data.imagePath", "winlog.event_data.impersonationLevel", "winlog.event_data.internalCode", "winlog.event_data.ipAddress", "winlog.event_data.ipPort", "winlog.event_data.keyLength", "winlog.event_data.keysUpdated", "winlog.event_data.logonGuid", "winlog.event_data.logonProcessName", "winlog.event_data.logonType", "winlog.event_data.newSize", "winlog.event_data.newTime", "winlog.event_data.noMultiStageResumeReason", "winlog.event_data.oldTime", "winlog.event_data.originalSize", "winlog.event_data.param1", "winlog.event_data.param10", "winlog.event_data.param11", "winlog.event_data.param2", "winlog.event_data.param3", "winlog.event_data.param4", "winlog.event_data.param5", "winlog.event_data.param6", "winlog.event_data.param7", "winlog.event_data.param8", "winlog.event_data.param9", "winlog.event_data.previousTime", "winlog.event_data.privilegeList", "winlog.event_data.processCreationTime", "winlog.event_data.processID", "winlog.event_data.processId", "winlog.event_data.processName", "winlog.event_data.programmedWakeTimeAc", "winlog.event_data.programmedWakeTimeDc", "winlog.event_data.queryName", "winlog.event_data.readOperation", "winlog.event_data.reason", "winlog.event_data.resource", "winlog.event_data.resumeCount", "winlog.event_data.returnCode", "winlog.event_data.rmId", "winlog.event_data.schema", "winlog.event_data.schemaFriendlyName", "winlog.event_data.serviceGuid", "winlog.event_data.serviceName", "winlog.event_data.serviceType", "winlog.event_data.sleepDuration", "winlog.event_data.sleepTime", "winlog.event_data.startType", "winlog.event_data.status", "winlog.event_data.subStatus", "winlog.event_data.subjectDomainName", "winlog.event_data.subjectLogonId", "winlog.event_data.subjectUserName", "winlog.event_data.subjectUserSid", "winlog.event_data.tSId", "winlog.event_data.targetDomainName", "winlog.event_data.targetInfo", "winlog.event_data.targetLinkedLogonId", "winlog.event_data.targetLogonGuid", "winlog.event_data.targetLogonId", "winlog.event_data.targetName", "winlog.event_data.targetServerName", "winlog.event_data.targetSid", "winlog.event_data.targetState", "winlog.event_data.targetUserName", "winlog.event_data.targetUserSid", "winlog.event_data.timeProvider", "winlog.event_data.timeSource", "winlog.event_data.timeSourceRefId", "winlog.event_data.tmId", "winlog.event_data.type", "winlog.event_data.updateGuid", "winlog.event_data.updateRevisionNumber", "winlog.event_data.updateTitle", "winlog.event_data.userSid", "winlog.event_data.virtualAccount", "winlog.event_data.wakeDuration", "winlog.event_data.wakeFromState", "winlog.event_data.wakeRequesterTypeAc", "winlog.event_data.wakeRequesterTypeDc", "winlog.event_data.wakeSourceText", "winlog.event_data.wakeSourceTextLength", "winlog.event_data.wakeSourceType", "winlog.event_data.wakeTime", "winlog.event_data.wakeTimerContext", "winlog.event_data.wakeTimerContextLength", "winlog.event_data.wakeTimerOwner", "winlog.event_data.wakeTimerOwnerLength", "winlog.event_data.workstationName", "winlog.keywords", "winlog.level", "winlog.message", "winlog.opcode", "winlog.processID", "winlog.providerGuid", "winlog.providerName", "winlog.severityValue", "winlog.systemTime", "winlog.task", "winlog.threadID", "", "winlog.event_data.apiCallerName", "winlog.event_data.apiCallerNameLength", "winlog.event_data.lightestSystemState", "winlog.event_data.systemAction", "winlog.event_data.transitionsToOn", "weird.additional_info", "aggregate_id", "rule_name", "host.syscheck.gid_after", "host.syscheck.gname_after", "host.syscheck.inode_after", "host.syscheck.inode_before", "host.syscheck.md5_after", "host.syscheck.md5_before", "host.syscheck.perm_after", "host.syscheck.sha256_after", "host.syscheck.sha256_before", "host.syscheck.size_after", "host.syscheck.size_before", "host.syscheck.uid_after", "host.syscheck.uname_after", "winlog.event_data.domainPeer", "winlog.event_data.errorMessage", "winlog.event_data.nTSTATUS", "winlog.event_data.retryMinutes", "winlog.event_data.sourceFileID", "winlog.event_data.sourceLine", "winlog.event_data.sourceTag", "winlog.event_data.volumeName", "network.data.decoded", "rule.action", "rule.gid", "rule.metadata.created_at", "rule.metadata.updated_at", "rule.reference", "rule.rev", "rule.rule", "rule.ruleset", "rule.severity", "winlog.event_data.auditSourceName", "winlog.event_data.bufferSize", "winlog.event_data.corruptionActionState", "winlog.event_data.driveName", "winlog.event_data.errorCode", "winlog.event_data.eventSourceId", "winlog.event_data.filesCachedFirstPass", "winlog.event_data.filesMissedSecondPass", "winlog.event_data.filesResident", "winlog.event_data.filesScoped", "winlog.event_data.library", "winlog.event_data.requiredSize", "winlog.event_data.service", "winlog.event_data.snapshotPath", "winlog.event_data.totalDirectories", "winlog.event_data.totalFiles", "winlog.event_data.algorithmName", "winlog.event_data.clientCreationTime", "winlog.event_data.keyFilePath", "winlog.event_data.keyName", "winlog.event_data.keyType", "winlog.event_data.operation", "winlog.event_data.providerName", "data.euid", "data.logname", "data.pwd", "data.srcuser", "data.tty", "process.command_line", "winlog.event_data.workstation", "agent.ephemeral_id", "agent.hostname", "agent.type", "agent.version", "file.accessed", "file.ctime", "file.flavors.yara", "file.mtime", "file.permissions", "file.scanners", "file.size", "file.tree.node", "file.tree.parent", "file.tree.root", "hash.elapsed", "hash.sha256", "hash.ssdeep", "request.attributes.filename", "request.client", "request.id", "request.source", "request.time", "scan.entropy.elapsed", "scan.entropy.entropy", "scan.header.elapsed", "scan.header.header", "scan.libarchive.elapsed", "scan.libarchive.total.extracted", "scan.libarchive.total.files", "scan.pe.debug.age", "scan.pe.debug.guid", "scan.pe.debug.pdb", "scan.pe.debug.type", "scan.pe.elapsed", "scan.pe.file_info.fixed.operating_systems", "scan.pe.file_info.fixed.type.primary", "scan.pe.file_info.string.name", "scan.pe.file_info.string.value", "scan.pe.file_info.var.character_set", "scan.pe.file_info.var.language", "scan.pe.flags", "scan.pe.header.address.code", "scan.pe.header.address.entry_point", "scan.pe.header.address.image", "scan.pe.header.alignment.file", "scan.pe.header.alignment.section", "scan.pe.header.characteristics.dll", "scan.pe.header.characteristics.image", "scan.pe.header.checksum", "scan.pe.header.machine.id", "scan.pe.header.machine.type", "scan.pe.header.magic.dos", "scan.pe.header.magic.image", "scan.pe.header.size.code", "scan.pe.header.size.data.initialized", "scan.pe.header.size.data.uninitialized", "scan.pe.header.size.headers", "scan.pe.header.size.heap.commit", "scan.pe.header.size.heap.reserve", "scan.pe.header.size.image", "scan.pe.header.size.stack.commit", "scan.pe.header.size.stack.reserve", "scan.pe.header.subsystem", "scan.pe.header.timestamp", "scan.pe.header.version.image", "scan.pe.header.version.linker", "scan.pe.header.version.operating_system", "scan.pe.header.version.subsystem", "scan.pe.imphash", "scan.pe.resources.id", "scan.pe.resources.language.primary", "scan.pe.resources.language.sub", "scan.pe.resources.name", "scan.pe.resources.type", "scan.pe.sections.address.physical", "scan.pe.sections.address.virtual", "scan.pe.sections.characteristics", "scan.pe.sections.entropy", "scan.pe.sections.name", "scan.pe.sections.size", "scan.pe.symbols.imported", "scan.pe.symbols.libraries", "scan.pe.symbols.table.library", "scan.pe.symbols.table.symbols", "scan.pe.symbols.table.type", "scan.pe.total.libraries", "scan.pe.total.resources", "scan.pe.total.sections", "scan.pe.total.symbols", "scan.pkcs7.elapsed", "scan.pkcs7.total.certificates", "scan.pkcs7.total.extracted", "scan.yara.elapsed", "scan.x509.elapsed", "scan.x509.expired", "scan.x509.fingerprint", "scan.x509.issuer", "scan.x509.not_after", "scan.x509.not_before", "scan.x509.serial_number", "scan.x509.subject", "scan.x509.version", "scan.xml.elapsed", "scan.xml.namespaces", "scan.xml.tags", "scan.xml.total.extracted", "scan.xml.total.tags", "scan.xml.version", "data.sca.check.compliance.cis_csc", "data.sca.check.description", "data.sca.check.id", "data.sca.check.previous_result", "data.sca.check.rationale", "data.sca.check.reason", "data.sca.check.references", "data.sca.check.registry", "data.sca.check.remediation", "data.sca.check.result", "data.sca.check.status", "data.sca.check.title", "data.sca.description", "data.sca.failed", "data.sca.file", "data.sca.invalid", "data.sca.passed", "data.sca.policy", "data.sca.policy_id", "data.sca.scan_id", "data.sca.score", "data.sca.total_checks", "data.sca.type", "rule.cis_csc", "data.win.installDeviceID.deviceInstanceID", "data.win.installDeviceID.driverDescription", "data.win.installDeviceID.driverName", "data.win.installDeviceID.driverProvider", "data.win.installDeviceID.driverVersion", "data.win.installDeviceID.installStatus", "data.win.installDeviceID.isDriverOEM", "data.win.installDeviceID.rebootOption", "data.win.installDeviceID.setupClass", "data.win.installDeviceID.upgradeDevice", "data.gid", "data.home", "data.shell", "data.sca.check.compliance.hipaa", "data.sca.check.compliance.nist_800_53", "data.sca.check.compliance.pci_dss", "data.sca.check.compliance.tsc", "data.sca.check.file", "data.win.addServiceID.addServiceStatus", "data.win.addServiceID.deviceInstanceID", "data.win.addServiceID.driverFileName", "data.win.addServiceID.primaryService", "data.win.addServiceID.serviceName", "data.win.addServiceID.updateService", "winlog.event_data.deviceInstance", "winlog.event_data.deviceInstanceLength", "winlog.event_data.processNameLength", "until", "osquery.result.action", "osquery.result.calendarTime", "osquery.result.codename", "osquery.result.columns.description", "osquery.result.columns.directory", "osquery.result.columns.gid", "osquery.result.columns.gid_signed", "osquery.result.columns.shell", "osquery.result.columns.uid", "osquery.result.columns.uid_signed", "osquery.result.columns.username", "osquery.result.columns.uuid", "osquery.result.counter", "osquery.result.endpoint_ip1", "osquery.result.endpoint_ip2", "osquery.result.epoch", "osquery.result.hardware_serial", "osquery.result.hostIdentifier", "osquery.result.hostname", "osquery.result.live_query", "osquery.result.name", "osquery.result.numerics", "osquery.result.unixTime", "alert_time", "match_time"],
			"keywordFields": ["client.address", "connection.history", "connection.state", "connection.state_description", "destination.geo.city_name", "destination.geo.continent_name", "destination.geo.country_iso_code", "destination.geo.country_name", "destination.geo.region_iso_code", "destination.geo.region_name", "destination.geo.timezone", "dhcp.assigned_ip", "dhcp.message_types", "dhcp.requested_address", "dns.answers", "dns.highest_registered_domain", "dns.parent_domain", "dns.query.class_name", "dns.query.name", "dns.query.type_name", "dns.response.code_name", "dns.subdomain", "dns.top_level_domain", "ecs.version", "event.category", "event.dataset", "event.module", "file.analyzer", "file.compile_timestamp", "file.extracted.filename", "file.machine", "file.mime_type", "file.name", "file.os", "file.resp_filenames", "file.resp_mime_types", "file.section_names", "file.source", "file.subsystem", "hash.ja3s", "hash.md5", "hash.sha1", "host.domain", "host.hostname", "host.mac", "http.method", "http.status_message", "http.uri", "http.useragent", "http.version", "http.virtual_host", "ingest.timestamp", "intel.indicator", "log.file.path", "log.id.fuid", "log.id.orig_fuids", "log.id.resp_fuids", "log.id.uid", "log.id.uids", "message", "network.community_id", "network.protocol", "network.transport", "notice.action", "notice.message", "notice.note", "notice.peer_description", "notice.sub_message", "observer.name", "server.address", "software.name", "software.type", "software.version.unparsed", "source.geo.city_name", "source.geo.continent_name", "source.geo.country_iso_code", "source.geo.country_name", "source.geo.region_iso_code", "source.geo.region_name", "source.geo.timezone", "ssh.direction", "ssh.server", "ssl.certificate.chain_fuids", "ssl.cipher", "ssl.curve", "ssl.last_alert", "ssl.next_protocol", "ssl.validation_status", "ssl.version", "tags", "weird.name", "weird.peer", "x509.certificate.curve", "x509.certificate.exponent", "x509.certificate.issuer", "x509.certificate.key.algorithm", "x509.certificate.key.type", "x509.certificate.not_valid_after", "x509.certificate.not_valid_before", "x509.certificate.serial", "x509.certificate.signing_algorithm", "x509.certificate.subject", "x509.san_dns", "agent.id", "agent.name", "data.extra_data", "data.file", "data.hardware.cpu_cores", "data.hardware.cpu_mhz", "data.hardware.cpu_name", "data.hardware.ram_free", "data.hardware.ram_total", "data.hardware.ram_usage", "data.hardware.serial", "data.hotfix", "data.netinfo.iface.adapter", "data.netinfo.iface.ipv4.address", "data.netinfo.iface.ipv4.broadcast", "data.netinfo.iface.ipv4.dhcp", "data.netinfo.iface.ipv4.gateway", "data.netinfo.iface.ipv4.metric", "data.netinfo.iface.ipv4.netmask", "data.netinfo.iface.ipv6.address", "data.netinfo.iface.ipv6.dhcp", "data.netinfo.iface.ipv6.netmask", "data.netinfo.iface.mac", "data.netinfo.iface.mtu", "data.netinfo.iface.name", "data.netinfo.iface.rx_bytes", "data.netinfo.iface.rx_dropped", "data.netinfo.iface.rx_errors", "data.netinfo.iface.rx_packets", "data.netinfo.iface.state", "data.netinfo.iface.tx_bytes", "data.netinfo.iface.tx_dropped", "data.netinfo.iface.tx_errors", "data.netinfo.iface.tx_packets", "data.netinfo.iface.type", "data.os.architecture", "data.os.build", "data.os.hostname", "data.os.major", "data.os.minor", "data.os.name", "data.os.os_release", "data.os.platform", "data.os.release", "data.os.release_version", "data.os.sysname", "data.os.version", "data.port.inode", "data.port.local_ip", "data.port.local_port", "data.port.pid", "data.port.process", "data.port.protocol", "data.port.remote_ip", "data.port.remote_port", "data.port.rx_queue", "data.port.state", "data.port.tx_queue", "data.title", "data.type", "data.uid", "data.win.rmSessionEvent.rmSessionId", "data.win.rmSessionEvent.uTCStartTime", "event.code", "event.severity_label", "event.timestamp", "host.name", "host.syscheck.changed_attributes", "host.syscheck.event", "host.syscheck.mode", "host.syscheck.mtime_after", "host.syscheck.mtime_before", "host.syscheck.path", "host.syscheck.sha1_after", "host.syscheck.sha1_before", "log.full", "log.id.id", "log.location", "log.previous_log", "log.previous_output", "manager.name", "process.args", "process.cmd", "process.egroup", "process.euser", "process.fgroup", "process.name", "process.nice", "process.nlwp", "process.pgrp", "process.pid", "process.ppid", "process.priority", "process.processor", "process.resident", "process.rgroup", "process.ruser", "process.session", "process.sgroup", "process.share", "process.size", "process.start_time", "process.state", "process.stime", "process.suser", "process.tgid", "process.tty", "process.utime", "process.vm_size", "rule.category", "rule.gdpr", "rule.gpg13", "rule.groups", "rule.hipaa", "rule.info", "rule.mitre.id", "rule.mitre.tactic", "rule.mitre.technique", "rule.name", "rule.nist_800_53", "rule.pci_dss", "rule.tsc", "user.escalated", "winlog.channel", "winlog.computer", "winlog.eventRecordID", "winlog.eventSourceName", "winlog.event_data.accountName", "winlog.event_data.address", "winlog.event_data.addressLength", "winlog.event_data.attributes", "winlog.event_data.authenticationPackageName", "winlog.event_data.averageResume", "winlog.event_data.binary", "winlog.event_data.biosInitDuration", "winlog.event_data.callerProcessId", "winlog.event_data.callerProcessName", "winlog.event_data.checkpointDuration", "winlog.event_data.clientProcessId", "winlog.event_data.countOfCredentialsReturned", "winlog.event_data.currentStratumNumber", "winlog.event_data.data", "winlog.event_data.deviceName", "winlog.event_data.deviceNameLength", "winlog.event_data.deviceTime", "winlog.event_data.deviceVersionMajor", "winlog.event_data.deviceVersionMinor", "winlog.event_data.dirtyPages", "winlog.event_data.driverInitDuration", "winlog.event_data.effectiveState", "winlog.event_data.elevatedToken", "winlog.event_data.extraInfo", "winlog.event_data.extraString", "winlog.event_data.extraStringLength", "winlog.event_data.failureReason", "winlog.event_data.finalStatus", "winlog.event_data.flags", "winlog.event_data.fullResume", "winlog.event_data.hiberPagesWritten", "winlog.event_data.hiberReadDuration", "winlog.event_data.hiberWriteDuration", "winlog.event_data.hiveName", "winlog.event_data.hiveNameLength", "winlog.event_data.identity", "winlog.event_data.imagePath", "winlog.event_data.impersonationLevel", "winlog.event_data.internalCode", "winlog.event_data.ipAddress", "winlog.event_data.ipPort", "winlog.event_data.keyLength", "winlog.event_data.keysUpdated", "winlog.event_data.logonGuid", "winlog.event_data.logonProcessName", "winlog.event_data.logonType", "winlog.event_data.newSize", "winlog.event_data.newTime", "winlog.event_data.noMultiStageResumeReason", "winlog.event_data.oldTime", "winlog.event_data.originalSize", "winlog.event_data.param1", "winlog.event_data.param10", "winlog.event_data.param11", "winlog.event_data.param2", "winlog.event_data.param3", "winlog.event_data.param4", "winlog.event_data.param5", "winlog.event_data.param6", "winlog.event_data.param7", "winlog.event_data.param8", "winlog.event_data.param9", "winlog.event_data.previousTime", "winlog.event_data.privilegeList", "winlog.event_data.processCreationTime", "winlog.event_data.processID", "winlog.event_data.processId", "winlog.event_data.processName", "winlog.event_data.programmedWakeTimeAc", "winlog.event_data.programmedWakeTimeDc", "winlog.event_data.queryName", "winlog.event_data.readOperation", "winlog.event_data.reason", "winlog.event_data.resource", "winlog.event_data.resumeCount", "winlog.event_data.returnCode", "winlog.event_data.rmId", "winlog.event_data.schema", "winlog.event_data.schemaFriendlyName", "winlog.event_data.serviceGuid", "winlog.event_data.serviceName", "winlog.event_data.serviceType", "winlog.event_data.sleepDuration", "winlog.event_data.sleepTime", "winlog.event_data.startType", "winlog.event_data.status", "winlog.event_data.subStatus", "winlog.event_data.subjectDomainName", "winlog.event_data.subjectLogonId", "winlog.event_data.subjectUserName", "winlog.event_data.subjectUserSid", "winlog.event_data.tSId", "winlog.event_data.targetDomainName", "winlog.event_data.targetInfo", "winlog.event_data.targetLinkedLogonId", "winlog.event_data.targetLogonGuid", "winlog.event_data.targetLogonId", "winlog.event_data.targetName", "winlog.event_data.targetServerName", "winlog.event_data.targetSid", "winlog.event_data.targetState", "winlog.event_data.targetUserName", "winlog.event_data.targetUserSid", "winlog.event_data.timeProvider", "winlog.event_data.timeSource", "winlog.event_data.timeSourceRefId", "winlog.event_data.tmId", "winlog.event_data.type", "winlog.event_data.updateGuid", "winlog.event_data.updateRevisionNumber", "winlog.event_data.updateTitle", "winlog.event_data.userSid", "winlog.event_data.virtualAccount", "winlog.event_data.wakeDuration", "winlog.event_data.wakeFromState", "winlog.event_data.wakeRequesterTypeAc", "winlog.event_data.wakeRequesterTypeDc", "winlog.event_data.wakeSourceText", "winlog.event_data.wakeSourceTextLength", "winlog.event_data.wakeSourceType", "winlog.event_data.wakeTime", "winlog.event_data.wakeTimerContext", "winlog.event_data.wakeTimerContextLength", "winlog.event_data.wakeTimerOwner", "winlog.event_data.wakeTimerOwnerLength", "winlog.event_data.workstationName", "winlog.keywords", "winlog.level", "winlog.message", "winlog.opcode", "winlog.processID", "winlog.providerGuid", "winlog.providerName", "winlog.severityValue", "winlog.systemTime", "winlog.task", "winlog.threadID", "winlog.event_data.apiCallerName", "winlog.event_data.apiCallerNameLength", "winlog.event_data.lightestSystemState", "winlog.event_data.systemAction", "winlog.event_data.transitionsToOn", "weird.additional_info", "host.syscheck.gid_after", "host.syscheck.gname_after", "host.syscheck.md5_after", "host.syscheck.md5_before", "host.syscheck.perm_after", "host.syscheck.sha256_after", "host.syscheck.sha256_before", "host.syscheck.size_after", "host.syscheck.size_before", "host.syscheck.uid_after", "host.syscheck.uname_after", "winlog.event_data.domainPeer", "winlog.event_data.errorMessage", "winlog.event_data.nTSTATUS", "winlog.event_data.retryMinutes", "winlog.event_data.sourceFileID", "winlog.event_data.sourceLine", "winlog.event_data.sourceTag", "winlog.event_data.volumeName", "network.data.decoded", "rule.action", "rule.metadata.created_at", "rule.metadata.updated_at", "rule.reference", "rule.rule", "rule.ruleset", "winlog.event_data.auditSourceName", "winlog.event_data.bufferSize", "winlog.event_data.corruptionActionState", "winlog.event_data.driveName", "winlog.event_data.errorCode", "winlog.event_data.eventSourceId", "winlog.event_data.filesCachedFirstPass", "winlog.event_data.filesMissedSecondPass", "winlog.event_data.filesResident", "winlog.event_data.filesScoped", "winlog.event_data.library", "winlog.event_data.requiredSize", "winlog.event_data.service", "winlog.event_data.snapshotPath", "winlog.event_data.totalDirectories", "winlog.event_data.totalFiles", "winlog.event_data.algorithmName", "winlog.event_data.clientCreationTime", "winlog.event_data.keyFilePath", "winlog.event_data.keyName", "winlog.event_data.keyType", "winlog.event_data.operation", "winlog.event_data.providerName", "data.euid", "data.logname", "data.pwd", "data.srcuser", "data.tty", "process.command_line", "winlog.event_data.workstation", "agent.ephemeral_id", "agent.hostname", "agent.type", "agent.version", "file.accessed", "file.ctime", "file.flavors.yara", "file.mtime", "file.permissions", "file.scanners", "file.tree.node", "file.tree.parent", "file.tree.root", "hash.sha256", "hash.ssdeep", "request.attributes.filename", "request.client", "request.id", "request.source", "scan.header.header", "scan.pe.debug.guid", "scan.pe.debug.pdb", "scan.pe.debug.type", "scan.pe.file_info.fixed.operating_systems", "scan.pe.file_info.fixed.type.primary", "scan.pe.file_info.string.name", "scan.pe.file_info.string.value", "scan.pe.file_info.var.character_set", "scan.pe.file_info.var.language", "scan.pe.flags", "scan.pe.header.characteristics.dll", "scan.pe.header.characteristics.image", "scan.pe.header.machine.type", "scan.pe.header.magic.dos", "scan.pe.header.magic.image", "scan.pe.header.subsystem", "scan.pe.imphash", "scan.pe.resources.language.primary", "scan.pe.resources.language.sub", "scan.pe.resources.name", "scan.pe.resources.type", "scan.pe.sections.characteristics", "scan.pe.sections.name", "scan.pe.symbols.imported", "scan.pe.symbols.libraries", "scan.pe.symbols.table.library", "scan.pe.symbols.table.symbols", "scan.pe.symbols.table.type", "scan.x509.fingerprint", "scan.x509.issuer", "scan.x509.serial_number", "scan.x509.subject", "scan.xml.namespaces", "scan.xml.tags", "scan.xml.version", "data.sca.check.compliance.cis_csc", "data.sca.check.description", "data.sca.check.id", "data.sca.check.previous_result", "data.sca.check.rationale", "data.sca.check.reason", "data.sca.check.references", "data.sca.check.registry", "data.sca.check.remediation", "data.sca.check.result", "data.sca.check.status", "data.sca.check.title", "data.sca.description", "data.sca.failed", "data.sca.file", "data.sca.invalid", "data.sca.passed", "data.sca.policy", "data.sca.policy_id", "data.sca.scan_id", "data.sca.score", "data.sca.total_checks", "data.sca.type", "rule.cis_csc", "data.win.installDeviceID.deviceInstanceID", "data.win.installDeviceID.driverDescription", "data.win.installDeviceID.driverName", "data.win.installDeviceID.driverProvider", "data.win.installDeviceID.driverVersion", "data.win.installDeviceID.installStatus", "data.win.installDeviceID.isDriverOEM", "data.win.installDeviceID.rebootOption", "data.win.installDeviceID.setupClass", "data.win.installDeviceID.upgradeDevice", "data.gid", "data.home", "data.shell", "data.sca.check.compliance.hipaa", "data.sca.check.compliance.nist_800_53", "data.sca.check.compliance.pci_dss", "data.sca.check.compliance.tsc", "data.sca.check.file", "data.win.addServiceID.addServiceStatus", "data.win.addServiceID.deviceInstanceID", "data.win.addServiceID.driverFileName", "data.win.addServiceID.primaryService", "data.win.addServiceID.serviceName", "data.win.addServiceID.updateService", "winlog.event_data.deviceInstance", "winlog.event_data.deviceInstanceLength", "winlog.event_data.processNameLength", "osquery.result.action", "osquery.result.calendarTime", "osquery.result.codename", "osquery.result.columns.description", "osquery.result.columns.directory", "osquery.result.columns.gid", "osquery.result.columns.gid_signed", "osquery.result.columns.shell", "osquery.result.columns.uid", "osquery.result.columns.uid_signed", "osquery.result.columns.username", "osquery.result.columns.uuid", "osquery.result.endpoint_ip1", "osquery.result.endpoint_ip2", "osquery.result.hardware_serial", "osquery.result.hostIdentifier", "osquery.result.hostname", "osquery.result.live_query", "osquery.result.name"],
			"date": ["@timestamp", "until", "alert_time", "match_time"],
			"keyword": ["@version", "rule.uuid", "aggregate_id", "rule_name"],
			"text": ["client.address", "connection.history", "connection.state", "connection.state_description", "destination.geo.city_name", "destination.geo.continent_name", "destination.geo.country_iso_code", "destination.geo.country_name", "destination.geo.region_iso_code", "destination.geo.region_name", "destination.geo.timezone", "dhcp.assigned_ip", "dhcp.message_types", "dhcp.requested_address", "dns.answers", "dns.highest_registered_domain", "dns.parent_domain", "dns.query.class_name", "dns.query.name", "dns.query.type_name", "dns.response.code_name", "dns.subdomain", "dns.top_level_domain", "ecs.version", "event.category", "event.dataset", "event.module", "file.analyzer", "file.compile_timestamp", "file.extracted.filename", "file.machine", "file.mime_type", "file.name", "file.os", "file.resp_filenames", "file.resp_mime_types", "file.section_names", "file.source", "file.subsystem", "hash.ja3s", "hash.md5", "hash.sha1", "host.domain", "host.hostname", "host.mac", "http.method", "http.status_message", "http.uri", "http.useragent", "http.version", "http.virtual_host", "ingest.timestamp", "intel.indicator", "log.file.path", "log.id.fuid", "log.id.orig_fuids", "log.id.resp_fuids", "log.id.uid", "log.id.uids", "message", "network.community_id", "network.protocol", "network.transport", "notice.action", "notice.message", "notice.note", "notice.peer_description", "notice.sub_message", "observer.name", "scan.exiftool", "server.address", "software.name", "software.type", "software.version.unparsed", "source.geo.city_name", "source.geo.continent_name", "source.geo.country_iso_code", "source.geo.country_name", "source.geo.region_iso_code", "source.geo.region_name", "source.geo.timezone", "ssh.direction", "ssh.server", "ssl.certificate.chain_fuids", "ssl.cipher", "ssl.curve", "ssl.last_alert", "ssl.next_protocol", "ssl.validation_status", "ssl.version", "tags", "weird.name", "weird.peer", "x509.certificate.curve", "x509.certificate.exponent", "x509.certificate.issuer", "x509.certificate.key.algorithm", "x509.certificate.key.type", "x509.certificate.not_valid_after", "x509.certificate.not_valid_before", "x509.certificate.serial", "x509.certificate.signing_algorithm", "x509.certificate.subject", "x509.san_dns", "agent.id", "agent.name", "data.extra_data", "data.file", "data.hardware.cpu_cores", "data.hardware.cpu_mhz", "data.hardware.cpu_name", "data.hardware.ram_free", "data.hardware.ram_total", "data.hardware.ram_usage", "data.hardware.serial", "data.hotfix", "data.netinfo.iface.adapter", "data.netinfo.iface.ipv4.address", "data.netinfo.iface.ipv4.broadcast", "data.netinfo.iface.ipv4.dhcp", "data.netinfo.iface.ipv4.gateway", "data.netinfo.iface.ipv4.metric", "data.netinfo.iface.ipv4.netmask", "data.netinfo.iface.ipv6.address", "data.netinfo.iface.ipv6.dhcp", "data.netinfo.iface.ipv6.netmask", "data.netinfo.iface.mac", "data.netinfo.iface.mtu", "data.netinfo.iface.name", "data.netinfo.iface.rx_bytes", "data.netinfo.iface.rx_dropped", "data.netinfo.iface.rx_errors", "data.netinfo.iface.rx_packets", "data.netinfo.iface.state", "data.netinfo.iface.tx_bytes", "data.netinfo.iface.tx_dropped", "data.netinfo.iface.tx_errors", "data.netinfo.iface.tx_packets", "data.netinfo.iface.type", "data.os.architecture", "data.os.build", "data.os.hostname", "data.os.major", "data.os.minor", "data.os.name", "data.os.os_release", "data.os.platform", "data.os.release", "data.os.release_version", "data.os.sysname", "data.os.version", "data.port.inode", "data.port.local_ip", "data.port.local_port", "data.port.pid", "data.port.process", "data.port.protocol", "data.port.remote_ip", "data.port.remote_port", "data.port.rx_queue", "data.port.state", "data.port.tx_queue", "data.title", "data.type", "data.uid", "data.win.rmSessionEvent.rmSessionId", "data.win.rmSessionEvent.uTCStartTime", "event.code", "event.severity_label", "event.timestamp", "host.name", "host.syscheck.changed_attributes", "host.syscheck.event", "host.syscheck.mode", "host.syscheck.mtime_after", "host.syscheck.mtime_before", "host.syscheck.path", "host.syscheck.sha1_after", "host.syscheck.sha1_before", "log.full", "log.id.id", "log.location", "log.previous_log", "log.previous_output", "manager.name", "process.args", "process.cmd", "process.egroup", "process.euser", "process.fgroup", "process.name", "process.nice", "process.nlwp", "process.pgrp", "process.pid", "process.ppid", "process.priority", "process.processor", "process.resident", "process.rgroup", "process.ruser", "process.session", "process.sgroup", "process.share", "process.size", "process.start_time", "process.state", "process.stime", "process.suser", "process.tgid", "process.tty", "process.utime", "process.vm_size", "rule.category", "rule.gdpr", "rule.gpg13", "rule.groups", "rule.hipaa", "rule.info", "rule.mitre.id", "rule.mitre.tactic", "rule.mitre.technique", "rule.name", "rule.nist_800_53", "rule.pci_dss", "rule.tsc", "user.escalated", "winlog.channel", "winlog.computer", "winlog.eventRecordID", "winlog.eventSourceName", "winlog.event_data.accountName", "winlog.event_data.address", "winlog.event_data.addressLength", "winlog.event_data.attributes", "winlog.event_data.authenticationPackageName", "winlog.event_data.averageResume", "winlog.event_data.binary", "winlog.event_data.biosInitDuration", "winlog.event_data.callerProcessId", "winlog.event_data.callerProcessName", "winlog.event_data.checkpointDuration", "winlog.event_data.clientProcessId", "winlog.event_data.countOfCredentialsReturned", "winlog.event_data.currentStratumNumber", "winlog.event_data.data", "winlog.event_data.deviceName", "winlog.event_data.deviceNameLength", "winlog.event_data.deviceTime", "winlog.event_data.deviceVersionMajor", "winlog.event_data.deviceVersionMinor", "winlog.event_data.dirtyPages", "winlog.event_data.driverInitDuration", "winlog.event_data.effectiveState", "winlog.event_data.elevatedToken", "winlog.event_data.extraInfo", "winlog.event_data.extraString", "winlog.event_data.extraStringLength", "winlog.event_data.failureReason", "winlog.event_data.finalStatus", "winlog.event_data.flags", "winlog.event_data.fullResume", "winlog.event_data.hiberPagesWritten", "winlog.event_data.hiberReadDuration", "winlog.event_data.hiberWriteDuration", "winlog.event_data.hiveName", "winlog.event_data.hiveNameLength", "winlog.event_data.identity", "winlog.event_data.imagePath", "winlog.event_data.impersonationLevel", "winlog.event_data.internalCode", "winlog.event_data.ipAddress", "winlog.event_data.ipPort", "winlog.event_data.keyLength", "winlog.event_data.keysUpdated", "winlog.event_data.logonGuid", "winlog.event_data.logonProcessName", "winlog.event_data.logonType", "winlog.event_data.newSize", "winlog.event_data.newTime", "winlog.event_data.noMultiStageResumeReason", "winlog.event_data.oldTime", "winlog.event_data.originalSize", "winlog.event_data.param1", "winlog.event_data.param10", "winlog.event_data.param11", "winlog.event_data.param2", "winlog.event_data.param3", "winlog.event_data.param4", "winlog.event_data.param5", "winlog.event_data.param6", "winlog.event_data.param7", "winlog.event_data.param8", "winlog.event_data.param9", "winlog.event_data.previousTime", "winlog.event_data.privilegeList", "winlog.event_data.processCreationTime", "winlog.event_data.processID", "winlog.event_data.processId", "winlog.event_data.processName", "winlog.event_data.programmedWakeTimeAc", "winlog.event_data.programmedWakeTimeDc", "winlog.event_data.queryName", "winlog.event_data.readOperation", "winlog.event_data.reason", "winlog.event_data.resource", "winlog.event_data.resumeCount", "winlog.event_data.returnCode", "winlog.event_data.rmId", "winlog.event_data.schema", "winlog.event_data.schemaFriendlyName", "winlog.event_data.serviceGuid", "winlog.event_data.serviceName", "winlog.event_data.serviceType", "winlog.event_data.sleepDuration", "winlog.event_data.sleepTime", "winlog.event_data.startType", "winlog.event_data.status", "winlog.event_data.subStatus", "winlog.event_data.subjectDomainName", "winlog.event_data.subjectLogonId", "winlog.event_data.subjectUserName", "winlog.event_data.subjectUserSid", "winlog.event_data.tSId", "winlog.event_data.targetDomainName", "winlog.event_data.targetInfo", "winlog.event_data.targetLinkedLogonId", "winlog.event_data.targetLogonGuid", "winlog.event_data.targetLogonId", "winlog.event_data.targetName", "winlog.event_data.targetServerName", "winlog.event_data.targetSid", "winlog.event_data.targetState", "winlog.event_data.targetUserName", "winlog.event_data.targetUserSid", "winlog.event_data.timeProvider", "winlog.event_data.timeSource", "winlog.event_data.timeSourceRefId", "winlog.event_data.tmId", "winlog.event_data.type", "winlog.event_data.updateGuid", "winlog.event_data.updateRevisionNumber", "winlog.event_data.updateTitle", "winlog.event_data.userSid", "winlog.event_data.virtualAccount", "winlog.event_data.wakeDuration", "winlog.event_data.wakeFromState", "winlog.event_data.wakeRequesterTypeAc", "winlog.event_data.wakeRequesterTypeDc", "winlog.event_data.wakeSourceText", "winlog.event_data.wakeSourceTextLength", "winlog.event_data.wakeSourceType", "winlog.event_data.wakeTime", "winlog.event_data.wakeTimerContext", "winlog.event_data.wakeTimerContextLength", "winlog.event_data.wakeTimerOwner", "winlog.event_data.wakeTimerOwnerLength", "winlog.event_data.workstationName", "winlog.keywords", "winlog.level", "winlog.message", "winlog.opcode", "winlog.processID", "winlog.providerGuid", "winlog.providerName", "winlog.severityValue", "winlog.systemTime", "winlog.task", "winlog.threadID", "winlog.event_data.apiCallerName", "winlog.event_data.apiCallerNameLength", "winlog.event_data.lightestSystemState", "winlog.event_data.systemAction", "winlog.event_data.transitionsToOn", "weird.additional_info", "host.syscheck.gid_after", "host.syscheck.gname_after", "host.syscheck.md5_after", "host.syscheck.md5_before", "host.syscheck.perm_after", "host.syscheck.sha256_after", "host.syscheck.sha256_before", "host.syscheck.size_after", "host.syscheck.size_before", "host.syscheck.uid_after", "host.syscheck.uname_after", "winlog.event_data.domainPeer", "winlog.event_data.errorMessage", "winlog.event_data.nTSTATUS", "winlog.event_data.retryMinutes", "winlog.event_data.sourceFileID", "winlog.event_data.sourceLine", "winlog.event_data.sourceTag", "winlog.event_data.volumeName", "network.data.decoded", "rule.action", "rule.metadata.created_at", "rule.metadata.updated_at", "rule.reference", "rule.rule", "rule.ruleset", "winlog.event_data.auditSourceName", "winlog.event_data.bufferSize", "winlog.event_data.corruptionActionState", "winlog.event_data.driveName", "winlog.event_data.errorCode", "winlog.event_data.eventSourceId", "winlog.event_data.filesCachedFirstPass", "winlog.event_data.filesMissedSecondPass", "winlog.event_data.filesResident", "winlog.event_data.filesScoped", "winlog.event_data.library", "winlog.event_data.requiredSize", "winlog.event_data.service", "winlog.event_data.snapshotPath", "winlog.event_data.totalDirectories", "winlog.event_data.totalFiles", "winlog.event_data.algorithmName", "winlog.event_data.clientCreationTime", "winlog.event_data.keyFilePath", "winlog.event_data.keyName", "winlog.event_data.keyType", "winlog.event_data.operation", "winlog.event_data.providerName", "data.euid", "data.logname", "data.pwd", "data.srcuser", "data.tty", "process.command_line", "winlog.event_data.workstation", "agent.ephemeral_id", "agent.hostname", "agent.type", "agent.version", "file.accessed", "file.ctime", "file.flavors.yara", "file.mtime", "file.permissions", "file.scanners", "file.tree.node", "file.tree.parent", "file.tree.root", "hash.sha256", "hash.ssdeep", "request.attributes.filename", "request.client", "request.id", "request.source", "scan.header.header", "scan.pe.debug.guid", "scan.pe.debug.pdb", "scan.pe.debug.type", "scan.pe.file_info.fixed.operating_systems", "scan.pe.file_info.fixed.type.primary", "scan.pe.file_info.string.name", "scan.pe.file_info.string.value", "scan.pe.file_info.var.character_set", "scan.pe.file_info.var.language", "scan.pe.flags", "scan.pe.header.characteristics.dll", "scan.pe.header.characteristics.image", "scan.pe.header.machine.type", "scan.pe.header.magic.dos", "scan.pe.header.magic.image", "scan.pe.header.subsystem", "scan.pe.imphash", "scan.pe.resources.language.primary", "scan.pe.resources.language.sub", "scan.pe.resources.name", "scan.pe.resources.type", "scan.pe.sections.characteristics", "scan.pe.sections.name", "scan.pe.symbols.imported", "scan.pe.symbols.libraries", "scan.pe.symbols.table.library", "scan.pe.symbols.table.symbols", "scan.pe.symbols.table.type", "scan.x509.fingerprint", "scan.x509.issuer", "scan.x509.serial_number", "scan.x509.subject", "scan.xml.namespaces", "scan.xml.tags", "scan.xml.version", "data.sca.check.compliance.cis_csc", "data.sca.check.description", "data.sca.check.id", "data.sca.check.previous_result", "data.sca.check.rationale", "data.sca.check.reason", "data.sca.check.references", "data.sca.check.registry", "data.sca.check.remediation", "data.sca.check.result", "data.sca.check.status", "data.sca.check.title", "data.sca.description", "data.sca.failed", "data.sca.file", "data.sca.invalid", "data.sca.passed", "data.sca.policy", "data.sca.policy_id", "data.sca.scan_id", "data.sca.score", "data.sca.total_checks", "data.sca.type", "rule.cis_csc", "data.win.installDeviceID.deviceInstanceID", "data.win.installDeviceID.driverDescription", "data.win.installDeviceID.driverName", "data.win.installDeviceID.driverProvider", "data.win.installDeviceID.driverVersion", "data.win.installDeviceID.installStatus", "data.win.installDeviceID.isDriverOEM", "data.win.installDeviceID.rebootOption", "data.win.installDeviceID.setupClass", "data.win.installDeviceID.upgradeDevice", "data.gid", "data.home", "data.shell", "data.sca.check.compliance.hipaa", "data.sca.check.compliance.nist_800_53", "data.sca.check.compliance.pci_dss", "data.sca.check.compliance.tsc", "data.sca.check.file", "data.win.addServiceID.addServiceStatus", "data.win.addServiceID.deviceInstanceID", "data.win.addServiceID.driverFileName", "data.win.addServiceID.primaryService", "data.win.addServiceID.serviceName", "data.win.addServiceID.updateService", "winlog.event_data.deviceInstance", "winlog.event_data.deviceInstanceLength", "winlog.event_data.processNameLength", "osquery.result.action", "osquery.result.calendarTime", "osquery.result.codename", "osquery.result.columns.description", "osquery.result.columns.directory", "osquery.result.columns.gid", "osquery.result.columns.gid_signed", "osquery.result.columns.shell", "osquery.result.columns.uid", "osquery.result.columns.uid_signed", "osquery.result.columns.username", "osquery.result.columns.uuid", "osquery.result.endpoint_ip1", "osquery.result.endpoint_ip2", "osquery.result.hardware_serial", "osquery.result.hostIdentifier", "osquery.result.hostname", "osquery.result.live_query", "osquery.result.name"],
			"long": ["client.bytes", "client.ip_bytes", "client.packets", "connection.bytes.missed", "destination.port", "dns.id", "dns.parent_domain_length", "dns.query.class", "dns.query.length", "dns.query.type", "dns.reserved", "dns.response.code", "dns.subdomain_length", "file.bytes.missing", "file.bytes.overflow", "file.bytes.seen", "file.bytes.total", "file.depth", "http.request.body.length", "http.response.body.length", "http.status_code", "http.trans_depth", "log.offset", "network.bytes", "notice.p", "rule.score", "server.bytes", "server.ip_bytes", "server.packets", "software.version.major", "software.version.minor", "source.port", "ssh.authentication.attempts", "winlog.event_id", "winlog.version", "x509.certificate.key.length", "x509.certificate.version", "event.severity", "rule.firedtimes", "rule.level", "host.syscheck.inode_after", "host.syscheck.inode_before", "rule.gid", "rule.rev", "rule.severity", "file.size", "request.time", "scan.entropy.entropy", "scan.libarchive.total.extracted", "scan.libarchive.total.files", "scan.pe.debug.age", "scan.pe.header.address.code", "scan.pe.header.address.entry_point", "scan.pe.header.address.image", "scan.pe.header.alignment.file", "scan.pe.header.alignment.section", "scan.pe.header.checksum", "scan.pe.header.machine.id", "scan.pe.header.size.code", "scan.pe.header.size.data.initialized", "scan.pe.header.size.data.uninitialized", "scan.pe.header.size.headers", "scan.pe.header.size.heap.commit", "scan.pe.header.size.heap.reserve", "scan.pe.header.size.image", "scan.pe.header.size.stack.commit", "scan.pe.header.size.stack.reserve", "scan.pe.header.timestamp", "scan.pe.header.version.image", "scan.pe.header.version.operating_system", "scan.pe.header.version.subsystem", "scan.pe.resources.id", "scan.pe.sections.address.physical", "scan.pe.sections.address.virtual", "scan.pe.sections.size", "scan.pe.total.libraries", "scan.pe.total.resources", "scan.pe.total.sections", "scan.pe.total.symbols", "scan.pkcs7.total.certificates", "scan.pkcs7.total.extracted", "scan.x509.not_after", "scan.x509.not_before", "scan.x509.version", "scan.xml.total.extracted", "scan.xml.total.tags", "osquery.result.counter", "osquery.result.epoch", "osquery.result.unixTime"],
			"ip": ["client.ip", "destination.geo.ip", "destination.ip", "destination_geo.ip", "geoip.ip", "server.ip", "source.geo.ip", "source.ip", "source_geo.ip", "agent.ip"],
			"integer": ["client.port", "server.port"],
			"boolean": ["connection.local.originator", "connection.local.responder", "dns.authoritative", "dns.query.rejected", "dns.recursion.available", "dns.recursion.desired", "dns.truncated", "file.aslr", "file.code_integrity", "file.debug_data", "file.dep", "file.extracted.cutoff", "file.is_64bit", "file.is_exe", "file.is_orig", "file.local_orig", "file.seh", "file.table.cert", "file.table.export", "file.table.import", "file.timed_out", "ssl.established", "ssl.resumed", "weird.notice", "x509.basic_constraints.ca", "rule.mail", "scan.x509.expired", "osquery.result.numerics"],
			"float": ["destination.geo.location.lat", "destination.geo.location.lon", "dhcp.lease_time", "dns.ttls", "event.duration", "notice.suppress_for", "source.geo.location.lat", "source.geo.location.lon", "hash.elapsed", "scan.entropy.elapsed", "scan.header.elapsed", "scan.libarchive.elapsed", "scan.pe.elapsed", "scan.pe.header.version.linker", "scan.pe.sections.entropy", "scan.pkcs7.elapsed", "scan.yara.elapsed", "scan.entropy.entropy", "scan.x509.elapsed", "scan.xml.elapsed"],
			"half_float": ["destination_geo.latitude", "destination_geo.longitude", "geoip.latitude", "geoip.longitude", "source_geo.latitude", "source_geo.longitude"],
			"geo_point": ["destination_geo.location", "geoip.location", "source_geo.location"],
			"[object Object]": [""],
			"fieldTypes": {
				"0": "allFields",
				"1": "keywordFields",
				"2": "date",
				"3": "keyword",
				"4": "text",
				"5": "long",
				"6": "ip",
				"7": "integer",
				"8": "boolean",
				"9": "float",
				"10": "half_float",
				"11": "geo_point",
				"12": "[object Object]"
			}
		}
			
		
		saveMappingsData(thisDst, thisIndexPattern, tmpMappings)
		
	}

	if(GLB.devMode){
		ww(1, "Enabling Dev Mode")
		
		var elem = document.createElement("img");
		elem.setAttribute("src", "./squares-ui-icons/159122-technology-icon-collection/svg/browser-28.svg");	
		elem.setAttribute("class", "squarePageMenuIcon")	
		elem.setAttribute("class", "fleft")	
		elem.setAttribute("class", "iconDevMode")
		elem.setAttribute("onClick", "location.assign(window.location.href.replace(/\\/#.*$/, \"/#\"))")	
		elem.setAttribute("alt", "Wipe URL");
		elem.setAttribute("title", "Reset to / page")
		$("#menu").append(elem)

		

		var elem = document.createElement("img");
		elem.setAttribute("src", "./squares-ui-icons/159122-technology-icon-collection/svg/browser-5.svg");	
		elem.setAttribute("class", "squarePageMenuIcon")	
		elem.setAttribute("class", "fleft")	
		elem.setAttribute("class", "iconDevMode")
		elem.setAttribute("onClick", "dumpURLToConsole(); alertify.log('URL Logged to Console')")	
		elem.setAttribute("alt", "Log");
		elem.setAttribute("title", "Dump Squares config to Console")
		$("#menu").append(elem)

		var elem = document.createElement("img");
		elem.setAttribute("src", "./squares-ui-icons/159122-technology-icon-collection/svg/browser-23.svg");	
		elem.setAttribute("class", "squarePageMenuIcon")	
		elem.setAttribute("class", "fleft")	
		elem.setAttribute("class", "iconDevMode")
		elem.setAttribute("onClick", "deleteAllStoredData()")	
		elem.setAttribute("alt", "FlushData");
		elem.setAttribute("title", "Delete cached data, but don't disrupt page")
		$("#menu").append(elem)

	}

	db = new Dexie("squares");
	db.version(1).stores({
		squares: "[squareid+keyType+keyName], squareid, keyType, keyName, [squareid+keyType]"

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
		&& /^[\w =+\/]+$/.test(hash)
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

		url = {}
		url.v = "1"

		url.squares = []
		url.squares.push({"id":1,"Pr":[0],"Gt":"intro","Wi":[],"x":-800,"y":-800,"Co":"Introduction"})
		url.squares.push({"id":2,"Pr":[1],"Gt":"instructions","Wi":[],"x":-950,"y":600})
		
		if(GLB.demoMode){
			url.squares.push({"id":3,"Pr":[1],"Gt":"demoMode","Wi":[],"x":0,"y":850})			
			
			url.squares.push({"id":10,"Pr":[0],"Gt":"DescribeSquare","Wi":[900, -900, 0],"x":-700,"y":850, "Co":"Dummy"})
				url.squares.push({"id":11,"x":-1200,"y":700,"Pr":[10],"Gt":"RawOutput","Cs":{"x_count":"5"}})
				url.squares.push({"id":12,"x":-450,"y":1000,"Pr":[10],"Gt":"TreemapCandles","Cs":{"array":["network.protocol","destination.port"],"x_candle":"network.bytes","x_scale":"log","x_null":true}})
				url.squares.push({"id":13,"x":450,"y":1000,"Pr":[10],"Gt":"Calendar HeatMap","Cs":{"x_field":"@timestamp"}})
				url.squares.push({"id":14,"x":1200,"y":700,"Pr":[10],"Gt":"Trend","Cs":{"x_field":"event.dataset","x_windowSlide":"Fracture","x_windows":"6"}})

		}else{
			url.squares.push({"id":3,"Pr":[1],"Gt":"addServers","Wi":[],"x":0,"y":850})
			url.squares.push({"id":4,"Pr":[3],"Gt":"listServers","Wi":[],"x":0,"y":800})
		}
		
		
		
		
		url.squares.push({"id":5,"Pr":[1],"Gt":"youtube","Wi":[],"x":950,"y":550,"Cs":{"link":"iShTunNyuKo"}})

		

		url['Zt'] = "translate(1530,863) scale(0.57)"
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

		// qq("loading Three components")
 		// $.getScript('./Three/three.js', function() { 
			 
		// 	// // qq("three.js loaded, loading further libraries") 
		// 	$.getScript('./lib/stats.js', function() { 
		// 		//qq("stats.js loaded") 
				
		// 		$.getScript('./lib/threex.rendererstats.js', function() { 
		// 			//qq("renderstats.js loaded")
				
		// 			$.getScript('./myThree.js', function() { 
						
		// 				//qq("myThree.js loaded") 
					
						if(GLB.threejs.realTimeRender === true){
							// set off real time rendering
							animate_Three();
						}else{
							// setTimeout for slower refresh, but better on low spec machines
							setTimeoutThree(GLB.threejs.notRealTimeRenderFrequency);
						}
						
						compileGraphs();
		
			// 		});				
				
				
				
			// 	});
		
			// });

			
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

			threeRenderer.domElement.id = 'threejscanvas';
			// container = document.getElementById( 'workspacecontainer' );
			// container.appendChild( threeRenderer.domElement );
			document.getElementById( 'workspace' ).appendChild( threeRenderer.domElement );

			//mouse = new THREE.Vector2(), INTERSECTED;
			mouse = new THREE.Vector2();

			// // threeRenderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
			// // // allow for screens of retina, or large OS font
			// // const yourPixelRatio = window.devicePixelRatio
			// // threeRenderer.setPixelRatio( 1/yourPixelRatio );
			// // threeRenderer.domElement.id = 'threejscanvas';
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
		
			



		//  });	
	}





}

