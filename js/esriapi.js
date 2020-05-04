define([
	"esri/layers/ArcGISDynamicMapServiceLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/query" ,"esri/tasks/QueryTask", "dojo/_base/declare", "esri/layers/FeatureLayer", 
	"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", "esri/tasks/IdentifyTask", 
	"esri/tasks/IdentifyParameters","esri/dijit/Popup","dojo/dom-construct", "dojo/_base/array"
],
function ( 	ArcGISDynamicMapServiceLayer, Extent, SpatialReference, Query, QueryTask, declare, FeatureLayer, 
			SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color, IdentifyTask, IdentifyParameters, 
			Popup, domConstruct, arrayUtils ) {
        "use strict";

        return declare(null, {
			esriApiFunctions: function(t){	
				// Add dynamic map service
				t.dynamicLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.75});
				t.map.addLayer(t.dynamicLayer);	
				t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
				t.dynamicLayer.on("load", function () { 			
					t.layersArray = t.dynamicLayer.layerInfos;
					// query state layer
					let queryTask = new esri.tasks.QueryTask(t.url + "/0"); 
					let query = new esri.tasks.Query(); 
					query.returnGeometry = true; 
					query.outFields = ["NAME","STATE","CRS"]; query.where = "1=1";  
					queryTask.execute(query, function (fset) {   
						// set map extent based on states
						t.stateFeatures = fset.features;
						t.map.setExtent(esri.graphicsExtent(fset.features).expand(1.5)); 
						$.each(t.stateFeatures,function(i,v){
							$(`#${t.id}crs_state_chosen`).append(`
								<option value="${v.attributes.STATE}">${v.attributes.NAME}</option>
							`)
						})
						$(`#${t.id}crs_state_chosen`).val(t.obj.st).trigger("change").trigger("chosen:updated");
					});	
				});	
				// Add reference layers map service
				t.supportingLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.6});
				t.map.addLayer(t.supportingLayer);	
				t.supportingLayer.setVisibleLayers(t.obj.supportingLayers);
			},
			clearGraphics: function(t){
				$('#' + t.descID).hide();
				t.map.graphics.clear();
			}
		});
    }
);