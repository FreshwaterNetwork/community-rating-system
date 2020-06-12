define([
	"dojo/_base/declare", "esri/tasks/query", "esri/tasks/QueryTask"
],
function ( declare, Query, QueryTask ) {
        "use strict";

        return declare(null, {
        	buildElements: function(t){
				// create state chosen menu
				$(`#${t.id}crs_state_chosen`).chosen({allow_single_deselect:false, width:"90%"})
					.change(function(c){
						t.obj.st = c.target.value;
						// send selected state to google analytics
						ga('send', {
  							hitType: 'event',
  							eventCategory: 'Community Rating System',
  							eventAction: 'State selected',
  							eventLabel: t.obj.st
						});
						$.each(t.stateFeatures,function(i,v){
							if (v.attributes.STATE == t.obj.st){
								// query community layer
								let queryTask = new esri.tasks.QueryTask(t.url + "/1"); 
								let query = new esri.tasks.Query(); 
								query.outFields = ["*"]; 
								let exp = "STATE = '" + t.obj.st + "'"
								query.where = exp;  
								query.returnGeometry = false;
								queryTask.execute(query, function (fset) {  
									t.communityFeatures = fset.features;
									// populate community dropdown
									$(`#${t.id}crs_community_chosen`).empty();
									$(`#${t.id}crs_community_chosen`).append(`<option></option>`);
									$.each(t.communityFeatures,function(i,v){
										$(`#${t.id}crs_community_chosen`).append(`
											<option value="${v.attributes.CIS_CID}">${v.attributes.CRS_NAME}</option>
										`)
									})
									$(`#${t.id}choose-com-header`).removeClass("choose-com-disabled");
									$(`#${t.id}crs_community_chosen`).prop("disabled", false).trigger("chosen:updated");
									if (t.obj.stateSet == "yes"){
										t.cnt = 0;
										$(`#${t.id}crs_community_chosen`).val(t.obj.cid).trigger("change").trigger("chosen:updated");
									}	
								})			
								// layer visiblity and definition expression
								t.obj.visibleLayers = [1];
								t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
								t.definitionExpression = exp;
								t.layerDefinitions = [];
								t.layerDefinitions[1] = t.definitionExpression;
								t.dynamicLayer.setLayerDefinitions(t.layerDefinitions);
								t.map.setExtent( v.geometry.getExtent().expand(1.3) )  
							}
						})
					});
				// create community chosen menu
				$(`#${t.id}crs_community_chosen`).chosen({allow_single_deselect:false, width:"90%"})
					.change(function(c){
						t.sliderType = "programmatic";
						t.obj.cid = c.target.value;
						t.obj.communityName = $(`#${t.id}crs_community_chosen option:selected`).html();
						// send selected community to google analytics
						ga('send', {
  							hitType: 'event',
  							eventCategory: 'Community Rating System',
  							eventAction: 'Community selected',
  							eventLabel: t.obj.communityName
						});
						// query for selected community
						let queryTask = new esri.tasks.QueryTask(t.url + "/1"); 
						let query = new esri.tasks.Query(); 
						query.returnGeometry = true; 
						query.outFields = ["*"]; 
						let exp = "CIS_CID = " + t.obj.cid
						query.where = exp;  
						queryTask.execute(query, function (fset) {
							// zoom to community extent
							if (t.obj.stateSet == "yes"){
								var extent = new esri.geometry.Extent(t.obj.extent.xmin, t.obj.extent.ymin, t.obj.extent.xmax, t.obj.extent.ymax, new esri.SpatialReference({ wkid:4326 }))
								t.map.setExtent(extent, true);
							}else{
								t.map.setExtent(esri.graphicsExtent(fset.features).expand(1.5)); 
							}
							// get community attributes
							t.communityAtts = fset.features[0].attributes;
							// get reference layer numbers and create checkboxes
							t.refLayers = t.communityAtts.REF_INDEX.split(",");
							t.clicks.createRefCBs(t);
							// hide intro - show data page
							$(".crs-intro").hide();
							$(".crs-wrap").show();
							// populate stats on data page
							$(".communityStats").each(function(i,v){
								let field = v.id.split("-").pop();
								$(v).html(t.communityAtts[field])
							})
							// update future slider range
							let fmin = Math.round(t.communityAtts["MIN_fcOSP"]) - 1;
							if (fmin < 0){
								fmin = 0;
							}
							let fmax = t.communityAtts["MAX_fcOSP"] ;
							$(`#${t.id}future-slider`).slider( "option", "min", fmin );
							$(`#${t.id}future-slider`).slider( "option", "max", fmax );
							if (t.obj.stateSet == "yes"){
								$(`#${t.id}future-slider`).slider( 'option', 'values', [ t.obj.fvals[0], t.obj.fvals[1] ] );
								$(`#${t.id}fsl-min`).html( t.obj.fvals[0] )
								$(`#${t.id}fsl-max`).html( t.obj.fvals[1] )
							}else{
								$(`#${t.id}future-slider`).slider( 'option', 'values', [ fmin, fmax ] );
								$(`#${t.id}fsl-min`).html( fmin )
								$(`#${t.id}fsl-max`).html( fmax )
							}
							// show/update tax value slider
							t.includeTaxValue = "no";
							if (t.communityAtts.MIN_TAX_VALUE > 0){
								t.includeTaxValue = "yes";
								$(`#${t.id}taxval-wrap`).show();
								let tmin = t.communityAtts["MIN_TAX_VALUE"];
								let tmax = t.communityAtts["MAX_TAX_VALUE"];
								$(`#${t.id}taxval-slider`).slider( "option", "min", tmin );
								$(`#${t.id}taxval-slider`).slider( "option", "max", tmax );
								if (t.obj.stateSet == "yes"){
									$(`#${t.id}taxval-slider`).slider( 'option', 'values', [ t.obj.tvals[0], t.obj.tvals[1] ] );
									let tminl = t.clicks.abbreviateNumber(t.obj.tvals[0]);
									if (!isNaN(tminl) ){
										tminl = t.clicks.commaSeparateNumber(tminl)
									}
									$(`#${t.id}tsl-min`).html( "$" + tminl )
									let tmaxl = t.clicks.abbreviateNumber(t.obj.tvals[1]);
									if (!isNaN(tmaxl) ){
										tmaxl = t.clicks.commaSeparateNumber(tmaxl)
									}
									$(`#${t.id}tsl-max`).html( "$" + tmaxl )
								}else{
									$(`#${t.id}taxval-slider`).slider( 'option', 'values', [ tmin, tmax ] );
									let tminl = t.clicks.abbreviateNumber(tmin);
									if (!isNaN(tminl) ){
										tminl = t.clicks.commaSeparateNumber(tminl)
									}
									$(`#${t.id}tsl-min`).html( "$" + tminl )
									let tmaxl = t.clicks.abbreviateNumber(tmax);
									if (!isNaN(tmaxl) ){
										tmaxl = t.clicks.commaSeparateNumber(tmaxl)
									}
									$(`#${t.id}tsl-max`).html( "$" + tmaxl )
								}
							}
							// query future osp eligible by CRS Name
							let queryTask1 = new esri.tasks.QueryTask(t.url + "/2")
							let query1 = new esri.tasks.Query();
							query1.returnGeometry = false;
							query1.outFields = ["*"];
							query1.where = exp;
							queryTask1.execute(query1, function(fset){
								let futureAtts = {fcOSP: 0, faOSP: 0};
								$.each(fset.features, function(i,v){
									futureAtts.fcOSP = futureAtts.fcOSP + v.attributes.fcOSP;
									futureAtts.faOSP = futureAtts.faOSP + v.attributes.faOSP;
								})
								// populate stats on data page
								$(".futureStats").each(function(i,v){
									let field = v.id.split("-").pop();
									let val = Math.round(futureAtts[field])
									let num = t.clicks.commaSeparateNumber(val)
									$(v).html( num )
								})
								// save and share
								$(`#${t.id}-fcOSP`).html( t.obj.credits )
								$(`#${t.id}-faOSP`).html( t.obj.acres )
								t.obj.stateSet = "no";
							})
						})  
						// layer visiblity and definition expression
						t.obj.visibleLayers = [1,2,3];
						t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
						t.deState = exp;
						t.layerDefinitions = [];
						t.layerDefinitions[1] = t.deState;
						t.layerDefinitions[3] = t.deState;
						t.dynamicLayer.setLayerDefinitions(t.layerDefinitions);
					})
				// future OSP slider
				$(`#${t.id}future-slider`).slider({range:true, min:0, max:100, values:[25,75],
					// called at end of slide
					change:function(event,ui){
						t.clicks.sliderLayerDefs(t);			
					},
					// called at each increment of slide
					slide:function(event,ui){
						t.sliderType = "user";
						$(`#${t.id}fsl-min`).html(ui.values[0])
						$(`#${t.id}fsl-max`).html(ui.values[1])
					}
				})	
				// tax value slider
				$(`#${t.id}taxval-slider`).slider({range:true, min:0, max:100, values:[25,75],
					// called at end of slide
					change:function(event,ui){
						t.clicks.sliderLayerDefs(t);			
					},
					// called at each increment of slide
					slide:function(event,ui){
						t.sliderType = "user";
						let minval = t.clicks.abbreviateNumber(ui.values[0]);
						if ( !isNaN(minval) ){
							minval = t.clicks.commaSeparateNumber(minval)
						}
						$(`#${t.id}tsl-min`).html("$" + minval);
						let maxval = t.clicks.abbreviateNumber(ui.values[1]);
						if ( !isNaN(maxval) ){
							maxval = t.clicks.commaSeparateNumber(maxval)
						}
						$(`#${t.id}tsl-max`).html("$" + maxval);
					}
				})
				// export parcel table 
				$(`#${t.id}exportTable`).click(function(){
					// send selected state to google analytics
					ga('send', {
						hitType: 'event',
						eventCategory: 'Community Rating System',
						eventAction: 'Parcel Table Download',
						eventLabel: t.items.length + ' parcels attributes: ' + t.obj.communityName
					});
					t.items.unshift(t.headers)
					var jsonObject = JSON.stringify(t.items);
					console.log(jsonObject)
					var csv = t.clicks.convertToCSV(jsonObject);
					var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
					var url = URL.createObjectURL(blob);
					var link = document.createElement("a");
					link.setAttribute("href", url);
					let dlName = t.obj.communityName + " - Future OSP.csv"
		            link.setAttribute("download", dlName);
		            link.style.visibility = 'hidden';
		            document.body.appendChild(link);
		            link.click();
		            document.body.removeChild(link);
				})
				// back arrow click
				$(`#${t.id}backArrow`).click(function(c){
					//t.map.setExtent(esri.graphicsExtent(t.stateFeatures).expand(1.5)); 
					t.obj.visibleLayers = [0];
					t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
					t.obj.supportingLayers = [];
					t.supportingLayer.setVisibleLayers(t.obj.supportingLayers)
					$(`#${t.id}crs_state_chosen`).val(t.obj.st).trigger("change").trigger("chosen:updated");
					//$(`#${t.id}crs_community_chosen`).val("").trigger("chosen:updated");
					$(".crs-wrap").hide();
					$(".crs-intro").show();
				})	
        	},
			sliderLayerDefs: function(t){
				// get future OSP values and create expression
				let fmax = $(`#${t.id}future-slider`).slider( "option", "max");
				t.obj.fvals = $(`#${t.id}future-slider`).slider( 'option', 'values');
				let fexp = "";
				if (fmax == t.obj.fvals[1]){
					fexp = " AND fcOSP >= " + t.obj.fvals[0];
				}else{
					fexp = " AND fcOSP >= " + t.obj.fvals[0] + " AND fcOSP <= " + t.obj.fvals[1];
				}
				// tax value values and create expression
				let texp = "";
				if (t.includeTaxValue == "yes"){
					let tmax = $(`#${t.id}taxval-slider`).slider( "option", "max");
					t.obj.tvals = $(`#${t.id}taxval-slider`).slider( 'option', 'values');
					if (tmax == t.obj.tvals[1]){
						texp = " AND TAX_VALUE >= " + t.obj.tvals[0];
					}else{
						texp = " AND TAX_VALUE >= " + t.obj.tvals[0] + " AND TAX_VALUE <= " + t.obj.tvals[1];
					}
				}
				// combine expressions for layer definition
				t.sliderExpression = t.deState + fexp + texp;
				t.layerDefinitions[2] = t.sliderExpression;
				t.dynamicLayer.setLayerDefinitions(t.layerDefinitions);
				// query for selected community
				let queryTask = new esri.tasks.QueryTask(t.url + "/2"); 
				let query = new esri.tasks.Query(); 
				query.returnGeometry = false; 
				query.outFields = ["OSP_ID","CRS_NAME","STATE","OWNER_NAME","OWNER_TYPE","LAND_USE","fcOSP","faOSP","TAX_VALUE"]; 
				query.where = t.sliderExpression;  
				queryTask.execute(query, function (fset) {
					t.cnt = t.cnt + 1;
					t.items = [];
					let f = 0;
					let a = 0;
					$.each(fset.features,function(i,v){
						t.items.push(v.attributes)
						f = f + v.attributes.fcOSP;
						a = a + v.attributes.faOSP;
					})
					$(`#${t.id}legend-current`).html(Math.round(t.communityAtts.cTOTAL))
					$(`#${t.id}legend-future`).html(Math.round(f));
					$(`#${t.id}-fcOSP`).html(Math.round(f));
					$(`#${t.id}-faOSP`).html( t.clicks.commaSeparateNumber(Math.round(a)) );
					let fc = f/2870*100;
					fc = fc.toString() + "%";
					let bc = t.communityAtts.cTOTAL/2870*100; 
					bc = bc.toString() + "%";
					// set up graph
					let w = [bc,fc];
					//let w = ["48.8%","24.4%"]
					$(".block").each(function(i,v){
						// animate current and future slider when landing on page
						// only update future when user moves slider - prevents the bar from jumping
						if (t.sliderType == "programmatic"){
							$(this).animate({
								width: w[i] 
							}, "fast", function() {})
						}else{
							if (i == 1){
								$(this).animate({
									width: w[i] 
								}, "fast", function() {})
							}
						}
					})
				})		
			},
			convertToCSV: function(objArray){
				var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
			    var str = '';
			    for (var i = 0; i < array.length; i++) {
			        var line = '';
			        for (var index in array[i]) {
			            if (line != '') line += ','
			            line += array[i][index];
			        }
			        str += line + '\r\n';
			    }
			    return str;
			},
			createRefCBs: function(t){
				// clear checkbox wrap div and append reference layer checkboxes
				$(`#${t.id}ref-cb-wrap`).empty();
				$.each(t.refLayers,function(i,v){
					let lyrname = "";
					$.each(t.layersArray,function(i1,v1){
						if (v1.id == v){
							lyrname = v1.name;
							$(`#${t.id}ref-cb-wrap`).append(`
								<label class="form-component" for="rl-${i}">
									<input type="checkbox" id="rl-${i}" name="rl-${i}" value="${v}">
									<div class="check"></div>
									<span class="form-text">${lyrname}</span>
								</label><br>
							`)
						}
					})
				})
				// create event listener for checkboxes 
				$(`#${t.id}ref-cb-wrap input`).click(function(c){
					let val = parseInt(c.currentTarget.value);
					// checked box
					if(c.currentTarget.checked){
						t.obj.supportingLayers.push(val)
						if (val == 4 || val == 6 || val == 7){
							t.layerDefinitions[val] = t.deState;
						}
					}
					// unchecked box
					else{	
						t.obj.supportingLayers = t.obj.supportingLayers.filter(item => item !== val)
					}
					t.supportingLayer.setLayerDefinitions(t.layerDefinitions);
					t.supportingLayer.setVisibleLayers(t.obj.supportingLayers)
				})
				//transparency slider
				$(`#${t.id}trans-sldr`).slider({ min: 0, max: 10, range: false, values: [t.obj.supLyrTrans],
					change: function(event,ui){
						t.obj.supLyrTrans = ui.value;
						t.supportingLayer.setOpacity(t.obj.supLyrTrans/10)
					} 
				})
				t.supportingLayer.setOpacity(t.obj.supLyrTrans/10);
				// set checkbox for save and share
				if (t.obj.stateSet == "yes"){
					let sl = Array.from(new Set(t.obj.supportingLayers))
					$.each(sl,function(i,v){
						$(`#${t.id}ref-cb-wrap input[value="${v}"]`).prop("checked",true)	
					})
				}
				// not save and share
				else{
					$(`#${t.id}ref-cb-wrap input[value="4"]`).trigger("click");
				}
			},
			commaSeparateNumber: function(val){
				while (/(\d+)(\d{3})/.test(val.toString())){
					val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
				}
				return val;
			},
			abbreviateNumber: function(num) {
			    	if (num >= 1000000000) {
			        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
			     }
			     if (num >= 1000000) {
			        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
			     }
			     // if (num >= 10000) {
			     //    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'K';
			     // }
			     return num;
			},
			abbreviateNumberPopup: function(num) {
			    if (num >= 1000000000) {
			        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' billion';
			     }
			     if (num >= 1000000) {
			        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' million';
			     }
			     return num;
			}
        });
    }
);
