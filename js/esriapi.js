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
				t.dynamicLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.5});
				t.map.addLayer(t.dynamicLayer);	
				t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
				t.dynamicLayer.on("load", function () { 			
					t.layersArray = t.dynamicLayer.layerInfos;
					if (t.obj.stateSet == "no"){
						t.map.setExtent(t.dynamicLayer.fullExtent.expand(0.6), true)
					}
					// set initial top control checks
					$.each($('#' + t.id + 'top-controls input'),function(i,v){
						if (t.obj[v.name] == v.value){
							$('#' + v.id).prop('checked', true);	
						}	
					});
					// reclick first checked item
					$.each($('#' + t.id + 'top-controls input'),function(i,v){
						if (v.checked){
							$('#' + v.id).trigger("click");
							return false;
						}
					})
					// Save and Share Handler					
					if (t.obj.stateSet == "yes"){
						// set slider values
						$.each(t.obj.slIdsVals,function(i,v){
							$('#' + t.id + v[0]).slider('values', v[1]);
						});	
						// checkboxes for sliders
						$.each(t.obj.slCbIds,function(i,v){
							$('#' + t.id + v).trigger('click');
						})
						// set radio buttons to checked state
						$.each(t.obj.rbIds,function(i,v){
							$('#' + t.id + v).attr('checked', true);
						})
						// checkboxes for radio buttons
						$.each(t.obj.rbCbIds,function(i,v){
							$('#' + t.id + v).trigger('click');
						})
						//extent
						var extent = new Extent(t.obj.extent.xmin, t.obj.extent.ymin, t.obj.extent.xmax, t.obj.extent.ymax, new SpatialReference({ wkid:4326 }))
						t.map.setExtent(extent, true);
						t.obj.stateSet = "no";
					}	
				});	
				// Add supporting layers map service
				if ( t.supLayersAdded ){
					t.supportingLayer = new ArcGISDynamicMapServiceLayer(t.url, {opacity:0.7});
					t.map.addLayer(t.supportingLayer);	
					t.supportingLayer.setVisibleLayers(t.obj.supportingLayers);
				}	
				t.sym1  = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([204,0,0,1]), 2), new Color([88,116,215]);	
				t.sym2 = new SimpleMarkerSymbol({"color": [255,255,255,0], "size": 10, "angle": 0, "xoffset": 0, "yoffset": 0, "type": "esriSMS",
							"style": "esriSMSCircle", "outline": {"color": [204,0,0], "width": 2, "type": "esriSLS", "style": "esriSLSSolid"}
						});
				t.map.on("click",function(c){	
					let layersToClickArray = [];
					if (t.supportingLayersObj.clickLayers){
						let ltc = t.supportingLayersObj.layersToClick;
						$.each(ltc,function(i,v){
							$.each(t.obj.supportingLayers,function(i1,v1){
								if (v == v1){
									layersToClickArray.push(v)
								}
							})
						})
					}
					layersToClickArray.push(Number(t.obj.hucLayer))
					//create identify tasks and setup parameters
					let identifyTask = new IdentifyTask(t.url);
					let identifyParams = new IdentifyParameters();
					identifyParams.tolerance = 3;
					identifyParams.returnGeometry = true;
					identifyParams.layerIds = layersToClickArray;
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
	            				if (t.atts.Shape == "Polygon"){
		            				response[0].feature.setSymbol(t.sym1);
		            			}
		            			if (t.atts.Shape == "Point"){
		            				response[0].feature.setSymbol(t.sym2);
		            			}	
	            				t.map.graphics.add(response[0].feature);
	            				$.each($("#popupAttWrap input"),function(i,v){
									var commaVal = t.atts[v.id];
									if (!isNaN(commaVal)){
										commaVal = t.clicks.abbreviateNumberPopup(t.atts[v.id])
									}
									if (!isNaN(commaVal)){
										if ( $(`#${v.id}`).hasClass("round") ){
											commaVal = t.clicks.commaSeparateNumber(Number(t.atts[v.id]).toFixed(0))
										}else{
											commaVal = t.clicks.commaSeparateNumber(Number(t.atts[v.id]).toFixed(2))
										}
									}
									$(v).val(commaVal)
								});
								$("#puTitle").html(response[0].layerName);
								let className = response[0].layerName.replace(/\s/g, '');
								className = className.replace('%', '');
								$(".puLayerWrap").hide();
								$(`.${className}`).show();
								$(".popupLabel").hide();
								$(`.popup-${t.maFf}`).show();
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