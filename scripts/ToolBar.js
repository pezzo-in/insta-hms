/*
   Define the following in your page
*/

/*
var gToolbar = {
	Edit: {
		title: "View/Edit Bill",
		imageSrc: "icons/Edit.png",
		disabledImageSrc: "icons/black.png"		// optional, required only if different from normal convention
		href: 'billing/BillAction.do?method=getCreditBillingCollectScreen',
		onclick: null,			// will be called onclick of the href
		description: "View and/or Edit the contents of this bill",		// title on hover
		show: true				// use false if user does not have rights, it will be hidden
	},

	ChangeBillType: {
		title: "Change Bill Type",
		imageSrc: "icons/Change.png",
		href: 'pages/BillDischarge/ChangeBillType.do?method=getChangeBillTypeScreen',
		onclick: null
	},

	Order: {
		title: "Order",
		imageSrc: "icons/Order.png",
		href: 'visit/prescribe.do?method=getPrescriptionScreen',
		onclick: null
	},

	CancelOrder: {
		title: "Cancel Order",
		imageSrc: "icons/Cancel.png",
		href: 'pages/ipservices/ipserviceView.do?method=getIPServicesPrescibeScreen',
		onclick: null
	}
};
*/

function empty(obj) {
	if (obj == null || obj == undefined || obj == '') return true;
	else return false;
}

var gToolbars = {};
var defaultKey = "_default";

var createToolbar = function(toolbar, toolbarKey) {
	if (empty(toolbar)) return ;
	if (empty(toolbarKey)) toolbarKey = defaultKey;

	gToolbars[toolbarKey] = toolbar;

	var divToolBar = document.createElement('div');
	divToolBar.id = 'divToolBar' + toolbarKey;
	divToolBar.style.display = "none";
	divToolBar.setAttribute('class', 'toolbar');

	for (var key in toolbar) {
		var data = toolbar[key];
		if (data.show != null && data.show == false) {
			// hide the item.
			continue;
		}

		if (!data.disabledImageSrc) {
			data.disabledImageSrc = data.imageSrc;
			var pattern = /([\w]*)(1\.)(\w+)$/i;
			data.disabledImageSrc = data.disabledImageSrc.replace('.', '1.');
		}

		var action = document.createElement('a');
		action.id = 'toolbarAction' + toolbarKey + key;
		action.href = '#';
		if (!empty(data.onclick))
			action.setAttribute('eventHandler',data.onclick);
		if (!empty(data.target))
			action.setAttribute('target', data.target);
		if (!empty(data.description))
			action.setAttribute('title', data.description);
		divToolBar.appendChild(action);

		var imageDiv = document.createElement('div');
		imageDiv.id = 'toolbarImageDiv' + toolbarKey + key;
		imageDiv.setAttribute('class', 'actionImage');
		action.appendChild(imageDiv);

		var image = document.createElement('img');
		image.id = 'toolbarImage' + toolbarKey + key;
		image.src = cpath + "/" + data.imageSrc;
		imageDiv.appendChild(image);

		var titleDiv = document.createElement('Div');
		titleDiv.id = 'toolbarTitleDiv' + toolbarKey + key;
		titleDiv.setAttribute('class', 'actionTitle enabled');
		action.appendChild(titleDiv);

		var title = document.createTextNode(data.title);
		titleDiv.appendChild(title);
	}

	document.body.appendChild(divToolBar);
	document.getElementById('divToolBar' + toolbarKey).style.display = "none";
}

/*
* ex:
* showToolbar(1, event, 'dashboard', {mr_no: 'patient_id'})
*
* @rowIndex : index of the row from which it is popped up
* @e  : event Object
* @tableId : table id on which toolbar is to displayed.
* @requestParams : requestParameters appended to all hrefs in toolbar.
* @enableList: array of true/false to indicate whether an action is available
*/
var ulId;
var showToolbar = function (rowIndex, e, tableId, requestParams, enableList, toolbarKey, validateOnRClick) {

	if ( Insta.Tooltip.ttipObj != null )
		Insta.Tooltip.ttipObj.hide();

	if (empty(toolbarKey)) toolbarKey = defaultKey;

	var evt = window.event || e;
	var mX, mY;

    if (!evt.target) {//if event obj doesn't support e.target, presume it does e.srcElement
    	evt.target=evt.srcElement
    } //extend obj with custom e.target prop

    var obj = evt.target;


	var rowObj = document.getElementById("toolbarRow"+rowIndex);
	var toolbarObj = document.getElementById('divToolBar' + toolbarKey);

	if (YAHOO.util.Dom.hasClass(obj, 'noToolbar')) {
		rowObj.className == "";
	} else if (obj.tagName == 'IMG' || obj.tagName == 'img'){
    	rowObj.className = "";
    } else if (obj.type == 'checkbox') {
    	if (obj.checked) {
			rowObj.className = "rowbgToolBar";
    	} else {
			rowObj.className = "";
    	}
    } else {
    	ulId = rowIndex;
    	toolbarObj.onmouseover = function() {
	        prevClass = rowObj.className;
	        rowObj.className = 'rowbgToolBar';
	        hideOtherToolbar(toolbarKey);
        }

        toolbarObj.onmouseout = function() {
        	rowObj.className = prevClass;
	        toolbarObj.style.display = 'none';
        }
    	setHrefs(requestParams, rowIndex, enableList, toolbarKey, e, validateOnRClick);
        if (evt.pageX == null) {
           // IE case
           var d = (document.documentElement && document.documentElement.scrollLeft != null) ?
			   document.documentElement : document.body;
           mX = evt.clientX + d.scrollLeft;
           mY = evt.clientY + d.scrollTop;
        } else {
           // all other browsers
           mX = evt.pageX;
           mY = evt.pageY;
        }

	   	hideOtherToolbar(toolbarKey);

		var heightTb = toolbarObj.offsetHeight;
		var widthTb = toolbarObj.offsetWidth;
	    var pageWidth = YAHOO.util.Dom.getViewportWidth();
	    var pageHeight = YAHOO.util.Dom.getViewportHeight();

	    toolbarObj.style.position = "absolute";

		// check if bottom of toolbar if shown at mY will cross the bottom of the page
		if ( (mY + heightTb) > pageHeight ) {
			// bottom of screen: show it upwards
			toolbarObj.style.top = (mY-heightTb+5) + 'px';

		} else {
			// normal: downwards
			toolbarObj.style.top = (mY-5) + 'px';
		}

		// check if right of toolbar if shown at mX will cross the right side of page
	    if( (mX + widthTb) > pageWidth) {
			// right side of screen: limit it to edge of page
		    toolbarObj.style.left = (pageWidth-widthTb-5) +'px';
	    } else {
			// normal: rightwards
		    toolbarObj.style.left = (mX-5) + 'px';
	    }
    }
}

