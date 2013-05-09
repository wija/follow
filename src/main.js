p = new Palette();
dateFormat = d3.time.format("%x");

startDate = null;
endDate = null;

fatalitySizing = true;

selectedTab = "#map";

masterCachedResultArr = [];
function redraw(country, resultArr) {
	switch(selectedTab) {
		case "#map":
			map.redraw(resultArr);
			break;
		case "#timelines":
			timelines.redraw(resultArr);
			break;
		case "#chronology":
			table.redraw(resultArr);
			break;
		case "#interactions":
			graphView.redraw(resultArr, country);
			//interactionsTable.redraw(resultArr, country);	
			break;
		case "#country-selector":
			break;
	}

	masterCachedResultArr = resultArr;
}

function redrawOnTabSwitch(country) {
	switch(selectedTab) {
		case "#map":
			map.redraw(masterCachedResultArr);
			break;
		case "#timelines":
			timelines.redraw(masterCachedResultArr);
			break;
		case "#chronology":
			table.redraw(masterCachedResultArr);
			break;
		//case "#interactions":
		//	graphView.redraw(masterCachedResultArr, country);
			//interactionsTable.redraw(masterCachedResultArr, country);	
			break;
		case "#country-selector":
			break;
	}
}

firstTime = true;

function loadNewCountry(country) {
	
	if(!firstTime) {
		controls.destruct();
		timelines.destruct();
		map.destruct();
		table.destruct();
		//interactionsTable.destruct();
		//graphView.destruct();
	}

	loadDataset(country, redraw.bind(null, country))
		.done(function() {

				var mapPromise = new Map(country, "map");
				
				mapPromise.done(function(mapObj) {
						map = mapObj;
				});
				
				timelines = new Timelines("timelines", 
							  			  new Date("1/1/1997"), 
							  			  new Date("2/28/2013"),
							  			  country);

		  		table = new Table("chronology", country);

		  		//interactionsTable = new InteractionsTable("#interactionsPanel", country);
				//graphView = new GraphView("#interactionsPanel", country);
				
				controls = new Controls(ps, country);

				$.when(mapPromise).done(function() {
				
					if(firstTime) {
						makeCountryList("countrySelector");
					}

					controls.attachEventHandlers();

					$('a[data-toggle="tab"]').on('shown', function (e) {
							selectedTab = e.target.attributes.href.value;
							redrawOnTabSwitch(country);
					});

					if(!firstTime) {
						$('#load-data').modal('hide');
					}

					firstTime = false;
				});
	  	});
}
