SpaceModel = (function(){
	// Written avoiding OO as an exercise

	var UpdatePointsFORSpace = function(object){ //FOR = Frame Of Reference
		object.pointsFORSpace = object.points.map(function(point){
			return rotate(object.heading,point)
		})

		object.pointsFORSpace.forEach(function(p){
			p[0]+=object.location[0]
			p[1]+=object.location[1]
		})
	}
	var ClearPointsFORSpace = function(object){
		object.pointsFORSpace = null
	}

	var Draw = function(ctx, object){

		ctx.beginPath()
		ctx.moveTo(object.pointsFORSpace[0],object.pointsFORSpace[1])
		object.pointsFORSpace.slice(1).concat([object.pointsFORSpace[0]]).forEach(function(point){
			ctx.lineTo(point[0],point[1])
		})
		ctx.closePath()
		ctx.stroke()
	}

	var Bullets = {
		Create: function(location, velocity){
			return {
				location: location,
				velocity: velocity,
				points: [[2,2],[2,-2],[-2,-2],[-2,2]],
				death: Date.now()+900,
				heading:0
			}
		}
	}

	var Ships = {
		Create: function(){
			var newShip = {
				location:[0,0],
				velocity:[0,0],// in pxpms (pixels per millisecond)
				heading: 0,
				points: [[0,13],[11,-13],[-11,-13]],
				bulletMuzzleSpeed: 11,//pixels per ms
				deceleration: .0006//in pxpsps
			}
			mixinEvents(newShip)
			return newShip
		},
		Fire: _.throttle(function(ship){
			var bulletVelocity = rotate(ship.heading,[0,ship.bulletMuzzleSpeed])	
			bulletVelocity[0]+=ship.velocity[0]
			bulletVelocity[1]+=ship.velocity[1]
			ship.emit('bullet', Bullets.Create(ship.location.slice(), bulletVelocity))
		},10,{
			trailing: false
		})
	}

	BASE_ASTEROID_RADIUS = 10
	var Asteroids = {
		Create: function(size,location){
			size = size || 3
			location = location || [Math.random()*3000,Math.random()*3000]
			var ASTEROID_RADIUS = BASE_ASTEROID_RADIUS*size
			var numPoints = 12
			var thetaJitter = Math.PI*2/numPoints
			var radiusRandomRatio = 1/2
			var newAsteroid = {
				location: location,
				velocity: [Math.random()*1.4-.7,Math.random()*1.4-.7],
				heading: Math.random()*2*Math.PI,
				size:size,
				points: _.range(numPoints).map(function(pointIndex){
					var theta = Math.PI*2*pointIndex/numPoints+(Math.random()*thetaJitter-thetaJitter/2)
					var radius = Math.random()*radiusRandomRatio*ASTEROID_RADIUS+(1-radiusRandomRatio)*ASTEROID_RADIUS
					return rotate(theta,[0, radius])
				})
			}
			UpdatePointsFORSpace(newAsteroid)
			return newAsteroid
		},
		Collides: function(asteroid, line){
			var i
			var points = asteroid.pointsFORSpace.slice()
			points.push(points[0])
			for(i = 0; i<points.length-1; i++){
				if(doIntersect(points[i],points[i+1],line[0], line[1]))
					return true
			}
			return false
		}
	}


	var Controls = {
		Create: function(){
			return {
				accel:0, //range [0,1]
				yaw:0, //range [-1,1]
				corrections: {
					yawFactor: .008, //radiansPerMS
					accelerationFactor: .02//pixels per ms per ms
				}
			}
		}
	}

	var Spaces = {
		Create: function(){
			var newSpace = {
				dimensions: [100,100], // space is actually quite small by default.
				asteroids: _.range(4).map(function(){
					return Asteroids.Create()
				}),
				ship: Ships.Create(),
				controls: Controls.Create(),
				bullets: [],
				lastPaintTime: 0
			}
			mixinEvents(newSpace)
			newSpace.ship.on('bullet', function(bullet){
				newSpace.bullets.push(bullet)
			})
			return newSpace
		},
		Paint: function(space){
			space.ctx.fillStyle = '#000'
			space.ctx.strokeStyle = '#FFF'
			space.ctx.fillRect(0, 0, space.dimensions[0], space.dimensions[1])
			_.each(Spaces.AllSpaceJunk(space), _.partial(Draw,space.ctx))
		},
		MakeGo: function(space, item){
			item.location[0] = (item.location[0]+item.velocity[0]+space.dimensions[0])%space.dimensions[0]
			item.location[1] = (item.location[1]+item.velocity[1]+space.dimensions[1])%space.dimensions[1]
			if(item.location[0]+'' == 'NaN')
				throw new Error()
		},
		ElapseTime: function(space, duration){
			// slow ship
			space.ship.velocity[0] *= Math.pow((1-space.ship.deceleration),duration)
			space.ship.velocity[1] *= Math.pow((1-space.ship.deceleration),duration)
			// kill bullets
			var now = Date.now()
			space.bullets = _.filter(space.bullets, function(bullet){
				return bullet.death > now
			})
			Spaces.AllSpaceJunk(space).forEach(function(item){
				Spaces.MakeGo(space, item)
			})
		},
		AllSpaceJunk: function(space){
			return space.bullets.concat(space.ship, space.asteroids)
		},
		Collide: function(space){
			var i,j
			var shipPoints = space.ship.pointsFORSpace
			var bulletLines = space.bullets.map(function(bullet){
				return [bullet.location,
				        [(bullet.location[0]-bullet.velocity[0]),
				         (bullet.location[1]-bullet.velocity[1])]]
			})
			outter: for(j = 0; j < space.asteroids.length; j++){
				for(i = 0; i< bulletLines.length; i++){
					//turn bullet into a line
					if(Asteroids.Collides(space.asteroids[j], bulletLines[i])){
						if(space.asteroids[j].size != 1)
							space.asteroids.splice(j,1, 
							        Asteroids.Create(space.asteroids[j].size-1,space.asteroids[j].location.slice()),
							        Asteroids.Create(space.asteroids[j].size-1,space.asteroids[j].location.slice()))
						else
							space.asteroids.splice(j,1)
						space.bullets.splice(i,1)
						continue outter
					}
				}
				for(i = 0; i< shipPoints.length; i++)
					if(Asteroids.Collides(space.asteroids[j],[shipPoints[i],shipPoints[(i+1)%shipPoints.length]]))
						space.emit('game-over')
			}
		},
		ApplyControls: function(space, duration){
			space.ship.heading += duration*space.controls.yaw*space.controls.corrections.yawFactor
			space.ship.heading = (space.ship.heading+(Math.PI*2))%(Math.PI*2)
			var acceleration = rotate(space.ship.heading,[0,duration*space.controls.accel*space.controls.corrections.accelerationFactor])	
			space.ship.velocity[0] += acceleration[0]
			space.ship.velocity[1] += acceleration[1]
		},
		CalculatePointsFORSpace: function(space){
			Spaces.AllSpaceJunk(space).forEach(UpdatePointsFORSpace)
		},
		ClearPointsFORSpace: function(space){
			Spaces.AllSpaceJunk(space).forEach(ClearPointsFORSpace)
		},
		Update: function(space, currentTime){
			var timePast = currentTime-space.lastPaintTime
			space.lastPaintTime = currentTime
			Spaces.CalculatePointsFORSpace(space)
			Spaces.ApplyControls(space,timePast)
			Spaces.Collide(space,timePast)
			Spaces.ElapseTime(space,timePast)
			Spaces.Paint(space)
			Spaces.ClearPointsFORSpace(space)
		}
	}

	// only export stern interface
	return {
		Spaces: {
			Create: Spaces.Create,
			SetDimensions: Spaces.SetDimensions,
			Update: Spaces.Update
		},
		Ships: {
			Fire: Ships.Fire
		}
	}
}())