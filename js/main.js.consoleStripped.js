require({cache:{
'ScreenShotPlugin/View/Dialog/ScreenShotDialog':function(){
define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dijit/focus',
    'dijit/form/CheckBox',
    'dijit/form/NumberSpinner',
    'dijit/form/RadioButton',
    'dijit/layout/ContentPane',
    'JBrowse/View/Dialog/WithActionBar',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/Model/Location',
    'ScreenShotPlugin/Util'
    ],
function (
    declare,
    dom,
    array,
    focus,
    dijitCheckBox,
    dijitNumberSpinner,
    dijitRadioButton,
    dijitContentPane,
    ActionBarDialog,
    on,
    Button,
    Location,
    Util
) {

return declare (ActionBarDialog,{
    /**
     * Dijit Dialog subclass to take a screenshot
     */
     
     title: 'Take screenshot',
     autofocus: false,
     
     constructor: function( args ){
        this.browser = args.browser;
        this.parameters = this._getInitialParameters();
        this.requestUrl = args.requestUrl;
        this.setCallback    = args.setCallback || function() {};
        this.cancelCallback = args.cancelCallback || function() {};
     },
     
     _fillActionBar: function( actionBar ){
        dojo.addClass(actionBar, 'screenshot-dialog-actionbar');
        var ok_button = new Button({
            label: "Render",
            onClick: dojo.hitch(this, function() {
                // screenshot parameters
                var gParams = this.parameters.view;
                gParams['methylation']=this.parameters.methylation;
                gParams['zoom'] = this.parameters.output.zoom
                var scParams = {general: gParams};
                // js params
                var jsParams = this.parameters.output;
                // get the url
                var url = this._getPhantomJSUrl(scParams, jsParams);
                //0 && console.log(url);
                window.open(url);
                this.setCallback && this.setCallback( );
                //this.hide();
            })
        }).placeAt(actionBar);

        var cancel_button = new Button({
            label: "Cancel",
            onClick: dojo.hitch(this, function() {
                this.cancelCallback && this.cancelCallback();
                this.hide();
            })
        }).placeAt(actionBar);
     },
    
    show: function( callback ) {
        var thisB = this;
        dojo.addClass(this.domNode, 'screenshot-dialog')

        var mainPaneLeft = dom.create('div',
            {className: 'screenshot-dialog-pane',
            'id':'screenshot-dialog-pane-left'});
        var mainPaneLeftTop = new dijitContentPane({
            className: 'screenshot-dialog-pane-sub',
            'id':'screenshot-dialog-pane-left-top',
            title:'General configuration options'
        });
        var mainPaneLeftT = mainPaneLeftTop.containerNode;
        thisB._paneGen(mainPaneLeftT);
        mainPaneLeftTop.placeAt(mainPaneLeft);


        var mainPaneLeftBottom = new dijitContentPane({
            className:'screenshot-dialog-pane-sub',
            id:'screenshot-dialog-pane-left-bottom',
            title:'Output configuration options'
        });
        var mainPaneLeftB = mainPaneLeftBottom.containerNode;
        thisB._paneOut(mainPaneLeftB);
        mainPaneLeftBottom.placeAt(mainPaneLeft);

        // for tracks

        var mainPaneRightM = new dijitContentPane({
            className: 'screenshot-dialog-pane',
            id: 'screenshot-dialog-pane-right',
            title: 'Track-specific configuration options'
        });
        var mainPaneRight = mainPaneRightM.containerNode;
        thisB._paneTracks( mainPaneRight );

        var paneFooter = dom.create('div',{className:'screenshot-dialog-pane-bottom-warning',innerHTML:'Local configuration changes will be ignored. Default configuration will be used unless specified in this dialog.<br>Rendering will open a new window.'});

        this.set('content', [
            mainPaneLeft,
            mainPaneRightM.domNode,
            paneFooter
        ] );

        this.inherited( arguments );
    },
    
    _paneGen: function(obj){
        var thisB = this;
        var viewParam = thisB.parameters.view;
        var param;
        dom.create('h2',{'innerHTML':'General configuration options'}, obj);
        var table = dom.create('table',{className:'screenshot-dialog-opt-table'}, obj);
        // check box parameters -> location overview, tracklist, nav, menu bars
        for(param in viewParam){
            var data = viewParam[param];
            var row = dom.create('tr',{id:'screenshot-dialog-row-'+param},table);
            dom.create('td',{innerHTML:(param === 'labels' ? '' : data.title),'class':'screenshot-dialog-pane-label'}, row);
            var td = dom.create('td',{className:'screenshot-dialog-pane-input'},row);
            var input;
            if(param === 'trackSpacing'){
                input = new dijitNumberSpinner({
                    id:'screenshot-dialog-'+param+'-spinner',
                    value: data.value,
                    '_prop':param,
                    constraints: {min:0,max:40},
                    smallDelta:5,
                    intermediateChanges:true,
                    style:"width:50px;"
                });
            }else{
                //if(param === 'labels' && thisB.browser.plugins.hasOwnProperty('HideTrackLabels')===false){
                if(param === 'labels'){
                    input = null;
                }else{
                input = new dijitCheckBox({
                    id:'screenshot-dialog-opt-box-'+param,
                    '_prop': param,
                    checked: data.value
                });
                }
            }
            if(input !== null){
                input.onClick = dojo.hitch(thisB, '_setParameter', input);
                input.placeAt(td,'first');
            }
        } // end for param
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var row = dom.create('tr',{'id':'screenshot-dialog-row-methyl'},table);
            dom.create('td',{innerHTML:'Methylation',className:'screenshot-dialog-pane-label', 'colspan':2},row);
            var row2 = dom.create('tr',{'id':'screenshot-dialog-row-methyl-boxes'},table);
            var methylD = dom.create('td',{'colspan':2},row2);
            var m;
            for (m in thisB.parameters.methylation){
                var mbox = new dijitCheckBox({
                    id:'screenshot-dialog-methyl-'+m,
                    className:m+'-checkbox',
                    '_prop':m,
                    checked: thisB.parameters.methylation[m]
                });
                mbox.onClick = dojo.hitch(thisB, '_setMethylation', mbox);
                dom.create('span',{innerHTML:m,className:'screenshot-dialog-opt-span'},methylD);
                methylD.appendChild(mbox.domNode);
            }
        }
    },

    _paneOut: function(obj){
        var thisB = this;
        dom.create('h2',{'innerHTML':'Output configuration options'}, obj);
        var tableB = dom.create('table',{'class':'screenshot-dialog-opt-table'},obj);
        var param;
        // output options -> format (PNG, JPEG, PDF), height, width
        var outParam = thisB.parameters.output;
        for(param in outParam){
            var data = outParam[param];
            if(param === 'format'){
                var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param,'colspan':2},tableB);
                dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                var row2 = dom.create('tr',{'class':'screenshot-dialog-pane-input'},tableB);
                var outD = dom.create('td',{'colspan':2},row2);
                // 3 check boxes
                //var formatTypes = ['PNG','JPG','PDF'];
                var formatTypes = ['PNG','JPG'];
                var formatTypeTitles = {'PNG':'transparent background','JPG':'white background', 'PDF':'contains svg-like objects'}
                array.forEach(formatTypes, function(f){
                    var btn = new dijitRadioButton({
                        id: 'screenshot-dialog-output-'+f,
                        checked: f === thisB.parameters.output.format.value,
                        value: f,
                        '_prop': param
                    });
                    btn.onClick = dojo.hitch(thisB, '_setParameter', btn);
                    dom.create('span',{innerHTML:f, className:'screenshot-dialog-opt-span',title:formatTypeTitles[f]},outD);
                    outD.appendChild(btn.domNode);
                });
            } else {
                // number spinners
                var data = outParam[param];
                var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},tableB);
                dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                var spinD = dom.create('td',{'class':'screenshot-dialog-pane-input'},row);
                // create slider for quality and spinner for other
                var widget = new dijitNumberSpinner({
                        id:'screenshot-dialog-'+param+'-spinner',
                        value: data.value,
                        '_prop':param,
                        //constraints: (param === 'zoom' ? {min:1,max:10} : {min:100,max:10000,pattern:'###0'}),
                        constraints: {min: data.min, max: data.max},
                        smallDelta:data.delta,
                        intermediateChanges:true,
                        style:"width:75px;"
                });
                widget.onChange = dojo.hitch(thisB, '_setParameter',widget);
                widget.placeAt(spinD,'first');
            }
        }
    },

    _paneTracks: function(obj){
        var thisB = this;
        dom.create('h2',{'innerHTML':'Track-specific options'}, obj);
        dom.create('p',{'innerHTML':'Coming soon'}, obj);
    },

    hide: function() {
        this.inherited(arguments);
        window.setTimeout( dojo.hitch( this, 'destroyRecursive' ), 500 );
    },

    _setMethylation: function(box){
        if(this.parameters.methylation.hasOwnProperty(box._prop)){
            this.parameters.methylation[box._prop] = box.checked;
        }
    },

    _setParameter: function(input){
        var prop = input._prop;
        // format radio box parameter
        if(prop === 'format'){
            if(input.checked && this.parameters.output.hasOwnProperty(prop))
                this.parameters.output[prop].value = input.value;
        }
        // check box parameters
        else if(input.hasOwnProperty('checked')){
            if(this.parameters.view.hasOwnProperty(prop))
                this.parameters.view[prop].value = !! input.checked;
        }
        // else spinner or slider
        else{
            if(this.parameters.view.hasOwnProperty(prop))
                this.parameters.view[prop].value = input.value;
            else if(this.parameters.output.hasOwnProperty(prop))
                this.parameters.output[prop].value = input.value;
        }
    },

    _getInitialParameters: function(){
        // get browser parameterss
        var config = this.browser.config;
        // spinner -> zoom and trackSpacing
        var zoom = { value: config.highResolutionMode, title: 'Zoom factor'};
        if (typeof zoom.value !== 'number')
            zoom.value = 1
        var trackSpacing = {value: 20, title: 'Track spacing'};
        if(config.view !== undefined && config.view.trackPadding !== undefined)
            trackSpacing.value = config.view.trackPadding;
        // check boxes -> location overview, tracklist, nav, menu bars, track labels
        var locOver = { value: config.show_overview, title:'Show location overview' };
        var trackList = { value: config.show_tracklist, title:'Show track list' };
        var nav = { value: config.show_nav, title:'Show navigation bar' };
        var menu = { value: config.show_menu, title:'Show menu bar' };
        var labels = {value: true, title:'Show track labels'};
        // output parameters
        zoom['min'] = 0;
        zoom['max'] = 10;
        zoom['delta'] = 1;
        var format = {value: 'JPG', title: 'Output format'};
        var width = {value: 3300, title: 'Width (px)', min:100, max:10000, delta:100};
        var height = {value: 2400, title: 'Height (px)', min:100, max:10000, delta:100};
        var quality = {value: 70, title: 'Render quality', min:0, max:100, delta:10};

       return { view:{trackSpacing: trackSpacing, locOver: locOver, trackList: trackList, nav:nav, menu:menu, labels:labels}, methylation:{CG:true, CHG:true, CHH:true}, output: {format:format, zoom:zoom, quality:quality, width:width, height:height} };
    },

    _getPhantomJSUrl: function(scParams, jsParams){
        // get current url
        var currentUrl = this.browser.makeCurrentViewURL();
        //var currentUrl = 'http://epigenome.genetics.uga.edu/JBrowse/?data=eutrema&loc=scaffold_1%3A8767030..14194216&tracks=DNA%2Cgenes%2Crepeats%2Ces_h3_1.bw_coverage%2Crna_reads%2Ces_h3k56ac.bw_coverage&highlight=';
        // encode scParams
        var scEncode = Util.encode(scParams);
        currentUrl += '&screenshot='+scEncode;
        currentUrl = currentUrl.replace(/\u0026/g,'%26');
        // encode jsParams
        jsParams['url'] = currentUrl;
        var jsEncode = Util.encodePhantomJSSettings(jsParams);
        // put it all together
        return this.requestUrl + jsEncode;
    }
});
});

},
'ScreenShotPlugin/Util':function(){
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
        return this._encodeGeneralSettings(gInputs);
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

},
'JBrowse/Plugin':function(){
define([
           'dojo/_base/declare',
           'JBrowse/Component'
       ],
       function( declare, Component ) {
return declare( Component,
{
    constructor: function( args ) {
        this.name = args.name;
        this.cssLoaded = args.cssLoaded;
        this._finalizeConfig( args.config );
    },

    _defaultConfig: function() {
        return {
            baseUrl: '/plugins/'+this.name
        };
    }
});
});
}}});
require({cache:{
'JBrowse/Plugin':function(){
define("JBrowse/Plugin", [
           'dojo/_base/declare',
           'JBrowse/Component'
       ],
       function( declare, Component ) {
return declare( Component,
{
    constructor: function( args ) {
        this.name = args.name;
        this.cssLoaded = args.cssLoaded;
        this._finalizeConfig( args.config );
    },

    _defaultConfig: function() {
        return {
            baseUrl: '/plugins/'+this.name
        };
    }
});
});
}}});
define('ScreenShotPlugin/main',[ 
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom',
    "dojo/dom-attr",
    'dijit/form/Button',
    './View/Dialog/ScreenShotDialog',
    './Util',
    'JBrowse/Plugin',
    "JBrowse/Browser"
],
function(
    declare,
    lang,
    array,
    dom,
    domAttr,
    dijitButton,
    ScreenShotDialog,
    Util,
    JBrowsePlugin,
    Browser
){
 
return declare( JBrowsePlugin,
{
    constructor: function( args ) { 
        var baseUrl = this._defaultConfig().baseUrl;
        var browser = this.browser;
        this.isScreenshot = false;

        this.config.apiKey = 'a-demo-key-with-low-quota-per-ip-address';
        // PhantomJS Username
        if( args.config.apiKey !== undefined )
            this.config.apiKey = args.config.apiKey;

        var thisB = this;
        browser.afterMilestone('initPlugins', function(){
            // check for screenshot query parameters
            if(browser.config.queryParams.hasOwnProperty('screenshot')){
                thisB.isScreenshot = true;
                var encoded = browser.config.queryParams.screenshot;
                var decoded = Util.decode(encoded);
                // apply
                thisB._applyScreenshotConfig(decoded);
                browser.afterMilestone('loadConfig', function(){
 thisB._applyMethylationConfig(decoded.methylation);
                });
            }
        });

        browser.afterMilestone('initView',  function() {
            // create screenshot button (possibly tools menu)
            //0 && console.log(browser);
            var menuBar = browser.menuBar;
            function showScreenShotDialog(){
                new ScreenShotDialog({
                    requestUrl: thisB._getPhantomJSUrl(),
                    browser: browser
                }).show();
            }

            if( browser.config.show_menu && (thisB.isScreenshot === false) ){
                var button = new dijitButton({
            className: 'screenshot-button',
            innerHTML: 'Screen Shot',
            title: 'take screen shot of browser',
            onClick: showScreenShotDialog
        });
                menuBar.appendChild( button.domNode );
            }
            // shortcut key
            browser.setGlobalKeyboardShortcut('s', showScreenShotDialog);
        });
        browser.afterMilestone('completely initialized',function(){
            //thisB._applyTrackLabelConfig();
        })
    }, // end constructor
    
    _getPhantomJSUrl: function(){
        return 'https://phantomjscloud.com/api/browser/v2/' + this.config.apiKey + '/'
    },

    _applyScreenshotConfig: function(params){
        // params have basic, methylation, view, labels
        // Note: this.browser.config gets overwritten with each mixin
        lang.mixin(this.browser.config, params.basic);
        lang.mixin(this.browser.config.view, params.view);
    },

    _applyMethylationConfig: function(params){
        var thisB = this;
        //var methylation = thisB.decoded.methylation;
        // check for methylation plugin
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var m,t;
            var tracks = lang.clone(thisB.browser.trackConfigsByName);
            for(m in params){
                if(params[m] === false){
                    var mix = {};
                    mix['show'+m] = false;
                    for(t in tracks){
                        if(thisB._testMethylation(tracks[t].type)){
                            lang.mixin(thisB.browser.trackConfigsByName[t], mix);
                        }
                    }
                } // end if params[m] === false
            } // end for m in params
        } // end if MethylationPlugin
    },
    _testMethylation: function(trackType){
        if(trackType === undefined || trackType === null)
            return false;
        return ((/\b(MethylXYPlot)/.test( trackType )  || /\b(MethylPlot)/.test( trackType ) ));
    },

    _applyTrackLabelConfig: function(){
        var thisB = this;
        if(thisB.browser.plugins.hasOwnProperty('HideTrackLabels')){
            0 && console.log('call')
            thisB.browser.showTrackLabels((thisB.browser.config.show_tracklabels ? 'show' : 'hide'))
        }
    }
});
});
