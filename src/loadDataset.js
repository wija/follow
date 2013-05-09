//loadDataset.js

//dataset left global for now

function loadDataset(country, qtCallback) {

	var deferred = $.Deferred();

	var jsonArray;

	$.getJSON('data/' + country + '.json')
		.done(function(jsonArray) {

			/* hacky way to jitter the points because too much overlap due to imprecise coordinates */
			var lonJitterBase = 10, latJitterBase = 10;  //would ideally relate to display dimensions
			for(var i = 0, n = jsonArray.length; i < n; i++) {
					jsonArray[i].LATITUDE_JITTER = (Math.random() - 0.5) * latJitterBase;
					jsonArray[i].LONGITUDE_JITTER = (Math.random() - 0.5) * lonJitterBase;
			}

			return jsonArray;
		})
		.done(function(jsonArray) {

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

		})
		.done(function() { 
			deferred.resolve(); 
		});

	return deferred.promise();
}
