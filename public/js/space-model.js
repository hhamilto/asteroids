if (typeof require == 'function') {
	require('./util.js')
}

var SpaceModel = (function(){
	// Written avoiding OO as an exercise
	// Comeing back here 1 year later, glad I did this exercise

	var UpdatePointsFORSpace = function(object){ //FOR = Frame Of Reference
		object.pointsFORSpace = object.points.map(function(point){
			var p = rotate(object.heading,point)
			p[0]+=object.location[0]
			p[1]+=object.location[1]
			return p
		})
	}

	var UpdatePointsFORScreen = function(object, screenSize, paintSize, paintLocation){ //FOR = Frame Of Reference
		object.pointsFORScreen = _.map(object.pointsFORSpace, function(point){
			var pointFORPaintArea = [
				point[0] - paintLocation[0],
				point[1] - paintLocation[1]
			]
			return [
				pointFORPaintArea[0]*screenSize[0]/paintSize[0],
				pointFORPaintArea[1]*screenSize[1]/paintSize[1]
			]
		})

	}

	var ClearPointsFORSpace = function(object){
		object.pointsFORSpace = null
	}

	var Draw = function(ctx){
		return function(object){
			ctx.beginPath()
			ctx.moveTo(object.pointsFORScreen[0],object.pointsFORScreen[1])
			object.pointsFORScreen.slice(1).concat([object.pointsFORScreen[0]]).forEach(function(point){
				ctx.lineTo(point[0],point[1])
			})
			ctx.closePath()
			ctx.stroke()
			/*

		ctx.beginPath()
		ctx.moveTo(object.pointsFORSpace[0],object.pointsFORSpace[1])
		object.pointsFORSpace.slice(1).concat([object.pointsFORSpace[0]]).forEach(function(point){
			ctx.lineTo(point[0],point[1])
		})
		ctx.closePath()
		ctx.stroke()
		*/
		}
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
		Create: function(options){
			options = options || {}
			var newShip = {
				location:[1500,1500],
				velocity:[0,0], // in pxpms (pixels per millisecond)
				heading: Math.PI,
				coastPoints: [[0,13],[13.11,-18],[11,-13],[-11,-13],[-13.11,-18]],
				thrustPoints: [[0,13],[13.11,-18],[11,-13],[-11,-13],[9,-13],[0,-29],[-9,-13],[-11,-13],[-13.11,-18]],
				bulletMuzzleSpeed: .8, //pixels per ms
				deceleration: .0006, //in pxpsps
				id: options.id
			}
			newShip.points = newShip.coastPoints
			mixinEvents(newShip)
			return newShip
		},
		ShipTip: function(ship){
			var tip = rotate(ship.heading, [0,ship.coastPoints[0][1]+10])
			tip[0] += ship.location[0]
			tip[1] += ship.location[1]
			return tip
		},
		Fire: _.throttle(function(ship){
			var bulletVelocity = rotate(ship.heading,[0,ship.bulletMuzzleSpeed])
			bulletVelocity[0]+=ship.velocity[0]
			bulletVelocity[1]+=ship.velocity[1]
			ship.emit('bullet', Bullets.Create(Ships.ShipTip(ship), bulletVelocity))
		},10,{
			trailing: false
		}),
		Collides: function(ship, line){
			//use a kind of bounding 
			if(     distance(ship.location, line[0]) > 18 && //18 is the manitude of the max coast point
			        distance(ship.location, line[1]) > 18)
				return false
			var i
			var points = ship.pointsFORSpace.slice()
			points.push(points[0])
			for(i = 0; i<points.length-1; i++){
				if(doIntersect(points[i],points[i+1],line[0], line[1]))
					return true
			}
			return false
		}
	}

	BASE_ASTEROID_RADIUS = 10
	var Asteroids = {
		Create: function(options){
			options = options || {}
			var baseVelocity = options.baseVelocity || [0,0]
			var areaDimensions = options.areaDimensions || [3000,3000]
			var size = options.size || 3
			var location = options.location
			if(!location)
				do{
					location = [Math.random()*areaDimensions[0],Math.random()*areaDimensions[1]]
				}while(options.avoidLocation && distance(location,options.avoidLocation) < 50)
			var ASTEROID_RADIUS = BASE_ASTEROID_RADIUS*size
			var numPoints = 12
			var thetaJitter = Math.PI*2/numPoints
			var radiusRandomRatio = 1/2
			var initialVelocity = options.initialVelocity != undefined? options.initialVelocity : .02
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
			if(     distance(asteroid.location, line[0]) > BASE_ASTEROID_RADIUS * 3 &&
			        distance(asteroid.location, line[1]) > BASE_ASTEROID_RADIUS * 3)
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

	var Players = {
		Create: function({space}){
			var player = {
				id: Math.random(),
				ship: SpaceModel.Ships.Create(),
				controls: SpaceModel.Controls.Create()
			}
			space.players.push(player)
			player.ship.on('bullet', function(bullet){
				//if(newSpace.bullets.length < 5)
				space.bullets.push(bullet)
			})
			player.ship.on('death', function(bullet){
				//if(newSpace.bullets.length < 5)
				space.players = _.reject(space.players, player)
			})
			return player
		}
	}

	var Spaces = {
		Create: function(){
			var newSpace = {
				dimensions: [100,100], // space is actually quite small by default.
				asteroids: _.range(10).map(function(){
									return Asteroids.Create()
								}),
				players: [],
				controls: Controls.Create(),
				bullets: [],
				lastPaintTime: Date.now(),
				paused: false,
			}
			mixinEvents(newSpace)
			newSpace.controls.on('toggle-pause', function(){
				newSpace.paused=!newSpace.paused
				newSpace.emit('pause-state-change', newSpace.paused)
			})

			return newSpace
		},
		Paint: function(space){
			if(!space.paintCenter || !space.ship) return
			const aspectRatio = space.screenDimensions[0] / space.screenDimensions[1];
			if(space.screenDimensions[0] > space.screenDimensions[1]){
				var spacePaintSize = [1000, 1000*(space.screenDimensions[1]/space.screenDimensions[0])]
			}else {
				var spacePaintSize = [1000*(space.screenDimensions[0]/space.screenDimensions[1]),1000]
			}
			_.each(Spaces.AllSpaceJunk(space), function(object){
				UpdatePointsFORScreen(object, space.screenDimensions, spacePaintSize, [space.paintCenter[0]-spacePaintSize[0]/2, space.paintCenter[1]-spacePaintSize[1]/2])
			})
			
			space.ctx.fillStyle = '#000'
			space.ctx.strokeStyle = '#FFF'
			space.ctx.fillRect(0, 0, space.screenDimensions[0], space.screenDimensions[1])

			_.each(Spaces.AllSpaceJunk(space), Draw(space.ctx))
			space.ctx.strokeStyle = '#F0F'
		},
		MakeGo: function(space, duration, item){
			item.location[0] = (item.location[0]+(item.velocity[0]*duration)+space.dimensions[0])%space.dimensions[0]
			item.location[1] = (item.location[1]+(item.velocity[1]*duration)+space.dimensions[1])%space.dimensions[1]
			if(isNaN(item.location[0]))
				throw new Error(item.location[0])
		},
		ElapseTime: function(space, duration){
			// slow ship
			for (var i = 0; i < space.players.length; i++){
				space.players[i].ship.velocity[0] *= Math.pow((1-space.players[i].ship.deceleration),duration)
				space.players[i].ship.velocity[1] *= Math.pow((1-space.players[i].ship.deceleration),duration)
			}
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
			return space.bullets.concat(_.map(space.players, 'ship'), space.asteroids)
		},
		Collide: function(space, duration){
			var i,j
			var bulletLines = space.bullets.map(function(bullet){
				return [bullet.location,
				        [bullet.location[0]-(bullet.velocity[0]*duration),
				         bullet.location[1]-(bullet.velocity[1]*duration)]]
			})
			for(i = 0; i< bulletLines.length; i++){
				for(j = 0; j < space.players.length; j++){
					if(Asteroids.Collides(space.players[j].ship, bulletLines[i])){
						space.players[j].ship.emit && space.players[j].ship.emit('death')
					}
				}
			}
			// asteroid interactions... ffft waaatever
			outter: for(j = 0; j < space.asteroids.length; j++){
				for(i = 0; i< bulletLines.length; i++){
					//turn bullet into a line
					if(Asteroids.Collides(space.asteroids[j], bulletLines[i])){
						var destroidRoid = space.asteroids[j]
						if(space.asteroids[j].size != 1)
							space.asteroids.splice(j,1, 
							        Asteroids.Create({
							        	size:space.asteroids[j].size-1,
							        	location:space.asteroids[j].location.slice(),
							        	baseVelocity: space.asteroids[j].velocity.slice()
							        }),
							        Asteroids.Create({
							        	size:space.asteroids[j].size-1,
							        	location:space.asteroids[j].location.slice(),
							        	baseVelocity: space.asteroids[j].velocity.slice()
							        }))
						else
							space.asteroids.splice(j,1)
						//space.emit('asteroid.destroyed', destroidRoid)
						space.bullets.splice(i,1)
						continue outter
					}
				}
				/*
				more complicated now
				for(i = 0; i< shipPoints.length; i++)
					if(Asteroids.Collides(space.asteroids[j],[shipPoints[i],shipPoints[(i+1)%shipPoints.length]])){
						space.ship.emit('death')
						break
					}
					*/
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
			console.log(controls.accel)
			if(controls.accel ){//&& (Math.floor(duration)%2==0)){
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
			var SAFETY_MARGIN = 50
			if(space.ship && space.paintCenter && space.screenDimensions) {
				const aspectRatio = space.screenDimensions[0] / space.screenDimensions[1];
				if(space.screenDimensions[0] > space.screenDimensions[1]){
					var spacePaintSize = [1000, 1000*(space.screenDimensions[1]/space.screenDimensions[0])]
				}else {
					var spacePaintSize = [1000*(space.screenDimensions[0]/space.screenDimensions[1]),1000]
				}
				var paintLeft = space.paintCenter[0]-spacePaintSize[0]/2
				var paintRight = space.paintCenter[0]+spacePaintSize[0]/2
				var paintTop = space.paintCenter[1]-spacePaintSize[1]/2
				var paintBottom = space.paintCenter[1]+spacePaintSize[1]/2

				if( 
					(space.ship.location[0] < paintLeft + SAFETY_MARGIN && space.ship.velocity[0] < 0 ) ||
					(space.ship.location[0] > paintRight - SAFETY_MARGIN && space.ship.velocity[0] > 0 ))
				{
					space.paintCenter = addPoints(
						space.paintCenter,
						[space.ship.velocity[0]*timePast, 0])
					if(isNaN(space.paintCenter[0]))
						throw new Error("olllool")
				}
				if(
					(space.ship.location[1] < paintTop + SAFETY_MARGIN && space.ship.velocity[1] < 0 ) ||
					(space.ship.location[1] > paintBottom - SAFETY_MARGIN && space.ship.velocity[1] > 0 ))
				{
					space.paintCenter = addPoints(
						space.paintCenter,
						[0, space.ship.velocity[1]*timePast])
					if(isNaN(space.paintCenter[1]))
						throw new Error("olllool")
				}
			}
			Spaces.CalculatePointsFORSpace(space)
			if(!space.paused){
				if(space.ship)
					Spaces.ApplyControls(space.controls,space.ship,timePast)
				for( var i = 0; i < space.players.length; i++){
					if(space.players[i].id != space.playerId)
						Spaces.ApplyControls(space.players[i].controls, space.players[i].ship, timePast)
				}
				Spaces.Collide(space,timePast)
				Spaces.ElapseTime(space,timePast)
			}
		},
		SetLevel: function(space, level){
			space.asteroids = _.range(level*2).map(function(){
				return Asteroids.Create({
					avoidLocation:space.ship.location,
					areaDimensions: space.dimensions
				})
			})
		},
		CenterStopShip: function(space){
			space.ship.location = [space.dimensions[0]/2,space.dimensions[1]/2]
			space.ship.velocity = [0,0]
			space.controls.accel = 0
			space.controls.yaw = 0
			space.ship.heading = Math.PI	
		}
	}

	// only export stern, friendly interface
	return {
		Spaces: {
			Create: Spaces.Create,
			SetDimensions: Spaces.SetDimensions,
			Update: Spaces.Update,
			Paint: Spaces.Paint,
			ClearPointsFORSpace: Spaces.ClearPointsFORSpace,
			SetLevel: Spaces.SetLevel,
			CenterStopShip: Spaces.CenterStopShip
		},
		Asteroids: {
			Create: Asteroids.Create
		},
		Players: {
			Create: Players.Create
		},
		Ships: {
			Create: Ships.Create,
			Fire: Ships.Fire
		},
		Controls: {
			Create: Controls.Create
		}
	}
}())

if (typeof exports != 'undefined')
	module.exports = SpaceModel