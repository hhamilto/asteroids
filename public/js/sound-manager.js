SoundManager = (function(){
	var SOUND_ARRAY_SIZE = 30
	var pew = new Audio('sound/pew.mp3')
	var pews = []
	var i = SOUND_ARRAY_SIZE
	do
		pews.push(pew.cloneNode())
	while(--i)
	var BindShip = function(ship){
		ship.on('bullet', function(){
			pews[i++].play()
			i=i%SOUND_ARRAY_SIZE//pew.play()
			console.log(i, pews.length)
		})
	}
	return {
		BindShip: BindShip
	}
})()