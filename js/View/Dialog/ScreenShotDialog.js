define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dijit/focus',
    'dijit/form/CheckBox',
    'dijit/form/NumberSpinner',
    'dijit/form/RadioButton',
    'dijit/layout/ContentPane',
    'dijit/layout/AccordionContainer',
    'JBrowse/View/Dialog/WithActionBar',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/Model/Location',
    'ScreenShotPlugin/Util'
    ],
function (
    declare,
    lang,
    dom,
    array,
    focus,
    dijitCheckBox,
    dijitNumberSpinner,
    dijitRadioButton,
    dijitContentPane,
    dijitAccordionContainer,
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
        this.vTracks = this.browser.view.visibleTracks();
        console.log(this.vTracks);
        this.trackParameters = this._getTrackParameters();
         console.log(this.trackParameters);
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
                //console.log(url);
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

       var mainPaneRight = dom.create('div',
            {className: 'screenshot-dialog-pane',
            'id':'screenshot-dialog-pane-right',
            className:'screenshot-dialog-pane'});

        /*var mainPaneRightM = new dijitContentPane({
            className: 'screenshot-dialog-pane',
            id: 'screenshot-dialog-pane-right',
            title: 'Track-specific configuration options'
        });
        var mainPaneRight = mainPaneRightM.containerNode;*/
        thisB._paneTracks( mainPaneRight );

        var paneFooter = dom.create('div',{class:'screenshot-dialog-pane-bottom-warning',innerHTML:'Local configuration changes will be ignored. Default configuration will be used unless specified in this dialog.<br>Rendering will open a new window.'});

        this.set('content', [
            mainPaneLeft,
            mainPaneRight,
            paneFooter
        ] );

        this.inherited( arguments );
    },
    
    _paneGen: function(obj){
        var thisB = this;
        var viewParam = thisB.parameters.view;
        var param;
        dom.create('h2',{'innerHTML':'General configuration options'}, obj);
        var table = dom.create('table',{'class':'screenshot-dialog-opt-table'}, obj);
        // check box parameters -> location overview, tracklist, nav, menu bars
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
                        _prop: param
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
                        _prop:param,
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

    _paneTracks: function(rPane){
        var thisB = this;
        var locationList = ['left','center','right','none'];
        dom.create('h2',{'innerHTML':'Track-specific configuration options'}, rPane);

        var acc = new dijitAccordionContainer({
            id:'screenshot-dialog-pane-accordian'
        });
        var label, tParams, pane, param;
        // need to loop through the tracks and create content panes
        array.forEach(thisB.vTracks, function(track){
            // get parameters
            label = track.config.label
            tParams = thisB.trackParameters[label];
            pane = new dijitContentPane({
                title: (tParams.key===undefined ? label : tParams.key ),
                id: 'screenshot-dialog-track-'+label
            });
            var obj = pane.containerNode;

            if(tParams.opts === false){
                pane.set('content','No available options');
                acc.addChild(pane);
                return
            }
            var table = dom.create('table',{'class':'screenshot-dialog-opt-table'}, obj);
            // loop through parameters
            for(param in tParams){
                // yscale is radio boxes
                if(param === 'ypos'){
                    // yscale position radio boxes
                    if(tParams.ypos !== false){
                        var row = dom.create('tr',{'id':'screenshot-dialog-row-'+label+'-ypos'},table);
                        dom.create('td',{'innerHTML':'Y-scale position','class':'screenshot-dialog-pane-label'}, row);
                        array.forEach(locationList, function(loc){
                            var button = new dijitRadioButton({
                                name:'yscale-'+label,
                                checked: loc === tParams.ypos,
                                id:'screenshot-dialog-radio-'+label+'-'+loc,
                                value: loc,
                                _label: label,
                                _prop: 'ypos'
                        });
                        button.onClick = dojo.hitch(thisB, '_setTrackParameter', button);
                        var td = dom.create('td',{class:'screenshot-dialog-td-button'},row);
                        button.placeAt(td,'first');
                        dom.create('label',{"for":'yscale-dialog-radio-'+label+'-'+loc, innerHTML: loc}, td);
                    });
                    } // end y-scale position
                }
                else if(param==='methyl'){
                    // methylation check boxes
                    var data = tParams.methyl;
                    var row = dom.create('tr',{'id':'screenshot-dialog-row-'+label+'-methyl'},table);
                    dom.create('td',{'innerHTML':'Methylation','class':'screenshot-dialog-pane-label'}, row);
                    for(var m in data){
                        var box = new dijitCheckBox({
                                checked: tParams.methyl[m],
                                id:'screenshot-dialog-radio-'+label+'-'+m,
                                value: m,
                                class: m+'-checkbox',
                                _label: label,
                                _prop: 'methyl'
                        });
                        box.onClick = dojo.hitch(thisB, '_setTrackParameter', box);
                        var td = dom.create('td',{class:'screenshot-dialog-td-button'},row);
                        box.placeAt(td,'first');
                        dom.create('label',{"for":'yscale-dialog-radio-'+label+'-'+m, innerHTML: m}, td);
                    }

                }
                else{
                    // otherwise its a number spinner text box thing
                }
            } // end for param

            acc.addChild(pane);
        });

        acc.placeAt(rPane);
        acc.startup();
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

    _setTrackParameter: function(input){
        var tLabel = input._label;
        var prop = input._prop;
        // handle methylation
        if(prop === 'methyl'){
            if(this.trackParameters[tLabel].methyl.hasOwnProperty(input.value)){
                this.trackParameters[tLabel].methyl[input.value] = input.checked;
            }
        }
        if(input.hasOwnProperty('checked' && input.checked)){
            if(this.trackParameters.hasOwnProperty(tLabel)){
                this.trackParameters[tLabel][prop] = input.value;
            }
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
        zoom['min'] = 0;
        zoom['max'] = 10;
        zoom['delta'] = 1;
        var format = {value: 'JPG', title: 'Output format'}
        var width = {value: 3300, title: 'Width (px)', min:100, max:10000, delta:100}
        var height = {value: 2400, title: 'Height (px)', min:100, max:10000, delta:100}
        var quality = {value: 70, title: 'Render quality', min:0, max:100, delta:10}

       return { view:{trackSpacing, locOver, trackList, nav, menu, labels}, methylation:{CG:true, CHG:true, CHH:true}, output: {format, zoom, quality, width, height} }
    },

    _getTrackParameters: function(){
        var thisB = this;
        var out = {};
        array.forEach(this.vTracks, function(track){
           var tType = track.config.type;
            // handle parameters by type
            out[track.config.label] = thisB._handleTrackTypeParameters(tType, track.config);
        });
        return out;
    },

    _handleTrackTypeParameters(tType, config){
        var out = {key:config.key};
        // DNA sequence has no options for now
        if(/\b(Sequence)/.test( tType )){
            lang.mixin(out,{opts:false});
            return out;
        }
        // test methylation tracks
       if(/\b(MethylPlot)/.test( tType )|| /\b(MethylPlot)/.test( tType )){
            lang.mixin(out,{methyl:{CG: config.showCG, CHG: config.showCHG, CHH: config.showCHH}});
            // also mixin the bigwig like features
            lang.mixin(out, {ypos:config.yScalePosition, min: config.min_score, max: config.max_score, height: config.style.height, quant:true});
        }
        // test bigwig
        else if(/\b(XYPlot)/.test( tType ) || /\b(XYDensity)/.test( tType )){
            lang.mixin(out, {ypos:config.yScalePosition, min: config.min_score, max: config.max_score, height: config.style.height, quant:true});
        }
        // else get track height from maxHeight and set ypos = false
        else{
            lang.mixin(out, {height:config.maxHeight, ypos: false});
        }
        // Canvas/Alignments2 have maxHeight option and possibly histogram with min/max and height
        // test for histograms
        if(config.histograms !== undefined){
            lang.mixin(out, {min: config.histograms.min, max: config.histograms.max, ypos: config.yScalePosition, quant: false});
        }
        return out;
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
