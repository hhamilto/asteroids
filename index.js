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
space.dimensions = [1000, 1000]

var asteroid1 = SpaceModel.Asteroids.Create({
	location: [100,300],
	initialVelocity: [0,0],
	baseVelocity: [0,0]
})
var asteroid2 = SpaceModel.Asteroids.Create({
	location: [500,600],
	initialVelocity: [0,0],
	baseVelocity: [0,0]
})
space.asteroids = [asteroid1, asteroid2]

var app = express()

app.use(express.static(__dirname+'/public'))

wss.on('connection', conn => {
	conn.on('message', messageString => {
		try {
			var message = JSON.parse(messageString)
		} catch( ignored ) {
			return //fuckit
		}
		console.log(message)
		if(message.request == 'request board'){
			conn.send(JSON.stringify({board}))
		}
		if(message.request == 'request new snake'){
			board[0][0] = boardUtil.constants.SNAKE_HEAD
			conn.send(JSON.stringify({board}))
		}
	})
	setInterval(function(){
		conn.send(JSON.stringify(space))
		asteroid1.location[0]++
	}, 1000)
})

server.on('request', app)
server.listen(3000, function () { console.log('Listening on ' + server.address().port) })

