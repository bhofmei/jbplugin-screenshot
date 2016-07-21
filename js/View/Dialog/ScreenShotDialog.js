define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/CheckBox',
    'dijit/form/NumberSpinner',
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
    dijitNumberSpinner,
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
            label: "Render",
            onClick: dojo.hitch(this, function() {
                console.log(this.parameters);
                //console.log(this.browser.makeCurrentViewURL());
                //console.log(this.browser.makeCurrentViewURL({nav:0}));
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
        // get inital parameters

        var mainPane = dom.create('div',{'id':'screenshot-dialog-pane'});
        dom.create('h2',{'innerHTML':'General configurations'}, mainPane);
        // zoom parameters -> number slider
        var zoomSpinner = new dijitNumberSpinner({
            id:'screenshot-dialog-zoom-spinner',
            value: thisB.parameters.zoom,
            _prop:'zoom',
            constraints: {min:1,max:10},
            smallDelta:1,
            intermediateChanges:true,
            style:"width:35px;margin-left:10px"
        });
        zoomSpinner.onChange = dojo.hitch(thisB, '_setParameter',zoomSpinner);
        dom.create('div',{'innerHTML':'Zoom factor',className:'screenshot-dialog-pane-label',style:'display:inline;'},mainPane);
        mainPane.appendChild(zoomSpinner.domNode);
        dom.create('br',{},mainPane);

        // track spacing -> numer slider
        var trackSpinner = new dijitNumberSpinner({
            id:'screenshot-dialog-track-spinner',
            value: thisB.parameters.trackSpacing,
            _prop:'trackSpacing',
            constraints: {min:0,max:40},
            smallDelta:5,
            intermediateChanges:true,
            style:"width:50px;margin-left:10px"
        });
        zoomSpinner.onChange = dojo.hitch(thisB, '_setParameter',zoomSpinner);
        dom.create('div',{'innerHTML':'Track spacing',className:'screenshot-dialog-pane-label',style:'display:inline;'},mainPane);
        mainPane.appendChild(trackSpinner.domNode);
        dom.create('br',{},mainPane);

        // methylation -> if plugin is installed
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var methylPane = dom.create('div',{'id':'screenshot-dialog-pane-methylation'},mainPane);
            dom.create('div',{innerHTML:'Methylation',className:'screenshot-dialog-pane-label',style:'display:block;'},methylPane);

            var m;
            for (m in thisB.parameters['methylation']){
                var box = new dijitCheckBox({
                    id:'screenshot-dialog-methyl-'+m,
                    class:m+'-checkbox',
                    _prop:m,
                    checked: thisB.parameters['methylation'][m]
                });
                box.onClick = dojo.hitch(thisB, '_setMethylation', box);
                dom.create('span',{innerHTML:m},methylPane);
                methylPane.appendChild(box.domNode);
            }
            dom.create('br',{},methylPane);
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
    _setParameter: function(spinner){
        var prop = spinner._prop;
        if(this.parameters.hasOwnProperty(prop))
            this.parameters[prop] = spinner.value;
    },
     _setTrackSpacing: function(spinner){
        this.parameters.trackSpacing = spinner.value;
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
