GameModel = (function(){
	Games = {
		Create: function(space){
			var game = {
				score: 0,
				level: 1,
				lives: 3,
				space
			}
			space.on('asteroid.destroyed', function(roid){
				game.score += ['invalid roid size',100,50,25][roid.size]
				game.emit('score', game.score)
			})
			space.ship.on('death',function(){
				game.lives--
				SpaceModel.Spaces.CenterStopShip(space)
				if(game.lives<0)
					game.emit('over')
				else
					game.emit('lives', game.lives)
			})
			mixinEvents(game)
			return game
		},
	}

	return {
		Create:Games.Create
	}
})()
