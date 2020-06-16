define([
	"esri/layers/ArcGISDynamicMapServiceLayer", "esri/geometry/Extent", "esri/SpatialReference", "esri/tasks/query" ,"esri/tasks/QueryTask", "dojo/_base/declare", "esri/layers/FeatureLayer", 
	"esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol","esri/symbols/SimpleMarkerSymbol", "esri/graphic", "dojo/_base/Color", "esri/tasks/IdentifyTask", 
	"esri/tasks/IdentifyParameters","esri/dijit/Popup","dojo/dom-construct", "dojo/_base/array", "esri/dijit/BasemapToggle"
],
function ( 	ArcGISDynamicMapServiceLayer, Extent, SpatialReference, Query, QueryTask, declare, FeatureLayer, 
			SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, Graphic, Color, IdentifyTask, IdentifyParameters, 
			Popup, domConstruct, arrayUtils, BasemapToggle ) {
        "use strict";

        return declare(null, {
			esriApiFunctions: function(t){	
				var toggle = new BasemapToggle({
			    	map: t.map,
			    	basemap: "satellite"
			    }, "BasemapToggle");
			    toggle.startup();
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
				// Click on future parcels
				t.sym1  = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([204,0,0,1]), 2), new Color([88,116,215]);	
				t.map.on("click",function(c){
					//create identify tasks and setup parameters
					let identifyTask = new IdentifyTask(t.url);
					let identifyParams = new IdentifyParameters();
					identifyParams.tolerance = 3;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = [2];
					identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
					identifyParams.width = t.map.width;
					identifyParams.height = t.map.height;
					identifyParams.geometry = c.mapPoint;
         			identifyParams.mapExtent = t.map.extent;
         			identifyTask
            			.execute(identifyParams)
            			.addCallback(function (response) {
            				if (response[0]){
            					t.map.graphics.clear();
	            				t.atts = response[0].feature.attributes;
	            				response[0].feature.setSymbol(t.sym1);
	            				t.map.graphics.add(response[0].feature);
	            				$.each($("#popupAttWrap input"),function(i,v){
									var commaVal = t.atts[v.id];
									if (v.id != "OSP_ID"){
										if (!isNaN(commaVal)){
											commaVal = t.clicks.abbreviateNumberPopup(t.atts[v.id])
										}
										if (!isNaN(commaVal)){
											if ( $(`#${v.id}`).hasClass("round") ){
												commaVal = t.clicks.commaSeparateNumber(Number(t.atts[v.id]).toFixed(0))
											}else{
												commaVal = t.clicks.commaSeparateNumber(Number(t.atts[v.id]).toFixed(1))
											}
										}
									}
									if (v.id == "TAX_VALUE"){
										commaVal = "$"+commaVal;
									}
									$(v).val(commaVal)
									let len = commaVal.length;
									if (len < 12){
            							len = 12;
        							}
        							let l = len + 1;
									v.style.width = l + "ch"
								})
	            				$("#" + t.descID).show();
            				}else{
            					t.esriapi.clearGraphics(t);
            				}
            			})
				})
				$("#hideDesc").click(function(c){
					t.esriapi.clearGraphics(t);
				})	
			},
			clearGraphics: function(t){
				$('#' + t.descID).hide();
				t.map.graphics.clear();
			}
		});
    }
);