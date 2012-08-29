$(function() {

	var safe = 1;

	function throttle(method, scope, e) {
		if(safe) {
			safe = 0;
			method.call(scope, e);
			method._tId = setTimeout(function(){
				safe = 1;
			}, 17);
		}
	}

	window.down = {};

	$("li").bind('mousedown', function(e) {
		// console.log(e, e.target,  e.pageX - e.target.offsetTop, e.pageY - e.target.offsetLeft);
		console.log(e.pageX, "-", e.target.offsetTop, e.pageY - e.target.offsetLeft);
		down.x = e.pageX - e.target.offsetLeft;
		down.y = e.pageY - e.target.offsetTop;
	}).hammer({prevent_default:true}).bind("drag", function(e) {
		throttle(onDrag, window, e);
	});

	function onDrag(e) {
		console.log(Date.now(), "drag", e);
		$(e.target).css({top:e.touches[0].y - down.y, left:e.touches[0].x - down.x});
	}

});