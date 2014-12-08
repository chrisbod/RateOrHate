var XMLHttpRequest = require('xhr2');
function ITunesResultsConverter() {

}
ITunesResultsConverter.prototype = {

	convertFeed: function (data) {
		var output = {
			results: data.feed.entry.map(this.mapFeedEntry,this)
		}
		return output;
	},
	mapFeedEntry: function (entry) {
		return {
			id: entry.id.attributes["im:id"],
			name: [entry["im:name"].label,entry["im:artist"].label],
			links: [{
				provider: "itunes",
				html: (entry.link[0]||entry.link).attributes.href,
				image: entry["im:image"][1].label/*,
	
				preview: entry.link[1].attributes.href*/
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
			id: result.collectionId,
			name: [result.trackName||result.collectionName,result.artistName],
			links: [{
				provider: "itunes",
				html: result.trackViewUrl,
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
	converter: new ITunesResultsConverter(),
	request: function (callback,category,term,limit) {
		if (term) {
			return this.search(callback,category,term,limit||this.limit)
		} else {
			return this.feed(callback,category,limit||this.limit)
		}
	},
	search: function (callback,category,term,limit) {
		var url = "https://itunes.apple.com/search?wrapperType=collection&country=gb&media=music&entity=album&term="+encodeURI(term)+"&limit="+limit+'&&genreId='+category;
		this.http(url,this.handleSearchResults.bind(this,callback),this.httpError.bind(this,url))
	},
	handleSearchResults: function (callback,results) {
		callback(this.converter.convertSearch(results));
	},
	feed: function (callback,category,limit) {
		var url = "https://itunes.apple.com/gb/rss/topalbums/limit="+limit+"/genre="+category+"/json";
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
			//this.open("GET","data:,");
			//this.send()
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
		//xhr.open("GET","data:,");
		//xhr.send();
	}
}

module.exports = ITunesRequestService;
