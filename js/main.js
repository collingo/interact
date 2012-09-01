$(function() {

	var safe = 1,
		beingDragged,
		holdTimer,
		grab = {},
		start = {},
		hold = {x:0,y:0},
		element = $("ul");

	// utility
	function throttle(method, scope, e) {
		if(safe) {
			safe = 0;
			method.call(scope, e);
			method._tId = setTimeout(function(){
				safe = 1;
			}, 17);
		}
	}

	function touchHandler(event) {
		var touches = event.changedTouches,
			first = touches[0],
			type = "";

		switch(event.type) {
			case "touchstart": type="mousedown"; break;
			case "touchmove":  type="mousemove"; break;        
			case "touchend":   type="mouseup"; break;
			default: return;
		}

		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, 
								  first.screenX, first.screenY, 
								  first.clientX, first.clientY, false, 
								  false, false, false, 0/*left*/, null);
		first.target.dispatchEvent(simulatedEvent);
		event.preventDefault();
	}
	document.addEventListener("touchstart", touchHandler, true);
	document.addEventListener("touchmove", touchHandler, true);
	document.addEventListener("touchend", touchHandler, true);
	document.addEventListener("touchcancel", touchHandler, true); 



	element.hammer({prevent_default:true}).bind('mousedown', onStart).bind('mouseup', onEnd);

	function onStart(e) {

		if(e.target.tagName === "LI") {

			start.x = hold.x = e.pageX;
			start.y = hold.y = e.pageY;
			grab.x = e.pageX - e.target.offsetLeft;
			grab.y = e.pageY - e.target.offsetTop;
			beingDragged = $(e.target);

			element.bind('mousemove', onMoveDuringHold);

			holdTimer = setTimeout(onHoldTimerComplete, 200);

		}

	}

	function onHoldTimerComplete() {
		element.unbind('mousemove', onMoveDuringHold);
		if(Math.sqrt(Math.pow(hold.x - start.x, 2) + Math.pow(hold.y - start.y, 2)) < 30) {
			element.bind("drag", onMoveDuringDrag);
			// element.bind('mousemove', onMouseMoveDuringDrag);
			beingDragged.addClass("dragged");
		}
	}

	function onMoveDuringHold(e) {
		hold.x = e.pageX;
		hold.y = e.pageY;
	}

	function onMoveDuringDrag(e) {
		var touches = e.originalEvent.touches || [e.originalEvent];
		for(var t=0; t<touches.length; t++) {
			$(beingDragged).css({top:e.touches[0].y - grab.y, left:e.touches[0].x - grab.x});
		}
	}

	function onEnd(e) {
		clearTimeout(holdTimer);
		element.unbind('drag');
		element.unbind('mousemove', onMoveDuringHold);
		$("li").removeClass("dragged");
	}

});