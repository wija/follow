p = new Palette();
dateFormat = d3.time.format("%x");

startDate = null;
endDate = null;

fatalitySizing = true;

selectedTab = "#map";

masterCachedResultArr = [];

function redraw(country, resultArr) {
	
	if(tabHash[selectedTab] && tabHash[selectedTab].redraw)
		tabHash[selectedTab].redraw(resultArr);

	masterCachedResultArr = resultArr;
}

function redrawOnTabSwitch(country) {

	if(tabHash[selectedTab] && tabHash[selectedTab].redraw)
		tabHash[selectedTab].redraw(masterCachedResultArr);
}

firstTime = true;

function loadNewCountry(country) {
	
	if(!firstTime) {
		controls.destruct();
		for(var t in tabHash)
			tabHash[t].destruct();
	}

	var tabs;

	loadDataset(country, redraw.bind(null, masterCachedResultArr))
		.done(function() {

				var mapPromise = new Map(country, "map");
				
				mapPromise.done(function(m) {
						mapObj = m;
				});
				
				timelines = new Timelines("timelines", 
							  			  new Date("1/1/1997"), 
							  			  new Date("2/28/2013"),
							  			  country);

		  		table = new Table("chronology", country);

		  		//interactionsTable = new InteractionsTable("#interactionsPanel", country);
				//graphView = new GraphView("#interactionsPanel", country);
				
				controls = new Controls(ps, country);

				$.when(mapPromise).done(function() {
					
					tabHash = { "#map": mapObj,
		     			        "#timelines": timelines,
		     			        "#chronology": table};

					if(firstTime) {
						makeCountryList("countrySelector");
					}

					controls.attachEventHandlers();

					$('a[data-toggle="tab"]').on('shown', function (e) {
						//hackery; cleanup tab logic
						if(~['#map', '#timelines', '#chronology'].indexOf(e.target.attributes.href.value)) {
							selectedTab = e.target.attributes.href.value;
							$(document).scrollTop(0);
							setTimeout(function() { redrawOnTabSwitch(country) }, 0);
						}
					});

					if(!firstTime) {
						$('#load-data').modal('hide');
					}

					firstTime = false;
				});
	  	});
}
//CountryList.js

function makeCountryList(parentElement) {
	
	var countryList = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
		"Central African Republic","Chad", "Democratic Republic of the Congo", "Djibouti", "Egypt", 
		"Equatorial Guinea", "Eritrea", "Ethiopia","Gabon", "Gambia", "Ghana", "Guinea-Bissau", "Guinea", 
		"Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", 
		"Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Republic of Congo", 
		"Rwanda", "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", 
		"Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"];

	var htmlStr = "";
	for(var i = 0; i < countryList.length; i++) {
		htmlStr += '<label class="radio">'
					+ '<input type="radio" name="countryOptionsRadios" id="countryOptions" value="' + countryList[i].replace(/ /g,'_') + '" unchecked>'
					+ countryList[i]
					+ '</label>';
	}
	$('#' + parentElement).html(htmlStr);

}

function getRadioButtonValueAndLoad() {
	var radios = document.getElementsByName("countryOptionsRadios");

	for (var i = 0, length = radios.length; i < length; i++) {
	    if (radios[i].checked) {
	    	loadNewCountry(radios[i].value.replace(/ /g, "_"));
	    }
	}
}
//loadDataset.js

//dataset left global for now

