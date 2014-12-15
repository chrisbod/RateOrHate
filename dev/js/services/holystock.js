function HolystockService() {
	this.stockService = new DataService();
	this.birthdayService = new DataService();
	this.adapter = new HolystockAdapter();
}

HolystockService.prototype = {
	request: function () {
		var adapter = this.adapter;
		var holystocks = Q.defer(),
			holyBirthdays = Q.defer();
		Q.allSettled([holystocks.promise,holyBirthdays.promise]).spread(function (stocks,birthdays) {
				console.log(adapter.adaptAll(stocks.value,birthdays.value).length);
			});
		this.stockService.request("http://www.hollystock.com/developers/export/JSON?limit=50", holystocks)
		this.birthdayService.request("http://www.hollystock.com/developers/birthdays/JSON?limit=50", holyBirthdays)
	}
}

function HolystockAdapter() {

}
HolystockAdapter.prototype = {
	adaptHolystocks: function (data) {
		return data.BonusBucks.concat(data.CelebrityValues).map(
			this.adaptCelebrity, this
		)
	},
	adaptBirthdays: function (data) {
		return data.Birthdays.map(this.adaptCelebrity, this)
	},
	adaptCelebrity: function (celebrity) {
		var id = celebrity.celebId;
		return  {
			id: id,
			name: [celebrity.name,celebrity.age ? celebrity.age + 'today!' : ''],
			image: "http://www.hollystock.com/images/celebs/full/"+id+".jpg",
			html: "http://www.hollystock.com/celebrity/"+id,
			price: celebrity.price
		};

	},
	adaptAll: function (stocks, birthdays) {
		var adaptedStocks = this.adaptHolystocks(stocks),
			adaptedBirthdays = this.adaptBirthdays(birthdays);
		return this.uniquify(adaptedStocks.concat(adaptedBirthdays));
	},
	uniquify: function (celebrities) {
		var celebsById = {};

		return celebrities.filter(
			function (value) {
				if (value.price) {
					var id = value.name;
					if (celebsById[id]) {
						celebs.name = value.name;
						return false;
					} else {
						celebsById[id] = 1;
						return true;
					}
				}
			}
		,
		this).sort(function (a,b) {
			return a.price-b.price;
		});

	}

}

var holystock = new HolystockService()
holystock.request();








