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

function Table(parentElement) {

	this.parentElement = parentElement;

	this.cachedResultArr = [];
	
	this.tableContainer = document.createElement("div");
	this.tableContainer.setAttribute("id", "tableContainer");
	document.getElementById(this.parentElement).appendChild(this.tableContainer);
}

Table.prototype.redraw = function(resultArr) {
	
	var diffs = db.sets.complements(this.cachedResultArr, resultArr),
		enter = diffs[0],
		exit = diffs[1];

	var fragment = document.createDocumentFragment();
	for(var i = 0, n = enter.length; i < n; i++) {
		var newDiv = document.createElement("div");
		newDiv.setAttribute("id", enter[i].MY_EVENT_ID);
		//newDiv.setAttribute("data-milliseconds", format.parse(row.startdate).getTime());
		newDiv.setAttribute("class", "chronology-item");
		var Act1Act2DescSrc = enter[i].CONSOLIDATED_NOTES.split("|");
		var newContent = "<b>" + enter[i].EVENT_DATE
					   + " (" + enter[i].COUNTRY + ", " + enter[i].ADM_LEVEL_1 + ")</b><br/>"
					   + "<i>Description:</i> " + Act1Act2DescSrc[2] + "<br/>"
					   + (Act1Act2DescSrc[0] === "" 
					   		? "" 
					   		: "<i>Actors</i>: " + Act1Act2DescSrc[0]
					   		  + (Act1Act2DescSrc[1] === ""
					   		  		? "<br/>"
					   		  		: " & " + Act1Act2DescSrc[1] + "<br/>")) 
					   + "<i>Source:</i> " +  Act1Act2DescSrc[3] + "<br/>";
		newDiv.innerHTML = newContent;
		fragment.appendChild(newDiv);
	}
	this.tableContainer.appendChild(fragment);

	for(var i = 0, n = exit.length; i < n; i++) {
		this.tableContainer.removeChild(this.tableContainer.children.namedItem(exit[i].MY_EVENT_ID));
	}

	this.cachedResultArr = resultArr;
}

Table.prototype.destruct = function() {
	document.getElementById(this.parentElement).removeChild(this.tableContainer);
}

