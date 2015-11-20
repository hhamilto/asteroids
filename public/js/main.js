rotate = function(angle,point){
	return [point[0]*Math.cos(angle)-point[1]*Math.sin(angle),
            point[0]*Math.sin(angle)+point[1]*Math.cos(angle)]
}

window.onerror = function(error) {
    alert(error);
}

getRealPointCoordinates = function(){
	var rotatedPoints = this.points.map(function(point){
		return rotate(this.heading,point)
	}.bind(this))

	rotatedPoints.forEach(function(p){
		p[0]+=this.location[0]
		p[1]+=this.location[1]
	}.bind(this))
	return rotatedPoints
}
draw = function(ctx){
	var rotatedPoints = this.getRealPointCoordinates()

	ctx.beginPath()
	ctx.moveTo(rotatedPoints[0],rotatedPoints[1])
	rotatedPoints.slice(1).concat([rotatedPoints[0]]).forEach(function(point){
		ctx.lineTo(point[0],point[1])
	})
	ctx.closePath()
	ctx.stroke()
}

var makeBullet = function(location, velocity){
	return {
		location:location,
		velocity:velocity,
		heading:0,
		points: [[2,2],[2,-2],[-2,-2],[-2,2]],
		draw:draw,
		getRealPointCoordinates:getRealPointCoordinates,
		death:Date.now()+900
	}
}

BASE_ASTEROID_RADIUS = 10
var makeAsteroid = function(size,location){
	size = size || 3
	location = location || [Math.random()*1000,Math.random()*1000]
	var ASTEROID_RADIUS = BASE_ASTEROID_RADIUS*size
	var numPoints = 12
	var thetaJitter = Math.PI*2/numPoints
	var radiusRandomRatio = 1/2
	return {
		location: location,
		velocity: [Math.random()*1.4-.7,Math.random()*1.4-.7],
		heading: Math.random()*2*Math.PI,
		size:size,
		points: _.range(numPoints).map(function(pointIndex){
			var theta = Math.PI*2*pointIndex/numPoints+(Math.random()*thetaJitter-thetaJitter/2)
			var radius = Math.random()*radiusRandomRatio*ASTEROID_RADIUS+(1-radiusRandomRatio)*ASTEROID_RADIUS
			return rotate(theta,[0, radius])
		}),
		draw:draw,
		getRealPointCoordinates:getRealPointCoordinates,
		contains: function(p){
			//http://bbs.dartmouth.edu/~fangq/MATH/download/source/Determining%20if%20a%20point%20lies%20on%20the%20interior%20of%20a%20polygon.htm
			var points = this.getRealPointCoordinates()
			points.push(points[0])
			for(i=0;i<points.length-1;i++){
				//if its on the right its outside. assumes ccw winding
				/*var x = p[0]
				var y = p[1]
				var x0 = points[i][0]
				var y0 = points[i][1]
				var x1 = points[i+1][0]
				var y1 = points[i+1][1]
				var side = (y - y0) * (x1 - x0) - (x - x0) * (y1 - y0) 
				*/
				var side = (p[1] - points[i][1])*(points[i+1][0] - points[i][0]) - 
				           (p[0] - points[i][0])*(points[i+1][1] - points[i][1]) 
				if(side < 0)
					return false
			}
			return true
		}
	}
}


var ship = {
	location: [0,0],
	velocity: [0,0],// in pxpms (pixels per millisecond)
	heading: -0.0,
	points: [[13,0],[-13,-11],[-13,11]],
	getRealPointCoordinates:getRealPointCoordinates,
	draw: draw,
	bulletMuzzleSpeed: 11,//pixels per ms
	fire: function(){
		if(bullets.length>10)
			return 
		var bulletVelocity = rotate(ship.heading,[this.bulletMuzzleSpeed,0])	
		bulletVelocity[0]+=this.velocity[0]
		bulletVelocity[1]+=this.velocity[1]
		bullets.push(makeBullet(this.location.slice(), bulletVelocity))
	}
}

ship.fire =  _.throttle(ship.fire.bind(ship),10,{
  trailing: false
})

var asteroids = []||_.range(4).map(function(){
	return makeAsteroid()
})
var bullets = []

