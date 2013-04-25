//loadDataset.js

//dataset left global for now
/*
qtCallback =
function(resultArr) { 
				renderResults("dataTable", resultArr);
			}

callback = createInterface();
		   drawMap(country);
*/
function loadDataset(country, mapHeight, mapWidth, qtCallback, callback) {

	var jsonArray,
		jsonReady;

	$(window).unbind('JSONready');

	$.getJSON('data/' + country + '.json', function(response) {

		/* hacky way to jitter the points because too much overlap due to imprecise coordinates */
		var lonJitterBase = 0.01 * mapWidth,
			latJitterBase = 0.01 * mapHeight;
		for(var i = 0, n = response.length; i < n; i++) {
				response[i].LATITUDE_JITTER = (Math.random() - 0.5) * latJitterBase;
				response[i].LONGITUDE_JITTER = (Math.random() - 0.5) * lonJitterBase;
		}

   		jsonArray = response;
   		$(window).trigger('JSONready');
	});

	jsonReady = $(window).on('JSONready', function() {

		dataset = new db.Collection();

		dataset.loadData(

		  jsonArray,

			  { FATALITIES:  		{ index: db.NumberIndex },
			    COUNTRY:     		{ index: db.CategoryIndex },
			    ADM_LEVEL_1_BY_COUNTRY: { index: db.CategoryIndex,
			    					  	  opts: { keyExtractor: function(o) { return o.COUNTRY + '|' + o.ADM_LEVEL_1; }}}, 
			    EVENT_DATE:  		{ index: db.DateIndex }, 
			    EVENT_TYPE:  		{ index: db.CategoryIndex },
			    CONSOLIDATED_NOTES: { index: db.TextIndex }});

		ps = new db.QueryTemplate(

			dataset, 

			db.qtIntersect(
				db.qtField("EVENT_TYPE"), 
				db.qtField("EVENT_DATE"),
				db.qtField("CONSOLIDATED_NOTES")),

			qtCallback);

		callback();
	});
}