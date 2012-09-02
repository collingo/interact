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
			dragCancelThreshold: 30
		}, options || {});

		// cache elements
		this.element = $(this.options.element);

		// cache key handlers bound to this
		this.boundEnd = this.onEnd.bind(this);
		this.boundMoveDuringHold = this.onMoveDuringHold.bind(this);
		this.boundMoveDuringDrag = this.onMoveDuringDrag.bind(this);
		this.boundHoldTimerComplete = this.onHoldTimerComplete.bind(this);

		// initialise
		this.element.on(this.events.start, this.onStart.bind(this));
	}
	Push.prototype = {
		constructor: Push,

		// properties
		events: {
			start: "mousedown",
			move: "mousemove",
			end: "mouseup"
		},

		// handlers
		onStart: function(e) {
			if($(e.target).is(this.options.draggableSelector)) {

				this.start = this.hold = this.grab = this.getCoordsFromEvent.call(this, e);
				this.grab.x = this.grab.x - e.target.offsetLeft;
				this.grab.y = this.grab.y - e.target.offsetTop;
				this.currentTarget = $(e.target);
				this.currentStartEvent = e;

				this.element
					.on(this.events.move, this.boundMoveDuringHold)
					.on(this.events.end, this.boundEnd);

				this.holdTimer = setTimeout(this.boundHoldTimerComplete, this.options.dragActiveDelay);

			}
		},

		onHoldTimerComplete: function() {
			this.element.off(this.events.move, this.onMoveDuringHold.bind(this));
			if(Math.sqrt(Math.pow(this.hold.x - this.start.x, 2) + Math.pow(this.hold.y - this.start.y, 2)) < this.options.dragCancelThreshold) {
				this.currentStartEvent.preventDefault();
				this.currentTarget.addClass(this.options.draggingClass);
				this.element.on(this.events.move, this.boundMoveDuringDrag);
			}
		},

		onMoveDuringHold: function(e) {
			this.hold = this.getCoordsFromEvent.call(this, e);
		},

		onMoveDuringDrag: function(e) {
			var coords = this.getCoordsFromEvent.call(this, e);
			e.preventDefault();
			this.currentTarget.css({top:(coords.y || this.start.y) - this.grab.y, left:(coords.x || this.start.x) - this.grab.x});
		},

		onEnd: function(e) {
			clearTimeout(this.holdTimer);
			this.element.off(this.events.end, this.boundEnd);
			this.element.off(this.events.move, this.boundMoveDuringHold);
			this.element.off(this.events.move, this.boundMoveDuringDrag);
			this.$(this.options.draggableSelector).removeClass(this.options.draggingClass);
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


	function Order() {
		Push.call(this);
	}
	Order.prototype = new Push();
	$.extend(Order.prototype, {
		
		constructor: Order,

		onStart: function(e) {
			Push.prototype.onStart.call(this, e);
			if($(e.target).is(this.options.draggableSelector)) {
				var offset = this.currentTarget.offset();
				this.cachedTop = offset.top;
				this.cachedLeft = offset.left;
			}
		},

		onHoldTimerComplete: function() {
			this.element.off(this.events.move, this.onMoveDuringHold.bind(this));
			if(Math.sqrt(Math.pow(this.hold.x - this.start.x, 2) + Math.pow(this.hold.y - this.start.y, 2)) < this.options.dragCancelThreshold) {
				this.currentStartEvent.preventDefault();
				this.currentTarget
					.css({top:this.cachedTop, left:this.cachedLeft})
					.addClass(this.options.draggingClass)
					.after($('<li class="placeholder" style="border:1px solid red;height:'+this.currentTarget.height()+'px;width:'+this.currentTarget.width()+'px;"></li>'));
				this.element.on(this.events.move, this.boundMoveDuringDrag);
			}
		},

		onEnd: function(e) {
			this.$(".placeholder").remove();
			this.currentTarget.css({top:"",left:""});
			Push.prototype.onEnd.call(this, e);
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
	window.order = new Order();

});