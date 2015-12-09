ControlsAdapter = (function(){
	var controls
	var initialize = function(){
		window.addEventListener('keydown', function(e){
			if(e.keyCode == 'A'.charCodeAt(0) || e.keyCode == 37)
				controls.yaw=-.5//less touchy
			else if(e.keyCode == 'D'.charCodeAt(0) || e.keyCode == 39)
				controls.yaw=.5
			else if(e.keyCode == 'W'.charCodeAt(0) || e.keyCode == 38)
				controls.accel=1
			else if(e.keyCode == ' '.charCodeAt(0))
				controls.emit('fire')
			else if(e.keyCode == 'P'.charCodeAt(0))
				alert('Paused')
		})
		window.addEventListener('keyup', function(e){
			if(e.keyCode == 'A'.charCodeAt(0) || e.keyCode == 37)
				controls.yaw=0
			else if(e.keyCode == 'D'.charCodeAt(0) || e.keyCode == 39)
				controls.yaw=0
			else if(e.keyCode == 'W'.charCodeAt(0) || e.keyCode == 38)
				controls.accel=0
		})

		window.addEventListener("deviceorientation", function(e){
			//beta/gamma
			var tiltHeading = -Math.atan2(e.beta,-e.gamma)
			tiltHeading = (tiltHeading+(Math.PI*2))%(Math.PI*2)
			controls.desiredHeading = tiltHeading
		})

		var gameCanvas = document.getElementById('game-screen')
		var throttleDiv = document.getElementById('throttle-control')

		throttleDiv.addEventListener("touchstart", function(e){
			e.preventDefault()
			controls.accel = .5
		})
		throttleDiv.addEventListener("touchend", function(e){
			e.preventDefault()
			controls.accel = 0
		})

		gameCanvas.addEventListener("touchstart", function(e){
			controls.emit('fire')
		})
	}
		
	return {
		bindTo: function(newControls){
			if(controls)
				console.log("warning, rebinding controls")
			controls = newControls
			initialize()
		}
	}
}())