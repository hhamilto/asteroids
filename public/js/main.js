
window.onerror = function(error) {
    alert(error);
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
			initializeGameComponent()
		}else{
			document.getElementById('calibrate-tilt-settings-view').className = ''
		}
	}else{
		// don't worry about device orientation calibration, show game
		document.getElementById('game-view').className = ''
		initializeGameComponent()

	}
	
	blink()
})

var initializeGameComponent = function(){
	var space = SpaceModel.Spaces.Create()
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
	space.controls.accel = .2
	space.ship.heading = Math.PI /4


	SpaceModel.Autopilot(space)

	gameOverDiv = document.getElementById('game-over')

	var RAF_callback = function(currentTime){
		SpaceModel.Spaces.Update(space, currentTime)
		window.requestAnimationFrame(RAF_callback)
	}
	window.requestAnimationFrame(RAF_callback)

	var startOverlay = document.getElementById('start-new')
	gameStarted = false

	space.on('game-over', function(){
		if(gameStarted)
			gameOverDiv.className = ''
	})
	var startGame = function(){
		gameCanvas.removeEventListener('click', startGame)
		var level = 1
		ControlsAdapter.bindTo(space.controls)
		startOverlay.className = startOverlay.className+' hidden'
		SpaceModel.ClearAutopilot()
		space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
		space.controls.accel = 0
		space.ship.heading = Math.PI
		gameStarted = true
		SpaceModel.Spaces.SetLevel(space,level)
		space.on('asteroid.destroyed', function(){
			if(space.asteroids.length == 0)
				SpaceModel.Spaces.SetLevel(space,++level)
		})
	}
	gameCanvas.addEventListener('click', startGame)
}

var blink = function(){
	var elements = document.querySelectorAll('.blink')
	var on = true
	setInterval(function(){
		on = !on
		_.each(elements, on?function(el){
			el.style.opacity = '1'
		}:function(el){
			el.style.opacity = '0'
		})
	}, 1000)
}