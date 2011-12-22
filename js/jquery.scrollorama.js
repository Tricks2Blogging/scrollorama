/*
	scrollorama - The jQuery plugin for doing cool scrolly stuff
	by John Polacek (@johnpolacek)
	
	Dual licensed under MIT and GPL.
*/

(function($) {
    $.scrollorama = function(options) {
		
		// PRIVATE VARS
		var blocks = [],
			scrollElements = [],
			scrollwrap,
			browserPrefix = '';
		
		var defaults = {
			
		};
		
		var scrollorama = this;
		scrollorama.settings = {};
		
		// PRIVATE FUNCTIONS
		function init() {
			scrollorama.settings = $.extend({}, defaults, options);
			
			// set browser prefix
			if ($.browser.mozilla)
					browserPrefix = '-moz-';
			if ($.browser.webkit)
				browserPrefix = '-webkit-';
			if ($.browser.opera)
				browserPrefix = '-o-';
			if ($.browser.msie)
				browserPrefix = '-ms-';
			
			// create blocks array to contain animation props
			$('body').css('position','relative');
			
			for (var i=0; i<$(scrollorama.settings.blocks).length; i++) {
				var block = $(scrollorama.settings.blocks).eq(i);
				blocks.push({
					block: block,
					top: block.offset().top,
					pin: 0,
					animations:[]
				});
			}
			
			// convert block elements to absolute position
			for (var i=0; i<blocks.length; i++) {
				blocks[i].block
					.css('position', 'absolute')
					.css('top', blocks[i].top);
			}
			
			$("body").prepend("<div id='scroll-wrap'></div>");
			scrollwrap = $('#scroll-wrap');
			scrollwrap
				.css('height', $('body').height())
				.css('position', 'absolute')
				.css('border', 'solid 1px red');
				
			$(window).scroll(onScrollorama);
		};
		
		function onScrollorama() {
			var scrollTop = $(window).scrollTop();
			var currBlockIndex = getCurrBlockIndex(scrollTop);
			
			// update all animations
			for (var i=0; i<blocks.length; i++) {
				
				// go through the animations for each block
				if (blocks[i].animations.length) {
					for (var j=0; j<blocks[i].animations.length; j++) {
						var anim = blocks[i].animations[j];
						
						// if above current block, settings should be at start value
						if (i > currBlockIndex) {
							if (currBlockIndex != i-1 && anim.baseline != 'bottom') {
								console.log('prop '+anim.property);
								setProperty(anim.element, anim.property, anim.startVal);
							}
							if (blocks[i].pin) {
								blocks[i].block
									.css('position', 'absolute')
									.css('top', blocks[i].top);
							}
						}
						
						// if below current block, settings should be at end value
						// unless on an element that gets animated when it hits the bottom of the viewport
						else if (i < currBlockIndex) {
							setProperty(anim.element, anim.property, anim.endVal);
							if (blocks[i].pin) {
								blocks[i].block
									.css('position', 'absolute')
									.css('top', (blocks[i].top + blocks[i].pin));
							}
						}
						
						// otherwise, set values per scroll position
						if (i == currBlockIndex || (currBlockIndex == i-1 && anim.baseline == 'bottom')) {
							// if block gets pinned, set position fixed
							if (blocks[i].pin && currBlockIndex == i) {
								blocks[i].block
									.css('position', 'fixed')
									.css('top', 0);
							}
							
							var startAnimPos = blocks[i].top + anim.delay;
							if (anim.baseline == 'bottom') {
								startAnimPos -= $(window).height();
							}
							var endAnimPos = startAnimPos + anim.duration;							
							
							// if scroll is before start of animation, set to start value
							if (scrollTop < startAnimPos) {
								setProperty(anim.element, anim.property, anim.startVal);
							}
							
							// if scroll is after end of animation, set to end value
							else if (scrollTop > endAnimPos) {
								setProperty(anim.element, anim.property, anim.endVal);
								if (blocks[i].pin) {
									blocks[i].block
											.css('position', 'absolute')
											.css('top', (blocks[i].top + blocks[i].pin));
								}
							}
							
							// otherwise, set value based on scroll
							else {
								// calculate percent to animate
								var animPercent = (scrollTop - startAnimPos) / anim.duration;
								// then multiply the percent by the value range and calculate the new value
								var animVal = anim.startVal + (animPercent * (anim.endVal - anim.startVal));
								setProperty(anim.element, anim.property, animVal);
							}
						}
					}
				}
			}
		}
		
		function getCurrBlockIndex(scrollTop) {
			var currBlockIndex = 0;
			for (var i=0; i<blocks.length; i++) {
				// check if block is in view
				if (blocks[i].top < scrollTop) {
					currBlockIndex = i;
				}
			}
			return currBlockIndex;
		}
		
		function setProperty(target, prop, val) {
			if (prop == 'letter-spacing') {
				console.log(val);
			}
			if (prop === 'rotate' || prop === 'zoom' || prop === 'scale') {
				if (prop === 'rotate') {
					target.css(browserPrefix+'transform', 'rotate('+val+'deg)');
				} else if (prop === 'zoom' || prop === 'scale') {
					var scaleCSS = 'scale('+val+')';
					if (browserPrefix !== '-ms-') {
						target.css(browserPrefix+'transform', scaleCSS);
					} else {
						target.css('zoom', scaleCSS);
					}
				}
			} else {
				target.css(prop, val);
			}	
		}
		
		// PUBLIC FUNCTIONS
		scrollorama.animate = function(target) {
			/*
				target		= animation target
				arguments	= array of animation parameters
				
				animation parameters:
				delay 		= amount of scrolling (in pixels) before animation starts
				duration 	= amount of scrolling (in pixels) over which the animation occurs
				property	= css property being animated
				start		= start value of the property
				end			= end value of the property
				pin			= pin block during animation duration (applies to all animations within block)
				baseline	= top (default, when block reaches top of viewport) or bottom (when block first comies into view)
			*/
			
			// if string, convert to DOM object
			if (typeof target === 'string') {
				target = $(target);
			}
			
			// find block of target
			var targetIndex;
			var targetBlock;
			for (var i=0; i<blocks.length; i++) {
				if (blocks[i].block.has(target).length) {
					targetBlock = blocks[i];
					targetIndex = i;
				}
			}
			
			// add each animation to the block�s animations array
			for (i=1; i<arguments.length; i++) {
				
				var anim = arguments[i];
				
				anim.delay = anim.delay !== undefined ? anim.delay : 0;
			
				if (anim.property == 'top' || anim.property == 'left' || anim.property == 'bottom' || anim.property == 'right' ) {
					
					if (target.css('position') == 'static') {
						target.css('position','relative');
					}
					
					if (anim.start === undefined) {
						anim.start = 0;
					} else if (anim.end === undefined) {
						anim.end = 0;
					}
				}
				
				if (anim.property == 'rotate') {
					if (anim.start === undefined)
						anim.start = 0;
					if (anim.end === undefined)
						anim.end = 0;
				} else if (anim.property == 'zoom' || anim.property == 'scale' ) {
					if (anim.start === undefined)
						anim.start = 1;
					if (anim.end === undefined)
						anim.end = 1;
				} else if (anim.property == 'letter-spacing' && target.css(anim.property)) {
					if (anim.start === undefined)
						anim.start = 1;
					if (anim.end === undefined)
						anim.end = 1;
				}
				
				blocks[targetIndex].animations.push({
					element: target,
					delay: anim.delay,
					duration: anim.duration,
					property: anim.property,
					startVal: anim.start !== undefined ? anim.start : parseInt(target.css(anim.property),10), 	// if undefined, use current css value
					endVal: anim.end !== undefined ? anim.end : parseInt(target.css(anim.property),10),			// if undefined, use current css value
					baseline: anim.baseline !== undefined ? anim.baseline : 'top'
				});
				
				if (anim.pin) {
					if (targetBlock.pin < anim.duration + anim.delay) {
						var offset = anim.duration + anim.delay - targetBlock.pin;
						targetBlock.pin += offset;
						// adjust positions of blocks below target block
						for (var j=targetIndex+1; j<blocks.length; j++) {
							blocks[j].top += offset;
							blocks[j].block.css('top', blocks[j].top);
						}
						// adjust height of scrollwrap
						scrollwrap.height += offset;
					}
				}
			}
			
			onScrollorama();
		}
		
		
		// INIT
		init();
		
		return scrollorama;
    };
     
})(jQuery);