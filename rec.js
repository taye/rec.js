/*
 * rec.js
 * Event recording and playback module
 *
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/TAdeyemi/rec.js/master/LICENSE
 */

window.rec = (function () {
	'use strict';
	
	var rec = {},
		document = window.document,
		events = [],
		eventObjects = [],
		eventTypes = {
			click: 'MouseEvents',
			dbclick: 'MouseEvents',
			mousedown: 'MouseEvents',
			mousemove: 'MouseEvents',
			mouseover: 'MouseEvents',
			mouseout: 'MouseEvents',
			mouseleave: 'MouseEvents',
			mouseenter: 'MouseEvents',
			mouseup: 'MouseEvents',
			
			touchstart: 'TouchEvents',
			touchmove: 'TouchEvents',
			touchend: 'TouchEvents',
			
			keydown: 'KeyboardEvents',
			keyup: 'KeyboardEvents',
			keypress: 'KeyboardEvents',
			
			change: 'Events',
			focus: 'Events',
			focusin: 'Events',
			focusout: 'Events',
			select: 'Events'
		},
		logEvent = {		
			Events: function (e) {
				console.log('=== ' + e.type + 'event ===');
				console.log('target: ' + e.target);
				if (e.relatedTarget) {
					console.log('relatedTarget: ' + e.relatedTarget);
				}
			},
			MouseEvents: function (e) {
				logEvent.Events(e);
				console.log('pageX, pageY: ' + e.pageY, e.pageY);
				console.log('screenX, screenY: ' + e.screenY, e.screenY);
			},
			TouchEvents: function (e) {
				logEvent.Events(e);
				console.Log('# touches: ' + e.touches.length);
			},
			KeyboardEvents: function (e) {
				logEvent.Events(e);
				console.log(e.keycode || e.which);
			}
		},
		eventsToLog = [
			'KeyboardEvents',
			'change'
		],
		mimicEvent = {
			change: {
				capture: function (e) {
					e.value = e.target.value;
				},
				dispatch: function (e) {
					e.target.value = e.value;
				}
			},
			blur: {
				dispatch: function (e) {
					e.target.blur();
				}
			},
			focus: {
				dispatch: function (e) {
					e.target.focus();
				}
			},
            mousedown: {
                dispatch: function (e) {
                    cursor.classList.add('down');
                }
            },
            mouseup: {
                dispatch: function (e) {
                    cursor.classList.remove('down');
                }
            }
		},
		excludedProps = [
			'view',
			'recTarget',
			'recTime',
			'altKey',
			'shiftKey',
			'metaKey',
			'ctrlKey',
			'bubbles',
			'cancelable',
			'detail',
			'cancelBubble',
			'defaultPrevented',
			'eventPhase',
			'isTrusted',
			'metaKey',
			'offsetX',
			'offsetY',
			'toElement'
		],
		elementProps = [
			'srcElement',
			'target',
			'currentTarget',
			'fromElement',
			'toElement',
			'relatedTarget'
		],
		prevEventTime = 0,
		json = '',
		recording = false,
		playing = false,
		currentIndex = 0,
		interval,
		delay = 25,
		playbackSpeed = 1,
		/*
		 * I should probably only init the events when they are about
		 * to be dispatched and then subtract window.scroll from
		 * the MouseEvent coordinates instead of force scrolling (0, 0)
		 * 
		 * There is also a problem with mouseEvents whent they were
		 * captured while the window was scrolled
		 */
		scrollToTop = true,
		recPanel = document.body.appendChild(document.createElement('div')),
		cover = document.body.appendChild(document.createElement('div')),
		cursor = document.body.appendChild(document.createElement('div')),
		recordButton = recPanel.appendChild(document.createElement('button')),
		stopButton = recPanel.appendChild(document.createElement('button')),
		playButton = recPanel.appendChild(document.createElement('button')),
		pauseButton = recPanel.appendChild(document.createElement('button')),
		css = [
			'#recPanel {',
			'	position: fixed;',
			'	right: 20px;',
			'	top: 20px;',
			'	width: 100px;',
			'	z-index: 90002;',
			'}',
			
			'#recPanel button {',
			'	width: 100% !important;',
			'	height: 30px; !important',
			'	margin: 5px, 0px, 5px, 0px !important;',
			'	background-color: #dddddd !important;',
			'	border: solid 2px #333333 !important;',
			'	border-radius: 5px !important;',
			'	float: left !important;',
			'}',

			'#recPanel button:active {',
			'	background-color: #99999 !important;',
			'}',

			'#cursor {',
			'	width: 5px;',
			'	height: 5px;',
			'	position: absolute !important;',
			'	background-color: #ffffff;',
			'	border: solid 2px #444444;',
			'	border-radius: 5px;',
			'}',

			'#cursor {',
			'	z-index: 9003;',
			'	display: none;',
			'}',
			
			'#cursor.show{',
			'	display: block;',
			'}',
			
			'#cursor.down{',
			'	background-color: #000000 !important;',
			'}',
			
			'#cover {',
			'	z-index: 9001;',
			'	display: none;',
			'}',
			
			'#cover.show{',
			'	position: fixed; !important;',
			'	left: 0px !important;',
			'	top: 0px !important;',
			'	width: ' + window.screen.width + 'px !important;',
			'	height: ' + window.screen.height + 'px !important;',
			'	display: block;',
			'	opacity:0 !important;',
			'}'
		].join('\n'),
		style = document.createElement('style');

	style.type = 'text/css';
	style.innerHTML = css;
	document.body.appendChild(style);
	
	cursor.id = 'cursor';
	
	cover.id = 'cover';
	
	recPanel.id = 'recPanel';
	
	playButton.id = 'play';
	playButton.innerHTML = 'Play';
	playButton.onclick = play;
	
	recordButton.id = 'record';
	recordButton.innerHTML = 'Record';
	recordButton.onclick = start;

	pauseButton.id = 'pause';
	pauseButton.innerHTML = 'Pause';
	pauseButton.onclick = pause;
	
	stopButton.id = 'stop';
	stopButton.innerHTML = 'Stop';
	stopButton.onclick = stop;

	function start () {
		if (!recording) {
			stop();
			recording = true;
			prevEventTime = new Date().getTime();
			events = [];

			for (var eventType in eventTypes) {
				if (eventTypes.hasOwnProperty(eventType)) {
					document.addEventListener(eventType, recordEvent);
				}
			}
		}
	}
	
	function recordEvent (event) {
		if (event.target.parentNode !== recPanel && event.currentTarget.parent !== recPanel) {			
			if (event.type in mimicEvent && typeof mimicEvent[event.type].capture === 'function') {
				mimicEvent[event.type].capture(event);
			}
			event.recTime = event.timeStamp - prevEventTime;
			events.push(event);
		}
		prevEventTime = event.timeStamp;
	}

	function stop () {
		for (var eventType in eventTypes) {
			if (eventTypes.hasOwnProperty(eventType)) {
//		for (var i = 0; i < eventTypes.length; i++) {
				document.removeEventListener(eventType, recordEvent);
			}
		}

		currentIndex = 0;
		prevEventTime = 0;
		window.clearInterval(interval);
		playing = false;
		recording = false;
		cover.classList.remove('show');
		cursor.classList.remove('show');
	}

	function pause () {	
		window.clearTimeout(interval);
		playing = false;
	}

	function play () {
		if (events.length) {
			if (playing || recording) {
				stop();
			}
			playing = true;
			cover.classList.add('show');
			cursor.classList.add('show');
			window.scrollTo(0, 0);

			interval = window.setTimeout(dispatchEvent,
				events[currentIndex].recTime * playbackSpeed);
		}
	}

	function dispatchEvent () {
		var event = events[currentIndex],
			target = event.target;
		
		if (scrollToTop) {
			window.scrollTo(0, 0);
		}
		
		if (!target) {
			/*
			 * I should perhaps temporarily hide the Cover then 
			 * target = document.ElementFromPoint(pageX, pageY)
			 */
			target = event.recTarget || document;
		}

		if (event.type in mimicEvent && typeof mimicEvent[event.type].dispatch === 'function') {
			mimicEvent[event.type].dispatch(event);
		}
		if (eventsToLog.indexOf(event.type) !== -1 || eventsToLog.indexOf(eventTypes[event.type]) !== -1) {
			// Need to simplify this
			logEvent[eventTypes[event.type]](event);
		}

		if (eventTypes[event.type] === 'MouseEvents') {
			cursor.style.left = (event.pageX - cursor.offsetWidth / 2) + 'px';
			cursor.style.top = (event.pageY - cursor.offsetHeight / 2) + 'px';
		}
		target.dispatchEvent(event);
		
		currentIndex++;
		if ( currentIndex >= events.length ) {
			stop();
		} else {
			interval = window.setTimeout(dispatchEvent,
				event.recTime * playbackSpeed);
		}
	}

	function cancelEvent (event) {
		event.preventDefault();
		event.stopPropagation();
		
		return false;
	}
	
	for (var eventType in eventTypes) {
		if (eventTypes.hasOwnProperty(eventType)) {
			cover.addEventListener(eventType, cancelEvent);
		}
	}

	function Event (event) {
		var prop;
		
		if (!event || typeof event !== 'object') {
			return null;
		}
		
		for (prop in event) {
			if (event.hasOwnProperty(prop) && excludedProps.indexOf(prop) === -1) {
				if (elementProps.indexOf(prop) !== -1) {
					if (event[prop] && event[prop].id !== '') {
						this[prop] = '#' + event[prop].id;
					} else {
						if (event[prop] === document.body) {
							this[prop] = 'body';
						}
						else {
							this[prop] = null;
						}
					}
				} else {
					this[prop] = event[prop];
				}
			}
		}
		return this;
	}
	
	function createEvent (eventObject) {
		var event;
		
		if (eventTypes[eventObject.type] === 'MouseEvents') {
			event = document.createEvent('MouseEvents');
			// Might need to change window thing...
/*			event.initMouseEvent(eventObject.type, eventObject.canBubble, eventObject.cancelable, window, 
				eventObject.detail, eventObject.screenX, eventObject.screenY, eventObject.clientX, eventObject.clientY, 
				eventObject.ctrlKey, eventObject.altKey, eventObject.shiftKey, eventObject.metaKey, 
				eventObject.button, document.querySelector(eventObject.relatedTarget));
*/
			event.initMouseEvent(eventObject.type, true, false, window, 
				0, eventObject.screenX, eventObject.screenY, eventObject.clientX, eventObject.clientY,
				false, false, false, false, 
				eventObject.button, document.querySelector(eventObject.relatedTarget));
		} else {
			event = document.createEvent('Events');
			event.initEvent(eventObject.type, eventObject.canBubble, eventObject.cancelable);
		}
		event.recTarget = document.querySelector(eventObject.target);
		
		return event;
	}
	
	function convertEvents() {
		var i,
		objects = [];
		
		if (typeof events !== 'object') {
			return objects;
		}
		
		for (i = 0; i < events.length; i++) {
			objects[i] = new Event(events[i]);
		}
		return objects;
	}
	
	function eventsToJson () {
		eventObjects = convertEvents();
		json = '[ ';
		
		for (var i = 0; i < eventObjects.length; i++) {
			json += JSON.stringify(eventObjects[i]);
			
			if ( i < eventObjects.length - 1) {
				json += ',\n';
			}
		}
		
		json += ' ]';
		return json;
	}

	function jsonToEvents(string) {
		var parsedObject;
		
		string = string || json || eventsToJson();
		parsedObject = JSON.parse(string);
		eventObjects = [];
		
		for (var i = 0; i < parsedObject.length; i++) {
			eventObjects[i] = parsedObject[i];
			events[i] = createEvent(eventObjects[i]);
		}
		return events;
	}		

	if (!window.navigator || window.navigator.userAgent !== 'Netscape') {
		eventTypes.change = 'Events';
	}

    rec = function (options) {
        if (typeof options !== 'object') {
            return;
        }

        eventsToLog = (options.eventsToLog)?
            options.eventsToLog:
            eventstoLog;
    }

	rec.stop = stop;
	rec.play = play;
	rec.start = start;
	rec.Event = Event;
	rec.eventsToJson = eventsToJson;
	rec.jsonToEvents = jsonToEvents;
	rec.convertEvents = convertEvents;
	rec.createEvent = createEvent;

	rec.events = function () {
		return events;
	};

	rec.eventObjects = function () {
		return eventObjects;
	};

	rec.delay = function (ms) {
		if (ms === undefined) {
			ms = delay;
		} else {
			ms = Number(ms);
			delay = ms;
		}
		return ms;
	};

	rec.playbackSpeed = function (scale) {
		if (scale === undefined) {
			scale = delay;
		} else {
			scale = Number(scale); delay = scale;
		}
		return scale;
	};

	rec.isPlaying = function () {
		return playing;
	};

	rec.isRecording = function () {
		return recording;
	};

	return rec;
}());
