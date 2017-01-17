
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
	//var game = GameModel.Create(space)
	//SoundManager.BindShip(space.ship)
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
	var overlayMessageDiv = document.getElementById('overlay-messages')
	var gameViewDiv = document.getElementById('game-view')
	var startGame = function(){
		var ws = new WebSocket('ws://192.168.69.6:3000');
		ws.onopen = function(hello){
			var myPlayerId
			ws.onmessage = function (event) {
				var eventData = JSON.parse(event.data)
				if (eventData.space){
					//ahcky as fuck
					var savedLastPaintTime = space.lastPaintTime
					var savedControls = space.controls
					space = eventData.space
					space.lastPaintTime = savedLastPaintTime
					space.controls = savedControls
					space.ctx = gameCanvas.getContext('2d')
				}
				if(eventData.playerId) {
					myPlayerId = eventData.playerId
				}
				if(eventData.asteroids) {
					space.asteroids = eventData.asteroids
				}
				if(eventData.players) {
					if(myPlayerId){
						var player = _.find(space.players, function(player){
							return player.id == myPlayerId
						})
						space.ship = player.ship
					}
					if(eventData.players.length == space.players.length){
						for( var i = 0; i<space.players.length; i++){
							if(space.players[i].id == myPlayerId) {
								space.players[i].ship.location = eventData.players[i].ship.location
								space.players[i].ship.velocity = eventData.players[i].ship.velocity
								if(space.players[i].ship.heading != eventData.players[i].ship.heading){
									console.log('hi')
									ws.send(JSON.stringify({
										heading: space.players[i].ship.heading,
										playerId: myPlayerId
									}))
								}
							} else {
								space.players[i].ship = eventData.players[i].ship
							}
						}
						return
					}
					space.players = eventData.players
				}
			}
			space.controls.on('state-change', function(){
				ws.send(JSON.stringify({
					playerId: myPlayerId,
					controls: space.controls,
					ship: space.ship
				}))
			})
		}
		overlayMessageDiv.className = overlayMessageDiv.className+' hidden'
		gameViewDiv.removeEventListener('click', startGame)
		//GameModel.Start(game)
		//scoreDiv.innerHTML = game.score
		ControlsAdapter.bindTo(space.controls)
		gameStarted = true
		//setLives(game.lives)
		document.getElementById('game-over').className=''
	}
	/*game.on('lives', function(lives){
		setLives(lives)
	})
	game.on('score', function(score){
		scoreDiv.innerHTML = score
	})*/

	var endGame = function(){
		if(gameStarted){
			overlayMessageDiv.className = overlayMessageDiv.className.replace(/ ?hidden ?/,' ').trim()
			gameStarted = false
			ControlsAdapter.unbind()
			gameViewDiv.addEventListener('click', startGame)
		}
	}

	/*space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
	space.ship.heading = Math.PI /4
	*/

	var gameStarted = true
	endGame()
	//game.on('over', endGame)
	pauseDiv = document.getElementById('game-paused')
	space.on('pause-state-change', function(isPaused){
		setHiddeness(pauseDiv, !isPaused)//hide if not paused
	})
	OrientationPauseSafe.initialize(space)
	var RAF_callback = function(currentTime){
		SpaceModel.Spaces.Update(space, currentTime)
		SpaceModel.Spaces.Paint(space)
		SpaceModel.Spaces.ClearPointsFORSpace(space)
		window.requestAnimationFrame(RAF_callback)
	}
	window.requestAnimationFrame(RAF_callback)
}

var floor = function(num, places){
	return Math.floor(num*Math.pow(10,places))/Math.pow(10,places)
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