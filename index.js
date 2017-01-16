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
	baseVelocity: [0,1]
})
space.asteroids = [asteroid1, asteroid2]
console.log(asteroid1.velocity)
var updateSpace_callback = function(){
	SpaceModel.Spaces.Update(space, Date.now())
	setImmediate(updateSpace_callback)
}
setImmediate(updateSpace_callback)


var app = express()

app.use(express.static(__dirname+'/public'))

wss.on('connection', conn => {
	var idObj = {
		id: Math.random()
	}
	space.ships.push(SpaceModel.Ships.Create(idObj))
	conn.send(JSON.stringify({
		shipId: idObj.id
	}))
	conn.on('message', messageString => {
		try {
			var message = JSON.parse(messageString)
		} catch( ignored ) {
			return //fuckit
		}
		if(message.shipId){
			var ship = _.find(space.ships, {id:message.shipId})
			_.assign(ship, message.ship)
		}
		if(message.request == 'request neoow snake'){
			board[0][0] = boardUtil.constants.SNAKE_HEAD
			conn.send(JSON.stringify({board}))
		}
	})
	conn.send(JSON.stringify({space}))
	var interval = setInterval(function(){
		console.log(space.ships[0].velocity)
		conn.send(JSON.stringify({
			asteroids: space.asteroids,
			ships: space.ships
		}))
		asteroid2.location[0]++
	}, 50)
	conn.on('close', function(){
		clearInterval(interval)
	})
})

server.on('request', app)
server.listen(3000, function () { console.log('Listening on ' + server.address().port) })
