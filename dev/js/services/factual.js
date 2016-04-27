function FactualService() {
	this.service = new DataService();
	this.adapter = new FactualAdapter();
}
FactualService.prototype = {
	request: function (country,postalArea) {
		var results = Q.defer(),
			adaptedResults = Q.defer(),
			adapter = this.adapter;

		results.promise.done(function (results) {
			adaptedResults.resolve(adapter.adapt(results));
		});
		this.service.request("http://localhost:8080/factual/"+country.toLowerCase()+"/"+postalArea,results);
		return adaptedResults.promise;
	}
}

function FactualAdapter() {

}
FactualAdapter.prototype = {
	adapt: function (data) {
		var cuisines = {},
			results = [];
		data.data.forEach(function (result) {
			if (result.cuisine) {
				result.cuisine.forEach(function (cuisine) {
					var resultCuisines = cuisines[cuisine.toLowerCase()] || (cuisines[cuisine.toLowerCase()] = []);
					resultCuisines.push(result)
				});
			}
		});
		Object.keys(cuisines).forEach(function (key) {
			results.push({cuisine:key,results:cuisines[key]})
		});
		results.sort(function (a,b) {
			return b.results.length - a.results.length;
		})
		return results;
	}
}