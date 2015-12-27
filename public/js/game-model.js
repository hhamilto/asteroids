GameModel = (function(){
	Games = {
		Create: function(space){
			var game = {
				score: 0,
				level: 1,
				lives: 0,
				space
			}
			space.on('asteroid.destroyed', function(roid){
				game.score += ['invalid roid size',100,50,25][roid.size]
				game.emit('score', game.score)
				if(space.asteroids.length == 0)
					setTimeout(function(){
						game.level++
						SpaceModel.Spaces.SetLevel(game.space, game.level)
					},500)
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
		Start: function(game){
			game.score = 0
			game.level = 1
			game.lives = 3
			SpaceModel.ClearAutopilot()
			SpaceModel.Spaces.CenterStopShip(game.space)
			SpaceModel.Spaces.SetLevel(game.space, game.level)
		}
	}

	return {
		Create: Games.Create,
		Start: Games.Start
	}
})()
