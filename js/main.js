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
    'dijit/form/Button',
    './View/Dialog/ScreenShotDialog',
    'JBrowse/Plugin',
    "JBrowse/Browser"
],
function(
    declare,
    lang,
    dijitButton,
    ScreenShotDialog,
    JBrowsePlugin,
    Browser
){
 
return declare( JBrowsePlugin,
{
    constructor: function( args ) { 
        var baseUrl = this._defaultConfig().baseUrl;
        var thisB = this;
        var browser = this.browser;
        
        console.log(browser);
        this.config.apiKey = 'a-demo-key-with-low-quota-per-ip-address';
        browser.afterMilestone('initView',  function() {
            // get screen resolution
            if(typeof browser.config.highResolutionMode === 'number')
                this.config.resolution = browser.config.highResolutionMode

            // PhantomJS Username
            if( args.config.apiKey !== undefined )
                this.config.apiKey = args.config.apiKey;

            // create screenshot button (possibly tools menu)
            var menuBar = browser.menuBar;
            if(browser.config.show_menu){
                menuBar.appendChild(thisB.makeScreenshotButton());
            }
        })
        
    }, // end constructor
    
    makeScreenshotButton: function(){
        var thisB = this;
        var browser = this.browser;
        var url = 'https://scholar.google.com/';
        var useUrl = thisB.getPhantomJSUrl({url: url});
        
        // make popup
        /*var container = dojo.create('div');
        var link = dojo.create('a',{
            innerHTML: "Results",
            target: '_blank',
            //href: thisB.getPhantomJSUrl({})
            href: useUrl
        }, container);
        
        var screenshotPane = new ActionBarDialog({
            className: 'screenshot-popup',
            title: 'Take screenshot',
            //content: [container],
            setCallback: function(){
                window.open(thisB.getPhantomJSUrl({}));
                console.log('popup callback');
            }
        });*/
        
        // make button
        var button = new dijitButton({
            className: 'screenshot-button',
            innerHTML: 'Screen Shot',
            title: 'take screen shot of browser',
            onClick: function(){
                new ScreenShotDialog({
                    url: useUrl,
                    setCallback: function(){
                        console.log('callback');
                    }
                }).show();
                return false;
            }
        });
        
        return button.domNode;
    },
    
    getPhantomJSUrl: function( args ){
        var browser = this.browser;
        // current view
        var currentUrl = (args.url === undefined ? browser.makeCurrentViewURL() : args.url );
        // replace special characters
        // & -> %26
        currentUrl = currentUrl.replace(/\u0026/g,'%26');
        var renderType = (args.renderType === undefined ? 'png' : args.renderType);
        var height = (args.height === undefined ? '2000' : args.height);
        var width = (args.width === undefined ? '3300' : args.width);
        // if(browser.config.)
        return 'https://phantomjscloud.com/api/browser/v2/' + this.config.apiKey + '/?request={url:%22' + currentUrl + '%22,renderType:%22'+renderType+'%22,renderSettings:{viewport:{width:'+width+',height:'+height+'}}}'
    }
});
});