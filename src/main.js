<script type="text/javascript">

p = new Palette();
dateFormat = d3.time.format("%x");

mapWidth = 700;
mapHeight = 420;

startDate = null;
endDate = null;

selectedTab = "#map";

masterCachedResultArr = [];
function redraw(resultArr) {
	switch(selectedTab) {
		case "#map":
			map.redraw(resultArr);
			break;
		case "#timelines":
			timelines.redraw(resultArr);
			break;
		case "#chronology":
			table.redraw(resultArr);
		case "#country-selector":
			break;
	}
	masterCachedResultArr = resultArr;
}

function redrawOnTabSwitch() {
	switch(selectedTab) {
		case "#map":
			map.redraw(masterCachedResultArr);
			break;
		case "#timelines":
			timelines.redraw(masterCachedResultArr);
			break;
		case "#chronology":
			table.redraw(masterCachedResultArr);
		case "#country-selector":
			break;
	}
}

firstTime = true;
loadNewCountry("Nigeria");

function loadNewCountry(country) {
	
	if(firstTime) {
		makeCountryList("countrySelector");
		firstTime = false;
	} else {
		controls.destruct();
		timelines.destruct();
		table.destruct();
		map.destruct();
	}

	loadDataset(country, 
				mapHeight, mapWidth, 
				redraw,
				function() {
					map = new Map(country, 
								  mapWidth, mapHeight, 
								  "#mapTable", 
								  function() {
								  		timelines = new Timelines("#dataTable", 
								  								  new Date("1/1/1997"), 
								  								  new Date("2/28/2013"));
								  		table = new Table("chronology");
										controls = new Controls(ps);
										controls.attachEventHandlers();
								  });
				});

}
