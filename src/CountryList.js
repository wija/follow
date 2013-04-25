//CountryList.js

//parentElement = "countrySelector"

function makeCountryList(parentElement) {
	
	var countryList = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
		"Central African Republic","Chad", "Democratic Republic of the Congo", "Djibouti", "Egypt", 
		"Equatorial Guinea", "Eritrea", "Ethiopia","Gabon", "Gambia", "Ghana", "Guinea-Bissau", "Guinea", 
		"Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", 
		"Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Republic of Congo", 
		"Rwanda", "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", 
		"Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"];

		var s = document.getElementById(parentElement);
		var htmlStr = "";
		for(var i = 0; i < countryList.length; i++) {
			htmlStr += '<label class="radio">'
						+ '<input type="radio" name="countryOptionsRadios" id="countryOptions" value="' + countryList[i].replace(/ /g,'_') + '" unchecked>'
						+ countryList[i]
						+ '</label>';
		}
		s.innerHTML = htmlStr;

/*
	var s ="";
	countryList.forEach(function(v) { 
		s += "<div><a onclick=\"loadNewCountry('" + v.replace(/ /g, "_") + "');\">" + v + "</a></div>"; 
	});
*/
	document.getElementById(parentElement).innerHTML = s;
}

function getRadioButtonValueAndLoad() {
	var radios = document.getElementsByName("countryOptionsRadios");

	for (var i = 0, length = radios.length; i < length; i++) {
	    if (radios[i].checked) {
	    	loadNewCountry(radios[i].value.replace(/ /g, "_"));
	    }
	}
}
