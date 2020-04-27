// // Pull in your favorite version of jquery 
require({ 
	packages: [{ name: "jquery", location: "https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/", main: "jquery.min" }] 
});
// Bring in dojo and javascript api classes as well as varObject.json, js files, and content.html
define([
	"dojo/_base/declare", "framework/PluginBase", "dijit/layout/ContentPane", "dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/text!./obj.json", 
	"dojo/text!./html/content.html", "dojo/text!./html/popup.html", './js/esriapi', './js/clicks', './variables', 'dojo/_base/lang'	
],
function ( 	declare, PluginBase, ContentPane, dom, domStyle, domGeom, obj, content, popup, esriapi, clicks, variables, lang ) {
	return declare(PluginBase, {
		// The height and width are set here when an infographic is defined. When the user click Continue it rebuilds the app window with whatever you put in.
		toolbarName: "Coomunity Rating System Explorer", showServiceLayersInLegend: true, allowIdentifyWhenActive: false, rendered: false, resizable: false,
		hasCustomPrint: false, size:'small', 
		
		// First function called when the user clicks the pluging icon. 
		initialize: function (frameworkParameters) {
			// Access framework parameters
			declare.safeMixin(this, frameworkParameters);
			// Define object to access global variables from JSON object. Only add variables to varObject.json that are needed by Save and Share. 
			this.obj = dojo.eval("[" + obj + "]")[0];	
			this.layerDefs = [];
			$("#sidebar-help-area").css("display","none");
		},
		// Called after initialize at plugin startup (why the tests for undefined). Also called after deactivate when user closes app by clicking X. 
		hibernate: function () {
			if (this.appDiv != undefined){
				this.dynamicLayer.setVisibleLayers([-1])
			}
			this.open = "no";
		},
		// Called after hibernate at app startup. Calls the render function which builds the plugins elements and functions.   
		activate: function (showHelpOnStart) {
			$(`#map-utils-control`).hide();
			// console.log(showHelpOnStart)
			if (this.rendered == false) {
				this.rendered = true;							
				this.render();
				$(this.printButton).hide();
			}else{
				this.dynamicLayer.setVisibleLayers(this.obj.visibleLayers);
			}	
			this.open = "yes";
		},
		// Called when user hits the minimize '_' icon on the pluging. Also called before hibernate when users closes app by clicking 'X'.
		deactivate: function () {
			this.open = "no";	
		},	
		// Called when user hits 'Save and Share' button. This creates the url that builds the app at a given state using JSON. 
		// Write anything to you varObject.json file you have tracked during user activity.		
		getState: function () {
			// remove this conditional statement when minimize is added
			if ( $('#' + this.id ).is(":visible") ){
				//extent
				this.obj.extent = this.map.geographicExtent;
				this.obj.stateSet = "yes";	
				var state = new Object();
				state = this.obj;
				return state;	
			}
		},
		// Called before activate only when plugin is started from a getState url. 
		//It's overwrites the default JSON definfed in initialize with the saved stae JSON.
		setState: function (state) {
			this.obj = state;
		},
		// Called when the user hits the print icon
		beforePrint: function(printDeferred, $printArea, mapObject) {
			printDeferred.resolve();
		},	
		// Called by activate and builds the plugins elements and functions
		render: function() {
			this.mapScale  = this.map.getScale();
			// BRING IN OTHER JS FILES
			this.variables = new variables();
			this.esriapi = new esriapi();
			this.clicks = new clicks();
			// ADD HTML TO APP
			// Define Content Pane as HTML parent		
			this.appDiv = new ContentPane({style:'padding:0; height: calc(100vh - 55px);}'});
			this.id = this.appDiv.id
			dom.byId(this.container).appendChild(this.appDiv.domNode);			
			// Get html from content.html, prepend appDiv.id to html element id's, and add to appDiv
			var idUpdate0 = content.replace(/for="/g, 'for="' + this.id);	
			var idUpdate = idUpdate0.replace(/id="/g, 'id="' + this.id);
			$('#' + this.id).html(idUpdate);
			// Add popup window for descriptions
			// this.descDiv = new ContentPane({style:'display:none; padding:10px 10px 5px 10px; color:#000; opacity: 1; z-index:1000; border:1pt solid #777; position:absolute; top:5px; left:6px; max-width:500px; border-radius:5px; box-shadow:2px 2px 2px 1px rgba(16,22,26,.5); background:#f9f9f9;'});
			// this.descID = this.descDiv.id;
			// var dId = this.descID;
			// dom.byId('map-0').appendChild(this.descDiv.domNode);
			// $('#' + this.descID).html(popup);
			// add a basemap selector to map
			$("#map-0").append(`
				<div class="dropdown" style="position:absolute; top:20px; right:20px; z-index:1000;">
					<button class="button dropdown-toggle" style="text-align:right;" type="button" id="bms" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
						Topographic
						<i class="icon-down-open-mini caret"></i>
					</button>
					<ul class="dropdown-menu" id="bmul" aria-labelledby="bms" style="min-width:unset; padding:6px; width:121px; right:0; left:unset;">
						<li><a>Topographic</a></li>
						<li><a>Imagery</a></li>
					</ul>
				</div>
			`)
			// hide exiting hamburger basemap selector so it isn't accidentally used
			$('.basemap-selector').hide();
			$('#show-single-plugin-mode-help').hide();
			// click event on new basemap selector that triggers a click on hamburger basemap selector
			$("#bmul").on("click",function(c){
				let sel = c.target.innerHTML;
				let pl = $('.basemap-selector').find($(".pushy-link a"))
				$.each(pl,function(i,v){
					let t = $(v).html()
					if (t == sel){
						$(v).parent().trigger('click')
						$(v).trigger('click')
						$(bms).html(sel + `<i class="icon-down-open-mini caret"></i>`)
					}
				})
			})
			// tiny box community listed popup
			$(this.container).find('.comNotListed').on('click', function(c) {
                TINY.box.show({
                    animate: false,
                    url: 'plugins/community-rating-system/html/comNotListed.html',
                    fixed: true,
                    width: 430,
                    height: 160
                });
            }).tooltip();
            // tiny box info popup
			$(this.container).find('.infoIcon').on('click', function(c) {
                TINY.box.show({
                    animate: false,
                    url: 'plugins/community-rating-system/html/info.html',
                    fixed: true,
                    width: 530,
                    height: 460
                });
            }).tooltip();
			// override hamburger basemap even handler to add imagery with labels
			let tm = this.map
			$(".pushy-link a").on('click',function(c){
				if (c.currentTarget.innerHTML == "Imagery"){
					tm.setBasemap("hybrid")
				}
				if (c.currentTarget.innerHTML == "Topographic"){
					tm.setBasemap("topo")
				}
			})
			// Set up variables
			this.variables.makeVariables(this);
			// Build elements
			this.clicks.buildElements(this);
			// Create ESRI objects and event listeners	
			this.esriapi.esriApiFunctions(this);
			this.rendered = true;	
		}
	});
});