//right now this is only tested on ios
OrientationPauseSafe = (function(){
	var space
	var waitForGoodOrientation = function(){
			if(window.orientation == 0){
				space.paused = true
				alert("Please return your device to landscape mode")
			}else{
				if(!startingOrientation)
					startingOrientation = window.orientation
				if(window.orientation == startingOrientation)
					space.paused = false
				else
					space.paused = true, alert("Please return your device to landscape mode")
			}
		}
	var initialize = function(newSpace){
		space = newSpace
		if(screen && screen.lockOrientation)
			screen.lockOrientation('landscape') // only works in firefox and ie, and only maybe in them.
		startingOrientation = window.orientation
		if(startingOrientation == 0)
			waitForGoodOrientation()
		window.addEventListener('orientationchange', waitForGoodOrientation)
		
	}
	return {
		initialize: initialize
	}
})()