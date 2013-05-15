p = new Palette();
dateFormat = d3.time.format("%x");

startDate = null;
endDate = null;

fatalitySizing = true;

selectedTab = "#map";

masterCachedResultArr = [];

function redraw(country, resultArr) {
	
	if(tabHash[selectedTab] && tabHash[selectedTab].redraw)
		tabHash[selectedTab].redraw(resultArr);

	masterCachedResultArr = resultArr;
}

function redrawOnTabSwitch(country) {

	if(tabHash[selectedTab] && tabHash[selectedTab].redraw)
		tabHash[selectedTab].redraw(masterCachedResultArr);
}

firstTime = true;

function loadNewCountry(country) {
	
	if(!firstTime) {
		controls.destruct();
		for(var t in tabHash)
			tabHash[t].destruct();
	}

	var tabs;

	loadDataset(country, redraw.bind(null, country))
		.done(function() {

				var mapPromise = new Map(country, "map");
				
				mapPromise.done(function(m) {
						mapObj = m;
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
					
					tabHash = { "#map": mapObj,
		     			        "#timelines": timelines,
		     			        "#chronology": table};

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
