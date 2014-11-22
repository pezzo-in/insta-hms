var mainform = null;
var phitemamtform  = null;
var itemsEdited = 0;

var totalAmountPaise = 0;
var totalPatientAmountPaise = 0;
var totalClaimAmountPaise = 0;
var totalClaimNetAmountPaise = 0;
var packageIncludedPaise = 0;

function initForm() {
	mainform	= document.mainform;
	phitemamtform = document.phitemamtform;

	var i=0;

	if (phitemamtform.item_claim_amount != null || phitemamtform.item_qty_included != null)
		CHECK_COL = i++;

	ITEM_POSTED_DATE_COL = i++; ITEM_BILL = i++; ITEM_NAME = i++; ITEM_CATEGORY = i++; ITEM_CODE = i++; ITEM_BATCH = i++;
	ITEM_EXPIRY = i++; ITEM_MFR = i++; ITEM_PKG_SIZE = i++; ITEM_UNIT_RATE = i++; ITEM_PKG_RATE = i++;
	ITEM_QTY = i++; ITEM_AMOUNT_COL = i++;

	if (phitemamtform.item_claim_amount != null) {
		ITEM_PATIENT_AMT_COL = i++;
		ITEM_CLAIM_AMT_COL = i++;
	}
	if(phitemamtform.sec_plan != null && phitemamtform.sec_plan != undefined) {
		document.getElementById("sec_plan_grid_header").style.display = 'block';
		ITEM_SEC_CLAIM_AMT_COL = i++;
	} else if ( document.getElementById("sec_plan_grid_header") != null ){
		document.getElementById("sec_plan_grid_header").style.display = 'none';
	}

	ITEM_EDIT_COL = i++;

	drugCodesAutoComplete();
	loadSelectBox(phitemamtform.code_type, drugCodeTypes, 'code_type', 'code_type', '--Select--', '');
	initPharmacyItemAmountDialog();

	setSelectedIndex(mainform.filterItemCategory, "");
	setSelectedIndex(mainform.filterItemName, "");
	setSelectedIndex(mainform.filterItemBill, "");
	onPharmacyFilterChange(mainform.filterItemCategory);
}

function initPharmacyItemAmountDialog() {
	var dialogDiv = document.getElementById("phItemAmtDialog");
	dialogDiv.style.display = 'block';
	editItemAmountDialog = new YAHOO.widget.Dialog("phItemAmtDialog",{
			width:"500px",
			text: "Edit Item Amount",
			context :["itemsTable", "tl", "tl"],
			visible:false,
			modal:true,
			constraintoviewport:true
		});
	var escKeyListener = new YAHOO.util.KeyListener(document, { keys:27 },
	                                              { fn:onEditItemAmountCancel,
	                                                scope:editItemAmountDialog,
	                                                correctScope:true } );
	editItemAmountDialog.cfg.queueProperty("keylisteners", escKeyListener);
	editItemAmountDialog.render();
}

function onEditItemAmountCancel() {
	var id = phitemamtform.phItemAmtRowId.value;
	var row = getItemAmtRow(id);
	YAHOO.util.Dom.removeClass(row, 'editing');
	editItemAmountDialog.hide();
	var editImg = row.cells[ITEM_EDIT_COL].childNodes[1];
	editImg.focus();
}

function getItemAmtRow(i) {
	i = parseInt(i);
	var table = document.getElementById("itemsTable");
	return table.rows[i + 1];
}

function showNextEditItemDialog() {
	var id = phitemamtform.phItemAmtRowId.value;
	if (!onEditItemAmountSubmit())
		return false;

	var row = getItemAmtRow(id);
	var nRow = YAHOO.util.Dom.getNextSibling(row);
    if (nRow != null) {
        YAHOO.util.Dom.removeClass(row, 'editing');
		var anchor = YAHOO.util.Dom.getFirstChild(nRow.cells[ITEM_EDIT_COL]);
		showEditItemDialog(anchor);
    }
}

function showPreviousEditItemDialog() {
	var id = phitemamtform.phItemAmtRowId.value;
	if (!onEditItemAmountSubmit())
		return false;

	var row = getItemAmtRow(id);
	var prevRow = YAHOO.util.Dom.getPreviousSibling(row);
    var nPrevRow = YAHOO.util.Dom.getPreviousSibling(prevRow);
    if (nPrevRow != null) {
        YAHOO.util.Dom.removeClass(row, 'editing');
        var anchor = YAHOO.util.Dom.getFirstChild(prevRow.cells[ITEM_EDIT_COL]);
        showEditItemDialog(anchor);
    }
}

