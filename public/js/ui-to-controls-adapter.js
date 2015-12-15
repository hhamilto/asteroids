ControlsAdapter = (function(){
	var controls
	var windowKeyDown = function(e){
		if(e.keyCode == 'A'.charCodeAt(0) || e.keyCode == 37)
			controls.yaw=-.5//less touchy
		else if(e.keyCode == 'D'.charCodeAt(0) || e.keyCode == 39)
			controls.yaw=.5
		else if(e.keyCode == 'W'.charCodeAt(0) || e.keyCode == 38)
			controls.accel=1
		else if(e.keyCode == ' '.charCodeAt(0))
			controls.emit('fire')
		else if(e.keyCode == 'P'.charCodeAt(0))
			controls.emit('toggle-pause')
	}
	var windowKeyUp = function(e){
		if(e.keyCode == 'A'.charCodeAt(0) || e.keyCode == 37)
			controls.yaw=0
		else if(e.keyCode == 'D'.charCodeAt(0) || e.keyCode == 39)
			controls.yaw=0
		else if(e.keyCode == 'W'.charCodeAt(0) || e.keyCode == 38)
			controls.accel=0
	}
	var windowDeviceOrientation = function(e){
		//beta/gamma
		var tiltHeading = -Math.atan2(e.beta,-e.gamma)
		tiltHeading = (tiltHeading+(Math.PI*2))%(Math.PI*2)
		controls.desiredHeading = tiltHeading
	}
	var gameCanvas
	var throttleDiv
	var throttleDivTouchStart = function(e){
		e.preventDefault()
		controls.accel = .5
	}
	var throttleDivTouchEnd = function(e){
		e.preventDefault()
		controls.accel = 0
	}
	var gameCanvasTouchStart = function(e){
		controls.emit('fire')
	}
	var initialize = function(){
		window.addEventListener('keydown', windowKeyDown)
		window.addEventListener('keyup', windowKeyUp)
		window.addEventListener("deviceorientation", windowDeviceOrientation)
		gameCanvas = document.getElementById('game-screen')
		throttleDiv = document.getElementById('throttle-control')
		throttleDiv.addEventListener("touchstart", throttleDivTouchStart)
		throttleDiv.addEventListener("touchend", throttleDivTouchEnd)
		gameCanvas.addEventListener("touchstart", gameCanvasTouchStart)
	}
	var removeListeners = function(){
		window.removeEventListener('keydown', windowKeyDown)
		window.removeEventListener('keyup', windowKeyUp)
		window.removeEventListener("deviceorientation", windowDeviceOrientation)
		throttleDiv && throttleDiv.removeEventListener("touchstart", throttleDivTouchStart)
		throttleDiv && throttleDiv.removeEventListener("touchend", throttleDivTouchEnd)
		gameCanvas && gameCanvas.removeEventListener("touchstart", gameCanvasTouchStart)
	}
		
	return {
		bindTo: function(newControls){
			if(controls)
				console.log("warning, rebinding controls")
			controls = newControls
			initialize()
		},
		unbind: function(){
			controls = null
			removeListeners()
		},
		useCorrectionInfo: function(correctionInfo){
			
		}
	}
}())