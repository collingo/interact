$(function() {

	var safe = 1,
		beingDragged,
		holdTimer,
		grab = {},
		start = {},
		hold = {x:0,y:0},
		element = $("ul"),
		currentTarget,
		onStartEvent,
		eventDefinition = {
			mouse: {
				start: "mousedown",
				move: "mousemove",
				end: "mouseup"
			},
			touch: {
				start: "touchstart",
				move: "touchmove",
				end: "touchend"
			}
		};

	if('ontouchstart' in window) {
		events = eventDefinition.touch;
	} else {
		events = eventDefinition.mouse;
	}

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

	function getXYfromEvent( event ) {
		if(event.originalEvent.hasOwnProperty("touches")) {
			return { x: event.originalEvent.touches[0].pageX, y: event.originalEvent.touches[0].pageY };
		} else {
			return { x: event.pageX, y: event.pageY };
		}
	}

	// methods
	function onStart(e) {
		if(e.target.tagName === "LI") {

			start = hold = getXYfromEvent(e);
			grab.x = start.x - e.target.offsetLeft;
			grab.y = start.y - e.target.offsetTop;
			currentTarget = $(e.target);
			onStartEvent = e;

			element.bind(events.move, onMoveDuringHold);

			holdTimer = setTimeout(onHoldTimerComplete, 200);

		}
	}

	function onHoldTimerComplete() {
		element.unbind(events.move, onMoveDuringHold);
		if(Math.sqrt(Math.pow(hold.x - start.x, 2) + Math.pow(hold.y - start.y, 2)) < 30) {
			onStartEvent.preventDefault();
			currentTarget.addClass("dragged");
			element.bind(events.move, onMoveDuringDrag);
		}
	}

	function onMoveDuringHold(e) {
		hold = getXYfromEvent(e);
	}

	function onMoveDuringDrag(e) {
		var coords = getXYfromEvent(e);
		e.preventDefault();
		currentTarget.css({top:(coords.y || start.y) - grab.y, left:(coords.x || start.x) - grab.x});
	}

	function onEnd(e) {
		clearTimeout(holdTimer);
		element.unbind(events.move, onMoveDuringHold);
		element.unbind(events.move, onMoveDuringDrag);
		$("li").removeClass("dragged");
	}

	// setup initial binds
	element.bind(events.start, onStart).bind(events.end, onEnd);

});