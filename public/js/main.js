
window.onerror = function(error) {
    alert(error);
    alert(Object.keys(error));
}

document.addEventListener("DOMContentLoaded", function(event) {
	var globalTouchHandler = function(){
		//show throttle button
		document.getElementById('throttle-control').className = ''
		window.removeEventListener("touchstart", globalTouchHandler)
	}
	window.addEventListener("touchstart", globalTouchHandler)

	if(window.ondeviceorientation){
		// this device supports tilt functionality
		if(window.localStorage.tiltCalibration){
			ControlsAdapter.useCorrectionInfo(JSON.parse(window.localStorage.tiltCalibration))
			startGameComponent()
		}else{
			document.getElementById('calibrate-tilt-settings-view').className = ''
		}
	}else{
		// don't worry about device orientation calibration, show game
		document.getElementById('game-view').className = ''
		startGameComponent()

	}
	
})

var startGameComponent = function(){
	var space = SpaceModel.Spaces.Create()
	ControlsAdapter.bindTo(space.controls)
	var gameCanvas = document.getElementById('game-screen')
	var updateScreenDimensions = function(){
		space.dimensions = [gameCanvas.clientWidth,
		                    gameCanvas.clientHeight]
		gameCanvas.setAttribute('width', space.dimensions[0])
		gameCanvas.setAttribute('height', space.dimensions[1])
	}
	updateScreenDimensions()
	window.addEventListener('resize',_.throttle(updateScreenDimensions, 100))

	space.ctx = gameCanvas.getContext('2d')

	space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]

	gameOverDiv = document.getElementById('game-over')
	space.on('game-over', function(){
		gameOverDiv.className = ''
	})
	
	var RAF_callback = function(currentTime){
		SpaceModel.Spaces.Update(space, currentTime)
		window.requestAnimationFrame(RAF_callback)
	}
	window.requestAnimationFrame(RAF_callback)
}