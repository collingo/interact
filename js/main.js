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
	window.start = {};
	window.move = {x:0,y:0};
	var beingDragged;
	var holdTimer;

	$("ul").hammer({prevent_default:true}).bind('mousedown', function(e) {

		if(e.target.tagName === "LI") {

			start = {
				x: e.pageX,
				y: e.pageY
			};
			down = {
				x: e.pageX - e.target.offsetLeft,
				y: e.pageY - e.target.offsetTop
			};
			beingDragged = $(e.target);

			$("ul").bind('mousemove', onMouseMove);

			holdTimer = setTimeout(function() {
				if((move.x === 0 && move.y === 0) || Math.sqrt(Math.pow(move.x - start.x, 2) + Math.pow(move.y - start.y, 2)) < 30) {
					beingDragged.addClass("dragged");
					$("ul").bind("drag", function(e) {
						//throttle(onDrag, window, e);
						onDrag(e);
					});
				} else {
					$("ul").unbind('mousemove', onMouseMove);
					move = {x:0,y:0};
				}
			}, 1000);

		}

	}).bind('mouseup', function(e) {
		clearTimeout(holdTimer);
		$("ul").unbind('drag');
		$("ul").unbind('mousemove', onMouseMove);
		$("li").removeClass("dragged");
	});

	function onMouseMove(e) {
		move.x = e.pageX;
		move.y = e.pageY;
	}

	function onDrag(e) {

        var touches = e.originalEvent.touches || [e.originalEvent];
        for(var t=0; t<touches.length; t++) {
			$(beingDragged).css({top:e.touches[0].y - down.y, left:e.touches[0].x - down.x});
        }
	}

});