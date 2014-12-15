navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var lastCheckedPosition,
        locationEventCount = 0,
        watchID,
        timerID;

    options = options || {};

    var checkLocation = function (position) {
        lastCheckedPosition = position;
        locationEventCount = locationEventCount + 1;
        // We ignore the first event unless it's the only one received because some devices seem to send a cached
        // location even when maxaimumAge is set to zero
        if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > 1)) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            foundPosition(position);
        } else {
            geoprogress(position);
        }
    };

    var stopTrying = function () {
        navigator.geolocation.clearWatch(watchID);
        foundPosition(lastCheckedPosition);
    };

    var onError = function (error) {
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    };

    var foundPosition = function (position) {
        geolocationSuccess(position);
    };

    if (!options.maxWait)            options.maxWait = 10000; // Default 10 seconds
    if (!options.desiredAccuracy)    options.desiredAccuracy = 20; // Default 20 meters
    if (!options.timeout)            options.timeout = options.maxWait; // Default to maxWait

    options.maximumAge = 0; // Force current locations only
    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)

    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
};

window.onerror = function () {
	console.log([].join.apply(arguments,[","]))
	return true;
}
function GeoLocator() {
}
GeoLocator.prototype = {
	requestText: function (url) {
		var deferred = Q.defer(),
			xhr = new XMLHttpRequest(),
			reject = deferred.reject.bind(deferred);
		xhr.open("GET",url);
		xhr.setRequestHeader("Access-Control-Allow-Origin","*")
		xhr.onabort = xhr.onerror = xhr.ontimeout = reject;
		xhr.onload = function () {
			if (this.status>199 && this.status <300) {
				deferred.resolve(this.responseText)
			} else {
				reject(new Error("Server Error - "+this.status))
			}
		}
		try {
			xhr.send();
		} catch (e) {
			reject(e)
		}
		return deferred.promise;
	},
	fetchCoordinates: function () {
		var deferred = Q.defer();
		navigator.geolocation.getCurrentPosition(deferred.resolve.bind(deferred),this.handleGeolocationError.bind(this,deferred),{enableHighAccuracy:true})
		return deferred.promise;
	},
	fetchCountryCode: function () {
		var countryCodeDeferred = Q.defer();
		this.fetchCoordinates().done(this.resolveCountryCode.bind(this,countryCodeDeferred),this.handleGeolocationError.bind(this,countryCodeDeferred))
		return countryCodeDeferred.promise;
	},
	resolveCountryCode: function (deferred,geolocation) {
		this.fetchCountryCodeFromGeoposition(geolocation).done(deferred.resolve.bind(deferred),this.handleGeolocationError.bind(this,deferred));
	},
	fetchCountryCodeFromGeoposition: function (geolocation) {
		var latitude = geolocation.coords.latitude,
			longitude = geolocation.coords.longitude;
		return this.requestText("http://ws.geonames.org/countryCode?lat="+latitude+"&lng="+longitude+"&username=chris@bodar.com");
	},
	handleGeolocationError: function (deferred,error) {
		deferred.reject(error)
	}
}

function GeoLocator2() {
}
GeoLocator2.prototype = {
	requestText: function (url,resolve,reject,progress) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET",url);
		xhr.setRequestHeader("Access-Control-Allow-Origin","*")
		xhr.onabort = xhr.onerror = xhr.ontimeout = reject||function(){};
		xhr.onload = function () {
			if (this.status>199 && this.status <300) {
				resolve(this.responseText)
			} else {
				reject(new Error("Server Error - "+this.status))
			}
		}
		xhr.send();
	},
	fetchCoordinates: function () {
		return Q.Promise(this.coordinateResolver.bind(this))
	},
	coordinateResolver: function (resolve,reject,notify) {
		navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true})
	},
	fetchCountryCode: function () {
		var promise = new Q.Promise(
				(function (foo,resolve,reject,progress) {
					this.fetchCoordinates().done(function (geolocation) {
						var promise = foo.fetchCountryCodeFromGeoposition(geolocation)
						promise.done(resolve,reject,progress)

				})}).bind(this,this)
			);
		return promise;
	},
	countryCodeResolver: function (coordinatePromise,geolocation,resolve,reject,progress) {
		var countryCode = this.fetchCountryCodeFromGeoposition.bind(this,geolocation);
			coordinatePromise.done(countryCode)
	},
	fetchCountryCodeFromGeoposition: function (geolocation) {
		return Q.Promise(this.requestText.bind(this,"http://ws.geonames.org/countryCode?lat="+geolocation.coords.latitude+"&lng="+geolocation.coords.longitude+"&username=chris@bodar.com"));
	}
}


/*
function QLite() {}
QLite.Promise = function (resolver) {
	if (!(this instanceof QLite.Promise)) {
		return new QLite.Promise(resolver)
	}
	this._resolver = resolver;
}
QLite.Promise.prototype = {
	_resolvers: null,
	_rejectors: null,
	_progressors: null,
	_fulfilled: false,
	_pending: true,
	_rejected: false,
	_value: void 0,
	_collection: function (value) {
		return this[value ]|| (this[value] = []);
	}
	then: function (resolve,reject,progress) {
		resolve && this._collection("_resolvers").push(resolve);
		reject && this._collection("_rejectors").push(reject);
		progress && this._collection("_progressors").push(progress);
	},
	done: function () {
		this.then.apply(this,arguments);
	},
	fail: function () {

	}
}*/
