# Testing ScreenShotPlugin

Because this plugin relies on an external software (PhantomJS cloud) with limited error reporting, this plugin is difficult to test and debug in general.
Each JBrowse instance will be unqiue with any number of additional plugins installed, so exhaustive testing is not feasible.
We feel that the provided testing suite covers the major, testable issues and can help uncover errors which arise.

We have split testing into three components:
1. [Program logic] (#program-logic)
2. [PhantomJS Cloud] (#phantomjs-cloud)
3. [Local installation] (#local-installation)

## General testing information
**Read carefully**

### Dependencies

To run these test via command line, PhantomJS should be installed globally. See the [phantomjs website](http://phantomjs.org/download.html) for download. Add the executable to your [path](http://phantomjs.org/quick-start.html).

Additionally, `Python` and `Pip` must be installed so you can install and run `RangeHTTPServer`.

Finally, `npm` or `yarn` must be installed to download additional dependencies.

Assuming `Python`/`pip` and `npm`/`yarn` are installed, run the following to install dependencies

```
pip install --user RangeHTTPServer

# replace yarn with npm if yarn is not installed
yarn install
```

### Test Suites
There are three testing components, as described below.

To turn on/off which tests are run, comment/uncomment lines 59-61 of `test/index.html`. Use `<!-- ... -->` to comment the line.

Some of the testing components require additional test setup using an additional script to be run beforehand. See each component for additional details.

### Running the tests

## Program Logic

This component has three test areas:
1. General, output, and track parameter initalization for the dialog box
2. Encode screenshot parameters to be sent with the PhantomJS cloud request
3. Decode URL screenshot parameters to apply to the general JBrowse view and individual track configurations

These are standard unit tests to test the underlying logic. It does not require additional testing setup.

## PhantomJS Cloud

This component aims to test the interface between JBrowse, this plugin, and PhantomJS Cloud using a [stable JBrowse](https://bhofmei.github.io/bhofmei-jbplugins/) instance with tested/supported plugins.
We generate several screenshots, save the results to files, and test that the screenshot/file has the expected content.

### Set-up
This require running a test set-up script.

```
cd test/
./prep_test.sh
cd ../
```

This should generate 5 files: `file1.json`, `file2.json`, `file3.json`, `file4.json`, `file5.json`.

Note: the script uses `wget`; if `wget` in not installed on your computer, use `curl` or for each test, open the URL in a browser then save the output to the corresponding file.

### Errors
As this is a stable JBrowse instance designed to be used for testing this plugin, errors should not arise often.

If errors arise during this testing, it could be caused by several issues
1. If all the files are blank, it's likely an internet access issue
2. Too many tests run for the day--this error will be indicated directly in the testing output
3. PhantomJS Cloud is not working
4. One of the plugins is not working
  1. If all tracks fail, this is likely a syntax or javascript compatability issue
  2. If it's only one track type, there is something with that plugin

