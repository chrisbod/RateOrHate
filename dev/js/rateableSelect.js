(function (success, fail) {
	var deferred = Q.defer(),
		prototype = deferred.promise.constructor.prototype;
	prototype.success = success;
	prototype.fail = fail;


})(
	function (func) {
		return this.then(func);
	},
	function (func) {
		return this.catch(func);
	}

)


var rateableSelect = angular.module('rateableSelect', []).config(['$locationProvider', function($locationProvider) {
         $locationProvider.html5Mode({
  enabled: true,
  requireBase: false
});
    }]);;

rateableSelect.controller('RateableSelectCtrl', function ($scope,$rootScope,rateablesService) {
	$scope.legend = "RATE OR HATE";
	$scope.loadState = "loading";
	$scope.rateable = null;
	$scope.rateables = null;
	$scope.rootRateable = null;
	rateablesService.getRateables().success(
		function (rateable) {
			$scope.loadState = "loaded";
    		$scope.rateables = rateable.rateables;
    		$scope.rateable = rateable;
    		$scope.rootRateable = rateable;
		}
	);
	$rootScope.$on("rateable.change", function (event,rateable) {
		$scope.rateable = rateable;

		$scope.rateables = rateable.rateables||$scope.rateables;
		$scope.parentRateable = rateable||getParent(rateable)
	})
	$rootScope.$on("rateable.up", function (event,rateable) {
		var parent = getParent(rateable);
		if (parent.rateables == $scope.rateables) {//att the bottom level
			parent = getParent(parent);
		}
		$rootScope.$broadcast("rateable.change",parent);
	})

	function getParent(rateable) {
		var path = rateable.path.split('/'),
			root = $scope.rootRateable,
			currentRateable = root;
		path.pop();
		while (currentRateable.rateables && path.length) {
			var currentId = path.pop();
			for (var i=0,rateables=currentRateable.rateables;i!=rateables.length;i++) {
				if (rateables[i].id== currentId) {
					currentRateable = rateables[i];
					break;
				}
			}
		}
		return currentRateable;
	}
  $scope.changeRateable = function (rateable) {
  	$rootScope.$broadcast("rateable.change",rateable)
  }
});


rateableSelect.controller('RateableSearchCtrl', function ($scope,$rootScope) {
	$rootScope.$on("rateable.change", function (event,rateable) {
		$scope.rateable = rateable;
		$scope.search();
	});
	$scope.searchTerm = "";
	$scope.search = function () {
		//if (this.searchTerm) {
			$rootScope.$broadcast('rateable.search', {
				searchTerm: this.searchTerm,
				rateable: $scope.$parent.rateable
			})
		//}
	}
	$scope.parent = function () {
  		$rootScope.$broadcast("rateable.up",$scope.rateable)
  }
});


rateableSelect.controller('RateableSearchResultsCtrl', function ($scope,$rootScope,rateablesSearchService) {
	var currentSearchTerm,
		currentPromise;
	$scope.loadState = "empty";
	$scope.selectedId = null;
	$rootScope.$on("rateable.change", function () {
		$scope.loadState = "empty";
		$scope.details = null;
		$scope.results = null;
		currentSearchTerm = void 0;
		currentPromise = void 0;

	});
	$rootScope.$on("rateable.search", function (event,details) {
		if (details.searchTerm !== currentSearchTerm) {
			currentSearchTerm = details.searchTerm;
			$scope.loadState = "loading"
			$scope.details = details;
			$scope.results = null;
			currentPromise = rateablesSearchService.search(details);
			currentPromise.success(function (data) {
				currentPromise = void 0;
				if (data.results.length) {
					$scope.loadState = "loaded"
				} else {
					$scope.loadState = "loaded empty"
				}
				$scope.providers = data.providers;
				$scope.results = data.results;
					if (!$scope.$$phase) {//imported results have not been hashed
						$scope.$apply()
					}
				if (data.results.length) $scope.rate(data.results[0])
				});
			}
	})
	$scope.rate = function (result) {
		$scope.selectedId = result.id;
		$rootScope.$broadcast('rateable.select',result)
	}
});

