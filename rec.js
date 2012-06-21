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
		eventTypes = [
//			'click',
			'mousedown',
			'mousemove',
			'mouseout',
			'mouseenter',
			'mouseup',
			'touchstart',
			'touchmove',
			'touchend',
			'change'
		],
		excludedProps = [
			'view'
		],
		elementProps = [
			'srcElement',
			'target',
			'currentTarget',
			'fromElement',
			'toElement',
			'relatedTarget',
		],
		json = '',
		recording = false,
		playing = false,
		currentIndex = 0,
		interval,
		delay = 25,
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
			'	z-index: 9001;',
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
			
			'#cover.active{',
			'	position: absolute;',
			'	right: 0px;',
			'	top: 0px;',
			'	width: 4000px;',
			'	height: 4000px;',
			'	z-index: 9000;',
			'}'
		].join('\n'),
		style = document.createElement('style');
	
	style.type = 'text/css';
	style.innerHTML = css;
	document.body.appendChild(style);
	
	cursor.id = 'cursor';
	
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
			events = [];

			for (var i = 0; i < eventTypes.length; i++) {
				document.addEventListener(eventTypes[i], recordEvent);
			}
		}
	}
	
	function recordEvent (event) {
		if (event.target.parent !== controlPanel && event.currentTarget.parent !== controlPanel) {
			events.push(event);
		}
	}
	
	function stop () {
		for (var i = 0; i < eventTypes.length; i++) {
			document.removeEventListener(eventTypes[i], recordEvent);
		}

		currentIndex = 0;
		window.clearInterval(interval);
		playing = false;
		recording = false;
		cover.classList.remove('active');
	}

	function pause () {	
		window.clearInterval(interval);
		playing = false;
	}

	function play () {
		if (events.length) {
			if (playing || recording) {
				stop();
			}
			playing = true;
			cover.classList.add('active');

			interval = window.setInterval(dispatchEvent, delay);
		}
	}

	function dispatchEvent () {
		var event = events[currentIndex];
		
		if (typeof event.pageX === 'number' && typeof event.pageY === 'number') {
			cursor.style.left = (event.pageX - cursor.offsetWidth / 2) + 'px';
			cursor.style.top = (event.pageY - cursor.offsetHeight / 2) + 'px';
		}
		event.target.dispatchEvent(event);
		
		currentIndex++;
		if ( currentIndex >= events.length ) {
			stop();
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
					this[prop] = (event[prop])?
						event[prop].id:
						null;
				} else {
					this[prop] = event[prop];
				}
			}
		}
	}
	
	function convertEvents(eventArray) {
		var i,
		objects = [];
		
		if (typeof eventArray !== 'object') {
			return objects;
		}
		
		for (i = 0; i < events.length; i++) {
			objects[i] = new Event(eventArray[i]);
		}
		return objects;
	}
	function createEvent(eventObject) {
		
	}
	
	function eventsToJson () {
		eventObjects = convertEvents(events);
		json = '[ ';
		
		for (var i = 0; i < eventObjects.length; i++) {
			json += JSON.stringify(eventObjects[i]);
			
			if ( i < eventObjects.length - 1) {
				json += ', ';
			}
		}
		
		json += ' ]';
		return json;
	}

	function clear (event) {
		events = [];
		stop();
	}

	rec.clear = clear;
	rec.stop = stop;
	rec.play = play;
	rec.start = start;
	rec.eventsToJson = eventsToJson;
	rec.convertEvents = convertEvents;

	rec.events = function () {
		return events;
	};

	rec.eventObjects = function () {
		return eventObjects;
	};

	rec.delay = function (ms) {
		return (delay = ms || delay);
	};

	rec.isPlaying = function () {
		return playing;
	};

	rec.isRecording = function () {
		return recording;
	};
	
	return rec;
}());

