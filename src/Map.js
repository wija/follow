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
		
	var diffs = db.sets.complements(this.cachedResultArr, resultArr),
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