function loadDataset(country, qtCallback) {

	var deferred = $.Deferred();

	var jsonArray;

	$.getJSON('data/' + country + '.json')
		.done(function(jsonArray) {

			/* hacky way to jitter the points because too much overlap due to imprecise coordinates */
			var lonJitterBase = 10, latJitterBase = 10;  //would ideally relate to display dimensions
			for(var i = 0, n = jsonArray.length; i < n; i++) {
					jsonArray[i].LATITUDE_JITTER = (Math.random() - 0.5) * latJitterBase;
					jsonArray[i].LONGITUDE_JITTER = (Math.random() - 0.5) * lonJitterBase;
			}

			return jsonArray;
		})
		.done(function(jsonArray) {

			dataset = new db.Collection();

			dataset.loadData(

			  jsonArray,

				  { FATALITIES:  		{ index: db.NumberIndex },
				    COUNTRY:     		{ index: db.CategoryIndex },
				    ADM_LEVEL_1_BY_COUNTRY: { index: db.CategoryIndex,
				    					  	  opts: { keyExtractor: function(o) { return o.COUNTRY + '|' + o.ADM_LEVEL_1; }}}, 
				    EVENT_DATE:  		{ index: db.DateIndex }, 
				    EVENT_TYPE:  		{ index: db.CategoryIndex },
				    CONSOLIDATED_NOTES: { index: db.TextIndex }});

			ps = new db.QueryTemplate(

				dataset, 

				db.qtIntersect(
					db.qtField("EVENT_TYPE"), 
					db.qtField("EVENT_DATE"),
					db.qtField("CONSOLIDATED_NOTES")),

				qtCallback);

		})
		.done(function() { 
			deferred.resolve(); 
		});

	return deferred.promise();
}
//Map.js

!function(scope) {

//returns a promise rather than a map object
function Map(country, parentElement) {

	var deferred = $.Deferred();

	this.cachedResultArr = [];

	var filename = country + ".json";

	var self = this;

	$.getJSON("maps/" + filename)
		.done(function(jsonMap) {

		 	var subunits = topojson.object(jsonMap, jsonMap.objects.subunits),
		 		admin1 = topojson.object(jsonMap, jsonMap.objects.admin1),
		    	places = topojson.object(jsonMap, jsonMap.objects.places),
		   		rivers = topojson.object(jsonMap, jsonMap.objects.rivers),
		   		oceans = topojson.object(jsonMap, jsonMap.objects.oceans),
		   		urbanAreas = topojson.object(jsonMap, jsonMap.objects.urban);

			/*
				Re meaning of d3's scale and translate, in addition to the docs, see
				http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
				https://groups.google.com/forum/#!msg/d3-js/pvovPbU5tmo/NNVOC8cIPjUJ
				http://bl.ocks.org/mbostock/4707858
			*/

			self.projection = d3.geo.mercator()
			      .scale(1)
			      .translate([0, 0]);

			var path = d3.geo.path()
			    .projection(self.projection);

			var width = window.innerWidth,
			    b = path.bounds(subunits),
			    s = 1 / ((b[1][0] - b[0][0]) / width),
			    height = s * (b[1][1] - b[0][1]),
			    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

			self.projection
				.scale(s)
			    .translate(t);

			self.svgMap = d3.select('#' + parentElement).append("svg")
			    .attr("width", width)
			    .attr("height", height)
			    .attr("id", "mapContainer");

			self.svgMap.selectAll(".subunit")
				.data(subunits.geometries)
			.enter().append("path")
				.attr("class", function(d) { return "subunit " + d.id; })
				.attr("d", path);

			self.svgMap.selectAll(".river")
				.data(rivers.geometries)
			.enter().append("path")
				.attr("class", "river")
				.attr("style", function(d) { return "stroke-width:" + (d.properties.strokeweig * 2.5);})
				.attr("d", path);

			self.svgMap.selectAll(".urbanArea")
				.data(urbanAreas.geometries)
			.enter().append("path")
				.attr("class", "urban-area")
			  	.attr("d", path);

		  	//is this part necessary?
		  	self.svgMap.append("path")
		    	.datum(topojson.mesh(jsonMap, jsonMap.objects.urban, function(a, b) { return a !== b; }))
		    	.attr("d", path)
		    	.attr("class", "urban-area-boundary");

			self.svgMap.append("path")
				.datum(topojson.mesh(jsonMap, jsonMap.objects.subunits, function(a, b) { return a !== b; }))
				.attr("d", path)
				.attr("class", "subunit-boundary");

			self.svgMap.selectAll(".admin1subunit")
				.data(admin1.geometries)
			.enter().append("path")
				.attr("class", function(d) { return "admin1subunit " + d.id; })
				.attr("d", path);

			self.svgMap.append("path")
				.datum(topojson.mesh(jsonMap, jsonMap.objects.admin1, function(a, b) { return a !== b; }))
				.attr("d", path)
				.attr("class", "admin1-boundary");

			self.svgMap.append("path")
				.datum(places)
				.attr("d", path)
				.attr("class", "place");

			self.svgMap.selectAll(".place-label")
				.data(places.geometries)
			.enter().append("text")
				.attr("class", "place-label")
				.attr("transform", function(d) { return "translate(" + self.projection(d.coordinates) + ")"; })
				.attr("x", function(d) { return d.coordinates[0] > -1 ? 6 : -6; })
				.attr("dy", ".35em")
				.style("text-anchor", function(d) { return d.coordinates[0] > -1 ? "start" : "end"; })
				.text(function(d) { return d.properties.name; });

			self.svgMap.append("g")
				.attr("id", "circleGroup");

		})
		.done(function() { 
			deferred.resolve(self); 
		});

	return deferred.promise();
}

Map.prototype.redraw = function(resultArr) {
		
	var diffs = db.sets.complements(this.cachedResultArr, resultArr, function(e) { return e.arrayIndex; }),
		enter = diffs[0],
		exit = diffs[1];

	var svgMapNode = document.getElementById("circleGroup");

	var enterFragment = document.createDocumentFragment();

	for(var i = 0, n = enter.length; i < n; i++) {
		
		var d = enter[i]; 
		var proj = this.projection([d.LONGITUDE, d.LATITUDE]);

		var circle = document.createElementNS(svgMapNode.namespaceURI, "circle");
		circle.setAttributeNS(null, "id", d.MY_EVENT_ID);
		circle.setAttributeNS(null, "data-fatalities", d.FATALITIES);
		circle.setAttributeNS(null, "cy", proj[1] + d.LATITUDE_JITTER);
		circle.setAttributeNS(null, "cx", proj[0] + d.LONGITUDE_JITTER);

		if(fatalitySizing) {
			circle.setAttributeNS(null, "r", Math.log(d.FATALITIES+1)*2 + 2);
		} else {
			circle.setAttributeNS(null, "r", 4);
		}
		circle.setAttributeNS(null, "fill", p.getColor(d.EVENT_TYPE));

		//this doesn't result in tooltips actually displaying; why not?
		var titleTextElement = document.createElementNS(svgMapNode.namespaceURI, "text");
		titleTextElement.textContent = d.CONSOLIDATED_NOTES;
		circle.appendChild(titleTextElement);
		
		enterFragment.appendChild(circle);
	}

	svgMapNode.appendChild(enterFragment);

	for(var i = 0, n = exit.length; i < n; i++) {
		var d = exit[i];
		svgMapNode.removeChild(document.getElementById(d.MY_EVENT_ID));
	}

	this.cachedResultArr = resultArr;
}

Map.prototype.redrawCompletely = function() {
	var cs = document.getElementById("circleGroup").childNodes;
	for(var i = 0, n = cs.length; i < n; i++) {
		cs[i].setAttribute("r", fatalitySizing ? Math.log(+cs[i].getAttribute("data-fatalities") + 1) * 2 + 2 : 3);
	}
}

Map.prototype.destruct = function() {
	this.svgMap.remove();
}

scope.Map = Map;

}(window);

