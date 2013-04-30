//Table.js

/*
			  { FATALITIES:  		{ index: db.NumberIndex },
			    COUNTRY:     		{ index: db.CategoryIndex },
			    ADM_LEVEL_1_BY_COUNTRY: { index: db.CategoryIndex,
			    					  	  opts: { keyExtractor: function(o) { return o.COUNTRY + '|' + o.ADM_LEVEL_1; }}}, 
			    EVENT_DATE:  		{ index: db.DateIndex }, 
			    EVENT_TYPE:  		{ index: db.CategoryIndex },
			    CONSOLIDATED_NOTES: { index: db.TextIndex }});

*/

function Table(parentElement, country) {

	this.parentElement = parentElement;
	this.country = country;

	this.cachedResultArr = [];
	
	this.tableContainer = document.createElement("div");
	this.tableContainer.setAttribute("id", "tableContainer");
	document.getElementById(this.parentElement).appendChild(this.tableContainer);
}

Table.prototype.redraw = function(resultArr) {
	
	var diffs = db.sets.complements(this.cachedResultArr, resultArr),
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

function makeNewDiv(o) {

	var newDiv = document.createElement("div");
	newDiv.setAttribute("id", o.MY_EVENT_ID);
	newDiv.setAttribute("data-milliseconds", new Date(o.EVENT_DATE).getTime());
	if(o.COUNTRY === this.country) {
		newDiv.setAttribute("class", "chronology-item current-country-item");
 	} else {
		newDiv.setAttribute("class", "chronology-item");
	}
	var Act1Act2DescSrc = o.CONSOLIDATED_NOTES.split("|");
	var newContent = "<b>" + o.EVENT_DATE
				   + " (" + o.COUNTRY + ", " + o.ADM_LEVEL_1 + ")</b><br/>"
				   + "<i>Description:</i> " + Act1Act2DescSrc[2] + "<br/>"
				   + (Act1Act2DescSrc[0] === "" 
				   		? "" 
				   		: "<i>Actors</i>: " + Act1Act2DescSrc[0]
				   		  + (Act1Act2DescSrc[1] === ""
				   		  		? "<br/>"
				   		  		: " & " + Act1Act2DescSrc[1] + "<br/>")) 
				   + "<i>Source:</i> " +  Act1Act2DescSrc[3] + "<br/>";
	newDiv.innerHTML = newContent;
	return newDiv;
}

