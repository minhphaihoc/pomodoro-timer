;(function (window, document, undefined) {
	'use strict';

	var timer;
	var documentTitle = document.title;
	var sound = document.querySelector('[data-timer-sound]');

	/**
	 * Display the timer to front end
	 * @param {Number} time in seconds
	 */
	var displayTimer = function (time) {
		var minutes = Math.floor(time / 60);
		var seconds = time % 60;

		// Format time. For example, 5:5 -> 05:05
		if (minutes < 10) {
			minutes = '0' + minutes;
		}

		if (seconds < 10) {
			seconds = '0' + seconds;
		}

		return minutes + ':' + seconds;
	};

	/**
	 * Update time every seconds
	 * @param {Number} time in seconds
	 */
	var setTimer = function (time) {
		clearInterval(timer);

		var now = new Date().getTime();
		var then = now + time * 1000;

		timer = setInterval(function () {
			var timeLeft = Math.round((then - new Date().getTime()) / 1000);

			// If the time has run out
			if (timeLeft < 0) {

				// Play ringing sound
				sound.play();

				// Stop the timer
				clearInterval(timer);

				// Reset document title to default value
				document.title = documentTitle;

				app.setData({
					status: 'stopped',
				});

				return;
			}

			// Update the state of time
			app.setData({
				time: timeLeft,
				status: 'running',
			});

			// Update document title with running pomodoro timer
			document.title = displayTimer(app.getData().time) + ' - ' + documentTitle;
		}, 1000);
	};

	/**
	 * Set up click handler
	 */
	var clickHandler = function (event) {

		// If user hits start timer button
		if (event.target.hasAttribute('data-start-timer')) {

			// Bail if the time has run out or the timer is running
			if (app.getData().time === 0 || app.getData().status === 'running') return;

			// Start the timer at current time
			setTimer(app.getData().time);
		}

		// If user hits pause timer button
		if (event.target.hasAttribute('data-pause-timer')) {

			// Bail if the time has run out
			if (app.getData().time === 0) return;

			// Stop the timer
			clearInterval(timer);
			app.setData({
				status: 'stopped',
			});
		}

		// If user hits reset timer button
		if (event.target.hasAttribute('data-reset-timer')) {

			// Stop the timer
			clearInterval(timer);

			// Reset the timer to current time duration
			app.setData({
				time: app.getData().duration,
				status: 'stopped',
			});
		}

		// If user selects a time duration
		if (event.target.hasAttribute('data-time')) {
			var time = parseInt(event.target.getAttribute('data-time'), 10);

			clearInterval(timer);
			setTimer(time);

			app.setData({
				duration: time,
				time: time,
				status: 'stopped',
			});
		}
	};

	/**
	 * Set up the component
	 */
	var app = new Reef('#app', {
		data: {
			duration: 1500, // in seconds
			time: 1500,
			status: 'stopped',
		},
		template: function(props) {
			return (
				'<div class="timer-durations">' +
					'<button data-time="1500">Pomodoro</button>' +
					'<button data-time="300">Short Break</button>' +
					'<button data-time="900">Long Break</button>' +
				'</div>' +
				'<h2 class="timer-pomodoro">' + displayTimer(props.time) + '</h2>' +
				'<div class="timer-controls">' +
					'<button data-start-timer>Start</button>' +
					'<button data-pause-timer>Pause</button>' +
					'<button data-reset-timer>Reset</button>' +
				'</div>'
			);
		},
	});
	app.render();

	// Listen for click event
	document.addEventListener('click', clickHandler, false);
})(window, document);