function showEditItemDialog(obj) {

	var row = getThisRow(obj);
	if (row == null) return false;
	var id = row.rowIndex - 1;

	YAHOO.util.Dom.addClass(row, 'editing');
	phitemamtform.phItemAmtRowId.value = id;

	editItemAmountDialog.cfg.setProperty("context", [row.cells[ITEM_EDIT_COL], "tr", "bl"], false);

	setItemDetails();

	editItemAmountDialog.show();
	return false;
}

function setItemDetails() {
	var id = phitemamtform.phItemAmtRowId.value;

	var origCodeTypeObj	= getIndexedFormElement(mainform, "itemCodeType", id);
	var origCodeObj		= getIndexedFormElement(mainform, "itemCode", id);
	var origPreAuthIdObj	= getIndexedFormElement(mainform, "pri_itemPreAuthId", id);
	var origPreAuthModeObj	= getIndexedFormElement(mainform, "pri_itemPreAuthMode", id);

	var sec_origPreAuthIdObj	= getIndexedFormElement(mainform, "sec_itemPreAuthId", id);
	var sec_origPreAuthModeObj	= getIndexedFormElement(mainform, "sec_itemPreAuthMode", id);

	var origAmountObj	= getIndexedFormElement(mainform, "itemAmount", id);
	var origQtyObj		= getIndexedFormElement(mainform, "itemQty", id);

	var origPatAmtObj	= getIndexedFormElement(mainform, "patientAmt", id);

	var pri_origInsAmtObj	= getIndexedFormElement(mainform, "pri_insClaimAmt", id);
	var sec_origInsAmtObj	= getIndexedFormElement(mainform, "sec_insClaimAmt", id);

	var origIncludedAmtObj	= getIndexedFormElement(mainform, "amountIncluded", id);
	var origIncludedQtyObj	= getIndexedFormElement(mainform, "qtyIncluded", id);

	var origPackageFinalizedObj = getIndexedFormElement(mainform, "packageFinalized", id);
	var priClaimRow = document.getElementById("pri_claim_row");
	var secClaimRow = document.getElementById("sec_claim_row");
	var pripriauthrow = document.getElementById("pri_priauth_row");
	var secpriauthrow = document.getElementById("sec_priauth_row");

	var codetypeObj	= phitemamtform.code_type;
	var codeObj			= phitemamtform.code;
	var codenameObj	= phitemamtform.code_name;
	var pri_preauthidObj	= getElementByName(pripriauthrow,'pre_auth_no');
	var pri_preauthmodeObj = getElementByName(pripriauthrow,'pre_auth_mode');;
	var sec_preauthidObj	= getElementByName(secpriauthrow,'pre_auth_no');
	var sec_preauthmodeObj = getElementByName(secpriauthrow,'pre_auth_mode');;
	var priinsamtObj   = getElementByName(priClaimRow,'item_claim_amount');
	var secinsamtObj   = getElementByName(secClaimRow,'item_claim_amount');
	var includedQtyObj	= phitemamtform.item_qty_included;
	var includedAmtObj	= phitemamtform.item_amount_included;
	var packageFinalizedObj = phitemamtform.item_pkg_finalized;

	setSelectedIndex(codetypeObj, origCodeTypeObj.value);
	codeObj.value =  origCodeObj.value;
	codenameObj.value =  origCodeObj.value;
	if ( pri_preauthidObj != null && origPreAuthIdObj != null)
		pri_preauthidObj.value =  origPreAuthIdObj.value;
	if(pri_preauthmodeObj != null && origPreAuthModeObj != null)
		setSelectedIndex(pri_preauthmodeObj, origPreAuthModeObj.value);

	if ( sec_preauthidObj != null && sec_origPreAuthIdObj != null) {
		sec_preauthidObj.value =  sec_origPreAuthIdObj.value;
		setSelectedIndex(sec_preauthmodeObj, sec_origPreAuthModeObj.value);
	}

	document.getElementById("item_qty").textContent = origQtyObj.value;
	document.getElementById("item_amount").textContent = origAmountObj.value;

	if (priinsamtObj != null && document.getElementById("item_pat_amount") != null && origPatAmtObj != null && pri_origInsAmtObj != null) {
		document.getElementById("item_pat_amount").textContent = origPatAmtObj.value;
		priinsamtObj.value =  pri_origInsAmtObj.value;
	}

	if (sec_origInsAmtObj != null && secinsamtObj != null) {
		secinsamtObj.value =  sec_origInsAmtObj.value;
	}

	if (includedQtyObj != null) {
		includedQtyObj.value =  origIncludedQtyObj.value;
		includedAmtObj.value =  origIncludedAmtObj.value;
		packageFinalizedObj.checked = origPackageFinalizedObj.value == "Y"? "checked":"";
	}
}