document.addEventListener("DOMContentLoaded", function(event) {

	var gameCanvas = document.getElementById('game-screen')
	var screenDimensions = [0,0]
	var updateScreenDimensions = function(){
		screenDimensions[0] = gameCanvas.clientWidth
		screenDimensions[1] = gameCanvas.clientHeight
		gameCanvas.setAttribute('width', screenDimensions[0])
		gameCanvas.setAttribute('height', screenDimensions[1])
	}
	updateScreenDimensions()

	var ctx = gameCanvas.getContext('2d')

	ship.location = [screenDimensions[0]/2,screenDimensions[1]/2]

	var controlsDiv = document.getElementById('throttle-controls')
	var controls = {
		accel:0, //range [0,1]
		yaw:0 //range [-1,1]
	}
	var zeroControls = function(e){
		e.preventDefault()
		controls.accel = 0
		controls.yaw = 0
		controls.targetDesitination = null
	}
	var updateControls = function(e){
		e.preventDefault()
		var touch = e.targetTouches.item(0)
		controls.targetDesitination = [touch.pageX,touch.pageY]
		console.log(controls)
	}.bind(this)
	gameCanvas.addEventListener("touchstart", function(e){
		ship.fire()
		updateControls(e)
	})
	gameCanvas.addEventListener("touchmove", updateControls)
	gameCanvas.addEventListener("touchend", zeroControls)
	gameCanvas.addEventListener("touchcancel", zeroControls)
	
	var score = 0
	window.addEventListener('resize',_.throttle(updateScreenDimensions, 100))

	window.addEventListener('keydown', function(e){
		if(e.key == 'a' || e.keyCode == 37)
			controls.yaw=-.7//less touchy
		else if(e.key == 'd' || e.keyCode == 39)
			controls.yaw=.7
		else if(e.key == 'w' || e.keyCode == 38)
			controls.accel=1
		else if(e.key == ' ')
			ship.fire()
		else if(e.key == 'p')
			alert('Paused')
	})
	window.addEventListener('keyup', function(e){
		if(e.key == 'a' || e.keyCode == 37)
			controls.yaw=0
		else if(e.key == 'd' || e.keyCode == 39)
			controls.yaw=0
		else if(e.key == 'w' || e.keyCode == 38)
			controls.accel=0
	})

	gameOverDiv = document.getElementById('game-over')
	var collide = function(){
		var shipPoints = ship.getRealPointCoordinates()
		/*var bulletLines = bullets.map(function(bullet){
			return [bullet.location,
			        [(bullet.location[0]+bullet.velocity[0],
			         (bullet.location[1]+bullet.velocity[1]]]
		})*/
		outter: for(var j = 0; j < asteroids.length; j++){
			for(var i = 0; i< bullets.length; i++){
				//turn bullet into a line
				if(asteroids[j].contains(bullets[i].location)){
					if(asteroids[j].size != 1)
						asteroids.splice(j,1, 
						        makeAsteroid(asteroids[j].size-1,asteroids[j].location.slice()),
						        makeAsteroid(asteroids[j].size-1,asteroids[j].location.slice()))
					else
						asteroids.splice(j,1)
					bullets.splice(i,1)
					continue outter
				}
			}
			for(var i = 0; i< shipPoints.length; i++)
				if(asteroids[j].contains(shipPoints[i]))
					gameOverDiv.className = ""			
		}
	}
	var controlYawFactor = .008//radiansPerMS
	var controlAccelerationFactor = .02//pixels per ms per ms
	var applyControls = function(duration){
		if(controls.targetDesitination){
			//dynamically up date controls each time they are applied
			console.log("SHIP HEADING: "+ship.heading%(Math.PI*2))
			var touchHeading = Math.atan2(controls.targetDesitination[0]-ship.location[0],controls.targetDesitination[1]-ship.location[1])
			console.log("TOUCH HEADING: "+touchHeading)
			controls.yaw = touchHeading-ship.heading
			console.log("RAW YAW: "+controls.yaw)
			controls.yaw = Math.max(-1,Math.min(1,controls.yaw))
			controls.accel=1
		}
		ship.heading += duration*controls.yaw*controlYawFactor
		ship.heading = (ship.heading+(Math.PI*2))%(Math.PI*2)
		var acceleration = rotate(ship.heading,[duration*controls.accel*controlAccelerationFactor,0])	
		ship.velocity[0]+=acceleration[0]
		ship.velocity[1]+=acceleration[1]
		
	}
	var shipDeceleration = .0006//in pxpsps
	var lastPaintTime = 0//window.performance.now()
	makeGo = function(item){
		item.location[0] = (item.location[0]+item.velocity[0]+screenDimensions[0])%screenDimensions[0]
		item.location[1] = (item.location[1]+item.velocity[1]+screenDimensions[1])%screenDimensions[1]
	}
	elapseTime = function(duration){
		//applyControls
		//ship slows down 
		ship.velocity[0]*=Math.pow((1-shipDeceleration),duration)
		ship.velocity[1]*=Math.pow((1-shipDeceleration),duration)

		ship.location[0] = (ship.location[0]+ship.velocity[0]+screenDimensions[0])%screenDimensions[0]
		ship.location[1] = (ship.location[1]+ship.velocity[1]+screenDimensions[1])%screenDimensions[1]
		var now = Date.now()
		bullets = _.filter(bullets, function(bullet){
			return bullet.death>now
		})
		bullets.forEach(makeGo)
		asteroids.forEach(makeGo)
	}
	var svgNS = document.createElementNS("http://www.w3.org/2000/svg", "svg")
	paint = function(){
		ctx.fillStyle = '#000'
		ctx.strokeStyle = '#FFF'
		ctx.fillRect(0, 0, screenDimensions[0], screenDimensions[1])
		ship.draw(ctx)
		bullets.forEach(function(bullet){
			bullet.draw(ctx)
		})
		asteroids.forEach(function(asteroid){
			asteroid.draw(ctx)
		})
	}

	var update=function(currentTime){

		var timePast = currentTime-lastPaintTime
		lastPaintTime = currentTime
		applyControls(timePast)
		collide(timePast)
		elapseTime(timePast)
		paint()
		window.requestAnimationFrame(update)
	}
	window.requestAnimationFrame(update)
})