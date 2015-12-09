
rotate = function(angle,point){
	return [point[0]*Math.cos(angle)-point[1]*Math.sin(angle),
	        point[0]*Math.sin(angle)+point[1]*Math.cos(angle)]
}

distance = function(p1,p2){
	return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0])+(p1[1]-p2[1])*(p1[1]-p2[1]))
}

orientation = function(p,q,r){
	// See http://www.geeksforgeeks.org/orientation-3-ordered-points/
	// for details of below formula.
	var val = (q[1] - p[1]) * (r[0] - q[0]) -
	          (q[0] - p[0]) * (r[1] - q[1])
	if (val == 0) return 0  // colinear
	return (val > 0)?1:2 // clock or counterclock wise
}
 
// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
doIntersect = function(p1, q1, p2, q2){
	// Find the four orientations needed for general and
	// special cases
	var o1 = orientation(p1, q1, p2)
	var o2 = orientation(p1, q1, q2)
	var o3 = orientation(p2, q2, p1)
	var o4 = orientation(p2, q2, q1)

	// General case
	if (o1 != o2 && o3 != o4)
	    return true
	return false // Doesn't fall in any of the above cases
}

mixinEvents = function(eventSource){
	var eventHash = {}
	eventSource.on = function(event, func){
		(eventHash[event] = eventHash[event] || []).push(func)
	}
	eventSource.emit = function(event){
		var args = Array.prototype.slice.call(arguments, 1)
		!(eventHash[event] = eventHash[event] || []).forEach(function(fun){
			fun.apply(null, args)
		})
	}
}