function onEditItemAmountSubmit() {

	var id = phitemamtform.phItemAmtRowId.value;
	var row = getItemRow(id);

	var codetypeObj	= phitemamtform.code_type;
	var codeObj			= phitemamtform.code;
	var codenameObj	= phitemamtform.code_name;
	var insamtObj		= phitemamtform.item_claim_amount;
	var includedQtyObj		= phitemamtform.item_qty_included;
	var includedAmtObj		= phitemamtform.item_amount_included;
	var packageFinalizedObj = phitemamtform.item_pkg_finalized;

	var priClaimRow = document.getElementById("pri_claim_row");
	var secClaimRow = document.getElementById("sec_claim_row");

	var priinsamtObj   = getElementByName(priClaimRow,'item_claim_amount');
	var secinsamtObj   = getElementByName(secClaimRow,'item_claim_amount');

	var pripriauthrow = document.getElementById("pri_priauth_row");
	var secpriauthrow = document.getElementById("sec_priauth_row");

	var pri_preauthidObj	= getElementByName(pripriauthrow,'pre_auth_no');
	var pri_preauthmodeObj = getElementByName(pripriauthrow,'pre_auth_mode');
	var sec_preauthidObj	= getElementByName(secpriauthrow,'pre_auth_no');
	var sec_preauthmodeObj = getElementByName(secpriauthrow,'pre_auth_mode');

	if (insamtObj != null)
		if (!validateAmount(insamtObj, getString("js.billing.pharmacyamount.claimamount.validamount")))
			return false;

	if (includedAmtObj != null)
		if (!validateAmount(includedAmtObj, getString("js.billing.pharmacyamount.includedamount.validamount")))
			return false;

	if (includedQtyObj != null)
		if (!validateAmount(includedQtyObj, getString("js.billing.pharmacyamount.includedquantity.validamount")))
			return false;
	if ( pri_preauthidObj != null ) {
		if(!validatePriorAuthMode(pri_preauthidObj,pri_preauthmodeObj,null,null)){
			return false;
		}
	}

	if( sec_preauthidObj != null ){
		if(!validatePriorAuthMode(sec_preauthidObj,sec_preauthmodeObj,null,null)){
			return false;
		}
	}


	var origCodeTypeObj	= getIndexedFormElement(mainform, "itemCodeType", id);
	var origCodeObj		= getIndexedFormElement(mainform, "itemCode", id);
	var pri_origPreAuthIdObj	= getIndexedFormElement(mainform, "pri_itemPreAuthId", id);
	var pri_origPreAuthModeObj	= getIndexedFormElement(mainform, "pri_itemPreAuthMode", id);
	var sec_origPreAuthIdObj	= getIndexedFormElement(mainform, "sec_itemPreAuthId", id);
	var sec_origPreAuthModeObj	= getIndexedFormElement(mainform, "sec_itemPreAuthMode", id);

	var origAmountObj	= getIndexedFormElement(mainform, "itemAmount", id);
	var origQtyObj		= getIndexedFormElement(mainform, "itemQty", id);

	var origPatAmtObj	= getIndexedFormElement(mainform, "patientAmt", id);

	var pri_origInsAmtObj	= getIndexedFormElement(mainform, "pri_insClaimAmt", id);
	var sec_origInsAmtObj	= getIndexedFormElement(mainform, "sec_insClaimAmt", id);

	if (insamtObj != null) {
		if (getPaise(origAmountObj.value) < getPaise(insamtObj.value)) {
			var msg=getString("js.billing.pharmacyamount.claimamountnot.greateritemamount");
			msg+=formatAmountPaise(getPaise(origAmountObj.value));
			alert(msg);
			insamtObj.focus();
			return false;
		}
	}

	if (includedQtyObj != null) {
		if (getAmount(origQtyObj.value) < getAmount(includedQtyObj.value)) {
			var msg=getString("js.billing.pharmacyamount.includedquantitynot.greaterquantity");
			msg+=formatAmountValue(origQtyObj.value);
			alert(msg);
			qtyIncludedObj.focus();
			return false;
		}

		if (isTpa) {
			/*if (getPaise(origAmountObj.value) < getPaise(includedAmtObj.value)) {
				alert("Included amount cannot be greater than amount :" + formatAmountValue(getPaise(origAmountObj.value)));
				includedAmtObj.focus();
				return false;
			}*/

			if (getPaise(insamtObj.value) < getPaise(includedAmtObj.value)) {
				var msg=getString("js.billing.pharmacyamount.includedamtnot.greaterclaimamount");
				msg+=formatAmountValue(getPaise(insamtObj.value));
				alert(msg);
				includedAmtObj.focus();
				return false;
			}
		}else {
			if (getPaise(origAmountObj.value) < getPaise(includedAmtObj.value)) {
				var msg=getString("js.billing.pharmacyamount.includedamtnot.greateramount");
				msg+=formatAmountValue(getPaise(origAmountObj.value));
				alert(msg);
				includedAmtObj.focus();
				return false;
			}
		}
	}

	var editedField = isValueEdited(id);
	if (editedField) {

		setNodeText(row.cells[ITEM_CODE], codeObj.value);

		setHiddenValue(id, "itemCodeType", codetypeObj.value);
		setHiddenValue(id, "itemCode", codeObj.value);
		setHiddenValue(id, "pri_itemPreAuthId", pri_preauthidObj != null ? pri_preauthidObj.value : '') ;
		setHiddenValue(id, "pri_itemPreAuthMode", pri_preauthmodeObj != null ? pri_preauthmodeObj.value : 0);
		if( sec_preauthidObj != null ){
			setHiddenValue(id, "sec_itemPreAuthId", sec_preauthidObj.value);
			setHiddenValue(id, "sec_itemPreAuthMode", sec_preauthmodeObj.value);
		}

		if (priinsamtObj != null) {
			setNodeText(row.cells[ITEM_PATIENT_AMT_COL], phitemamtform.sec_plan != null ?
				formatAmountPaise(getPaise(origAmountObj.value) - (getPaise(priinsamtObj.value)+getPaise(secinsamtObj.value)))
				: formatAmountPaise(getPaise(origAmountObj.value) - (getPaise(priinsamtObj.value))) );
			setNodeText(row.cells[ITEM_CLAIM_AMT_COL], formatAmountPaise(getPaise(priinsamtObj.value)));
			if(phitemamtform.sec_plan != null)
				setNodeText(row.cells[ITEM_SEC_CLAIM_AMT_COL], formatAmountPaise(getPaise(secinsamtObj.value)));
			setHiddenValue(id, "patientAmt", formatAmountPaise(getPaise(origAmountObj.value) - getPaise(priinsamtObj.value)));
			setHiddenValue(id, "pri_insClaimAmt", formatAmountPaise(getPaise(priinsamtObj.value)));
			if(secinsamtObj != null)
				setHiddenValue(id, "sec_insClaimAmt", formatAmountPaise(getPaise(secinsamtObj.value)));
		}

		if (includedQtyObj != null) {
			setHiddenValue(id, "amountIncluded", formatAmountPaise(getPaise(includedAmtObj.value)));
			setHiddenValue(id, "qtyIncluded", formatAmountValue(includedQtyObj.value, true));

			var amountToIncludePaise = getPaise(origAmountObj.value);

			var chargeExcluded = "P";
			if (includedAmtObj != null) {
				if (getPaise(includedAmtObj.value) == amountToIncludePaise)
					chargeExcluded = "N";
				else if (getPaise(includedAmtObj.value) == 0)
					chargeExcluded = "Y";
			}

			setIndexedValue("chargeExcluded", id, chargeExcluded);

			var packageFinalized = (packageFinalizedObj != null && packageFinalizedObj.checked)?"Y":"N";
			setIndexedValue("packageFinalized", id, packageFinalized);
		}

		setIndexedValue("edited", id, 'true');
		setRowStyle(id);
		resetPharmacyTotals();
		itemsEdited++;
	}

	editItemAmountDialog.hide();
	return id;
}

