SoundManager = (function(){
	var pew = new Audio('sound/pew.mp3')
	var BindShip = function(ship){
		ship.on('bullet', function(){
			pew.cloneNode().play()
			//pew.play()
		})
	}
	return {
		BindShip: BindShip
	}
})()