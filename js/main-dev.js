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
            //console.log(browser);
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
            console.log('call')
            thisB.browser.showTrackLabels((thisB.browser.config.show_tracklabels ? 'show' : 'hide'))
        }
    }
});
});
