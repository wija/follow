<script type="text/javascript">

p = new Palette();
dateFormat = d3.time.format("%x");

//was 700x420
mapWidth = window.innerWidth + 150;
mapHeight = mapWidth * 0.6;

startDate = null;
endDate = null;

fatalitySizing = true;

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
loadNewCountry("Cameroon");

function loadNewCountry(country) {
	
	if(!firstTime) {
		controls.destruct();
		timelines.destruct();
		map.destruct();
		table.destruct();
	}

	loadDataset(country, 
				mapHeight, mapWidth, 
				redraw,
				function() {
					map = new Map(country, 
								  mapWidth, mapHeight, 
								  "#forTheMap", 
								  function() {
								  		timelines = new Timelines("#dataTable", 
								  								  new Date("1/1/1997"), 
								  								  new Date("2/28/2013"),
								  								  country);
								  		table = new Table("chronologyPanel", country);
										controls = new Controls(ps, country);
										controls.attachEventHandlers();
										if(firstTime) {
											//this is broken for some reason, so inserted directly into
											//the html
											//makeCountryList("countrySelector");
											firstTime = false;
										}
										$('#load-data').modal('hide');
								  });
				});

}
