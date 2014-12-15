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
				html: result.collectionViewUrl,
				preview: result.previewUrl,
				image: result.artworkUrl100.replace('100x100','200x200')
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

function ITunesDetailsService() {

}
ITunesDetailsService.prototype = {
	fetch: function (callback,id) {
		callback({
			rates: [34,66],
			social: [12,20]
		})
	}

}

function ITunesTracklistService() {}
	ITunesTracklistService.prototype = {

		fetch: function (callback,id) {
		callback(
		[
		{trackName: "foo",trackPreview:"asdasdasdasd.m4a"},
		{trackName: "foo",trackPreview:"asdasdasdasd.m4a"}
		]


);}
}

function PseudoPromise() {
	this.callbacks =[];
}
PseudoPromise.prototype = {
	success: function (callback) {
		if (this.resolved) {
			callback(this.data);
		} else {
			this.callbacks.push(callback);
		}
		return this;
	},
	resolve: function (data) {
		if (this.resolved) {
			throw "Promise Error"
		}
		this.resolved = true;
		this.data = data;
		this.callbacks.forEach(function (value) {
			value(data);
		})
		this.callbacks.length = 0;
		return this;
	}
} 



/*{
 "resultCount":13,
 "results": [
{"wrapperType":"collection", "collectionType":"Album", "artistId":211192870, "collectionId":211192863, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "collectionCensoredName":"Let's Fly With Mary Poppins", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/lets-fly-with-mary-poppins/id211192863?uo=4", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "collectionExplicitness":"notExplicit", "trackCount":12, "copyright":"℗ 1965 Buena Vista Records", "country":"USA", "currency":"USD", "releaseDate":"2007-01-16T08:00:00Z", "primaryGenreName":"Jazz"}, 
{"wrapperType":"track", "kind":"song", "artistId":550748, "collectionId":211192863, "trackId":211192865, "artistName":"Louis Prima", "collectionName":"Let's Fly With Mary Poppins", "trackName":"A Spoonful of Sugar", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"A Spoonful of Sugar", "collectionArtistId":211192870, "collectionArtistName":"Louis Prima & Gia Maione", "collectionArtistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "artistViewUrl":"https://itunes.apple.com/us/artist/louis-prima/id550748?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/a-spoonful-of-sugar/id211192863?i=211192865&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/a-spoonful-of-sugar/id211192863?i=211192865&uo=4", "previewUrl":"http://a1431.phobos.apple.com/us/r1000/083/Music/3f/15/e0/mzm.hcwsgoec.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":1, "trackTimeMillis":118960, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192865"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192868, "artistName":"Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Feed the Birds", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Feed the Birds", "collectionArtistName":"Louis Prima & Gia Maione", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/feed-the-birds/id211192863?i=211192868&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/feed-the-birds/id211192863?i=211192868&uo=4", "previewUrl":"http://a1352.phobos.apple.com/us/r1000/066/Music/d0/ec/dd/mzm.kmwvapfs.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":2, "trackTimeMillis":198427, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192868"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192874, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"The Perfect Nanny", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"The Perfect Nanny (Duet Version)", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/perfect-nanny-duet-version/id211192863?i=211192874&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/perfect-nanny-duet-version/id211192863?i=211192874&uo=4", "previewUrl":"http://a439.phobos.apple.com/us/r1000/078/Music/fc/d5/d3/mzm.xxcmxerc.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":3, "trackTimeMillis":145347, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192874"}, 
{"wrapperType":"track", "kind":"song", "artistId":550748, "collectionId":211192863, "trackId":211192878, "artistName":"Louis Prima", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Chim Chim Cher-ee", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Chim Chim Cher-ee", "collectionArtistId":211192870, "collectionArtistName":"Louis Prima & Gia Maione", "collectionArtistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "artistViewUrl":"https://itunes.apple.com/us/artist/louis-prima/id550748?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/chim-chim-cher-ee/id211192863?i=211192878&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/chim-chim-cher-ee/id211192863?i=211192878&uo=4", "previewUrl":"http://a821.phobos.apple.com/us/r1000/110/Music/8d/bd/5d/mzm.ekqkwplx.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":4, "trackTimeMillis":164840, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192878"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192881, "artistName":"Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Sister Suffragette", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Sister Suffragette", "collectionArtistName":"Louis Prima & Gia Maione", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/sister-suffragette/id211192863?i=211192881&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/sister-suffragette/id211192863?i=211192881&uo=4", "previewUrl":"http://a1315.phobos.apple.com/us/r1000/087/Music/66/31/45/mzm.nauhzfua.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":5, "trackTimeMillis":110213, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192881"}, 
{"wrapperType":"track", "kind":"song", "artistId":550748, "collectionId":211192863, "trackId":211192884, "artistName":"Louis Prima", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Stiamo Svegli", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Stiamo Svegli (Dub Version)", "collectionArtistId":211192870, "collectionArtistName":"Louis Prima & Gia Maione", "collectionArtistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "artistViewUrl":"https://itunes.apple.com/us/artist/louis-prima/id550748?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/stiamo-svegli-dub-version/id211192863?i=211192884&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/stiamo-svegli-dub-version/id211192863?i=211192884&uo=4", "previewUrl":"http://a868.phobos.apple.com/us/r1000/083/Music/3b/fc/e8/mzm.svlcxjzs.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":0.99, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":6, "trackTimeMillis":138453, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192884"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192887, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Jolly Holiday", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Jolly Holiday (Duet Version)", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/jolly-holiday-duet-version/id211192863?i=211192887&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/jolly-holiday-duet-version/id211192863?i=211192887&uo=4", "previewUrl":"http://a136.phobos.apple.com/us/r1000/105/Music/b2/6e/39/mzm.umlnjofw.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":7, "trackTimeMillis":123840, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192887"}, 
{"wrapperType":"track", "kind":"song", "artistId":550748, "collectionId":211192863, "trackId":211192891, "artistName":"Louis Prima", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Stay Awake", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Stay Awake", "collectionArtistId":211192870, "collectionArtistName":"Louis Prima & Gia Maione", "collectionArtistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "artistViewUrl":"https://itunes.apple.com/us/artist/louis-prima/id550748?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/stay-awake/id211192863?i=211192891&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/stay-awake/id211192863?i=211192891&uo=4", "previewUrl":"http://a1391.phobos.apple.com/us/r1000/104/Music/51/f3/49/mzm.yfestvgo.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":8, "trackTimeMillis":142360, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192891"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192894, "artistName":"Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Let's Go Fly a Kite", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Let's Go Fly a Kite", "collectionArtistName":"Louis Prima & Gia Maione", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/lets-go-fly-a-kite/id211192863?i=211192894&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/lets-go-fly-a-kite/id211192863?i=211192894&uo=4", "previewUrl":"http://a1526.phobos.apple.com/us/r1000/116/Music/9c/f3/73/mzm.qkgnvkjd.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":0.99, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":9, "trackTimeMillis":138880, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192894"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192897, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Supercalifragilisticexpialidocious", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Supercalifragilisticexpialidocious (Duet Version)", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/supercalifragilisticexpialidocious/id211192863?i=211192897&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/supercalifragilisticexpialidocious/id211192863?i=211192897&uo=4", "previewUrl":"http://a962.phobos.apple.com/us/r1000/073/Music/62/cd/f9/mzm.ojzzphem.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":10, "trackTimeMillis":115933, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192897"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192901, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"I Love to Laugh", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"I Love to Laugh (Duet Version)", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/i-love-to-laugh-duet-version/id211192863?i=211192901&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/i-love-to-laugh-duet-version/id211192863?i=211192901&uo=4", "previewUrl":"http://a1346.phobos.apple.com/us/r1000/114/Music/2f/65/4e/mzm.bwsbcffz.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":1.29, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":11, "trackTimeMillis":129987, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192901"}, 
{"wrapperType":"track", "kind":"song", "artistId":211192870, "collectionId":211192863, "trackId":211192905, "artistName":"Louis Prima & Gia Maione", "collectionName":"Let's Fly With Mary Poppins", "trackName":"Supercalifragilistic-espiralidoso", "collectionCensoredName":"Let's Fly With Mary Poppins", "trackCensoredName":"Supercalifragilistic-espiralidoso (Dub Version)", "artistViewUrl":"https://itunes.apple.com/us/artist/gia-maione/id211192870?uo=4", "collectionViewUrl":"https://itunes.apple.com/us/album/supercalifragilistic-espiralidoso/id211192863?i=211192905&uo=4", "trackViewUrl":"https://itunes.apple.com/us/album/supercalifragilistic-espiralidoso/id211192863?i=211192905&uo=4", "previewUrl":"http://a642.phobos.apple.com/us/r1000/064/Music/d2/a6/5f/mzm.vzxijkgf.aac.p.m4a", "artworkUrl30":"http://a4.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.30x30-50.jpg", "artworkUrl60":"http://a3.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.60x60-50.jpg", "artworkUrl100":"http://a1.mzstatic.com/us/r30/Music/21/58/3e/dj.bxwywnxk.100x100-75.jpg", "collectionPrice":9.99, "trackPrice":0.99, "releaseDate":"2007-01-16T08:00:00Z", "collectionExplicitness":"notExplicit", "trackExplicitness":"notExplicit", "discCount":1, "discNumber":1, "trackCount":12, "trackNumber":12, "trackTimeMillis":121933, "country":"USA", "currency":"USD", "primaryGenreName":"Jazz", "radioStationUrl":"https://itunes.apple.com/station/idra.211192905"}]
}
*/