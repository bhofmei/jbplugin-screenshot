require([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/request',
  'dojo/dom',
  'dojo/query',
  'dojo/dom-construct'
], function (
  declare,
  array,
  lang,
  request,
  dom,
  query,
  domConstruct
) {

  console.log('TESTING PHANTOMJS CLOUD');

  var statusError = function (statusCode) {
    if (statusCode === 200) {
      return null;
    } else if (statusCode === 400){
      return 'BAD REQUEST: request had (syntax) error; fix error before resubmitting'
    } else if (statusCode === 401){
      return 'UNAUTHORIZED: invad ApiKey'
    } else if (statusCode === 402){
      return 'PAYMENT REQUIRED: out of credits; use custom ApiKey, purchase more credits, or try again tomorrow'
    } else if (statusCode === 403){
      return 'FORBIDDEN: request flagged due to abuse'
    } else if(statusCode === 424){
      return 'FAILED DEPENDENCY: target page was not reachable or request timed out'
    } else if(statusCode === 500){
      return 'INTERNAL SERVER ERROR: retry request; if issue persists, see phantomjscloud.com'
    } else if (statusCode === 502){
      return 'BAD GATEWAY: request did not reach PhantomJS cloud; check network connection; if issue persists, see phantomjscloud.com'
    } else if (statusCode === 503){
      return 'SERVER TOO BUSY: try again later'
    }
  };
  describe('PhantomJS Cloud tests: ', function(){
  describe('Inital test', function () {
    var test = true;
    it('jasimine is working', function () {
      expect(test).toBe(true);
    });
  });

  describe('Test phantomjs - no tracks', function () {
    var data;
    beforeEach(function (done) {
      request('file1.json', {
        handleAs: 'json'
      }).then(function (incoming) {
        data = incoming;
        done();
      }, function (err) {
        console.log(err);
        return;
      });
    }); // end beforeEach

    it('should have data', function () {
      expect(data).toBeDefined();
    }); // end should have data

    it('should have successful status', function () {
      // parse code
      var statusMessage = statusError(data.statusCode);
      if (statusMessage !== null) {
        console.error(statusMessage);
      }
      expect(statusMessage).toBe(null);
    }); // end have successful status

    describe('Test content', function () {

      var content;
      beforeEach(function (done) {
        var html = data.content.data;
        content = domConstruct.toDom(html);
        done();
      }); // end beforeEach

      it('should have track list', function () {
        var node = query('#hierarchicalTrackPane', content);
        expect(node.length).toBe(1);
      }); // end should have track list

      it('should have menu', function () {
        var node = query('.menuBar', content);
        expect(node.length).toBe(1);
      }); // end should have menu

      it('should have nav', function () {
        var node = query('#navbox', content);
        expect(node.length).toBe(1);
      }); // end should have nav

      it('should have no visible tracks', function () {
        var tracks = query('.track.dojoDndItem', content);
        expect(tracks.length).toBe(0);
      }); // end should have no visible tracks
    }); // end Test content

  }); // end Test get data - no tracks

  describe('Test phantomjs - 2 tracks; hide nav, menu, track list', function () {
    var data;
    beforeEach(function (done) {
      request('file2.json', {
        handleAs: 'json'
      }).then(function (incoming) {
        data = incoming;
        done();
      }, function (err) {
        console.log(err);
        return;
      });
    }); // end beforeEach

    it('should have data', function () {
      expect(data).toBeDefined();
    }); // end should have data

    it('should have successful status', function () {
      var statusMessage = statusError(data.statusCode);
      if (statusMessage !== null) {
        console.error(statusMessage);
      }
      expect(statusMessage).toBe(null);
    }); // end should have successful status

    describe('Test content', function () {
      var content;
      beforeEach(function (done) {
        var html = data.content.data;
        content = domConstruct.toDom(html);
        done();
      }); // end beforeEach

      it('should not have track list', function () {
        var node = query('#hierarchicalTrackPane', content);
        expect(node.length).toBe(0);
      }); // end should have track list

      it('should not have menu', function () {
        var node = query('.menuBar', content);
        expect(node.length).toBe(0);
      }); // end should have menu

      it('should not have nav', function () {
        var node = query('#navbox', content);
        expect(node.length).toBe(0);
      }); // end should have nav

      it('should have 2 visible tracks', function () {
        var tracks = query('.track.dojoDndItem', content);
        expect(tracks.length).toBe(2);
        var geneTrack = tracks[0];
        expect(geneTrack.id).toBe('track_t1_genes');
        var geneType = geneTrack.classList[1];
        expect(geneType).toBe('track_jbrowse_view_track_canvasfeatures');
        var rnaseqTrack = tracks[1];
        expect(rnaseqTrack.id).toBe('track_t5_rnaseq-un');
        var rnaseqType = rnaseqTrack.classList[1];
        expect(rnaseqType).toBe('track_jbrowse_view_track_alignments2');
      }); // end should have 2 visible tracks
    }); // end Test content
  }); // end Test phantomjs - 2 tracks; hide nav, menu, track list

  describe('Test phantomjs - JBrowse tracks and HTML', function(){
    var data;
    beforeEach(function (done) {
      request('file3.json', {
        handleAs: 'json'
      }).then(function (incoming) {
        data = incoming;
        done();
      }, function (err) {
        console.log(err);
        return;
      });
    }); // end beforeEach

    it('should have data', function () {
      expect(data).toBeDefined();
    }); // end should have data

    it('should have successful status', function () {
      var statusMessage = statusError(data.statusCode);
      if (statusMessage !== null) {
        console.error(statusMessage);
      }
      expect(statusMessage).toBe(null);
    }); // end should have successful status

    describe('Test content', function(){
      var content;
      var tracks;
      beforeEach(function (done) {
        var html = data.content.data;
        content = domConstruct.toDom(html);
        tracks = query('.track.dojoDndItem', content);
        done();
      }); // end beforeEach

      it('should have 6 visible tracks', function(){
        expect(tracks.length).toBe(6);
      }); // end should have 6 visible tracks

      it('should have gene track, HTML', function(){
        var geneTrack = tracks[0];
        expect(geneTrack.id).toBe('track_t1_genes');
        var geneType = geneTrack.classList[1];
        expect(geneType).toBe('track_jbrowse_view_track_htmlfeatures');
      }); // end should have gene track, HTML

      it('should have SNP track, set height', function(){
        // track_jbrowse_view_track_canvasvariants track_t3_mt_snps
        var snpTrack = tracks[1];
        expect(snpTrack.id).toBe('track_t3_mt-snps');
        expect(snpTrack.classList[1]).toBe( 'track_jbrowse_view_track_canvasvariants' );
        // should have overflow
        var overflow = query('.height_overflow_message', snpTrack);
        expect(overflow.length).toBe(4);
        var height = parseInt(snpTrack.style.height.replace('px', ''));
        expect(height).toBeLessThan(60);
      }); // end should have SNP track, set height

      it('should have RNAseq track, compact', function(){
        var rnaseqTrack = tracks[2];
        expect(rnaseqTrack.id).toBe('track_t5_rnaseq-un');
        expect(rnaseqTrack.classList[1]).toBe( 'track_jbrowse_view_track_alignments2' );
        // should have 1 overflow as compact
        var overflow = query('.height_overflow_message', rnaseqTrack);
        expect(overflow.length).toBe(1);
        var height = parseInt(rnaseqTrack.style.height.replace('px', ''));
        expect(height).toBeLessThan(621);
      }); // end should have RNAseq track, HTML

      it('should have SNP coverage, y-scale left', function(){
        var snpcovTrack = tracks[3];
        expect(snpcovTrack.id).toBe('track_t6_rnaseq-snp');
        expect(snpcovTrack.classList[1]).toBe( 'track_jbrowse_view_track_snpcoverage' );
        // get y scale
        var yscale = query('.vertical_ruler', snpcovTrack)[0];
        var left = parseInt(yscale.style.left.replace('px', ''));
        // get track label to compare left to ruler
        var labelLeft = parseInt(query('.track-label', snpcovTrack)[0].style.left.replace('px',''));
        expect(Math.abs(left-labelLeft)).toBeLessThan(20);
      }); // end should have SNP coverage, y-scale left

      it('should have Wiggle XY, y-scale right and max score', function(){
        var wigTrack = tracks[4];
        expect(wigTrack.id).toBe('track_t8_xy');
        expect(wigTrack.classList[1]).toBe('track_jbrowse_view_track_wiggle_xyplot');
        // get y-scale
        var yscale = query('.vertical_ruler', wigTrack)[0];
        var left = parseInt(yscale.style.left.replace('px', ''));
        // get track label to compare left to ruler
        var labelLeft = parseInt(query('.track-label', wigTrack)[0].style.left.replace('px',''));
        expect(Math.abs(left-labelLeft)).not.toBeLessThan(20);
        // get top label
        var yscaleLabel = yscale.children[0].children[0].children[0];
        expect(yscaleLabel.innerHTML).toBe('50');
      }); // end should have Wiggle XY, y-scale right and max score

    }); // end Test content
  }); // end Test phantomjs - JBrowse tracks

  describe('Test phantomjs - Plugin tracks', function(){
    var data;
    var trackList;
    var tracks = {};
    beforeEach(function (done) {
      request('file4.json', {
        handleAs: 'json'
      }).then(function (incoming) {
        data = incoming;
        if(data){
          var html = data.content.data;
          var content = domConstruct.toDom(html);
          trackList = query('.track.dojoDndItem', content);
          array.forEach(trackList,  function(t){
            tracks[t.id] = t
          });
          done();
        } else {
          console.log('No data');
          done.fail();
        }
      }, function (err) {
        console.log(err);
        done.fail();
      });
    }); // end beforeEach

    it('should have 6 tracks', function(){
      expect(trackList.length).toBe(6)
    }); // end should have 6 tracks

    it('should have methylation track', function(){
      var track = tracks['track_t11_methyl'];
      expect(track).toBeDefined('Methyl track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_methylationplugin_view_track_wiggle_methylplot');
    }); // end should have methylation track

    it('should have methylation track, extended modifications', function(){
      var track = tracks['track_t15_methyl-ext'];
      expect(track.id).toBeDefined('Extended motification methyl track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_methylationplugin_view_track_wiggle_methylplot');

    }); // end should have methylation track, extended modifications

    it('should have motif density track', function(){
     var track = tracks['track_t13_motif-dens'];
      expect(track.id).toBeDefined('Motif Density track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_motifdensityplugin_view_track_motifdensity');
      var height = parseInt(track.style.height.replace('px', ''));
      expect(height).toBe(120, 'Height of track is incorrect');
    }); // end should have motif density track

    it('should have small RNA track', function(){
      var track = tracks['track_t10_smrna'];
      expect(track).toBeDefined('Small rna track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_smallrnaplugin_view_track_smalignments');
      var height = parseInt(track.style.height.replace('px', ''));
      expect(height).toBe(420, 'Height of track is incorrect');
      // 1 overflow message
//      var overflowMessages = query('.height_overflow', track);
//      expect(overflowMessages.length).toBe(1)
    }); // end should have small RNA track

    it('Should have stranded wiggle', function(){
      var track = tracks['track_t12_stranded'];
      expect(track).toBeDefined('Stranded XY track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_strandedplotplugin_view_track_wiggle_strandedxyplot');
      // y scale position
        var yscale = query('.vertical_ruler', track)[0];
        var left = parseInt(yscale.style.left.replace('px', ''));
        var labelLeft = parseInt(query('.track-label', track)[0].style.left.replace('px',''));
      var diff = Math.abs(left-labelLeft);
        expect(diff > 20 && diff < 1000).toBeTruthy('Y-scale not in the center');
      // check its actually stranded
      var yscaleLabelTop = yscale.children[0].children[0].children[0];
        expect(yscaleLabelTop.innerHTML).toBe('2');
      var yscaleLabelBottom = yscale.children[0].children[3].children[0];
        expect(yscaleLabelBottom.innerHTML).toBe('-1');
    }); // end Should have stranded wiggle

    it('should have rnaseq track with stranded histograms', function(){
      var track = tracks['track_t12_stranded'];
      expect(track).toBeDefined('Stranded RNA-seq track does not exist');
      var trackType = track.classList[1];
      if(trackType === 'track_jbrowse_view_track_alignment2'){
        fail('RNA seq track not using histograms');
        return;
      }
      expect(trackType).toBe(
        'track_strandedplotplugin_view_track_wiggle_strandedxyplot');
      var height = parseInt(track.style.height.replace('px', ''));
      expect(height).toBe(120, 'Height of track is incorrect');
      //expect(trackType).toBe('track_strandedplotplugin_view_')
    }); // end should have rnaseq track with stranded histograms
  }); // end Test phantomjs - Plugin tracks

  describe('Test phantomjs - Plugins with HTML', function(){
    var data;
    var trackList;
    var tracks = {};
    beforeEach(function (done) {
      request('file5.json', {
        handleAs: 'json'
      }).then(function (incoming) {
        data = incoming;
        if(data){
          var html = data.content.data;
          var content = domConstruct.toDom(html);
          trackList = query('.track.dojoDndItem', content);
          array.forEach(trackList,  function(t){
            tracks[t.id] = t
          });
          done();
        } else {
          console.log('No data');
          done.fail();
        }
      }, function (err) {
        console.log(err);
        done.fail();
      });
    }); // end beforeEach

    it('should have 7 tracks', function(){
      expect(trackList.length).toBe(7)
    }); // end should have 6 tracks

    it('should have methylation track, hide CG', function(){
      var track = tracks['track_t11_methyl'];
      expect(track).toBeDefined('Methyl track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_methylationplugin_view_track_wiggle_methylhtmlplot');
      // check CG hidden - get all bars
      var mPos = query('.feature-methyl', track);
      expect(mPos.length).toBeLessThan(100);
      array.forEach(mPos, function(p){
        expect(p.style.backgroundColor).not.toBe('rgb(163, 96, 133)');
      });
    }); // end should have methyl track, hide CG

    it('should have SVG motif density', function(){
      var track = tracks['track_t13_motif-dens'];
       expect(track).toBeDefined('Motif dens track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_motifdensityplugin_view_track_motifsvgdensity');
      // check sublabels
      var subLabels = query('.motif-dens-sublabel', track);
      expect(subLabels.length).toBe(4);
      var expectedLabels = ['CG', 'CHG', 'CHH', 'C'];
      array.forEach(subLabels, function(l, i){
        expect(l.innerHTML).toBe(expectedLabels[i]);
      });
    }); // end should have SVG motif density

    it('should have HTML small rna seq track', function(){
      var track = tracks['track_t10_smrna'];
      expect(track).toBeDefined('smRNA track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_smallrnaplugin_view_track_smhtmlalignments');
      // should have 70-110 divs
      var smrnas = query('.smrna-alignment', track);
      expect(smrnas.length).toBeGreaterThan(70);
      // should have 1+ of each size
      var sizes = ['21', '22', '23', '24', 'other'];
      array.forEach(sizes, function(s){
        var f = query('.smrna-'+s, track);
        expect(f.length).toBeGreaterThan(0);
      });
    }); // end should have HTML rna seq track

    it('should have SVG wiggle density', function(){
      var track = tracks['track_t9_dens'];
      expect(track).toBeDefined('Wiggle density track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_wigglesvgplotplugin_view_track_wiggle_svgdensity');
       var height = parseInt(track.style.height.replace('px', ''));
      expect(height).toBe(51, 'Height of track is incorrect');
      var paths = query('path', track);
      expect(paths.length).toBeGreaterThan(20);
    }); // end should have wiggle density, SVG

    it('should have stranded xy, SVG', function(){
      var track = tracks['track_t12_stranded'];
      expect(track).toBeDefined('Stranded XY track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_strandedplotplugin_view_track_wiggle_strandedsvgplot');
      var block = query('.block', track)[1];
      var svg = block.children[0];
      var polylines = query('polyline', svg);
      expect(polylines.length).toBe(2);
      // pos line is blue, neg line is red
      expect(polylines[0].getAttribute('fill')).toMatch('0, 0, 255');
      expect(polylines[1].getAttribute('fill')).toMatch('255, 0, 0');
    }); // end should have stranded xy, SVG

    it('should have HTML rna seq', function(){
      var track = tracks['track_t17_rnaseq-st'];
      expect(track).toBeDefined('RNA seq track does not exist');
      var trackType = track.classList[1];
      expect(trackType).toBe('track_jbrowse_view_track_alignments');
      // search for plus and minus features
      var plusFeat = query('.plus-alignment', track);
      expect(plusFeat.length).toBeGreaterThan(500);
      var minusFeat = query('.minus-alignment', track);
      expect(minusFeat.length).toBe(1);
    }); // end should have HTML rna seq

    it('should have Wiggle XY, SVG', function(){
        var track = tracks['track_t18_xy2'];
      expect(track).toBeDefined('Wiggle XY track does not exist');

     var trackType = track.classList[1];
     expect(trackType).toBe('track_wigglesvgplotplugin_view_track_wiggle_svgxyplot');
        // check for 2 lines
        var block = query('.block', track)[1];
        var svg = block.children[0];
        var polylines = query('polyline', svg);
        expect(polylines.length).toBe(2);
        // pos line is blue, neg line is red
        expect(polylines[0].getAttribute('fill')).toMatch('0, 0, 255');
        expect(polylines[1].getAttribute('fill')).toMatch('255, 0, 0');
    }); // end should have Wiggle XY, SVG
  }); // end Test phantomjs - Plugins with HTML
}); // end PhantomJS Cloud tests
});
