#Screen Shot Plugin

This is a JBrowse plugin
 
This plugin allows the user to take a high quality screenshot of the browser.
This plugin leverages the power of PhantomJS to create an image of the browser. Unfortunately, images are created using only the backend track settings so changes made within the browser interface will not included in the screenshot.

##Special Thanks
This plugin would not be possible without [phantomJS](http://phantomjs.org/), specifically [PhantomJS Cloud](https://phantomjscloud.com/), which provides phantomJS as a headless software-as-a-service. 


##Install

For JBrowse 1.11.6+ in the _JBrowse/plugins_ folder, type:  
``git clone https://github.com/bhofmei/jbplugin-screenshot.git ScreenShotPlugin``

##Activate
Add this to jbrowse.conf:
    ``"plugins": [
        'ScreenShotPlugin'
    ],``

If that doesn't work, add this to jbrowse_conf.json:
    ``"plugins" : {
        "ScreenShotPlugin" : { "location" : "plugins/ScreenShotPlugin" }
    }``

**Important**:  
For this plugin to work properly, a change needs to be made to the ``index.html`` file.  The line which parses query parameters, about line 50, currently reads
   ``var queryParams = ioQuery.queryToObject( window.location.search.slice(1) );``

Change this to   
   ``var queryParams = ioQuery.queryToObject( decodeURIComponent(window.location.search.slice(1) ) );``
    
##Use
Click the "Screen shot" button in the browser. A dialog box will open with options for the screenshot. You can also press the `s` key as a shortcut to open the dialog box.

When increasing the zoom factor, you will likely need to increase the height and width to ensure a full image.

**Note:** Due to the nature of URL-encoded screenshots, default track configurations will be used unless overriden by settings selected in this dialog box. Locally added tracks, such as combination tracks, will not be included.

##Support for Additional Plugins
This plugin includes support for the [MethylationPlugin](https://github.com/bhofmei/jbplugin-methylation).

Future support will be added for SmallRNAPlugin and SeqViewPlugin by the same author.

##Future Improvements
- Add PDF format as output type
- Track-specific settings that override the default settings
-- Min/max heights
-- Track height
-- y-scale location
- Hide track labels