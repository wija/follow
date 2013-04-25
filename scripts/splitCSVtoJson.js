//splitCSVtoJson.js

//node splitCSVtoJson.js ACLED_All_Africa_1997-Feb_2013_tweaked.csv COUNTRY data

var d3 = require('d3'),
	fs = require('fs');
	
var args = process.argv.slice(2);

if(args.length !== 3) {
	throw "node splitCSVtoJson.js [filename] [property] [result-directory] ";
}

var filename = args[0],
	prop = args[1],
	resultDirectory = args[2];

if(!fs.existsSync(resultDirectory)) {
	fs.mkdirSync(resultDirectory);
}

var data = [],
	positionToHeader = {};

fs.readFile('bounding_boxes.json', function (err, data) {
  
	if (err) throw err;

	var boundingBoxes = JSON.parse(data);

	fs.readFile(filename, 'utf8', function (err, txt) {
	  
		if (err) throw err;

		var data = d3.csv.parse(txt);

		uniqueValues(data, prop).forEach(function(uniqueProp) {

			if(uniqueProp === "Democratic Republic of the Congo") {
				var lookupVal = "Congo"; 
			} else if(uniqueProp === "Republic of Congo") {
				var lookupVal = "Republic of the Congo";
			} else {
				var lookupVal = uniqueProp; 
			}

			var boundingBox = boundingBoxes.filter(function(o) { return o.countryName === lookupVal; })[0];
			
			if(typeof boundingBox === "undefined") {
			
				console.log("No bounding box found for " + uniqueProp);
			
			} else {

				fs.writeFile(

					resultDirectory + '/' + uniqueProp.replace(/ /g, "_") + '.json',
					
					JSON.stringify(data.filter(function(obj) {
						return inBoundingBox({longitude: +obj.LONGITUDE, latitude: +obj.LATITUDE}, boundingBox); 
					})),

					function(e) { if (e) throw e; }
				);
			}
		});
	});

});

function uniqueValues(arr, prop) {
	var h = {};
	for(var i = 0, n = arr.length; i < n; i++) {
		if(!h[arr[i][prop]]) {
			h[arr[i][prop]] = true;
		}
	}
	return Object.keys(h);
}

function inBoundingBox(point, box) {
	if(box.north >= point.latitude && point.latitude >= box.south){
		if(box.west <= box.east && box.west <= point.longitude && point.longitude <= box.east){
			return true;
		} else if(box.west > box.east && (box.west <= point.longitude || point.longitude <= box.east)) {
			return true;
		}
	}
	return false;
}

