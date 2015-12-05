rotate = function(angle,point){
	return [point[0]*Math.cos(angle)-point[1]*Math.sin(angle),
            point[0]*Math.sin(angle)+point[1]*Math.cos(angle)]
}

distance = function(p1,p2){
	return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0])+(p1[1]-p2[1])*(p1[1]-p2[1]))
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
		collides: function(line){
			var points = this.getRealPointCoordinates()
			points.push(points[0])
			for(var i = 0; i<points.length-1; i++){
				if(doIntersect(points[i],points[i+1],line[0], line[1]))
					return true
			}
			return false
		}
	}
}

var orientation = function(p,q,r){
	// See http://www.geeksforgeeks.org/orientation-3-ordered-points/
	// for details of below formula.
	var val = (q[1] - p[1]) * (r[0] - q[0]) -
	          (q[0] - p[0]) * (r[1] - q[1])
	if (val == 0) return 0  // colinear
	return (val > 0)?1:2 // clock or counterclock wise
}
 
// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
var doIntersect = function(p1, q1, p2, q2){
    // Find the four orientations needed for general and
    // special cases
    var o1 = orientation(p1, q1, p2)
    var o2 = orientation(p1, q1, q2)
    var o3 = orientation(p2, q2, p1)
    var o4 = orientation(p2, q2, q1)
 
    // General case
    if (o1 != o2 && o3 != o4)
        return true
    return false // Doesn't fall in any of the above cases
}

var ship = {
	location:[0,0],
	velocity:[0,0],// in pxpms (pixels per millisecond)
	heading: 0,
	points: [[0,13],[11,-13],[-11,-13]],
	getRealPointCoordinates:getRealPointCoordinates,
	draw: draw,
	bulletMuzzleSpeed: 11,//pixels per ms
	fire: function(){
		if(bullets.length>10)
			return 
		var bulletVelocity = rotate(ship.heading,[0,this.bulletMuzzleSpeed])	
		bulletVelocity[0]+=this.velocity[0]
		bulletVelocity[1]+=this.velocity[1]
		bullets.push(makeBullet(this.location.slice(), bulletVelocity))
	}
}

ship.fire =  _.throttle(ship.fire.bind(ship),10,{
  trailing: false
})

var asteroids = _.range(1).map(function(){
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

	var throttleDiv = document.getElementById('throttle-control')
	var controls = {
		accel:0, //range [0,1]
		yaw:0 //range [-1,1]
	}
	var gammaZero = -20
	window.addEventListener("deviceorientation", function(e){
		var orientationDiv = document.getElementById('orientation')
		console.log(e)
		//beta/gamma
		var tiltHeading = -Math.atan2(e.beta,-e.gamma)
		tiltHeading = (tiltHeading+(Math.PI*2))%(Math.PI*2)
		controls.yaw = tiltHeading-ship.heading
		if(controls.yaw > Math.PI)
			controls.yaw-=2*Math.PI
		if(controls.yaw < -Math.PI)
			controls.yaw+=2*Math.PI
		controls.yaw = Math.max(-1,Math.min(1,controls.yaw))

		orientationDiv.innerHTML = e.alpha + ", " +
		                           e.beta  + ", " +
		                           e.gamma + ", " +
		                           tiltHeading
	})

	throttleDiv.addEventListener("touchstart", function(e){
		e.preventDefault()
		controls.accel = .5
	})
	throttleDiv.addEventListener("touchend", function(e){
		e.preventDefault()
		controls.accel = 0
	})

	gameCanvas.addEventListener("touchstart", function(e){
		ship.fire()
	})
	
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
		var bulletLines = bullets.map(function(bullet){
			return [bullet.location,
			        [(bullet.location[0]-bullet.velocity[0]),
			         (bullet.location[1]-bullet.velocity[1])]]
		})
		outter: for(var j = 0; j < asteroids.length; j++){
			for(var i = 0; i< bulletLines.length; i++){
				//turn bullet into a line
				if(asteroids[j].collides(bulletLines[i])){
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
			/*for(var i = 0; i< shipPoints.length; i++)
				if(asteroids[j].contains(shipPoints[i]))
					gameOverDiv.className = ""*/	
		}
	}
	var controlYawFactor = .008//radiansPerMS
	var controlAccelerationFactor = .02//pixels per ms per ms
	var applyControls = function(duration){
		ship.heading += duration*controls.yaw*controlYawFactor
		ship.heading = (ship.heading+(Math.PI*2))%(Math.PI*2)
		var acceleration = rotate(ship.heading,[0,duration*controls.accel*controlAccelerationFactor])	
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