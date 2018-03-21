require([
  'dojo/_base/declare',
  'dojo/_base/array',
  'JBrowse/Browser',
  'ScreenShotPlugin/View/Dialog/ScreenShotDialog',
  'ScreenShotPlugin/ParametersUtil',
  'ScreenShotPlugin/EncodeDecodeUtil'
], function (
  declare,
  array,
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
        expect(outParam.image.height).toEqaul({
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
        expect(pdfParam.pdfheight).toEqual({
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
      beforeEach(function(done){
        pluginConfig = {
    apiKey: 'a-demo-key-with-low-quota-per-ip-address',
    dialog: false,
    debug: false,
    htmlFeatures: {
      general: false,
      methyl: true,
      smrna: true,
      strandedPlot: true,
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
        done();
      });

      it('should get parameters for CanvasFeatures', function () {
        var params = parametersUtil._handleTrackTypeParameters(0, 'JBrowse/View/Track/CanvasFeatures', {}, pluginConfig)
      });
    }); // end Test track parameters

  }); // end Test ParametersUtil

  /*describe('Browser test', function(){
    var browser = new Browser({unitTestMode: true});
  }); // end*/
});
