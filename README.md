#Screen Shot Plugin

This is a JBrowse plugin
 
This plugin allows the user to take a high quality screenshot of the browser.
This plugin leverages the power of PhantomJS to create an image of the browser. Unfortunately, images are created using only the backend track settings so changes made within the browser interface will not included in the screenshot.

##Special Thanks
This plugin would not be possible without [phantomJS](http://phantomjs.org/), specifically [PhantomJS Cloud](https://phantomjscloud.com/), which provides phantomJS as a headless software-as-a-service. 


##Install

For JBrowse 1.11.6+ in the _JBrowse/plugins_ folder, type:  
`git clone https://github.com/bhofmei/jbplugin-screenshot.git ScreenShotPlugin`

##Activate

Add this to jbrowse.conf:
```
    [plugins.ScreenShotPlugin]
    location = plugins/ScreenShotPlugin
```

If that doesn't work, add this to jbrowse_conf.json:
```
    "plugins" : {
        "ScreenShotPlugin" : { "location" : "plugins/ScreenShotPlugin" }
}
```

###PhantomJS Cloud Accounts
This plugin will work directly out of the box with PhantomJS Cloud. PhantomJS Clous offers a "demo" version of its services where each IP address is limited to 100 requests per day.
If this is insufficient, you can create a free account with PhantomJS Cloud which allows 500 requests per day to that account. See [PhantomJS Cloud](https://phantomjscloud.com/pricing.html) for more information.

If you do have your own account with PhantomJS, include your user API key when activating the plugin.

For jbrowse.conf
```
    [plugins.ScreenShotPlugin]
    location = plugins/ScreenShotPlugin
    apiKey = <insert_api_key>
```
For jbrowse_conf.json
```
    "plugins" : {
        "ScreenShotPlugin" : { "location" : "plugins/ScreenShotPlugin",
                            "apiKey": "<insert_api_key>" }
    }
```
    
##Use
Click the "Screen shot" button in the browser. A dialog box will open with options for the screenshot. You can also press the `s` key as a shortcut to open the dialog box.

When increasing the zoom factor, you will likely need to increase the height and width to ensure a full image.

**Note:** Due to the nature of URL-encoded screenshots, default track configurations will be used unless overriden by settings selected in this dialog box. Locally added tracks, such as combination tracks, will not be included.

##Support for Additional Plugins
###Methylation Plugin
This plugin includes support for the [MethylationPlugin](https://github.com/bhofmei/jbplugin-methylation).  
If the plugin ID<sup>1</sup> is anything except `MethylationPlugin`, the ID will need to be specified. 

For jbrowse.conf
```
    [plugins.ScreenShotPlugin]
    location = plugins/ScreenShotPlugin
    methylPlugin = <methylation_plugin_id>
```

Future support will be added for SmallRNAPlugin by the same author.

<sup>1</sup>For jbrowse.conf, the plugin ID is found as `[ plugins.ID]` for each plugin.  
In jbrowse_conf.json, the plugin ID is found as `"plugins":{"ID":{"location":"..."}}`

###SeqViewsPlugin
This plugin only needs to know if the SeqViews Plugin is activated.

It will automatically look for a plugin with the plugin ID `SeqViewsPlugin`. If the SeqViews Plugin has been activate but with a different plugin ID, indicate that `seqViewsPlugin = true`.

In jbrowse.conf,
```
    [plugins.ScreenShotPlugin]
    ...
    seqViewsPlugin = true
```

Optionally, you can specify `seqViewsPlugin = false` if you do not want to include support for it.

##Future Improvements
- Add PDF format as output type
- Hide track labels
- Convert canvas features to HTML features for better SVG editting
