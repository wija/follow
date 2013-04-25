//Timelines.js

/*
constructor:
parentElement = "#dataTable"
startDate = new Date("1/1/1997")
endDate = new Date("2/28/2013")

draw:
startDate, endDate  remain global?????
*/


function Timelines(parentElement, startDate, endDate, country) {

	this.cachedResultArr = [];

	//has devolved into magic numbers at this point
	//currently duplicated in Controls.js
	this.dimensions = { width: 700, height: 40 };  //height=40 was for rendering each separately
	this.padding = { outerPaddingWidth: 5, placenameWidth: 70, innerPaddingWidth: 5,
   				   outerPaddingHeight: 2, labelHeight: 10, tickToLabelHeight: 3, tickHeight: 5, 
   				   axisToIncidentsHeight: 5 };
	this.corners = { xTimelineLeft: this.padding.outerPaddingWidth + this.padding.placenameWidth + this.padding.innerPaddingWidth,
   				   xTimelineRight: this.dimensions.width - this.padding.outerPaddingWidth,
   				   yTimelineTop: this.padding.outerPaddingHeight,
   				   yTimelineBottom: this.dimensions.height - (this.padding.outerPaddingHeight + this.padding.labelHeight + this.padding.tickToLabelHeight + this.padding.tickHeight) };

	this.countryOffsets = {};

	var cnames = dataset.indexRegistry.ADM_LEVEL_1_BY_COUNTRY.getValues().sort();
	var onlyForCountry = cnames.filter(function(ca) { return ca.split("|")[0] === country; });
	var withoutCountry = cnames.filter(function(ca) { return ca.split("|")[0] !== country; });
	cnames = onlyForCountry.concat(withoutCountry);
	for(var i = 0, n = cnames.length; i < n; i++) {
		this.countryOffsets[cnames[i]] = 20 + i * this.dimensions.height;
	}
	var maxOffset = 20 + i * this.dimensions.height;

	var totalHeight = maxOffset + 20 - 10;

	var self = this;
	var xScale = (function() {
		return d3.time.scale()
					  .domain([startDate.getTime(), endDate.getTime()])
	            	  .range([self.corners.xTimelineLeft, self.corners.xTimelineRight])
	            	  .clamp(true);
	})();

	this.chart = d3.select(parentElement).append("svg")
					.attr("class", "chart")
					.attr("width", 555) //this.dimensions.width)
					.attr("height", totalHeight);

	var splitCnames = cnames.map(function(s) { return s.split('|'); });

	for(var i = 0, n = cnames.length; i < n; i++) {
		this.chart.append("text")
			.text(splitCnames[i][1])
			.attr("x", this.padding.outerPaddingWidth)
			.attr("y", 20 + i * this.dimensions.height + (this.dimensions.height / 3))
			.attr("font-size", this.dimensions.height / 4)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold");
		this.chart.append("text")
			.text(splitCnames[i][0])
			.attr("x", this.padding.outerPaddingWidth)
			.attr("y", 20 + i * this.dimensions.height + 2 * (this.dimensions.height / 3))
			.attr("font-size", this.dimensions.height / 4)
			.attr("font-family", "sans-serif");
    }

	this.tl = this.chart.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0,15)") //+ (maxOffset + this.corners.yTimelineBottom) + ")")
		.style("font-size", this.padding.labelHeight)
		.style("font-family", "sans-serif");

	this.tl.call(d3.svg.axis()
		.scale(xScale)
		.tickFormat(d3.time.format("%b %Y"))
		.ticks(5)
		.orient("top")
		.tickSize(-10) //(-totalHeight)
		//.tickSize(this.padding.tickHeight)
		.tickPadding(this.padding.tickToLabelHeight));
}

Timelines.prototype.redraw = function(resultArr) {
		
	var diffs = db.sets.complements(this.cachedResultArr, resultArr),
		enter = diffs[0],
		exit = diffs[1];

	var self = this;

	var xScale = (function() {
		return d3.time.scale()
				.domain([startDate, endDate])
	    		.range([self.corners.xTimelineLeft, 555])
				.clamp(true);
	})();

    this.tl.call(d3.svg.axis()
		.scale(xScale)
		.tickFormat(d3.time.format("%b %Y"))
		.ticks(5)
		.orient("top")
		.tickSize(-10) //(-totalHeight)
		//.tickSize(this.padding.tickHeight)
		.tickPadding(this.padding.tickToLabelHeight));


	var cs = this.chart.selectAll("circle")
				  .data(resultArr, function(d) { return d.MY_EVENT_ID; });

	cs.enter().insert("circle")
		.attr("cx", function(d, i) { return xScale(dateFormat.parse(d.EVENT_DATE).getTime()); })
		.attr("cy", function(d) { return self.countryOffsets[d.COUNTRY+'|'+d.ADM_LEVEL_1] + self.corners.yTimelineBottom - self.padding.axisToIncidentsHeight; })
		.attr("r", 3)
		.attr("fill", function(d) { return p.getColor(d.EVENT_TYPE); });

    cs.attr("cx", function(d, i) { 
    	return xScale(dateFormat.parse(d.EVENT_DATE).getTime()); 
    });

	cs.exit().remove();

	this.cachedResultArr = resultArr;

}

Timelines.prototype.destruct = function() {
	this.chart.remove();
}


