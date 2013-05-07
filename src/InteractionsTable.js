//InteractionsTable.js

function InteractionsTable(parentElement, country) {

	//tab must be visible for svg to render and getBBox() work
	$('a[href="#interactions"]').tab('show');


	var actor1 = {},
		actor2 = {},
		dyadicPairs = {};

	for(var i = 0, n = dataset.completeDataArray.length; i < n; i++) {
		if(dataset.completeDataArray[i].COUNTRY === country) {

/*
    <foreignObject width="200" height="200" 
     requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
      <p xmlns="http://www.w3.org/1999/xhtml">Text goes here</p>
    </foreignObject>
*/

			var joinedPair = [dataset.completeDataArray[i].ACTOR1, dataset.completeDataArray[i].ACTOR2].join('|');

			dyadicPairs[joinedPair] = 
				dyadicPairs[joinedPair] 
					? dyadicPairs[joinedPair] + 1 
					: 1;

			actor1[dataset.completeDataArray[i].ACTOR1] = true;
			actor2[dataset.completeDataArray[i].ACTOR2] = true;

		}
	}

	var maxIncidentCount = 0;
	for(var v in dyadicPairs) {
		if(dyadicPairs[v] > maxIncidentCount) {
			maxIncidentCount = dyadicPairs[v];
		}
	}

	var actor1Keys = Object.keys(actor1).sort(),
		actor2Keys = Object.keys(actor2).sort();

	this.tester = d3.select(parentElement).append("svg")
					.attr("width", 500)
					.attr("height", 20);

	this.tester.selectAll("text")
			.data(actor1Keys)
		.enter()
			.append("text")
			.text(function(d) { return d; })
			.attr("x", 0)
			.attr("y", 20)
			.attr("font-size", 10)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold");

	var maxTextWidthActor1 = 0;
	this.tester.selectAll("text").each(function() {
		if(this.getBBox().width >  maxTextWidthActor1) maxTextWidthActor1 = this.getBBox().width;
	});

	this.tester.remove();

	this.tester = d3.select(parentElement).append("svg")
					.attr("width", 500)
					.attr("height", 20);

	this.tester.selectAll("text")
			.data(actor2Keys)
		.enter()
			.append("text")
			.text(function(d) { return d === "" ? "None" : d; })  //is this working?
			.attr("x", 0)
			.attr("y", 20)
			.attr("font-size", 10)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold");

	var maxTextWidthActor2 = 0;
	this.tester.selectAll("text").each(function() {
		if(this.getBBox().width >  maxTextWidthActor2) maxTextWidthActor2 = this.getBBox().width;
	});

	this.tester.remove();



	this.gap = 20;

	this.table = d3.select(parentElement).append("svg")
					.attr("width", maxTextWidthActor2 + 20 + this.gap + (actor2Keys.length + 1) * this.gap)
					.attr("height", maxTextWidthActor1 + 20 + this.gap + (actor1Keys.length + 1) * this.gap);

	this.actor1Scale = d3.scale.ordinal()
							.domain(actor1Keys)
							.rangePoints([maxTextWidthActor2 + 20 + this.gap, maxTextWidthActor1 + 20 + actor1Keys.length * this.gap]);

	this.actor2Scale = d3.scale.ordinal()
						.domain(actor2Keys)
						.rangePoints([maxTextWidthActor1 + 20, maxTextWidthActor1 + 20 + actor2Keys.length * this.gap]);

	this.incidentCountScale = d3.scale.linear().domain([0, Math.log(maxIncidentCount + 1) * 2]).range(["white", "red"]);

	var self = this;


	//.attr("text-anchor", "middle")
	this.table.selectAll(".rowHeads")
			.data(actor1Keys)
		.enter()
			.append("text")
			.text(function(d) { return d; })
			.attr("x", maxTextWidthActor1)
			.attr("y", function(d) { return self.actor1Scale(d); })
			.attr("text-anchor", "end")
			.attr("font-size", 10)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold");

	this.table.selectAll(".columnHeads")
			.data(actor2Keys)
		.enter()
			.append("text")
			.text(function(d) { return d; })
			//.attr("x", function(d) { return self.actor2Scale(d); })
			//.attr("y", maxTextWidthActor2)
			.attr("text-anchor", "end")
			.attr("font-size", 10)
			.attr("font-family", "sans-serif")
			.attr("font-weight", "bold")
			.attr("transform", function(d) { return "translate(" + self.actor2Scale(d) + "," + maxTextWidthActor2 + ")rotate(90)"; });

/*
	var maxTextWidth = 0;
	this.table.selectAll("text").each(function() {
		if(this.getBBox().width >  maxTextWidth) maxTextWidth = this.getBBox().width;
	});

*/



/*	this.table.selectAll("circle")
			.data(actor1Keys)
				.enter().insert("circle")
				.attr("cx", 5)
				.attr("cy", function(d) { return self.actor1Scale(d); })
				.attr("r", 4)
				.attr("fill", "#fgabfg");

	this.table.selectAll("circle")
			.data(actor2Keys)
				.enter().insert("circle")
				.attr("cx", function(d) { return self.actor2Scale(d); })
				.attr("cy", 5)
				.attr("r", 4)
				.attr("fill", "#fgabfg");
*/
/*
    <foreignObject width="200" height="200" 
     requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility">
      <p xmlns="http://www.w3.org/1999/xhtml">Text goes here</p>
    </foreignObject>
*/

//		.append("title").text(function(d) { return d.CONSOLIDATED_NOTES; });

	//console.log(dyadicPairs);

}

InteractionsTable.prototype.redraw = function(resultArr, country) {

	var dyadicPairs = {};

	for(var i = 0, n = resultArr.length; i < n; i++) {
		if(resultArr[i].COUNTRY === country) {

			var joinedPair = [resultArr[i].ACTOR1, resultArr[i].ACTOR2].join('|');

			dyadicPairs[joinedPair] = 
				dyadicPairs[joinedPair] 
					? dyadicPairs[joinedPair] + 1 
					: 1;
		}
	}

	var self = this;

	var rs = this.table.selectAll("rect")
			.data(d3.entries(dyadicPairs), function(d) { return d.key; });

	rs.enter().insert("rect")
			.attr("x", function(d) { return self.actor2Scale(d.key.split('|')[1]); })
			.attr("y", function(d) { return self.actor1Scale(d.key.split('|')[0]); })
			.attr("width", self.gap)
			.attr("height", self.gap)
			.attr("fill", function(d) { return self.incidentCountScale(Math.log(d.value + 1) * 2); });

	rs.attr("fill", function(d) { return self.incidentCountScale(Math.log(d.value + 1) * 2); });

	rs.exit().remove();

}

InteractionsTable.prototype.destruct = function() {
	this.table.remove();
}
