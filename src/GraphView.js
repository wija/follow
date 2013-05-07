//GraphView.js

function GraphView(parentElement, country) {

	this.width = window.innerWidth - 400;
	this.height = 1000;

	this.svg = d3.select(parentElement).append("svg")
					.attr("width", this.width)
					.attr("height", this.height);


}

//why pass this country instead of it using this.country?
GraphView.prototype.redraw = function(resultArr, country) {

	var dyadicPairs = {},
		nodeList = {},
		linkList = [];

	for(var i = 0, n = dataset.completeDataArray.length; i < n; i++) {
		if(dataset.completeDataArray[i].COUNTRY === country) {

			var joinedPair = [dataset.completeDataArray[i].ACTOR1, dataset.completeDataArray[i].ACTOR2].join('|');

			dyadicPairs[joinedPair] = 
				dyadicPairs[joinedPair] 
					? dyadicPairs[joinedPair] + 1 
					: 1;

			nodeList[dataset.completeDataArray[i].ACTOR1] = true;
			nodeList[dataset.completeDataArray[i].ACTOR2] = true;
		}
	}

	nodeToIndex = {};
	nodeList = Object.keys(nodeList).map(function(n,i) { 
		nodeToIndex[n] = i; 
		return {"name": n};
	});

	console.log(dyadicPairs);
	for(var v in dyadicPairs) {
		var splitPair = v.split('|');
		linkList.push({"source":nodeToIndex[splitPair[0]],"target":nodeToIndex[splitPair[1]],"value":dyadicPairs[v]});
	}

	var force = d3.layout.force()
	    .nodes(nodeList)
	    .links(linkList)
	    .size([this.width, this.height])
	    .gravity(0)
	    .linkDistance(350)
	    .charge(-350)
	    .on("tick", tick)
	    .start();

/*
// Per-type markers, as they don't inherit styles.
svg.append("svg:defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");
*/


var path = this.svg.append("svg:g").selectAll("path")
    .data(force.links())
  .enter().append("svg:path")
	.attr("class", "link")
	.attr("stroke-width", function(d) { return Math.log(d.value + 1); }); //function(d) { return "link " + d.type; });
//    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });


var circle = this.svg.append("svg:g").selectAll("circle")
    .data(force.nodes())
  .enter().append("svg:circle")
    .attr("r", 6)
    .call(force.drag);


var text = this.svg.append("svg:g").selectAll("g")
    .data(force.nodes())
  .enter().append("svg:g");

/*
// A copy of the text with a thick white stroke for legibility.
text.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .attr("class", "shadow")
    .text(function(d) { return d.name; });
*/

text.append("svg:text")
    .attr("x", 8)
    .attr("y", ".31em")
    .text(function(d) { return d.name.slice(0,10); });

function tick() {
	path.attr("d", function(d) {
	    return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
	});

    circle.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    text.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

/*
	  path.attr("d", function(d) {
	    var dx = d.target.x - d.source.x,
	        dy = d.target.y - d.source.y,
	        dr = Math.sqrt(dx * dx + dy * dy);
	    return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
	  });

	  circle.attr("transform", function(d) {
	    return "translate(" + d.x + "," + d.y + ")";
	  });

	  text.attr("transform", function(d) {
	    return "translate(" + d.x + "," + d.y + ")";
	  });
*/

}

GraphView.prototype.destruct = function() {
	this.svg.remove();
}
