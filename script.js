/*
* Author : Rahul Gupta
* 
* This is the Main JavaScript File for Weather App 
* Contains ngRoute, factory, and Controller for the application
* Refrence: OpenWeatherMap.org examples for consuming Map and ideas from Matthias Lienau on GitHub
*
* Contact rgupta0621@gmail.com for further information
*/


/*
Initializing Angular App
*/
var weatherApp = angular.module('weatherApp', ['ngResource', 'ngRoute']);
weatherApp.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'weather.html',
      controller: 'weatherController'
    })
    .when('/moreInfo/:location', {
      templateUrl: 'moreInfo.html',
      controller: 'moreInfoController'
    })	
});


/*
Controller for weather.html page
*/
weatherApp.controller('weatherController',['$rootScope', '$scope', '$window', 'weatherService', '$location', function ($rootScope, $scope, $window, weatherService, $location) {
	$scope.iconSrcURL = "http://openweathermap.org/img/w/";
	$scope.search = false;
	$scope.locationKeyword = "";
	$scope.location = "Normal";
    $scope.getWeather = function () {
		$scope.locationKeyword  = $scope.location;
		$rootScope.loc = $scope.location;
        weatherService.get({ q: $scope.location }, function (response) {
			$scope.sys = response.sys;
            $scope.basicWeatherInfo = response.weather[0];
			$scope.temperature = response.main;
			$scope.date = response.dt;
			$scope.search = true;
			console.log(response);
        });
    }
	
	if(angular.isUndefined($rootScope.firstLoad)) {
		$rootScope.firstLoad = true;
		$scope.getWeather();
	}
	
	if(!angular.isUndefined($rootScope.loc)) {
		$scope.locationKeyword  = $rootScope.loc;
		$scope.location = $rootScope.loc;
        weatherService.get({ q: $scope.locationKeyword }, function (response) {
			$scope.sys = response.sys;
            $scope.basicWeatherInfo = response.weather[0];
			$scope.temperature = response.main;
			$scope.date = response.dt;
			$scope.search = true;
			console.log(response);
        });
	}
	
	$scope.clearWeatherDetails = function() {
		$scope.search = false;
		$rootScope.alreadyInFavourites = false;
		$rootScope.emptyLocation = false;
	}
	if(angular.isUndefined($rootScope.favourites)) {
		$rootScope.favourites = [];
	}
	$rootScope.alreadyInFavourites = false;
	$scope.addToFavourites = function() {
		if($rootScope.favourites.indexOf($scope.locationKeyword) == -1)
			$rootScope.favourites.push($scope.locationKeyword);
		else
			$rootScope.alreadyInFavourites = true;
	}
	
	$scope.removeFromFavourites = function(index) {
		$rootScope.alreadyInFavourites = false;
		$rootScope.favourites.splice(index, 1);
	}
	
	$scope.loadFavouritesDetails = function(index) {
		$scope.locationKeyword = $rootScope.favourites[index];
		$scope.location = $rootScope.favourites[index];
		$rootScope.loc = $rootScope.favourites[index];
		weatherService.get({ q: $rootScope.favourites[index] }, function (response) {
            $scope.basicWeatherInfo = response.weather[0];
			$scope.temperature = response.main;
			$scope.date = response.dt;
			$scope.search = true;
			console.log(response);
        });
	}
	$scope.viewMoreInfo = function() {
		if($scope.location == "") {
			$rootScope.emptyLocation = true;
		}
		else {
			$rootScope.emptyLocation = false;
			$location.path("/moreInfo/"+$scope.location);
		}
	}
}]);

