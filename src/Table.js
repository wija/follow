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

	var fragment = document.createDocumentFragment();
	//for(var i = 0, n = enter.length; i < n; i++) {
	//	fragment.appendChild(makeNewDiv(enter[i]));
	//}
	fragment = batchInsert(this.cachedResultArr, enter, 
						   this.tableContainer.children, 
						   fragment, makeNewDiv.bind(this),
						   function(o) { return new Date(o.EVENT_DATE).getTime(); });
	this.tableContainer.appendChild(fragment);

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
	//newDiv.setAttribute("data-milliseconds", format.parse(row.startdate).getTime());
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

function batchInsert(cachedResultArr, enter, htmlCollect, fragment, makeNewDiv, keyExtractor) {
	
	var i1 = 0,
		i2 = 0, 
		len1 = cachedResultArr.length, 
		len2 = enter.length;
	
	while(i1 < len1 && i2 < len2) {
		if(keyExtractor(cachedResultArr[i1]) < keyExtractor(enter[i2])) {
			//result.push(cachedResultArr[i1]);
			i1++;
		} else { // cachedResultArr[i1] > enter[i2]
			htmlCollect[i1].parentNode.insertBefore(makeNewDiv(enter[i2]), htmlCollect[i1 === len1 ? len1 : i1]);
			i1 = (i1 === i2) ? i1 + 1 : i1;
			i2++;
		}
	}

	if(i2 < len2) { 
		for(; i2 < len2; i2++) { 
			fragment.appendChild(makeNewDiv(enter[i2]));
		}
	}
	return fragment;
}

