//atlasify.js

//npm install xml2js
//ogr2ogr
//naturalearth data

var parseString = require('xml2js').parseString,
	http = require('http'),
	exec = require('child_process').exec,
	fs = require('fs');

var buffer = "";

function getCountryBoundingBoxes() {
	http.get({ host: 'ws.geonames.org', port: 80, path: '/countryInfo?' }, function(resp) {
	  	resp.setEncoding('utf8');
	    resp.on('data', function(chunk) {
	    	buffer += chunk;
	    });
	    resp.on('end', function() {
	    	parseString(buffer, function (err, result) {
	    		var countryArray = result.geonames.country.filter(function(o) { 
	    				return o.continent[0] === "AF"; 
	    			});
	    		makeMapFiles(countryArray, []);
			});
	    });
	}).on("error", function(e) {
		throw e;
	});
}

function makeMapFiles(countryArray, jsonArray) {

	/*
	/Users/williamabresch/Sites/atlasify/atlasify.js:46
		countryWidth = Math.abs(country.east[0] - country.west[0]),
		                               ^
	TypeError: Cannot read property 'east' of undefined
    at makeMapFiles (/Users/williamabresch/Sites/atlasify/atlasify.js:46:34)
    at ChildProcess.<anonymous> (/Users/williamabresch/Sites/atlasify/atlasify.js:95:3)
    at ChildProcess.EventEmitter.emit (events.js:98:17)
    at Process.ChildProcess._handle.onexit (child_process.js:757:12)

	*/
	if(countryArray.length === 0) {
		writeBoundingBoxFile(jsonArray);
	}

	var country = countryArray[0];

	//really an aspect ratio
	var imageWidth = 700,
		imageHeight = 420;

	var adjust = 0.1, //a propertion expressed as 0-1
		countryWidth = Math.abs(country.east[0] - country.west[0]),
		countryHeight = Math.abs(country.north[0] - country.south[0]),
		adjustedWest = +country.west[0] - countryWidth * adjust,
		adjustedEast = +country.east[0] + countryWidth * adjust,
		adjustedNorth = +country.north[0] + countryHeight * adjust,
		adjustedSouth = +country.south[0] - countryHeight * adjust;

	var xScale = countryWidth / imageWidth,
		yScale = countryHeight / imageHeight;

	var desiredCountryHeight, 
		desiredCountryWidth,
		excess;
	if(yScale > xScale) {
		desiredCountryWidth = imageWidth * yScale;
		excess = (desiredCountryWidth - countryWidth) / 2;
		adjustedWest = +country.west[0] - excess;
		adjustedEast = +country.east[0] + excess;
	} else {
		desiredCountryHeight = imageHeight * xScale;
		excess = (desiredCountryHeight - countryHeight) / 2;
		adjustedNorth = +country.north[0] + excess;
		adjustedSouth = +country.south[0] - excess;
	}

	console.log(Math.abs(adjustedNorth - adjustedSouth) / Math.abs(adjustedEast - adjustedWest));

	var jsonItem = { countryName: country.countryName[0],
					 countryCode: country.countryCode[0],
					 isoNumeric:  country.isoNumeric[0],
					 isoAlpha3:   country.isoAlpha3[0],
					 fipsCode: 	  country.fipsCode[0], 
					 filename: 	  country.countryName[0].replace(/ /g, "_") + '.json',
					 west: 		  adjustedWest,
					 east: 		  adjustedEast,
					 north: 	  adjustedNorth,
					 south:       adjustedSouth
 				   };

	jsonArray.push(jsonItem);

	console.log(JSON.stringify(jsonItem));

	exec('bash mapit.sh ' + country.countryName[0].replace(/ /g, "_") + ' '
		 + adjustedWest + ' ' + adjustedNorth + ' ' + adjustedEast + ' ' + adjustedSouth,
			function (error, stdout, stderr) {
			    if (error !== null) {
			      throw 'exec error: ' + error;
			    }	    
	}).on("exit", function() { 
		countryArray.shift(); 
		makeMapFiles(countryArray, jsonArray); 
	});
}

function writeBoundingBoxFile(jsonArray) {
	fs.writeFile(

			"bounding_boxes.json",
			
			JSON.stringify(jsonArray),

			function(e) { if (e) throw e; }
		);
}

getCountryBoundingBoxes();

