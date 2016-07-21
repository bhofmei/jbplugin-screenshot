define( "ScreenShotPlugin/Util", [
    'dojo/_base/declare',
    'dojo/array'
    ],
function (
    declare,
    array
) {
var Util;
Util = {
    encode: function(inputs){
    // returns string with encode options for screenshot
    },

    decode: function(inStr){
    // returns javascript object to be applied

    },

    _encodeGeneralSettings: function(zoom, trackSpacing, showCG, showCHG, showCHH){
        var output = '';
        if zoom !== undefined:
            output += 'z' + zoom;
        if trackSpacing !== undefined:
            output += 't' + trackSpacing
        // showCG, showCHG, show CHH must be defined
        if (! showCG ) || (! showCHG ) || (! showCHH ){
            output += 'm' + (showCG ? '1' : '0' )+ (showCHG ? '1' : '0' ) + (showCHH ? '1' : '0' )
        }
        return output;
    },

    _decodeGeneralSettings: function (input){
        // regex search for zoom
        outProp = {};
        var zoomResult = /z([0-9]+)/.exec(input);
        if (zoomResult !== null){
            outProp['highResolutionMode'] = zoomResult[1];
        }

    }

}
    return Util
});