function recalcIncludedAmount() {

	var includedQtyObj	= phitemamtform.item_qty_included;
	var includedAmtObj	= phitemamtform.item_amount_included;
	var amountPaise = getPaise(document.getElementById("item_amount").textContent);
	var itemQty = getAmount(document.getElementById("item_qty").textContent);

	if (getAmount(includedQtyObj.value) != 0) {

		var includedQty = getAmount(includedQtyObj.value);
		var amtPaiseIncluded = (amountPaise * includedQty) / itemQty;
		includedAmtObj.value = formatAmountPaise(amtPaiseIncluded);
	}
}


function resetPharmacyTotals() {
	var num = getNumItems();

	totalAmountPaise = 0;
	totalPatientAmountPaise = 0;
	totalClaimAmountPaise = 0;
	totalClaimNetAmountPaise = 0;
	packageIncludedPaise = 0;

	filterTotalAmountPaise = 0;
	filterPatientAmountPaise = 0;
	filterClaimAmountPaise = 0;
	filterClaimNetAmountPaise = 0;

	var table = document.getElementById("itemsTable");

	for (var i=0;i<num;i++) {

		var amountPaise	= getIndexedPaise("itemAmount",i);
		var patAmtPaise	= 0;
		var priinsAmtPaise	= 0;
		var secinsAmtPaise	= 0;

		var row = getItemRow(i);

		if (table.rows[i+1].style.display != 'none') {
			filterTotalAmountPaise += amountPaise;
			if (isTpa) {
				patAmtPaise	= getIndexedPaise("patientAmt",i);
				priinsAmtPaise	= getIndexedPaise("pri_insClaimAmt",i);
				secinsAmtPaise	= getIndexedPaise("sec_insClaimAmt",i);

				filterPatientAmountPaise += (amountPaise - (priinsAmtPaise+secinsAmtPaise));
				filterClaimAmountPaise += priinsAmtPaise+secinsAmtPaise;
			}
		}

		totalAmountPaise += amountPaise;
		if (isTpa) {
			totalPatientAmountPaise += (amountPaise - (priinsAmtPaise+secinsAmtPaise));
			totalClaimAmountPaise += (priinsAmtPaise+secinsAmtPaise);
		}

		if (phitemamtform.item_qty_included != null)
			packageIncludedPaise += getIndexedPaise("amountIncluded",i);
	}

	setNodeText("lblTotalAmount", formatAmountPaise(totalAmountPaise));
	setNodeText("lblFilteredAmount", formatAmountPaise(filterTotalAmountPaise));

	if (document.getElementById("lblPkgIncludedAmount") != null) {
		setNodeText("lblPkgIncludedAmount", formatAmountPaise(packageIncludedPaise));
	}

	if (isTpa) {
		if (totalClaimAmountPaise < 0) {
			totalClaimNetAmountPaise = totalPatientAmountPaise + totalClaimAmountPaise;
		}else {
			totalClaimNetAmountPaise = totalAmountPaise - totalPatientAmountPaise;
		}

		if (filterClaimAmountPaise < 0) {
			filterClaimNetAmountPaise = filterPatientAmountPaise + filterClaimAmountPaise;
		}else {
			filterClaimNetAmountPaise = filterTotalAmountPaise - filterPatientAmountPaise;
		}

		setNodeText("lblTotalPatientAmt", formatAmountPaise(totalPatientAmountPaise));
		setNodeText("lblTotalClaimAmt", formatAmountPaise(totalClaimAmountPaise));
		setNodeText("lblTotalNetClaimAmt", formatAmountPaise(totalClaimNetAmountPaise));

		setNodeText("lblFilteredPatientAmt", formatAmountPaise(filterPatientAmountPaise));
		setNodeText("lblFilteredClaimAmt", formatAmountPaise(filterClaimAmountPaise));
		setNodeText("lblFilteredNetClaimAmt", formatAmountPaise(filterClaimNetAmountPaise));
	}
}

