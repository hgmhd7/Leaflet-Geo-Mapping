
// Get and store the USGS all earthquakes from last week link
lw_eq_link = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
fault_line_link = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";


function getColor(magnitude) {

    // Abriviatted switch case clase to change circle colors
    return magnitude >= 5 ? "#ff0000" :
        magnitude >= 4 ? "#ff8000" :
            magnitude >= 3 ? "#ffb266" :
                magnitude >= 2 ? "#ffff66" :
                    magnitude >= 1 ? "#b2ff66" :
                        "#80ff00";
};


function circleRadius(magnitude) {

    // Change the radius of circles based off of magnitude
    return magnitude * 3.5
};


// Create the satellite tile layer 
var satMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 3,
    id: "satellite-streets-v9",
    accessToken: API_KEY
});

// Create the light tile layer 
var greyMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 3,
    id: "light-v9",
    accessToken: API_KEY
});

// Create the dark tile layer 
var darkMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 3,
    id: "dark-v9",
    accessToken: API_KEY
});

// Create the outdoors tile layer
var outdoorsMap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 3,
    id: "outdoors-v9",
    accessToken: API_KEY
});



// Create a baseMaps object to hold the different layers
var baseMaps = {
    "Satellite Map": satMap,
    "Greyscale Map": greyMap,
    "Night Map": darkMap,
    "Outdoors Map": outdoorsMap
};


// Function to create maps and markers
function createMarkers() {


    // Load the earthquake and fault line data using these fetch statements then pass the data we assigned in the variables to the rest of the promise
    var earthquakeData = fetch(lw_eq_link).then(response => response.json()).then(data => {
        console.log("Earthquake Data Promise In Progress");
        earthquake_data = data;
    })

    var faultLineData = fetch(fault_line_link).then(response => response.json()).then(data => {
        console.log("Fault Line Data Promise In Progress");
        fault_line_data = data;
    })

    Promise.all([earthquakeData, faultLineData]).then(function () {

        // Pull the earthquake data to loop through
        var lw_earthquakes_data = earthquake_data.features;

        // // DEBUGGER TO CHECK DATA
        // console.log(earthquake_data);
        // console.log(fault_line_data);


        // Initialize an array to hold earthquake markers
        var eqDataPoints = [];

        // Loop through the lw_earthquakes_data array
        for (var index = 0; index < lw_earthquakes_data.length; index++) {
            var eq = lw_earthquakes_data[index];

            // For each earthquake, create a marker and bind a popup with the earthquakes key info
            var eqMarker = L.circleMarker([eq.geometry.coordinates[1], eq.geometry.coordinates[0]],
                {
                    radius: circleRadius(eq.properties.mag),
                    fillColor: getColor(eq.properties.mag),
                    stroke: true,
                    color: "black",
                    weight: 0.5,
                    fillOpacity: 1
                })
                .bindPopup("<h3>Location: " + eq.properties.place + "<h3><h3>Time: " + Date(eq.properties.time) + "<h3><h3>Magnitude: "
                    + eq.properties.mag);

            // Add the marker to the eqDataPoints arrayfor plotting
            eqDataPoints.push(eqMarker);

        }

        // Style object for the fault lines
        var mapStyle = {
            color: "orange",
            fillOpacity: 0.5,
            weight: 1.5
        };

        // Pull the fault line data to loop through
        var BaseFaultDataPoints = fault_line_data.features;

        // Create the layers for the earthquakes and fault lines
        var earthquakes = L.layerGroup(eqDataPoints);

        var faultLayer = L.geoJson(BaseFaultDataPoints, {
            // Passing in our style object
            style: mapStyle
        });




        // Create the map object with options
        var map = L.map("map", {
            center: [37.0902, -95.7129],
            zoom: 3,
            layers: [satMap, earthquakes, faultLayer],
        });


        // Create controls for the legend
        var legend = L.control({ position: 'bottomright' });


        //  Add legend with color scale for the magnitude
        legend.onAdd = function () {

            var div = L.DomUtil.create('div', 'info legend'),
                magnitudes = [0, 1, 2, 3, 4, 5];

            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < magnitudes.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(magnitudes[i] + 1) + '"></i> ' +
                    //    `<i id= 'id${1}'>  </i>`  +
                    magnitudes[i] + (magnitudes[i + 1] ? '-' + magnitudes[i + 1] + '<br>' : '+');
            }

            return div;
        };

        legend.addTo(map);


        // Create an overlayMaps object to hold the earthquakes and fault lines layers
        var overlayMaps = {
            "Earthquakes": earthquakes,
            "Fault Lines": faultLayer

        };

        // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
        L.control.layers(baseMaps, overlayMaps, {
            collapsed: false
        }).addTo(map);

    });

}

// Initiate the code with a call of the createMarkers function
createMarkers()





