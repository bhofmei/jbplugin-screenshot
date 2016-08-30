require({cache:{
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

        // other plugins
        this.config.methylPlugin = 'MethylationPlugin'
        if( args.config.methylPlugin !== undefined )
            this.config.methylPlugin = args.methylPlugin

        var thisB = this;
        browser.afterMilestone('initPlugins', function(){
            // check for screenshot query parameters
            //console.log(browser);
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
                    browser: browser,
                    config: thisB.config
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
