var rateableSelect = angular.module('rateableSelect', []).config(['$locationProvider', function($locationProvider) {
         $locationProvider.html5Mode({
  enabled: true,
  requireBase: false
});
    }]);;

rateableSelect.controller('RateableSelectCtrl', function ($scope,$rootScope,rateablesService) {
	$scope.legend = "RATE OR HATE";
	$scope.loadState = "loading";
	rateablesService.getRateables().success(
		function (rateables) {
			$scope.loadState = "loaded";

    		$scope.rateables = rateables;
		}
	);
	$rootScope.$on("rateable.change", function (event,rateable) {
		$scope.rateable = rateable
	})
  $scope.changeRateable = function (rateable) {
  	$rootScope.$broadcast("rateable.change",rateable)
  }
});


rateableSelect.controller('RateableSearchCtrl', function ($scope,$rootScope) {
	$rootScope.$on("rateable.change", function (event,rateable) {
		$scope.rateable = rateable
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
	$scope.changeRateable = function (rateable) {
  		$rootScope.$broadcast("rateable.change",null)
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
		if (details.searchTerm != currentSearchTerm) {
			currentSearchTerm = details.searchTerm;
			$scope.loadState = "loading"
			$scope.details = details;
			$scope.results = null;
			if (details.searchTerm) {
				currentPromise = rateablesSearchService.search(details);
				currentPromise.success(function (data) {
					currentPromise = void 0;
					if (data.results.length) {
						$scope.loadState = "loaded"
					} else {
						$scope.loadState = "loaded empty"
					}
					
					$scope.results = data.results;
					if (!$scope.$$phase) {//imported results have not been hashed
						$scope.$apply()
					}
				});
			}
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
	var rateablesService = {
		rateables: [],
		getRateables: function () {
			return $http.get('json/rateables.json').success(function(data) {
				data.forEach(function (value) {
				value.className = value.id.toLowerCase().replace(/\W/g,'_');
			})
				rateablesService.rateables = data;
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
			if (searchDetails.rateable.id == "music") {

				var promise = new PseudoPromise();
				new ITunesRequestService().request(function (data) {
					promise.resolve(data);
				},"music",searchDetails.searchTerm);
				return promise;
			} else {
				return $http.get('json/searchResults.json?searchTerm='+searchDetails.searchTerm+'&rateable='+searchDetails.rateable.id).success(function(data) {
					rateablesSearchService.results = data;
		  		});
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












