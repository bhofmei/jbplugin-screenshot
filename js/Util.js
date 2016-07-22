define( "ScreenShotPlugin/Util", [
    'dojo/_base/declare',
    'dojo/_base/array'
    ],
function (
    declare,
    array
) {
var Util;
Util = {
    encode: function(inputs){
    // returns string with encode options for screenshot
        var gInputs = inputs.general;
        return this._encodeGeneralSettings(gInputs);
    },

    decode: function(inStr){
    // returns javascript object to be applied
        return this._decodeGeneralSettings(inStr);
    },

    _encodeGeneralSettings: function(params){
        // locOver, menu, methylation, nav, trackList, trackSpacing, labels, zoom
        var output = '';
        var eLabels = { zoom:'z', trackSpacing:'p', locOver: 'o', trackList:'r', nav:'n', menu:'u', labels:'b', methylation:'m'};
        var param;
        for(param in params){
            var data = params[param];
            if(param==='methylation')
                output += eLabels[param] + this._encodeBoolean(data.CG) + this._encodeBoolean(data.CHG) + this._encodeBoolean(data.CHH);
            else if((param==='zoom')||(param==='trackSpacing'))
                output += eLabels[param] + data.value;
            else
                output += eLabels[param] + this._encodeBoolean(data.value);
        }
        return output;
    },

    _encodeBoolean: function(input){
        return (input ? '1' : '0');
    },

    _decodeBoolen: function(input){
        return(input==='1' ? true : false)
    },

    _decodeGeneralSettings: function (input){
        // locOver, menu, methylation, nav, trackList, trackSpacing, labels, zoom
        var fLabels = { 'z':'highResolutionMode', 'p':'trackPadding', 'o':'show_overview', 'r':'show_tracklist', 'n':'show_nav', 'u':'show_menu', 'b':'showLabels', 'm':'methylation'};
        var outProp = {basic: {}, view: {}, methylation:{}};
        var prop;
        for(prop in fLabels){
            var p = fLabels[prop];
            var regex = new RegExp("/"+prop+"([0-9]+)/",'gi');
            var result = regex.exec(input);
            if(result !== null){
                // handle the types
                if(prop === 'z')
                    outProp.basic[p] = parseInt(result[1]);
                else if(prop === 'p'){
                    outProp.view[p] = parseInt(result[1]);
                }
                else if(prop === 'm'){
                    outProp.methylation.CG =
                        this._decodeBoolen(result[1].substring(0,1));
                    outProp.methylation.CHG =
                        this._decodeBoolen(result[1].substring(1,2));
                    outProp.methylation.CHH =
                        this._decodeBoolen(result[1].substring(2,3));
                }
                else{
                    outProp.basic[p] = this._decodeBoolen(result[1]);
                }
            }
        }//end for prop
        return outProp;
    }

}
    return Util
});