//Timelines.js

function Timelines(parentElement, startDate, endDate, country) {

	this.cachedResultArr = [];

	this.axisElement = document.createElement("div");
	this.axisElement.setAttribute("id", "timelinesAxis");
	document.getElementById(parentElement).appendChild(this.axisElement);

	this.panelElement = document.createElement("div");
	this.panelElement.setAttribute("id", "timelinesPanel");
	document.getElementById(parentElement).appendChild(this.panelElement);

	//has devolved into magic numbers at this point
	//currently duplicated in Controls.js
	this.dimensions = { width: window.innerWidth - 400, height: 40 };  //height=40 was for rendering each separately
	this.padding = { outerPaddingWidth: 20, placenameWidth: 70, innerPaddingWidth: 5,
   				   outerPaddingHeight: 2, labelHeight: 10, tickToLabelHeight: 3, tickHeight: 5, 
   				   axisToIncidentsHeight: 5 };
	this.corners = { xTimelineLeft: this.padding.outerPaddingWidth + this.padding.placenameWidth + this.padding.innerPaddingWidth,
   				     xTimelineRight: this.dimensions.width - this.padding.outerPaddingWidth,
   				     yTimelineTop: this.padding.outerPaddingHeight,
   				     yTimelineBottom: this.dimensions.height - (this.padding.outerPaddingHeight + this.padding.labelHeight + this.padding.tickToLabelHeight + this.padding.tickHeight) };

	this.countryOffsets = {};
	
	var cnames = dataset.indexRegistry.ADM_LEVEL_1_BY_COUNTRY.getValues().sort();
	var onlyForCountry = cnames.filter(function(ca) { return ca.split("|")[0].replace(/ /g, '_') === country; });
	var withoutCountry = cnames.filter(function(ca) { return ca.split("|")[0].replace(/ /g, '_') !== country; });
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

	this.chart = d3.select(this.panelElement).append("svg")
					.attr("class", "chart")
					.attr("width", this.dimensions.width)
					.attr("height", totalHeight);

	var splitCnames = cnames.map(function(s) { return s.split('|'); });

	for(var i = 0, n = cnames.length; i < n; i++) {
		this.chart.append("text")
			.text(splitCnames[i][1])
			.attr("x", this.padding.outerPaddingWidth + 5)
			.attr("y", 30 + i * this.dimensions.height + (this.dimensions.height / 3))
			.attr("font-size", this.dimensions.height / 4)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold");
		this.chart.append("text")
			.text(splitCnames[i][0])
			.attr("x", this.padding.outerPaddingWidth + 5)
			.attr("y", 30 + i * this.dimensions.height + 2 * (this.dimensions.height / 3))
			.attr("font-size", this.dimensions.height / 4)
			.attr("font-family", "sans-serif");
    }

	this.axisBox = d3.select(this.axisElement).append("svg")
					.attr("left", self.corners.xTimelineRight)
					.attr("width", self.dimensions.width)
					.attr("height", 55);

	this.tl = this.axisBox.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(0,20)")
		.style("font-size", this.padding.labelHeight)
		.style("font-family", "sans-serif");

	this.tl.call(d3.svg.axis()
		.scale(xScale)
		.tickFormat(d3.time.format("%b %Y"))
		.ticks(5)
		.orient("top")
		.tickSize(-10)
		.tickPadding(this.padding.tickToLabelHeight));
}

