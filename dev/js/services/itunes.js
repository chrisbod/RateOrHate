//simple itunes http serci
function ITunesResultsConverter() {

}
ITunesResultsConverter.prototype = {
	hash: {
		count: 0
	},
	convertFeed: function (data) {
		var output = {
			results: data.feed.entry.map(this.mapFeedEntry,this)
		}
		return output;
	},
	mapFeedEntry: function (entry) {
		return {
			id: "itunesSong:"+this.hash.count++,
			name: [entry["im:name"].label,entry["im:artist"].label],
			meta: [entry.category.attributes.label],
			links: [{
				provider: "itunes",
				html: entry.link[0].attributes.href,
				image: entry["im:image"][1].label,
	
				preview: entry.link[1].attributes.href
			}



			]

		}
	},
	convertSearch: function (data) {
		var output = {
			results: data.results.map(this.mapSearchResults,this)
		}
		return output
	},
	mapSearchResults: function (result) {
		return {
			id: "itunesSong:"+this.hash.count++,
			name: [result.trackName||result.collectionName,result.artistName],
			meta: [result.primaryGenreName],
			links: [{
				provider: "itunes",
				html: result.trackViewUrl,
				preview: result.previewUrl,
				image: result.artworkUrl60
			}

			]
		}

	}
}

function ITunesRequestService(){
	this.httpRequest = new XMLHttpRequest();
}
ITunesRequestService.prototype = {
	limit: 50,
	categoryToFeed: {
		"music" : "topsongs"
	},
	converter: new ITunesResultsConverter(),
	request: function (callback,category,term,limit) {
		if (term) {
			return this.search(callback,category,term,limit||this.limit)
		} else {
			return this.feed(callback,category,limit||this.limit)
		}
	},
	search: function (callback,category,term,limit) {
		var url = "https://itunes.apple.com/search?wrapperType=collection&country=gb&media=music&entity=album&term="+encodeURI(term)+"&limit="+limit;
		this.http(url,this.handleSearchResults.bind(this,callback),this.httpError.bind(this,url))
	},
	handleSearchResults: function (callback,results) {
		callback(this.converter.convertSearch(results));
	},
	feed: function (callback,category,limit) {
		var feed = this.categoryToFeed[category],
			url = "https://itunes.apple.com/gb/rss/topsongs/limit="+limit+"/json"
		this.http(url,this.handleFeedResults.bind(this,callback),this.httpError.bind(this,url))
	},
	handleFeedResults: function (callback,results) {
		callback(this.converter.convertFeed(results));
	},
	http: function (url,success,failure) {
		var xhr = this.httpRequest;
		xhr.open("GET",url);
		xhr.setRequestHeader("Access-Control-Allow-Origin","*");
		xhr.responseType = "json";
		xhr.overrideMimeType("application/json");
		xhr.onload = function () {
			var response = this.response;
			this.onload = this.onerror = null;
			this.open("GET","data:,");
			this.send()
			success(response)
		}
		try {
			xhr.send()
		} catch (e) {
			failure(xhr)
		}
	},
	httpError: function (url,xhr) {
		xhr.onload = this.onerror = null;
		xhr.open("GET","data:,");
		xhr.send();
	}
}