/*
Controller for moreInfo.html page
*/
weatherApp.controller('moreInfoController',['$rootScope', '$scope', '$window', '$routeParams', '$route', 'forecastService', 'historicDataService', function ($rootScope, $scope, $window, $routeParams, $route, forecastService, historicDataService) {
	$scope.iconSrcURL = "http://openweathermap.org/img/w/";
	$scope.locationKeyword = $routeParams.location;
	$scope.noForecastInfo = false;
	$rootScope.lon = 0;
	$rootScope.lat = 0;
	forecastService.get({ q: $scope.locationKeyword }, function (response) {
		if(response.cnt == 0)
			$scope.noForecastInfo = true;
		else {
			$scope.noForecastInfo = false;
			$scope.forecastInfo = response;
			$rootScope.lon = response.city.coord.lon;
			$rootScope.lat = response.city.coord.lat;
			console.log($scope.forecastInfo);
			$scope.loadCloudMap($rootScope.lon, $rootScope.lat);
		}
    });
	$scope.noHistoricData = false;
	historicDataService.get({ q: $scope.locationKeyword }, function (response) {
		if(response.cnt == 0)
			$scope.noHistoricData = true;
		else {
			$scope.noHistoricData = false;
			$scope.historicData = response;
			console.log(response);
		}
    });
	
	$scope.loadCloudMap = function(lon, lat) {
		var lonlat = new OpenLayers.LonLat(lon, lat);
		lonlat.transform(
			new OpenLayers.Projection("EPSG:4326"),
			new OpenLayers.Projection("EPSG:900913")
		);
		var map = new OpenLayers.Map("basicMap");
		var mapnik = new OpenLayers.Layer.OSM();
		var layer_cloud = new OpenLayers.Layer.XYZ(
			"clouds",
			"http://${s}.tile.openweathermap.org/map/clouds/${z}/${x}/${y}.png",
			{
				isBaseLayer: false,
				opacity: 1,
				sphericalMercator: true
			}
		);
		map.addLayers([mapnik, layer_cloud]);
		map.addControl(new OpenLayers.Control.LayerSwitcher()); 
		map.setCenter( lonlat, 11);
	}
}]);

/*
Factory for Current Weather Service API
*/
weatherApp.factory('weatherService', function ($resource) {
	var apiKey = '0d273cf68b0210bf17a759c6d3ef24f2';
	var apiBaseUrl = 'http://api.openweathermap.org/data/2.5/weather';
    return $resource(apiBaseUrl,
        {callback: 'JSON_CALLBACK', key: apiKey},
        { get: { method: 'JSONP' }
        });
});

/*
Factory Service for Forecast API
*/
weatherApp.factory('forecastService', function ($resource) {
	var apiKey = '0d273cf68b0210bf17a759c6d3ef24f2';
	var apiBaseUrl = 'http://api.openweathermap.org/data/2.5/forecast/daily';
    return $resource(apiBaseUrl,
        {callback: 'JSON_CALLBACK', key: apiKey},
        { get: { method: 'JSONP' }
        });
});

/*
Factory Service for Historic Data API
*/
weatherApp.factory('historicDataService', function ($resource) {
	var apiKey = '0d273cf68b0210bf17a759c6d3ef24f2';
	var apiBaseUrl = 'http://api.openweathermap.org/data/2.5/history/city';
    return $resource(apiBaseUrl,
        {callback: 'JSON_CALLBACK', key: apiKey},
        { get: { method: 'JSONP' }
        });
});


/*
Filter for Date formatting
*/
weatherApp.filter('dateFilter', function() {
	return function (input) {
		var date = new Date(input*1000);
		var dayOfWeek = getDayOfWeek(date.getDay());
		var month = getMonth(date.getMonth()+1);
		var d = date.getDate();
		var year = date.getFullYear();
		var hours = date.getHours();
		var mins = date.getMinutes();
		return (dayOfWeek + ", " + month +" " + d + ", " + year);
	}
});

/*
Filter for Month of Week
*/
function getDayOfWeek(day) {
	switch(day) {
		case 0 : return "Sunday";
		case 1 : return "Monday";
		case 2 : return "Tuesday";
		case 3 : return "Wednesday";
		case 4 : return "Thursday";
		case 5 : return "Friday";
		case 6 : return "Saturday";
	}
}

/*
Filter for Month
*/
function getMonth(month) {
	switch(month) {
		case 1: return "January";
		case 2: return "February";
		case 3: return "March";
		case 4: return "April";
		case 5: return "May";
		case 6: return "June";
		case 7: return "July";
		case 8: return "August";
		case 9: return "September";
		case 10: return "October";
		case 11: return "November";
		case 12: return "December";
	}
}