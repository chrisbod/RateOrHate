var express = require('express')
var app = express();
var bodyParser = require('body-parser'),
	querystring = require('querystring'),
	itunes = require('./data/itunes.music.json')
	ITunesService = require('./services/music.itunes.js')



/*
var hash = {}

function flattenIt(obj,output) {
	if ("name" in obj) {
		if (!hash[obj.id]) {
			hash[obj.id] = true;
			output[querystring.escape(obj.name.replace(/(\s*&\s*)|(\s*\/\s*)/g,'_and_').replace(/\s+/g,'_').replace(/:/g,'_-'))] = +obj.id;
		} else {
			throw ("dupe "+obj.id)
		} 
	}
	if ("subgenres" in  obj) {
		for (var i in obj.subgenres)
		flattenIt(obj.subgenres[i],output);
	}
}

var flatItunes = {};
flattenIt(itunes,flatItunes)*/

function logit(request,response) {
	response.send({
		base: request.baseUrl,
		path: request.path,
		orig: request.originalUrl

	});
}

function music(request,response,category,path) {
	//if (!path.length)
	var service = new ITunesService(),
		term = request.query.term;
	service.request(function (data) {
		response.json(data)

	},category,term )


	//callback,category,term,limit
	

}

app.get('/static/*', function (req, res) {
    res.sendfile(__dirname + '/static/' + req.params[0]);
});

app.get(/^\/Search\/Music/, function (request,response) {
	var paths = request.path.split('/').filter(function (value) {
		return value;
	}),
		genre = paths[1] || "Music",
		id = itunes[genre];
	if (typeof id == "number") {
		music(request,response,id,paths.slice(1))
	} else {
		response.sendStatus(404)
	}
});




app.route(/^\/api\/music\/(.*)$/).get(
	logit
);

app.listen(3000, function () {
	console.log("Server up on 3000")

});
