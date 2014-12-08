function JuicyScrollEvents(element) {
	if (element) {
	this.element = element;
	}
}
JuicyScrollEvents.prototype = {
	element: this,
	activate: function () {
		this.deactivate();
		this.element.addEventListener("scroll", this, true);
	},
	deactivate: function () {
		this.element.removeEventListener("scroll", this, true);
	},
	handleEvent: function (event) {
		if (event.target == document) {
			target = document.documentElement;
		} 
		var scrollTop = document.body.scrollTop,
			scrollLeft = document.body.scrollLeft,
			scrollHeight = document.body.scrollHeight,
			scrollWidth = document.body.scrollWidth,
			clientHeight = document.documentElement.clientHeight,
			clientWidth = document.documentElement.clientWidth;
		/*if (scrollTop == 0 || scrollLeft == 0 || clientHeight+scrollTop == scrollHeight || clientWidth+scrollLeft == scrollWidth ) {
				console.log("end")
		}*/
	}

}