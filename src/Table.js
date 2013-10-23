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

