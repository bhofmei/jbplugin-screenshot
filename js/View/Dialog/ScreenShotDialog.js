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

        var mainPaneLeft = dom.create('div',{'id':'screenshot-dialog-pane-left'});
        dom.create('h2',{'innerHTML':'General configurations'}, mainPaneLeft);
        var table = dom.create('table',{'id':'screenshot-dialog-opt-table'},mainPaneLeft);
        // check box parameters -> location overview, tracklist, nav, menu bars
        var boxParam = thisB.parameters.box;
        var param;
        for(param in boxParam){
            var data = boxParam[param];
            var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},table);
            dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
            var boxD = dom.create('td',{},row);
            var box = new dijitCheckBox({
               id:'screenshot-dialog-opt-box-'+param,
                _prop: param,
                checked: data.value
            });
            box.onClick = dojo.hitch(thisB, '_setParameter', box);
            box.placeAt(boxD,'first');
        } // end for param

        // spinner parameters -> zoom and track spacing
        var spinnerParam = thisB.parameters.spinner;
        for(param in spinnerParam){
            var data = spinnerParam[param];
            var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},table);
            dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
            var spinD = dom.create('td',{},row);
            var spinner = new dijitNumberSpinner({
                id:'screenshot-dialog-'+param+'-spinner',
                value: data.value,
                _prop:param,
                constraints: (param === 'zoom'? {min:1,max:10} : {min:0,max:40}),
                smallDelta:(param === 'zoom' ? 1 : 5),
                intermediateChanges:true,
                style:"width:50px;"
            });
            spinner.onChange = dojo.hitch(thisB, '_setParameter',spinner);
            spinner.placeAt(spinD,'first');
        }

        // methylation -> if plugin is installed
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var row = dom.create('tr',{'id':'screenshot-dialog-row-methyl'},table);
            dom.create('td',{innerHTML:'Methylation',className:'screenshot-dialog-pane-label', 'colspan':2},row);
            var row2 = dom.create('tr',{'id':'screenshot-dialog-row-methyl-boxes'},table);
            var methylD = dom.create('td',{'colspan':2},row2);
            var m;
            for (m in thisB.parameters.methylation){
                var mbox = new dijitCheckBox({
                    id:'screenshot-dialog-methyl-'+m,
                    class:m+'-checkbox',
                    _prop:m,
                    checked: thisB.parameters.methylation[m]
                });
                mbox.onClick = dojo.hitch(thisB, '_setMethylation', mbox);
                dom.create('span',{innerHTML:m},methylD);
                methylD.appendChild(mbox.domNode);
            }
        }

        this.set('content', [
            mainPaneLeft
        ] );

        this.inherited( arguments );
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
        // check box parameters
        if(input.hasOwnProperty('checked')){
            if(this.parameters.box.hasOwnProperty(prop))
                this.parameters.box[prop].value = !! input.checked;
        }
        // else spinner
        else{
            if(this.parameters.spinner.hasOwnProperty(prop))
                this.parameters.spinner[prop].value = input.value;
        }
    },

    _getInitialParameters: function(){
        var config = this.browser.config;
        // spinner -> zoom and trackSpacing
        var zoom = { value: config.highResolutionMode, title: 'Zoom factor'};
        if (typeof zoom.value !== 'number')
            zoom.value = 1
        var trackSpacing = {value: undefined, title: 'Track spacing'};
        if(config.view.trackPadding !== undefined)
            trackSpacing.value = config.view.trackPadding;
        // check boxes -> location overview, tracklist, nav, menu bars, track labels
        var locOver = { value: config.show_overview, title:'Show location overview' };
        var trackList = { value: config.show_tracklist, title:'Show track list' };
        var nav = { value: config.show_nav, title:'Show navigation bar' };
        var menu = { value: config.show_menu, title:'Show menu bar' }
        var labels = {value:true, title:'Show track labels'}
       return { spinner: {zoom: zoom, trackSpacing: trackSpacing},
               box:{locOver, trackList, nav, menu, labels}, methylation:{CG:true, CHG:true, CHH:true} }
    }
});
});
