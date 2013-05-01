//Map.js

/* parentElement = #mapTable
	this.mapWidth = 700;
	this.mapHeight = 420;
	callback =
		drawTimelines();
		enableEventHandlers();
		intializeControls();
*/
!function(scope) {

function Map(country, mapWidth, mapHeight, parentElement, callback) {

	this.mapWidth = mapWidth;
	this.mapHeight = mapHeight;

	this.cachedResultArr = [];

	this.mapContainer = 
		d3.select(parentElement).append("svg")
	      .attr("width", this.mapWidth)
	      .attr("height", this.mapHeight)
	      .attr("id", "mapTableSvg");

	//fix this
	this.mapContainer.append("defs").append("clipPath")
		.attr("id", "mapClip")
	    .append("rect")
	    	.attr("width", this.mapWidth)
	    	.attr("height", this.mapHeight);

	this.svgMap = this.mapContainer.append("g")
	    .attr("clip-path", "url(#mapClip)");

	var filename;
	if(country === "Democratic_Republic_of_the_Congo") {
		filename = "Congo.json"; 
	} else if(country === "Republic_of_Congo") {
		filename = "Republic_of_the_Congo.json";
	} else {
		filename = country + ".json"; 
	}

	var self = this;

	d3.json("maps/bounding_boxes.json", function(error, boundingBoxes) {

		if(country === "Democratic_Republic_of_the_Congo") {
			var lookupVal = "Congo"; 
		} else if(country === "Republic_of_Congo") {
			var lookupVal = "Republic_of_the_Congo";
		} else {
			var lookupVal = country; 
		}

		var boundingBox = boundingBoxes.filter(function(o) { return o.countryName === lookupVal.replace(/_/g,' '); })[0];

		d3.json("maps/" + filename, function(error, jsonMap) {

		 	var subunits = topojson.object(jsonMap, jsonMap.objects.subunits),
		 		admin1 = topojson.object(jsonMap, jsonMap.objects.admin1),
		    	places = topojson.object(jsonMap, jsonMap.objects.places),
		   		rivers = topojson.object(jsonMap, jsonMap.objects.rivers),
		   		urbanAreas = topojson.object(jsonMap, jsonMap.objects.urban);

		      //see http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object

		    	var scale  = 45 * this.mapWidth / (boundingBox.east - boundingBox.west);
		    	var offset  = [this.mapWidth / 2 - 65, this.mapHeight / 2];
		    	var center = [ boundingBox.west + (boundingBox.east - boundingBox.west)/2, 
		    				   boundingBox.south + (boundingBox.north - boundingBox.south)/2];

		    self.projection = d3.geo.mercator()
		        				.scale(scale)
		        				.center(center)
		        				.translate(offset);

			var path = d3.geo.path()
			    .projection(self.projection)
			    .pointRadius(2);

			self.svgMap.append("rect")
		    	.attr("class", "background")
		    	.attr("width", self.mapWidth)
		    	.attr("height", self.mapHeight);

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

			self.mapContainer.append("g")
				.attr("id", "circleGroup");

			callback();

		});
	});
}

Map.prototype.redraw = function(resultArr) {
		
	var diffs = db.sets.complements(this.cachedResultArr, resultArr),
		enter = diffs[0],
		exit = diffs[1];

	var svgMapNode = document.getElementById("circleGroup");
	//var svgMapNode = document.getElementById("svgMap");

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
			circle.setAttributeNS(null, "r", Math.log(d.FATALITIES+2)+2);
		} else {
			circle.setAttributeNS(null, "r", 3);
		}
		circle.setAttributeNS(null, "fill", p.getColor(d.EVENT_TYPE));
		enterFragment.appendChild(circle);
	}

	svgMapNode.appendChild(enterFragment);

	//**CAN REINTRODUCE THIS: JUST REMOVE AND REINSERT THE PARENT
	//**WILL DOCUMENT.GETELEMENTID WORK WHEN ITS REMOVED?
	//var insertFunction = removeToInsertLater(svgMapNode);
	for(var i = 0, n = exit.length; i < n; i++) {
		var d = exit[i];
		svgMapNode.removeChild(document.getElementById(d.MY_EVENT_ID));
	}
	//insertFunction();

	this.cachedResultArr = resultArr;
}

Map.prototype.redrawCompletely = function() {
	var cs = document.getElementById("circleGroup").childNodes;
	for(var i = 0, n = cs.length; i < n; i++) {
		cs[i].setAttribute("r", fatalitySizing ? Math.log(+cs[i].getAttribute("data-fatalities") + 2) + 2 : 3);
	}
}

Map.prototype.destruct = function() {
	this.mapContainer.remove();
}

scope.Map = Map;

}(window);

