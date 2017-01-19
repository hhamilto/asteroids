_ = require('lodash')
const express = require('express')
const http = require('http')
const WebSocketServer = require('ws').Server

//const SpaceModel = require('./public/js/space-model.js')
const SpaceModel = require('./public/js/space-model.js')

server = http.createServer()
wss = new WebSocketServer({ server: server })

const SIDE_LENGTH = 20

var space = SpaceModel.Spaces.Create()
delete space.ship
space.dimensions = [1000, 1000]

var asteroid1 = SpaceModel.Asteroids.Create({
	location: [100,300],
	initialVelocity: 0,
	baseVelocity: [0,0]
})
var asteroid2 = SpaceModel.Asteroids.Create({
	location: [500,600],
	initialVelocity: 0,
	baseVelocity: [0.2,-.03]
})
space.asteroids = [asteroid1, asteroid2]
console.log(asteroid1.velocity)
var updateSpace_callback = function(){
	SpaceModel.Spaces.Update(space, Date.now())
	setTimeout(updateSpace_callback,0)
}
setImmediate(updateSpace_callback)


var app = express()

app.use(express.static(__dirname+'/public'))

wss.on('connection', conn => {
	const player = SpaceModel.Players.Create({
		space
	})
	conn.send(JSON.stringify({
		playerId: player.id
	}))
	conn.on('message', messageString => {
		try {
			var message = JSON.parse(messageString)
		} catch( ignored ) {
			return //fuckit
		}
		if(message.playerId){
			var player = _.find(space.players, {id:message.playerId})
			if(!player)
				return;
			if(message.controls){
				_.assign(player.controls, message.controls)
			}
			if(message.heading){
				player.ship.heading = message.heading
			}
			if(message.fire){
				SpaceModel.Ships.Fire(player.ship)
				conn.send(JSON.stringify({
					bullets:space.bullets
				}))
			}
		}
	})
	conn.send(JSON.stringify({space}))
	var interval = setInterval(function(){
		conn.send(JSON.stringify({
			asteroids: space.asteroids,
			players: space.players
		}))
	}, 100)
	conn.on('close', function(){
		clearInterval(interval)
	})
})

server.on('request', app)
server.listen(3000, function () { console.log('Listening on ' + server.address().port) })
