#Screen Shot Plugin
This is a JBrowse plugin
 
This plugin allows the user to take a high quality screenshot of the browser.
This plugin leverages the power of PhantomJS to create an image of the browser. Unfortunately, images are created using only the backend track settings so changes made within the browser interface will not included in the screenshot.


**This plugin is still under development and should not be considered functional**

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
    
##Use
Click the "Screen shot" button in the browser. A new page will open with the PNG screenshot