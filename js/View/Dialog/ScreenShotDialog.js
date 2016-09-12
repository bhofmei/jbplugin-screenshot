define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/on',
    'dijit/focus',
    'dijit/form/CheckBox',
    'dijit/form/NumberSpinner',
    'dijit/form/RadioButton',
    'dijit/layout/ContentPane',
    //'dijit/layout/AccordionContainer',
    'dijit/layout/TabContainer',
    'dijit/form/Button',
    'JBrowse/View/Dialog/WithActionBar',
    'JBrowse/Model/Location',
    'ScreenShotPlugin/Util'
    ],
function (
    declare,
    lang,
    dom,
    array,
    on,
    focus,
    dijitCheckBox,
    dijitNumberSpinner,
    dijitRadioButton,
    dijitContentPane,
    //dijitAccordionContainer,
    dijitTabContainer,
    Button,
    ActionBarDialog,
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
        //console.log(this.vTracks);
        this.configs = args.config || {};
        this.trackParameters = this._getTrackParameters();
        console.log(this.trackParameters);
     },
     
     _fillActionBar: function( actionBar ){
        dojo.addClass(actionBar, 'screenshot-dialog-actionbar');
        var ok_button = new Button({
            label: "Render",
            onClick: dojo.hitch(this, function() {
                // screenshot parameters
                //console.log(this.trackParameters);
                var gParams = this.parameters.view;
                gParams.methylation=this.parameters.methylation;
                gParams.zoom = this.parameters.output.zoom
                var scParams = {general: gParams, tracks: this.trackParameters};
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
                //console.log(this.trackParameters);
                this.cancelCallback && this.cancelCallback();
                this.hide();
            })
        }).placeAt(actionBar);
     },
    
    show: function( callback ) {
        var thisB = this;
        dojo.addClass(this.domNode, 'screenshot-dialog');

        var mainPaneTop = dom.create('div',
            {className: 'screenshot-dialog-pane',
            id:'screenshot-dialog-pane-top'});

        var mainPaneTopLeft = new dijitContentPane({
            className: 'screenshot-dialog-pane-sub',
            id:'screenshot-dialog-pane-top-left',
            title:'General configuration options'
        });
        var mainPaneTopL = mainPaneTopLeft.containerNode;
        thisB._paneGen(mainPaneTopL);
        mainPaneTopLeft.placeAt(mainPaneTop);


        var mainPaneTopRight = new dijitContentPane({
            className:'screenshot-dialog-pane-sub',
            id:'screenshot-dialog-pane-top-right',
            title:'Output configuration options'
        });
        var mainPaneTopR = mainPaneTopRight.containerNode;
        thisB._paneOut(mainPaneTopR);
        mainPaneTopRight.placeAt(mainPaneTop);

        // for tracks

       var mainPaneBottom = dom.create('div',
            {className: 'screenshot-dialog-pane',
            id:'screenshot-dialog-pane-bottom'});

        /*var mainPaneRightM = new dijitContentPane({
            className: 'screenshot-dialog-pane',
            id: 'screenshot-dialog-pane-right',
            title: 'Track-specific configuration options'
        });
        var mainPaneRight = mainPaneRightM.containerNode;*/
        thisB._paneTracks( mainPaneBottom );

        var paneFooter = dom.create('div',{className:'screenshot-dialog-pane-bottom-warning', innerHTML:'Local configuration changes will be ignored. Default configuration will be used unless specified in this dialog.<br>Rendering will open a new window.'});

        this.set('content', [
            mainPaneTop,
            mainPaneBottom,
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
            var row = dom.create('tr',{id:'screenshot-dialog-row-'+param},table);
            dom.create('td',{'innerHTML':(param === 'labels' ? '' : data.title),'class':'screenshot-dialog-pane-label'}, row);
            var td = dom.create('td',{'class':'screenshot-dialog-pane-input'},row);
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
        if(thisB.browser.plugins.hasOwnProperty(thisB.configs.methylPlugin)){
            var mData = thisB.browser.plugins[thisB.configs.methylPlugin].config;
            row = dom.create('tr',{id:'screenshot-dialog-row-methyl'},table);
            dom.create('td',{innerHTML:'Methylation',className:'screenshot-dialog-pane-label', 'colspan':2},row);
            var row2 = dom.create('tr',{'id':'screenshot-dialog-row-methyl-boxes'},table);
            var methylD = dom.create('td',{'colspan':2},row2);
            // methylation types - animal vs plants
            var mTypes = (mData.isAnimal ? {CG:true,CH:true} : thisB.parameters.methylation);
            var m;
            for (m in mTypes){
                var mbox = new dijitCheckBox({
                    id:'screenshot-dialog-methyl-'+m,
                    //'class':m+'-checkbox',
                    style:'background-image:url('+mData.baseUrl.slice(1)+'/img/checkmark-'+m+'.png'+');',
                    '_prop':m,
                    checked: (m === 'CH' ? (thisB.parameters.methylation.CHG && thisB.parameters.methylation.CHH): thisB.parameters.methylation[m])
                });
                mbox.onClick = dojo.hitch(thisB, '_setMethylation', mbox);
                dom.create('span',{innerHTML:m,className:'screenshot-dialog-opt-span'}, methylD);
                methylD.appendChild(mbox.domNode);
            }
        }
    },

    _paneOut: function(obj){
        var thisB = this;
        dom.create('h2',{'innerHTML':'Output configuration options'}, obj);
        var tableB = dom.create('table',{'class':'screenshot-dialog-opt-table'},obj);
        var param, data, row, row2;
        // output options -> format (PNG, JPEG, PDF), height, width
        var outParam = thisB.parameters.output;
        for(param in outParam){
            data = outParam[param];
            if(param === 'format'){
                row = dom.create('tr',{'id':'screenshot-dialog-row-'+param,'colspan':2},tableB);
                dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                row2 = dom.create('tr',{'class':'screenshot-dialog-pane-input'},tableB);
                var outD = dom.create('td',{'colspan':2},row2);
                // 3 check boxes
                //var formatTypes = ['PNG','JPG','PDF'];
                var formatTypes = ['PNG','JPG'];
                var formatTypeTitles = {'PNG':'transparent background','JPG':'white background', 'PDF':'contains svg-like objects'};
                array.forEach(formatTypes, function(f){
                    var btn = new dijitRadioButton({
                        id: 'screenshot-dialog-output-'+f,
                        checked: f === thisB.parameters.output.format.value,
                        value: f,
                        '_prop': param
                    });
                    btn.onClick = dojo.hitch(thisB, '_setParameter', btn);
                    dom.create('span',{innerHTML:f, className:'screenshot-dialog-opt-span', title:formatTypeTitles[f]}, outD);
                    outD.appendChild(btn.domNode);
                });
            } else {
                // number spinners
                data = outParam[param];
                row = dom.create('tr',{'id':'screenshot-dialog-row-'+param},tableB);
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

    _paneTracks: function(rPane){
        var thisB = this;
        var locationList = ['left','center','right','none'];
        var modeList = ['normal','compact','collapsed'];
        var styleList = ['default','features','histograms'];
        var optDict= {'ypos':locationList, 'mode':modeList, 'style':styleList};
        dom.create('h2',{'innerHTML':'Track-specific configuration options'}, rPane);

        var tab = new dijitTabContainer({
            id:'screenshot-dialog-pane-tab'
        });
        var label, tParams, pane, param, data;
        // need to loop through the tracks and create content panes
        array.forEach(thisB.vTracks, function(track){
            // get parameters
            label = track.config.label;
            tParams = thisB.trackParameters[label];
            var trackTitle = (tParams.key===undefined ? label : tParams.key )
            pane = new dijitContentPane({
                title: trackTitle,
                id: 'screenshot-dialog-track-'+label
            });
            var obj = pane.containerNode;

            if(tParams.opts === false){
                pane.set('content','No available options');
                tab.addChild(pane);
                return;
            }
            //dom.create('h3',{innerHTML:trackTitle},obj);
            var table = dom.create('table',{'class':'screenshot-dialog-opt-table'}, obj);
            // loop through parameters
            for(param in tParams){
                data = tParams[param];
                // yscale is radio boxes
                if(param in {'ypos':1, 'mode':1,'style':1}){
                    // list of options to use
                    var optList = optDict[param];
                    // yscale position radio boxes
                    if(data !== false){
                        var row = dom.create('tr',{'id':'screenshot-dialog-row-'+label+'-'+param},table);
                        dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                        array.forEach(optList, function(opt){
                            var button = new dijitRadioButton({
                                name:param+'-'+label,
                                checked: opt === data.value,
                                id:'screenshot-dialog-radio-'+label+'-'+opt,
                                value: opt,
                                '_label': label,
                                '_prop': param
                        });
                        button.onClick = dojo.hitch(thisB, '_setTrackParameter', button);
                        var td = dom.create('td', {className:'screenshot-dialog-td-button'}, row);
                        button.placeAt(td, 'first');
                        dom.create('label', {"for":'screenshot-dialog-radio-'+label+'-'+opt, innerHTML: opt}, td);
                    });
                    } // end y-scale position
                }
                else if(data.hasOwnProperty('value')){
                    // otherwise its a number spinner text box thing
                    var row = dom.create('tr',{'id':'screenshot-dialog-row-'+label+'-'+param},table);
                    dom.create('td',{'innerHTML':data.title,'class':'screenshot-dialog-pane-label'}, row);
                    var widget = new dijitNumberSpinner({
                        id:'screenshot-dialog-spinner-'+label+'-'+param,
                        value: data.value,
                        '_prop':param,
                        '_label': label,
                        smallDelta:data.delta,
                        intermediateChanges:true,
                        style:"width:60px;"
                    });
                    widget.onChange = dojo.hitch(thisB, '_setTrackParameter', widget);
                    var td = dom.create('td', {'class':'screenshot-dialog-pane-input', 'colspan':4}, row);
                    widget.placeAt(td,'first');
                }
            } // end for param

            tab.addChild(pane);
        });

        tab.placeAt(rPane);
        tab.startup();
    },

    hide: function() {
        this.inherited(arguments);
        window.setTimeout( dojo.hitch( this, 'destroyRecursive' ), 500 );
    },

    _setMethylation: function(box){
        if(box._prop == 'CH'){
            this.parameters.methylation.CHG = box.checked;
            this.parameters.methylation.CHH = box.checked;
        }
        else if(this.parameters.methylation.hasOwnProperty(box._prop)){
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
        // check label
        if(!this.trackParameters.hasOwnProperty(tLabel)){
            console.warn('Error: no track labeled '+tLabel);
            return
        }
        // number spinner type
        else{
            if(this.trackParameters[tLabel].hasOwnProperty(prop)){
                this.trackParameters[tLabel][prop].value = input.value;
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
        var menu = { value: config.show_menu, title:'Show menu bar' };
        var labels = {value:true, title:'Show track labels'};
        // output parameters
        zoom['min'] = 0;
        zoom['max'] = 10;
        zoom['delta'] = 1;
        var format = {value: 'JPG', title: 'Output format'};
        var width = {value: 3300, title: 'Width (px)', min:100, max:10000, delta:100};
        var height = {value: 2400, title: 'Height (px)', min:100, max:10000, delta:100};
        var quality = {value: 70, title: 'Render quality', min:0, max:100, delta:10};

       return { view:{trackSpacing: trackSpacing, locOver: locOver, trackList: trackList, nav: nav, menu: menu, labels: labels}, methylation:{CG:true, CHG:true, CHH:true}, output: {format: format, zoom: zoom, quality: quality, width: width, height: height} };
    },

    _getTrackParameters: function(){
        var thisB = this;
        var out = {};
        array.forEach(this.vTracks, function(track, i){
           var tType = track.config.type;
            var tConfig = track.config;
            // due to weirdness with displayMode, update config.mixin if necessary
            // handle parameters by type
            if (track.hasOwnProperty('displayMode'))
                tConfig.displayMode = track.displayMode;
            out[track.config.label] = thisB._handleTrackTypeParameters(i, tType, tConfig);
        });
        return out;
    },

    _handleTrackTypeParameters: function(iter, tType, config){
        var out = {key:config.key, trackNum: iter};
        // DNA sequence has no options for now
        if(/\b(Sequence)/.test( tType )){
            lang.mixin(out,{opts:false});
            return out;
        }
        // test methylation tracks
       if(/\b(MethylPlot)/.test( tType )|| /\b(MethylPlot)/.test( tType )){
            /*lang.mixin(out,{methyl:{CG: config.showCG, CHG: config.showCHG, CHH: config.showCHH}});*/
            // also mixin the bigwig like features
            lang.mixin(out, {height: {title: 'Track height', value:config.style.height, delta:10},
                             ypos:{title: 'Y-scale position',  value:config.yScalePosition},
                            min: {title: 'Min. score', value:config.min_score, delta:0.1},
                             max: {title: 'Max. score', value:config.max_score, delta:0.1},
                             quant:true});
        }
        // test bigwig
        else if(/\b(XYPlot)/.test( tType ) || /\b(XYDensity)/.test( tType ) || /XYPlot$/.test(tType) ){
            lang.mixin(out, {height: {title: 'Track height', value:config.style.height, delta:10}, ypos: {title: 'Y-scale position',  value:config.yScalePosition},
                             min: {title: 'Min. score', value:config.min_score, delta:10},
                             max: {title: 'Max. score', value:config.max_score, delta:10},
                             quant:true});
        }
        // else get track height from maxHeight and set ypos = false
        else{
            lang.mixin(out, {height:{title: 'Track height', value:config.maxHeight, delta:10},
                             ypos: false});
        }
        // Canvas/Alignments2 have maxHeight option and possibly histogram with min/max and height
        // test for histograms
        if(config.histograms !== undefined){
            lang.mixin(out, {ypos: {title: 'Y-scale position',  value:config.yScalePosition},
                             min: {title: 'Min. score', value:config.histograms.min, delta:10},
                             max: {title: 'Max. score', value:config.histograms.max, delta:10},
                             quant: false});
        }
        // test canvas features and alignments
        if(/CanvasFeatures$/.test(tType) || /Alignments2$/.test(tType)){
            // check for SeqViews plugin
            var newM = {mode:{title:'Display mode',value:config.displayMode}};
            if(this.configs.seqViewsPlugin){
                lang.mixin(newM,{style:{title:'Display style',value:(config.displayStyle===undefined ? 'default' : config.displayStyle)}});
            }
            lang.mixin(out,newM);
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
