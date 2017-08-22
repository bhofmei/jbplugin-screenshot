require({
  cache: {
    'dijit/layout/TabContainer': function () {
      define([
	"dojo/_base/lang", // lang.getObject
	"dojo/_base/declare", // declare
	"./_TabContainerBase",
	"./TabController",
	"./ScrollingTabController"
], function (lang, declare, _TabContainerBase, TabController, ScrollingTabController) {

        // module:
        //		dijit/layout/TabContainer


        return declare("dijit.layout.TabContainer", _TabContainerBase, {
          // summary:
          //		A Container with tabs to select each child (only one of which is displayed at a time).
          // description:
          //		A TabContainer is a container that has multiple panes, but shows only
          //		one pane at a time.  There are a set of tabs corresponding to each pane,
          //		where each tab has the name (aka title) of the pane, and optionally a close button.
          //
          //		See `StackContainer.ChildWidgetProperties` for details on the properties that can be set on
          //		children of a `TabContainer`.

          // useMenu: [const] Boolean
          //		True if a menu should be used to select tabs when they are too
          //		wide to fit the TabContainer, false otherwise.
          useMenu: true,

          // useSlider: [const] Boolean
          //		True if a slider should be used to select tabs when they are too
          //		wide to fit the TabContainer, false otherwise.
          useSlider: true,

          // controllerWidget: Class
          //		An optional parameter to override the widget used to display the tab labels
          controllerWidget: "",

          _makeController: function ( /*DomNode*/ srcNode) {
            // summary:
            //		Instantiate tablist controller widget and return reference to it.
            //		Callback from _TabContainerBase.postCreate().
            // tags:
            //		protected extension

            // "string" branch for back-compat, remove for 2.0
            var cls = this.baseClass + "-tabs" + (this.doLayout ? "" : " dijitTabNoLayout"),
              TabController = typeof this.controllerWidget == "string" ? lang.getObject(this.controllerWidget) :
              this.controllerWidget;

            return new TabController({
              id: this.id + "_tablist",
              ownerDocument: this.ownerDocument,
              dir: this.dir,
              lang: this.lang,
              textDir: this.textDir,
              tabPosition: this.tabPosition,
              doLayout: this.doLayout,
              containerId: this.id,
              "class": cls,
              nested: this.nested,
              useMenu: this.useMenu,
              useSlider: this.useSlider,
              tabStripClass: this.tabStrip ? this.baseClass + (this.tabStrip ? "" : "No") + "Strip" : null
            }, srcNode);
          },

          postMixInProperties: function () {
            this.inherited(arguments);

            // Scrolling controller only works for horizontal non-nested tabs
            if (!this.controllerWidget) {
              this.controllerWidget = (this.tabPosition == "top" || this.tabPosition == "bottom") && !this.nested ?
                ScrollingTabController : TabController;
            }
          }
        });
      });

    },
    'dijit/layout/_TabContainerBase': function () {
      define([
	"dojo/text!./templates/TabContainer.html",
	"./StackContainer",
	"./utils", // marginBox2contextBox, layoutChildren
	"../_TemplatedMixin",
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add
	"dojo/dom-geometry", // domGeometry.contentBox
	"dojo/dom-style" // domStyle.style
], function (template, StackContainer, layoutUtils, _TemplatedMixin, declare, domClass, domGeometry, domStyle) {

        // module:
        //		dijit/layout/_TabContainerBase

        return declare("dijit.layout._TabContainerBase", [StackContainer, _TemplatedMixin], {
          // summary:
          //		Abstract base class for TabContainer.   Must define _makeController() to instantiate
          //		and return the widget that displays the tab labels
          // description:
          //		A TabContainer is a container that has multiple panes, but shows only
          //		one pane at a time.  There are a set of tabs corresponding to each pane,
          //		where each tab has the name (aka title) of the pane, and optionally a close button.

          // tabPosition: String
          //		Defines where tabs go relative to tab content.
          //		"top", "bottom", "left-h", "right-h"
          tabPosition: "top",

          baseClass: "dijitTabContainer",

          // tabStrip: [const] Boolean
          //		Defines whether the tablist gets an extra class for layouting, putting a border/shading
          //		around the set of tabs.   Not supported by claro theme.
          tabStrip: false,

          // nested: [const] Boolean
          //		If true, use styling for a TabContainer nested inside another TabContainer.
          //		For tundra etc., makes tabs look like links, and hides the outer
          //		border since the outer TabContainer already has a border.
          nested: false,

          templateString: template,

          postMixInProperties: function () {
            // set class name according to tab position, ex: dijitTabContainerTop
            this.baseClass += this.tabPosition.charAt(0).toUpperCase() + this.tabPosition.substr(1).replace(/-.*/, "");

            this.srcNodeRef && domStyle.set(this.srcNodeRef, "visibility", "hidden");

            this.inherited(arguments);
          },

          buildRendering: function () {
            this.inherited(arguments);

            // Create the tab list that will have a tab (a.k.a. tab button) for each tab panel
            this.tablist = this._makeController(this.tablistNode);

            if (!this.doLayout) {
              domClass.add(this.domNode, "dijitTabContainerNoLayout");
            }

            if (this.nested) {
              /* workaround IE's lack of support for "a > b" selectors by
               * tagging each node in the template.
               */
              domClass.add(this.domNode, "dijitTabContainerNested");
              domClass.add(this.tablist.containerNode, "dijitTabContainerTabListNested");
              domClass.add(this.tablistSpacer, "dijitTabContainerSpacerNested");
              domClass.add(this.containerNode, "dijitTabPaneWrapperNested");
            } else {
              domClass.add(this.domNode, "tabStrip-" + (this.tabStrip ? "enabled" : "disabled"));
            }
          },

          _setupChild: function ( /*dijit/_WidgetBase*/ tab) {
            // Overrides StackContainer._setupChild().
            domClass.add(tab.domNode, "dijitTabPane");
            this.inherited(arguments);
          },

          startup: function () {
            if (this._started) {
              return;
            }

            // wire up the tablist and its tabs
            this.tablist.startup();

            this.inherited(arguments);
          },

          layout: function () {
            // Overrides StackContainer.layout().
            // Configure the content pane to take up all the space except for where the tabs are

            if (!this._contentBox || typeof (this._contentBox.l) == "undefined") {
              return;
            }

            var sc = this.selectedChildWidget;

            if (this.doLayout) {
              // position and size the titles and the container node
              var titleAlign = this.tabPosition.replace(/-h/, "");
              this.tablist.region = titleAlign;
              var children = [this.tablist, {
                domNode: this.tablistSpacer,
                region: titleAlign
				}, {
                domNode: this.containerNode,
                region: "center"
				}];
              layoutUtils.layoutChildren(this.domNode, this._contentBox, children);

              // Compute size to make each of my children.
              // children[2] is the margin-box size of this.containerNode, set by layoutChildren() call above
              this._containerContentBox = layoutUtils.marginBox2contentBox(this.containerNode, children[2]);

              if (sc && sc.resize) {
                sc.resize(this._containerContentBox);
              }
            } else {
              // just layout the tab controller, so it can position left/right buttons etc.
              if (this.tablist.resize) {
                //make the tabs zero width so that they don't interfere with width calc, then reset
                var s = this.tablist.domNode.style;
                s.width = "0";
                var width = domGeometry.getContentBox(this.domNode).w;
                s.width = "";
                this.tablist.resize({
                  w: width
                });
              }

              // and call resize() on the selected pane just to tell it that it's been made visible
              if (sc && sc.resize) {
                sc.resize();
              }
            }
          },

          destroy: function (preserveDom) {
            if (this.tablist) {
              this.tablist.destroy(preserveDom);
            }
            this.inherited(arguments);
          }
        });
      });

    },
    'dijit/layout/StackContainer': function () {
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
], function (array, cookie, declare, domClass, domConstruct, has, lang, on, ready, topic, when, registry, _WidgetBase, _LayoutWidget) {

        // module:
        //		dijit/layout/StackContainer

        // Back compat w/1.6, remove for 2.0
        if (has("dijit-legacy-requires")) {
          ready(0, function () {
            var requires = ["dijit/layout/StackController"];
            require(requires); // use indirection so modules not rolled into a build
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

          buildRendering: function () {
            this.inherited(arguments);
            domClass.add(this.domNode, "dijitLayoutContainer");
          },

          postCreate: function () {
            this.inherited(arguments);
            this.own(
              on(this.domNode, "keydown", lang.hitch(this, "_onKeyDown"))
            );
          },

          startup: function () {
            if (this._started) {
              return;
            }

            var children = this.getChildren();

            // Setup each page panel to be initially hidden
            array.forEach(children, this._setupChild, this);

            // Figure out which child to initially display, defaulting to first one
            if (this.persist) {
              this.selectedChildWidget = registry.byId(cookie(this.id + "_selectedChild"));
            } else {
              array.some(children, function (child) {
                if (child.selected) {
                  this.selectedChildWidget = child;
                }
                return child.selected;
              }, this);
            }
            var selected = this.selectedChildWidget;
            if (!selected && children[0]) {
              selected = this.selectedChildWidget = children[0];
              selected.selected = true;
            }

            // Publish information about myself so any StackControllers can initialize.
            // This needs to happen before this.inherited(arguments) so that for
            // TabContainer, this._contentBox doesn't include the space for the tab labels.
            topic.publish(this.id + "-startup", {
              children: children,
              selected: selected,
              textDir: this.textDir
            });

            // Startup each child widget, and do initial layout like setting this._contentBox,
            // then calls this.resize() which does the initial sizing on the selected child.
            this.inherited(arguments);
          },

          resize: function () {
            // Overrides _LayoutWidget.resize()
            // Resize is called when we are first made visible (it's called from startup()
            // if we are initially visible). If this is the first time we've been made
            // visible then show our first child.
            if (!this._hasBeenShown) {
              this._hasBeenShown = true;
              var selected = this.selectedChildWidget;
              if (selected) {
                this._showChild(selected);
              }
            }
            this.inherited(arguments);
          },

          _setupChild: function ( /*dijit/_WidgetBase*/ child) {
            // Overrides _LayoutWidget._setupChild()

            // For aria support, wrap child widget in a <div role="tabpanel">
            var childNode = child.domNode,
              wrapper = domConstruct.place(
                "<div role='tabpanel' class='" + this.baseClass + "ChildWrapper dijitHidden'>",
                child.domNode,
                "replace"),
              label = child["aria-label"] || child.title || child.label;
            if (label) {
              // setAttribute() escapes special chars, and if() statement avoids setting aria-label="undefined"
              wrapper.setAttribute("aria-label", label);
            }
            domConstruct.place(childNode, wrapper);
            child._wrapper = wrapper; // to set the aria-labelledby in StackController

            this.inherited(arguments);

            // child may have style="display: none" (at least our test cases do), so remove that
            if (childNode.style.display == "none") {
              childNode.style.display = "block";
            }

            // remove the title attribute so it doesn't show up when i hover over a node
            child.domNode.title = "";
          },

          addChild: function ( /*dijit/_WidgetBase*/ child, /*Integer?*/ insertIndex) {
            // Overrides _Container.addChild() to do layout and publish events

            this.inherited(arguments);

            if (this._started) {
              topic.publish(this.id + "-addChild", child, insertIndex); // publish

              // in case the tab titles have overflowed from one line to two lines
              // (or, if this if first child, from zero lines to one line)
              // TODO: w/ScrollingTabController this is no longer necessary, although
              // ScrollTabController.resize() does need to get called to show/hide
              // the navigation buttons as appropriate, but that's handled in ScrollingTabController.onAddChild().
              // If this is updated to not layout [except for initial child added / last child removed], update
              // "childless startup" test in StackContainer.html to check for no resize event after second addChild()
              this.layout();

              // if this is the first child, then select it
              if (!this.selectedChildWidget) {
                this.selectChild(child);
              }
            }
          },

          removeChild: function ( /*dijit/_WidgetBase*/ page) {
            // Overrides _Container.removeChild() to do layout and publish events

            var idx = array.indexOf(this.getChildren(), page);

            this.inherited(arguments);

            // Remove the child widget wrapper we use to set aria roles.  This won't affect the page itself since it's
            // already been detached from page._wrapper via the this.inherited(arguments) call above.
            domConstruct.destroy(page._wrapper);
            delete page._wrapper;

            if (this._started) {
              // This will notify any tablists to remove a button; do this first because it may affect sizing.
              topic.publish(this.id + "-removeChild", page);
            }

            // If all our children are being destroyed than don't run the code below (to select another page),
            // because we are deleting every page one by one
            if (this._descendantsBeingDestroyed) {
              return;
            }

            // Select new page to display, also updating TabController to show the respective tab.
            // Do this before layout call because it can affect the height of the TabController.
            if (this.selectedChildWidget === page) {
              this.selectedChildWidget = undefined;
              if (this._started) {
                var children = this.getChildren();
                if (children.length) {
                  this.selectChild(children[Math.max(idx - 1, 0)]);
                }
              }
            }

            if (this._started) {
              // In case the tab titles now take up one line instead of two lines
              // (note though that ScrollingTabController never overflows to multiple lines),
              // or the height has changed slightly because of addition/removal of tab which close icon
              this.layout();
            }
          },

          selectChild: function ( /*dijit/_WidgetBase|String*/ page, /*Boolean*/ animate) {
            // summary:
            //		Show the given widget (which must be one of my children)
            // page:
            //		Reference to child widget or id of child widget

            var d;

            page = registry.byId(page);

            if (this.selectedChildWidget != page) {
              // Deselect old page and select new one
              d = this._transition(page, this.selectedChildWidget, animate);
              this._set("selectedChildWidget", page);
              topic.publish(this.id + "-selectChild", page); // publish

              if (this.persist) {
                cookie(this.id + "_selectedChild", this.selectedChildWidget.id);
              }
            }

            // d may be null, or a scalar like true.  Return a promise in all cases
            return when(d || true); // Promise
          },

          _transition: function (newWidget, oldWidget /*===== ,  animate =====*/ ) {
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
            if (oldWidget) {
              this._hideChild(oldWidget);
            }
            var d = this._showChild(newWidget);

            // Size the new widget, in case this is the first time it's being shown,
            // or I have been resized since the last time it was shown.
            // Note that page must be visible for resizing to work.
            if (newWidget.resize) {
              if (this.doLayout) {
                newWidget.resize(this._containerContentBox || this._contentBox);
              } else {
                // the child should pick it's own size but we still need to call resize()
                // (with no arguments) to let the widget lay itself out
                newWidget.resize();
              }
            }

            return d; // If child has an href, promise that fires when the child's href finishes loading
          },

          _adjacent: function ( /*Boolean*/ forward) {
            // summary:
            //		Gets the next/previous child widget in this container from the current selection.

            // TODO: remove for 2.0 if this isn't being used.   Otherwise, fix to skip disabled tabs.

            var children = this.getChildren();
            var index = array.indexOf(children, this.selectedChildWidget);
            index += forward ? 1 : children.length - 1;
            return children[index % children.length]; // dijit/_WidgetBase
          },

          forward: function () {
            // summary:
            //		Advance to next page.
            return this.selectChild(this._adjacent(true), true);
          },

          back: function () {
            // summary:
            //		Go back to previous page.
            return this.selectChild(this._adjacent(false), true);
          },

          _onKeyDown: function (e) {
            topic.publish(this.id + "-containerKeyDown", {
              e: e,
              page: this
            }); // publish
          },

          layout: function () {
            // Implement _LayoutWidget.layout() virtual method.
            var child = this.selectedChildWidget;
            if (child && child.resize) {
              if (this.doLayout) {
                child.resize(this._containerContentBox || this._contentBox);
              } else {
                child.resize();
              }
            }
          },

          _showChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Show the specified child by changing it's CSS, and call _onShow()/onShow() so
            //		it can do any updates it needs regarding loading href's etc.
            // returns:
            //		Promise that fires when page has finished showing, or true if there's no href
            var children = this.getChildren();
            page.isFirstChild = (page == children[0]);
            page.isLastChild = (page == children[children.length - 1]);
            page._set("selected", true);

            if (page._wrapper) { // false if not started yet
              domClass.replace(page._wrapper, "dijitVisible", "dijitHidden");
            }

            return (page._onShow && page._onShow()) || true;
          },

          _hideChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Hide the specified child by changing it's CSS, and call _onHide() so
            //		it's notified.
            page._set("selected", false);

            if (page._wrapper) { // false if not started yet
              domClass.replace(page._wrapper, "dijitHidden", "dijitVisible");
            }

            page.onHide && page.onHide();
          },

          closeChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Callback when user clicks the [X] to remove a page.
            //		If onClose() returns true then remove and destroy the child.
            // tags:
            //		private
            var remove = page.onClose && page.onClose(this, page);
            if (remove) {
              this.removeChild(page);
              // makes sure we can clean up executeScripts in ContentPane onUnLoad
              page.destroyRecursive();
            }
          },

          destroyDescendants: function ( /*Boolean*/ preserveDom) {
            this._descendantsBeingDestroyed = true;
            this.selectedChildWidget = undefined;
            array.forEach(this.getChildren(), function (child) {
              if (!preserveDom) {
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
    'dijit/layout/TabController': function () {
      define([
	"dojo/_base/declare", // declare
	"dojo/dom", // dom.setSelectable
	"dojo/dom-attr", // domAttr.attr
	"dojo/dom-class", // domClass.toggle
	"dojo/has",
	"dojo/i18n", // i18n.getLocalization
	"dojo/_base/lang", // lang.hitch lang.trim
	"./StackController",
	"../registry",
	"../Menu",
	"../MenuItem",
	"dojo/text!./templates/_TabButton.html",
	"dojo/i18n!../nls/common"
], function (declare, dom, domAttr, domClass, has, i18n, lang, StackController, registry, Menu, MenuItem, template) {

        // module:
        //		dijit/layout/TabController

        var TabButton = declare("dijit.layout._TabButton" + (has("dojo-bidi") ? "_NoBidi" : ""), StackController.StackButton, {
          // summary:
          //		A tab (the thing you click to select a pane).
          // description:
          //		Contains the title of the pane, and optionally a close-button to destroy the pane.
          //		This is an internal widget and should not be instantiated directly.
          // tags:
          //		private

          // baseClass: String
          //		The CSS class applied to the domNode.
          baseClass: "dijitTab",

          // Apply dijitTabCloseButtonHover when close button is hovered
          cssStateNodes: {
            closeNode: "dijitTabCloseButton"
          },

          templateString: template,

          // Button superclass maps name to a this.valueNode, but we don't have a this.valueNode attach point
          _setNameAttr: "focusNode",

          // Override _FormWidget.scrollOnFocus.
          // Don't scroll the whole tab container into view when the button is focused.
          scrollOnFocus: false,

          buildRendering: function () {
            this.inherited(arguments);

            dom.setSelectable(this.containerNode, false);
          },

          startup: function () {
            this.inherited(arguments);
            var n = this.domNode;

            // Required to give IE6 a kick, as it initially hides the
            // tabs until they are focused on.
            this.defer(function () {
              n.className = n.className;
            }, 1);
          },

          _setCloseButtonAttr: function ( /*Boolean*/ disp) {
            // summary:
            //		Hide/show close button
            this._set("closeButton", disp);
            domClass.toggle(this.domNode, "dijitClosable", disp);
            this.closeNode.style.display = disp ? "" : "none";
            if (disp) {
              var _nlsResources = i18n.getLocalization("dijit", "common");
              if (this.closeNode) {
                domAttr.set(this.closeNode, "title", _nlsResources.itemClose);
              }
            }
          },

          _setDisabledAttr: function ( /*Boolean*/ disabled) {
            // summary:
            //		Make tab selected/unselectable

            this.inherited(arguments);

            // Don't show tooltip for close button when tab is disabled
            if (this.closeNode) {
              if (disabled) {
                domAttr.remove(this.closeNode, "title");
              } else {
                var _nlsResources = i18n.getLocalization("dijit", "common");
                domAttr.set(this.closeNode, "title", _nlsResources.itemClose);
              }
            }
          },

          _setLabelAttr: function ( /*String*/ content) {
            // summary:
            //		Hook for set('label', ...) to work.
            // description:
            //		takes an HTML string.
            //		Inherited ToggleButton implementation will Set the label (text) of the button;
            //		Need to set the alt attribute of icon on tab buttons if no label displayed
            this.inherited(arguments);
            if (!this.showLabel && !this.params.title) {
              this.iconNode.alt = lang.trim(this.containerNode.innerText || this.containerNode.textContent || '');
            }
          }
        });

        if (has("dojo-bidi")) {
          TabButton = declare("dijit.layout._TabButton", TabButton, {
            _setLabelAttr: function ( /*String*/ content) {
              this.inherited(arguments);
              this.applyTextDir(this.iconNode, this.iconNode.alt);
            }
          });
        }

        var TabController = declare("dijit.layout.TabController", StackController, {
          // summary:
          //		Set of tabs (the things with titles and a close button, that you click to show a tab panel).
          //		Used internally by `dijit/layout/TabContainer`.
          // description:
          //		Lets the user select the currently shown pane in a TabContainer or StackContainer.
          //		TabController also monitors the TabContainer, and whenever a pane is
          //		added or deleted updates itself accordingly.
          // tags:
          //		private

          baseClass: "dijitTabController",

          templateString: "<div role='tablist' data-dojo-attach-event='onkeydown:onkeydown'></div>",

          // tabPosition: String
          //		Defines where tabs go relative to the content.
          //		"top", "bottom", "left-h", "right-h"
          tabPosition: "top",

          // buttonWidget: Constructor
          //		The tab widget to create to correspond to each page
          buttonWidget: TabButton,

          // buttonWidgetCloseClass: String
          //		Class of [x] close icon, used by event delegation code to tell when close button was clicked
          buttonWidgetCloseClass: "dijitTabCloseButton",

          postCreate: function () {
            this.inherited(arguments);

            // Setup a close menu to be shared between all the closable tabs (excluding disabled tabs)
            var closeMenu = new Menu({
              id: this.id + "_Menu",
              ownerDocument: this.ownerDocument,
              dir: this.dir,
              lang: this.lang,
              textDir: this.textDir,
              targetNodeIds: [this.domNode],
              selector: function (node) {
                return domClass.contains(node, "dijitClosable") && !domClass.contains(node, "dijitTabDisabled");
              }
            });
            this.own(closeMenu);

            var _nlsResources = i18n.getLocalization("dijit", "common"),
              controller = this;
            closeMenu.addChild(new MenuItem({
              label: _nlsResources.itemClose,
              ownerDocument: this.ownerDocument,
              dir: this.dir,
              lang: this.lang,
              textDir: this.textDir,
              onClick: function (evt) {
                var button = registry.byNode(this.getParent().currentTarget);
                controller.onCloseButtonClick(button.page);
              }
            }));
          }
        });

        TabController.TabButton = TabButton; // for monkey patching

        return TabController;
      });

    },
    'dijit/layout/StackController': function () {
      define([
	"dojo/_base/array", // array.forEach array.indexOf array.map
	"dojo/_base/declare", // declare
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/keys", // keys
	"dojo/_base/lang", // lang.getObject
	"dojo/on",
	"dojo/topic",
	"../focus", // focus.focus()
	"../registry", // registry.byId
	"../_Widget",
	"../_TemplatedMixin",
	"../_Container",
	"../form/ToggleButton",
	"dojo/touch", // for normalized click handling, see dojoClick property setting in postCreate()
	"dojo/i18n!../nls/common"
], function (array, declare, domClass, domConstruct, keys, lang, on, topic, focus, registry, _Widget, _TemplatedMixin, _Container, ToggleButton) {

        // module:
        //		dijit/layout/StackController

        var StackButton = declare("dijit.layout._StackButton", ToggleButton, {
          // summary:
          //		Internal widget used by StackContainer.
          // description:
          //		The button-like or tab-like object you click to select or delete a page
          // tags:
          //		private

          // Override _FormWidget.tabIndex.
          // StackContainer buttons are not in the tab order by default.
          // Probably we should be calling this.startupKeyNavChildren() instead.
          tabIndex: "-1",

          // closeButton: Boolean
          //		When true, display close button for this tab
          closeButton: false,

          _aria_attr: "aria-selected",

          buildRendering: function ( /*Event*/ evt) {
            this.inherited(arguments);
            (this.focusNode || this.domNode).setAttribute("role", "tab");
          }
        });


        var StackController = declare("dijit.layout.StackController", [_Widget, _TemplatedMixin, _Container], {
          // summary:
          //		Set of buttons to select a page in a `dijit/layout/StackContainer`
          // description:
          //		Monitors the specified StackContainer, and whenever a page is
          //		added, deleted, or selected, updates itself accordingly.

          baseClass: "dijitStackController",

          templateString: "<span role='tablist' data-dojo-attach-event='onkeydown'></span>",

          // containerId: [const] String
          //		The id of the page container that I point to
          containerId: "",

          // buttonWidget: [const] Constructor
          //		The button widget to create to correspond to each page
          buttonWidget: StackButton,

          // buttonWidgetCloseClass: String
          //		CSS class of [x] close icon, used by event delegation code to tell when close button was clicked
          buttonWidgetCloseClass: "dijitStackCloseButton",

          pane2button: function ( /*String*/ id) {
            // summary:
            //		Returns the button corresponding to the pane w/the given id.
            // tags:
            //		protected
            return registry.byId(this.id + "_" + id);
          },

          postCreate: function () {
            this.inherited(arguments);

            // Listen to notifications from StackContainer.  This is tricky because the StackContainer may not have
            // been created yet, so abstracting it through topics.
            // Note: for TabContainer we can do this through bubbled events instead of topics; maybe that's
            // all we support for 2.0?
            this.own(
              topic.subscribe(this.containerId + "-startup", lang.hitch(this, "onStartup")),
              topic.subscribe(this.containerId + "-addChild", lang.hitch(this, "onAddChild")),
              topic.subscribe(this.containerId + "-removeChild", lang.hitch(this, "onRemoveChild")),
              topic.subscribe(this.containerId + "-selectChild", lang.hitch(this, "onSelectChild")),
              topic.subscribe(this.containerId + "-containerKeyDown", lang.hitch(this, "onContainerKeyDown"))
            );

            // Listen for click events to select or close tabs.
            // No need to worry about ENTER/SPACE key handling: tabs are selected via left/right arrow keys,
            // and closed via shift-F10 (to show the close menu).
            // Also, add flag to use normalized click handling from dojo/touch
            this.containerNode.dojoClick = true;
            this.own(on(this.containerNode, 'click', lang.hitch(this, function (evt) {
              var button = registry.getEnclosingWidget(evt.target);
              if (button != this.containerNode && !button.disabled && button.page) {
                for (var target = evt.target; target !== this.containerNode; target = target.parentNode) {
                  if (domClass.contains(target, this.buttonWidgetCloseClass)) {
                    this.onCloseButtonClick(button.page);
                    break;
                  } else if (target == button.domNode) {
                    this.onButtonClick(button.page);
                    break;
                  }
                }
              }
            })));
          },

          onStartup: function ( /*Object*/ info) {
            // summary:
            //		Called after StackContainer has finished initializing
            // tags:
            //		private
            this.textDir = info.textDir;
            array.forEach(info.children, this.onAddChild, this);
            if (info.selected) {
              // Show button corresponding to selected pane (unless selected
              // is null because there are no panes)
              this.onSelectChild(info.selected);
            }

            // Reflect events like page title changes to tab buttons
            var containerNode = registry.byId(this.containerId).containerNode,
              pane2button = lang.hitch(this, "pane2button"),
              paneToButtonAttr = {
                "title": "label",
                "showtitle": "showLabel",
                "iconclass": "iconClass",
                "closable": "closeButton",
                "tooltip": "title",
                "disabled": "disabled",
                "textdir": "textdir"
              },
              connectFunc = function (attr, buttonAttr) {
                return on(containerNode, "attrmodified-" + attr, function (evt) {
                  var button = pane2button(evt.detail && evt.detail.widget && evt.detail.widget.id);
                  if (button) {
                    button.set(buttonAttr, evt.detail.newValue);
                  }
                });
              };
            for (var attr in paneToButtonAttr) {
              this.own(connectFunc(attr, paneToButtonAttr[attr]));
            }
          },

          destroy: function (preserveDom) {
            // Since the buttons are internal to the StackController widget, destroy() should remove them.
            // When #5796 is fixed for 2.0 can get rid of this function completely.
            this.destroyDescendants(preserveDom);
            this.inherited(arguments);
          },

          onAddChild: function ( /*dijit/_WidgetBase*/ page, /*Integer?*/ insertIndex) {
            // summary:
            //		Called whenever a page is added to the container.
            //		Create button corresponding to the page.
            // tags:
            //		private

            // create an instance of the button widget
            // (remove typeof buttonWidget == string support in 2.0)
            var Cls = lang.isString(this.buttonWidget) ? lang.getObject(this.buttonWidget) : this.buttonWidget;
            var button = new Cls({
              id: this.id + "_" + page.id,
              name: this.id + "_" + page.id, // note: must match id used in pane2button()
              label: page.title,
              disabled: page.disabled,
              ownerDocument: this.ownerDocument,
              dir: page.dir,
              lang: page.lang,
              textDir: page.textDir || this.textDir,
              showLabel: page.showTitle,
              iconClass: page.iconClass,
              closeButton: page.closable,
              title: page.tooltip,
              page: page
            });

            this.addChild(button, insertIndex);
            page.controlButton = button; // this value might be overwritten if two tabs point to same container
            if (!this._currentChild) {
              // If this is the first child then StackContainer will soon publish that it's selected,
              // but before that StackContainer calls layout(), and before layout() is called the
              // StackController needs to have the proper height... which means that the button needs
              // to be marked as selected now.   See test_TabContainer_CSS.html for test.
              this.onSelectChild(page);
            }

            // Add this StackController button to the list of things that labels that StackContainer pane.
            // Also, if there's an aria-labelledby parameter for the pane, then the aria-label parameter is unneeded.
            var labelledby = page._wrapper.getAttribute("aria-labelledby") ?
              page._wrapper.getAttribute("aria-labelledby") + " " + button.id : button.id;
            page._wrapper.removeAttribute("aria-label");
            page._wrapper.setAttribute("aria-labelledby", labelledby);
          },

          onRemoveChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Called whenever a page is removed from the container.
            //		Remove the button corresponding to the page.
            // tags:
            //		private

            if (this._currentChild === page) {
              this._currentChild = null;
            }

            var button = this.pane2button(page.id);
            if (button) {
              this.removeChild(button);
              button.destroy();
            }
            delete page.controlButton;
          },

          onSelectChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Called when a page has been selected in the StackContainer, either by me or by another StackController
            // tags:
            //		private

            if (!page) {
              return;
            }

            if (this._currentChild) {
              var oldButton = this.pane2button(this._currentChild.id);
              oldButton.set('checked', false);
              oldButton.focusNode.setAttribute("tabIndex", "-1");
            }

            var newButton = this.pane2button(page.id);
            newButton.set('checked', true);
            this._currentChild = page;
            newButton.focusNode.setAttribute("tabIndex", "0");
            var container = registry.byId(this.containerId);
          },

          onButtonClick: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Called whenever one of my child buttons is pressed in an attempt to select a page
            // tags:
            //		private

            var button = this.pane2button(page.id);

            // For TabContainer where the tabs are <span>, need to set focus explicitly when left/right arrow
            focus.focus(button.focusNode);

            if (this._currentChild && this._currentChild.id === page.id) {
              //In case the user clicked the checked button, keep it in the checked state because it remains to be the selected stack page.
              button.set('checked', true);
            }
            var container = registry.byId(this.containerId);
            container.selectChild(page);
          },

          onCloseButtonClick: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Called whenever one of my child buttons [X] is pressed in an attempt to close a page
            // tags:
            //		private

            var container = registry.byId(this.containerId);
            container.closeChild(page);
            if (this._currentChild) {
              var b = this.pane2button(this._currentChild.id);
              if (b) {
                focus.focus(b.focusNode || b.domNode);
              }
            }
          },

          // TODO: this is a bit redundant with forward, back api in StackContainer
          adjacent: function ( /*Boolean*/ forward) {
            // summary:
            //		Helper for onkeydown to find next/previous button
            // tags:
            //		private

            if (!this.isLeftToRight() && (!this.tabPosition || /top|bottom/.test(this.tabPosition))) {
              forward = !forward;
            }
            // find currently focused button in children array
            var children = this.getChildren();
            var idx = array.indexOf(children, this.pane2button(this._currentChild.id)),
              current = children[idx];

            // Pick next/previous non-disabled button to focus on.   If we get back to the original button it means
            // that all buttons must be disabled, so return current child to avoid an infinite loop.
            var child;
            do {
              idx = (idx + (forward ? 1 : children.length - 1)) % children.length;
              child = children[idx];
            } while (child.disabled && child != current);

            return child; // dijit/_WidgetBase
          },

          onkeydown: function ( /*Event*/ e, /*Boolean?*/ fromContainer) {
            // summary:
            //		Handle keystrokes on the page list, for advancing to next/previous button
            //		and closing the current page if the page is closable.
            // tags:
            //		private

            if (this.disabled || e.altKey) {
              return;
            }
            var forward = null;
            if (e.ctrlKey || !e._djpage) {
              switch (e.keyCode) {
                case keys.LEFT_ARROW:
                case keys.UP_ARROW:
                  if (!e._djpage) {
                    forward = false;
                  }
                  break;
                case keys.PAGE_UP:
                  if (e.ctrlKey) {
                    forward = false;
                  }
                  break;
                case keys.RIGHT_ARROW:
                case keys.DOWN_ARROW:
                  if (!e._djpage) {
                    forward = true;
                  }
                  break;
                case keys.PAGE_DOWN:
                  if (e.ctrlKey) {
                    forward = true;
                  }
                  break;
                case keys.HOME:
                  // Navigate to first non-disabled child
                  var children = this.getChildren();
                  for (var idx = 0; idx < children.length; idx++) {
                    var child = children[idx];
                    if (!child.disabled) {
                      this.onButtonClick(child.page);
                      break;
                    }
                  }
                  e.stopPropagation();
                  e.preventDefault();
                  break;
                case keys.END:
                  // Navigate to last non-disabled child
                  var children = this.getChildren();
                  for (var idx = children.length - 1; idx >= 0; idx--) {
                    var child = children[idx];
                    if (!child.disabled) {
                      this.onButtonClick(child.page);
                      break;
                    }
                  }
                  e.stopPropagation();
                  e.preventDefault();
                  break;
                case keys.DELETE:
                case "W".charCodeAt(0): // ctrl-W
                  if (this._currentChild.closable &&
                    (e.keyCode == keys.DELETE || e.ctrlKey)) {
                    this.onCloseButtonClick(this._currentChild);

                    // avoid browser tab closing
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  break;
                case keys.TAB:
                  if (e.ctrlKey) {
                    this.onButtonClick(this.adjacent(!e.shiftKey).page);
                    e.stopPropagation();
                    e.preventDefault();
                  }
                  break;
              }
              // handle next/previous page navigation (left/right arrow, etc.)
              if (forward !== null) {
                this.onButtonClick(this.adjacent(forward).page);
                e.stopPropagation();
                e.preventDefault();
              }
            }
          },

          onContainerKeyDown: function ( /*Object*/ info) {
            // summary:
            //		Called when there was a keydown on the container
            // tags:
            //		private
            info.e._djpage = info.page;
            this.onkeydown(info.e);
          }
        });

        StackController.StackButton = StackButton; // for monkey patching

        return StackController;
      });

    },
    'dijit/layout/ScrollingTabController': function () {
      define([
	"dojo/_base/array", // array.forEach
	"dojo/_base/declare", // declare
	"dojo/dom-class", // domClass.add domClass.contains
	"dojo/dom-geometry", // domGeometry.contentBox
	"dojo/dom-style", // domStyle.style
	"dojo/_base/fx", // Animation
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"dojo/query", // query
	"dojo/sniff", // has("ie"), has("trident"), has("edge"), has("webkit"), has("quirks")
	"../registry", // registry.byId()
	"dojo/text!./templates/ScrollingTabController.html",
	"dojo/text!./templates/_ScrollingTabControllerButton.html",
	"./TabController",
	"./utils", // marginBox2contextBox, layoutChildren
	"../_WidgetsInTemplateMixin",
	"../Menu",
	"../MenuItem",
	"../form/Button",
	"../_HasDropDown",
	"dojo/NodeList-dom", // NodeList.style
	"../a11yclick" // template uses ondijitclick (not for keyboard support, but for responsive touch support)
], function (array, declare, domClass, domGeometry, domStyle, fx, lang, on, query, has,
        registry, tabControllerTemplate, buttonTemplate, TabController, layoutUtils, _WidgetsInTemplateMixin,
        Menu, MenuItem, Button, _HasDropDown) {

        // module:
        //		dijit/layout/ScrollingTabController

        var ScrollingTabController = declare("dijit.layout.ScrollingTabController", [TabController, _WidgetsInTemplateMixin], {
          // summary:
          //		Set of tabs with left/right arrow keys and a menu to switch between tabs not
          //		all fitting on a single row.
          //		Works only for horizontal tabs (either above or below the content, not to the left
          //		or right).
          // tags:
          //		private

          baseClass: "dijitTabController dijitScrollingTabController",

          templateString: tabControllerTemplate,

          // useMenu: [const] Boolean
          //		True if a menu should be used to select tabs when they are too
          //		wide to fit the TabContainer, false otherwise.
          useMenu: true,

          // useSlider: [const] Boolean
          //		True if a slider should be used to select tabs when they are too
          //		wide to fit the TabContainer, false otherwise.
          useSlider: true,

          // tabStripClass: [const] String
          //		The css class to apply to the tab strip, if it is visible.
          tabStripClass: "",

          // _minScroll: Number
          //		The distance in pixels from the edge of the tab strip which,
          //		if a scroll animation is less than, forces the scroll to
          //		go all the way to the left/right.
          _minScroll: 5,

          // Override default behavior mapping class to DOMNode
          _setClassAttr: {
            node: "containerNode",
            type: "class"
          },

          buildRendering: function () {
            this.inherited(arguments);
            var n = this.domNode;

            this.scrollNode = this.tablistWrapper;
            this._initButtons();

            if (!this.tabStripClass) {
              this.tabStripClass = "dijitTabContainer" +
                this.tabPosition.charAt(0).toUpperCase() +
                this.tabPosition.substr(1).replace(/-.*/, "") +
                "None";
              domClass.add(n, "tabStrip-disabled")
            }

            domClass.add(this.tablistWrapper, this.tabStripClass);
          },

          onStartup: function () {
            this.inherited(arguments);

            // TabController is hidden until it finishes drawing, to give
            // a less visually jumpy instantiation.   When it's finished, set visibility to ""
            // to that the tabs are hidden/shown depending on the container's visibility setting.
            domStyle.set(this.domNode, "visibility", "");
            this._postStartup = true;

            // changes to the tab button label or iconClass will have changed the width of the
            // buttons, so do a resize
            this.own(on(this.containerNode, "attrmodified-label, attrmodified-iconclass", lang.hitch(this, function (evt) {
              if (this._dim) {
                this.resize(this._dim);
              }
            })));
          },

          onAddChild: function (page, insertIndex) {
            this.inherited(arguments);

            // Increment the width of the wrapper when a tab is added
            // This makes sure that the buttons never wrap.
            // The value 200 is chosen as it should be bigger than most
            // Tab button widths.
            domStyle.set(this.containerNode, "width",
              (domStyle.get(this.containerNode, "width") + 250) + "px");
          },

          onRemoveChild: function (page, insertIndex) {
            // null out _selectedTab because we are about to delete that dom node
            var button = this.pane2button(page.id);
            if (this._selectedTab === button.domNode) {
              this._selectedTab = null;
            }

            this.inherited(arguments);
          },

          _initButtons: function () {
            // summary:
            //		Creates the buttons used to scroll to view tabs that
            //		may not be visible if the TabContainer is too narrow.

            // Make a list of the buttons to display when the tab labels become
            // wider than the TabContainer, and hide the other buttons.
            // Also gets the total width of the displayed buttons.
            this._btnWidth = 0;
            this._buttons = query("> .tabStripButton", this.domNode).filter(function (btn) {
              if ((this.useMenu && btn == this._menuBtn.domNode) ||
                (this.useSlider && (btn == this._rightBtn.domNode || btn == this._leftBtn.domNode))) {
                this._btnWidth += domGeometry.getMarginSize(btn).w;
                return true;
              } else {
                domStyle.set(btn, "display", "none");
                return false;
              }
            }, this);
          },

          _getTabsWidth: function () {
            var children = this.getChildren();
            if (children.length) {
              var leftTab = children[this.isLeftToRight() ? 0 : children.length - 1].domNode,
                rightTab = children[this.isLeftToRight() ? children.length - 1 : 0].domNode;
              return rightTab.offsetLeft + rightTab.offsetWidth - leftTab.offsetLeft;
            } else {
              return 0;
            }
          },

          _enableBtn: function (width) {
            // summary:
            //		Determines if the tabs are wider than the width of the TabContainer, and
            //		thus that we need to display left/right/menu navigation buttons.
            var tabsWidth = this._getTabsWidth();
            width = width || domStyle.get(this.scrollNode, "width");
            return tabsWidth > 0 && width < tabsWidth;
          },

          resize: function (dim) {
            // summary:
            //		Hides or displays the buttons used to scroll the tab list and launch the menu
            //		that selects tabs.

            // Save the dimensions to be used when a child is renamed.
            this._dim = dim;

            // Set my height to be my natural height (tall enough for one row of tab labels),
            // and my content-box width based on margin-box width specified in dim parameter.
            // But first reset scrollNode.height in case it was set by layoutChildren() call
            // in a previous run of this method.
            this.scrollNode.style.height = "auto";
            var cb = this._contentBox = layoutUtils.marginBox2contentBox(this.domNode, {
              h: 0,
              w: dim.w
            });
            cb.h = this.scrollNode.offsetHeight;
            domGeometry.setContentSize(this.domNode, cb);

            // Show/hide the left/right/menu navigation buttons depending on whether or not they
            // are needed.
            var enable = this._enableBtn(this._contentBox.w);
            this._buttons.style("display", enable ? "" : "none");

            // Position and size the navigation buttons and the tablist
            this._leftBtn.region = "left";
            this._rightBtn.region = "right";
            this._menuBtn.region = this.isLeftToRight() ? "right" : "left";
            layoutUtils.layoutChildren(this.domNode, this._contentBox, [this._menuBtn, this._leftBtn, this._rightBtn, {
              domNode: this.scrollNode,
              region: "center"
            }]);

            // set proper scroll so that selected tab is visible
            if (this._selectedTab) {
              if (this._anim && this._anim.status() == "playing") {
                this._anim.stop();
              }
              this.scrollNode.scrollLeft = this._convertToScrollLeft(this._getScrollForSelectedTab());
            }

            // Enable/disabled left right buttons depending on whether or not user can scroll to left or right
            this._setButtonClass(this._getScroll());

            this._postResize = true;

            // Return my size so layoutChildren() can use it.
            // Also avoids IE9 layout glitch on browser resize when scroll buttons present
            return {
              h: this._contentBox.h,
              w: dim.w
            };
          },

          _getScroll: function () {
            // summary:
            //		Returns the current scroll of the tabs where 0 means
            //		"scrolled all the way to the left" and some positive number, based on #
            //		of pixels of possible scroll (ex: 1000) means "scrolled all the way to the right"
            return (this.isLeftToRight() || has("ie") < 8 || (has("trident") && has("quirks")) || has("webkit")) ?
              this.scrollNode.scrollLeft :
              domStyle.get(this.containerNode, "width") - domStyle.get(this.scrollNode, "width") +
              (has("trident") || has("edge") ? -1 : 1) * this.scrollNode.scrollLeft;
          },

          _convertToScrollLeft: function (val) {
            // summary:
            //		Given a scroll value where 0 means "scrolled all the way to the left"
            //		and some positive number, based on # of pixels of possible scroll (ex: 1000)
            //		means "scrolled all the way to the right", return value to set this.scrollNode.scrollLeft
            //		to achieve that scroll.
            //
            //		This method is to adjust for RTL funniness in various browsers and versions.
            if (this.isLeftToRight() || has("ie") < 8 || (has("trident") && has("quirks")) || has("webkit")) {
              return val;
            } else {
              var maxScroll = domStyle.get(this.containerNode, "width") - domStyle.get(this.scrollNode, "width");
              return (has("trident") || has("edge") ? -1 : 1) * (val - maxScroll);
            }
          },

          onSelectChild: function ( /*dijit/_WidgetBase*/ page) {
            // summary:
            //		Smoothly scrolls to a tab when it is selected.

            var tab = this.pane2button(page.id);
            if (!tab) {
              return;
            }

            var node = tab.domNode;

            // Save the selection
            if (node != this._selectedTab) {
              this._selectedTab = node;

              // Scroll to the selected tab, except on startup, when scrolling is handled in resize()
              if (this._postResize) {
                var sl = this._getScroll();

                if (sl > node.offsetLeft ||
                  sl + domStyle.get(this.scrollNode, "width") <
                  node.offsetLeft + domStyle.get(node, "width")) {
                  this.createSmoothScroll().play();
                }
              }
            }

            this.inherited(arguments);
          },

          _getScrollBounds: function () {
            // summary:
            //		Returns the minimum and maximum scroll setting to show the leftmost and rightmost
            //		tabs (respectively)
            var children = this.getChildren(),
              scrollNodeWidth = domStyle.get(this.scrollNode, "width"), // about 500px
              containerWidth = domStyle.get(this.containerNode, "width"), // 50,000px
              maxPossibleScroll = containerWidth - scrollNodeWidth, // scrolling until right edge of containerNode visible
              tabsWidth = this._getTabsWidth();

            if (children.length && tabsWidth > scrollNodeWidth) {
              // Scrolling should happen
              return {
                min: this.isLeftToRight() ? 0 : children[children.length - 1].domNode.offsetLeft,
                max: this.isLeftToRight() ?
                  (children[children.length - 1].domNode.offsetLeft + children[children.length - 1].domNode.offsetWidth) - scrollNodeWidth : maxPossibleScroll
              };
            } else {
              // No scrolling needed, all tabs visible, we stay either scrolled to far left or far right (depending on dir)
              var onlyScrollPosition = this.isLeftToRight() ? 0 : maxPossibleScroll;
              return {
                min: onlyScrollPosition,
                max: onlyScrollPosition
              };
            }
          },

          _getScrollForSelectedTab: function () {
            // summary:
            //		Returns the scroll value setting so that the selected tab
            //		will appear in the center
            var w = this.scrollNode,
              n = this._selectedTab,
              scrollNodeWidth = domStyle.get(this.scrollNode, "width"),
              scrollBounds = this._getScrollBounds();

            // TODO: scroll minimal amount (to either right or left) so that
            // selected tab is fully visible, and just return if it's already visible?
            var pos = (n.offsetLeft + domStyle.get(n, "width") / 2) - scrollNodeWidth / 2;
            pos = Math.min(Math.max(pos, scrollBounds.min), scrollBounds.max);

            // TODO:
            // If scrolling close to the left side or right side, scroll
            // all the way to the left or right.  See this._minScroll.
            // (But need to make sure that doesn't scroll the tab out of view...)
            return pos;
          },

          createSmoothScroll: function (x) {
            // summary:
            //		Creates a dojo._Animation object that smoothly scrolls the tab list
            //		either to a fixed horizontal pixel value, or to the selected tab.
            // description:
            //		If an number argument is passed to the function, that horizontal
            //		pixel position is scrolled to.  Otherwise the currently selected
            //		tab is scrolled to.
            // x: Integer?
            //		An optional pixel value to scroll to, indicating distance from left.

            // Calculate position to scroll to
            if (arguments.length > 0) {
              // position specified by caller, just make sure it's within bounds
              var scrollBounds = this._getScrollBounds();
              x = Math.min(Math.max(x, scrollBounds.min), scrollBounds.max);
            } else {
              // scroll to center the current tab
              x = this._getScrollForSelectedTab();
            }

            if (this._anim && this._anim.status() == "playing") {
              this._anim.stop();
            }

            var self = this,
              w = this.scrollNode,
              anim = new fx.Animation({
                beforeBegin: function () {
                  if (this.curve) {
                    delete this.curve;
                  }
                  var oldS = w.scrollLeft,
                    newS = self._convertToScrollLeft(x);
                  anim.curve = new fx._Line(oldS, newS);
                },
                onAnimate: function (val) {
                  w.scrollLeft = val;
                }
              });
            this._anim = anim;

            // Disable/enable left/right buttons according to new scroll position
            this._setButtonClass(x);

            return anim; // dojo/_base/fx/Animation
          },

          _getBtnNode: function ( /*Event*/ e) {
            // summary:
            //		Gets a button DOM node from a mouse click event.
            // e:
            //		The mouse click event.
            var n = e.target;
            while (n && !domClass.contains(n, "tabStripButton")) {
              n = n.parentNode;
            }
            return n;
          },

          doSlideRight: function ( /*Event*/ e) {
            // summary:
            //		Scrolls the menu to the right.
            // e:
            //		The mouse click event.
            this.doSlide(1, this._getBtnNode(e));
          },

          doSlideLeft: function ( /*Event*/ e) {
            // summary:
            //		Scrolls the menu to the left.
            // e:
            //		The mouse click event.
            this.doSlide(-1, this._getBtnNode(e));
          },

          doSlide: function ( /*Number*/ direction, /*DomNode*/ node) {
            // summary:
            //		Scrolls the tab list to the left or right by 75% of the widget width.
            // direction:
            //		If the direction is 1, the widget scrolls to the right, if it is -1,
            //		it scrolls to the left.

            if (node && domClass.contains(node, "dijitTabDisabled")) {
              return;
            }

            var sWidth = domStyle.get(this.scrollNode, "width");
            var d = (sWidth * 0.75) * direction;

            var to = this._getScroll() + d;

            this._setButtonClass(to);

            this.createSmoothScroll(to).play();
          },

          _setButtonClass: function ( /*Number*/ scroll) {
            // summary:
            //		Disables the left scroll button if the tabs are scrolled all the way to the left,
            //		or the right scroll button in the opposite case.
            // scroll: Integer
            //		amount of horizontal scroll

            var scrollBounds = this._getScrollBounds();
            this._leftBtn.set("disabled", scroll <= scrollBounds.min);
            this._rightBtn.set("disabled", scroll >= scrollBounds.max);
          }
        });


        var ScrollingTabControllerButtonMixin = declare("dijit.layout._ScrollingTabControllerButtonMixin", null, {
          baseClass: "dijitTab tabStripButton",

          templateString: buttonTemplate,

          // Override inherited tabIndex: 0 from dijit/form/Button, because user shouldn't be
          // able to tab to the left/right/menu buttons
          tabIndex: "",

          // Similarly, override FormWidget.isFocusable() because clicking a button shouldn't focus it
          // either (this override avoids focus() call in FormWidget.js)
          isFocusable: function () {
            return false;
          }
        });

        // Class used in template
        declare("dijit.layout._ScrollingTabControllerButton", [Button, ScrollingTabControllerButtonMixin]);

        // Class used in template
        declare("dijit.layout._ScrollingTabControllerMenuButton", [Button, _HasDropDown, ScrollingTabControllerButtonMixin], {
          // id of the TabContainer itself
          containerId: "",

          // -1 so user can't tab into the button, but so that button can still be focused programatically.
          // Because need to move focus to the button (or somewhere) before the menu is hidden or IE6 will crash.
          tabIndex: "-1",

          isLoaded: function () {
            // recreate menu every time, in case the TabContainer's list of children (or their icons/labels) have changed
            return false;
          },

          loadDropDown: function (callback) {
            this.dropDown = new Menu({
              id: this.containerId + "_menu",
              ownerDocument: this.ownerDocument,
              dir: this.dir,
              lang: this.lang,
              textDir: this.textDir
            });
            var container = registry.byId(this.containerId);
            array.forEach(container.getChildren(), function (page) {
              var menuItem = new MenuItem({
                id: page.id + "_stcMi",
                label: page.title,
                iconClass: page.iconClass,
                disabled: page.disabled,
                ownerDocument: this.ownerDocument,
                dir: page.dir,
                lang: page.lang,
                textDir: page.textDir || container.textDir,
                onClick: function () {
                  container.selectChild(page);
                }
              });
              this.dropDown.addChild(menuItem);
            }, this);
            callback();
          },

          closeDropDown: function ( /*Boolean*/ focus) {
            this.inherited(arguments);
            if (this.dropDown) {
              this._popupStateNode.removeAttribute("aria-owns"); // remove ref to node that we are about to delete
              this.dropDown.destroyRecursive();
              delete this.dropDown;
            }
          }
        });

        return ScrollingTabController;
      });

    },

    'JBrowse/Plugin': function () {
      define([
           'dojo/_base/declare',
           'JBrowse/Component'
       ],
        function (declare, Component) {
          return declare(Component, {
            constructor: function (args) {
              this.name = args.name;
              this.cssLoaded = args.cssLoaded;
              this._finalizeConfig(args.config);
            },

            _defaultConfig: function () {
              return {
                baseUrl: '/plugins/' + this.name
              };
            }
          });
        });
    },
    'url:dijit/layout/templates/TabContainer.html': "<div class=\"dijitTabContainer\">\n\t<div class=\"dijitTabListWrapper\" data-dojo-attach-point=\"tablistNode\"></div>\n\t<div data-dojo-attach-point=\"tablistSpacer\" class=\"dijitTabSpacer ${baseClass}-spacer\"></div>\n\t<div class=\"dijitTabPaneWrapper ${baseClass}-container\" data-dojo-attach-point=\"containerNode\"></div>\n</div>\n",
    'url:dijit/layout/templates/_TabButton.html': "<div role=\"presentation\" data-dojo-attach-point=\"titleNode,innerDiv,tabContent\" class=\"dijitTabInner dijitTabContent\">\n\t<span role=\"presentation\" class=\"dijitInline dijitIcon dijitTabButtonIcon\" data-dojo-attach-point=\"iconNode\"></span>\n\t<span data-dojo-attach-point='containerNode,focusNode' class='tabLabel'></span>\n\t<span class=\"dijitInline dijitTabCloseButton dijitTabCloseIcon\" data-dojo-attach-point='closeNode'\n\t\t  role=\"presentation\">\n\t\t<span data-dojo-attach-point='closeText' class='dijitTabCloseText'>[x]</span\n\t\t\t\t></span>\n</div>\n",
    'url:dijit/layout/templates/ScrollingTabController.html': "<div class=\"dijitTabListContainer-${tabPosition}\" style=\"visibility:hidden\">\n\t<div data-dojo-type=\"dijit.layout._ScrollingTabControllerMenuButton\"\n\t\t class=\"tabStripButton-${tabPosition}\"\n\t\t id=\"${id}_menuBtn\"\n\t\t data-dojo-props=\"containerId: '${containerId}', iconClass: 'dijitTabStripMenuIcon',\n\t\t\t\t\tdropDownPosition: ['below-alt', 'above-alt']\"\n\t\t data-dojo-attach-point=\"_menuBtn\" showLabel=\"false\" title=\"\">&#9660;</div>\n\t<div data-dojo-type=\"dijit.layout._ScrollingTabControllerButton\"\n\t\t class=\"tabStripButton-${tabPosition}\"\n\t\t id=\"${id}_leftBtn\"\n\t\t data-dojo-props=\"iconClass:'dijitTabStripSlideLeftIcon', showLabel:false, title:''\"\n\t\t data-dojo-attach-point=\"_leftBtn\" data-dojo-attach-event=\"onClick: doSlideLeft\">&#9664;</div>\n\t<div data-dojo-type=\"dijit.layout._ScrollingTabControllerButton\"\n\t\t class=\"tabStripButton-${tabPosition}\"\n\t\t id=\"${id}_rightBtn\"\n\t\t data-dojo-props=\"iconClass:'dijitTabStripSlideRightIcon', showLabel:false, title:''\"\n\t\t data-dojo-attach-point=\"_rightBtn\" data-dojo-attach-event=\"onClick: doSlideRight\">&#9654;</div>\n\t<div class='dijitTabListWrapper' data-dojo-attach-point='tablistWrapper'>\n\t\t<div role='tablist' data-dojo-attach-event='onkeydown:onkeydown'\n\t\t\t data-dojo-attach-point='containerNode' class='nowrapTabStrip'></div>\n\t</div>\n</div>",
    'url:dijit/layout/templates/_ScrollingTabControllerButton.html': "<div data-dojo-attach-event=\"ondijitclick:_onClick\" class=\"dijitTabInnerDiv dijitTabContent dijitButtonContents\"  data-dojo-attach-point=\"focusNode\" role=\"button\">\n\t<span role=\"presentation\" class=\"dijitInline dijitTabStripIcon\" data-dojo-attach-point=\"iconNode\"></span>\n\t<span data-dojo-attach-point=\"containerNode,titleNode\" class=\"dijitButtonText\"></span>\n</div>"
  }
});
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom',
    "dojo/dom-attr",
    'dojo/dom-construct',
    'dijit/form/Button',
  'dijit/registry',
    'ScreenShotPlugin/View/Dialog/ScreenShotDialog',
    'ScreenShotPlugin/EncodeDecodeUtil',
    'JBrowse/Plugin',
    "JBrowse/Browser"
],
  function (
    declare,
    lang,
    array,
    dom,
    domAttr,
    domConstr,
    dijitButton,
     dijitRegistry,
    ScreenShotDialog,
    Util,
    JBrowsePlugin,
    Browser
  ) {

    return declare(JBrowsePlugin, {
      constructor: function (args) {
        var baseUrl = this._defaultConfig().baseUrl;
        var browser = this.browser;
        this.isScreenshot = false;
        console.log('ScreenShotPlugin starting');
        this.config.version = '1.6.7';

        // PhantomJS Username
        this.config.apiKey = 'a-demo-key-with-low-quota-per-ip-address';
        if (args.apiKey !== undefined)
          this.config.apiKey = args.apiKey;
        // Debug mode (does not make call to PhantomJS)
        this.config.debug = false;
        if (args.debugMode !== undefined)
          this.config.debug = args.debugMode;
        this.config.dialog = false;
        if(args.dialogMode !== undefined)
          this.config.dialog = args.dialogMode;
        // Include option for Canvas Features -> HTML features
        this.config.htmlFeatures = {
          general: false
        };
        if (args.htmlFeatures !== undefined)
          this.config.htmlFeatures = args.htmlFeatures;
        var thisB = this;

        // other plugins
        browser.afterMilestone('initPlugins', function () {
          thisB._determinePluginSupport(args);
          // check for screenshot query parameters
          if (browser.config.queryParams.hasOwnProperty('screenshot')) {
            thisB.isScreenshot = true;
            var encoded = browser.config.queryParams.screenshot;
            var trackList = browser.config.queryParams.tracks;
            var decoded = Util.decode(encoded, trackList);
            // apply
            thisB._applyScreenshotConfig(decoded);
            browser.afterMilestone('loadConfig', function () {
              thisB._applyMethSmRNAConfig(decoded.general.methylation, decoded.general.smallrna);
              thisB._applyTracksConfig(decoded.tracks);
            });
          }
        });

        browser.afterMilestone('initView', function () {
          // create screenshot button (possibly tools menu)
          var menuBar = browser.menuBar;

          function showScreenShotDialog() {
            new ScreenShotDialog({
              requestUrl: thisB._getPhantomJSUrl(),
              browser: browser,
              config: thisB.config
            }).show();
          }

          if (browser.config.show_menu && (thisB.isScreenshot === false || thisB.config.dialog)) {
            var button = new dijitButton({
              className: 'screenshot-button',
              innerHTML: 'Screen Shot',
              id: 'screenshot-button',
              title: 'take screen shot of browser',
              onClick: showScreenShotDialog
            });
            menuBar.appendChild(button.domNode);
          }
          // shortcut key
          browser.setGlobalKeyboardShortcut('s', showScreenShotDialog);
        });
        browser.afterMilestone('completely initialized', function(){
          if (thisB.config.dialog){
            if(browser.view.tracks.length < 1){
              setTimeout(function(){
            var button = dijitRegistry.byId('screenshot-button');
            button.onClick();
                }, 700)
            }
          }
        })
      }, // end constructor

      _getPhantomJSUrl: function () {
        return 'https://phantomjscloud.com/api/browser/v2/';
      },

      _determinePluginSupport: function (args) {
        var config = this.config;
        var browser = this.browser;
        /* METHYLATION PLUGIN */
        config.methylPlugin = false;
        // test that browser has the plugin
        if (browser.plugins.hasOwnProperty('MethylationPlugin')) {
          config.methylPlugin = true;
          // test version for html features -> 3.1.0
          config.htmlFeatures['methyl'] = (browser.plugins.MethylationPlugin.config.hasOwnProperty('version')) ? (browser.plugins.MethylationPlugin.config.version >= '3.1.0') : false;
        }

        /* SMALL RNA PLUGIN */
        config.smrnaPlugin = false;
        if (browser.plugins.hasOwnProperty('SmallRNAPlugin')) {
          config.smrnaPlugin = true;
          // test version for html features -> "1.4.0"
          config.htmlFeatures['smrna'] = (browser.plugins.SmallRNAPlugin.config.hasOwnProperty('version')) ? (browser.plugins.SmallRNAPlugin.config.version >= '1.4.0') : false;
        }

        /* STRANDED XYPLOT PLUGIN */
        config.strandedPlugin = false;
        if (browser.plugins.hasOwnProperty('StrandedPlotPlugin')) {
          config.strandedPlugin = true;
          // test version for html features -> "1.1.0"
          config.htmlFeatures['strandedplot'] = (browser.plugins.StrandedPlotPlugin.config.hasOwnProperty('version')) ? (browser.plugins.StrandedPlotPlugin.config.version >= '1.1.0') : false;
        }

        /* NUCLEOTIDE DENSITY PLUGIN */
        config.nucDensPlugin = false;
        if(browser.plugins.hasOwnProperty('NucleotideDensityPlugin')){
          config.nucDensPlugin = true;
          config.htmlFeatures['nucdens'] = (browser.plugins.NucleotideDensityPlugin.config.hasOwnProperty('version')) ? (browser.plugins.NucleotideDensityPlugin.config.version >= '1.1.0') : false;
        }

        /* WIGGLE SVG PLOT PLUGIN */
        config.wiggleSVGPlugin = false;
        if (browser.plugins.hasOwnProperty('WiggleSVGPlotPlugin')) {
          config.wiggleSVGPlugin = true;
          config.htmlFeatures['wiggle'] = true;
        }

        // this is a true or false value since we don't actually need the path
        // just need to know if it exists
        config.seqViewsPlugin = browser.plugins.hasOwnProperty('SeqViewsPlugin');
        if (args.seqViewsPlugin !== undefined)
          config.seqViewsPlugin = args.seqViewsPlugin;
      },

      _applyScreenshotConfig: function (params) {
        // params have general and track-specific
        // params.general have basic, methylation, view, labels
        // Note: this.browser.config gets overwritten with each mixin
        lang.mixin(this.browser.config, params.general.basic);
        lang.mixin(this.browser.config.view, params.general.view);
      },

      _applyMethSmRNAConfig: function (mParams, sParams) {
        var thisB = this;
        var s, m, t;
        var mmix = {};
        for (m in mParams) {
          if (mParams[m] === false) {
            mmix['show' + m] = false;
          }
        }
        var smix = {};
        for (s in sParams) {
          if (sParams[s] === true) {
            smix['hide' + s] = true;
          }
        }
        var tracks = lang.clone(thisB.browser.trackConfigsByName);
        for (t in tracks) {
          if (thisB._testMethylation(tracks[t].type)) {
            lang.mixin(thisB.browser.trackConfigsByName[t], mmix);
          } else if (thisB._testSmallRNA(tracks[t].type)) {
            lang.mixin(thisB.browser.trackConfigsByName[t], smix);
          }
        }

      },

      _applyMethylationConfig: function (params) {
        var thisB = this;
        // check for methylation plugin
        if (thisB.browser.plugins.hasOwnProperty(thisB.config.methylPlugin)) {
          var m, t;
          var tracks = lang.clone(thisB.browser.trackConfigsByName);
          //console.log('methylation tracks');
          for (m in params) {
            if (params[m] === false) {
              var mix = {};
              mix['show' + m] = false;
              for (t in tracks) {
                if (thisB._testMethylation(tracks[t].type)) {
                  lang.mixin(thisB.browser.trackConfigsByName[t], mix);
                }
              }
              // TODO: add command to disable toolbar buttons if necessary
            } // end if params[m] === false
          } // end for m in params
        } // end if MethylationPlugin
      },

      _testMethylation: function (trackType) {
        if (trackType === undefined || trackType === null)
          return false;
        return ((/(Methyl.*Plot$)/.test(trackType)));
      },

      _applySmallRNAConfig: function (params) {

        var thisB = this;
        // check for small rna plugin
        //if(thisB.browser.plugins.hasOwnProperty(thisB.config.smrnaPlugin)){
        var m, t;
        var tracks = lang.clone(thisB.browser.trackConfigsByName);
        for (m in params) {
          if (params[m] === true) {
            var mix = {};
            mix['hide' + m] = true;
            for (t in tracks) {
              if (thisB._testSmallRNA(tracks[t].type)) {
                lang.mixin(thisB.browser.trackConfigsByName[t], mix);
              }

            }
            // TODO: add command to disable toolbar buttons if necessary
          } // end if params[m] === true
        } // end for m in params
        //} // end if SmallRNAPlugin
      },

      _testSmallRNA: function (trackType) {
        if (trackType === undefined || trackType === null)
          return false;
        return (/(sm.*Alignments$)/.test(trackType));
      },

      _applyTracksConfig: function (params) {
        var thisB = this;
        var tracks = lang.clone(thisB.browser.trackConfigsByName);
        // loop through tracks
        var t;
        for (t in tracks) {
          if (params.hasOwnProperty(t)) {
            // check small rna html features
            // handle changes to html feature styles
            if (params[t].type === 'ChangeHTMLFeatures') {
              if (thisB._testSmallRNA(tracks[t].type)) {
                params[t].type = 'SmallRNAPlugin/View/Track/smHTMLAlignments'
              } else if (/CanvasFeatures$/.test(tracks[t].type)) {
                params[t].type = 'JBrowse/View/Track/HTMLFeatures';
                params[t].trackType = "HTMLFeatures";
              } else if (/Alignments2$/.test(tracks[t].type)) {
                params[t].type = 'JBrowse/View/Track/Alignments';
              } else if (/MethylPlot$/.test(tracks[t].type)) {
                params[t].type = 'MethylationPlugin/View/Track/Wiggle/MethylHTMLPlot';
                params[t].maxHeight = params[t].style.height;
                delete params[t].style.height;
              } else if (/StrandedXYPlot$/.test(tracks[t].type)) {
                params[t].type = 'StrandedPlotPlugin/View/Track/Wiggle/StrandedSVGPlot';
              } else if (/\b(XYPlot)/.test(tracks[t].type)){
                params[t].type = 'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot';
              } else if (/\b(Density)/.test(tracks[t].type)){
                params[t].type = 'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity';
              } else if(/\b(NucleotideDensity)/.test(tracks[t].type)){
                params[t].type = 'NucleotideDensityPlugin/View/Track/NucleotideSVGDensity';
              }
            }
            // pull out histograms and/or style
            var hist = params[t].histograms;
            if (hist !== undefined) {
              lang.mixin(thisB.browser.trackConfigsByName[t]['histograms'], hist);
              delete params[t].histograms;
            }
            var style = params[t].style;
            if (style !== undefined) {
              lang.mixin(thisB.browser.trackConfigsByName[t]['style'], style);
              delete params[t].style;
            }
            lang.mixin(thisB.browser.trackConfigsByName[t], params[t]);
          }
        }
      },

      _applyTrackLabelConfig: function () {
        var thisB = this;
        if (thisB.browser.plugins.hasOwnProperty('HideTrackLabels')) {
          //console.log('call')
          thisB.browser.showTrackLabels((thisB.browser.config.show_tracklabels ? 'show' : 'hide'))
        }
      }
    });
  });
