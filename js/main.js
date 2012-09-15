$(function() {

	if(!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = Array.prototype.slice.call(arguments, 1), 
				fToBind = this, 
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply(this instanceof fNOP && oThis
										 ? this
										 : oThis,
									   aArgs.concat(Array.prototype.slice.call(arguments)));
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	function Push(options) {

		// cache options
		this.options = $.extend({
			elementSelector: "html",
			draggableSelector: "li",
			draggingClass: "dragging",
			dragActiveDelay: 200,
			dragCancelThreshold: 30,
			zIndex: 100
		}, options || {});

		// cache elements
		this.element = $(this.options.elementSelector);
		this.coords.start = this.coords.offset = this.coords.grab = this.coords.hold = this.coords.drag = {};

		// cache key handlers bound to this
		this.boundStart = this.onStart.bind(this);
		this.boundMoveDuringHold = this.onMoveDuringHold.bind(this);
		this.boundCancelHold = this.onCancelHold.bind(this);
		this.boundMoveDuringDrag = this.onMoveDuringDrag.bind(this);
		this.boundendDrag = this.onDragEnd.bind(this);
		this.boundHoldTimerComplete = this.onHoldTimerComplete.bind(this);

	}
	Push.prototype = {
		constructor: Push,

		// properties
		events: {
			start: "mousedown",
			move: "mousemove",
			end: "mouseup"
		},

		coords: {
			start: {},
			offset: {},
			grab: {},
			hold: {},
			drag: {}
		},

		// methods
		init: function() {
			this.setupInactiveState.call(this);
		},


		// INACTIVE STATE

		setupInactiveState: function() {
			this.element.on(this.events.start, this.boundStart);
		},

		takedownInactiveState: function() {
			this.element.off(this.events.start, this.boundStart);
		},

		// handlers
		onStart: function(e) {
			this.setCurrentTarget.call(this, $(e.target));
			this.setStartCoords.call(this, this.getCoordsFromEvent.call(this, e));
			if(this.isCurrentTargetValidElement.call(this)) {
				this.takedownInactiveState.call(this);
				this.setupHoldState.call(this);
			}
		},

		// helpers
		isCurrentTargetValidElement: function() {
			return this.currentTarget.is(this.options.draggableSelector);
		},

		// methods
		setCurrentTarget: function(target) {
			this.currentTarget = target;
		},

		setStartCoords: function(coords) {
			this.coords.start = coords;
		},

		// END INACTIVE STATE

		// HOLDING STATE

		setupHoldState: function() {
			this.element
				.on(this.events.move, this.boundMoveDuringHold)
				.on(this.events.end, this.boundCancelHold);

			this.coords.hold = this.coords.start;

			this.holdTimer = setTimeout(this.boundHoldTimerComplete, this.options.dragActiveDelay);
		},

		takedownHoldState: function() {
			this.element
				.off(this.events.move, this.boundMoveDuringHold)
				.off(this.events.end, this.boundCancelHold);
		},

		// handlers
		onMoveDuringHold: function(e) {
			this.updateHoldCoords.call(this, this.getCoordsFromEvent.call(this, e));
		},

		onCancelHold: function(e) {
			this.cancelHoldTimer.call(this);
			this.takedownHoldState.call(this);
			this.setupInactiveState.call(this);
		},

		onHoldTimerComplete: function(e) {
			this.takedownHoldState.call(this);
			if(this.isWithinBounds.call(this)) {
				this.setupDragState.call(this);
			} else {
				this.setupInactiveState.call(this);
			}
		},

		// helpers
		isWithinBounds: function() {
			return (Math.sqrt(Math.pow(this.coords.hold.x - this.coords.start.x, 2) + Math.pow(this.coords.hold.y - this.coords.start.y, 2)) < this.options.dragCancelThreshold);
		},

		// methods
		updateHoldCoords: function(coords) {
			this.coords.hold = coords;
		},

		cancelHoldTimer: function() {
			clearTimeout(this.holdTimer);
		},

		// END HOLDING STATE

		// DRAGGING STATE
			
		setupDragState: function() {

			this.coords.offset = this.currentTarget.offset();
			this.coords.grab.x = this.coords.start.x - this.coords.offset.left;
			this.coords.grab.y = this.coords.start.y - this.coords.offset.top;

			this.currentTarget
				.addClass(this.options.draggingClass)
				.css({
					"z-index":this.options.zIndex
				});

			this.element
				.css({
					"user-select": "none",
					"touch-callout": "none",
					"user-drag": "none",
					"tap-highlight-color": "rgba(0,0,0,0)",
					"cursor": "move"
				})
				.on(this.events.move, this.boundMoveDuringDrag)
				.on(this.events.end, this.boundendDrag);
		},

		takedownDragState: function() {

			this.element
				.off(this.events.move, this.boundMoveDuringDrag)
				.off(this.events.end, this.boundendDrag)
				.css({
					"user-select": "",
					"touch-callout": "",
					"user-drag": "",
					"tap-highlight-color": "",
					"cursor": ""
				});

			this.currentTarget
				.removeClass(this.options.draggingClass)
				.css({"z-index":""});
		},

		// handlers
		onMoveDuringDrag: function(e) {
			e.preventDefault();
			this.updateTargetPosition.call(this, this.getCoordsFromEvent.call(this, e));
		},

		onDragEnd: function(e) {
			this.takedownDragState.call(this);
			this.setupInactiveState.call(this);
		},
		
		// methods
		updateTargetPosition: function(coords) {
			this.coords.drag = coords;
			this.currentTarget.css({top:(this.coords.drag.y || this.coords.start.y) - this.coords.grab.y, left:(this.coords.drag.x || this.coords.start.x) - this.coords.grab.x});
		},

		// END DRAGGING STATE

		// GLOBAL UTILITY
		getCoordsFromEvent: function(event) {
			return { x: event.pageX, y: event.pageY };
		},

		$: function(selector, scope) {
			return $(selector, scope || this.element);
		}
	}

	// override prototype with touch specific properties and methods
	if('ontouchstart' in window) {
		$.extend(Push.prototype, {
			events : {
				start: "touchstart",
				move: "touchmove",
				end: "touchend"
			},
			getCoordsFromEvent: function( event ) {
				return { x: event.originalEvent.touches[0].pageX, y: event.originalEvent.touches[0].pageY };
			}
		});
	}


	function Order(options) {
		Push.call(this, options);

		$.extend(this.options, {
			returningClass: "returning",
			returnEvents: 'transitionend webkitTransitionEnd oTransitionEnd',
			returnSpeed: 0.35
		});

		this.placeholder = $('<li class="placeholder"></li>');

		this.boundReturn = this.onReturn.bind(this);
	}
	Order.prototype = new Push();
	$.extend(Order.prototype, {
		
		constructor: Order,

		// DRAG STATE OVERRIDES
		
		setupDragState: function() {
			Push.prototype.setupDragState.call(this);
			this.coords.drag = this.coords.start;
			this.placeholder
				.css({
					height: this.currentTarget.outerHeight(),
					width: this.currentTarget.outerWidth()
				});
			this.currentTarget
				.css({position:"absolute",top:this.coords.offset.top, left:this.coords.offset.left})
				.after(this.placeholder);
		},

		takedownDragState: function() {
			Push.prototype.takedownDragState.call(this);
		},

		// handlers
		onDragEnd: function(e) {
			this.takedownDragState.call(this);
			if(this.hasMoved.call(this)) {
				this.setupReturnState.call(this);
			} else {
				this.cleanUpDragState.call(this);
				this.setupInactiveState.call(this);
			}
		},

		// helpers
		hasMoved: function() {
			return (this.coords.start.x !== this.coords.drag.x || this.coords.start.y !== this.coords.drag.y);
		},

		cleanUpDragState: function() {
			this.placeholder.remove();
			this.currentTarget
				.css({position:"",top:"", left:""})
				.removeAttr("style");
		},

		// END DRAG STATE OVERRIDES
		
		// RETURN STATE
		
		setupReturnState: function() {
			this.currentTarget
				.on(this.options.returnEvents, this.boundReturn)
				.addClass(this.options.returningClass)
				.css({
					"z-index": this.options.zIndex,
					top:this.coords.offset.top,
					left:this.coords.offset.left,
					"transition-property": "top, left",
					"transition-duration": this.options.returnSpeed+"s"
				});
		},

		takedownReturnState: function() {
			this.placeholder.remove();
			this.currentTarget
				.removeClass(this.options.returningClass)
				.off(this.options.returnEvents, this.boundOnReturn)
				.css({
					"z-index": "",
					top:"",
					left:"",
					position: "",
					"transition-property": "",
					"transition-duration": ""
				})
				.removeAttr("style");
		},

		// handlers
		onReturn: function(e) {
			this.takedownReturnState.call(this);
			this.setupInactiveState.call(this);
		}

		// END RETURN STATE

	});


	window.mySwipe = new Swipe(document.getElementById('slider'), {
	    speed: 400,
	    auto: 0,
	    callback: function(event, index, elem) {

	      // do something cool

	    }
	});
	// window.push = new Push();
	// window.push.init();
	window.order = new Order();
	window.order.init();

});