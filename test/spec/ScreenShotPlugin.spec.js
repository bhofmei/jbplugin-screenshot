/* global console, expect, describe, it, beforeEach */
require([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/request',
  'JBrowse/Browser',
  'ScreenShotPlugin/View/Dialog/ScreenShotDialog',
  'ScreenShotPlugin/ParametersUtil',
  'ScreenShotPlugin/EncodeDecodeUtil'
], function (
  declare,
  array,
  lang,
  request,
  Browser,
  ScreenShotDialog,
  parametersUtil,
  encodeDecodeUtil
) {
  describe('Inital test', function () {
    var test = true;
    it('jasimine is working', function () {
      expect(test).toBe(true);
    });
  });

  describe('Test ParametersUtil', function () {
    // browser config has: highResolutionMode, view.trackPadding, show_overview, show_tracklist, show_nav, show_menu, show_tracklabels
    var browserConfig = {
      highResolutionMode: 'auto',
      show_overview: true,
      show_tracklist: true,
      show_nav: true,
      show_menu: true,
      show_tracklabels: true,
      view: {
        trackPadding: 20
      }
    };

    describe('test initial parameters', function () {
      var parameters;
      beforeEach(function (done) {
        parameters = parametersUtil.getInitialParameters(browserConfig, {});
        done();
      });

      it('should have correct browser parameters', function () {
        var viewParam = parameters['view'];
        expect(viewParam).toBeDefined();
        expect(viewParam.trackSpacing).toEqual({
          value: 20,
          title: 'Track spacing'
        });
        expect(viewParam.locOver).toEqual({
          value: true,
          title: 'Show location overview'
        });
        expect(viewParam.trackList).toEqual({
          value: true,
          title: 'Show track list'
        });
        expect(viewParam.nav).toEqual({
          value: true,
          title: 'Show navigation bar'
        });
        expect(viewParam.menu).toEqual({
          value: true,
          title: 'Show menu bar'
        });
        expect(viewParam.labels).toEqual({
          value: true,
          title: 'Show track labels'
        });
      }); // end should have correct browser parameters

      it('should have default output parameters', function () {
        var outParam = parameters['output'];
        expect(outParam).toBeDefined();
        expect(outParam.format).toEqual({
          value: 'JPG',
          title: 'Output format'
        });
        expect(outParam.zoom).toEqual({
          value: 1,
          title: 'Zoom factor',
          min: 0,
          max: 10,
          delta: 1
        });

        expect(outParam.image).toBeDefined();
        expect(outParam.image.width).toEqual({
          value: 3300,
          title: 'Width (px)',
          min: 100,
          max: 10000,
          delta: 100
        });
        expect(outParam.image.height).toEqual({
          value: 2400,
          title: 'Height (px)',
          min: 100,
          max: 10000,
          delta: 100
        });

        expect(outParam.quality).toEqual({
          value: 70,
          title: 'Render quality',
          min: 0,
          max: 100,
          delta: 10
        });

        var pdfParam = outParam.pdf;
        expect(pdfParam).toBeDefined();
        expect(pdfParam.page).toEqual({
          value: 'letter landscape',
          title: 'Page format'
        });
        expect(pdfParam.pdfWidth).toEqual({
          value: 1800,
          title: 'View width (px)',
          min: 100,
          max: 10000,
          delta: 100
        });
        expect(pdfParam.pdfHeight).toEqual({
          value: 1200,
          title: 'View height (px)',
          min: 100,
          max: 10000,
          delta: 100
        });
        //page, pdfWidth, pdfHeight
        expect(outParam.time).toEqual({
          value: false,
          title: 'Extra render time',
          extra: {
            value: 40,
            title: 'Max (s)',
            min: 40,
            max: 300,
            delta: 10
          }
        });
        expect(outParam.key).toEqual({
          value: false,
          title: 'Use custom ApiKey',
          extra: {
            value: '',
            title: ''
          }
        });
      }); // end should have default output parameters

      it('should have default small rna parameters', function () {
        var smParam = parameters['smallrna'];
        expect(smParam).toBeDefined();
        expect(smParam['21']).toEqual({
          value: true,
          color: 'blue',
          label: '21-mers'
        });
        expect(smParam['22']).toEqual({
          value: true,
          color: 'green',
          label: '22-mers'
        });
        expect(smParam['23']).toEqual({
          value: true,
          color: 'purple',
          label: '23-mers'
        });
        expect(smParam['24']).toEqual({
          value: true,
          color: 'orange',
          label: '24-mers'
        });
        expect(smParam['pi']).toEqual({
          value: true,
          color: 'red',
          label: 'piRNAs'
        });
        expect(smParam['Others']).toEqual({
          value: true,
          color: 'gray',
          label: 'others'
        });
      }); // end should have default small rna parameters

      it('should have default methylation parameters', function () {
        var methylParam = parameters['methylation'];
        expect(methylParam).toBeDefined();
        expect(methylParam['CG']).toBe(true);
        expect(methylParam['CHG']).toBe(true);
        expect(methylParam['CHH']).toBe(true);
        expect(methylParam['4mC']).toBe(true);
        expect(methylParam['5hmC']).toBe(true);
        expect(methylParam['6mA']).toBe(true);
      }); // end should have default methylation parameters
    }); // end test initial parameters

    describe('Test track parameters', function () {
      var pluginConfig;
      var tracks;
      beforeEach(function(done){
        browser = new Browser({unitTestMode: true});
        pluginConfig = {
    apiKey: 'a-demo-key-with-low-quota-per-ip-address',
    dialog: false,
    debug: false,
    htmlFeatures: {
      general: false,
      methyl: true,
      smrna: true,
      strandedplot: true,
      motifdens: true,
      wiggle: true
    },
    methylPlugin: true,
    smrnaPlugin: true,
    strandedPlugin: true,
    motifDensPlugin: true,
    wiggleSVGPlugin: true,
    seqViewsPlugin: true
  }
        tracks = request('./data/trackList.json', {
          handleAs: 'json'
        }).then(function(data){
          tracks = data.tracks;
          done();
        }, function(err){
          console.log(err);
          return;
          //done();
        });
      }); // end beforeEach

      it('should get parameters for Sequence', function () {
        var trackParam = tracks[0];
        var params = parametersUtil._handleTrackTypeParameters(0, 'JBrowse/View/Track/Sequence', trackParam, pluginConfig);
        // has key, trackNum, opts
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(0);
        expect(params.opts).toBe(false);
      }); // end should get parameters for Sequence

      it('should get parameters for CanvasFeatures', function(){
        var trackParam = tracks[1];
        // track defaults - maxHeight, histograms.height, histograms.min, displayStyle
        lang.mixin(trackParam, {maxHeight: 600, histograms: {height: 100, min: 0}});
        var params = parametersUtil._handleTrackTypeParameters(1, trackParam.type, trackParam, pluginConfig);
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(1);

        // maxHeight, html, histograms, seqviews
        expect(params.height).toEqual({title: 'Track height', value: 600, delta: 10});
        // histogram stuff
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: 0, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.quant).toBe(false);
        // seq views
        expect(params.style).toEqual({title: 'Feature style', value: 'default'});
        // html
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end should get parameters for CanvasFeatures

      it('should get parameters for HTMLFeatures', function(){
        var trackParam = tracks[2];
        // defaults = maxHeight
        trackParam.maxHeight = 1000;
        var params = parametersUtil._handleTrackTypeParameters(2, trackParam.type, trackParam, pluginConfig);
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(2);
        // maxHeight, ypos=false
        expect(params.height).toEqual({title: 'Track height', value: 1000, delta: 10});
        expect(params.ypos).toBe(false);
        expect(params.html).not.toBeDefined();
      }); // end should get parameters for HTMLFeatures

      it('should get parameters for CanvasVariants', function(){
        var trackParam = tracks[3];
        // add default
        trackParam.maxHeight = 1000;
        var params = parametersUtil._handleTrackTypeParameters(3, trackParam.type, trackParam, pluginConfig);
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(3);
        // height, ypos=false
        expect(params.height).toEqual({title: 'Track height', value: 1000, delta: 10});
        expect(params.ypos).toBe(false);
        expect
      }); // end should get parameters for HTMLVariants

      it('should get parameters for HTMLVariants', function(){
        var trackParam = tracks[4];
        // add default
        trackParam.maxHeight = 1000;
        var params = parametersUtil._handleTrackTypeParameters(4, trackParam.type, trackParam, pluginConfig);
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(4);
        // height, ypos=false
        expect(params.height).toEqual({title: 'Track height', value: 1000, delta: 10});
        expect(params.ypos).toBe(false);
        expect(params.html).not.toBeDefined();
      }); // end should get parameters for HTMLVariants

      it('should get parameters for Alignments2', function(){
         var trackConfig = tracks[5];
        // add defaults - display style, display mode, histogram.min, histograms.height, max.height
        lang.mixin(trackConfig, {maxHeight: 600, histograms: {height: 100, min: 0}, displayMode: 'normal', displayStyle: 'default'});
        var params = parametersUtil._handleTrackTypeParameters(5, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(5);

        // maxHeight, html, histograms, seqviews
        expect(params.height).toEqual({title: 'Track height', value: 600, delta: 10});
        // histogram stuff
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: 0, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.quant).toBe(false);
        // seq views
        expect(params.mode).toEqual({title: 'Display mode', value: 'normal'});
        expect(params.style).toEqual({title: 'Feature style', value: 'default'});
        // html
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end should get parameters for Alignments2

      it('should get parameters for SNP Coverage', function(){
         var trackParam = tracks[6];
        // add defaults - min.score

        var params = parametersUtil._handleTrackTypeParameters(6, trackParam.type, trackParam, pluginConfig);
        expect(params.key).toBe(trackParam.key);
        expect(params.trackNum).toBe(6);
      }); // end should get parameters for SNP Coverage

      it('should get parameters for Alignments', function(){
        var trackConfig = tracks[7];
        var params = parametersUtil._handleTrackTypeParameters(7, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(7);
      }); // end should get parameters for Alignments

      it('should get parameters for Wiggle XYPlot', function(){
        var trackConfig = tracks[8];
        lang.mixin(trackConfig, {style: {height: 100}});
        var params = parametersUtil._handleTrackTypeParameters(8, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(8);
        // height, ypos, html, min, max, quant, html
        expect(params.height).toEqual({title: 'Track height', value: 100, delta: 10});
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: undefined, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.quant).toBe(true);
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end should get parameters for Wiggle XYPlot

      it('should get parameters for Wiggle Density', function(){
        var trackConfig = tracks[9];
        // add default height
        lang.mixin(trackConfig, {style: {height: 31}});
        var params = parametersUtil._handleTrackTypeParameters(9, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(9);
        // height, ypos, html, min, max, quant, html
        expect(params.height).toEqual({title: 'Track height', value: 31, delta: 10});
        expect(params.ypos).not.toBeDefined();
        expect(params.min).toEqual({title: 'Min. score', value: undefined, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.quant).toBe(true);
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});

      }); // end should get parameters for Wiggle Density

      it('should get parameters for Small RNA Alignments', function(){
        var trackConfig = tracks[10];
        // defaults - displayStyle, displayMode, maxHeight, histograms.height, histograms.min
        lang.mixin(trackConfig, {maxHeight: 400, displayMode: 'normal', displayStyle: 'default', histograms: {height: 100, min: 0}});
        var params = parametersUtil._handleTrackTypeParameters(10, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(10);
        // height, html, style
        expect(params.height).toEqual({title: 'Track height', value: 400, delta: 10});
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: 0, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.style).toEqual({title: 'Feature style', value: 'default'});
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end should get parameters for Small RNA Alignments

      it('should get parameters for Methylation', function(){
        var trackConfig = tracks[11];
        // defaults - min_score, max_score
        lang.mixin(trackConfig, {min_score: -1,  max_score: 1});
        var params = parametersUtil._handleTrackTypeParameters(11, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(11);
        // height, ypos, min, max, html, quant
        expect(params.height).toEqual({title: 'Track height', value: undefined, delta: 10});
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: -1, delta: 0.1});
        expect(params.max).toEqual({title: 'Max. score', value: 1, delta: 0.1});
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
        expect(params.quant).toBe(true);
      }); // end should get parameters for Methylation

      it('should get parameters for StrandedXYPlot', function(){
        var trackConfig = tracks[12];
        var params = parametersUtil._handleTrackTypeParameters(12, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(12);
        // height, ypos, min, max, html
        expect(params.height).toEqual({title: 'Track height', value: undefined, delta: 10});
        expect(params.ypos).toEqual({title: 'Y-scale position', value: 'center'});
        expect(params.min).toEqual({title: 'Min. score', value: undefined, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: undefined, delta: 10});
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end should get parameters for StrandedXYPlot

      it('should get parameters for MotifDensity', function(){
        var trackConfig = tracks[13];
        // defaults min_score: 0, max_score: 1, style.height: 100
        lang.mixin(trackConfig, {min_score: 0, max_score: 1, style: {height: 100}});
        var params = parametersUtil._handleTrackTypeParameters(13, trackConfig.type, trackConfig, pluginConfig);
        expect(params.key).toBe(trackConfig.key);
        expect(params.trackNum).toBe(13);
        // height, min, max, quant, html
        expect(params.height).toEqual({title: 'Track height', value: 100, delta: 10});
        expect(params.min).toEqual({title: 'Min. score', value: 0, delta: 10});
        expect(params.max).toEqual({title: 'Max. score', value: 1, delta: 10});
        expect(params.quant).toBe(true);
        expect(params.html).toEqual({title: 'HTML/SVG features', value: false});
      }); // end shoud get parameters for MotifDensity

      it('should get parameters for list of tracks', function(){
        var testTracks = tracks.slice(0,14);
        var visibleTracks = testTracks.map(function(el){
          return {label: el.label, config: el}
        });
        var params = parametersUtil.getTrackParameters(visibleTracks, pluginConfig);
        var trackKeys = Object.keys(params);
        expect(trackKeys.length).toBe(14);
      }); // end should get parameters for list of tracks
    }); // end Test track parameters

  }); // end Test ParametersUtil

  /*describe('Browser test', function(){
    var browser = new Browser({unitTestMode: true});
  }); // end*/
});
