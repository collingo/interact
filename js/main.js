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
	var beingDragged;
	var holdTimer;

	$("ul").bind('mousedown', function(e) {
		down.x = e.pageX - e.target.offsetLeft;
		down.y = e.pageY - e.target.offsetTop;
		beingDragged = $(e.target);

		holdTimer = setTimeout(function() {
			beingDragged.addClass("dragged");
			$("ul").hammer({prevent_default:true}).bind("drag", function(e) {
				//throttle(onDrag, window, e);
				onDrag(e);
			});
		}, 1000);
	}).bind('mouseup', function(e) {
		clearTimeout(holdTimer);
		$("ul").unbind('drag');
		$("li").removeClass("dragged");
	});

	function onDrag(e) {

        var touches = e.originalEvent.touches || [e.originalEvent];
        for(var t=0; t<touches.length; t++) {
			$(beingDragged).css({top:e.touches[0].y - down.y, left:e.touches[0].x - down.x});
        }
	}

});