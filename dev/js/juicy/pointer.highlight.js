(function (PointerHighlight,prototype, directiveLink) {
    PointerHighlight.prototype = prototype;
    prototype.constructor = PointerHighlight;
    if ("ontouchstart" in window) {
      prototype.touch = true;
      prototype.downEvent = "touchstart";
      prototype.upEvent = "touchend";
      prototype.eventsToKill = ["mousedown","mousemove","mouseup"];
      prototype.moveEvent = "touchmove"
    } else {
      prototype.touch = false;
      prototype.downEvent  = "mousedown";
      prototype.eventsToKill = [];
      prototype.moveEvent = "mousemove";
      prototype.upEvent = "mouseup"
    }
    PointerHighlight.directiveLink = directiveLink;
    ("exports" in this ? exports : this).PointerHighlight = PointerHighlight
    
  })(
  function PointerHighlight(element,dontKillEvents) {
    if (element) {
      this.element = element
    }
    if (!dontKillEvents) {
      this.eventsToKill = [];
    }
  },
  {
    eventsToWatch: null,
    eventsToKill: null,
    killEvents: true,
    element: window,
    flickSpeed: 200,//pixels per second
    minSwipeDistance: 20,
    className: "pointer-highlight",
    selector: "button,label,input,textarea,a[href],*[tabindex]",
    activate: function pointerHighlight_activate() {
      if (this.killEvents) {
        this.eventsToKill.forEach(function (killEvent) {
          this.element.addEventListener(killEvent,this.killEvent,true);
        }, this);
      }
      this.element.addEventListener(this.downEvent,this,true);
      
    },
    deactivate: function pointerHighlight_deactivate() {
      this.eventsToKill.forEach(function (killEvent) {
        this.element.removeEventListener(killEvent,this.killEvent,true);
      }, this);
     this.element.removeEventListener(this.downEvent,this,true);
      this.releasePointer(this.moveEvent);
    },
    destroy: function pointerHighlight_destroy() {
      this.deactivate();
      delete this.element;
    },
    handleEvent: function pointerHighlight_(event) {
      return this[event.type](event);
    },
    killEvent: function pointerHighlight_(event) {
      event.preventDefault()
      event.stopPropagation();
      event.stopImmediatePropagation() && event.stopImmediatePropagation();
      event.preventDefault();
      return false;
    },
    getMonitorElement: function pointerHighlight_(element) {

      var selector = this.selector;
      while (element && element!=document) {

        if (element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
      }
    },
    trackPointer: function pointerHighlight_monitorPointer(event,moveEventName,endEventName) {
      var currentTarget = this.getMonitorElement(event.target)
      if (currentTarget) {
        this.currentTarget = currentTarget;
        this.classList = currentTarget.classList;
        window.addEventListener(moveEventName,this,true);
        window.addEventListener(endEventName,this,true);
        currentTarget.classList.add(this.className);
        this.startEvent = event;
      }
    },
    checkFlick: function (endEvent) {
      var math = Math,
          startEvent = this.startEvent,
          startX = startEvent.pageX,
          startY = startEvent.pageY,
          time = (endEvent.timeStamp-startEvent.timeStamp)/1000,
          endX = endEvent.pageX,
          endY = endEvent.pageY,
          distanceX = (endX-startX),
          distanceY = startY-endY,
          distance = math.sqrt((distanceX*distanceX)+(distanceY*distanceY)),
          velocity = distance/time;//pixels per second
        if (velocity>this.flickSpeed && distance>this.minSwipeDistance) {
          this.currentTarget.dispatchEvent(new CustomEvent("juicy.flick",{detail:{velocity:velocity,distance:distance,angle:math.atan2(distanceY, distanceX)*180/Math.PI,startEvent:startEvent,endEvent:endEvent}}));
        }
    },
    releasePointer: function pointerHighlight_releasePointer(moveEventName,endEventName) {
      window.removeEventListener(moveEventName,this,true);
      window.removeEventListener(endEventName,this,true);
      delete this.currentTarget;
      delete this.classList;
    },
    touchstart: function pointerHighlight_touchstart(event) {
      this.trackPointer(event,"touchmove","touchend");
    },
    touchend: function pointerHighlight_touchend(event) {
      if (this.currentTarget) {
        this.classList.remove(this.className);
        this.releasePointer("touchmove","touchend");
      }

      
    },
    touchmove: function pointerHighlight_touchmove(event) {
      if (!this.isInsideElement(this.currentTarget,event.touches[0].pageX, event.touches[0].pageY)) {
        this.classList.remove(this.className);
        this.checkFlick(event)
      } else {
        this.classList.add(this.className);
      }
    },
    mousedown: function pointerHighlight_mousedown(event) {
      if (event.button === 0) {
        this.trackPointer(event,"mousemove","mouseup")
      }
    },
    mousemove: function pointerHighlight_mousemove(event) {
      if (!this.isInsideElement(this.currentTarget,event.pageX, event.pageY)) {
        this.classList.remove(this.className);
        this.checkFlick(event);
      } else {
        this.classList.add(this.className);
      }
    },
    mouseup: function pointerHighlight_mouseup(event) {
      if (this.currentTarget && event.button === 0) {
        this.classList.remove(this.className);
        this.checkFlick(event)
        this.releasePointer("mousemove","mouseup");  
      }
    },
    isInsideElement: function pointerHighlight_isInsideElement(element,x,y) {
      for ( var i=0,rects = element.getClientRects(), rect;rect = rects[i]; i++) {
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return true;
        }
      }
      return false;
    }
  },
  function PointerHighlight_directiveLink(config) {
    return function pointerHighlight_ngLink($scope,$element) {
      var pointerHighlight = new PointerHighlight($element[0],$element[0].getAttribute("jc-highlight")=="no-kill");
      if (config) {
        for (var prop in config) {
          pointerHighlight[prop] = config[prop];
        }
      }
      $element.on('$destroy', function () {
        pointerHighlight.destroy();
        pointerHighlighter = null;
      });
      pointerHighlight.activate();
    }
  }
);

window.addEventListener("juicy.flick",function (event) {
    clearTimeout(event.target.timeout)
    event.target.timeout = setTimeout(function () {
      event.target.classList.remove("flick")
    },5000);
    event.target.classList.add("flick");
  
    
},true)
