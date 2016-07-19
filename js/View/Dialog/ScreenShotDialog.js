define( "ScreenShotPlugin/View/Dialog/ScreenShotDialog", [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'JBrowse/View/Dialog/WithActionBar',
    'dojo/on',
    'dijit/form/Button',
    'JBrowse/Model/Location'
    ],
function (
    declare,
    dom,
    focus,
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
        this.url = (args.url === undefined ? '#' : args.url );
        this.setCallback    = args.setCallback || function() {};
        this.cancelCallback = args.cancelCallback || function() {};
     },
     
     _fillActionBar: function( actionBar ){
        var ok_button = new Button({
            label: "OK",
            onClick: dojo.hitch(this, function() {
                window.open(this.url);
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
        //dojo.addClass( thisB.domNode, 'screenshot-dialog' );

        this.set('content', [
            dom.create('div',{innerHTML:'Opens a new window'}),
            dom.create( 'br' ),
            dom.create('a',{innerHTML: "Results",target: '_blank', href: thisB.url})
        ] );

        this.inherited( arguments );
    },
    
    hide: function() {
        this.inherited(arguments);
        window.setTimeout( dojo.hitch( this, 'destroyRecursive' ), 500 );
    }
});
});