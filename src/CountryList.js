//CountryList.js

//parentElement = "countrySelector"

function makeCountryList(parentElement) {
	
	var countryList = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
		"Central African Republic","Chad", "Democratic Republic of the Congo", "Djibouti", "Egypt", 
		"Equatorial Guinea", "Eritrea", "Ethiopia","Gabon", "Gambia", "Ghana", "Guinea-Bissau", "Guinea", 
		"Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", 
		"Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Republic of Congo", 
		"Rwanda", "Senegal", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Spain", "Sudan", 
		"Swaziland", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"];

	var s ="";
	countryList.forEach(function(v) { 
		s += "<div><a onclick=\"loadNewCountry('" + v.replace(/ /g, "_") + "');\">" + v + "</a></div>"; 
	});

	document.getElementById(parentElement).innerHTML = s;
}
