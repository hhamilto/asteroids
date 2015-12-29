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
	var correctionInfo = {
		x:['beta',1],
		y:['gamma',-1]
	}
	var lastRotation = [0,0]
	var windowDeviceOrientation = function(e){
		if(!e.beta)
			return
		var x = e[correctionInfo.x[0]]*correctionInfo.x[1]
		var y = e[correctionInfo.y[0]]*correctionInfo.y[1]
		var tiltHeading = -Math.atan2(x,y)
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
		e.preventDefault()
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
		useCorrectionInfo: function(newCorrectionInfo){
			correctionInfo = newCorrectionInfo
		}
	}
}())