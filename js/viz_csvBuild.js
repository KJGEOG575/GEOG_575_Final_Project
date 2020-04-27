// wrap everything in self execting anon function to move the local scope
(function() {

	var attrArray = ["2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"];
    var costAttrArray = ["Structures", "Fatalities", "Economic_C"];

	var expressed = attrArray[0]; //initial attribute
    var costExpressed = costAttrArray[2]; //initial attribute

	//chart frame dimensions
	var chartWidth = window.innerWidth * 0.25,
		chartHeight = 500,
		leftPadding = 35,
		rightPadding = 2,
		topBottomPadding = 5,
		chartInnerWidth = chartWidth - leftPadding - rightPadding,
		chartInnerHeight = chartHeight - topBottomPadding * 2,
		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

	//create a scale to size bars proportionally to frame and for axis
	var yScale = d3.scaleLinear()
		.range([463, 0])
		.domain([0, 3000]);


	var zoomSettings = {
		duration: 1000,
		ease: d3.easeCubicOut,
		zoomLevel: 5
	};

//begin script when window loads
	window.onload = setMap();

//set up choropleth map
	function setMap() {

		//map frame dimensions
		var width = window.innerWidth * 0.7,
			height = window.innerHeight * 1;

		//create new svg container for the map
		var map = d3.select("#map-container")
			.append("svg")
			.attr("class", "map")
			.attr("width", width)
			.attr("height", height);

		var g = map.append("g");

		map.call(d3.zoom().on("zoom", () => {
			g.attr("transform", d3.event.transform);
		}));

		//create geoconicconformal conic projection centered on US
		var projection = d3.geoAlbers()
			.center([-5, 37])
			.rotate([97, 0])
			.parallels([40, 45])
			.scale(1600)
			.translate([width / 2, height / 2]);

		//create path generator
		var path = d3.geoPath()
			.projection(projection);

        
        //use d3-queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv, "data/US_States_Data_Selection.csv") //load attributes from csv
        .defer(d3.csv, "data/FireData.csv")//load csv attributes for fire polygons
		.defer(d3.json, "data/US_StatesTopojson.topojson") //load background spatial data
		.defer(d3.json, "data/US_States_selection_topo.topojson") //load choropleth spatial data
		.defer(d3.json, "data/Fire_Polygon.topojson") //load fires polygon data
		.await(callback); //trigger callback function once data is loaded

		function callback(error, csvData, csvfireData, countryData, statesData, firesData) {

			//place graticule on the map
			setGraticule(g, path);

			//translate usStates topojson
			var naCountries = topojson.feature(countryData, countryData.objects.US_States), //load background spatial data
				selectStates = topojson.feature(statesData, statesData.objects.US_States_selection).features, //load choropleth data
				firePolygons = topojson.feature(firesData, firesData.objects.Fire_Buffer_Clean).features;  //load fire data

			console.log(selectStates);
			console.log(firePolygons);

			//add NA countries to map
			var northAmerica = g.append("path")
				.datum(naCountries)
				.attr("class", "countries")
				.attr("d", path);

			// join csv data to Geojson enumerration units
			selectStates = joinData(selectStates, csvData);
            
            // join csv data to Geojson fire poly units
			firePolygons = joinDataFirePoly(firePolygons, csvfireData);

			// create color scale states
			var colorScale = makeColorScale(csvData);
            
            // create color scale forest fire cost polygons
			var colorScaleCost = makeColorScaleCost(csvfireData);

			//add enumeration units to the map
			setEnumerationUnits(selectStates, g, path, colorScale);

			//add coordinated viz to map
			setChart(csvData, colorScale);

			createDropdown(csvData);
                    
            toggleFires(path, g, firePolygons, colorScaleCost);
            
            createCostFireDropdown(csvfireData)

           

		};
	};   // end of setMap()

	//function to create color scale generator for states
	function makeColorScale(data) {
		var colorClasses = [
        "#FEF0D9",
        "#FDCC8A",
        "#FC8D59",
        "#D7301F"
		];

		// create color scale generator
		var colorScale = d3.scaleThreshold()
			.range(colorClasses);

		// build array of all values of the expressed attribute
		var domainArray = [];
		for (var i=0; i < data.length; i++){
			var val = parseFloat(data[i][expressed]);
			domainArray.push(val);
		};

		// cluster data using ckmeans clustering algorith to create natural breaks
		var clusters = ss.ckmeans(domainArray, 5);
		//reset domain array to cluster minimums
		domainArray = clusters.map(function (d) {
			return d3.min(d);
		});

		// remove first value from domain array to create class breakpoints
		domainArray.shift();

		//assign array of last 4 cluster minimums as domain
		colorScale.domain(domainArray);

		return colorScale;
	};
    
	//function to create color scale generator for fire polygons
	function makeColorScaleCost(data) {
		var colorClassesCost = [
        "#edf8e9",
        "#bae4b3",
        "#74c476",
        "#238b45"
		];

		// create color scale generator
		var colorScaleCost = d3.scaleThreshold()
			.range(colorClassesCost);

		// build array of all values of the expressed attribute
		var domainArrayCost = [];
		for (var j=0; j < data.length; j++){
			var costVal = parseFloat(data[j][expressed]);
			domainArrayCost.push(costVal);
		};

		// cluster data using ckmeans clustering algorith to create natural breaks
		var costClusters = ss.ckmeans(domainArrayCost, 5);
		//reset domain array to cluster minimums
		domainArrayCost = costClusters.map(function (d) {
			return d3.min(d);
		});

		// remove first value from domain array to create class breakpoints
		domainArrayCost.shift();

		//assign array of last 4 cluster minimums as domain
		colorScaleCost.domain(domainArrayCost);

		return colorScaleCost;
	};

	function setGraticule(map, path) {
		//create graticule generator
		var graticule = d3.geoGraticule()
			.step([15, 15]); //place graticule lines every 5 degrees of longitude and latitude

		//create graticule background
		var gratBackground = map.append("path")
			.datum(graticule.outline())   // bind graticule background
			.attr("class", "gratBackground")  //assign class for styling
			.attr("d", path) //project graticule

		//create graticule lines
		var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
			.data(graticule.lines()) //bind graticule lines to each element to be created
			.enter() //create an element for each datum
			.append("path") //append each element to the svg as a path element
			.attr("class", "gratLines") //assign class for styling
			.attr("d", path); //project graticule lines

	};
    
    //function to join states json and csv data
	function joinData(selectStates, csvData){
		for (var i = 0; i < csvData.length; i++) {
			var csvState = csvData[i]; // the current state
			var csvKey = csvState.NAME; //the csv primary key

			//loop through geojson states to find correct state
			for (var a = 0; a < selectStates.length; a++) {
				var geojsonProps = selectStates[a].properties; // the current state geojson properties

				var geojsonKey = geojsonProps.NAME //the geojson primary key

				//where primary keys match, transfer csv data to geojson properties object
				if (geojsonKey == csvKey) {

					// assign all attributes and values
					attrArray.forEach((function (attr) {
						var val = parseFloat(csvState[attr]);  // get csv attribute value

						console.log("var val = " + val);
						console.log(csvState[attr]);

						geojsonProps[attr] = val;  // assign attribute and value to geojson properties

						console.log(geojsonProps[attr]);
					}));
				};
			};
		};


		console.log(csvData);
		console.log(selectStates);

		return selectStates;
	};
        //function to join fire polys and fire csv data
    	function joinDataFirePoly(firePolygons, csvfireData){
		for (var i = 0; i < csvfireData.length; i++) {
			var csvfirePoly = csvfireData[i]; // the current state
			var csvfirePolyKey = csvfirePoly.fire_name; //the csv primary key

			//loop through geojson states to find correct state
			for (var a = 0; a < firePolygons.length; a++) {
				var topojsonProps = firePolygons[a].properties; // the current state geojson properties

				var topojsonKey = topojsonProps.fire_name //the geojson primary key

				//where primary keys match, transfer csv data to geojson properties object
				if (topojsonKey == csvfirePolyKey) {

					// assign all attributes and values
					costAttrArray.forEach((function (attr) {
						var val = parseFloat(csvfirePoly[attr]);  // get csv attribute value

						console.log("var val = " + val);
						console.log(csvfirePoly[attr]);

						topojsonProps[attr] = val;  // assign attribute and value to geojson properties

						console.log(topojsonProps[attr]);
					}));
				};
			};
		};


		console.log(csvfireData);
		console.log(firePolygons);

		return firePolygons;
	};

	function setEnumerationUnits(selectStates, map, path, colorScale){
		var states = map.selectAll(".selectStates")
			.data(selectStates)
			.enter()
			.append("path")
			.attr("class", function (d) {
				return "selectStates " + d.properties.NAME;
			})
			.attr("d", path)
            .attr("opacity", 0)
			.style("fill", function (d) {
				return choropleth(d.properties, colorScale);
		})
			.on("mouseover", function (d) {
				highlight(d.properties);
			})
			.on("mouseout", function (d) {
				dehighlight(d.properties);
		})
			.on("mousemove", moveLabel);

		var desc = states.append("desc")
			.text('{"stroke": "#000", "stroke-width": "0.5px"}');
	};


        //define function to toggle fire polygons 
        function toggleFires(path, map, firePolygons,colorScaleCost) {
           var fires = map.append("g");
            
           console.log(fires);
            
           fires.selectAll("path")
              .data(firePolygons)
              .enter()
              .append("path")
              .attr("fill", "#000")
              .attr("stroke", "#999")
              .attr("d", path)
              .attr("class", "fire-polygons")
              .attr("opacity", 0)
                .style("fill", function (d) {
				    return choropleth(d.properties, colorScaleCost);
            
           console.log(fires);
        };



	//function to test for data value and return color
	function choropleth(props, colorScale) {
		//make sure attribute value is a number
		var val = parseFloat(props[expressed]);
		//if attribute value exists, assign a color, otherwise assign gray
		if (typeof val == 'number' && !isNaN(val)) {
			return colorScale(val);
		} else {
			return "#CCC";
		};
	};

	// function to create a dropdown menu for attribute selection for states
	function createDropdown(csvData) {
		//add select element
		var dropdown = d3.select(".year-dropdown")
			.append("select")
			.attr("class", "dropdown")
			.on("change", function(){
				changeAttribute(this.value, csvData)
			});

		//add initial option
		var titleOption = dropdown.append("option")
			.attr("class", "titleOption")
			.attr("disabled", "true")
			.text("Select Year");

		//add attribute name options
		var attrOptionsState = dropdown.selectAll("attrOptionsState")
			.data(attrArray)
			.enter()
			.append("option")
			.attr("value", function(d) {return d})
			.text(function (d) {return d});

	};
	// function to create a dropdown menu for attribute selection for cost fire polys
	function createCostFireDropdown(csvfireData) {
		//add select element
		var dropdown = d3.select(".cost-dropdown")
			.append("select")
			.attr("class", "dropdown")
			.on("change", function(){
				changeAttribute(this.value, csvfireData)
			});

		//add initial option
		var titleOption = dropdown.append("option")
			.attr("class", "titleOption")
			.attr("disabled", "true")
			.text("Select Damage");

		//add attribute name options
		var attrOptionsCost = dropdown.selectAll("attrOptionsCost")
			.data(costAttrArray)
			.enter()
			.append("option")
			.attr("value", function(d) {return d})
			.text(function (d) {return d});

	};

	//dropdown change listener handler for states
	function changeAttribute(attribute, csvData){
		//change the expressed attribute
		expressed = attribute;

		console.log(expressed);
		console.log(csvData);

		//recreate the color scale
		var colorScale = makeColorScale(csvData);

		//recolor enumeration units
		var states = d3.selectAll(".selectStates")
			.transition()
			.duration(1000)
			.style("fill", function(d){
				return choropleth(d.properties, colorScale)
			});

		//re-sort, resize, and recolor bars
		var bars = d3.selectAll(".bar")
			//re-sort bars
			.sort(function(a, b){
				return b[expressed] - a[expressed];
			})
			.transition() // add animation
			.delay(function(d, i) {
				return i * 20
			})
			.duration(500);

			// });

		updateChart(bars, csvData.length, colorScale);

	};
    
    	//dropdown change listener handler for cost fire polygons
	function changeAttribute(attribute, csvfireData){
		//change the expressed attribute
		costExpressed = attribute;

		console.log(costExpressed);
		console.log(csvfireData);

		//recreate the color scale
		var colorScaleCost = makeColorScaleCost(csvfireData);

		//recolor enumeration units
		var fires = d3.selectAll(".firePolygons")
			.transition()
			.duration(1000)
			.style("fill", function(d){
				return choropleth(d.properties, colorScaleCost)
			});

	};

	function updateChart(bars, n, colorScale) {
		// position bars
		bars.attr("x", function(d, i){
			return i * (chartInnerWidth / n) + leftPadding;
		})
		//resize bars
		.attr("height", function(d, i){
			console.log(d[expressed]);
			return 463 - yScale(parseFloat(d[expressed]));
		})
		.attr("y", function(d, i){
			return yScale(parseFloat(d[expressed])) + topBottomPadding;
		})
		//recolor bars
		.style("fill", function(d){
			return choropleth(d, colorScale);
		});

		var chartTitle = d3.select(".chartTitle")
            .text (expressed.replace(/_/g, " ") + "\n Wildfire Destruction in Total square miles");
			/*.text(expressed.replace(/_/g, " "));*/
	};

//function to create coordinated bar chart
	function setChart(csvData, colorScale){
		//create a second svg element to hold the bar chart
		var chart = d3.select("#chart-container")
			.append("svg")
			.attr("width", chartWidth)
			.attr("height", chartHeight)
			.attr("class", "chart");

		//create a rectangle for chart background fill
		var chartBackground = chart.append("rect")
			.attr("class", "chartBackground")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);



		//set bars for each province
		var bars = chart.selectAll(".bar")
			.data(csvData)
			.enter()
			.append("rect")
			.sort(function(a, b){
				return b[expressed]-a[expressed]
			})
			.attr("class", function(d){
				return "bar " + d.NAME;
			})
			.attr("width", chartInnerWidth / csvData.length -1)
			.on("mouseover", highlight)
			.on("mouseout", dehighlight)
			.on("mousemove", moveLabel);


		//create a text element for the chart title
		var chartTitle = chart.append("text")
			.attr("x", 100)
			.attr("y", 30)
			.attr("class", "chartTitle");


		//create vertical axis generator
		var yAxis = d3.axisLeft()
			.scale(yScale);
        
    

		//place axis
		var axis = chart.append("g")
			.attr("class", "axis")
			.attr("transform", translate)
			.call(yAxis);

		//create frame for chart border
		var chartFrame = chart.append("rect")
			.attr("class", "chartFrame")
			.attr("width", chartInnerWidth)
			.attr("height", chartInnerHeight)
			.attr("transform", translate);

		var desc = bars.append("desc")
			.text('{"stroke": "none", "stroke-width": "0px"}');

		updateChart(bars, csvData.length, colorScale);
	};

	//function to highlight enumeration units and bars
	function highlight(props){
		//change stroke
		var selected = d3.selectAll("." + props.NAME)
			.style("stroke", "blue")
			.style("stroke-width", "2");

		setLabel(props);
	};

	function dehighlight(props) {
		var selected = d3.selectAll("." + props.NAME)
			.style("stroke", function () {
				return getStyle(this, "stroke")
			})
			.style("stroke-width", function () {
				return getStyle(this, "stroke-width")
			});

		function getStyle(element, styleName) {
			var styleText = d3.select(element)
				.select("desc")
				.text();

			var styleObject = JSON.parse(styleText);

			return styleObject[styleName];
		};

		d3.select(".infolabel")
			.remove();
	};

	//function to create dynamic label for states
	function setLabel(props){
		//label content
		var labelAttribute = "<h2>" + props[expressed] +
			"</h2><b>" + expressed + "</b>";

		//create info label div
		var infolabel = d3.select("body")
			.append("div")
			.attr("class", "infolabel")
			.attr("id", props.adm1_code + "_label")
			.html(labelAttribute);

		var stateName = infolabel.append("div")
			.attr("class", "labelname")
			.html(props.NAME);
	};

	//function to move label with mouse
	function moveLabel(){
		//get width of label
		var labelWidth = d3.select(".infolabel")
			.node()
			.getBoundingClientRect()
			.width;

		//use coordinates of mousemove event to set label coordinates
		var x1 = d3.event.clientX + 10,
			y1 = d3.event.clientY - 75,
			x2 = d3.event.clientX - labelWidth - 10,
			y2 = d3.event.clientY + 25;

		//horizontal label coordinate, testing for overflow
		var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
		//vertical label coordinate, testing for overflow
		var y = d3.event.clientY < 75 ? y2 : y1;

		d3.select(".infolabel")
			.style("left", x + "px")
			.style("top", y + "px");
	};






})();
