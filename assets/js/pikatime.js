var util = require("./util");

/**************************/
/* Create a time selector */
/**************************/
Pikatime = function(inputElement, options) {
   this.options = util.extend({
      color:      "white",   // The color of the text
      background: "black",   // The background color of the canvas
      highlight:  "#8dae28", // The color of the highlight when something is selected
      face:       "12"       // The clock face to show
   }, options);

   this.state = {
      hour: 12,  // The currently selected hour
      minute: 0, // The currently selected minute
   };

   util.registerGetTimeHandler(function() {
      return this.state;
   }.bind(this));

   // Build the dom of the selector
   this.inputElement = inputElement;
   this.initDom();

   // Setup the canvas
   var canvas    = this.canvas;
   this.ctx      = canvas.getContext("2d");
   canvas.height = 325;
   canvas.width  = 250;

   // Initialize the clock face
   this.clockFace = require("./faces/" + this.options.face + "/face.js")(this.ctx, this.options);

   // Handle time changes
   util.on("hourChange", function(newHour) {
      this.state.hour = newHour;
   }.bind(this));

   util.on("minuteChange", function(newMinute) {
      this.state.minute = newMinute;
   }.bind(this));

   this.render();
};

/****************************/
/* Render the clock control */
/****************************/
Pikatime.prototype.render = function() {
   if (this.containerElement.style.display === "block") {
      this.ctx.fillStyle = this.options.background;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.clockFace.render(this.state);
   }

   window.requestAnimationFrame(this.render.bind(this));
};

/********************************************************************************/
/* Creates all the dom nodes needed for the time control (including the canvas) */
/********************************************************************************/
Pikatime.prototype.initDom = function() {
   var container       = document.createElement("div");
   var canvas          = document.createElement("canvas");
   var buttonContainer = document.createElement("div");
   var cancelButton    = document.createElement("button");
   var okButton        = document.createElement("button");

   // Build the tree
   container      .appendChild(canvas);
   container      .appendChild(buttonContainer);
   buttonContainer.appendChild(cancelButton);
   buttonContainer.appendChild(okButton);

   // Set the attributes
   container   .setAttribute("class", "pikatime-container");
   okButton    .setAttribute("tabindex", "-1");
   cancelButton.setAttribute("tabindex", "-1");
   okButton    .innerText = "OK";
   cancelButton.innerText = "Cancel";

   // Attach event listeners
   okButton         .addEventListener("click", this.save.bind(this));
   cancelButton     .addEventListener("click", this.hide.bind(this));
   this.inputElement.addEventListener("focus", this.show.bind(this));
   this.inputElement.addEventListener("blur",  this.handleBlur.bind(this));
   canvas           .addEventListener("click", function(evt) {this.interacted = true;}.bind(this));

   // Store references
   this.canvas           = canvas;
   this.containerElement = container;

   // Insert hidden container into the dom
   this.containerElement.style.display = "none";
   document.body.appendChild(this.containerElement);
};

/********************/
/* Show the control */
/********************/
Pikatime.prototype.show = function() {
   // Update the state with the input field's current values
   var time = /([0-9]+)(:)([0-9]+)/.exec(this.inputElement.value);   
   if (time) {
      this.state.hour   = parseInt(time[1], 10);
      this.state.minute = parseInt(time[3], 10);
   } else {
      this.state.hour   = 12;
      this.state.minute = 0;
   }

   // Display container
   this.containerElement.style.display = "block";

   // Get container coordinates for position calculation
   var inputMetrics     = this.inputElement.getBoundingClientRect();
   var contianerMetrics = this.containerElement.getBoundingClientRect();

   // Position the container element horizontally
   if (inputMetrics.right + contianerMetrics.width - 12 < window.innerWidth) {
      this.containerElement.style.left = inputMetrics.right + 12 + "px";
   } else {
      this.containerElement.style.left = window.innerWidth - 24 - contianerMetrics.width + "px";
   }

   // Position the container element vertically
   var top = (inputMetrics.top + inputMetrics.height / 2) - (contianerMetrics.height / 2);
   if (top < 50) top = 50;
   this.containerElement.style.top = top + "px";

   // Set control state and trigger open event
   this.interacted = false;
   util.trigger("controlOpen");
};

/********************/
/* Hide the control */
/********************/
Pikatime.prototype.hide = function() {
   this.containerElement.style.display = "none";
};

/****************************************/
/* Handle the blur of the input element */
/****************************************/
Pikatime.prototype.handleBlur = function() {
   setTimeout(function() {
      if (this.interacted === false) {
        this.hide();
      }
   }.bind(this), 200);
};

/*****************************************************/
/* Save the state of the picker to the input element */
/*****************************************************/
Pikatime.prototype.save = function() {
   this.inputElement.value = util.padString(this.state.hour, 2) + ":" + util.padString(this.state.minute, 2);
   this.hide();
};


/***********************************************/
/* If jQuery exists, add pickatime as a plugin */
/***********************************************/
if (typeof jQuery !== "undefined") {
   (function($) {
      $.fn.pikatime = function() {
         return this.each(function() {
            $this = $(this);

            if ($this.data("pikatime")) {
               return $this.data("pikatime");
            } else {
               $this.data("pikatime", new Pikatime(this, {
                  face: $this.attr("data-mode")
               }));
               return $this.data("pikatime");
            }
         });
      }
   }(jQuery));
}
