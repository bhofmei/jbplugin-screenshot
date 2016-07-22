define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dijit/focus',
    'dijit/form/CheckBox',
    'dijit/form/NumberSpinner',
    'dijit/form/RadioButton',
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
                console.log(url);
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

        var mainPaneLeft = dom.create('div',{'id':'screenshot-dialog-pane-left','class':'screenshot-dialog-pane'});
        dom.create('h2',{'innerHTML':'General configuration options'}, mainPaneLeft);
        var table = dom.create('table',{'class':'screenshot-dialog-opt-table'},mainPaneLeft);
        // check box parameters -> location overview, tracklist, nav, menu bars

        var viewParam = thisB.parameters.view;
        var param;
        for(param in viewParam){
            var data = viewParam[param];
            var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},table);
            dom.create('td',{'innerHTML':(param === 'labels' ? '' : data.title),'class':'screenshot-dialog-pane-label'}, row);
            var td = dom.create('td',{'class':'screenshot-dialog-pane-input'},row);
            var input;
            if(param === 'trackSpacing'){
                input = new dijitNumberSpinner({
                    id:'screenshot-dialog-'+param+'-spinner',
                    value: data.value,
                    _prop:param,
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
                    _prop: param,
                    checked: data.value
                });
                }
            }
            if(input !== null){
                input.onClick = dojo.hitch(thisB, '_setParameter', input);
                input.placeAt(td,'first');
            }
        } // end for param

        // methylation -> if plugin is installed
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            var row = dom.create('tr',{'id':'screenshot-dialog-row-methyl'},table);
            dom.create('td',{innerHTML:'Methylation',class:'screenshot-dialog-pane-label', 'colspan':2},row);
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
                dom.create('span',{innerHTML:m,class:'screenshot-dialog-opt-span'},methylD);
                methylD.appendChild(mbox.domNode);
            }
        }

        // Pane bottom is for output
        var mainPaneBottom = dom.create('div',{'id':'screenshot-dialog-pane-bottom', 'class':'screenshot-dialog-pane'});
        dom.create('h2',{'innerHTML':'Output configuration options'}, mainPaneBottom);
        var tableB = dom.create('table',{'class':'screenshot-dialog-opt-table'},mainPaneBottom);

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
                array.forEach(formatTypes, function(f){
                    var btn = new dijitRadioButton({
                        id: 'screenshot-dialog-output-'+f,
                        checked: f === thisB.parameters.output.format.value,
                        value: f,
                        _prop: param
                    });
                    btn.onClick = dojo.hitch(thisB, '_setParameter', btn);
                    dom.create('span',{innerHTML:f, className:'screenshot-dialog-opt-span'},outD);
                    outD.appendChild(btn.domNode);
                });
            } else {
                // number spinners
                var data = outParam[param];
                var row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},tableB);
                dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                var spinD = dom.create('td',{'class':'screenshot-dialog-pane-input'},row);
                var spinner = new dijitNumberSpinner({
                    id:'screenshot-dialog-'+param+'-spinner',
                    value: data.value,
                    _prop:param,
                    constraints: (param === 'zoom' ? {min:1,max:10} : {min:100,max:10000,pattern:'###0'}),
                    smallDelta:(param === 'zoom' ? 1 : 100),
                    intermediateChanges:true,
                    style:"width:75px;"
                });
                spinner.onChange = dojo.hitch(thisB, '_setParameter',spinner);
                spinner.placeAt(spinD,'first');
            }
        }
        var paneFooter = dom.create('div',{class:'screenshot-dialog-pane-bottom-warning',innerHTML:'Local configuration changes will be ignored. Default configuration will be used unless specified in this dialog.<br>Rendering will open a new window.'});

        this.set('content', [
            mainPaneLeft,
            mainPaneBottom,
            paneFooter
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
        // else spinner
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
        var menu = { value: config.show_menu, title:'Show menu bar' }
        var labels = {value:true, title:'Show track labels'}
        // output parameters
        var format = {value: 'JPG', title: 'Output format'}
        var width = {value: 3300, title: 'Width (px)'}
        var height = {value: 2400, title: 'Height (px)'}

       return { view:{trackSpacing, locOver, trackList, nav, menu, labels}, methylation:{CG:true, CHG:true, CHH:true}, output: {format, zoom, width, height} }
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
