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
            console.log(browser.config);
            if(browser.config.queryParams.hasOwnProperty('screenshot')){
                thisB.isScreenshot = true;
                var encoded = browser.config.queryParams.screenshot;
                var trackList = browser.config.queryParams.tracks;
                var decoded = Util.decode(encoded,trackList);
                // apply
                thisB._applyScreenshotConfig(decoded);
                browser.afterMilestone('loadConfig', function(){
                    thisB._applyMethylationConfig( decoded.general.methylation );
                    thisB._applyTracksConfig(decoded.tracks);
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
        // params have general and track-specific
        // params.general have basic, methylation, view, labels
        // Note: this.browser.config gets overwritten with each mixin
        lang.mixin(this.browser.config, params.general.basic);
        lang.mixin(this.browser.config.view, params.general.view);
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

    _applyTracksConfig: function(params){
        var thisB = this;
        var tracks = lang.clone(thisB.browser.trackConfigsByName);
        // loop through tracks
        var t;
        for (t in tracks){
            //console.log(thisB.browser.trackConfigsByName[t]);
            if(params.hasOwnProperty(t)){
                // pull out histograms and/or style
                var hist = params[t].histograms;
                if(hist !== undefined){
                    lang.mixin(thisB.browser.trackConfigsByName[t]['histograms'], hist);
                    delete params[t].histograms;
                }
                var style = params[t].style;
                if(style !== undefined){
                    lang.mixin(thisB.browser.trackConfigsByName[t]['style'], style);
                    delete params[t].style;
                }
                lang.mixin(thisB.browser.trackConfigsByName[t], params[t]);
            }
        }
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
