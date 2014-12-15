if (typeof XMLHttpRequest == "undefined") {//not in a browser
	var XMLHttpRequest = require("xhr2");
} else {
	if (!("responseType" in XMLHttpRequest.prototype)) {
		(function (get) {
			var proto = XMLHttpRequest.prototype;
			if (Object.defineProperty) {
				Object.defineProperty(proto,"response",get)
			} else {
				proto.__defineGetter__("reponse", get);
			}
		})(function get() {
			if (this.responseType != "json") {
				throw (new Error("Unsupported response object"))
			}
			try {
				return JSON.parse(this.responseText);
			} catch (e) {
				return null;
			}
		});
	}
}
function DataService() {
}
DataService.prototype = {
	defaultHeaders: [
		["Access-Control-Allow-Origin","*"],
		["Accept", "application/json"]
	],
	headers: [],
	timeout: 0,
	setHeaders: function (xhr) {
		this.headers.concat(this.defaultHeaders).forEach(function (value) {
			xhr.setRequestHeader(value[0],value[1])
		});
	},
	getHttpRequest: function () {
		if (!this.httpRequest) {
			this.httpRequest = new XMLHttpRequest();
			return this.httpRequest;
		}
		return this.httpRequest;
	},
	defer: function () {
		return Q.defer();
	},
	getDeferred: function (successCallbackOrDeferred,failureCallback, progressCallback) {
		var deferred
		if (typeof successCallbackOrDeferred=="function") {//callbacks
			deferred = this.defer();
			deferred.promise.done(successCallbackOrDeferred, failureCallback,progressCallback);
		} else {
			deferred = successCallbackOrDeferred;
		}
		return deferred;
	},
	request: function (url,successCallbackOrDeferred,failureCallback, progressCallback) {
		var deferred = this.getDeferred(successCallbackOrDeferred,failureCallback||function () {
			//no failure callback provided
		}, progressCallback),
		xhr = this.getHttpRequest();
		if (xhr.readyState != 0) {//cleans up if we
			xhr.abort();
		}
		xhr.timeout = this.timeout;
		xhr.open("GET",url);
		this.setHeaders(xhr);
		xhr.responseType = "json";
		xhr.onload = this.onload.bind(this,deferred,url);
		xhr.onabort = xhr.onerror = this.onfail.bind(this,deferred,url);
		xhr.onreadystatechange = function (){};
		xhr.onprogress = this.onprogress.bind(this,deferred,url);
		try {
			xhr.send();
		} catch (error) {
			this.onerror(deferred,url);
		}
	},
	isValidResponse: function (request,event) {
		var response = request.response,
			invalidResponse = response === null && event.total != 4;
		return (!invalidResponse && (request.status>199 && request.status <300) || (response && request.status == 0 && request.statusText == ""));
		return false;
	},
	createError: function (url,event) {
		return new this.Error(url,this.getHttpRequest(),event)
	},
	onload: function (deferred,url,event) {
		var request = this.getHttpRequest(),
			response = request.response;
		if (this.isValidResponse(request,event)) {
			this.clear();
			deferred.resolve(response);
		} else {
			this.onfail(deferred,url,event)
		}
		
	},
	onprogress: function (deferred,uri,event) {
		deferred.notify(event);
	},
	onfail: function (deferred,url,event) {
			deferred.reject(this.createError(url,event))
		this.clear();
	},
	clear: function () {
		var xhr = this.getHttpRequest();
		xhr.onerror = xhr.onload = xhr.ontimeout = xhr.onabort = xhr.onprogress = null;
		xhr.open("GET","data:,");
		xhr.send();
	}
};
(function (DataServiceError,prototypeProperties) {
	DataService.prototype.Error = DataServiceError;
	DataServiceError.prototype = new Error("");
	DataServiceError.prototype.constructor = DataServiceError;
	var prototype = DataServiceError.prototype;
	for (var property in prototypeProperties) {
		prototype[property] = prototypeProperties[property]
	}
})(
	function DataServiceError (url,xhr,event) {
		this.url = url;
		this.status = xhr.status;
		this.statusText = xhr.statusText;
		this.message = xhr.status + " - " + xhr.statusText||"No status provided";
		this.type = event.type;
		this.event = event;
		this.headers = xhr.getAllResponseHeaders();
		this.mimeType = this.getMimeType();
		this.validMimeType = this.getMimeType() == "application/json";
	},
	{
		headers: "",
		status: -1,
		statusText: "",
		type: "",
		event: null,
		mimeType: "",
		validMimeType: null,
		name: "DataServiceError",
		getResponseHeader: function (headerName) {
			var matches = this.headers.match(new RegExp("^"+headerName+":(.*)$","mi"));
			if (matches) {
				return matches[1]||""
			} else {
				return "";
			}
		},
		getAllResponseHeaders: function () {
			return this.headers;
		},
		getMimeType: function () {
			return this.getResponseHeader("Content-Type").split(';')[0].trim()||"";
		},
		resolveUrl: function () {
			var anchor = document.createElement("a");
			anchor.setAttribute("href",this.url);
			return anchor.href;
		}
	}
)








