function PlacesService() {
	var container = document.createElement("div"),
		mapContainer = document.createElement("div");
	container.appendChild(mapContainer);
	this.service = new google.maps.places.PlacesService(container);
	this.adapter = new GooglePlacesAdapter();
	
	this.geoLocator.addEventListener("change",this);
	this.serviceCache = new ServiceCache();
}
PlacesService.prototype = {
	parallel: false,
	geoLocator:  new GeoLocator(),
	request: function (searchDetails) {
		if (!this.parallel && this.activeState) {
			this.activeState.deferred.reject(new Error("Request Expired"));
		}
		var state = {
			deferred: Q.defer(),
			search: searchDetails,
			id: searchDetails.rateable.google+":"+searchDetails.rateable.id
		};
		this.activeState = state;
		this.geoLocator.requestLocation().done(this.searchNearby.bind(this,state));
		return state.deferred.promise;
	},
	searchNearby: function (state,location) {
		if (this.isStateActive(state)) {
			var results = this.serviceCache.get(state.id);
			if (!results) {
				this.service.nearbySearch(
					{
					    location: new google.maps.LatLng(location.coords.latitude, location.coords.longitude),
					    radius: '1000',
					    types: [state.search.rateable.google]
					}, this.handleResults.bind(this,state)
				)
			} else {
				state.deferred.resolve(results)
			}
		}
	},
	handleResults: function (state,results,status) {
		delete this.activeState;
		if (status == "OK" && this.isStateActive(state)) {
			this.serviceCache.set(state.id,results)
			state.deferred.resolve(this.adapter.adapt(results));
		} else {
			state.deferred.reject(new Error(status));
		}
	},
	isStateActive: function (state) {
		return !state.deferred.promise.isRejected()
	},
	handleEvent: function (event) {
		this.serviceCache.clear();
	}
}
/*window.onerror = function () {
	if (arguments[4]) {
		console.log(arguments[4].stack)
	} else {
		console.log(arguments)
	}
	return true
}*/

function GooglePlacesAdapter() {

}

GooglePlacesAdapter.prototype = {
 adapt: function (results) {
 	console.log(results)
 	return {
 		providers: [{
 			id: "google",
 			url: "http://google.com"
 		}],
 		results: results.map(this.adaptPlace,this)
 	}
 },
 adaptPlace: function (place) {
		var adaptedPlace = {
				id: place.place_id,
				title: place.name,
				subtitle: place.vicinity,
				attribution: place.html_attributions.join('<br.>'),
				html: "https://www.google.co.uk/search?q=%22"+encodeURI(place.name.replace(/(\W+|\s+)/g,'+'))+"%22+restaurant+"+encodeURI(place.vicinity.replace(/(\W+|\s+)/g,'+'))+"&btnI"
		}
		if (place.photos && place.photos.length) {
			adaptedPlace.image = place.photos[0].getUrl({maxWidth:400,maxHeight:400})
		}
		return adaptedPlace;
	}
}

function ServiceCache() {
	this.cache = {
		keys: {},
		items: []
	};
}
ServiceCache.prototype = {
	defaultCacheTime: 1000*60*60,//1 hour
	maxCacheSize: 100,
	set: function (id,results,time) {
		var deferred = Q.defer(),
			cache = this.cache,
			keys = cache.keys,
			items = cache.items,
			cachedItem = keys[id],
			newCachedItem = {
				id: id,
				results: results,
				expiryTimeout: setTimeout(this.expire.bind(this,newCachedItem),time||this.defaultCacheTime),
				expiryTime: time || this.defaultCacheTime
			}
		if (cachedItem) {
			this.remove(cachedItem)
		}
		items.push(newCachedItem);
		keys[id] = newCachedItem;
		
		deferred.resolve(results);
		return deferred.promise;
	},
	expire: function (item) {
		var items = this.cache.items,
			id = item.id;
		items.splice(items.indexOf(item),1);
		delete this.keys[id];
	},
	get: function (id,renewExpiryTime) {
		var item = this.cache.keys[id];
		if (item) {
			if (renewExpiryTime) {
				if (typeof renewExpiryTime == "boolean") {
					renewExpiryTime = item.expiryTime;
				}
				clearTimeout(item.expiryTimeout);
				item.expiryTimeout = setTimeout(this.expire.bind(this,item),renewExpiryTime);
			}
			return item;
		}
		return null;
	},
	clear: function () {
		this.cache.items = [];
		this.cache.keys = {};
	}

}