function isValueEdited(id) {

	var codetypeObj	= phitemamtform.code_type;
	var codeObj			= phitemamtform.code;
	var codenameObj	= phitemamtform.code_name;

	var pripriauthrow = document.getElementById("pri_priauth_row");
	var secpriauthrow = document.getElementById("sec_priauth_row");

	var pri_preauthidObj	=  getElementByName(pripriauthrow,'pre_auth_no');
	var pri_preauthmodeObj = getElementByName(pripriauthrow,'pre_auth_mode');
	var sec_preauthidObj = getElementByName(secpriauthrow,'pre_auth_no');
	var sec_preauthmodeObj = getElementByName(secpriauthrow,'pre_auth_mode');
	var insamtObj		= phitemamtform.item_claim_amount;

	var priClaimRow = document.getElementById("pri_claim_row");
	var secClaimRow = document.getElementById("sec_claim_row");
	var priinsamtObj   = getElementByName(priClaimRow,'item_claim_amount');
	var secinsamtObj   = getElementByName(secClaimRow,'item_claim_amount');

	var includedQtyObj		= phitemamtform.item_qty_included;
	var includedAmtObj		= phitemamtform.item_amount_included;
	var packageFinalizedObj = phitemamtform.item_pkg_finalized;

	var origCodeTypeObj	= getIndexedFormElement(mainform, "itemCodeType", id);
	var origCodeObj		= getIndexedFormElement(mainform, "itemCode", id);

	var pri_origPreAuthIdObj	= getIndexedFormElement(mainform, "pri_itemPreAuthId", id);
	var pri_origPreAuthModeObj	= getIndexedFormElement(mainform, "pri_itemPreAuthMode", id);
	var sec_origPreAuthIdObj	= getIndexedFormElement(mainform, "sec_itemPreAuthId", id);
	var sec_origPreAuthModeObj	= getIndexedFormElement(mainform, "sec_itemPreAuthMode", id);

	var origAmountObj	= getIndexedFormElement(mainform, "itemAmount", id);
	var origQtyObj		= getIndexedFormElement(mainform, "itemQty", id);

	var origPatAmtObj	= getIndexedFormElement(mainform, "patientAmt", id);
	var pri_origInsAmtObj	= getIndexedFormElement(mainform, "pri_insClaimAmt", id);
	var sec_origInsAmtObj	= getIndexedFormElement(mainform, "sec_insClaimAmt", id);

	var origIncludedAmtObj	= getIndexedFormElement(mainform, "amountIncluded", id);
	var origIncludedQtyObj	= getIndexedFormElement(mainform, "qtyIncluded", id);

	var origPackageFinalizedObj = getIndexedFormElement(mainform, "packageFinalized", id);

	var drgCode = findInList(drugCodeTypes,'code_type', origCodeTypeObj.value);

	var edited = true;

	if ((empty(drgCode) || ((codetypeObj.value).toLowerCase() == (origCodeTypeObj.value).toLowerCase()))
			&& codeObj.value == origCodeObj.value
			&& ( pri_preauthidObj != null && pri_origPreAuthIdObj != null &&  pri_preauthidObj.value == pri_origPreAuthIdObj.value )
			&& ( pri_preauthmodeObj != null && pri_origPreAuthModeObj != null && pri_preauthmodeObj.value == pri_origPreAuthModeObj.value)
			&& ( sec_preauthidObj != null && sec_origPreAuthIdObj != null && sec_preauthidObj.value == sec_origPreAuthIdObj.value
			&& sec_preauthmodeObj != null && sec_origPreAuthModeObj != null && sec_preauthmodeObj.value == sec_origPreAuthModeObj.value )) {
		edited = false;
	}else
		return true;

	if (priinsamtObj != null) {
		if (getPaise(priinsamtObj.value) == getPaise(pri_origInsAmtObj.value)) {
			edited = false;
		}else
			return true;
	}

	if (secinsamtObj != null && sec_origInsAmtObj != null) {
		if (getPaise(secinsamtObj.value) == getPaise(sec_origInsAmtObj.value)) {
			edited = false;
		}else
			return true;
	}

	if (includedQtyObj != null) {
		var packageFinalized = (packageFinalizedObj != null && packageFinalizedObj.checked)?"Y":"N";
		if (getAmount(includedQtyObj.value) == getAmount(origIncludedQtyObj.value)
				&& getPaise(includedAmtObj.value) == getPaise(origIncludedAmtObj.value)
				&& packageFinalized == origPackageFinalizedObj.value ) {
			edited = false;
		}else
			return true;
	}

	return edited;
}