Timelines.prototype.redraw = function(resultArr) {
		
	var diffs = db.sets.complements(this.cachedResultArr, resultArr, function(e) { return e.arrayIndex; }),
		enter = diffs[0],
		exit = diffs[1];

	var self = this;

	var xScale = (function() {
		return d3.time.scale()
				.domain([startDate, endDate])
	    		.range([self.corners.xTimelineLeft, self.corners.xTimelineRight])
				.clamp(true);
	})();

    this.tl.call(d3.svg.axis()
		.scale(xScale)
		.tickFormat(d3.time.format("%b %Y"))
		.ticks(5)
		.orient("top")
		.tickSize(-10)
		.tickPadding(this.padding.tickToLabelHeight));


	var cs = this.chart.selectAll("circle")
				  .data(resultArr, function(d) { return d.MY_EVENT_ID; });

	cs.enter().insert("circle")
		.attr("cx", function(d, i) { return xScale(dateFormat.parse(d.EVENT_DATE).getTime()); })
		.attr("cy", function(d) { return self.countryOffsets[d.COUNTRY+'|'+d.ADM_LEVEL_1] + self.corners.yTimelineBottom - self.padding.axisToIncidentsHeight; })
		.attr("r", function(d) { return fatalitySizing ? Math.log(+d.FATALITIES+1)*2 + 2 : 3; })
		.attr("fill", function(d) { return p.getColor(d.EVENT_TYPE); })
		.append("title").text(function(d) { return d.CONSOLIDATED_NOTES; });

    cs.attr("cx", function(d, i) { 
    	return xScale(dateFormat.parse(d.EVENT_DATE).getTime()); 
    });

	cs.exit().remove();

	this.cachedResultArr = resultArr;

}

Timelines.prototype.redrawCompletely = function() {
	this.chart.selectAll("circle")
		.attr("r", function(o) { return fatalitySizing ? Math.log(+o.FATALITIES+1)*2 + 2 : 3; });
}

Timelines.prototype.destruct = function() {
	this.axisElement.remove();
	this.panelElement.remove();
}


//Table.js

