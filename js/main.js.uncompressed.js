require({cache:{
'ScreenShotPlugin/View/Dialog/ScreenShotDialog':function(){
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
        //console.log(this.vTracks);
        this.trackParameters = this._getTrackParameters();
        //console.log(this.trackParameters);
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

        var mainPaneLeft = dom.create('div',
            {className: 'screenshot-dialog-pane',
            id:'screenshot-dialog-pane-left'});

        var mainPaneLeftTop = new dijitContentPane({
            className: 'screenshot-dialog-pane-sub',
            id:'screenshot-dialog-pane-left-top',
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
            id:'screenshot-dialog-pane-right'});

        /*var mainPaneRightM = new dijitContentPane({
            className: 'screenshot-dialog-pane',
            id: 'screenshot-dialog-pane-right',
            title: 'Track-specific configuration options'
        });
        var mainPaneRight = mainPaneRightM.containerNode;*/
        thisB._paneTracks( mainPaneRight );

        var paneFooter = dom.create('div',{className:'screenshot-dialog-pane-bottom-warning', innerHTML:'Local configuration changes will be ignored. Default configuration will be used unless specified in this dialog.<br>Rendering will open a new window.'});

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
        if(thisB.browser.plugins.hasOwnProperty('MethylationPlugin')){
            row = dom.create('tr',{id:'screenshot-dialog-row-methyl'},table);
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
        dom.create('h2',{'innerHTML':'Track-specific configuration options'}, rPane);

        var acc = new dijitAccordionContainer({
            id:'screenshot-dialog-pane-accordian'
        });
        var label, tParams, pane, param, data;
        // need to loop through the tracks and create content panes
        array.forEach(thisB.vTracks, function(track){
            // get parameters
            label = track.config.label;
            tParams = thisB.trackParameters[label];
            pane = new dijitContentPane({
                title: (tParams.key===undefined ? label : tParams.key ),
                id: 'screenshot-dialog-track-'+label
            });
            var obj = pane.containerNode;

            if(tParams.opts === false){
                pane.set('content','No available options');
                acc.addChild(pane);
                return;
            }
            var table = dom.create('table',{'class':'screenshot-dialog-opt-table'}, obj);
            // loop through parameters
            for(param in tParams){
                data = tParams[param];
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
                                '_label': label,
                                '_prop': 'ypos'
                        });
                        button.onClick = dojo.hitch(thisB, '_setTrackParameter', button);
                        var td = dom.create('td', {className:'screenshot-dialog-td-button'}, row);
                        button.placeAt(td, 'first');
                        dom.create('label', {"for":'yscale-dialog-radio-'+label+'-'+loc, innerHTML: loc}, td);
                    });
                    } // end y-scale position
                }
                // methylation check boxes
                /*else if(param==='methyl'){
                    // paramater data
                    data = tParams.methyl;
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
                        var td = dom.create('td',{class:'screenshot-dialog-pane-input'},row);
                        box.placeAt(td,'first');
                        dom.create('label',{"for":'yscale-dialog-radio-'+label+'-'+m, innerHTML: m}, td);
                    }

                } */
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
        // check label
        if(!this.trackParameters.hasOwnProperty(tLabel)){
            console.warn('Error: no track labeled '+tLabel);
            return
        }
        // handle methylation
        /*if(prop === 'methyl'){
            if(this.trackParameters[tLabel].methyl.hasOwnProperty(input.value)){
                this.trackParameters[tLabel].methyl[input.value] = input.checked;
            }
        }
        // y-scale position
        if(input.hasOwnProperty('checked') && input.checked){
            if(this.trackParameters[tLabel].hasOwnProperty(prop)){
                this.trackParameters[tLabel][prop] = input.value;
            }
        }*/
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
            // handle parameters by type
            out[track.config.label] = thisB._handleTrackTypeParameters(i, tType, track.config);
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
            lang.mixin(out, {ypos:{title: 'Y-scale position',  value:config.yScalePosition},
                             height: {title: 'Track height', value:config.style.height, delta:10},
                             min: {title: 'Min. score', value:config.min_score, delta:0.1},
                             max: {title: 'Max. score', value:config.max_score, delta:0.1},
                             quant:true});
        }
        // test bigwig
        else if(/\b(XYPlot)/.test( tType ) || /\b(XYDensity)/.test( tType )){
            lang.mixin(out, {ypos: {title: 'Y-scale position',  value:config.yScalePosition},
                             height: {title: 'Track height', value:config.style.height, delta:10},
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

},
'dijit/layout/AccordionContainer':function(){
define([
	"require",
	"dojo/_base/array", // array.forEach array.map
	"dojo/_base/declare", // declare
	"dojo/_base/fx", // fx.Animation
	"dojo/dom", // dom.setSelectable
	"dojo/dom-attr", // domAttr.attr
	"dojo/dom-class", // domClass.remove
	"dojo/dom-construct", // domConstruct.place
	"dojo/dom-geometry",
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.getObject lang.hitch
	"dojo/sniff", // has("ie") has("dijit-legacy-requires")
	"dojo/topic", // publish
	"../focus", // focus.focus()
	"../_base/manager", // manager.defaultDuration
	"dojo/ready",
	"../_Widget",
	"../_Container",
	"../_TemplatedMixin",
	"../_CssStateMixin",
	"./StackContainer",
	"./ContentPane",
	"dojo/text!./templates/AccordionButton.html",
	"../a11yclick" // AccordionButton template uses ondijitclick; not for keyboard, but for responsive touch.
], function(require, array, declare, fx, dom, domAttr, domClass, domConstruct, domGeometry, keys, lang, has, topic,
			focus, manager, ready, _Widget, _Container, _TemplatedMixin, _CssStateMixin, StackContainer, ContentPane, template){

	// module:
	//		dijit/layout/AccordionContainer


	// Design notes:
	//
	// An AccordionContainer is a StackContainer, but each child (typically ContentPane)
	// is wrapped in a _AccordionInnerContainer.   This is hidden from the caller.
	//
	// The resulting markup will look like:
	//
	//	<div class=dijitAccordionContainer>
	//		<div class=dijitAccordionInnerContainer>	(one pane)
	//				<div class=dijitAccordionTitle>		(title bar) ... </div>
	//				<div class=dijtAccordionChildWrapper>   (content pane) </div>
	//		</div>
	//	</div>
	//
	// Normally the dijtAccordionChildWrapper is hidden for all but one child (the shown
	// child), so the space for the content pane is all the title bars + the one dijtAccordionChildWrapper,
	// which on claro has a 1px border plus a 2px bottom margin.
	//
	// During animation there are two dijtAccordionChildWrapper's shown, so we need
	// to compensate for that.

	var AccordionButton = declare("dijit.layout._AccordionButton", [_Widget, _TemplatedMixin, _CssStateMixin], {
		// summary:
		//		The title bar to click to open up an accordion pane.
		//		Internal widget used by AccordionContainer.
		// tags:
		//		private

		templateString: template,

		// label: String
		//		Title of the pane
		label: "",
		_setLabelAttr: {node: "titleTextNode", type: "innerHTML" },

		// title: String
		//		Tooltip that appears on hover
		title: "",
		_setTitleAttr: {node: "titleTextNode", type: "attribute", attribute: "title"},

		// iconClassAttr: String
		//		CSS class for icon to left of label
		iconClassAttr: "",
		_setIconClassAttr: { node: "iconNode", type: "class" },

		baseClass: "dijitAccordionTitle",

		getParent: function(){
			// summary:
			//		Returns the AccordionContainer parent.
			// tags:
			//		private
			return this.parent;
		},

		buildRendering: function(){
			this.inherited(arguments);
			var titleTextNodeId = this.id.replace(' ', '_');
			domAttr.set(this.titleTextNode, "id", titleTextNodeId + "_title");
			this.focusNode.setAttribute("aria-labelledby", domAttr.get(this.titleTextNode, "id"));
			dom.setSelectable(this.domNode, false);
		},

		getTitleHeight: function(){
			// summary:
			//		Returns the height of the title dom node.
			return domGeometry.getMarginSize(this.domNode).h;	// Integer
		},

		// TODO: maybe the parent should set these methods directly rather than forcing the code
		// into the button widget?
		_onTitleClick: function(){
			// summary:
			//		Callback when someone clicks my title.
			var parent = this.getParent();
			parent.selectChild(this.contentWidget, true);
			focus.focus(this.focusNode);
		},

		_onTitleKeyDown: function(/*Event*/ evt){
			return this.getParent()._onKeyDown(evt, this.contentWidget);
		},

		_setSelectedAttr: function(/*Boolean*/ isSelected){
			this._set("selected", isSelected);
			this.focusNode.setAttribute("aria-expanded", isSelected ? "true" : "false");
			this.focusNode.setAttribute("aria-selected", isSelected ? "true" : "false");
			this.focusNode.setAttribute("tabIndex", isSelected ? "0" : "-1");
		}
	});

	if(has("dojo-bidi")){
		AccordionButton.extend({
			_setLabelAttr: function(label){
				this._set("label", label);
				domAttr.set(this.titleTextNode, "innerHTML", label);
				this.applyTextDir(this.titleTextNode);
			},

			_setTitleAttr: function(title){
				this._set("title", title);
				domAttr.set(this.titleTextNode, "title", title);
				this.applyTextDir(this.titleTextNode);
			}
		});
	}

	var AccordionInnerContainer = declare("dijit.layout._AccordionInnerContainer" + (has("dojo-bidi") ? "_NoBidi" : ""), [_Widget, _CssStateMixin], {
		// summary:
		//		Internal widget placed as direct child of AccordionContainer.containerNode.
		//		When other widgets are added as children to an AccordionContainer they are wrapped in
		//		this widget.

		/*=====
		 // buttonWidget: Function|String
		 //		Class to use to instantiate title
		 //		(Wish we didn't have a separate widget for just the title but maintaining it
		 //		for backwards compatibility, is it worth it?)
		 buttonWidget: null,
		 =====*/

		/*=====
		 // contentWidget: dijit/_WidgetBase
		 //		Pointer to the real child widget
		 contentWidget: null,
		 =====*/

		baseClass: "dijitAccordionInnerContainer",

		// tell nested layout widget that we will take care of sizing
		isLayoutContainer: true,

		buildRendering: function(){
			// Builds a template like:
			//	<div class=dijitAccordionInnerContainer>
			//		Button
			//		<div class=dijitAccordionChildWrapper>
			//			ContentPane
			//		</div>
			//	</div>

			// Create wrapper div, placed where the child is now
			this.domNode = domConstruct.place("<div class='" + this.baseClass +
				"' role='presentation'>", this.contentWidget.domNode, "after");

			// wrapper div's first child is the button widget (ie, the title bar)
			var child = this.contentWidget,
				cls = lang.isString(this.buttonWidget) ? lang.getObject(this.buttonWidget) : this.buttonWidget;
			this.button = child._buttonWidget = (new cls({
				contentWidget: child,
				label: child.title,
				title: child.tooltip,
				dir: child.dir,
				lang: child.lang,
				textDir: child.textDir || this.textDir,
				iconClass: child.iconClass,
				id: child.id + "_button",
				parent: this.parent
			})).placeAt(this.domNode);

			// and then the actual content widget (changing it from prior-sibling to last-child),
			// wrapped by a <div class=dijitAccordionChildWrapper>
			this.containerNode = domConstruct.place("<div class='dijitAccordionChildWrapper' role='tabpanel' style='display:none'>", this.domNode);
			this.containerNode.setAttribute("aria-labelledby", this.button.id);

			domConstruct.place(this.contentWidget.domNode, this.containerNode);
		},

		postCreate: function(){
			this.inherited(arguments);

			// Map changes in content widget's title etc. to changes in the button
			var button = this.button,
				cw = this.contentWidget;
			this._contentWidgetWatches = [
				cw.watch('title', lang.hitch(this, function(name, oldValue, newValue){
					button.set("label", newValue);
				})),
				cw.watch('tooltip', lang.hitch(this, function(name, oldValue, newValue){
					button.set("title", newValue);
				})),
				cw.watch('iconClass', lang.hitch(this, function(name, oldValue, newValue){
					button.set("iconClass", newValue);
				}))
			];
		},

		_setSelectedAttr: function(/*Boolean*/ isSelected){
			this._set("selected", isSelected);
			this.button.set("selected", isSelected);
			if(isSelected){
				var cw = this.contentWidget;
				if(cw.onSelected){
					cw.onSelected();
				}
			}
		},

		startup: function(){
			// Called by _Container.addChild()
			this.contentWidget.startup();
		},

		destroy: function(){
			this.button.destroyRecursive();

			array.forEach(this._contentWidgetWatches || [], function(w){
				w.unwatch();
			});

			delete this.contentWidget._buttonWidget;
			delete this.contentWidget._wrapperWidget;

			this.inherited(arguments);
		},

		destroyDescendants: function(/*Boolean*/ preserveDom){
			// since getChildren isn't working for me, have to code this manually
			this.contentWidget.destroyRecursive(preserveDom);
		}
	});

	if(has("dojo-bidi")){
		AccordionInnerContainer = declare("dijit.layout._AccordionInnerContainer", AccordionInnerContainer, {
			postCreate: function(){
				this.inherited(arguments);

				// Map changes in content widget's textdir to changes in the button
				var button = this.button;
				this._contentWidgetWatches.push(
					this.contentWidget.watch("textDir", function(name, oldValue, newValue){
						button.set("textDir", newValue);
					})
				);
			}
		});
	}

	var AccordionContainer = declare("dijit.layout.AccordionContainer", StackContainer, {
		// summary:
		//		Holds a set of panes where every pane's title is visible, but only one pane's content is visible at a time,
		//		and switching between panes is visualized by sliding the other panes up/down.
		// example:
		//	|	<div data-dojo-type="dijit/layout/AccordionContainer">
		//	|		<div data-dojo-type="dijit/layout/ContentPane" title="pane 1">
		//	|		</div>
		//	|		<div data-dojo-type="dijit/layout/ContentPane" title="pane 2">
		//	|			<p>This is some text</p>
		//	|		</div>
		//	|	</div>

		// duration: Integer
		//		Amount of time (in ms) it takes to slide panes
		duration: manager.defaultDuration,

		// buttonWidget: [const] String
		//		The name of the widget used to display the title of each pane
		buttonWidget: AccordionButton,

		/*=====
		 // _verticalSpace: Number
		 //		Pixels of space available for the open pane
		 //		(my content box size minus the cumulative size of all the title bars)
		 _verticalSpace: 0,
		 =====*/
		baseClass: "dijitAccordionContainer",

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.style.overflow = "hidden";		// TODO: put this in dijit.css
			this.domNode.setAttribute("role", "tablist");
		},

		startup: function(){
			if(this._started){
				return;
			}
			this.inherited(arguments);
			if(this.selectedChildWidget){
				this.selectedChildWidget._wrapperWidget.set("selected", true);
			}
		},

		layout: function(){
			// Implement _LayoutWidget.layout() virtual method.
			// Set the height of the open pane based on what room remains.

			var openPane = this.selectedChildWidget;

			if(!openPane){
				return;
			}

			// space taken up by title, plus wrapper div (with border/margin) for open pane
			var wrapperDomNode = openPane._wrapperWidget.domNode,
				wrapperDomNodeMargin = domGeometry.getMarginExtents(wrapperDomNode),
				wrapperDomNodePadBorder = domGeometry.getPadBorderExtents(wrapperDomNode),
				wrapperContainerNode = openPane._wrapperWidget.containerNode,
				wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
				wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode),
				mySize = this._contentBox;

			// get cumulative height of all the unselected title bars
			var totalCollapsedHeight = 0;
			array.forEach(this.getChildren(), function(child){
				if(child != openPane){
					// Using domGeometry.getMarginSize() rather than domGeometry.position() since claro has 1px bottom margin
					// to separate accordion panes.  Not sure that works perfectly, it's probably putting a 1px
					// margin below the bottom pane (even though we don't want one).
					totalCollapsedHeight += domGeometry.getMarginSize(child._wrapperWidget.domNode).h;
				}
			});
			this._verticalSpace = mySize.h - totalCollapsedHeight - wrapperDomNodeMargin.h
				- wrapperDomNodePadBorder.h - wrapperContainerNodeMargin.h - wrapperContainerNodePadBorder.h
				- openPane._buttonWidget.getTitleHeight();

			// Memo size to make displayed child
			this._containerContentBox = {
				h: this._verticalSpace,
				w: this._contentBox.w - wrapperDomNodeMargin.w - wrapperDomNodePadBorder.w
					- wrapperContainerNodeMargin.w - wrapperContainerNodePadBorder.w
			};

			if(openPane){
				openPane.resize(this._containerContentBox);
			}
		},

		_setupChild: function(child){
			// Overrides _LayoutWidget._setupChild().
			// Put wrapper widget around the child widget, showing title

			child._wrapperWidget = AccordionInnerContainer({
				contentWidget: child,
				buttonWidget: this.buttonWidget,
				id: child.id + "_wrapper",
				dir: child.dir,
				lang: child.lang,
				textDir: child.textDir || this.textDir,
				parent: this
			});

			this.inherited(arguments);

			// Since we are wrapping children in AccordionInnerContainer, replace the default
			// wrapper that we created in StackContainer.
			domConstruct.place(child.domNode, child._wrapper, "replace");
		},

		removeChild: function(child){
			// Overrides _LayoutWidget.removeChild().

			// Destroy wrapper widget first, before StackContainer.getChildren() call.
			// Replace wrapper widget with true child widget (ContentPane etc.).
			// This step only happens if the AccordionContainer has been started; otherwise there's no wrapper.
			// (TODO: since StackContainer destroys child._wrapper, maybe it can do this step too?)
			if(child._wrapperWidget){
				domConstruct.place(child.domNode, child._wrapperWidget.domNode, "after");
				child._wrapperWidget.destroy();
				delete child._wrapperWidget;
			}

			domClass.remove(child.domNode, "dijitHidden");

			this.inherited(arguments);
		},

		getChildren: function(){
			// Overrides _Container.getChildren() to return content panes rather than internal AccordionInnerContainer panes
			return array.map(this.inherited(arguments), function(child){
				return child.declaredClass == "dijit.layout._AccordionInnerContainer" ? child.contentWidget : child;
			}, this);
		},

		destroy: function(){
			if(this._animation){
				this._animation.stop();
			}
			array.forEach(this.getChildren(), function(child){
				// If AccordionContainer has been started, then each child has a wrapper widget which
				// also needs to be destroyed.
				if(child._wrapperWidget){
					child._wrapperWidget.destroy();
				}else{
					child.destroyRecursive();
				}
			});
			this.inherited(arguments);
		},

		_showChild: function(child){
			// Override StackContainer._showChild() to set visibility of _wrapperWidget.containerNode
			child._wrapperWidget.containerNode.style.display = "block";
			return this.inherited(arguments);
		},

		_hideChild: function(child){
			// Override StackContainer._showChild() to set visibility of _wrapperWidget.containerNode
			child._wrapperWidget.containerNode.style.display = "none";
			this.inherited(arguments);
		},

		_transition: function(/*dijit/_WidgetBase?*/ newWidget, /*dijit/_WidgetBase?*/ oldWidget, /*Boolean*/ animate){
			// Overrides StackContainer._transition() to provide sliding of title bars etc.

			if(has("ie") < 8){
				// workaround animation bugs by not animating; not worth supporting animation for IE6 & 7
				animate = false;
			}

			if(this._animation){
				// there's an in-progress animation.  speedily end it so we can do the newly requested one
				this._animation.stop(true);
				delete this._animation;
			}

			var self = this;

			if(newWidget){
				newWidget._wrapperWidget.set("selected", true);

				var d = this._showChild(newWidget);	// prepare widget to be slid in

				// Size the new widget, in case this is the first time it's being shown,
				// or I have been resized since the last time it was shown.
				// Note that page must be visible for resizing to work.
				if(this.doLayout && newWidget.resize){
					newWidget.resize(this._containerContentBox);
				}
			}

			if(oldWidget){
				oldWidget._wrapperWidget.set("selected", false);
				if(!animate){
					this._hideChild(oldWidget);
				}
			}

			if(animate){
				var newContents = newWidget._wrapperWidget.containerNode,
					oldContents = oldWidget._wrapperWidget.containerNode;

				// During the animation we will be showing two dijitAccordionChildWrapper nodes at once,
				// which on claro takes up 4px extra space (compared to stable AccordionContainer).
				// Have to compensate for that by immediately shrinking the pane being closed.
				var wrapperContainerNode = newWidget._wrapperWidget.containerNode,
					wrapperContainerNodeMargin = domGeometry.getMarginExtents(wrapperContainerNode),
					wrapperContainerNodePadBorder = domGeometry.getPadBorderExtents(wrapperContainerNode),
					animationHeightOverhead = wrapperContainerNodeMargin.h + wrapperContainerNodePadBorder.h;

				oldContents.style.height = (self._verticalSpace - animationHeightOverhead) + "px";

				this._animation = new fx.Animation({
					node: newContents,
					duration: this.duration,
					curve: [1, this._verticalSpace - animationHeightOverhead - 1],
					onAnimate: function(value){
						value = Math.floor(value);	// avoid fractional values
						newContents.style.height = value + "px";
						oldContents.style.height = (self._verticalSpace - animationHeightOverhead - value) + "px";
					},
					onEnd: function(){
						delete self._animation;
						newContents.style.height = "auto";
						oldWidget._wrapperWidget.containerNode.style.display = "none";
						oldContents.style.height = "auto";
						self._hideChild(oldWidget);
					}
				});
				this._animation.onStop = this._animation.onEnd;
				this._animation.play();
			}

			return d;	// If child has an href, promise that fires when the widget has finished loading
		},

		// note: we are treating the container as controller here
		_onKeyDown: function(/*Event*/ e, /*dijit/_WidgetBase*/ fromTitle){
			// summary:
			//		Handle keydown events
			// description:
			//		This is called from a handler on AccordionContainer.domNode
			//		(setup in StackContainer), and is also called directly from
			//		the click handler for accordion labels
			if(this.disabled || e.altKey || !(fromTitle || e.ctrlKey)){
				return;
			}
			var c = e.keyCode;
			if((fromTitle && (c == keys.LEFT_ARROW || c == keys.UP_ARROW)) ||
				(e.ctrlKey && c == keys.PAGE_UP)){
				this._adjacent(false)._buttonWidget._onTitleClick();
				e.stopPropagation();
				e.preventDefault();
			}else if((fromTitle && (c == keys.RIGHT_ARROW || c == keys.DOWN_ARROW)) ||
				(e.ctrlKey && (c == keys.PAGE_DOWN || c == keys.TAB))){
				this._adjacent(true)._buttonWidget._onTitleClick();
				e.stopPropagation();
				e.preventDefault();
			}
		}
	});

	// Back compat w/1.6, remove for 2.0
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/layout/AccordionPane"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	// For monkey patching
	AccordionContainer._InnerContainer = AccordionInnerContainer;
	AccordionContainer._Button = AccordionButton;

	return AccordionContainer;
});

},
'dijit/layout/StackContainer':function(){
define([
	"dojo/_base/array", // array.forEach array.indexOf array.some
	"dojo/cookie", // cookie
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.replace
	"dojo/dom-construct",
	"dojo/has", // has("dijit-legacy-requires")
	"dojo/_base/lang", // lang.extend
	"dojo/on",
	"dojo/ready",
	"dojo/topic", // publish
	"dojo/when",
	"../registry", // registry.byId
	"../_WidgetBase",
	"./_LayoutWidget",
	"dojo/i18n!../nls/common"
], function(array, cookie, declare, domClass, domConstruct, has, lang, on, ready, topic, when, registry, _WidgetBase, _LayoutWidget){

	// module:
	//		dijit/layout/StackContainer

	// Back compat w/1.6, remove for 2.0
	if(has("dijit-legacy-requires")){
		ready(0, function(){
			var requires = ["dijit/layout/StackController"];
			require(requires);	// use indirection so modules not rolled into a build
		});
	}

	var StackContainer = declare("dijit.layout.StackContainer", _LayoutWidget, {
		// summary:
		//		A container that has multiple children, but shows only
		//		one child at a time
		//
		// description:
		//		A container for widgets (ContentPanes, for example) That displays
		//		only one Widget at a time.
		//
		//		Publishes topics [widgetId]-addChild, [widgetId]-removeChild, and [widgetId]-selectChild
		//
		//		Can be base class for container, Wizard, Show, etc.
		//
		//		See `StackContainer.ChildWidgetProperties` for details on the properties that can be set on
		//		children of a `StackContainer`.

		// doLayout: Boolean
		//		If true, change the size of my currently displayed child to match my size
		doLayout: true,

		// persist: Boolean
		//		Remembers the selected child across sessions
		persist: false,

		baseClass: "dijitStackContainer",

		/*=====
		// selectedChildWidget: [readonly] dijit._Widget
		//		References the currently selected child widget, if any.
		//		Adjust selected child with selectChild() method.
		selectedChildWidget: null,
		=====*/

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "dijitLayoutContainer");
		},

		postCreate: function(){
			this.inherited(arguments);
			this.own(
				on(this.domNode, "keydown", lang.hitch(this, "_onKeyDown"))
			);
		},

		startup: function(){
			if(this._started){
				return;
			}

			var children = this.getChildren();

			// Setup each page panel to be initially hidden
			array.forEach(children, this._setupChild, this);

			// Figure out which child to initially display, defaulting to first one
			if(this.persist){
				this.selectedChildWidget = registry.byId(cookie(this.id + "_selectedChild"));
			}else{
				array.some(children, function(child){
					if(child.selected){
						this.selectedChildWidget = child;
					}
					return child.selected;
				}, this);
			}
			var selected = this.selectedChildWidget;
			if(!selected && children[0]){
				selected = this.selectedChildWidget = children[0];
				selected.selected = true;
			}

			// Publish information about myself so any StackControllers can initialize.
			// This needs to happen before this.inherited(arguments) so that for
			// TabContainer, this._contentBox doesn't include the space for the tab labels.
			topic.publish(this.id + "-startup", {children: children, selected: selected, textDir: this.textDir});

			// Startup each child widget, and do initial layout like setting this._contentBox,
			// then calls this.resize() which does the initial sizing on the selected child.
			this.inherited(arguments);
		},

		resize: function(){
			// Overrides _LayoutWidget.resize()
			// Resize is called when we are first made visible (it's called from startup()
			// if we are initially visible). If this is the first time we've been made
			// visible then show our first child.
			if(!this._hasBeenShown){
				this._hasBeenShown = true;
				var selected = this.selectedChildWidget;
				if(selected){
					this._showChild(selected);
				}
			}
			this.inherited(arguments);
		},

		_setupChild: function(/*dijit/_WidgetBase*/ child){
			// Overrides _LayoutWidget._setupChild()

			// For aria support, wrap child widget in a <div role="tabpanel">
			var childNode = child.domNode,
				wrapper = domConstruct.place(
					"<div role='tabpanel' class='" + this.baseClass + "ChildWrapper dijitHidden'>",
					child.domNode,
					"replace"),
				label = child["aria-label"] || child.title || child.label;
			if(label){
				// setAttribute() escapes special chars, and if() statement avoids setting aria-label="undefined"
				wrapper.setAttribute("aria-label", label);
			}
			domConstruct.place(childNode, wrapper);
			child._wrapper = wrapper;	// to set the aria-labelledby in StackController

			this.inherited(arguments);

			// child may have style="display: none" (at least our test cases do), so remove that
			if(childNode.style.display == "none"){
				childNode.style.display = "block";
			}

			// remove the title attribute so it doesn't show up when i hover over a node
			child.domNode.title = "";
		},

		addChild: function(/*dijit/_WidgetBase*/ child, /*Integer?*/ insertIndex){
			// Overrides _Container.addChild() to do layout and publish events

			this.inherited(arguments);

			if(this._started){
				topic.publish(this.id + "-addChild", child, insertIndex);	// publish

				// in case the tab titles have overflowed from one line to two lines
				// (or, if this if first child, from zero lines to one line)
				// TODO: w/ScrollingTabController this is no longer necessary, although
				// ScrollTabController.resize() does need to get called to show/hide
				// the navigation buttons as appropriate, but that's handled in ScrollingTabController.onAddChild().
				// If this is updated to not layout [except for initial child added / last child removed], update
				// "childless startup" test in StackContainer.html to check for no resize event after second addChild()
				this.layout();

				// if this is the first child, then select it
				if(!this.selectedChildWidget){
					this.selectChild(child);
				}
			}
		},

		removeChild: function(/*dijit/_WidgetBase*/ page){
			// Overrides _Container.removeChild() to do layout and publish events

			var idx = array.indexOf(this.getChildren(), page);

			this.inherited(arguments);

			// Remove the child widget wrapper we use to set aria roles.  This won't affect the page itself since it's
			// already been detached from page._wrapper via the this.inherited(arguments) call above.
			domConstruct.destroy(page._wrapper);
			delete page._wrapper;

			if(this._started){
				// This will notify any tablists to remove a button; do this first because it may affect sizing.
				topic.publish(this.id + "-removeChild", page);
			}

			// If all our children are being destroyed than don't run the code below (to select another page),
			// because we are deleting every page one by one
			if(this._descendantsBeingDestroyed){
				return;
			}

			// Select new page to display, also updating TabController to show the respective tab.
			// Do this before layout call because it can affect the height of the TabController.
			if(this.selectedChildWidget === page){
				this.selectedChildWidget = undefined;
				if(this._started){
					var children = this.getChildren();
					if(children.length){
						this.selectChild(children[Math.max(idx - 1, 0)]);
					}
				}
			}

			if(this._started){
				// In case the tab titles now take up one line instead of two lines
				// (note though that ScrollingTabController never overflows to multiple lines),
				// or the height has changed slightly because of addition/removal of tab which close icon
				this.layout();
			}
		},

		selectChild: function(/*dijit/_WidgetBase|String*/ page, /*Boolean*/ animate){
			// summary:
			//		Show the given widget (which must be one of my children)
			// page:
			//		Reference to child widget or id of child widget

			var d;

			page = registry.byId(page);

			if(this.selectedChildWidget != page){
				// Deselect old page and select new one
				d = this._transition(page, this.selectedChildWidget, animate);
				this._set("selectedChildWidget", page);
				topic.publish(this.id + "-selectChild", page);	// publish

				if(this.persist){
					cookie(this.id + "_selectedChild", this.selectedChildWidget.id);
				}
			}

			// d may be null, or a scalar like true.  Return a promise in all cases
			return when(d || true);		// Promise
		},

		_transition: function(newWidget, oldWidget /*===== ,  animate =====*/){
			// summary:
			//		Hide the old widget and display the new widget.
			//		Subclasses should override this.
			// newWidget: dijit/_WidgetBase
			//		The newly selected widget.
			// oldWidget: dijit/_WidgetBase
			//		The previously selected widget.
			// animate: Boolean
			//		Used by AccordionContainer to turn on/off slide effect.
			// tags:
			//		protected extension
			if(oldWidget){
				this._hideChild(oldWidget);
			}
			var d = this._showChild(newWidget);

			// Size the new widget, in case this is the first time it's being shown,
			// or I have been resized since the last time it was shown.
			// Note that page must be visible for resizing to work.
			if(newWidget.resize){
				if(this.doLayout){
					newWidget.resize(this._containerContentBox || this._contentBox);
				}else{
					// the child should pick it's own size but we still need to call resize()
					// (with no arguments) to let the widget lay itself out
					newWidget.resize();
				}
			}

			return d;	// If child has an href, promise that fires when the child's href finishes loading
		},

		_adjacent: function(/*Boolean*/ forward){
			// summary:
			//		Gets the next/previous child widget in this container from the current selection.

			// TODO: remove for 2.0 if this isn't being used.   Otherwise, fix to skip disabled tabs.

			var children = this.getChildren();
			var index = array.indexOf(children, this.selectedChildWidget);
			index += forward ? 1 : children.length - 1;
			return children[ index % children.length ]; // dijit/_WidgetBase
		},

		forward: function(){
			// summary:
			//		Advance to next page.
			return this.selectChild(this._adjacent(true), true);
		},

		back: function(){
			// summary:
			//		Go back to previous page.
			return this.selectChild(this._adjacent(false), true);
		},

		_onKeyDown: function(e){
			topic.publish(this.id + "-containerKeyDown", { e: e, page: this});	// publish
		},

		layout: function(){
			// Implement _LayoutWidget.layout() virtual method.
			var child = this.selectedChildWidget;
			if(child && child.resize){
				if(this.doLayout){
					child.resize(this._containerContentBox || this._contentBox);
				}else{
					child.resize();
				}
			}
		},

		_showChild: function(/*dijit/_WidgetBase*/ page){
			// summary:
			//		Show the specified child by changing it's CSS, and call _onShow()/onShow() so
			//		it can do any updates it needs regarding loading href's etc.
			// returns:
			//		Promise that fires when page has finished showing, or true if there's no href
			var children = this.getChildren();
			page.isFirstChild = (page == children[0]);
			page.isLastChild = (page == children[children.length - 1]);
			page._set("selected", true);

			if(page._wrapper){	// false if not started yet
				domClass.replace(page._wrapper, "dijitVisible", "dijitHidden");
			}

			return (page._onShow && page._onShow()) || true;
		},

		_hideChild: function(/*dijit/_WidgetBase*/ page){
			// summary:
			//		Hide the specified child by changing it's CSS, and call _onHide() so
			//		it's notified.
			page._set("selected", false);

			if(page._wrapper){	// false if not started yet
				domClass.replace(page._wrapper, "dijitHidden", "dijitVisible");
			}

			page.onHide && page.onHide();
		},

		closeChild: function(/*dijit/_WidgetBase*/ page){
			// summary:
			//		Callback when user clicks the [X] to remove a page.
			//		If onClose() returns true then remove and destroy the child.
			// tags:
			//		private
			var remove = page.onClose && page.onClose(this, page);
			if(remove){
				this.removeChild(page);
				// makes sure we can clean up executeScripts in ContentPane onUnLoad
				page.destroyRecursive();
			}
		},

		destroyDescendants: function(/*Boolean*/ preserveDom){
			this._descendantsBeingDestroyed = true;
			this.selectedChildWidget = undefined;
			array.forEach(this.getChildren(), function(child){
				if(!preserveDom){
					this.removeChild(child);
				}
				child.destroyRecursive(preserveDom);
			}, this);
			this._descendantsBeingDestroyed = false;
		}
	});

	StackContainer.ChildWidgetProperties = {
		// summary:
		//		These properties can be specified for the children of a StackContainer.

		// selected: Boolean
		//		Specifies that this widget should be the initially displayed pane.
		//		Note: to change the selected child use `dijit/layout/StackContainer.selectChild`
		selected: false,

		// disabled: Boolean
		//		Specifies that the button to select this pane should be disabled.
		//		Doesn't affect programmatic selection of the pane, nor does it deselect the pane if it is currently selected.
		disabled: false,

		// closable: Boolean
		//		True if user can close (destroy) this child, such as (for example) clicking the X on the tab.
		closable: false,

		// iconClass: String
		//		CSS Class specifying icon to use in label associated with this pane.
		iconClass: "dijitNoIcon",

		// showTitle: Boolean
		//		When true, display title of this widget as tab label etc., rather than just using
		//		icon specified in iconClass
		showTitle: true
	};

	// Since any widget can be specified as a StackContainer child, mix them
	// into the base widget class.  (This is a hack, but it's effective.)
	// This is for the benefit of the parser.   Remove for 2.0.  Also, hide from doc viewer.
	lang.extend(_WidgetBase, /*===== {} || =====*/ StackContainer.ChildWidgetProperties);

	return StackContainer;
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
        var tInputs = inputs.tracks;
        //console.log(tInputs);
        return this._encodeGeneralSettings(gInputs) + this._endcodeTrackSettings(tInputs);
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

    decode: function(inStr, tracks){
    // returns javascript object to be applied
        // split inStr
        var opts = inStr.split('~');
        var trackList = tracks.split(',')
        var gSettings = this._decodeGeneralSettings(opts[0])
        var tSettings = this._decodeTrackSettings(opts.slice(1), trackList);
        //console.log(tSettings);
        return {general:gSettings, tracks:tSettings};
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

    _endcodeTrackSettings: function(tracks){
        var output = '';
        // go through object
        var t, params;
        for(t in tracks){
            params = tracks[t];
            // if we need to encode params
            if (params.hasOwnProperty('opts') === false){
                output += this._encodeTrack(params);
            }
        }
        return(output);
    },

    _encodeTrack: function(params){
        // q[0|1] quantitative, y[0|1|2|3] yscale none, center, left, right
        // h# track height, i# min, x# max
        var eLabels = {height: 'h', min: 'i', max: 'x', quant: 'q', ypos: 'y'};
        var locDict = {'none': 0, 'center': 1, 'left': 2, 'right':3 };
        var param, data;

        var output = '~' + params.trackNum;
        // loop through parameters
        for(param in params){
            data = params[param];
            if(param==='quant')
                output += eLabels[param] + this._encodeBoolean(data);
            else if(!(data === undefined || data.value === undefined || eLabels.hasOwnProperty(param)===false )){
                output += eLabels[param]
                // ypos
                if (param === 'ypos')
                    output += locDict[data.value];
                else
                    output += data.value;
            }
        } // end param
        return(output)
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
    },

    _decodeTrackSettings: function(input, trackLabels){
        var thisB = this;
        // input and trackLabels are both arrays -- iterate through input
        var out = {};
        array.forEach(input, function(parmStr){
            var tInt = parseInt(parmStr.slice(0,1));
            var tLabel = trackLabels[tInt];
            parmStr = parmStr.slice(1);
            out[tLabel] = {};
            var isQuant = null;
            // get quant
            var resultQ = /q([0-1])/gi.exec(parmStr);
            if (resultQ != null){
                isQuant = thisB._decodeBoolen(resultQ[1]);
                if(isQuant)
                    out[tLabel]['style'] = {};
                else
                    out[tLabel]['histograms'] = {}

            }
            // get min
            var resultI = /i(-?[0-9]+(\.[0-9])?)/gi.exec(parmStr);
            //console.log(resultI);
            if (resultI != null){
            var min = parseFloat(resultI[1]);
                if(isQuant)
                    out[tLabel]['min_score'] = min;
                else
                    out[tLabel]['histograms']['min'] = min;
            }
            // get max
            var resultX = /x(-?[0-9]+(\.[0-9])?)/gi.exec(parmStr);
            //console.log(resultX);
            if (resultX != null){
            var max = parseFloat(resultX[1]);
                if(isQuant)
                    out[tLabel]['max_score'] = max;
                else
                    out[tLabel]['histograms']['max'] = max;
            }
            // get height
            var resultH = /h([0-9]+)/gi.exec(parmStr);
            //console.log(resultH);
            if (resultH != null){
                var height = parseInt(resultH[1]);
                if(isQuant)
                    out[tLabel]['style']['height'] = height;
                else if(isQuant === false){
                    out[tLabel]['maxHeight'] = height;
                    out[tLabel]['histograms']['height'] = height;
                } else {
                    out[tLabel]['maxHeight'] = height;
                }
            }
            // get ypos
            var resultY = /y([0-3])/gi.exec(parmStr);
            //console.log(resultY);
            if (resultY != null){
                var locList = ['none','center','left','right'];
                var yposI = parseInt(resultY[1]);
                out[tLabel]['yScalePosition'] = locList[yposI];
            }
        });
        return out;
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
},
'url:dijit/layout/templates/AccordionButton.html':"<div data-dojo-attach-event='ondijitclick:_onTitleClick' class='dijitAccordionTitle' role=\"presentation\">\n\t<div data-dojo-attach-point='titleNode,focusNode' data-dojo-attach-event='onkeydown:_onTitleKeyDown'\n\t\t\tclass='dijitAccordionTitleFocus' role=\"tab\" aria-expanded=\"false\"\n\t\t><span class='dijitInline dijitAccordionArrow' role=\"presentation\"></span\n\t\t><span class='arrowTextUp' role=\"presentation\">+</span\n\t\t><span class='arrowTextDown' role=\"presentation\">-</span\n\t\t><span role=\"presentation\" class=\"dijitInline dijitIcon\" data-dojo-attach-point=\"iconNode\"></span>\n\t\t<span role=\"presentation\" data-dojo-attach-point='titleTextNode, textDirNode' class='dijitAccordionText'></span>\n\t</div>\n</div>\n"}});
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