function selectAllItems() {
	var itemCheckElmts = document.getElementsByName("itemCheck");
	if (itemCheckElmts != null) {
		if (document.getElementById("allItems").checked) {
			for(var i=0;i<itemCheckElmts.length;i++) {
				if (getThisRow(itemCheckElmts[i]).style.display == "none"){}
				else itemCheckElmts[i].checked=true;
			}
		} else {
			for(var i=0;i<itemCheckElmts.length;i++) {
				itemCheckElmts[i].checked=false;
			}
		}
	}
}

function resetSelectedItems() {
	if (document.getElementById("allItems") != null) {
		document.getElementById("allItems").checked = false;
		selectAllItems();
	}
}

function onPharmacyFilterChange(filterObj) {

	var filterCategory = mainform.filterItemCategory.value;
	var filterItemName = mainform.filterItemName.value;
	var filterSaleBill = mainform.filterItemBill.value;

	filterItems();
	resetSelectedItems();
	resetPharmacyTotals();

	if (filterCategory != '' || filterItemName != '' || filterSaleBill != '') {

		if (filterObj) YAHOO.util.Dom.addClass(filterObj, 'filterActive');
		document.getElementById("filterRow").style.display = 'table-row';

	}else {
		if (filterObj) YAHOO.util.Dom.removeClass(filterObj, 'filterActive');
		document.getElementById("filterRow").style.display = 'none';
	}
}

function filterItems() {
	var num = getNumItems();
   	var table = document.getElementById("itemsTable");
   	var filterCategory = mainform.filterItemCategory.value;
	var filterItemName = mainform.filterItemName.value;
	var filterSaleBill = mainform.filterItemBill.value;
	for (var i=1; i<=num; i++) {
		var row = table.rows[i];
		var itemCategory = getElementByName(row, "itemCategory").value;
		var itemName = getElementByName(row, "itemName").value;
		var itemBill = getElementByName(row, "itemBill").value;
		var show = true;
		if ((filterCategory != "") && (filterCategory != itemCategory))
			show = false;
		if ((filterItemName != "") && (filterItemName != itemName))
			show = false;
		if ((filterSaleBill != "") && (filterSaleBill != itemBill))
			show = false;

		if (show) {
			row.style.display = "";
		} else {
			row.style.display = "none";
		}
	}
}

