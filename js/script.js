;(function (window, document, undefined) {
	'use strict';

	var timer;
	var displayTimer = function (time) {
		var minutes = Math.floor(time / 60);
		var seconds = time % 60;

		if (minutes < 10) {
			minutes = '0' + minutes;
		}

		if (seconds < 10) {
			seconds = '0' + seconds;
		}

		return minutes + ':' + seconds;
	};

	var setTimer = function (time) {
		clearInterval(timer);

		var now = new Date().getTime();
		var then = now + time * 1000;

		timer = setInterval(function () {
			var timeLeft = Math.round((then - new Date().getTime()) / 1000);

			if (timeLeft < 0) {
				clearInterval(timer);
				return;
			}

			app.setData({
				time: timeLeft,
			});

			document.title = displayTimer(app.getData().time);
		}, 1000);
	};

	var clickHandler = function (event) {
		if (event.target.hasAttribute('data-start-timer')) {
			setTimer(app.getData().time);
		}

		if (event.target.hasAttribute('data-pause-timer')) {
			clearInterval(timer);
		}

		if (event.target.hasAttribute('data-reset-timer')) {
			clearInterval(timer);
			app.setData({
				time: 1500,
			});
		}
	};

	var app = new Reef('#app', {
		data: {
			time: 1500, // time in seconds (25 minutes)
		},
		template: function(props) {
			return (
				'<div class="timer-controls">' +
					'<button data-start-timer>Start</button>' +
					'<button data-pause-timer>Pause</button>' +
					'<button data-reset-timer>Reset</button>' +
				'</div>' +
				'<h1>' + displayTimer(props.time) + '</h1>'
			);
		},
	});
	app.render();

	document.addEventListener('click', clickHandler, false);
})(window, document);
