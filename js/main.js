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
			element: $("html"),
			draggableSelector: "li",
			draggingClass: "dragging",
			dragActiveDelay: 200,
			dragCancelThreshold: 30,
			zIndex: 100
		}, options || {});

		// cache elements
		this.element = $(this.options.element);
		this.start = this.offset = this.grab = this.hold = this.drag = {};

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

		// methods
		init: function() {
			this.setToInitialState.call(this);
		},

		setToInitialState: function() {
			this.element
				.css({
					"user-select": "",
					"touch-callout": "",
					"user-drag": "",
					"tap-highlight-color": "",
					"cursor": ""
				})
				.on(this.events.start, this.boundStart);
		},

		beginHold: function() {
			if(this.currentTarget.is(this.options.draggableSelector)) {

				this.hold = this.start;

				this.element
					.off(this.events.start, this.boundStart)
					.on(this.events.move, this.boundMoveDuringHold)
					.on(this.events.end, this.boundCancelHold);

				this.offset = this.currentTarget.offset();
				this.grab.x = this.start.x - this.offset.left;
				this.grab.y = this.start.y - this.offset.top;

				this.holdTimer = setTimeout(this.boundHoldTimerComplete, this.options.dragActiveDelay);

			}
		},

		cancelHold: function() {
			clearTimeout(this.holdTimer);
			this.element
				.off(this.events.move, this.boundMoveDuringHold)
				.off(this.events.end, this.boundCancelHold);
		},

		endHold: function() {
			this.element.off(this.events.move, this.onMoveDuringHold.bind(this));
			if(Math.sqrt(Math.pow(this.hold.x - this.start.x, 2) + Math.pow(this.hold.y - this.start.y, 2)) < this.options.dragCancelThreshold) {
				this.beginDrag.call(this);
			}
		},

		beginDrag: function() {
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
				.off(this.events.move, this.boundMoveDuringHold)
				.off(this.events.end, this.boundCancelHold)
				.on(this.events.move, this.boundMoveDuringDrag)
				.on(this.events.end, this.boundendDrag);
		},

		duringDrag: function() {
			this.currentTarget.css({top:(this.drag.y || this.start.y) - this.grab.y, left:(this.drag.x || this.start.x) - this.grab.x});
		},

		endDrag: function() {
			this.element
				.off(this.events.move, this.boundMoveDuringDrag)
				.off(this.events.end, this.boundendDrag);
			this.currentTarget
				.removeClass(this.options.draggingClass)
				.css({"z-index":""});
		},

		// handlers
		onStart: function(e) {
			this.currentTarget = $(e.target);
			this.start = this.getCoordsFromEvent.call(this, e);
			this.beginHold.call(this);
		},

		onMoveDuringHold: function(e) {
			this.hold = this.getCoordsFromEvent.call(this, e);
		},

		onCancelHold: function(e) {
			this.cancelHold.call(this);
			this.setToInitialState.call(this);
		},

		onHoldTimerComplete: function() {
			this.endHold.call(this);
		},

		onMoveDuringDrag: function(e) {
			e.preventDefault();
			this.drag = this.getCoordsFromEvent.call(this, e);
			this.duringDrag.call(this);
		},

		onDragEnd: function(e) {
			this.endDrag.call(this);
			this.setToInitialState.call(this);
		},

		// utility
		getCoordsFromEvent: function( event ) {
			return { x: event.pageX, y: event.pageY };
		},

		$: function(selector, scopeOverride) {
			var scope = this.element;
			if(scopeOverride) {
				scope = scopeOverride;
			}
			return $(selector, scope);
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

		this.boundOnReturn = this.onReturn.bind(this);
	}
	Order.prototype = new Push();
	$.extend(Order.prototype, {
		
		constructor: Order,

		// methods
		beginDrag: function() {
			Push.prototype.beginDrag.call(this);
			this.currentTarget
				.css({position:"absolute",top:this.offset.top, left:this.offset.left})
				.after($('<li class="placeholder" style="height:'+this.currentTarget.outerHeight()+'px;width:'+this.currentTarget.outerWidth()+'px;"></li>'));
		},

		endDrag: function(e) {
			Push.prototype.endDrag.call(this);
			if(this.start.x === this.drag.x && this.start.y === drag.hold.y) {
				this.finishReturn.call(this);
			} else {
				this.currentTarget
					.on(this.options.returnEvents, this.boundOnReturn)
					.addClass(this.options.returningClass)
					.css({
						"z-index": this.options.zIndex,
						top:this.offset.top,
						left:this.offset.left,
						"transition-property": "top, left",
						"transition-duration": this.options.returnSpeed+"s"
					});
			}
		},

		finishReturn: function() {
			this.$(".placeholder").remove();
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
		onDragEnd: function(e) {
			this.endDrag.call(this);
		},
		onReturn: function(e) {
			this.finishReturn.call(this);
			this.setToInitialState.call(this);
		}

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