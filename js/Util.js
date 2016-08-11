define( "ScreenShotPlugin/Util", [
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/json'
    ],
function (
    declare,
    array,
    json
) {
var Util;
Util = {
    encode: function(inputs){
    // returns string with encode options for screenshot
        var gInputs = inputs.general;
        var tInputs = inputs.tracks;
        console.log(tInputs);
        return this._encodeGeneralSettings(gInputs) + this._endcodeTrackSettings(tInputs);
    },

    encodePhantomJSSettings: function(params){
        // params include url, format, height, width, zoom
        // ?request={url:"http://www.highcharts.com/demo/pie-donut",renderType:"jpg",renderSettings:{zoomFactor:2,viewport:{width:100,height:500}}}
        var outDict = {url: params.url, renderType: params.format.value, renderSettings: {
            zoomFactor: params.zoom.value, viewport: {width:params.width.value, height: params.height.value}}};
        var outString = json.stringify(outDict);
        outString = outString.replace(/\"([^(\")"]+)\":/g,"$1:");
        return '?request='+outString;
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

    _endcodeTrackSettings: function(tracks){
        var output = '';
        // go through object
        var t, params;
        for(t in tracks){
            params = tracks[t];
            // if we need to encode params
            if (params.hasOwnProperty('opts') === false){
                output += this._encodeTrack(params);
            }
        }
        return(output);
    },

    _encodeTrack: function(params){
        // q[0|1] quantitative, y[0|1|2|3] yscale none, center, left, right
        // h# track height, i# min, x# max
        var eLabels = {height: 'h', min: 'i', max: 'x', quant: 'q', ypos: 'y'};
        var locDict = {'none': 0, 'center': 1, 'left': 2, 'right':3 };
        var param, data;

        var output = '~' + params.trackNum;
        // loop through parameters
        for(param in params){
            data = params[param];
            if(!(data === undefined || data.value === undefined || eLabels.hasOwnProperty(param)===false )){
                output += eLabels[param]
                // ypos
                if (param === 'ypos')
                    output += locDict[data.value];
                else if(param === 'quant')
                    output += this._encodeBoolean(data);
                else
                    output += data.value;
            }
        } // end param
        return(output)
    },

    _encodeBoolean: function(input){
        return (input ? '1' : '0');
    },

    _decodeBoolen: function(input){
        return(input==='1' ? true : false)
    },

    _decodeGeneralSettings: function (input){
        var outProp = {basic:{}, view:{},methylation:{}};
        // zoom
        var resultZ = /z([0-9]+)/gi.exec(input);
        if (resultZ != null)
            outProp.basic['highResolutionMode'] = parseInt(resultZ[1]);
        // overview
        var resultO = /o([0-1])/gi.exec(input);
        if (resultO != null)
            outProp.basic['show_overview'] = this._decodeBoolen(resultO[1]);
        // tracklist
        var resultR = /r([0-1])/gi.exec(input);
        if (resultR != null)
            outProp.basic['show_tracklist'] = this._decodeBoolen(resultR[1]);
        // navigation
        var resultN = /n([0-1])/gi.exec(input);
        if (resultN != null)
            outProp.basic['show_nav'] = this._decodeBoolen(resultN[1]);
        // menu
        var resultU = /u([0-1])/gi.exec(input);
        if (resultU != null)
            outProp.basic['show_menu'] = this._decodeBoolen(resultU[1]);
        // labels
        var resultB = /b([0-1])/gi.exec(input);
        if (resultB != null)
            outProp.basic['show_tracklabels'] = this._decodeBoolen(resultB[1]);

        // track padding
        var resultP = /p([0-9]+)/gi.exec(input);
        if (resultP != null)
            outProp.view['trackPadding'] = parseInt(resultP[1]);
        // methylation
        var resultM = /m([0-9]+)/gi.exec(input);
        if (resultM != null){
            outProp.methylation['CG'] = this._decodeBoolen(resultM[1].substring(0,1));
            outProp.methylation['CHG'] = this._decodeBoolen(resultM[1].substring(1,2));
            outProp.methylation['CHH'] = this._decodeBoolen(resultM[1].substring(2,3));
        }
        return outProp;
    }

}
    return Util
});
