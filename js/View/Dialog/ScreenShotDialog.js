define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/CheckBox',
    'JBrowse/View/Dialog/WithActionBar',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/Model/Location'
    ],
function (
    declare,
    dom,
    focus,
    dijitCheckBox,
    ActionBarDialog,
    on,
    Button,
    Location
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
        console.log(this.parameters);
        this.requestUrl = args.requestUrl;
        this.setCallback    = args.setCallback || function() {};
        this.cancelCallback = args.cancelCallback || function() {};
     },
     
     _fillActionBar: function( actionBar ){
        var ok_button = new Button({
            label: "OK",
            onClick: dojo.hitch(this, function() {
                console.log(this.parameters);
                //console.log(this.browser.makeCurrentViewURL());
                //console.log(this.browser.makeCurrentViewURL({nav:0}));
                this.setCallback && this.setCallback( );
                this.hide();
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
        // get inital parameters

        var mainPane = dom.create('div',{'id':'screenshot-dialog-pane'});
        dom.create('h3',{'innerHTML':'General configurations'}, mainPane);
        // zoom parameters -> number slider

        // track spacing -> numer slider

        // methylation -> if plugin is installed
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var methylPane = dom.create('div',{'id':'screenshot-dialog-pane-methylation'},mainPane);
            dom.create('h2',{innerHTML:'Methylation'},methylPane);
            var m;
            for (m in thisB.parameters['methylation']){
                var box = new dijitCheckBox({
                    id:'screenshot-dialog-methyl-'+m,
                    class:m+'-checkbox',
                    _prop:m,
                    checked: thisB.parameters['methylation'][m]
                });
                box.onClick = dojo.hitch(thisB, '_setMethylation', box);
                methylPane.appendChild(box.domNode);
                dom.create('br',methylPane);
                dom.create('label',{'for':'screenshot-dialog-methyl-'+m, 'innerHTML':m+' '},methylPane);
            }
        }

        this.set('content', [
            mainPane
        ] );

        this.inherited( arguments );
    },
    
    hide: function() {
        this.inherited(arguments);
        window.setTimeout( dojo.hitch( this, 'destroyRecursive' ), 500 );
    },
    _setMethylation: function(box){
        if(this.parameters.methylation.hasOwnProperty(box._prop)){
            this.parameters['methylation'][box._prop] = box.checked;
        }
    },
    _getInitialParameters: function(){
        var browser = this.browser;
        // zoom
        var zoom = browser.config.highResolutionMode;
        if (typeof zoom !== 'number')
            zoom = 1
        // track spacing
        var trackSpacing = undefined;
        if(browser.config.view.trackPadding !== undefined)
            trackSpacing = browser.config.view.trackPadding;
       return {zoom: zoom, trackSpacing: trackSpacing, methylation:{CG:true, CHG:true, CHH:true}}
    }
});
});
