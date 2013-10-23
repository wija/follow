//Controls.js

//need to get date handling under control

//queryTemplate is actually still global (ps)


function Controls(queryTemplate, country) {

	this.queryTemplate = queryTemplate;

	document.getElementById("countryName").innerHTML = country.replace(/_/g, ' ');
	
	makeCheckBoxes("selectIncidentType", "EVENT_TYPE");

	//has devolved into magic numbers at this point
	//currently duplicated in Controls.js
	this.dimensions = { width: window.innerWidth - 400, height: 40 };  //height=40 was for rendering each separately
	this.padding = { outerPaddingWidth: 5, placenameWidth: 70, innerPaddingWidth: 5,
   				   outerPaddingHeight: 2, labelHeight: 10, tickToLabelHeight: 3, tickHeight: 5, 
   				   axisToIncidentsHeight: 5 };
	this.corners = { xTimelineLeft: this.padding.outerPaddingWidth + this.padding.placenameWidth + this.padding.innerPaddingWidth,
   				   xTimelineRight: this.dimensions.width - this.padding.outerPaddingWidth,
   				   yTimelineTop: this.padding.outerPaddingHeight,
   				   yTimelineBottom: this.dimensions.height - (this.padding.outerPaddingHeight + this.padding.labelHeight + this.padding.tickToLabelHeight + this.padding.tickHeight) };

	var selectorScale = d3.time.scale().range([this.corners.xTimelineLeft - this.padding.placenameWidth, this.corners.xTimelineRight - this.padding.placenameWidth -  this.padding.placenameWidth]),
		selectorAxis = d3.svg.axis().scale(selectorScale).orient("bottom");
	selectorScale.domain([dateFormat.parse("1/1/1997"), dateFormat.parse("2/28/2013")]);

	this.brush = d3.svg.brush()
			  		.x(selectorScale)
			  		.extent([dateFormat.parse("1/1/2011"), dateFormat.parse("1/1/2012")]);

	this.context = d3.select("#dateSelector").append("svg")
		//.attr("width", this.dimensions.width - 100)
		.attr("height", 40);

	this.context.append("rect")
		  .classed("selectBox", true)
	      .attr("x", this.corners.xTimelineLeft - this.padding.placenameWidth)
	      .attr("width", this.corners.xTimelineRight - this.corners.xTimelineLeft - this.padding.placenameWidth)
	      .attr("y", 0) 
	      .attr("height", 20);
	     
	this.context.append("g")
	      .attr("class", "axis")
	      .attr("transform", "translate(0," + 20 + ")")
	      .style("font-size", this.padding.labelHeight)
	      .style("font-family", "sans-serif")
	      .call(selectorAxis);

	this.context.append("g")
	      .attr("class", "x brush")
	      .call(this.brush)
	    .selectAll("rect")
	      .attr("y", 1)
	      .attr("height", 18);

	document.getElementById("dateSelector").style.width = this.corners.xTimelineRight - this.corners.xTimelineLeft - this.padding.placenameWidth + 10;

	//not really so great that this calls dataset by name
	function makeCheckBoxes(idName, fieldName) {
		var s = document.getElementById(idName);
		var opts = dataset.indexRegistry[fieldName].getValues().sort();
		var htmlStr = "";
		for(var i = 0; i < opts.length; i++) {
			htmlStr += '<label class="checkbox">'
						+ '<input type="checkbox" data-value="' + opts[i] + '">'
						+ '<svg width="10" height="10">'
						+ '<circle cx="5" cy="5" r="5" fill="' + p.getColor(opts[i]) + '"/>' 
						+ '</svg> '
						+ opts[i]
						+ '</label>';

		}

		s.innerHTML = htmlStr;
		//A dangerous little hack; figure out how bootstrap does checkboxes
		$('input[type="checkbox"]').prop('checked', true);
	}
}

Controls.prototype.destruct = function() {
	//is this necessary? and what about the d3 brush listener?
	document.getElementById("selectIncidentType").removeEventListener("change", this.selectIncidentTypeListener);
	document.getElementById("fatalitySizing").removeEventListener("click", this.fatalitySizingListener);
	document.getElementById("inputDescription").removeEventListener("keyup", this.inputDescriptionListener);
	this.context.remove();
	document.getElementById("inputDescription").value= '';
}

Controls.prototype.attachEventHandlers = function() {

	var self = this;
	this.selectIncidentTypeListener = function() { newMultiSelect(this,self.queryTemplate,"EVENT_TYPE"); };
	this.inputDescriptionListener = function() { newTextInput(this,self.queryTemplate,"CONSOLIDATED_NOTES"); };

	this.fatalitySizingListener = function() {
		fatalitySizing = !fatalitySizing;
		mapObj.redrawCompletely();
		timelines.redrawCompletely();	
	}

	document.getElementById("selectIncidentType")
		.addEventListener("change", this.selectIncidentTypeListener);

	document.getElementById("fatalitySizing")
		.addEventListener("click", this.fatalitySizingListener);

	document.getElementById("inputDescription")
		.addEventListener("keyup", this.inputDescriptionListener);

	//just piggybacking on the bootstrap fn
	$(document).on('click.bs.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
	    $(e.target).parent().children().removeClass("selected-tab");
	    $(e.target).addClass("selected-tab");
	});

	this.brush.on("brush", brushed.bind(this));

	self.queryTemplate.evaluate("CONSOLIDATED_NOTES", {selectAll: true});
	self.queryTemplate.evaluate("EVENT_TYPE", {selectAll: true});
	brushed.call(this);

	function newTextInput(inputObj, queryTemplate, label) {
		if(inputObj.value === "") {
			queryTemplate.evaluate(label, {selectAll: true});	
		} else {
			queryTemplate.evaluate(label, {autoCompleteSearch: inputObj.value});
		}
	}

	function newMultiSelect(selectObj, queryTemplate, label) {

		var options = [];
		var child = selectObj.firstChild;

		while(child) {
	        if(child.children[0].checked) {
	        	options.push(child.children[0].getAttribute("data-value"));
	        }
	    	
	    	child = child.nextSibling;
		}


		queryTemplate.evaluate(label, {any: options});
	}

	function brushed() {

		var ext = this.brush.extent();

		//made at least temporarily global so can use to calculate scales in Timelines
		startDate = ext[0].getTime(); 
		endDate = ext[1].getTime();
		this.queryTemplate.evaluate("EVENT_DATE", {inRange: [dateFormat(ext[0]), dateFormat(ext[1])]});
	}

}



