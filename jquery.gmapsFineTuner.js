// CSS
// .gmapsFineTuner-formDiv = Div holding the form content;
// .gmapsFineTuner-gmapDiv = Div holding the Google Map;

(function( $ ) {
     var methods = {
        init : function( options ) {
            var divID = 0;
            
            // Default settings for the plugin
             var defaults = {
                 'startLatLng' : { 'lat' : -34.397, 'lng' : 150.644 },
                 'startZoom' : 6,
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
                
                var gmapsFineTunerGeocoder, gmapsFineTunerMap, gmapsFineTunerLastPositon, gmapsFineTunerMarker, gmapsFineTunerRadar;

                // Namespace all the data that I need to pass between functions

                if ( ! data ) {
                    $this.data('gmapsFineTuner', {
                        formDiv : $('<div class="gmapsFineTuner-formDiv"></div>'),
                        gmapDiv : $('<div id="gmapsFineTuner-map'+divID+'" class="gmapsFineTuner-gmapDiv"></div>'),
                        coordsBox : $('<input type="hidden" name="gmapsFineTunerPosition'+divID+'">'),
                        fullAddress : "ss",
                        chosenCounty : "",
                        chosenTown : "",
                        chosenStreet : "",
                        options : options,
                        countiesBox : '', 
                        townsBox : '',
                        streetBox : '',
                        gmapsFineTunerGeocoder : '',
                        gmapsFineTunerMap : '',
                        gmapsFineTunerLastPositon : '',
                        gmapsFineTunerMarker : '',
                        gmapsFineTunerRadar : '',
                    })
                }
                var data = $this.data('gmapsFineTuner');
                
                // BEGIN THE COUNTIES BOX
                if (data.options.counties.length > 0) {
                    // Counties have been set in the options
                    data.countiesBox = $('<select><option value="-" selected>Please choose the county</option></select');
                    $.each(data.options.counties, function(val, text) {
                        data.countiesBox.append(
                            $('<option></option>').val(text).html(text)
                        );
                    })
                } else {
                    // No Counties have been specified
                    data.countiesBox = $('<input type="text" value="County">');
                }
                // Do something when the counties box is changed
                data.countiesBox.change(function() {
                    if ($(this).find(":selected").val() != "-") {
                        $this.gmapsFineTuner('setCounty', (typeof($(this).find(":selected").val()) == "undefined") ? $(this).val() : $(this).find(":selected").val());
                        data.chosenStreet = "";
                        data.chosenTown = "";
                        data.gmapsFineTunerMarker.setVisible(false);
                        data.townsBox.val('Town').show().focus();
                        data.streetBox.hide();
                        $this.gmapsFineTuner('moveMap', 9);
                    }
                });
                // END THE COUNTIES BOX


                // BEGIN THE TOWNS BOX
                data.townsBox = $('<input type="text" value="Town">').hide();
                // Do something when the towns box is changed
                data.townsBox.change(function() {
                    $this.gmapsFineTuner('setTown', $(this).val());
                    data.chosenStreet = "";
                    data.gmapsFineTunerMarker.setVisible(false);
                    data.streetBox.val('Address').show().focus();
                    $this.gmapsFineTuner('moveMap', 14);
                });
                data.townsBox.keypress(function (e) { 
                    var code = null; 
                    code = (e.keyCode ? e.keyCode : e.which);

                    if (code == 13) {
                        data.townsBox.change();
                    }

                    return (code == 13) ? false : true; });
                // END THE TOWNS BOX


                // BEGIN THE STREET BOX
                data.streetBox = $('<input type="text" value="Address">').hide();
                // Do something when the towns box is changed
                data.streetBox.change(function() {
                    $this.gmapsFineTuner('setStreet', $(this).val());
                    $this.gmapsFineTuner('moveMap', 17);
                });
                data.streetBox.keypress(function (e) { 
                    var code = null; 
                    code = (e.keyCode ? e.keyCode : e.which);

                    if (code == 13) {
                        data.streetBox.change();
                    }

                    return (code == 13) ? false : true; });
                // END THE STREET BOX


                // Add the form to our form div
                data.formDiv.append(data.countiesBox);
                data.formDiv.append(data.townsBox);
                data.formDiv.append(data.streetBox);


                $this.append(data.formDiv);
                $this.append(data.gmapDiv);
                $this.append(data.coordsBox);

                $this.gmapsFineTuner('createMap');
                

            });
        },
        setLocation : function( street, town, county ) {
            var data = $(this).data('gmapsFineTuner');
            $(this).gmapsFineTuner('setCounty', county);
            $(this).gmapsFineTuner('setTown', town);
            $(this).gmapsFineTuner('setStreet', street);
            
            var zoomLevel;
            if (street != "" && town != "" && county != "") zoomLevel = 17;
            else if (town != "" && county != "") zoomLevel = 14;
            else if (county != "") zoomLevel = 9;
            else zoomLevel = data.options.startZoom;
            
            $(this).gmapsFineTuner('moveMap', zoomLevel);
        },
        setCounty : function( county ) {
            county = (typeof(county) == "undefined") ? "" : county;
            var data = $(this).data('gmapsFineTuner');
            data.chosenCounty = (county != "") ? data.options.countyPrefix + county : "";
        },
        setTown : function( town ) {
            town = (typeof(town) == "undefined") ? "" : town;
            var data = $(this).data('gmapsFineTuner');
            data.chosenTown = (town != "") ? town + ", " : "";
        },
        setStreet : function( street ) {
            street = (typeof(street) == "undefined") ? "" : street;
            var data = $(this).data('gmapsFineTuner');
            data.chosenStreet = (street != "") ? street + ", " : "";
        },
        createMap : function() {
            var data = $(this).data('gmapsFineTuner');
            data.gmapsFineTunerGeocoder = new google.maps.Geocoder();
            var latlng = new google.maps.LatLng(data.options.startLatLng.lat, data.options.startLatLng.lng);
            var myOptions = {
              zoom: data.options.startZoom,
              center: latlng,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            data.gmapsFineTunerMap = new google.maps.Map(document.getElementById( data.gmapDiv.attr('id') ),
                myOptions);

            data.gmapsFineTunerRadar = new google.maps.Circle( data.options.radar );
            data.gmapsFineTunerMarker = new google.maps.Marker( data.options.marker );
            data.gmapsFineTunerMarker.setMap(data.gmapsFineTunerMap);
            google.maps.event.addListener(data.gmapsFineTunerMarker, 'dragend', function(event) {
                data.coordsBox.val(event.latLng.toUrlValue());
            });

            google.maps.event.addListener(data.gmapsFineTunerMap, 'click', function(event) {
                data.coordsBox.val(event.latLng.toUrlValue());
                data.gmapsFineTunerMarker.setPosition(event.latLng);
                data.gmapsFineTunerMap.setCenter(event.latLng);
                data.gmapsFineTunerMap.setZoom(17);
                data.gmapsFineTunerMarker.setVisible();
                data.gmapsFineTunerRadar.setMap(null);
            });
            
        },
        moveMap : function( zoom ) {
            var data = $(this).data('gmapsFineTuner');
                zoom = (typeof(zoom) == "undefined") ? data.options.startZoom : zoom;
                // Moves the map to the required location
                data.fullAddress = data.chosenStreet + data.chosenTown + data.chosenCounty + ", " + data.options.country;

                data.gmapsFineTunerGeocoder.geocode( { 'address': data.fullAddress}, function(results, status) {

                    if (status == google.maps.GeocoderStatus.OK) {
                        data.gmapsFineTunerLastPositon = results[0].geometry.location;
                    }

                    data.gmapsFineTunerMap.setCenter(data.gmapsFineTunerLastPositon);
                    data.gmapsFineTunerMarker.setPosition(data.gmapsFineTunerLastPositon);

                    data.coordsBox.val(data.gmapsFineTunerLastPositon.toUrlValue());

                    if (results[0].geometry.location_type == "APPROXIMATE") {
                        // This is only approximate so lets give them a radar so they can
                        // click to add their own specific point!
                        data.gmapsFineTunerRadar.setCenter(data.gmapsFineTunerLastPositon);
                        data.gmapsFineTunerRadar.setMap(data.gmapsFineTunerMap);

                        data.gmapsFineTunerRadar.setOptions( { radius : (zoom == 9) ? 35000 : 1100 } )

                    } else {
                        // We are pretty sure this is where they want to be so lets drop a marker!
                        data.gmapsFineTunerMarker.setVisible();
                        data.gmapsFineTunerRadar.setMap(null);
                    }

                    data.gmapsFineTunerMap.setZoom(zoom);

                });
        }
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