function Table(parentElement, country) {

	this.parentElement = parentElement;
	this.country = country;

	this.cachedResultArr = [];
	
	this.tableContainer = document.createElement("div");
	this.tableContainer.setAttribute("id", "chronologyContainer");
	this.tableContainer.style.width = window.innerWidth - 460;
	document.getElementById(this.parentElement).appendChild(this.tableContainer);
}

Table.prototype.redraw = function(resultArr) {

	var diffs = db.sets.complements(this.cachedResultArr, resultArr, function(e) { return e.arrayIndex; }),	
		enter = diffs[0],
		exit = diffs[1];

	var insertFunction = removeToInsertLater(this.tableContainer),
		htmlCollect = this.tableContainer.children;
	for(var i = 0, n = enter.length; i < n; i++) {
		var newDiv = makeNewDiv.call(this, enter[i]);
		for(var j = 0, m = htmlCollect.length; j < m; j++) {
			if(new Date(enter[i].EVENT_DATE).getTime() < htmlCollect[j].getAttribute("data-milliseconds")) {
				this.tableContainer.insertBefore(newDiv, htmlCollect[j]);
				break;
			}
		}
		if(j === m) {
			this.tableContainer.appendChild(newDiv);
		}
	}
	insertFunction();

	for(var i = 0, n = exit.length; i < n; i++) {
		this.tableContainer.removeChild(this.tableContainer.children.namedItem(exit[i].MY_EVENT_ID));
	}

	this.cachedResultArr = resultArr;
}

Table.prototype.destruct = function() {
	document.getElementById(this.parentElement).removeChild(this.tableContainer);
}

var formatDate = d3.time.format("%b.%e, %Y");

function makeNewDiv(o) {

	var newDiv = document.createElement("div");
	newDiv.setAttribute("id", o.MY_EVENT_ID);
	newDiv.setAttribute("data-milliseconds", new Date(o.EVENT_DATE).getTime());
	newDiv.setAttribute("class", "chronology-item");
	var Act1Act2DescSrc = o.CONSOLIDATED_NOTES.split("|");
	var newContent = "<div class='left' style='border-left: 7px solid " + p.getColor(o.EVENT_TYPE) + "'>"
				   + "<span class ='chronology-title'>" + o.ADM_LEVEL_1 + ' (' + o.COUNTRY + '), '
				   + formatDate(new Date(o.EVENT_DATE)) + ' &mdash; </span>'
				   + Act1Act2DescSrc[2] //+ "<br/>"
				   //+ (Act1Act2DescSrc[0] === "" 
				   //		? "" 
				   //		: "<i>Actors</i>: " + Act1Act2DescSrc[0]
				   //		  + (Act1Act2DescSrc[1] === ""
				   //		  		? "<br/>"
				   //		  		: " & " + Act1Act2DescSrc[1] + "<br/>")) 
				   + " (<i>Source:</i> " +  Act1Act2DescSrc[3] + ")"
				   + "</div>"
				   + "<div class='right'>"
				   + "<div class='event-type'>" + o.EVENT_TYPE + "</div>"
				   //+ "<div class='event-circle'>"
				   //+ '<svg width="30" height="30">'
				   //+ '<circle cx="15" cy="15" r="' + Math.log(+o.FATALITIES+1)*2 + 2 + '" fill="' + p.getColor(o.EVENT_TYPE) + '"/>' 
				   //+ '</svg> '
				   //+ "</div>"
				   + (+o.FATALITIES === 0 ? "" : "<div class='fatalities'>" + o.FATALITIES + " Killed</div>")
				   + "</div>";
	newDiv.innerHTML = newContent;
	return newDiv;
}

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



//dom-utils.js

//from https://developers.google.com/speed/articles/javascript-dom
/**
 * Remove an element and provide a function that inserts it into its original position
 * @param element {Element} The element to be temporarily removed
 * @return {Function} A function that inserts the element into its original position
 **/
function removeToInsertLater(element) {
	var parentNode = element.parentNode;
	var nextSibling = element.nextSibling;
	parentNode.removeChild(element);
	return function() {
		if (nextSibling) {
			parentNode.insertBefore(element, nextSibling);
    	} else {
      		parentNode.appendChild(element);
    	}
  	};
}
