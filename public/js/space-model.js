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
				death: Date.now()+850,
				heading:0
			}
		}
	}

	var Ships = {
		Create: function(){
			var newShip = {
				location:[0,0],
				velocity:[0,0],// in pxpms (pixels per millisecond)
				heading: Math.PI,
				coastPoints: [[0,13],[13.11,-18],[11,-13],[-11,-13],[-13.11,-18]],
				thrustPoints: [[0,13],[13.11,-18],[11,-13],[-11,-13],[9,-13],[0,-29],[-9,-13],[-11,-13],[-13.11,-18]],
				bulletMuzzleSpeed: .8,//pixels per ms
				deceleration: .0006//in pxpsps
			}
			newShip.points = newShip.coastPoints
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
		Create: function(size,location, baseVelocity){
			baseVelocity = baseVelocity || [0,0]
			size = size || 3
			location = location || [Math.random()*3000,Math.random()*3000]
			var ASTEROID_RADIUS = BASE_ASTEROID_RADIUS*size
			var numPoints = 12
			var thetaJitter = Math.PI*2/numPoints
			var radiusRandomRatio = 1/2
			var initialVelocity = .02
			var initialHeading = Math.random()*Math.PI*2
			var newAsteroid = {
				location: location,
				velocity: addPoints(baseVelocity,rotate(initialHeading, [0,initialVelocity])),
				heading: initialHeading,
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
			//use a kind of bounding "circle"
			if(     distance(asteroid.location, line[0]) > BASE_ASTEROID_RADIUS *2 &
			        distance(asteroid.location, line[1]) > BASE_ASTEROID_RADIUS *2)
				return false
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
			var controls = {
				accel:0, //range [0,1]
				yaw:0, //range [-1,1]
				corrections: {
					yawFactor: .008, //radiansPerMS
					accelerationFactor: .0003//pixels per ms per ms
				}
			}
			mixinEvents(controls)
			return controls
		}
	}

	var Spaces = {
		Create: function(){
			var newSpace = {
				dimensions: [100,100], // space is actually quite small by default.
				asteroids: _.range(10).map(function(){
									return Asteroids.Create()
								}),
				ship: Ships.Create(),
				controls: Controls.Create(),
				bullets: [],
				lastPaintTime: 0,
				paused: false,
			}
			mixinEvents(newSpace)
			newSpace.ship.on('bullet', function(bullet){
				if(newSpace.bullets.length < 5)
					newSpace.bullets.push(bullet)
			})
			newSpace.ship.on('death',function(){
				Spaces.CenterStopShip(newSpace)
				if(!newSpace.lives)
					newSpace.emit('game-over')
			})
			newSpace.controls.on('fire', _.partial(Ships.Fire,newSpace.ship))
			newSpace.controls.on('toggle-pause', function(){
				newSpace.paused=!newSpace.paused
				newSpace.emit('pause-state-change', newSpace.paused)
			})

			newSpace.on('asteroid.destroyed', function(roid){
				score += ['invalid roid size',100,50,25][roid.size]
				if(newSpace.asteroids.length == 0)
					setTimeout(function(){
						newSpace.level++
						SpaceModel.Spaces.SetLevel(newSpace)
					},500)
			})

			return newSpace
		},
		Paint: function(space){
			space.ctx.fillStyle = '#000'
			space.ctx.strokeStyle = '#FFF'
			space.ctx.fillRect(0, 0, space.dimensions[0], space.dimensions[1])
			_.each(Spaces.AllSpaceJunk(space), _.partial(Draw,space.ctx))
			space.ctx.strokeStyle = '#F0F'
		},
		MakeGo: function(space, duration, item){
			item.location[0] = (item.location[0]+(item.velocity[0]*duration)+space.dimensions[0])%space.dimensions[0]
			item.location[1] = (item.location[1]+(item.velocity[1]*duration)+space.dimensions[1])%space.dimensions[1]
			if(item.location[0]+'' == 'NaN')
				throw new Error(item.location[0])
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
				Spaces.MakeGo(space, duration, item)
			})
		},
		AllSpaceJunk: function(space){
			return space.bullets.concat(space.ship, space.asteroids)
		},
		Collide: function(space, duration){
			var i,j
			var shipPoints = space.ship.pointsFORSpace
			var bulletLines = space.bullets.map(function(bullet){
				return [bullet.location,
				        [bullet.location[0]-(bullet.velocity[0]*duration),
				         bullet.location[1]-(bullet.velocity[1]*duration)]]
			})
			outter: for(j = 0; j < space.asteroids.length; j++){
				for(i = 0; i< bulletLines.length; i++){
					//turn bullet into a line
					if(Asteroids.Collides(space.asteroids[j], bulletLines[i])){
						var destroidRoid = space.asteroids[j]
						if(space.asteroids[j].size != 1)
							space.asteroids.splice(j,1, 
							        Asteroids.Create(space.asteroids[j].size-1,space.asteroids[j].location.slice(), space.asteroids[j].velocity.slice()),
							        Asteroids.Create(space.asteroids[j].size-1,space.asteroids[j].location.slice(), space.asteroids[j].velocity.slice()))
						else
							space.asteroids.splice(j,1)
						space.emit('asteroid.destroyed', destroidRoid)
						space.bullets.splice(i,1)
						continue outter
					}
				}
				for(i = 0; i< shipPoints.length; i++)
					if(Asteroids.Collides(space.asteroids[j],[shipPoints[i],shipPoints[(i+1)%shipPoints.length]])){
						space.lives--
						space.ship.emit('death')
						return
					}
			}
		},
		ApplyControls: function(controls, ship, duration){
			if(controls.desiredHeading != undefined){
				controls.yaw = controls.desiredHeading-ship.heading
				if(controls.yaw > Math.PI)
					controls.yaw-=2*Math.PI
				if(controls.yaw < -Math.PI)
					controls.yaw+=2*Math.PI
				controls.yaw*=1.1
				controls.yaw = Math.max(-1,Math.min(1,controls.yaw))
			}
			ship.heading += duration*controls.yaw*controls.corrections.yawFactor
			ship.heading = (ship.heading+(Math.PI*2))%(Math.PI*2)
			var acceleration = rotate(ship.heading,[0,duration*controls.accel*controls.corrections.accelerationFactor])	
			ship.velocity[0] += acceleration[0]
			ship.velocity[1] += acceleration[1]
			
			if(controls.accel && (Math.floor(duration)%2==0)){
				ship.points = ship.thrustPoints
			}else{
				ship.points = ship.coastPoints
			}
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
			if(!space.paused){
				Spaces.ApplyControls(space.controls,space.ship,timePast)
				Spaces.Collide(space,timePast)
				Spaces.ElapseTime(space,timePast)
			}
			Spaces.Paint(space)
			Spaces.ClearPointsFORSpace(space)
		},
		SetLevel: function(space){
			space.asteroids = _.range(space.level*2).map(function(){
				return Asteroids.Create()
			})
		},
		CenterStopShip: function(space){
			space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
			space.ship.velocity = [0,0]
			space.controls.accel = 0
			space.controls.yaw = 0
			space.ship.heading = Math.PI	
		},
		StartGame: function(space){
			space.level = 1
			space.score = 0
			space.lives = 3
			ClearAutopilot()
			Spaces.CenterStopShip(space)
			Spaces.SetLevel(space)
		}
	}

	var getGhostShip = function(ship, space, controls){
		var ghostShip = _.clone(ship,true)
		var i
		for(i = 0 ; i < 120; i++){
			Spaces.ApplyControls(controls, ghostShip, 10)
			ghostShip.location[0] += ghostShip.velocity[0]*10
			ghostShip.location[1] += ghostShip.velocity[1]*10
		}
		//get ghost ship dist from ship
		var dist = distance(ship.location, ghostShip.location)
		//put ghost ship in frot of ship
		ghostShip.location = rotate(ghostShip.heading, [0,dist])
		ghostShip.location[0] += ship.location[0]
		ghostShip.location[1] += ship.location[1]
		Spaces.MakeGo(space, 0, ghostShip)
		UpdatePointsFORSpace(ghostShip)
		return ghostShip
	}

	var getGhostObject = function(obj, space){
		var ghostBject = _.clone(obj,true)
		var i
		for(i = 0 ; i < 120; i++){
			Spaces.MakeGo(space, 10, ghostBject)
		}
		UpdatePointsFORSpace(ghostBject)
		return ghostBject
	}

	var api 
	var Autopilot = function(space){
		//fake drive ship
		api = setInterval(function(){
			space.controls.accel = .2
			var i,j
			//if we are about to hit an asteroid turn right, else straight
			var ghostShip = getGhostShip(space.ship, space, space.controls)
			var asteroids = space.asteroids
			UpdatePointsFORSpace(ghostShip)
			Spaces.CalculatePointsFORSpace(space)
			var shipPoints = ghostShip.pointsFORSpace
			space.controls.yaw = 0
			var groids = _.map(space.asteroids, function(roid){
				return getGhostObject(roid, space)
			}) 
			for(j = 0; j < groids.length; j++)
				for(i = 0; i< shipPoints.length; i++)
					if(Asteroids.Collides(groids[j],[shipPoints[i],shipPoints[(i+1)%shipPoints.length]]))
						space.controls.yaw = .7
			Spaces.ClearPointsFORSpace(space)
		}, 300)
	}

	var ClearAutopilot = function(){
		clearInterval(api)
	}

	// only export stern interface
	return {
		Spaces: {
			Create: Spaces.Create,
			SetDimensions: Spaces.SetDimensions,
			Update: Spaces.Update,
			SetLevel: Spaces.SetLevel,
			CenterStopShip: Spaces.CenterStopShip,
			StartGame: Spaces.StartGame
		},
		Ships: {
			Fire: Ships.Fire
		},
		Autopilot: Autopilot,
		ClearAutopilot: ClearAutopilot
	}
}())