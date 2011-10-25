// CSS
// .gmapsFineTuner-formDiv = Div holding the form content;
// .gmapsFineTuner-gmapDiv = Div holding the Google Map;

(function( $ ) {
    var divID = 0;
    
    var methods = {
        init : function( options ) {
            
            // Default settings for the plugin
            var defaults = {
                'startLatLng' : { 'lat' : -34.397, 'lng' : 150.644 },
                'startZoom' : 8,
                'country' : "Ireland",
                'countyPrefix' : '',
                'counties' : '',
                'fineTune' : true,
            };

            var radarDefaults = { clickable : false, radius: 1400, };
            var markerDefaults = { draggable: true, visible : false, }

            // Extend the options with the plugin defaults
            var options = $.extend(defaults, options);
            options.radar = $.extend(radarDefaults, options.radar);
            options.marker = $.extend(markerDefaults, options.marker);

            // Activate the plugin
            return this.each(function() {
                divID++;
                var $this = $(this);
                var $formDiv = $('<div class="gmapsFineTuner-formDiv"></div>');
                var $gmapDiv = $('<div id="gmapsFineTuner-map'+divID+'" class="gmapsFineTuner-gmapDiv"></div>');
                var $countiesBox, $townsBox, $streetBox, $coordsBox;
                var fullAddress = "", chosenCounty = "", chosenTown = "", chosenStreet = "";

                var gmapsFineTunerGeocoder, gmapsFineTunerMap, gmapsFineTunerLastPositon, gmapsFineTunerMarker, gmapsFineTunerRadar;


                // BEGIN THE COUNTIES BOX
                if (options.counties.length > 0) {
                    // Counties have been set in the options
                    $countiesBox = $('<select><option value="-" selected>Please choose the county</option></select');
                    $.each(options.counties, function(val, text) {
                        $countiesBox.append(
                            $('<option></option>').val(options.countyPrefix + text).html(text)
                        );
                    })
                } else {
                    // No Counties have been specified
                    $countiesBox = $('<input type="text" value="County">');
                }
                // Do something when the counties box is changed
                $countiesBox.change(function() {
                    if ($(this).find(":selected").val() != "-") {
                        chosenCounty = (typeof($(this).find(":selected").val()) == "undefined") ? $(this).val() : $(this).find(":selected").val();
                        chosenStreet = "";
                        chosenTown = "";
                        gmapsFineTunerMarker.setVisible(false);
                        $townsBox.val('Town').show().focus();
                        $streetBox.hide();
                        moveMap(9);
                    }
                });
                // END THE COUNTIES BOX


                // BEGIN THE TOWNS BOX
                $townsBox = $('<input type="text" value="Town">').hide();
                // Do something when the towns box is changed
                $townsBox.change(function() {
                    chosenTown = $(this).val() + ", ";
                    chosenStreet = "";
                    gmapsFineTunerMarker.setVisible(false);
                    $streetBox.val('Address').show().focus();
                    moveMap(14);
                });
                $townsBox.keypress(function (e) { 
                    var code = null; 
                    code = (e.keyCode ? e.keyCode : e.which);

                    if (code == 13) {
                        $townsBox.change();
                    }

                    return (code == 13) ? false : true; });
                // END THE TOWNS BOX


                // BEGIN THE STREET BOX
                $streetBox = $('<input type="text" value="Address">').hide();
                // Do something when the towns box is changed
                $streetBox.change(function() {
                    chosenStreet = $(this).val() + ", ";
                    moveMap(17);
                });
                $streetBox.keypress(function (e) { 
                    var code = null; 
                    code = (e.keyCode ? e.keyCode : e.which);

                    if (code == 13) {
                        $streetBox.change();
                    }

                    return (code == 13) ? false : true; });
                // END THE STREET BOX

                $coordsBox = $('<input type="hidden" name="gmapsFineTunerPosition'+divID+'">');

                // Add the form to our form div
                $formDiv.append($countiesBox);
                $formDiv.append($townsBox);
                $formDiv.append($streetBox);


                $this.append($formDiv);
                $this.append($gmapDiv);
                $this.append($coordsBox);

                createMap();

                // Functions for use with this plugin
                function createMap() {
                    gmapsFineTunerGeocoder = new google.maps.Geocoder();
                    var latlng = new google.maps.LatLng(options.startLatLng.lat, options.startLatLng.lng);
                    var myOptions = {
                      zoom: options.startZoom,
                      center: latlng,
                      mapTypeId: google.maps.MapTypeId.ROADMAP
                    };
                    gmapsFineTunerMap = new google.maps.Map(document.getElementById( $gmapDiv.attr('id') ),
                        myOptions);

                    gmapsFineTunerRadar = new google.maps.Circle( options.radar );
                    gmapsFineTunerMarker = new google.maps.Marker( options.marker );
                    gmapsFineTunerMarker.setMap(gmapsFineTunerMap);
                    google.maps.event.addListener(gmapsFineTunerMarker, 'dragend', function(event) {
                        $coordsBox.val(event.latLng.toUrlValue());
                    });

                    google.maps.event.addListener(gmapsFineTunerMap, 'click', function(event) {
                        $coordsBox.val(event.latLng.toUrlValue());
                        gmapsFineTunerMarker.setPosition(event.latLng);
                        gmapsFineTunerMap.setCenter(event.latLng);
                        gmapsFineTunerMap.setZoom(17);
                        gmapsFineTunerMarker.setVisible();
                        gmapsFineTunerRadar.setMap(null);
                    });

                }

                function moveMap(zoom) {
                    zoom = (typeof(zoom) == "undefined") ? options.startZoom : zoom;
                    // Moves the map to the required location
                    fullAddress = chosenStreet + chosenTown + chosenCounty + ", " + options.country


                    gmapsFineTunerGeocoder.geocode( { 'address': fullAddress}, function(results, status) {

                        if (status == google.maps.GeocoderStatus.OK) {
                            gmapsFineTunerLastPositon = results[0].geometry.location;
                        }

                        gmapsFineTunerMap.setCenter(gmapsFineTunerLastPositon);
                        gmapsFineTunerMarker.setPosition(gmapsFineTunerLastPositon);

                        $coordsBox.val(gmapsFineTunerLastPositon.toUrlValue());

                        if (results[0].geometry.location_type == "APPROXIMATE") {
                            // This is only approximate so lets give them a radar so they can
                            // click to add their own specific point!
                            gmapsFineTunerRadar.setCenter(gmapsFineTunerLastPositon);
                            gmapsFineTunerRadar.setMap(gmapsFineTunerMap);

                            gmapsFineTunerRadar.setOptions( { radius : (zoom == 9) ? 35000 : 1100 } )

                        } else {
                            // We are pretty sure this is where they want to be so lets drop a marker!
                            gmapsFineTunerMarker.setVisible();
                            gmapsFineTunerRadar.setMap(null);
                        }

                        gmapsFineTunerMap.setZoom(zoom);


                    });


                }

            });
        },
      };
    
    
    
    $.fn.gmapsFineTuner = function( method ) {

        // Method calling logic
        if ( methods[method] ) {
          return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
        }


    }
})( jQuery );