rateableSelect.controller('RateableViewCtrl', function ($scope,$rootScope,rateableDetailsService) {
	$scope.loadState = "";
	$scope.details = null;
	$scope.tracklist = null;
	$rootScope.$on("rateable.change", function () {
		$scope.loadState = "empty";
		$scope.details = null;
		$scope.summary = null;
		$scope.tracklist = null;
		
	});
	$rootScope.$on("rateable.select", function (event, rateable) {	
		$scope.summary = rateable;
		$scope.fetchRatings();
		$scope.fetchTracklist();
	})
	$scope.fetchRatings = function () {
		$scope.loadState = "loading";
		rateableDetailsService.fetchRatings($scope.summary).success(
			function (details) {
				$scope.details = details;
				$scope.loadState = "loaded";
				if (!$scope.$$phase) {//imported results have not been hashed
						$scope.$apply()
					}
			}
		)
		
	}
	$scope.fetchTracklist = function () {
		$scope.loadState = "loading";
		rateableDetailsService.fetchTracklist($scope.summary).success(
			function (tracklist) {
				$scope.tracklist = tracklist;
				$scope.loadState = "loaded";
				if (!$scope.$$phase) {//imported results have not been hashed
						$scope.$apply()
					}
			}
		)
	}
	$scope.rate = function () {
		alert('you rate'+this.summary.name)
	}
	$scope.hate = function () {
		alert('you hate'+this.summary.name)
	}

});
rateableSelect.directive('loadState', function () {
	return {
		link: function ($scope,$element,$attributes) {
			$element.scope().$watch("loadState", function (newValue) {
				$element[0].setAttribute('load-state',newValue)

			})
		}


	}
	

})
rateableSelect.directive('jcHighlight', function () {

	return {//PointerHighlight is global
		link: PointerHighlight.directiveLink()
	};
})
rateableSelect.directive('jcStyle', function () {
	function updateStyle(element,value) {
		var values = value.split(/\s*;\s*/);
			values.forEach(function(value) {
				var split = value.split(/\s*\:\s*/);
				if (split.length>2) {
					split = [split.shift(),split.join(':')]
				}
				if (!/%%%%/.test(split[1])) {
					element.style.setProperty(split[0],split[1]);
				}
			});
	}
	return {//PointerHighlight is global
		link: function ($scope, $element, $attributes) {
			$scope.$watch($attributes.jcStyle,function (value){
				updateStyle($element[0],value);
			});

		}
	};
})

rateableSelect.factory('rateablesService', function ($http) {
	function buildPaths(rateable,path) {
		path = rateable.path = path||rateable.id;
		if (rateable.rateables) {
			rateable.rateables.forEach(function (rateable) {
				buildPaths(rateable,path+'/'+rateable.id)
			})
		}
	}
	var rateablesService = {
		rateables: [],
		getRateables: function () {
			return $http.get('json/rateables.json').success(function(data) {
				rateablesService.rateables = buildPaths(data);
		  	});
		}
	}
	return rateablesService;
});


rateableSelect.factory('rateablesSearchService', function ($http) {
	//need to cancel multiple requests...
	var rateablesSearchService = {
		results: [],
		
		search: function (searchDetails) {
			var rateableId = searchDetails.rateable.id;



			if (searchDetails.rateable.type == "place") {
					var promise = new PseudoPromise();	
					new PlacesService().request(searchDetails).done(function(data) {
							promise.resolve(data);
					});
					return promise;


			}
			switch (rateableId) {
				case "music": {
					var promise = new PseudoPromise();
					new ITunesRequestService().request(function (data) {
						promise.resolve(data);
					},"music",searchDetails.searchTerm);
					return promise;
				}
				default: {
					return $http.get('json/searchResults.json?searchTerm='+searchDetails.searchTerm+'&rateable='+searchDetails.rateable.id).success(function(data) {
							rateablesSearchService.results = data;
					});

				}

			}
		}
	}
	return rateablesSearchService;
});

rateableSelect.factory('rateableDetailsService', function () {
	var detailsService = new ITunesDetailsService(),
		tracklistService = new ITunesTracklistService()
	var rateableDetailsService = {
		details: {},
		tracklist: {},
		fetchRatings: function (rateable) {

			var promise = new PseudoPromise();
			promise.success(function (data) {
				detailsService.details = data;
			})
			detailsService.fetch(
			function (data) {
				promise.resolve(data)
			},rateable.id);
			return promise;
		},
		fetchTracklist: function (rateable) {

			var promise = new PseudoPromise();
			promise.success(function (data) {
				tracklistService.tracklist = data;
			})
			tracklistService.fetch(
			function (data) {
				promise.resolve(data)
			},rateable.id);
			return promise;
		}
	}
	return rateableDetailsService;
});













