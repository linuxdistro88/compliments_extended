Module.register("compliments_extended", {
	defaults: {
		updateInterval: 30000,
		remoteFile: 'https://madzmagic.b-cdn.net/compliments.json', //this is the remote file that is being used to pull the compliments from
		fadeSpeed: 4000,
		earlyMorningStartTime: 3,
		earlyMorningEndTime: 9,
		midMorningStartTime: 9,
		midMorningEndTime: 12,
		afternoonStartTime: 12,
		afternoonEndTime: 17,
		eveningStartTime: 17,
		eveningEndTime: 21,
		nightStartTime: 21,
		nightEndTime: 3,
		random: true,
		timezone: "Australia/Melbourne"
	},

	start: function () {
		Log.info("Starting module: " + this.name);

		this.lastComplimentIndex = -1;
		this.lastIndexUsed = -1;
		this.currentWeatherType = "";

		if (this.config.remoteFile !== null) {
			this.complimentFile().then(response => {
				try {
					this.config.compliments = JSON.parse(response);
				} catch (e) {
					Log.error("Failed to parse compliments:", e);
				}
				this.updateDom();
			});
		}

		setInterval(() => {
			this.updateDom(this.config.fadeSpeed);
		}, this.config.updateInterval);
	},

	getScripts: function () {
		return ["moment.js", "moment-timezone.js"];
	},

	randomIndex: function (compliments) {
		if (compliments.length === 1) {
			return 0;
		}

		const generate = function () {
			return Math.floor(Math.random() * compliments.length);
		};

		let complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;
		return complimentIndex;
	},

	complimentArray: function () {
		const hour = moment().tz(this.config.timezone).hour();
		let compliments = [];

		if (!this.config.compliments) {
			Log.error("Compliments are not defined in the config.");
			return compliments;
		}

		if (hour >= this.config.earlyMorningStartTime && hour < this.config.earlyMorningEndTime && this.config.compliments.hasOwnProperty("earlyMorning")) {
			compliments = compliments.concat(this.config.compliments.earlyMorning);
		}

		if (hour >= this.config.midMorningStartTime && hour < this.config.midMorningEndTime && this.config.compliments.hasOwnProperty("midMorning")) {
			compliments = compliments.concat(this.config.compliments.midMorning);
		}

		if (hour >= this.config.afternoonStartTime && hour < this.config.afternoonEndTime && this.config.compliments.hasOwnProperty("afternoon")) {
			compliments = compliments.concat(this.config.compliments.afternoon);
		}

		if ((hour >= this.config.eveningStartTime && hour < this.config.eveningEndTime) && this.config.compliments.hasOwnProperty("evening")) {
			compliments = compliments.concat(this.config.compliments.evening);
		}

		if ((hour >= this.config.nightStartTime || hour < this.config.nightEndTime) && this.config.compliments.hasOwnProperty("night")) {
			compliments = compliments.concat(this.config.compliments.night);
		}

		if (this.currentWeatherType in this.config.compliments) {
			compliments = compliments.concat(this.config.compliments[this.currentWeatherType]);
		}

		if (this.config.compliments.hasOwnProperty("anytime")) {
			compliments = compliments.concat(this.config.compliments.anytime);
		}

		return compliments;
	},

	complimentFile: function () {
		return fetch(this.config.remoteFile)
			.then(response => {
				if (!response.ok) {
					throw new Error("HTTP error " + response.status);
				}
				return response.text();
			})
			.catch(function () {
				Log.error("Failed to load compliments file.");
			});
	},

	randomCompliment: function () {
		const compliments = this.complimentArray();
		if (compliments.length === 0) {
			Log.error("No compliments available.");
			return "";
		}

		let index;
		if (this.config.random) {
			index = this.randomIndex(compliments);
		} else {
			index = this.lastIndexUsed >= compliments.length - 1 ? 0 : ++this.lastIndexUsed;
		}

		return compliments[index] || "";
	},

	getDom: function () {
		const wrapper = document.createElement("div");
		wrapper.className = "thin xlarge bright pre-line";

		const complimentText = this.randomCompliment();

		const compliment = document.createElement("span");
		compliment.innerHTML = complimentText;

		wrapper.appendChild(compliment);

		return wrapper;
	},

	setCurrentWeatherType: function (type) {
		this.currentWeatherType = type;
	},

	notificationReceived: function (notification, payload, sender) {
		if (notification === "CURRENTWEATHER_TYPE") {
			this.setCurrentWeatherType(payload.type);
		}
	}
});
