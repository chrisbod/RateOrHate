
function GeoLocator(significantDistance) {
	if (significantDistance) {
		this.significantDistance = significantDistance;
	}
	this.listeners = {
		error: [],
		change: []
	};
	var deferred = Q.defer()
	this.locationPromise = deferred.promise;
	this.locationPromise.then(this.setLocation.bind(this));
	this.watchId = navigator.geolocation.watchPosition(this.updateLocation.bind(this,deferred),this.locationError.bind(this,null),{maximumAge:0,enableHighAccuracy:true,timeout:this.maxWait});
}
GeoLocator.prototype = {
	originalLocation: null,
	accuracy: 30,//30 meters (tends to be the best a laptop browser can do)
	updateWait: 5000,
	maxWait: 10000,
	locationError: function (deferred,error) {
		if (deferred) {
			deferred.reject(error)
		}
		this.dispatchEvent({
			type: "error",
			error: error
		})
	},
	updateLocation: function (deferred,location) {
		
		this.dispatchEvent({type:"change",details: {
			newLocation: location,
			oldLocation: this.location
		}})
		if (this.location!=location) {
			this.setLocation(location);
		}
		if (!deferred.promise.isFulfilled()) {
			deferred.resolve(location);
		}
	},
	setLocation: function (location) {
		
		this.location = location;
	},
	setCountryCode: function (code) {
		this.countryCode = code;
	},
	requestLocation: function () {

		var deferred = Q.defer();
		//if (this.location) {
			//deferred.resolve(this.location);
		//} else {
			this.locationPromise.done(deferred.resolve.bind(deferred));
		//}
		return deferred.promise;
	},
	requestCountryCode: function () {
		var countryCodeDeferred = Q.defer();
		if (this.countryCode) {
			countryCodeDeferred.resolve(this.countryCode);
		} else {
			this.requestLocation().done(this.resolveCountryCode.bind(this,countryCodeDeferred),this.locationError.bind(this,countryCodeDeferred))
		}
		return countryCodeDeferred.promise;
	},
	resolveCountryCode: function (deferred,geolocation) {
		this.requestCountryCodeFromGeoposition(geolocation).done(deferred.resolve.bind(deferred),this.locationError.bind(this,deferred));
	},
	requestCountryCodeFromGeoposition: function (geolocation) {
		var latitude = geolocation.coords.latitude,
			longitude = geolocation.coords.longitude;
		return this.requestText("http://ws.geonames.org/countryCode?lat="+latitude+"&lng="+longitude+"&username=chris@bodar.com");
	},
	requestText: function (url) {
		var deferred = Q.defer(),
			xhr = new XMLHttpRequest(),
			reject = deferred.reject.bind(deferred),
			geo = this
		deferred.promise.then(function (code) {
			geo.setCountryCode(code)
		});
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
	requestPostalCodeArea: function () {
		var deferred = Q.defer()
		this.requestLocation().done(this.resolvePostalCodeArea.bind(this,deferred))
		return deferred.promise
	},
	resolvePostalCodeArea: function (deferred,geolocation) {

		this.maps.then((function (maps) {
			new maps.Geocoder().geocode({location:{lat:geolocation.coords.latitude,lng:geolocation.coords.longitude}}, this.inferPostalCodeArea.bind(this,deferred))
		}).bind(this))
	},
	inferPostalCodeArea: function (deferred,googleResults) {
		var postalCode;
		googleResults[0].address_components.some(function (component) {
			if (component.types.indexOf("postal_code") != -1) {
				postalCode = component.long_name;
				return true;
			}
		});
		//this needs to be come a Promise chain getting the country code and trasnslating the postcode#
		deferred.resolve(postalCode.split(' ')[0])
	},
	getListenersForEventType: function (type) {
		var listeners = this.listeners[type];
		if (!listeners) {
			throw new Error("GeoLocator: event:"+type+" not supported");
		}
		return listeners;
	},
	addEventListener: function (type,listener) {
		var listeners = this.getListenersForEventType(type);
		if (listeners.indexOf(listener) == -1) {
			listeners.push(listener);
			return true;
		}
		return false;
	},
	removeEventListener: function (type,listener) {
		var listeners = this.getListenersForEventType(type),
			index = listeners.indexOf(listener);
		if (index == -1) {
			return false;
		}
		listeners.splice(index,1);
		return true;
	},
	dispatchEvent: function (event) {
		var listeners = this.getListenersForEventType(event.type);
		listeners.forEach(function (value) {
			if (typeof value == "object") {
				value.handleEvent(event)
			} else {
				value(event)
			}
		})
	}

}
GeoLocator.prototype.maps = new Promise(function (resolve,reject) {
	if (google && google.maps) {
		google.maps.event.addDomListener(window, 'load', resolve(google.maps))
	} else {
		reject(new Error("Google Maps API not loaded"))
	}
});



	/*


		calculateDistanceBetweenLocations: function (lat1, lon1, lat2, lon2)) {
	  var Math = window.Math,
	  	  PI2 = Math.PI/180,
	  	  a = 
	     0.5 - Math.cos((lat2 - lat1) * PI2)/2 + 
	     Math.cos(lat1 * PI2) * Math.cos(lat2 * PI2) * 
	     (1 - Math.cos((lon2 - lon1) * PI2))/2;

	  return 12742 * Math.asin(Math.sqrt(a));
	},
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



	fetchAccurateLocation: function (accuracy,updateWait,maxWait) {
		var deferred = Q.defer(),
			state = {
				desiredAccuracy: (accuracy||this.accuracy),
				currentAccuracy: Number.POSITIVE_INFINITY,
				deferred: deferred,
				updateWait:updateWait||this.updateWait,
				maxWait: maxWait || this.maxWait
			};
		state.watchId = navigator.geolocation.watchPosition(this.watchLocation.bind(this,state),this.locationError.bind(this,state),{maximumAge:0,enableHighAccuracy:true,timeout:maxWait||this.maxWait})
		return deferred.promise;
	},
	watchLocation: function (state,location) {
		var accuracy = location.coords.accuracy;
		clearTimeout(state.updateWaitId);
		state.location = location;
		if (state.currentAccuracy == Number.POSITIVE_INFINITY) {//first attempt
			state.currentAccuracy = accuracy;
			state.maxWaitId = setTimeout(this.maxWaitLocation.bind(this,state),state.maxWait);
		} else if (accuracy<=state.desiredAccuracy) {
			clearTimeout(state.maxWaitId);
			state.deferred.resolve(location);
			return;
		}
		state.updateWaitId = setTimeout(this.updateWaitLocation.bind(this,state),state.updateWait);
	},
	updateWaitLocation: function (state) {
		clearTimeout(state.maxWaitId);
		state.deferred.resolve(state.location)
	},
	maxWaitLocation: function (state) {
		navigator.geolocation.clearWatch(state.watchId);
		state.deferred.resolve(state.location)
	},
	locationError: function (state,error) {
		state.deferred.reject(error)
	},
	fetchNextLocation: function (state) {
		this.fetchLocation().done(this.checkLocationAccuracy.bind(this,config));
	},
	checkLocationAccuracy: function (state,location) {
		var accuracy = location.coords.accuracy;
		if (accuracy<=config.desiredAccuracy || accuracy == config.currentAccuracy || Date.now()>=config.resolveAt) {
			config.deferred.resolve(location);
		} else {
			config.currentAccuracy = accuracy;
			setTimeout(this.fetchNextLocation.bind(this,config), config.interval)
		}
	},
	fetchLocation: function () {
		var deferred = Q.defer();
		navigator.geolocation.getCurrentPosition(deferred.resolve.bind(deferred),this.handleGeolocationError.bind(this,deferred),{enableHighAccuracy:false,maximumAge:60000})
		return deferred.promise;
	},
	fetchCountryCode: function () {
		var countryCodeDeferred = Q.defer();
		this.fetchLocation().done(this.resolveCountryCode.bind(this,countryCodeDeferred),this.handleGeolocationError.bind(this,countryCodeDeferred))
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
	}*/

