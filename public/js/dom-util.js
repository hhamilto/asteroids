
var blink = function(){
	var elements = document.querySelectorAll('.blink')
	var on = true
	setInterval(function(){
		on = !on
		_.each(elements, on?function(el){
			el.style.opacity = '1'
		}:function(el){
			el.style.opacity = '0'
		})
	}, 1000)
}


var showUntilTap = function(el){
	
	var tapEl = document.getElementById('game-screen')
	el.className = el.className.replace('hidden',' ')
	var clickHandler = function(){
		el.className = el.className + ' hidden'
		window.removeEventListener('touchstart', clickHandler, true)
	}
	window.addEventListener('touchstart', clickHandler, true)
}