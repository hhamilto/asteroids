
window.onerror = function(error) {
    alert(error);
}

document.addEventListener("DOMContentLoaded", function(event) {
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

	window.addEventListener("deviceorientation", function(e){
		//beta/gamma
		var tiltHeading = -Math.atan2(e.beta,-e.gamma)
		tiltHeading = (tiltHeading+(Math.PI*2))%(Math.PI*2)
		space.controls.yaw = tiltHeading-ship.heading
		if(space.controls.yaw > Math.PI)
			space.controls.yaw-=2*Math.PI
		if(space.controls.yaw < -Math.PI)
			space.controls.yaw+=2*Math.PI
		space.controls.yaw = Math.max(-1,Math.min(1,space.controls.yaw))
	})

	var throttleDiv = document.getElementById('throttle-control')

	throttleDiv.addEventListener("touchstart", function(e){
		e.preventDefault()
		space.controls.accel = .5
	})
	throttleDiv.addEventListener("touchend", function(e){
		e.preventDefault()
		space.controls.accel = 0
	})

	gameCanvas.addEventListener("touchstart", function(e){
		SpaceModel.Ship.Fire(space.ship)
	})
	
	var score = 0
	
	window.addEventListener('keydown', function(e){
		if(e.key == 'a' || e.keyCode == 37)
			space.controls.yaw=-.7//less touchy
		else if(e.key == 'd' || e.keyCode == 39)
			space.controls.yaw=.7
		else if(e.key == 'w' || e.keyCode == 38)
			space.controls.accel=1
		else if(e.key == ' ')
			SpaceModel.Ships.Fire(space.ship)
		else if(e.key == 'p')
			alert('Paused')
	})
	window.addEventListener('keyup', function(e){
		if(e.key == 'a' || e.keyCode == 37)
			space.controls.yaw=0
		else if(e.key == 'd' || e.keyCode == 39)
			space.controls.yaw=0
		else if(e.key == 'w' || e.keyCode == 38)
			space.controls.accel=0
	})

	gameOverDiv = document.getElementById('game-over')
	space.on('game-over', function(){
		gameOverDiv.className = ''
	})
	
	var RAF_callback = function(currentTime){
		SpaceModel.Spaces.Update(space, currentTime)
		window.requestAnimationFrame(RAF_callback)
	}
	window.requestAnimationFrame(RAF_callback)
})