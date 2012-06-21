/*
 * rec.js
 * Event recording and playback module
 * Copyright Taye Adeyemi
 */

window.rec = (function () {
	'use strict';
	
	var rec = {},
		document = window.document,
		events = [],
		eventObjects = [],
		eventTypes = {
//			'click,

			mousedown: 'MouseEvents',
			mousemove: 'MouseEvents',
			mouseout: 'MouseEvents',
			mouseenter: 'MouseEvents',
			mouseup: 'MouseEvents',
			touchstart: 'TouchEvents',
			touchmove: 'TouchEvents',
			touchend: 'TouchEvents',
//			change: 'Events',
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
			'toElement',
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
		 * the MouseEvent coordinates instead of forcing things like this
		 */
		scrollToTop = true,
		cover = document.body.appendChild(document.createElement('div')),
		cursor = document.body.appendChild(document.createElement('div')),
		controlPanel = document.body.appendChild(document.createElement('div')),
		recordButton = controlPanel.appendChild(document.createElement('button')),
		stopButton = controlPanel.appendChild(document.createElement('button')),
		playButton = controlPanel.appendChild(document.createElement('button')),
		pauseButton = controlPanel.appendChild(document.createElement('button')),
		css = [
			'#controlPanel {',
			'	position: absolute;',
			'	right: 20px;',
			'	top: 20px;',
			'	width: 100px;',
			'	z-index: 9002;',
			'}',
			
			'#controlPanel button {',
			'	width: 100%;',
			'	height: 30px;',
			'	border-radius: 5px;',
			'	float: left;',
			'}',
			
			'#cursor {',
			'	width: 5px;',
			'	height: 5px;',
			'	position: absolute;',
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
			
			'#cover {',
			'	z-index: 9001;',
			'	display: none;',
			'}',
			
			'#cover.show{',
			'	position: absolute;',
			'	left: 0px;',
			'	top: 0px;',
			'	width: ' + window.screen.width + 'px;',
			'	height: ' + window.screen.height + 'px;',
			'	display: block;',
			'}'
		].join('\n'),
		style = document.createElement('style');
	
	style.type = 'text/css';
	style.innerHTML = css;
	document.body.appendChild(style);
	
	cursor.id = 'cursor';
	
	cover.id = 'cover';
	
	controlPanel.id = 'controlPanel';
	
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
		if (event.target.parent !== controlPanel && event.currentTarget.parent !== controlPanel) {
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
//		window.clearInterval(interval);
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
		
		if (!target) target = event.recTarget || document;
		
		if (typeof event.pageX === 'number' && typeof event.pageY === 'number') {
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
						this[prop] = null;
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
			event.initEvent(eventObject.type, eventObject.canBubble, eventObject.cancelable)
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
		return (ms != null)?
			delay = ms:
			delay;
	};

	rec.playbackSpeed = function (scale) {
		return (scale != null)?
			playbackSpeed = scale:
			playbackSpeed;
	};

	rec.isPlaying = function () {
		return playing;
	};

	rec.isRecording = function () {
		return recording;
	};
	
	return rec;
}());
