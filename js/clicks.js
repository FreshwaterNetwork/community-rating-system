define([
	"dojo/_base/declare", "esri/tasks/query", "esri/tasks/QueryTask"
],
function ( declare, Query, QueryTask ) {
        "use strict";

        return declare(null, {
        	buildElements: function(t){
        		// create intro paragraph and toggle button controls from object
        		$(`#${t.id}introP`).html(t.topObj["introP"]);
        		let tbnum = 0;
        		$.each(t.topObj["toggleBtns"],function(k,v){
        			tbnum = tbnum + 1;
        			$(`#${t.id}top-controls`).append(`
        				<h4>${v.header}</h4>
        				<div id="${t.id}tb-${tbnum}" class="toggle-btn"></div>
        			`);
        			$.each(v.btns,function(k1,v1){
        				$(`#${t.id}tb-${tbnum}`).append(`
        					<input type="radio" id="${t.id}${v1.id}" name="${v.name}" value="${v1.value}"/>
							<label for="${t.id}${v1.id}">${v1.label}</label>
						`);	
        			})
        		})

        		// create filter controls from object
        		let num = 0;
        		let num1 = 0;
        		$.each(t.filterObj,function(i,v){
        			num = num + 1;
        			$(`#${t.id}mng-act-wrap`).append(`
        				<h4><span class="fa fa-chevron-down chev-oc chev-o"></span><span class="fa fa-chevron-right chev-oc chev-c"></span>${v.header}</h4>
        				<div class="oc-wrap" id="${t.id}oc-wrap${num}"></div>
        			`);
        			$.each(v.controls,function(i1,v1){
        				num1 = num1 + 1;
        				if (v1.type == "slider"){
        					$(`#${t.id}oc-wrap${num}`).append(`
        						<div class="cntrlWrap" id="wrap-${v1.field}">
									<div class="flexSlideWrap">
										<div class="flex1">
											<label class="form-component" for="${t.id}-slCb${num1}">
												<input type="checkbox" class="-slCb" id="${t.id}-slCb${num1}" name="-slCb${num1}"><span class="check"></span>
												<span class="form-text under">${v1.label}</span>
											</label>
										</div>
										<div class="flex1a">
											<span class="umr-slider-label label-off"><span class="rnum label-off">x</span> to <span class="rnum label-off">y</span> ${v1.unit}</span>
											<div class="slider-container range-slider" style="width:170px;">
												<div id="${t.id}-${v1.field}" class="slider"></div>
											</div>
										</div>
										<div class="feInfoWrap"><i class="fa fa-info-circle feInfo feInfoOpen"></i></div>
										<div class="feInfoTextWrap"><span class="feInfoText"></span><i class="fa fa-close feInfo feInfoClose"></i></div>						
									</div>	
								</div>
        					`);
        				}
        				if (v1.type == "radio"){
        					$(`#${t.id}oc-wrap${num}`).append(`
        						<div class="cntrlWrap" id="${t.id}wrap-${v1.field}">
									<div class="mng-act-toggle flexSlideWrap">
										<div class="flex1">
											<label class="form-component" for="${t.id}rb_cb${num1}">
												<input type="checkbox" class="rb_cb" id="${t.id}rb_cb${num1}" name="rb_cb${num1}"><span class="check"></span>
												<span class="form-text under">${v1.label}</span>
											</label>
										</div>	
										<div class="umr-radio-indent flex1">
											<label class="form-component" for="${t.id}-rb${num1}a">
												<input checked type="radio" id="${t.id}-rb${num1}a" name="${v1.field}" value="1" disabled>
												<span class="check"></span><span class="form-text">Present</span>
											</label>
											<label class="form-component" for="${t.id}-rb${num1}b">
												<input type="radio" id="${t.id}-rb${num1}b" name="${v1.field}" value="0" disabled>
												<span class="check"></span><span class="form-text">Absent</span>
											</label>
										</div>	
										<div class="feInfoWrap"><i class="fa fa-info-circle feInfo feInfoOpen"></i></div>
										<div class="feInfoTextWrap"><span class="feInfoText"></span><i class="fa fa-close feInfo feInfoClose"></i></div>
									</div>
								</div>
        					`);	
        				}
        			})
        		})

        		// create supporting layer controls from object
        		if ( t.supportingLayersObj.visible ){
	        		t.supLayersAdded = true;
	        		let slnum = 0;
	        		$.each(t.supportingLayersObj.controls,function(k,v){
	 					slnum = slnum + 1;
	 					$(`#${t.id}supporting-layers`).append(`
	 						<div class="flex1">
								<label class="form-component" for="${t.id}sl${slnum}">
									<input type="checkbox" class="slcb" id="${t.id}sl${slnum}" name="sl${slnum}" value="${v.value}"><span class="check"></span>
									<span class="form-text under">${v.label}</span>
								</label>
							</div>
	 					`);			
	        		})	
	        		$(`#${t.id}supporting-layers`).show();
	        	}else{
	        		t.supLayersAdded = false;
	        		$(`#${t.id}supporting-layers`).hide();
	        	}	
        	},
			eventListeners: function(t){
				var clickCnt = 0;
				// Flood frequency, HUC, and Management Action clicks
				$('#' + t.id + 'top-controls input').on('click',function(c){
					t.esriapi.clearGraphics(t);
					// Find checked inputs and record values
					$('#' + t.id + 'top-controls input').each(function(i,v){
						if (v.checked){
							var rname = $(v).attr("name")
							t.obj[rname] = v.value;
							if (rname == "huc"){
								t.ws = $(v).prop("id").split("-").pop()
							}
						}
					})
					t.fe = t.ws + t.obj.mngmtAction + t.obj.floodFreq;
					t.maFf = t.obj.mngmtAction + t.obj.floodFreq;
					// check if second modification function exists
					if (typeof t.variables.eventMods === 'function'){
						t.variables.eventMods(t)
					}
					t.obj.hucLayer = t.obj.huc
					// Update range slider min and max values 
					var slen = $('#' + t.id + 'mng-act-wrap .slider').length;
					t.ord = ""
					$("h4").show();
					$.each($('#' + t.id + 'mng-act-wrap .slider'),function(i,v){
						if (slen == i + 1){
							t.ord = "last";
						}
						var ben  = v.id.split("-").pop();
						var okeys = Object.keys(t.sliderObj[t.fe]);
						$.each(okeys,function(i1,v1){
							if (ben == v1){
								if (t.sliderObj[t.fe][v1].vis){
									$("#" + v.id).parent().parent().parent().parent().show();
									var min = t.sliderObj[t.fe][v1].min;
									var max = t.sliderObj[t.fe][v1].max;
									$("#" + v.id).slider( "option", "min", min );
									$("#" + v.id).slider( "option", "max", max );
									if (t.sliderObj[t.fe][v1].step){
										var step = t.sliderObj[t.fe][v1].step;
										$("#" + v.id).slider( "option", "step", step );
									}
									var options = $("#" + v.id).slider( 'option' );
									var val1 = options.min;
									var val2 = options.max;
									if (t.sliderObj[t.fe][v1].values.length > 0){
										val1 = t.sliderObj[t.fe][v1].values[0];
										val2 = t.sliderObj[t.fe][v1].values[1];
									}
									$("#" + v.id).slider( 'option', 'values', [ val1, val2 ] );
								}else{
									$("#" + v.id).parent().parent().parent().parent().hide();
									var options = $("#" + v.id).slider( 'option' );
									$("#" + v.id).slider( 'option', 'values', [ options.min, options.max ] );
									// hide the header above if the filter group is not visible and has no siblings
									$.each(t.filterObj,function(k,v3){
										$.each(v3.controls,function(k1,v4){
											if (v4.field == v1 && v4.single){
												$(`h4:contains('${v3.header}')`).hide();
												return false;
											}
										})
									})
								}	
							}
						})
					})	
					// Set definition expressions for visible and enabled radion buttons
					$.each( $('.umr-radio-indent input'), function(i,v){
						var ben = v.name
						var val = v.name.value;
						var dis = v.disabled;
						if (t.radioObj[t.fe][ben].vis === true){
							$(v).parent().parent().parent().parent().show()
						}else{
							$(v).parent().parent().parent().parent().hide()
							$(v).prop("disabled", true)
							if ( $("#" + t.id + t.radioObj[t.fe][ben].cbid ).prop("checked") ){
								$("#" + t.id + t.radioObj[t.fe][ben].cbid ).trigger("click")
							}
						}
					});	
					// Update info text
					$.each($(".cntrlWrap"),function(i,v){	
						var obkey = v.id.split("-").pop()
						if (t.sliderObj[t.fe][obkey]){
							if (t.sliderObj[t.fe][obkey].info){
								if ( $(v).find(".feInfoTextWrap").is(":visible") ){
									$(v).find(".feInfoWrap").hide();
								}else{
									$(v).find(".feInfoWrap").show()
								}
								$(v).find(".feInfoText").html(t.sliderObj[t.fe][obkey].info)
							}else{
								$(v).find(".feInfoWrap").hide()
							}
						}	
						if (t.radioObj[t.fe][obkey]){
							if (t.radioObj[t.fe][obkey].info){
								$(v).find(".feInfoWrap").show()
								$(v).find(".feInfoText").html(t.radioObj[t.fe][obkey].info)
							}else{
								$(v).find(".feInfoWrap").hide()
							}	
						}
					});
					// Update watershed visibilty
					for (var i = 0; i < 3; i++){
						let index = t.obj.visibleLayers.indexOf(i.toString());
						if (index > -1){
							t.obj.visibleLayers.splice(index,1);
						}
					}
					t.obj.visibleLayers.push(t.obj.hucLayer)
					t.dynamicLayer.setVisibleLayers(t.obj.visibleLayers);
				})
				// Checkboxes for sliders
				$('#' + t.id + 'umr-wrap .-slCb').on('click',function(c){
					if (c.target.checked == true){
						$('#' + c.target.id).parent().parent().parent().find('.umr-slider-label').removeClass("label-off");
						$('#' + c.target.id).parent().parent().parent().find('.rnum').removeClass("label-off");
						var sl = $('#' + c.target.id).parent().parent().parent().find('.slider')[0].id 
						$('#' + sl).slider( "option", "disabled", false );
						var values = $('#' + sl).slider("option", "values");
						$('#' + sl).slider('values', values);
					}
					if (c.target.checked == false){
						$('#' + c.target.id).parent().parent().parent().find('.umr-slider-label').addClass("label-off");
						$('#' + c.target.id).parent().parent().parent().find('.rnum').addClass("label-off");
						var sl = $('#' + c.target.id).parent().parent().parent().find('.slider')[0].id 
						$('#' + sl).slider( "option", "disabled", true );
						var ben  = sl.split("-").pop();
						t.exp[ben] = "";
						t.clicks.layerDefs(t);
					}	
					t.clicks.cbChecker(t);	
				})
				// Checkboxes for radio buttons
				$('#' + t.id + 'umr-wrap .rb_cb').on('click',function(c){
					if (c.target.checked == true){
						$.each($('#' + c.target.id).parent().parent().next().find('input'),function(i,v){
							$(v).attr('disabled', false)
							if (v.checked == true){
								$(v).trigger('click')
							}
						})
					}
					if (c.target.checked == false){
						var ben = $('#' + c.target.id).parent().parent().next().find('input')[0].name;
						t.exp[ben] = "";
						t.clicks.layerDefs(t);
						$.each($('#' + c.target.id).parent().parent().next().find('input'),function(i,v){
							$(v).attr('disabled', true)		
						})
					}
					t.clicks.cbChecker(t);	
				});	
				// Radio button clicks
				$('.umr-radio-indent input').on('click',function(c){
					var ben = c.target.name;
					var field = c.target.name + "_" + t.obj.mngmtAction + t.obj.floodFreq;
					if (t.radioObj[t.fe][ben].shfld){
						field = ben;
					}
					var val = c.target.value;
					t.exp[ben] = "( " + field + " = " + val + " )";
					if (val == 1 && ben == "TNC"){
						t.exp[ben] = "( " + field + " > 0 )";
					}
					t.clicks.layerDefs(t);
				})
				// Info icon clicks
				$('#' + t.id + "mng-act-wrap .feInfo").click(function(c) {
					var e = c.currentTarget;
					$(".feInfoTextWrap").hide();
					$(".feInfoWrap").show();
					if ( $(e).hasClass('feInfoOpen') ){
						$(e).parent().parent().find(".feInfoTextWrap").show();
					}
					if ( $(e).hasClass('feInfoClose') ){
						$(e).parent().parent().find(".feInfoWrap").show();
					}
					$(e).parent().hide();
				});
				// Checkboxes for supporting layers
				$('#' + t.id + 'umr-wrap .slcb').on('click',function(c){
					if ( c.currentTarget.checked ){
						t.obj.supportingLayers.push(c.currentTarget.value);
						t.supportingLayer.setVisibleLayers(t.obj.supportingLayers);
					}else{
						let index= t.obj.supportingLayers.indexOf(c.currentTarget.value);
						if (index > -1){
							t.obj.supportingLayers.splice(index,1)
						}
						t.supportingLayer.setVisibleLayers(t.obj.supportingLayers);
					}
				})
				// Set up range slider
				$('#' + t.id + 'mng-act-wrap .slider').slider({range:true, min:0, max:2400, values:[0,2400], disabled:true, 
					change:function(event,ui){t.clicks.sliderChange(event,ui,t)},
					slide:function(event,ui){t.clicks.sliderSlide(event,ui,t)}
				})
				// filter section chevron clicks
				$('#' + t.id + 'mng-act-wrap .chev-oc').click(function(c){
					if ( $(c.currentTarget).hasClass('chev-o') ){
						$(c.currentTarget).parent().find('.chev-o').hide();
						$(c.currentTarget).parent().find('.chev-c').css("display","inline-block");
						$(c.currentTarget).parent().next().slideUp();
					} 
					if ( $(c.currentTarget).hasClass('chev-c') ){
						$(c.currentTarget).parent().find('.chev-c').hide();
						$(c.currentTarget).parent().find('.chev-o').css("display","inline-block");
						$(c.currentTarget).parent().next().slideDown();
					}
				})
				// reset filters click
				$(`#${t.id}resetFilters`).click(function(c){
					// reset all slider values in t.sliderObj to empty arrays
					$.each(t.sliderObj,function(i,v){
						$.each(v,function(i1,v1){
							if (v1.values){
								v1.values = [];
							}
						})
					})
					// reclick first checked item in top menu - this resets the slider values
					$.each($('#' + t.id + 'top-controls input'),function(i,v){
						if (v.checked){
							$('#' + v.id).trigger("click");
							return false;
						}
					})
					// uncheck slider checkboxes
					$('#' + t.id + 'umr-wrap .-slCb').each(function(i,v){
						if (v.checked){
							$(v).trigger('click');
						}
					})
					// set radio buttons to first input
					$('.umr-radio-indent').each(function(i,v){
						var ipt = $(v).find("input")[0];
						$(ipt).prop("checked",true);
					})
					// uncheck radio checkboxes
					$(`#${t.id}umr-wrap .rb_cb`).each(function(i,v){
						if (v.checked){
							$(v).trigger('click');
						}
					})
				})
				// save and share button
				$(`#${t.id}saveAndShare`).click(function(c){
					$(`#map-utils-control a`).each(function(i,v){
						if ($(v).html() == "Save &amp; Share"){
							v.click();
						}
					});
				})	
			},
			cbChecker: function(t){
				let n = 0;
				$('#' + t.id + 'umr-wrap .rb_cb').each(function(i,v){
					if (v.checked){
						n = n + 1;
					}
				})
				$(`#${t.id}umr-wrap .-slCb`).each(function(i,v){
					if (v.checked){
						n = n + 1;
					}
				})
				if (n == 0){
					$(`#${t.id}saveAndShare`).hide();
					$(`#${t.id}resetFilters`).hide();
				}else{
					$(`#${t.id}saveAndShare`).show();
					$(`#${t.id}resetFilters`).show();
				}
			},
			sliderChange: function(e, ui, t){
				var ben  = e.target.id.split("-").pop()
				var us = "_";
				if (t.sliderObj[t.fe][ben].nounsc){
					us = "";
				}	
				var field = ben + us + t.obj.mngmtAction + t.obj.floodFreq;
				if (t.sliderObj[t.fe][ben].endwp){
					field = field + "P" 
				}
				if (t.sliderObj[t.fe][ben].shfld){
					field = ben;
				}	
				// slider change was mouse-driven
				if (e.originalEvent) {
					var v0 = ui.values[0]
					var v1 = ui.values[1]
					t.sliderObj[t.fe][ben].values = [v0,v1];
					if (t.sliderObj[t.fe][ben].div){
						v0 = v0/t.sliderObj[t.fe][ben].div
						v1 = v1/t.sliderObj[t.fe][ben].div
					}
					if (v1 == t.sliderObj[t.fe][ben].max && t.sliderObj[t.fe][ben].gtmax){
						t.exp[ben] = "(" + field + " >= " + v0 + ")";	
					}else{
						t.exp[ben] = "(" + field + " >= " + v0 + " AND " + field + " <= " + v1 + ")";	
					}
					t.clicks.layerDefs(t);
				}
				//slider change was programmatic
				else{					
					var dis = $('#' + e.target.id).slider("option", "disabled");
					var vis = $('#' + e.target.id).is(":visible")
					if (dis === true){
						t.exp[ben] = "";	
					}else{
						if (vis){
							var v0 = ui.values[0]
							var v1 = ui.values[1]
							t.sliderObj[t.fe][ben].values = [v0,v1];
							if (t.sliderObj[t.fe][ben].div){
								v0 = v0/t.sliderObj[t.fe][ben].div
								v1 = v1/t.sliderObj[t.fe][ben].div
							}
							if (v1 == t.sliderObj[t.fe][ben].max && t.sliderObj[t.fe][ben].gtmax){
								t.exp[ben] = "(" + field + " >= " + v0 + ")";	
							}else{
								t.exp[ben] = "(" + field + " >= " + v0 + " AND " + field + " <= " + v1 + ")";	
							}
						}else{
							t.exp[ben] = "";
						}
					}
					t.clicks.sliderSlide(e, ui, t);
					if (t.ord == "last"){
						t.clicks.layerDefs(t);
					}
				}	
			},
			sliderSlide: function(e, ui, t){
				var ben = e.target.id.split("-").pop();
				$('#' + e.target.id).parent().prev().find('.rnum').each(function(i,v){
					var sval = ui.values[i]
					if (t.sliderObj[t.fe][ben].div){
						sval = ui.values[i]/t.sliderObj[t.fe][ben].div
					}
					if (ui.values[i] > 100000){
						var val = t.clicks.abbreviateNumber(sval)
					}else{
						var val = t.clicks.commaSeparateNumber(sval)
					}	
					if (ui.values[i] == t.sliderObj[t.fe][ben].max && t.sliderObj[t.fe][ben].gtmax){
						$(v).html("<b>></b> " + val)
					}else{
						$(v).html(val)
					}
				})	
			},
			layerDefs: function(t){
				if (t.obj.stateSet == "no"){
					t.obj.exp = t.exp
				}
				var exp = "OBJECTID > 0";
				var cnt = 0;
				$.each(t.obj.exp, function(i, v){
					if (v.length > 0){
						cnt = cnt + 1;
					}	
				});	
				if (cnt > 0){
					exp = "";
					//t.obj.exp.unshift(t.obj.ffDef);
					$.each(t.obj.exp, function(i, v){
						if (v.length > 0){
							if (exp.length == 0){
								exp = v;
							}else{
								exp = exp + " AND " + v;
							}	
						}	
					});
				}	
				t.definitionExpression = exp;
				t.layerDefinitions = [];		
				t.layerDefinitions[t.obj.hucLayer] = exp;			
				t.dynamicLayer.setLayerDefinitions(t.layerDefinitions);
				var query = new Query();
				var queryTask = new QueryTask(t.url + '/' + t.obj.hucLayer);
				query.where = exp;
				queryTask.executeForCount(query,function(count){
					var countWcomma = t.clicks.commaSeparateNumber(count)
					$('#' + t.id + 'mng-act-wrap .fuCount').html(countWcomma); 
				});	
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
			     if (num >= 1000) {
			        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
			     }
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
