var express = require('express')
var app = express();
var nano = require('nano')('https://rateorhate.iriscouch.com');
var itunes = nano.use('search')


app.get("/", function(request,response) {

	itunes.insert({ crazy: true }, 'Music/Foo/Noo', function(err, body, header) {
      if (err) {
        console.log('[alice.insert] ', err.message);
        return;
      }
      console.log('you have inserted the rabbit.')
      console.log(body);
      response.send("ook")
    });
    
  });



app.listen(4000, function () {
	console.log("Server up on 4000")

});