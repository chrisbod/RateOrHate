function CineworldResultsConverter() {

}
CineworldResultsConverter.prototype = {
	convertResults: function (data) {
		this.filmHash = {};
		this.films = []
		data.forEach(this.generateFilm,this)
		delete this.filmHash;
		return results;
	},
	mapFilmResults: function (film) {
		return {
		id: film.id,
		name: this.mapTitle(film),
		links: [
			{
				provider: "cineworld",
				html: film.film_url,
				image: film.still_url
			}
		]
	}
	},
	generateFilm: function (film) {
		if (this.filmHash[film.id]) {//already got this film
			this.filmHash[film.id].addFormat(film)
		} else {
			this.films.push(this.filmHash[film.id] = new this.Film(film))
		}
	},
	Film: function (film) {
		this.film = film;
		this.addFormat(film);
	}

}
CineworldResultsConverter.prototype.Film.prototype = {
	is3D: '',
	isIMAX: '',
	addFormat: function (film) {
		if (film.is3D) {
			this.is3D = true
		}
		if (film.isIMAX) {
			this.isIMAX = true
		}
		if (!film.is3D && !film.isIMAX) {
			this.is2D = true
		}
		this.classification = film.classification;
		return this;
	},
	getSubtitle: function () {
		var formats = [];
		if (this.is2D) {
			formats.push("2D")
		}
		if (this.is3D) {
			formats.push("3D")
		}
		if (this.isIMAX) {
			formats.push("IMAX")
		}
		return this.classification||'?' + ' - '+formats.join("/");
	},
	toJSON: function () {
		return {
			id: this.film.id,
			name: [this.film.title.replace(/^([\w]+\s)?\dD\s*-\s*)/,""),this.getSubtitle()],
			links: [
				{
					provider: "cineworld",
					html: this.film.film_url,
					image: this.film.still_url
				}
			]
		}
	}
}

/*
{
            "edi": 132909,
            "title": "2D - Penguins of Madagascar",
            "id": 7095,
            "classification": "U",
            "advisory": "",
            "poster_url": "http://www.cineworld.co.uk/assets/media/films/7095_poster.jpg",
            "film_url": "http://www.cineworld.co.uk/whatson/penguins-of-madagascar",
            "still_url": "http://www.cineworld.co.uk/assets/media/films/7095_still.jpg",
            "3D": false,
            "imax": false
        }

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

*/