var setHrefs = function(params, id, enableList, toolbarKey, event, validateOnRClick) {
	if (empty(gToolbars[toolbarKey])) return ;

	var i=0;
	var toolbar = gToolbars[toolbarKey];
	for (var key in toolbar) {
		var data = toolbar[key];
		var anchor = document.getElementById('toolbarAction' + toolbarKey + key);
		var href = data.href;

		if (!empty(anchor)) {
			// append the params
			if (!empty(href)) {
				for (var paramname in params) {
					var paramvalue = params[paramname];
					if (paramname.charAt(0) == '%') {
						// replace a component of the href
						href = href.replace(paramname, paramvalue);
					} else {
						// append as param=value
						href += "&" + paramname + "=" + encodeURIComponent(paramvalue);
					}
				}
				anchor.href = cpath + "/" + href;
			}

			var enable = true;
			if (enableList) {
				enableToolbarItem(key, enableList[i], toolbarKey);
				enable = enableList[i];
			} else {
				enableToolbarItem(key, enable, toolbarKey);
			}

			if (!empty(data.onclick) && enable) {
				setParams(anchor, params, id, toolbar, validateOnRClick);
			}

		} else {
			debug("No anchor for " + 'toolbarAction'+ toolbarKey + key + ":");
		}

		i++;
	}
}

function setParams(anchor, params, id, toolbar, validateOnRClick) {
	if (!empty(validateOnRClick)) {
		anchor.onmousedown = function setkeypress(e) {
			if (e.button == 2 || e.button == 1) { // 2 : Right Click , 1: Center Wheel, 0: Left Click (onclick default)
				return eval(anchor.getAttribute("eventHandler"))(anchor, params, id, toolbar);
			}
		}
	}
	anchor.onclick = function set() {
		return eval(anchor.getAttribute("eventHandler"))(anchor, params, id, toolbar);
	}
}

var hideToolBar = function(id, toolbarKey) {
	if (empty(toolbarKey)) toolbarkey = defaultKey;
	if(ulId!=id) {
		if(document.getElementById('divToolBar' + toolbarKey) != null)
			document.getElementById('divToolBar' + toolbarKey).style.display = 'none';
	}
}

function enableToolbarItem(key, enable, toolbarKey) {
	if (empty(toolbarKey)) toolbarKey = defaultKey;
	if (!enable) {
		document.getElementById('toolbarImage'+ toolbarKey + key).src = cpath + "/" + gToolbars[toolbarKey][key].disabledImageSrc;
		document.getElementById('toolbarTitleDiv'+ toolbarKey + key).setAttribute('class', 'actionTitle disabled');
		document.getElementById('toolbarAction'+ toolbarKey + key).setAttribute('onclick', 'return false;');
		document.getElementById('toolbarAction'+ toolbarKey + key).setAttribute('href', 'javascript:void();');
	} else {
		document.getElementById('toolbarImage'+ toolbarKey + key).src = cpath + "/" + gToolbars[toolbarKey][key].imageSrc;
		document.getElementById('toolbarTitleDiv'+ toolbarKey + key).setAttribute('class', 'actionTitle enabled');
		var anchor = document.getElementById('toolbarAction'+ toolbarKey + key);
		document.getElementById('toolbarAction'+ toolbarKey + key).setAttribute('onclick', anchor.onclick);
	}
}

function hideOtherToolbar(toolbarKey) {
	if (empty(toolbarKey)) toolbarKey = defaultKey;
	for (var key in gToolbars) {
		document.getElementById('divToolBar' + key).style.display =
			key == toolbarKey ? 'block' : 'none';
	}
}

var setWidth = function(width) {
	var toolbar = document.getElementById('divToolBar');
	if (empty(toolbar)) return;
	else toolbar.setAttribute('width', width+'px');
}