function addItemClaimAmount() {
	if (!selectedItemsForClaim()) {
		showMessage("js.billing.pharmacyamount.selectitem.addclaimamount");
		return false;
	}

	var itemCheckElmts = document.getElementsByName("itemCheck");
	for(var i=0;i<itemCheckElmts.length;i++) {
		if (itemCheckElmts[i].checked) {

			var row = getThisRow(itemCheckElmts[i]);
			var rowId = getItemRowIndex(row);

			var insAmt = getIndexedValue("pri_insClaimAmt", rowId);
			var patientAmt = getIndexedValue("patientAmt", rowId);
			var claimAmt = formatAmountPaise(getPaise(patientAmt) + getPaise(insAmt));

			setNodeText(row.cells[ITEM_PATIENT_AMT_COL], formatAmountPaise(0));
			setIndexedValue("patientAmt", rowId, formatAmountPaise(0));
			if (phitemamtform.item_claim_amount != null) {
				setNodeText(row.cells[ITEM_CLAIM_AMT_COL], claimAmt);
				setIndexedValue("pri_insClaimAmt", rowId, claimAmt);
			}
			setIndexedValue("edited", rowId, 'true');
			setRowStyle(rowId);
			itemsEdited++;
		}
	}
	resetPharmacyTotals();
}

function removeItemClaimAmount() {
	if (!selectedItemsForClaim()) {
		showMessage("js.billing.pharmacyamount.selectitem.removeclaimamount");
		return false;
	}

	// If claim amount is removed, and dyna package exists, then exclude from package.
	if (phitemamtform.item_qty_included != null)
		excludeFromDynaPkg();

	var itemCheckElmts = document.getElementsByName("itemCheck");
	for(var i=0;i<itemCheckElmts.length;i++) {
		if (itemCheckElmts[i].checked) {

			var row = getThisRow(itemCheckElmts[i]);
			var rowId = getItemRowIndex(row);

			var insAmt = getIndexedValue("pri_insClaimAmt", rowId);
			var patientAmt = getIndexedValue("patientAmt", rowId);
			var claimAmt = formatAmountPaise(getPaise(patientAmt) + getPaise(insAmt));

			setNodeText(row.cells[ITEM_PATIENT_AMT_COL], claimAmt);
			setIndexedValue("patientAmt", rowId, claimAmt);
			if (phitemamtform.item_claim_amount != null) {
				setNodeText(row.cells[ITEM_CLAIM_AMT_COL], formatAmountPaise(0));
				setIndexedValue("pri_insClaimAmt", rowId, formatAmountPaise(0));
			}
			setIndexedValue("edited", rowId, 'true');
			setRowStyle(rowId);
			itemsEdited++;
		}
	}
	resetPharmacyTotals();
}

function selectedItemsForClaim() {
	for (var i=0;i<getNumItems();i++) {
		if (getIndexedFormElement(mainform, "itemCheck",i).checked)
		return true;
	}
	return false;
}


function includeIntoDynaPkg() {
	if (!selectedItemsForClaim()) {
		showMessage("js.billing.pharmacyamount.selectanyitem.include");
		return false;
	}

	var itemCheckElmts = document.getElementsByName("itemCheck");
	for(var i=0;i<itemCheckElmts.length;i++) {
		if (itemCheckElmts[i].checked) {

			var row = getThisRow(itemCheckElmts[i]);
			var rowId = getItemRowIndex(row);

			var amountObj	= getIndexedFormElement(mainform, "itemAmount", rowId);
			var qtyObj		= getIndexedFormElement(mainform, "itemQty", rowId);

			var patAmtObj	= getIndexedFormElement(mainform, "patientAmt", rowId);
			var insAmtObj	= getIndexedFormElement(mainform, "insClaimAmt", rowId);

			var includedAmtObj	= getIndexedFormElement(mainform, "amountIncluded", rowId);
			var includedQtyObj	= getIndexedFormElement(mainform, "qtyIncluded", rowId);

			var amountToIncludePaise = getPaise(amountObj.value);
			var amountToInclude = formatAmountPaise(amountToIncludePaise);

			setIndexedValue("amountIncluded", rowId, amountToInclude);
			setIndexedValue("qtyIncluded", rowId, 0);

			var chargeExcluded = "P";
			if (includedAmtObj != null) {
				if (getPaise(includedAmtObj.value) == amountToIncludePaise)
					chargeExcluded = "N";
				else if (getPaise(includedAmtObj.value) == 0)
					chargeExcluded = "Y";
			}

			setIndexedValue("chargeExcluded", rowId, chargeExcluded);
			setIndexedValue("edited", rowId, 'true');
			setRowStyle(rowId);
			itemsEdited++;
		}
	}
	resetPharmacyTotals();
}

