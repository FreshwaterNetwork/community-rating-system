define([
	"dojo/_base/declare"
],
function ( 	declare ) {
        "use strict";
        return declare(null, {
			makeVariables: function(t){	
				// map service URL
				t.url = "https://cirrus.tnc.org/arcgis/rest/services/CommunityRatingSystem/CommunityRatingSystem/MapServer";
				t.headers = {
					OSP_ID: "OSP_ID",
					CRS_NAME: "CRS Name",
					STATE: "State Abr",
					OWNER_NAME: "Owner Name",
					OWNER_TYPE: "Owner Type",
					LAND_USE: "Land Use",
					fcOSP: "Future OSP Credits",
					faOSP: "Future OSP Acres",
					TAX_VALUE: "Tax Value"
				}
			}
		});
    }
);