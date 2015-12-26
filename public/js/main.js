
document.addEventListener("DOMContentLoaded", function(event) {
	var globalTouchHandler = function(){
		//show throttle button
		document.getElementById('throttle-control').className = ''
		window.removeEventListener("touchstart", globalTouchHandler)
	}
	window.addEventListener("touchstart", globalTouchHandler)

	globalDeviceOrientationHandler = function(e){
		if(e.beta){
			//e.beta means that the event has actual orientation data, and isn't just a dummy event
			if(window.localStorage.tiltCalibration){
				ControlsAdapter.useCorrectionInfo(JSON.parse(window.localStorage.tiltCalibration))
			}else{
				TiltCalibrater.doTiltCalibration()
			}
			window.removeEventListener("deviceorientation", globalDeviceOrientationHandler)
		}

	}
	window.addEventListener("deviceorientation", globalDeviceOrientationHandler)
	
	initializeGameComponent()

		
	blink()
})

var initializeGameComponent = function(){
	var space = SpaceModel.Spaces.Create()
	var gameCanvas = document.getElementById('game-screen')
	space.ctx = gameCanvas.getContext('2d')
	var updateScreenDimensions = function(){
		space.dimensions = [gameCanvas.clientWidth,
		                    gameCanvas.clientHeight]
		gameCanvas.setAttribute('width', space.dimensions[0])
		gameCanvas.setAttribute('height', space.dimensions[1])
	}
	var windowResizeHandler = function(e){
		updateScreenDimensions()
		window.scrollTo(0,0)
	}
	var livesDiv = document.getElementById('lives')
	var shipImgTemplate = document.querySelectorAll('#ship-template img')[0]
	var setLives = function(lives){
		if(lives<0) throw Error('What good is a negative life?g')
		livesDiv.innerHTML = ''
		while(lives--)
			livesDiv.appendChild(shipImgTemplate.cloneNode(true))
	}
	updateScreenDimensions()
	window.addEventListener('resize',_.throttle(windowResizeHandler, 100))
	var scoreDiv = document.getElementById('score')
	var gameOverDiv = document.getElementById('game-over')
	var gameViewDiv = document.getElementById('game-view')
	var startGame = function(){
		gameOverDiv.className = gameOverDiv.className+' hidden'
		gameViewDiv.removeEventListener('click', startGame)
		SpaceModel.Spaces.StartGame(space)
		scoreDiv.innerHTML = space.score
		ControlsAdapter.bindTo(space.controls)
		gameStarted = true
		setLives(space.lives)
	}
	space.ship.on('death', function(){
		setLives(space.lives)
	})
	space.on('asteroid.destroyed', function(roid){
		scoreDiv.innerHTML = space.score
	})
	var endGame = function(){
		if(gameStarted){
			gameOverDiv.className = gameOverDiv.className.replace(/ ?hidden ?/,' ').trim()
			SpaceModel.Autopilot(space)
			gameStarted = false
			ControlsAdapter.unbind()
			gameViewDiv.addEventListener('click', startGame)
		}
	}

	space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
	space.ship.heading = Math.PI /4

	var gameStarted = true
	endGame()
	space.on('game-over', endGame)
	space.on('game-over', function(){
		document.querySelectorAll('#game-over p:first-child')[0].className=''
	})
	pauseDiv = document.getElementById('game-paused')
	space.on('pause-state-change', function(isPaused){
		setHiddeness(pauseDiv, !isPaused)//hide if not paused
	})
	OrientationPauseSafe.initialize(space)
	var RAF_callback = function(currentTime){
		SpaceModel.Spaces.Update(space, currentTime)
		window.requestAnimationFrame(RAF_callback)
	}
	window.requestAnimationFrame(RAF_callback)
}

var floor = function(num, places){
	return Math.floor(num*Math.pow(10,places))/Math.pow(10,places)
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

function zeroPad(num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
        zeroString = '-' + zeroString;
    }

    return zeroString+n;
}