function excludeFromDynaPkg() {
	if (!selectedItemsForClaim()) {
		showMessage("js.billing.pharmacyamount.selectanyitem.exclude");
		return false;
	}

	var itemCheckElmts = document.getElementsByName("itemCheck");
	for(var i=0;i<itemCheckElmts.length;i++) {
		if (itemCheckElmts[i].checked) {

			var row = getThisRow(itemCheckElmts[i]);
			var rowId = getItemRowIndex(row);

			setIndexedValue("amountIncluded", rowId, 0);
			setIndexedValue("qtyIncluded", rowId, 0);

			setIndexedValue("chargeExcluded", rowId, "Y");

			setIndexedValue("edited", rowId, 'true');
			setRowStyle(rowId);
			itemsEdited++;
		}
	}
	resetPharmacyTotals();
}

function setRowStyle(i) {
	var row = getItemRow(i);
	var flagImgs = row.cells[ITEM_POSTED_DATE_COL].getElementsByTagName("img");
	var excluded = (getIndexedValue("chargeExcluded", i) == 'Y');
	var partialExcluded = (getIndexedValue("chargeExcluded", i) == 'P');

	var edited = getIndexedValue("edited", i) == 'true';
	var cls;
	if (edited) {
		cls = 'edited';
	} else {
		cls = '';
	}

	var flagSrc;
	if (excluded) {
		flagSrc = cpath + '/images/blue_flag.gif';
	} else if (partialExcluded) {
		flagSrc = cpath + '/images/blue_flag.gif';
	} else {
		flagSrc = cpath + '/images/empty_flag.gif';
	}

	row.className = cls;

	if (flagImgs && flagImgs[0])
		flagImgs[0].src = flagSrc;
}

function getNumItems() {
	return document.getElementById("itemsTable").rows.length-1;
}

function getItemRowIndex(row) {
	return row.rowIndex - 1;
}

function getItemRow(i) {
	i = parseInt(i);
	var table = document.getElementById("itemsTable");
	return table.rows[i + 1];
}

function getThisRow(node) {
	return findAncestor(node, "TR");
}

function setIndexedValue(name, index, value) {
	var obj = getIndexedFormElement(mainform, name, index);
	if (obj)
		obj.value = value;
	return obj;
}

function getIndexedValue(name, index) {
	var obj = getIndexedFormElement(mainform, name, index);
	if (obj)
		return obj.value;
	else
		return null;
}

function setHiddenValue(index, name, value) {
	var el = getIndexedFormElement(mainform, name, index);
	if (el) {
		if (value == null || value == undefined)
			value = "";
		el.value = value;
	}
}

function getIndexedPaise(name, index) {
	return getElementPaise(getIndexedFormElement(mainform, name, index));
}

function updatePharmacyItemAmounts() {
	mainform.submit();
	return true;
}

function drugCodesAutoComplete() {
	var drugCodesJsonArray = [];
	drugCodesJsonArray.length = drugCodesJson.length;
	for (i=0 ; i< drugCodesJson.length; i++) {
		var item = drugCodesJson[i]
		drugCodesJsonArray[i] = drugCodesJson[i].code;
	}
	YAHOO.example.ACJSAddArray = new function() {
		datasource = new YAHOO.widget.DS_JSArray(drugCodesJsonArray);
		var autoComp = new YAHOO.widget.AutoComplete('code_name', 'drugCodesContainer' ,datasource);

		autoComp.formatResult = Insta.autoHighlight;
		autoComp.prehighlightClassName = "yui-ac-prehighlight";
		autoComp.typeAhead = false;
		autoComp.useShadow = false;
		autoComp.allowBrowserAutocomplete = false;
		autoComp.queryMatchContains = true;
		autoComp.minQueryLength = 0;
		autoComp.maxResultsDisplayed = 20;
		autoComp.forceSelection = false;
		autoComp.itemSelectEvent.subscribe(updateCodeDetails);
	}
}

var updateCodeDetails = function(sType, aArgs) {
	var oData = aArgs[2];
	for(var i=0; i<drugCodesJson.length; i++) {
		var item = drugCodesJson[i];
		if(item.code == oData){
			document.getElementById("code").value = oData;
			setSelectedIndex(document.getElementById("code_type"),item.code_type);
		}
	}
}