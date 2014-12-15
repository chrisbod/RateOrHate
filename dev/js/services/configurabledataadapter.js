function ConfigurableDataAdapter(config) {
	this.config = config;
}
ConfigurableDataAdapter.prototype = {
	adapter: null,
	config: null,
	getAdapter: function () {
		if (this.adapter) {
			return this.adapter;
		} else {
			return this.adapter = this.buildAdapter(this.config)
		}
	},
	buildAdapter: function (config) {
		var funcs = [];
		for (var i in config) {
			switch (typeof config[i]) {
				case "string": {
					funcs.push("newObj['"+i+"'] = " + config[i]);
					break;
				}
				case 'object': {

				}
			}
			
		}
		return {
			adapt: this.baseAdapter
			converter: new Function(funcs.join(';'),"newObj","o")
		}
	},
	adapt: function (data) {
		return this.getAdapter().adapt(data);
	},
	baseAdapter: function (object) {
		if (object instanceof Array) {
			return object.map(
				function (value, key, array) {
					var newObj = {};
					this.converter(newObj,value);
					return newObj
				}, this);
		} else {
			var newObj = {};
			this.converter(newObj,object)
			return newObj;
		}
	}
}




	[{
		"zoo:moo": "foo",
		"ogg:bogg" : [
			"dogg",
			"zogg"
		],
		"objy:wobjy": {
			"dobjy": "gook",
			"lobjy": "ook"
		},
		"goff:poff": "UGLY - bug"

	},

	{
		name: "foo",
		funky: "dogg - zogg",
		image: "gook",
		noodle: "ook",
		toodle: "bug",
		summit: "foo zogg"
	},


	{
		name: "o['zoo:moo']",
		funky: "o['ogg:bog'][0] + ' - ' + o['ogg:bog'][1]",
		image: "o['objy:wobjy'].dobjy",
		noodle: "o['objy:wobjy'].lobjy",
		toodle: "o['goff:poff'].replace(/UGLY\\s*-\\s*/,'')",
		summit: "o['zoo:moo']+o['ogg:bogg'][1]",
		provider: "itunes",
		obj: "{zoo:1}"
	}]
