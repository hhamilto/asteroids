
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
				doTiltCalibration()
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
		level = 1
		score = 0
		scoreDiv.innerHTML = score
		ControlsAdapter.bindTo(space.controls)
		SpaceModel.ClearAutopilot()
		space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
		space.ship.velocity = [0,0]
		space.controls.accel = 0
		space.controls.yaw = 0
		space.ship.heading = Math.PI
		gameStarted = true
		SpaceModel.Spaces.SetLevel(space,level)
		space.lives = 3
		setLives(space.lives)
	}
	space.ship.on('death', function(){
		space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
		space.ship.velocity = [0,0]
		space.controls.accel = 0
		space.controls.yaw = 0
		space.ship.heading = Math.PI
		
		setLives(space.lives)
	})
	var score
	var level
	space.on('asteroid.destroyed', function(roid){
		score += ['invalid roid size',100,50,25][roid.size]
		scoreDiv.innerHTML = score
		if(space.asteroids.length == 0)
			SpaceModel.Spaces.SetLevel(space,++level)
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

var doTiltCalibration = function(){
	var tiltCalibrationDiv = document.getElementById('calibrate-tilt-settings-view')
	tiltCalibrationDiv.className = ''
	var outDiv = document.getElementById('orientation-data')
	var stepsDiv = document.querySelectorAll('#calibrate-tilt-settings-view > .centered-overlay > p')
	var stepNumber = 0
	var progressTestStepPage = function(){
		stepsDiv[stepNumber++].className = 'hidden'
		stepsDiv[stepNumber].className = ''
	}
	startTest = function(){
		progressTestStepPage()
		tiltCalibrationDiv.removeEventListener(startTest)
		calibrationStep = 'left'
		window.addEventListener('deviceorientation', orientationListener)
		tiltCalibrationDiv.removeEventListener('touchstart', startTest)
	}
	var calibrationStep = ''
	tiltCalibrationDiv.addEventListener('touchstart', startTest)
	var correctionInfo = {
	}
	var calibrationPause = 0
	var orientationListener = function(e){
		if(Date.now() < calibrationPause){
			return
		}
		document.getElementById('bg-data').innerHTML = zeroPad(floor(e.gamma,2),2)+'<br/>'+zeroPad(floor(e.beta,2),2)
		if(calibrationStep == 'left'){
			if(Math.abs(e.gamma-e.beta) > 30){
				//we have a clear distinction
				if(Math.abs(e.gamma)>Math.abs(e.beta)){
					//side to side is gamma
					correctionInfo.x = ['gamma',-e.gamma/Math.abs(e.gamma)]
				}else{
					//side to side is beta
					correctionInfo.x = ['beta',-e.beta/Math.abs(e.beta)]
				}

				calibrationStep = 'up'
				calibrationPause = Date.now()+1500
				progressTestStepPage()
			}
		}else if(calibrationStep == 'up'){
			if(Math.abs(e.gamma-e.beta) > 30){
				//we have a clear distinction
				if(Math.abs(e.gamma)>Math.abs(e.beta)){
					//side to side is gamma
					correctionInfo.y = ['gamma',-e.gamma/Math.abs(e.gamma)]
				}else{
					//side to side is beta
					correctionInfo.y = ['beta',-e.beta/Math.abs(e.beta)]
				}
				//window.removeEventListener(orientationListener)
				ControlsAdapter.useCorrectionInfo(correctionInfo)
				document.getElementById('console').innerHTML = JSON.stringify(correctionInfo)
				tiltCalibrationDiv.className = 'hidden'
				calibrationStep = ''
			}
		}
	}
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