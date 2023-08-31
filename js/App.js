require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/layers/FeatureLayer",
    "esri/widgets/Home",
    "esri/widgets/Compass",
    "esri/layers/MapImageLayer",
    "esri/geometry/Extent",
    "esri/widgets/Expand",
    "esri/smartMapping/statistics/uniqueValues",
    "esri/renderers/UniqueValueRenderer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    // "esri/tasks/QueryTask",
], function (esriConfig, Map, MapView, LayerList, Legend, FeatureLayer, Home, Compass, MapImageLayer, Extent, Expand, uniqueValues,
    UniqueValueRenderer, SimpleRenderer, SimpleLineSymbol, SimpleFillSymbol) {

    esriConfig.apiKey = "AAPK811a6499c49e4dc685b5a1c88bba8013U8rHgJQQ60DJXrMaJ66YEy8x_T658bsAto1_0XNFL_8CU_qbGQ0Gl4P4xazN4cBw";

    const map = new Map({
        //   basemap: "arcgis-light-gray"
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        zoom: 8
    });

    // Add map service layer
    const allLayers = new MapImageLayer({
        url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Water_Network/MapServer",
        supportsStatistics: true,
    });

    map.layers.add(allLayers);
    const homeWidget = new Home({
        view: view
    });

    view.ui.add(homeWidget, "top-left");

    const compassWidget = new Compass({
        view: view
    });

    view.ui.add(compassWidget, "top-left");

    // Add LayerList widget
    const layerList = new LayerList({
        view: view
    });

    // Add Legend widget
    const legend = new Legend({
        view: view
    });

    const legendExpand = new Expand({
        expandIconClass: "esri-icon-layer-list",
        view: view,
        content: legend,
        expandIconClass: "esri-icon-legend",
        expandTooltip: "Legend"
    });

    const layerListExpand = new Expand({
        expandIconClass: "esri-icon-layer-list",
        view: view,
        content: layerList,
        expandTooltip: "Layerlist"
    });

    view.ui.add(layerListExpand, 'top-right')
    view.ui.add(legendExpand, 'bottom-left')

    const sublayers = allLayers.allSublayers.items;

    // Calculate the overall extent
    let overallExtent = null;
    sublayers.forEach(sublayer => {
        if (sublayer.visible) {
            if (!overallExtent) {
                overallExtent = sublayer.fullExtent.clone();
            } else {
                overallExtent = overallExtent.union(sublayer.fullExtent);
            }
        }
    });

    if (overallExtent) {
        // Set the map's extent to the overall extent
        view.extent = overallExtent;
        // Set the map's center to the center of the extent
        view.center = overallExtent.center;
    }

    const customWidg = document.getElementById('customWidget')
    const customWig_Expand = new Expand({
        expandIconClass: "esri-icon esri-icon-filter",
        view: view,
        content: customWidg,
        expandTooltip: "Visualise Layer"
    });
    view.ui.add(customWig_Expand, 'top-left')
    var qryBTN = document.getElementById('queryButton')
    const selectOption = document.getElementById('selectOption')
    var FieldVal = document.getElementById('selectFieldValues')
    var highlights = [];

    var featLyr

    FieldVal.addEventListener('change', async () => {

        var selectedField = selectOption.value
        var option = FieldVal.value;
        const sublayerId = 16;
        const sublayer = allLayers.findSublayerById(sublayerId);

        if (sublayer) {

            const query = sublayer.createQuery();
            if (selectOption.value == 'material') {
                query.where = selectOption.value + "=" + "'" + option + "'"
            }
            else { query.where = selectOption.value + "=" + option }
            // console.log("where is this", query.where)
            // console.log(" is this", query)
            query.returnGeometry = true;
            query.outFields = ['material'];

            const queryResult = await sublayer.queryFeatures(query)

            const renderer = new UniqueValueRenderer({
                field: selectedField,
                defaultSymbol: new SimpleLineSymbol({ color: "gray", width: 1 }), // Default symbol
                uniqueValueInfos: [{
                    value: queryResult.features[0].attributes[selectedField], // Use the attribute from the first feature
                    symbol: new SimpleLineSymbol({ color: "red", width: 2 }) // Custom symbol
                }]
            });

            // Apply the renderer to the sublayer
            if (featLyr) {
                // Update the renderer of the existing FeatureLayer
                featLyr.renderer = renderer;
                // Refresh the layer to apply the new renderer

            } else {
                // Create the FeatureLayer and add it to the map
                featLyr = new FeatureLayer({
                    url: sublayer.url,
                    renderer: renderer
                });
                map.add(featLyr);
            }



        }

    })
    selectOption.addEventListener("change", async function () {
        var selectedValue = selectOption.value;
        var selectionOption = ''
        if (selectedValue == 'material') {
            selectionOption = 'material'
        }
        else {
            selectionOption = 'diameter'

        }
        console.log(selectedValue)
        // Access the sublayer by ID (16 in this case)
        const sublayerId = 16;
        const sublayer = allLayers.findSublayerById(sublayerId);


        console.log(sublayer, sublayer.id)
        fetchValues(sublayer, 'material')


        fetchValues(sublayer, 'diameter')


        // if (sublayer) {
        //     // Create a Query object to get unique values
        //     const query = sublayer.createQuery();
        //     query.where = "1=1"; // Fetch all features
        //     query.returnGeometry = true
        //     query.returnDistinctValues = true;
        //     query.outFields = [selectionOption]; // Field for which to fetch values

        //     // Query the layer to get unique values
        //     const queryResult = await sublayer.queryFeatures(query);
        //     const uniqueValues = queryResult.features.map(feature => feature.attributes[selectionOption]);
        //     console.log(uniqueValues)
        //     // Populate the dropdown with unique values
        //     const selectElement = document.getElementById("selectOption");
        //     selectElement.innerHTML = ""; // Clear existing options

        //     uniqueValues.forEach(value => {
        //         const optionElement = document.createElement("option");
        //         optionElement.value = value;
        //         optionElement.textContent = value;
        //         selectElement.appendChild(optionElement);
        //     });
        // }
        if (sublayer) {
            // Create a Query object
            const query = sublayer.createQuery();
            query.returnGeometry = false;
            query.outFields = [selectedValue];
            query.returnDistinctValues = true;

            // Execute the query and get distinct values
            const queryResult = await sublayer.queryFeatures(query);
            const distinctValues = queryResult.features.map(feature => feature.attributes[selectedValue]);

            console.log("Distinct values:", distinctValues, "length", distinctValues.length);

            populateField(distinctValues)

            // // Create symbols for each unique value (you need to define your symbols here)
            // const uniqueValueInfos = distinctValues.map(value => {
            //     return {
            //         value: value,
            //         symbol: new SimpleLineSymbol({ color: "red", width: 2 }) // You need to implement this function
            //     };
            // });

            // Create the UniqueValueRenderer
            const renderer = new UniqueValueRenderer({
                field: selectedValue, // Field to render based on
                defaultSymbol: new SimpleLineSymbol({ color: "gray", width: 1 }), // Default symbol
                uniqueValueInfos: [{
                    value: queryResult.features[0].attributes[selectedField], // Use the attribute from the first feature
                    symbol: new SimpleLineSymbol({ color: "red", width: 2 }) // Custom symbol
                }]
            });
            // Apply the renderer to the sublayer
            sublayer.renderer = renderer;
        }

    });
    function fetchValues(layer, field) {
        var item = []
        uniqueValues({
            layer: layer,
            field: field
        }).then(function (response) {


            // prints each unique value and the count of features containing that value
            let infos = response.uniqueValueInfos;
            infos.forEach(function (info) {
                item.push(info.value)
                // district_Statewise = { 'State': '', 'district': '' }
            });
            // data.push(district_Statewise)
            console.log(item.length, item)

        })
    }
    function populateField(val) {

        // Populate the <select> element
        const selectElement = document.getElementById("selectFieldValues");
        selectElement.style.display = 'block'
        selectElement.innerHTML = ""; // Clear existing options

        val.forEach(value => {
            const optionElement = document.createElement("option");
            optionElement.value = value;
            optionElement.textContent = value;
            selectElement.appendChild(optionElement);
        });
    }
});
