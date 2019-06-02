
var threeScenes = new Object();
var threeRenderer;
var rendererStats	= new THREEx.RendererStats()
var stats0 = new Stats();
var stats1 = new Stats();
var stats2 = new Stats();


//https://raw.githubusercontent.com/mrdoob/three.js/master/examples/webgl_interactive_cubes.html
var masterAmbientLight = new THREE.AmbientLight( 0xffffff );
var masterCamera = new THREE.PerspectiveCamera(45, 1, 1, 1000);

var grid_size = 200;
var grid_cuts = 10;
var gridCenterLine = 0x45656;
var gridLines = 0x45656;

var masterGridXY = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridXY.rotation.x = Math.PI/2;
masterGridXY.position.set((grid_size*0.5), (grid_size*0.5), 0);

var masterGridXZ = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridXZ.position.set((grid_size*0.5), 0, (grid_size*0.5));
// no rotation

var masterGridYZ = new THREE.GridHelper(grid_size, grid_cuts, gridCenterLine, gridLines);
masterGridYZ.position.set(0, (grid_size*0.5), (grid_size*0.5));
masterGridYZ.rotation.z = Math.PI/2;



function setTimeoutThree(interval){
	// loop "update.controls" 1000 times here to make up for lack of ticks?
//	setInterval( function(){ render_Three() }, interval); 	
}

function animate_Three() {
	


	requestAnimationFrame( animate_Three );
	//if(!document.hidden){
		render_Three();	
	//}
}

function render_Three(){
	//https://threejs.org/examples/webgl_multiple_elements.html

	stats0.begin();
	stats1.begin();
	stats2.begin();


	rendererStats.update(threeRenderer);

	updateSize_Three();

	threeRenderer.setClearColor( 0x000000, 0 );
	threeRenderer.setScissorTest( false );
	threeRenderer.clear();

	threeRenderer.setClearColor( 0x000000,0 );
	threeRenderer.setScissorTest( true );

	for (var prop in threeScenes) {

		if(!threeScenes.hasOwnProperty(prop)) continue;
		
		// check if it's offscreen. If so skip it
		var element = threeScenes[prop].userData.elementt;
		let rect = element.getBoundingClientRect();
		if ( rect.bottom < 0 || rect.top  > threeRenderer.domElement.clientHeight ||
			rect.right  < 0 || rect.left > threeRenderer.domElement.clientWidth ) {
			ww(7, "square_"+square_id+" not in render scope, RETURN");
			continue;  // it's off screen
		}


		// rest of functionality
		var scene = threeScenes[prop];
		var camera = threeScenes[prop].userData.camera;
		var controls = threeScenes[prop].userData.controls;
		var raycaster = threeScenes[prop].userData.raycaster;
		var square_id = threeScenes[prop].userData.id;


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

				for(var i = 0 ; i < intersects.length ; i++ ){
					if(intersects[i].object.sakeName != null && intersects[i].object.sakeName != ""){
						$("#hoverInfo").text(intersects[i].object.sakeName);
						$("#hoverInfo").css("visibility", "visible");
						$("#hoverInfo").css({top:  mouse.realy, left: (mouse.realx+50) });

					}
				}
				
			}else{
				$("#hoverInfo").css("visibility", "hidden");
			}

		}else{
			// only required if mouse not in this square.
			controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = truei
		}


		threeRenderer.setViewport( left, top, width, height );
		threeRenderer.setScissor( left, top, width, height );
	
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
	var SCREEN_WIDTH = $("#sakecontainer").innerWidth(), 
		SCREEN_HEIGHT = $("#sakecontainer").innerHeight();
	threeRenderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT,  false );
}
 
