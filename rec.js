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
		eventObjects = {},
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
		json = '',
		recording = false,
		playing = false,
		currentIndex = 0,
		interval,
		delay = 25,
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
			'}',
			
			'#controlPanel button {',
			'	width: 100%;',
			'	height: 30px;',
			'	border-radius: 5px;',
			'	float: left;',
			'}'
		].join('\n'),
		style = document.createElement('style');
	
	style.type = 'text/css';
	style.innerHTML = css;
	document.body.appendChild(style);
	
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
	}

	function pause () {	
		window.clearInterval(interval);
		playing = false;
	}

	function play () {
		if (events.length) {
			stop();
			playing = true;

			interval = window.setInterval(dispatchEvent, delay);
		}
	}

	function dispatchEvent () {
		events[currentIndex].target.dispatchEvent(events[currentIndex]);
		
		currentIndex++;
		if ( currentIndex >= events.length ) {
			stop();
		}
	}

	function Event (event) {
		var prop;
		
		for (prop in event) {
			if (event.hasOwnProperty(prop)) {
				this[prop] = event[prop];
			}
		}
	}
	
	function eventsToJson () {
		var i;
		
		for (i = 0; i < events.length; i++) {
			eventObjects.push(new Event(events[i]));
		}
		return JSON.stringify(eventObjects);
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

	rec.events = function () {
		return events;
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

