
var threeScenes = new Object();
var threeRenderer;
var rendererStats	= new THREEx.RendererStats()
var stats0 = new Stats();
var stats1 = new Stats();
var stats2 = new Stats();

var grid_size = 2000;
var grid_cuts = 10;
var gridCenterLine = 0x45656;
var gridLines = 0x45656;

//https://raw.githubusercontent.com/mrdoob/three.js/master/examples/webgl_interactive_cubes.html
var masterAmbientLight = new THREE.AmbientLight( 0xffffff );

var masterCamera = new THREE.PerspectiveCamera(45, 1, 1, 15000);
cameraDist = 1.4
masterCamera.position.x = grid_size*cameraDist;
masterCamera.position.y = grid_size*cameraDist;
masterCamera.position.z = grid_size*cameraDist;
//masterCamera.lookAt(new THREE.Vector3(grid_size/2,grid_size/3,grid_size/2))





var masterGridXY = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridXY.rotation.x = Math.PI/2;
masterGridXY.position.set((grid_size*0.5), (grid_size*0.5), 0);

var masterGridXZ = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridXZ.position.set((grid_size*0.5), 0, (grid_size*0.5));
// no rotation

var masterGridYZ = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridYZ.position.set(0, (grid_size*0.5), (grid_size*0.5));
masterGridYZ.rotation.z = Math.PI/2;

const yourPixelRatio = window.devicePixelRatio


function setTimeoutThree(interval){
	// loop "update.controls" 1000 times here to make up for lack of ticks?
//	setInterval( function(){ render_Three() }, interval); 	
}

function animate_Three() {
	
    setTimeout( function() {

		requestAnimationFrame( animate_Three );
		//if(!document.hidden){
			render_Three();	
		//}
    }, GLB.threejs.fps_TimeOut );

}


function render_Three(){
	//https://threejs.org/examples/webgl_multiple_elements.html

	stats0.begin();
	stats1.begin();
	stats2.begin();


	rendererStats.update(threeRenderer);

	updateSize_Three();

	threeRenderer.setClearColor( 0x000000, 0 );
	// threeRenderer.setScissorTest( false );
	// threeRenderer.clear();

	threeRenderer.setClearColor( 0x000000,0 );
	threeRenderer.setScissorTest( true );

	for (var prop in threeScenes) {

		if(!threeScenes.hasOwnProperty(prop)) continue;
		
		// check if it's offscreen. If so skip it
		var element = threeScenes[prop].userData.elementt;
		let rect_square = element.getBoundingClientRect();
		let render_space = document.getElementById("workspacecontainer").getBoundingClientRect();
		//let screen = document.documentElement.getBoundingClientRect();
		
		//qq(rect_square.left +" > " +(threeRenderer.domElement.clientWidth*1) + " > "+(threeRenderer.domElement.clientWidth*yourPixelRatio) + " > "+ (threeRenderer.domElement.clientWidth*3) )
		

		if ( rect_square.bottom < 0 || rect_square.top  > threeRenderer.domElement.clientHeight ||
			rect_square.right  < 0 || rect_square.left > (threeRenderer.domElement.clientWidth*1) ) {
			//ww(7, "square_"+square_id+" not in render scope");
			//continue;  // it's off screen
		}


		// rest of functionality
		var scene = threeScenes[prop];
		var camera = threeScenes[prop].userData.camera;
		var controls = threeScenes[prop].userData.controls;
		var raycaster = threeScenes[prop].userData.raycaster;
		var square_id = threeScenes[prop].userData.id;
		

		//var scale=atob(url.Zt).split(" ")[1].replace(/[a-z\(\)]/g, "")

		//correct
		var width  = Math.floor(rect_square.right - rect_square.left);
		var height = Math.floor(rect_square.bottom - rect_square.top);
		var left   = Math.floor(rect_square.left - render_space.x  + render_space.x);
		var bottom = Math.floor(threeRenderer.domElement.clientHeight - rect_square.bottom + render_space.y);

		

		//qq("scale:"+scale+", document.height:"+document.documentElement.clientHeight+" rect_bottom:"+rect_square.bottom+" sum:"+top)
		// qq("--------------------------")
		// qq(screen)
		// qq(render_space)
		// qq(rect_square)
		// qq(scale)
		// qq("----")
		


		// keep spinning the visual, or hold it still and raycast mouse position?
		if(mouse.realx > rect_square.left && mouse.realx < rect_square.right && mouse.realy > rect_square.top && mouse.realy < rect_square.bottom){
			// mouse is in this div/square
			// qq("mouse is in "+scene.userData.id);
			mouse.x = ((((mouse.realx - rect_square.left) / width ) * 2 ) - 1);
			mouse.y = ((((mouse.realy - rect_square.top) / height ) * 2 ) - 1) * -1;

			raycaster.setFromCamera( mouse, camera );
			var intersects = raycaster.intersectObjects( scene.children );


			//ww(7, "INTERSECT for square_"+square_id+" has "+intersects.length+" matches");
			if ( intersects.length > 0 ) {

				for(var i = 0 ; i < intersects.length ; i++ ){
					if(intersects[i].object.squaresName != null && intersects[i].object.squaresName != ""){
						theData = intersects[i].object.squaresName
						setHoverInfo(square_id, theData)
					}
				}
				
			}else{
				//$("#hoverInfo").css("visibility", "hidden");
			}

		}else{
			// only required if mouse not in this square.
			controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = truei
		}

		threeRenderer.setViewport(left, bottom, width, height );
		threeRenderer.setScissor( left, bottom, width, height );
		
		
	
		threeRenderer.render(threeScenes[prop], camera);
		
	}

	stats0.end();
	stats1.end();
	stats2.end();

}

function zz_onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	qq(mouse.x +" "+mouse.y);
}

function updateSize_Three() {
	var SCREEN_WIDTH = $("#workspacecontainer").innerWidth(), 
		SCREEN_HEIGHT = $("#workspacecontainer").innerHeight();
	threeRenderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT,  false );
}
 
