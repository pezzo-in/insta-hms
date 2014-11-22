var patientInfo = null;
var addOrderDialog;
var customFieldList = null;
var visitCustomFieldList = null;
var gIsInsurance = false;
var isOnLoad = false; // Global variable to restrict multiple calls to ratePlanChange() on onload.
var patientTodaysAppointmentDetails = null;


function initRegistration() {
	isOnLoad = true;

	// initailize all required autocompletes.
	initOnLoadDetails();

	// reset all fields
	clearRegDetails();

	// If default registration type is mrno selection,
	// set the default selection and reset all fields.
	setDefaultSelection();

	// Enable/disable patient category expiry date after
	//the patient category is set according to preference.
	categoryChange();

	if (isNewReg()) {
		document.mainform.salutation.focus();
	} else {
		document.mrnoform.mrno.focus();
	}

	// load patient registration from scheduler.
	loadSchedulerPatientDetails();
	// load patient registration from admission request.
	if(!empty(admissionReqId))
		loadPatientAdmissionRequestDetails();

	if (trim(document.mrnoform.mrno.value) == "") {
		if (category != null && (category != 'SNP' || !empty(scheduleName)))
			loadSchedulerOrders();
		estimateTotalAmount();
	}

	// reset after page is loaded
	isOnLoad = false;

	initPatientphotoViewDialog();
	initprimarySponsorDialog();
	initsecondarySponsorDialog();

	disableRegBillButton();

}

function initOnLoadDetails() {
	document.getElementById('CollapsiblePanel1').open = true;
	if (document.getElementById('VisitCollapsiblePanel1'))
		document.getElementById('VisitCollapsiblePanel1').open = true;

	// loading the order dialog to edit.
	if(screenid == 'reg_registration') {
		var doctors = { "doctors": doctorsList };
		presAutoComp = doctorAutoComplete('ePrescribedBy', 'ePrescribedByContainer', doctors, document.editForm);
		initEditDialog();
	}
	// Custom fields
	getCustomFieldList();

	// Visit Custom fields
	getVisitCustomFieldList();

	// Create custom field list and filter according to display preferences.
	setCustomFieldList();

	// Create visit custom field list and filter according to display preferences.
	setVisitCustomFieldList();


	disableOrEnableRegisterBtns(false);

	// Init referral autocomplete
	loadReferals();
	referalAutoComplete('referred_by', 'referaldoctorName', 'referalNameContainer');

	// Reg Pref. PatientCategory
	if (patientCategory != '' && patientCategory != null) {
		CategoryList();
	}
	// Init Order Dialog
	var doctors = {
		"doctors": doctorsList
	};
	if (screenid == 'reg_registration') {
		var bedType = !empty(billingBedTypeForOp) ? billingBedTypeForOp : 'GENERAL';
		addOrderDialog = new Insta.AddOrderDialog('btnAddItem',
				rateplanwiseitems, null, addOrders, doctors, null, 'o', bedType, 'ORG0001', "", "",
				formatDate(getServerDate()), formatTime(getServerDate()), allowBackdate,
				fixedOtCharges, null, forceSubGroupSelection, regPref, anaeTypes, '',null);

		orderTableInit(true);
		showPatientAmountsColumns(true);
		setMultiPlanExists();
		addOrderDialog.allowFinalization = (document.mainform.bill_type.value == 'C');
		if( eClaimModule == 'Y' )
			addOrderDialog.restictionType = 'Doctor';
		if (document.mainform.bill_type && document.mainform.bill_type.value == 'C') {
			document.mainform.printBill.disabled = true;
			document.mainform.printType.disabled = true;
		}
	}
	// Load rate plan and tpa list according to category selected
	onChangeCategory();

	// Init mrno search
	Insta.initMRNoAcSearch(contextPath, "mrno", "mrnoAcDropdown", "all", function (type, args) {
		getRegDetailsOnMrnoNoChange();
	}, function (type, args) {
		clearRegDetails();
	});

	if (screenid == "ip_registration") {
		populateBedTypes();
		CollapsiblePanel1.open();
	}
	if (document.mainform.regBill != null) {
		if (empty(billingCounterId)) document.mainform.regBill.disabled = true;

		var disable = document.mainform.regBill.disabled;
		document.getElementById("paymentTab").style.display = disable ? 'none' : 'block';
	}

	if (creditBillScreen != "A") {
		if (document.mainform.editBill != null)
			document.mainform.editBill.disabled = true;
	}
	// If mod_adv_ins enabled, init policy auto complete
	if (isModAdvanceIns) {
		policyNoAutoComplete('P', gPatientPolciyNos);
		policyNoAutoComplete('S', gPatientPolciyNos);
	}

	corporateNoAutoComplete('P', gPatientCorporateIds);
	corporateNoAutoComplete('S', gPatientCorporateIds);

	nationalNoAutoComplete('P', gPatientNationalIds);
	nationalNoAutoComplete('S', gPatientNationalIds);

	initDoctorDept('');
	onfocus('mrno');
	initLightbox();
	initMlcDialog();
	customDialog();
	visitCustomDialog();
	hotKeys();
	initAutocompletes();
	if(screenid == 'reg_registration' && advancedPackageModule == 'Y')
		initMvPackageDetailsDialog();
}
var mvDialog=null;
function initMvPackageDetailsDialog() {
	var dialog = document.getElementById('patientMvDetailsDialog');
	dialog.style.display = 'block';
	mvDialog = new YAHOO.widget.Dialog("patientMvDetailsDialog", {
		width: "700px",
		visible: false,
		modal: true,
		constraintoviewport: true
	});
	YAHOO.util.Event.addListener('mv_prev', 'click', loadPreviousMvPackageDetails, mvDialog, true);
	YAHOO.util.Event.addListener('mv_next', 'click', loadNextMvPackageDetails, mvDialog, true);
	YAHOO.util.Event.addListener('mv_cancel', 'click', cancelMvDialog, mvDialog, true);

	var escKey = new YAHOO.util.KeyListener(document, { keys:27 },
	                                              { fn:cancelMvDialog,
	                                                scope:mvDialog,
	                                                correctScope:true } );


	mvDialog.cfg.setProperty("keylisteners", escKey);
	mvDialog.cancelEvent.subscribe(cancelMvDialog);
	mvDialog.render();
}

function cancelMvDialog() {
	clearMvDialog();
	gIndex = 0;
	mvDialog.hide();
}

function clearMvDialog() {
	var table1 = document.getElementById('pd_mvDialogTable');
	var table2 = document.getElementById('packageComponentsDetails');
	if(table1.rows.length > 0) {
		table1.deleteRow(0);
	}

	if(table2.rows.length > 0) {
		for(var i=table2.rows.length-1;i>=0;i--) {
			table2.deleteRow(i);
		}
	}
}

function showMvDialog(obj) {
	if (mvDialog != null) {
		mvDialog.cfg.setProperty("context", [obj, "tl", "tr"], false);
		loadMultiVisitPackageDetails(gPatMultiVisitComponentDetails,gPatMultiVisitConsumedDetails,gMvPackageIds,gIndex);
		mvDialog.show();
		if(gMvPackageIds.length == 1) {
			document.getElementById('mv_prev').disabled = true;
			document.getElementById('mv_next').disabled = true;
			document.mainform.mv_cancel.focus();
		} else if (gMvPackageIds.length > 1) {
			document.getElementById('mv_prev').disabled = true;
			document.getElementById('mv_next').disabled = false;
			document.mainform.mv_next.focus();
		}
	}
	return false;
}
var gIndex = 0;
function loadMultiVisitPackageDetails(patMultiVisitComponentDetails,patMultiVisitConsumedDetails,mvPackageIds,gIndex) {
	if(!empty(patMultiVisitComponentDetails) && !empty(patMultiVisitConsumedDetails)) {
		var mvPackageId = mvPackageIds[gIndex].package_id;
		var patMvComponentDetails = filterList(patMultiVisitComponentDetails,"package_id",mvPackageId);
		var patMvConsumedDetails = filterList(patMultiVisitConsumedDetails,"package_id",mvPackageId);
		var table1 = document.getElementById('pd_mvDialogTable');
		var table2 = document.getElementById('packageComponentsDetails');
		if(table2.rows.length < 1) {
			var row = table2.insertRow(-1);
			var header1 = document.createElement('th');
			header1.textContent = getString('js.registration.patient.label.item.name');
			row.appendChild(header1);
			var header2 = document.createElement('th');
			header2.textContent = getString('js.registration.patient.label.item.type');
			row.appendChild(header2);
			var header3 = document.createElement('th');
			header3.textContent = getString('js.registration.patient.label.total.qty');
			row.appendChild(header3);
			var header4 = document.createElement('th');
			header4.textContent = getString('js.registration.patient.label.available.qty');
			row.appendChild(header4);
		}
		var row = table1.insertRow(-1);
		var innerCell0 = row.insertCell(-1);
			innerCell0.setAttribute('class','formlabel');
			innerCell0.textContent = 'Package Name:'
		var innerCell1 = row.insertCell(-1);
			innerCell1.setAttribute('class','forminput');
			innerCell1.innerHTML = '<label style="font-style:bold">'+patMvComponentDetails[0].package_name+'</label>';
		var innerCell2 = row.insertCell(-1);
			innerCell2.setAttribute('class','formlabel');
			innerCell2.textContent = 'Package Status:';
		var innerCell3 = row.insertCell(-1);
			innerCell3.setAttribute('class','forminput');
			innerCell3.innerHTML = '<label style="font-style:bold">'+getString('js.registration.patient.label.mvpackage.status')+'</label>';
		for(var i=0;i<patMvComponentDetails.length;i++) {
			var activityId = patMvComponentDetails[i].activity_id;
			var itemType = patMvComponentDetails[i].item_type;
			var packObId = patMvComponentDetails[i].pack_ob_id;
			var activityDesc = patMvComponentDetails[i].activity_description;
			var displayText = activityDesc;
			var consultationTypeId = patMvComponentDetails[i].consultation_type_id;
			var itemTotalQty = patMvComponentDetails[i].activity_qty;
			var len = 35;

			if (len != null && len > 0) {
				if (activityDesc.length > len) {
					displayText = activityDesc.substring(0, len-2) + '...';
				}
				if (displayText == 'Doctor') {
					displayText = displayText + " (" + patMvComponentDetails[i].chargehead_name+ ")";
				}
			}

			var row = table2.insertRow(-1);
			var innerCell0 = row.insertCell(-1);
				innerCell0.innerHTML = '<label>'+displayText+'</label>';
			var innercell1 = row.insertCell(-1);
				innercell1.innerHTML = '<label>'+itemType+'</label>';

			var consumedQty = 0;
			for(var j=0;j<patMvConsumedDetails.length;j++) {
				if(!empty(consultationTypeId)) {
					if (consultationTypeId == patMvConsumedDetails[j].item_id) {
						consumedQty = patMvConsumedDetails[j].consumed_qty;
					}
				} else {
					if (activityId == patMvConsumedDetails[j].item_id) {
						consumedQty = patMvConsumedDetails[j].consumed_qty;
					}
				}
			}
			var itemAvailableQty = itemTotalQty-consumedQty;
			var innercell2 = row.insertCell(-1);
				innercell2.innerHTML = '<label>'+itemTotalQty+'</label>';
			var innercell3 = row.insertCell(-1);
				innercell3.innerHTML = '<label>'+itemAvailableQty+'</label>';
		}
	}
}

function loadPreviousMvPackageDetails() {
	gIndex--;
	clearMvDialog();
	loadMultiVisitPackageDetails(gPatMultiVisitComponentDetails,gPatMultiVisitConsumedDetails,gMvPackageIds,gIndex);
	if(gIndex == 0) {
		document.getElementById('mv_prev').disabled = true;
		document.getElementById('mv_next').disabled = false;
		document.mainform.mv_next.focus();// to make escape key work puting focus on enabaled button.
	} else {
		document.mainform.mv_next.disabled = false;
		document.mainform.mv_prev.disabled =  false;
		document.mainform.mv_prev.focus();
	}
}

function loadNextMvPackageDetails() {
	gIndex++;
	clearMvDialog();
	loadMultiVisitPackageDetails(gPatMultiVisitComponentDetails,gPatMultiVisitConsumedDetails,gMvPackageIds,gIndex);
	if(gIndex == gMvPackageIds.length-1) {
		document.mainform.mv_next.disabled = true;
		document.mainform.mv_prev.disabled =  false;
		document.mainform.mv_prev.focus();// to make escape key work puting focus on enabaled button.
	} else {
		document.mainform.mv_next.disabled = false;
		document.mainform.mv_prev.disabled =  false;
		document.mainform.mv_next.focus();
	}
}


// Set default registration type selection.

function setDefaultSelection() {
	if (screenid == "reg_registration") {
		if (opDefaultSelection == "M")
			showMrnoSearch();

	} else if (screenid == "ip_registration") {
		if (ipDefaultSelection == "M")
			showMrnoSearch();

	} else {
		if (outsideDefaultSelection == "M")
			showMrnoSearch();
	}
}

function showMrnoSearch() {
	document.getElementById('regTyperegd').checked = true;
	document.getElementById('regTyperegd').focus();
	clearRegDetails();
}

// Create custom field list and filter according to display preferences.
function setCustomFieldList() {
	customFieldList = [{
		display: regPref.custom_list1_show,
		label: custom_list1_name
	}, {
		display: regPref.custom_list2_show,
		label: custom_list2_name
	}, {
		display: regPref.custom_list3_show,
		label: custom_list3_name
	}, {
		display: regPref.custom_list4_show,
		label: custom_list4_name
	}, {
		display: regPref.custom_list5_show,
		label: custom_list5_name
	},{
		display: regPref.custom_list6_show,
		label: custom_list6_name
	},{
		display: regPref.custom_list7_show,
		label: custom_list7_name
	},{
		display: regPref.custom_list8_show,
		label: custom_list8_name
	},{
		display: regPref.custom_list9_show,
		label: custom_list9_name
	},{
		display: regPref.custom_list3_show,
		label: custom_list3_name
	}, {
		display: regPref.custom_field1_show,
		label: custom_field1_label
	}, {
		display: regPref.custom_field2_show,
		label: custom_field2_label
	}, {
		display: regPref.custom_field3_show,
		label: custom_field3_label
	}, {
		display: regPref.custom_field4_show,
		label: custom_field4_label
	}, {
		display: regPref.custom_field5_show,
		label: custom_field5_label
	}, {
		display: regPref.custom_field6_show,
		label: custom_field6_label
	}, {
		display: regPref.custom_field7_show,
		label: custom_field7_label
	}, {
		display: regPref.custom_field8_show,
		label: custom_field8_label
	}, {
		display: regPref.custom_field9_show,
		label: custom_field9_label
	}, {
		display: regPref.custom_field10_show,
		label: custom_field10_label
	}, {
		display: regPref.custom_field11_show,
		label: custom_field11_label
	}, {
		display: regPref.custom_field12_show,
		label: custom_field12_label
	}, {
		display: regPref.custom_field13_show,
		label: custom_field13_label
	}, {
		display: regPref.custom_field14_show,
		label: custom_field14_label
	},{
		display: regPref.custom_field15_show,
		label: custom_field15_label
	},{
		display: regPref.custom_field16_show,
		label: custom_field16_label
	}, {
		display: regPref.custom_field17_show,
		label: custom_field17_label
	}, {
		display: regPref.custom_field18_show,
		label: custom_field18_label
	}, {
		display: regPref.custom_field19_show,
		label: custom_field19_label
	}, {
		display: regPref.passport_no_show,
		label: regPref.passport_no
	}, {
		display: regPref.passport_validity_show,
		label: regPref.passport_validity
	}, {
		display: regPref.passport_issue_country_show,
		label: regPref.passport_issue_country
	}, {
		display: regPref.visa_validity_show,
		label: regPref.visa_validity
	}, {
		display: regPref.family_id_show,
		label: regPref.family_id
	}];

	filterCustomFields();
}

// Create visit custom field list filter according to display preferences.
function setVisitCustomFieldList() {
	visitCustomFieldList = [{
		display: regPref.visit_custom_list1_show,
		label: visit_custom_list1_name
	}, {
		display: regPref.visit_custom_list2_show,
		label: visit_custom_list2_name
	}, {
		display: regPref.visit_custom_field1_show,
		label: visit_custom_field1_name
	}, {
		display: regPref.visit_custom_field2_show,
		label: visit_custom_field2_name
	}, {
		display: regPref.visit_custom_field3_show,
		label: visit_custom_field3_name
	},{
		display: regPref.visit_custom_field4_show,
		label: visit_custom_field4_name
	},{
		display: regPref.visit_custom_field5_show,
		label: visit_custom_field5_name
	},{
		display: regPref.visit_custom_field6_show,
		label: visit_custom_field6_name
	},{
		display: regPref.visit_custom_field7_show,
		label: visit_custom_field7_name
	},{
		display: regPref.visit_custom_field8_show,
		label: visit_custom_field8_name
	}, {
		display: regPref.visit_custom_field9_show,
		label: visit_custom_field9_name
	}];

	displayVisitMoreButton();
	filterVisitCustomFields();
}

var gPatientCategoryRatePlan = null;
var gSelectedDoctorName = null;
var gSelectedDoctorId = null;

/* Clears the patient details: call when reg type is changed, or if mr no is changed */

function clearRegDetails() {
	// Clear previous patient details.
	clearPreviousPatientDetails();

	if (isModAdvanceIns) {
		policyNoAutoComplete('P', gPatientPolciyNos);
		policyNoAutoComplete('S', gPatientPolciyNos);
	}

	corporateNoAutoComplete('P', gPatientCorporateIds);
	corporateNoAutoComplete('S', gPatientCorporateIds);

	nationalNoAutoComplete('P', gPatientNationalIds);
	nationalNoAutoComplete('S', gPatientNationalIds);

	if (((allowNewRegistration == 'N') && (roleId != 1) && (roleId != 2))) {
		document.getElementById('regTypenew').checked = false;
		document.getElementById('regTypenew').disabled = true;
		document.getElementById('regTyperegd').checked = true;
	}
	if (document.getElementById('regTypenew').checked == true) {
		document.getElementById('prevVisitTag').style.display = 'none';
		document.getElementById('viewPhoto').style.display = 'none';
		document.getElementById('prevVisitTag').style.display = 'none';
		document.getElementById('patient_name').disabled = false;
		enableDisableDateOfBirthFields('dob', false);
		document.mainform.age.disabled = false;
		document.mainform.ageIn.disabled = false;
		document.mainform.patient_gender.disabled = false;
		document.getElementById('prvsDoctor').textContent = '';
		document.getElementById('prvsDate').textContent = '';
		if (document.getElementById("autoGenCaseFileDiv") != null)
			document.getElementById("autoGenCaseFileDiv").style.display = 'table-cell';
		if (document.getElementById("caseFileIssuedDiv") != null)
			document.getElementById("caseFileIssuedDiv").style.display = 'none';
		if (screenid != "out_pat_reg" && document.mainform.op_type != null) {
			document.mainform.op_type.selectedIndex = 0;
			document.mainform.op_type.disabled = 0;
		}
	} else {
		document.getElementById('prevVisitTag').style.display = 'block';
		document.getElementById('patient_name').disabled = true;
		if (document.mainform.op_type) document.getElementById('op_type').disabled = false;
	}
	var newReg = isNewReg();
	document.getElementById("mrno").disabled = newReg;

	/* Clear the form values */
	document.mainform.reset();

	//Clear previously selected patient category, rateplan, tpa, plan
	gSelectedPatientCategory = (document.mainform.patient_category_id) ? null : "";
	gSelectedRatePlan = null;
	gSelectedTPA = null;
	gSelectedPlan = null;

	//Clear globally set patient category rate plan.
	gPatientCategoryRatePlan = null;

	//Clear globally set selected doctor.
	gSelectedDoctorName = null;
	gSelectedDoctorId = null;

	//clear the appointment if mrno selection is changed.
	document.mainform.appointmentId.value = "";
	document.mainform.category.value = "";

	document.mrnoform.mlccheck.checked = false;
	populateMLCTemplates();
	document.mainform.mlc_template.options.selectedIndex = 0;
	onChangeMLCDoc();
	document.mainform.vip_check.checked = false;
	enableVipStatus();
	//Set default rate plan when Patient category is not enabled
	// and single rate plan exists
	if (document.mainform.organization.options.length == 2)
		setSelectedIndex(document.mainform.organization, "ORG0001");
	document.mainform.consFees.value = 0;
	document.mainform.opdocchrg.value = 0;
	if (document.getElementById("docConsultationFees") != null)
		document.getElementById("docConsultationFees").textContent = '';

	/* Blank out the mrno if new reg  */
	document.mrnoform.mrno.value = "";
	document.mainform.mrno.value = "";
	document.mainform.main_visit_id.value = "";

	if (document.mrnoform.tmp_verify_finger_print)
		document.mrnoform.tmp_verify_finger_print.checked = false;

	document.mainform.verify_finger_print.value = 'N';

	document.mainform.patient_name.value = getString("js.registration.patient.first.name");
	document.mainform.middle_name.value = getString("js.registration.patient.middle.name");
	document.mainform.last_name.value = getString("js.registration.patient.last.name");
	document.mainform.age.value = getString("js.registration.patient.show.age.text");


	isDoctorChange = false;

	if (screenid != "out_pat_reg") {
		// Default the department if hospital has only one department.
		var deptObj = document.mainform.dept_name;
		if (deptObj.options.length == 2) {
			deptObj.options.selectedIndex = 1;
			DeptChange();
		}else
			deptObj.options.selectedIndex = 0;
		document.mainform.doctor_name.removeAttribute("title");
		if (docAutoComp == null || !isDoctorChange)
			initDoctorDept(document.mainform.dept_name.value);
	}

	if (allowMultipleActiveVisits == 'Y'
			&& document.mrnoform.close_last_active_visit != null) {
		document.mrnoform.close_last_active_visit.checked = false;
		setLastVisitToClose();
	}

	if (newReg) {
		document.mainform.salutation.focus();
		setDefaultCity();
	}else {
		document.mrnoform.mrno.focus();
	}

	if (document.mainform.oldmrno != null)
		document.mainform.oldmrno.readOnly = false;
	if (document.mainform.casefileNo != null)
		document.mainform.casefileNo.readOnly = false;
	if (document.mainform.oldRegAutoGenerate != null) {
		document.mainform.oldRegAutoGenerate.disabled = false;
		document.mainform.oldRegAutoGenerate.checked = false;
	}

	// If not new registration, make custom fields readonly based on preferences.
	markCustomFieldsReadonly(document.getElementById('regTyperegd').checked);

	// Bill type default selection and estimate amount.
	checkTypeOfReg();

	// If default patient category exists, load rate plan, TPA & again estimate amount.
	setPatientCategoryDefaultSelection();
	showHideCaseFile();

	if (!isOnLoad)
		ratePlanChange();

	// Set the patient category rate plan globally
	gPatientCategoryRatePlan = document.mainform.organization.value;

	clearTodaysAppointmentDetails();
}

function clearTodaysAppointmentDetails() {
	var table = document.getElementById('patientDetailsTable');
	if(table && table.rows.length > 0)
		table.deleteRow(0);
	document.getElementById('patDetFieldset').setAttribute('style','height:80px;');
}


var visitType = ""; // Global declaration of visit type

function checkTypeOfReg() {
	var spnsrIndex = getMainSponsorIndex();
	var tpaObj = null;
	if (spnsrIndex == 'P')
		tpaObj = getPrimarySponsorObj();
	else if (spnsrIndex == 'S')
		tpaObj = getSecondarySponsorObj();

	var group = document.mrnoform.group.value;
	if (group == "ipreg") {
		visitType = "I";
		if (document.mainform.bill_type) setBillType(defaultIpBillType);
		document.getElementById('prevVisitTag').style.display = 'block';
		document.getElementById('bedAdvance').innerHTML = "";
		document.getElementById('availabelBeds').innerHTML = "";
	}
	if (group == "opreg") {
		visitType = "O";
		if (document.mainform.bill_type) setBillType(defaultOpBillType);
		if (document.getElementById('regTypenew').checked == true) {
			document.getElementById('prevVisitTag').style.display = 'none';
		} else {
			document.getElementById('prevVisitTag').style.display = 'block';
		}

		if (tpaObj != null) {
			if (tpaObj.value == "" && allowBillNowInsurance == 'true' ||
					(document.mainform.bill_type != null && document.mainform.bill_type.value == 'C')) {
				tpaObj.selectedIndex = 0;
			}
		}
	}
	// If new registration disable close previous active visit check box.
	var newReg = isNewReg();
	if (allowMultipleActiveVisits == 'Y' && document.mrnoform.close_last_active_visit != null)
		document.mrnoform.close_last_active_visit.disabled = newReg;

	estimateTotalAmount();
}

function setBillType(type) {
	setSelectedIndex(document.mainform.bill_type, type);
	onBillTypeChange();
}

// Function called when bill type is changed in UI
function onChangeBillType() {
	onBillTypeChange();
	setAllDefaults();
	if (screenid == "reg_registration" && (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D"))
		loadInsurancePolicyDetails();
	changeVisitType();
	estimateTotalAmount();
}

function onBillTypeChange() {

	var priTpaObj = getPrimarySponsorObj();
	var secTpaObj = getSecondarySponsorObj();
	var priInsCompObj = getPrimaryInsuObj();
	var secInsCompObj = getSecondaryInsuObj();

	var newType = document.mainform.bill_type.value;
	if (newType == 'P') {
		if(screenid == "reg_registration") {
			if (empty(billingCounterId)) document.mainform.regBill.disabled = true;
			else document.mainform.regBill.disabled = false;

			var disable = document.mainform.regBill.disabled;
			document.getElementById("paymentTab").style.display = disable ? 'none' : 'block';
		}

		if (screenid == 'reg_registration') {
			addOrderDialog.allowFinalization = false;
			document.mainform.printBill.disabled = false;
			document.mainform.printType.disabled = false;
		}
		if (allowBillNowInsurance == 'false') {

			var primarySponsorObj = document.getElementById("primary_sponsor");
			var secondarySponsorObj = document.getElementById("secondary_sponsor");

			if (primarySponsorObj != null) primarySponsorObj.selectedIndex = 0;
			if (secondarySponsorObj != null) secondarySponsorObj.selectedIndex = 0;

			resetPrimarySponsorChange();
			resetSecondarySponsorChange();

			if (priTpaObj != null) {
				priTpaObj.disabled = true;
				priTpaObj.selectedIndex = 0;
			}
			if (priInsCompObj != null) {
				priInsCompObj.selectedIndex = 0;
				priInsCompObj.disabled = true;
			}
			if (secTpaObj != null) {
				secTpaObj.disabled = true;
				secTpaObj.selectedIndex = 0;
			}
			if (secInsCompObj != null) {
				secInsCompObj.selectedIndex = 0;
				secInsCompObj.disabled = true;
			}
			disableOrEnableInsuranceFields(true);
		} else {
			if (priTpaObj != null) {
				priTpaObj.disabled = false;
				priTpaObj.selectedIndex = 0;
			}
			if (priInsCompObj != null) {
				priInsCompObj.removeAttribute("disabled");
				priInsCompObj.selectedIndex = 0;
			}
			if (secTpaObj != null) {
				secTpaObj.disabled = false;
				secTpaObj.selectedIndex = 0;
			}
			if (secInsCompObj != null) {
				secInsCompObj.removeAttribute("disabled");
				secInsCompObj.selectedIndex = 0;
			}
			disableOrEnableInsuranceFields(false);
		}
		if (allocBed == 'Y' && document.mainform.bed_id != undefined)
			changeAllocateSection(true);
	} else {
		disableOrEnableRegisterBtns(false);
		if (screenid == "reg_registration") {
			document.mainform.regBill.disabled = true;
			var disable = document.mainform.regBill.disabled;
			document.getElementById("paymentTab").style.display = disable ? 'none' : 'block';
		}
		if (screenid == 'reg_registration') {
			addOrderDialog.allowFinalization = true;
			document.mainform.printBill.disabled = true;
			document.mainform.printType.disabled = true;
		}

		if (priTpaObj != null) {
			priTpaObj.disabled = false;
			priTpaObj.selectedIndex = 0;
		}
		if (priInsCompObj != null) {
			priInsCompObj.removeAttribute("disabled");
			priInsCompObj.selectedIndex = 0;
		}
		if (secTpaObj != null) {
			secTpaObj.disabled = false;
			secTpaObj.selectedIndex = 0;
		}
		if (secInsCompObj != null) {
			secInsCompObj.removeAttribute("disabled");
			secInsCompObj.selectedIndex = 0;
		}
		disableOrEnableInsuranceFields(false);

		if (allocBed == 'Y' && document.mainform.bed_id != undefined)
			changeAllocateSection(false);
	}
	disableRegBillButton();
}

// Set default patient category selection and load rate plan and tpa list accordingly.

function setPatientCategoryDefaultSelection() {
	if (screenid == "reg_registration") {
		if (document.mainform.patient_category_id != null && opCategoryDefaultSelection != null) {
			setSelectedIndex(document.mainform.patient_category_id, opCategoryDefaultSelection);
			onChangeCategory();
		}
	} else if (screenid == "ip_registration") {
		if (document.mainform.patient_category_id != null && ipCategoryDefaultSelection != null) {
			setSelectedIndex(document.mainform.patient_category_id, ipCategoryDefaultSelection);
			onChangeCategory();
		}
	} else if(screenid == "out_pat_reg") {
		if (document.mainform.patient_category_id != null && ospCategoryDefaultSelection != null) {
			setSelectedIndex(document.mainform.patient_category_id, ospCategoryDefaultSelection);
			onChangeCategory();
		}
	} else {
		if (document.mainform.patient_category_id != null && opCategoryDefaultSelection != null) {
			setSelectedIndex(document.mainform.patient_category_id, opCategoryDefaultSelection);
			onChangeCategory();
		}
	}
	if (document.mainform.patient_category_id != null) {
		var catObj = document.mainform.patient_category_id;
		// if no default category found in registration preferences,
		// but found only one category in dropdown then default that category.
		if (catObj.value == '' && catObj.options.length == 2) {
			catObj.options.selectedIndex = 1;
			onChangeCategory();
		}
	}
}

/************ Admission Request Scripting ******************/
// Setting all the field values in registration screen from Admission Request Screen

function loadPatientAdmissionRequestInfo() {
	var form = document.mainform;
	if(admissionRequestDetails != null) {
		setSelectedIndex(form.dept_name, admissionRequestDetails.requesting_doctor_dept_id);
		DeptChange();
		form.doctor_name.value = admissionRequestDetails.requsting_docto_name;
		form.doctor.value = admissionRequestDetails.requesting_doc;
		form.ailment.value = admissionRequestDetails.chief_complaint;
	}
}

function loadPatientAdmissionRequestDetails() {
	var form = document.mainform;
	if(admissionRequestDetails != null) {
		var mrno = admissionRequestDetails.mr_no;
		if (!empty(mrno)) {

			document.getElementById('regTyperegd').checked = true;
			clearRegDetails();
			form.mrno.value = mrno;
			document.mrnoform.mrno.value = mrno;
			getRegDetails();
			form.adm_request_id.value = admissionRequestDetails.adm_request_id;
		}
	}
}

/*********** Scheduler registration scripting *****************************/


function getSchedulerPrimaryResource() {
	if (appointmentDetailsList != null && appointmentDetailsList != '') {
		for (var i = 0; i < appointmentDetailsList.length; i++) {
			var isPrimaryResource = appointmentDetailsList[i].primary_resource;
			if (isPrimaryResource) {
				return appointmentDetailsList[i];
			}
		}
	}
	return null;
}

// Setting all the field values in registration screen

function loadSchedulerPatientDetails() {
	var form = document.mainform;
	var primaryResource = getSchedulerPrimaryResource();

	if (primaryResource != null) {
		var mrno = primaryResource.mr_no;
		var category = primaryResource.category;
		var appointmentId = primaryResource.appointment_id;

		// Existing patient
		if (!empty(mrno)) {

			document.getElementById('regTyperegd').checked = true;
			clearRegDetails();
			form.mrno.value = mrno;
			document.mrnoform.mrno.value = mrno;
			getRegDetails();
			form.appointmentId.value = appointmentId;
			form.category.value = category;

		}else {
			// New patient
			document.getElementById('regTypenew').checked = true;
			clearRegDetails();
			form.appointmentId.value = appointmentId;
			form.category.value = category;
			form.patient_name.value = primaryResource.patient_name;
			form.patient_phone.value = primaryResource.patient_contact;
			form.ailment.value = primaryResource.complaint;

			// For Doctor scheduling, load the doctor details
			if (category == 'DOC') {
				setSelectedIndex(form.dept_name, primaryResource.dept_id);
				DeptChange();
				form.doctor_name.value = primaryResource.resourcename;
				form.doctor.value = primaryResource.res_sch_name;

				// Sets the consultation, op type and gets the doctor charge
				setDocRevistCharge(primaryResource.res_sch_name);
				resetDoctorAndReferralOnRevisit();
				changeVisitType();
				if (!empty(primaryResource.consultation_type_id) && primaryResource.consultation_type_id != 0)
					setSelectedIndex(document.mainform.doctorCharge,primaryResource.consultation_type_id);

				setAppointmentDateTimeAsConsultationDateTime(primaryResource);
				getDoctorCharge();
				loadPreviousUnOrderedPrescriptions();
			}
		}
	}
}

function setAppointmentDateTimeAsConsultationDateTime(primaryResource) {
	var appDate = primaryResource.text_appointment_date;
	document.mainform.consDate.value = appDate;
	var serverDate = getServerDate();
	var appointmentTimeInMillis = primaryResource.appointment_date_time;
	var arrivedTimeInMillis = serverDate.getTime();
	var hrPart = serverDate.getHours();
	var minPart = serverDate.getMinutes();
	hrPart = (hrPart.length == 1) ? '0'+hrPart : hrPart;
	minPart = (minPart.length == 1) ? '0'+minPart : minPart;

	if(appointmentTimeInMillis < arrivedTimeInMillis)
		document.mainform.consTime.value = hrPart+":"+minPart;
	else
		document.mainform.consTime.value = primaryResource.text_appointment_time;
}
/* For tests and Services getting the orderdetails from SchedulerScreen to the order grid of RegistrationScreen.*/

function loadSchedulerOrders() {
	var currentDate = document.getElementById('current_date').value;
	var currentTime = document.getElementById('current_time').value;
	var order = null;
	if (!empty(document.mainform.appointmentId.value) && !empty(appointmentDetailsList)) {
		for (var i = 0; i < appointmentDetailsList.length; i++) {
			var category = appointmentDetailsList[i].category;
			var isPrimary = appointmentDetailsList[i].primary_resource;
			// Test and Service which are primary resources need to be ordered.
			// Equipment is secondary resource for these scheduling categories (no need to be ordered).
			if (isPrimary && (category == 'DIA' || category == 'SNP')) {
				var schRemarks = (category == 'DIA') ? "Scheduler Test" : ((category == 'SNP') ? "Scheduler Service" : "");
				order = {
					itemType: appointmentDetailsList[i].item_type,
					itemId: appointmentDetailsList[i].res_sch_name,
					itemName: appointmentDetailsList[i].central_resource_name,
					presDate: currentDate + ' ' + currentTime,
					fromDate: currentDate,
					toDate: currentDate,
					fromTime: currentTime,
					toTime: currentTime,
					units: '',
					quantity: 1,
					preAuthNo : '',
					preAuthModeNo : '0',
					from: currentDate + ' ' + currentTime,
					to: currentDate + ' ' + currentTime,
					remarks: schRemarks,
					addTo: 'orderTable0'
				}
				addOrderDialog.getCharge(order, true);
			}
		}
	}
}

/***************************** Scheduler script ends ***********************************/

/* Function to populate 'ORG0001' i.e GENERAL bed types,
 * called on load and when the bed_type selected value is empty.
 */

function populateBedTypes() {
	var bedTypeObj = document.mainform.bed_type;
	loadSelectBox(bedTypeObj, bedTypesList, 'bedtype', 'bedtype', getString("js.registration.patient.commonselectbox.defaultText"));
}

/* Function to populate all wards,
 * called on load and when the ward_id selected value is empty.
 */

function populateWards() {
	var wardObj = document.mainform.ward_id;
	loadSelectBox(wardObj, wardsList, 'ward_name', 'ward_no', getString("js.registration.patient.commonselectbox.defaultText"));
}

function changeAllocateSection(value) {
	document.mainform.bed_id.disabled = value;
	document.mainform.duty_doctor_id.disabled = value;
	document.mainform.daycare_status.checked = false;
	populateBedCharge();
	document.mainform.daycare_status.disabled = value;
	dutyDoctorMand = !value;
	if (dutyDoctorReq == 'I') getICUStatus();
	else if (dutyDoctorReq == 'A') dutyDoctorMand = true;
	else if (dutyDoctorReq == 'N') dutyDoctorMand = false;
}

/* Function to load bed type related wards.
 * If bed type exisits in a single ward, the ward is defaulted and
 * bed names for the bed type and ward are loaded.
 */

function onBedTypeChange() {
	var bedTypeObj = document.mainform.bed_type;
	var wardObj = document.mainform.ward_id;
	var selectedbedtype = bedTypeObj.value;
	var selectedward = wardObj.value;

	if (selectedbedtype == '' || selectedward == '') {
		document.getElementById('bedAdvance').innerHTML = "";
		document.getElementById('initialAmount').innerHTML = "";
		document.getElementById('availabelBeds').innerHTML = "";
		if (document.getElementById('estimateAmount') != null)
			document.getElementById('estimateAmount').value = document.getElementById('opIpcharge').value;
		if (document.getElementById('estimtAmount') != null)
			document.getElementById('estimtAmount').innerHTML = document.getElementById('opIpcharge').value;
	}

	if (selectedbedtype == '') {
		populateBedTypes();
		populateWards();
		setSelectedIndex(bedTypeObj, '');
		setSelectedIndex(wardObj, '');
	}

	if (selectedbedtype != '') getWardNames();

	// Get the defaulted ward if selected.
	selectedward = wardObj.value;
	selectedbedtype = bedTypeObj.value;

	if (document.mainform.bed_id) {
		if (selectedbedtype != '' && selectedward != '') getBedNames();
		else {
			var bedObj = document.mainform.bed_id;
			bedObj.length = 1;
			bedObj.options[bedObj.length - 1].text = getString("js.registration.patient.commonselectbox.defaultText");
			bedObj.options[bedObj.length - 1].value = "";
		}
		setSelectedIndex(document.mainform.bed_id, '');
	}

	if (selectedbedtype != '' && selectedward != '') {
		populateBedCharge();
	}
} //onBedTypeChange()

/* Function to load ward related bed types.
 * If ward has single bed type, the bed type is defaulted and
 * bed names for the bed type and ward are loaded.
 */

function onWardChange() {
	var bedTypeObj = document.mainform.bed_type;
	var wardObj = document.mainform.ward_id;

	var selectedbedtype = bedTypeObj.value;
	var selectedward = wardObj.value;

	if (selectedbedtype == '' || selectedward == '') {
		document.getElementById('bedAdvance').innerHTML = "";
		document.getElementById('initialAmount').innerHTML = "";
		document.getElementById('availabelBeds').innerHTML = "";
		if (document.getElementById('estimateAmount') != null)
			document.getElementById('estimateAmount').value = document.getElementById('opIpcharge').value;
		if (document.getElementById('estimtAmount') != null)
			document.getElementById('estimtAmount').innerHTML = document.getElementById('opIpcharge').value;
	}

	if (selectedward == '') {
		populateBedTypes();
		populateWards();
		setSelectedIndex(bedTypeObj, '');
		setSelectedIndex(wardObj, '');
	}

	if (selectedward != '') {
		document.mainform.ipwardname.value = selectedward;
		getWardBedTypes();
	}

	// Get the defaulted bed type if selected.
	selectedbedtype = bedTypeObj.value;
	selectedward = wardObj.value;

	if (document.mainform.bed_id) {
		if (selectedbedtype != '' && selectedward != '') getBedNames();
		else {
			var bedObj = document.mainform.bed_id;
			bedObj.length = 1;
			bedObj.options[bedObj.length - 1].text = getString("js.registration.patient.commonselectbox.defaultText");
			bedObj.options[bedObj.length - 1].value = "";
		}
		setSelectedIndex(document.mainform.bed_id, '');
	}

	if (selectedbedtype != '' && selectedward != '') {
		populateBedCharge();
	}
} //onWardChange()

/* Function to get Ward related bed types. */

function getWardBedTypes() {
	var bedTypeObj = document.mainform.bed_type;
	var wardObj = document.mainform.ward_id;
	var selectedbedtype = bedTypeObj.value;
	var selectedward = wardObj.value;

	if (document.mainform.ipfreebeds) document.mainform.ipfreebeds.value = 0;
	document.getElementById('availabelBeds').innerHTML = "0";

	// Empty bed types
	bedTypeObj.length = 1;
	bedTypeObj.options[bedTypeObj.length - 1].text = getString("js.registration.patient.commonselectbox.defaultText");
	bedTypeObj.options[bedTypeObj.length - 1].value = "";

	if (selectedward != '') {
		var ajaxobj = newXMLHttpRequest();
		var url = cpath + '/pages/registration/regUtils.do?_method=getBedTypesForWard&selectedward=' + selectedward;
		var freebeds = 0;
		ajaxobj.open("POST", url.toString(), false);
		ajaxobj.send(null);
		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var bedtypes =" + ajaxobj.responseText);
					if (bedtypes != null && bedtypes != '') {
						var len = bedtypes.length;
						for (var i = 0; i < len; i++) {
							var record = bedtypes[i];
							bedTypeObj.length = bedTypeObj.length + 1;
							bedTypeObj.options[bedTypeObj.length - 1].text = record.bed_type;
							bedTypeObj.options[bedTypeObj.length - 1].value = record.bed_type;
							freebeds = freebeds + record.freebeds;
						}
					}
					if (freebeds == 0) {
						document.mainform.ipfreebeds.value = 0;
						document.getElementById('availabelBeds').innerHTML = "0";
						showMessage("js.registration.patient.no.free.beds");
						if (isAllocBed) return false;
					} else {
						document.mainform.ipfreebeds.value = freebeds;
						document.getElementById('availabelBeds').innerHTML = freebeds;
					}
				}
			}
		}
	} else {
		document.mainform.ipfreebeds.value = 0;
		document.getElementById('availabelBeds').innerHTML = "0";
		bedTypeObj.selectedIndex = 0;
		wardObj.selectedIndex = 0;
		bedTypeObj.length = 1;
	}

	if (bedTypeObj.length == 2)
		setSelectedIndex(bedTypeObj, bedTypeObj.options[1].value);
	else setSelectedIndex(bedTypeObj, selectedbedtype);

	if (dutyDoctorReq == 'I') getICUStatus();
	else if (dutyDoctorReq == 'A') dutyDoctorMand = true;
	else if (dutyDoctorReq == 'N') dutyDoctorMand = false;
}

/* Function to get bed type related wards. */

function getWardNames() {
	var bedTypeObj = document.mainform.bed_type;
	var wardObj = document.mainform.ward_id;
	var selectedward = wardObj.value;
	var selectedbedtype = bedTypeObj.value;

	if (document.mainform.ipfreebeds)
		document.mainform.ipfreebeds.value = 0;
	document.getElementById('availabelBeds').innerHTML = "0";

	// Empty wards
	wardObj.length = 1;
	wardObj.options[wardObj.length - 1].text = getString("js.registration.patient.commonselectbox.defaultText");
	wardObj.options[wardObj.length - 1].value = "";

	if (selectedbedtype != '') {
		var ajaxobj = newXMLHttpRequest();
		var url = cpath + '/pages/registration/regUtils.do?_method=getWardnamesForBedType&selectedbedtype=' + encodeURIComponent(selectedbedtype);
		var freebeds = 0;
		var ajaxobj = newXMLHttpRequest();
		ajaxobj.open("POST", url.toString(), false);
		ajaxobj.send(null);
		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var wards =" + ajaxobj.responseText);
					if (wards != null && wards != '') {
						var len = wards.length;
						for (var i = 0; i < len; i++) {
							var record = wards[i];
							wardObj.length = wardObj.length + 1;
							wardObj.options[wardObj.length - 1].text = record.ward_name;
							wardObj.options[wardObj.length - 1].value = record.ward_no;
							freebeds = freebeds + record.freebeds;
						}
					}
					if (freebeds == 0) {
						document.mainform.ipfreebeds.value = 0;
						document.getElementById('availabelBeds').innerHTML = "0";
						showMessage("js.registration.patient.no.free.beds");
						if (isAllocBed) return false;
					} else {
						document.mainform.ipfreebeds.value = freebeds;
						document.getElementById('availabelBeds').innerHTML = freebeds;
					}
				}
			}
		}
	} else {
		document.mainform.ipfreebeds.value = 0;
		document.getElementById('availabelBeds').innerHTML = "0";
		bedTypeObj.selectedIndex = 0;
		wardObj.selectedIndex = 0;
		wardObj.length = 1;
	}

	if (wardObj.options.length == 2) setSelectedIndex(wardObj, wardObj.options[1].value);
	else setSelectedIndex(wardObj, selectedward);

	if (dutyDoctorReq == 'I') getICUStatus();
	else if (dutyDoctorReq == 'A') dutyDoctorMand = true;
	else if (dutyDoctorReq == 'N') dutyDoctorMand = false;
}


/*
 * Displays bed charge for the selected bed type and organization
 * (selected organization for corporate patient type, else general organization)
 */

function populateBedCharge() {
	var chargeType = 'D';
	if (document.getElementById("daycare_status") && document.getElementById("daycare_status").checked) chargeType = 'H';

	var selectedbedtype = document.mainform.bed_type.value;

	var orgObj = document.mainform.organization;
	var organization = 'ORG0001';

	if (orgObj.value == '') organization = "ORG0001";
	else organization = orgObj.value;

	for (i = 0; i < bedCharges.length; i++) {
		item = bedCharges[i];
		if (item["bedtype"] == selectedbedtype) {
			if (item["organization"] == organization) {
				var bedAmount = item.bed_charge - item.bed_charge_discount
								+ item.nursing_charge - item.nursing_charge_discount
								+ item.maintainance_charge - item.maintainance_charge_discount
								+ item.duty_charge - item.duty_charge_discount;
				var min_charge = item.daycare_slab_1_charge - item.daycare_slab_1_charge_discount;
				var slab1_charge = item.daycare_slab_2_charge - item.daycare_slab_2_charge_discount;
				var slab2_charge = item.daycare_slab_3_charge - item.daycare_slab_3_charge_discount;
				if (chargeType == 'H') bedAmount = item.hourly_charge - item.hourly_charge_discount;
				if (luxuryTaxApplicableOn == 'B') bedAmount += (item.luxary_tax * (item.bed_charge - item.bed_charge_discount)) / 100;
				else bedAmount += (item.luxary_tax * (bedAmount)) / 100;

				document.mainform.ipbedavance.value = bedAmount;

				if (chargeType == 'H') {
					var bedChargeinnerHTML = '';
					if (bedAmount != 0) bedChargeinnerHTML = '-' + formatAmountPaise(getPaise(bedAmount)) + ' Per Hour';

					document.getElementById('bedAdvance').innerHTML = formatAmountPaise(getPaise(min_charge))
																	+ '/' + formatAmountPaise(getPaise(slab1_charge)) + '/'
																	+ formatAmountPaise(getPaise(slab2_charge)) + bedChargeinnerHTML;
				} else document.getElementById('bedAdvance').innerHTML = formatAmountPaise(getPaise(bedAmount)) + ' Per Day';

				document.getElementById('initialAmount').innerHTML = formatAmountPaise(getPaise(item.initial_payment - item.initial_payment_discount));

				var display = displayEstimatedTotalAmountTable(organization);
				if (display) {
					document.getElementById("bedAdvance").style.display = 'block';
					document.getElementById("initialAmount").style.display = 'block';
				}else {
					document.getElementById("bedAdvance").style.display = 'none';
					document.getElementById("initialAmount").style.display = 'none';
				}
			}
		}
	}
	estimateTotalAmount();
}

/* Function to get bed names when bed type and ward is selected */

function getBedNames() {
	var bedTypeObj = document.mainform.bed_type;
	var wardObj = document.mainform.ward_id;
	var selectedward = wardObj.value;
	var selectedbedtype = bedTypeObj.value;

	var url = cpath + '/pages/registration/regUtils.do?_method=getBednamesForWard&selectedward=' + selectedward + '&selectedbedtype=' + selectedbedtype;
	var bedObj = document.mainform.bed_id;

	bedObj.length = 1;
	bedObj.options[bedObj.length - 1].text = getString("js.registration.patient.commonselectbox.defaultText");
	bedObj.options[bedObj.length - 1].value = "";
	var ajaxobj = newXMLHttpRequest();
	ajaxobj.open("POST", url.toString(), false);
	ajaxobj.send(null);
	if (ajaxobj) {
		if (ajaxobj.readyState == 4) {
			if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
				eval("var beds =" + ajaxobj.responseText);
				if (beds != null && beds != '') {
					var len = beds.length;
					for (var i = 0; i < len; i++) {
						var record = beds[i];
						bedObj.length = bedObj.length + 1;
						bedObj.options[bedObj.length - 1].text = record.bed_name;
						bedObj.options[bedObj.length - 1].value = record.bed_id;
					}
				}
			}
		}
	}
}

var dutyDoctorMand = false;

function getICUStatus() {
	var bedTypeObj = document.mainform.bed_type;
	var selectedbedtype = bedTypeObj.value;
	if (selectedbedtype != '') {
		var reqObject = newXMLHttpRequest();
		var url = cpath + '/pages/registration/regUtils.do?_method=getICUStatus&bed_type=' + selectedbedtype;

		reqObject.open("POST", url.toString(), false);
		reqObject.send(null);
		if (reqObject.readyState == 4) {
			if ((reqObject.status == 200) && (reqObject.responseText != null)) {
				if (eval(reqObject.responseText) == "Y") {
					dutyDoctorMand = true;
				} else {
					dutyDoctorMand = false;
				}
			}
		}
	}
	return false;
}

function isNewReg() {
	var radios = document.mrnoform.regType;
	if (radios == null) return false;
	for (var i = 0; i < radios.length; i++) {
		if (radios[i].checked == true) {
			var value = radios[i].value;
			return value == 'new' ? true : false;
		}
	}
	return false;
}

// Function called when Insurance Company is changed in UI

function onLoadTpaList(spnsrIndex) {
	loadTpaList(spnsrIndex);
	tpaChange(spnsrIndex);
	insuCatChange(spnsrIndex);
	RatePlanList();
	ratePlanChange();
}

function loadInsuranceCompList(spnsrIndex) {

	var categoryId = '';
	if (document.mainform.patient_category_id)
		categoryId = document.mainform.patient_category_id.value;

	var tpaIdObj = null;
	var insuCompIdObj = null;

	if (spnsrIndex == 'P') {
		tpaIdObj = getPrimarySponsorObj();
		insuCompIdObj = getPrimaryInsuObj();

	}else if (spnsrIndex == 'S') {
		tpaIdObj = getSecondarySponsorObj();
		insuCompIdObj = getSecondaryInsuObj();
	}

	var insCompList = insuCompanyDetails; // the default set: all Ins Comps
	var defaultInsComp = "";
	var visitType = screenid == 'ip_registration'? 'i': 'o';

	if (categoryId != '') {
		// category is enabled, the list of Insurance Comps. is restricted
		for (var i = 0; i < categoryJSON.length; i++) {
			var item = categoryJSON[i];
			if (categoryId == item.category_id) {
				if (visitType == 'i') {
					if (!empty(item.ip_allowed_insurance_co_ids) && item.ip_allowed_insurance_co_ids != '*') {
						var insCompIdList = item.ip_allowed_insurance_co_ids.split(',');
						var ip_allowedInsComps = [];
						for (var i = 0; i < insCompIdList.length; i++)
						ip_allowedInsComps.push(findInList(insuCompanyDetails, "insurance_co_id", insCompIdList[i]));
						// override the insCompList with allowed Ins Comps.
						insCompList =  !empty(ip_allowedInsComps) ? ip_allowedInsComps : insCompList;
					}
					if (spnsrIndex == 'P')
						defaultInsComp = item.primary_ip_insurance_co_id;
					else if (spnsrIndex == 'S')
						defaultInsComp = item.secondary_ip_insurance_co_id;

					break;
				 } else {
				 	if (!empty(item.op_allowed_insurance_co_ids) && item.op_allowed_insurance_co_ids != '*') {
						var insCompIdList = item.op_allowed_insurance_co_ids.split(',');
						var op_allowedInsComps = [];
						for (var i = 0; i < insCompIdList.length; i++)
						op_allowedInsComps.push(findInList(insuCompanyDetails, "insurance_co_id", insCompIdList[i]));
						// override the insCompList with allowed Ins Comps.
						insCompList =  !empty(op_allowedInsComps) ? op_allowedInsComps : insCompList;
					}
					if (spnsrIndex == 'P')
						defaultInsComp = item.primary_op_insurance_co_id;
					else if (spnsrIndex == 'S')
						defaultInsComp = item.secondary_op_insurance_co_id;

					break;
				}
			}
		}
	}

	// Empty Ins Comps in ins company dropdown
	var index = 0;
	if (insuCompIdObj != null) {
		insuCompIdObj.length = 1;
		insuCompIdObj.options[index].text = "-- Select --";
		insuCompIdObj.options[index].value = "";
	}

	// Add all the allowed InsComps for patient category and insurance company.
	for (var i = 0; i < insCompList.length; i++) {
		var exists = false;
		var item = insCompList[i];
		for (var k = 0; k < insuCompanyDetails.length; k++) {
			var insItem = insuCompanyDetails[k];
			if (!empty(item) && !empty(insItem) && (item.insurance_co_id == insItem.insurance_co_id)) {
				exists = true;
				break;
			}
		}
		if (exists) {
			index++;
			if (insuCompIdObj != null) {
				insuCompIdObj.length = index + 1;
				insuCompIdObj.options[index].text = item.insurance_co_name;
				insuCompIdObj.options[index].value = item.insurance_co_id;
			}
		}
	}

	if (allowBillNowInsurance == 'true' || (document.mainform.bill_type != null && document.mainform.bill_type.value == 'C')) {
		// if there is a default ins. company for patient category, set it
		if (insuCompIdObj != null) {
			if (!empty(defaultInsComp)) {
			setSelectedIndex(insuCompIdObj, defaultInsComp);

			} else if (document.mainform.patient_category_id && insCompList.length == 1) {
				setSelectedIndex(insuCompIdObj, insCompList[0].insurance_co_id);
			}
			insuCompIdObj.removeAttribute("disabled");
		}

	} else {
		if (insuCompIdObj != null) {
			setSelectedIndex(insuCompIdObj, "");
			insuCompIdObj.disabled = true;
		}
	}
}

/*
 * There are 4 different ways to load the list of TPAs based on:
 *  - Whether Category is enabled or not
 *  - Whether insurance module is enabled or not.
 * If category is enabled, the list of TPAs for new cases is limited to what is allowed by
 * the category. If insurance module is enabled, we can connect to an existing case, or create
 * a new case for any of the (allowed) TPAs.
 */

/* Function called in 4 places, when Insurance company is changed in UI
	(or) existing patient details are loaded (loadInsurancePolicyDetails())
	(or) Member ship autocomplete is changed (loadPolicyDetails)
	(or) patient category is changed (onChangeCategory())
*/

function loadTpaList(spnsrIndex) {

	var loadTpaOnInsChange = (isModAdvanceIns || isModInsurance) ? true : false;

	var tpaObj = null;
	var insuCompObj = null;
	var planTypeObj = null;
	var planObj = null;

	if (spnsrIndex == 'P') {
		tpaObj = getPrimarySponsorObj();
		insuCompObj = getPrimaryInsuObj();
		planTypeObj = getPrimaryPlanTypeObj();
		planObj = getPrimaryPlanObj();

	}else if (spnsrIndex == 'S') {
		tpaObj = getSecondarySponsorObj();
		insuCompObj = getSecondaryInsuObj();
		planTypeObj = getSecondaryPlanTypeObj();
		planObj = getSecondaryPlanObj();
	}

	var categoryId = '';
	if (document.mainform.patient_category_id)
		categoryId = document.mainform.patient_category_id.value;

	var insCompanyId = '';
	if (insuCompObj != null)
		insCompanyId = insuCompObj.value;

	var planType = '';
	if (planTypeObj != null) {
		planType = planTypeObj.value;

		// Empty plan types in plan type dropdown
		var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
		planTypeObj.options.length = 1;
		planTypeObj.options[0] = optn;
	}

	var plan = '';
	if (planObj != null) {
		plan = planObj.value;

		// Empty plans in plan dropdown
		var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
		planObj.options.length = 1;
		planObj.options[0] = optn;
	}

	var mainSpnsrIndex = spnsrIndex; // getMainSponsorIndex();

	var mainInsuObj = null;
	var mainInsCompanyId = '';
	if (mainSpnsrIndex == 'P') mainInsuObj = getPrimaryInsuObj();
	else if (mainSpnsrIndex == 'S') mainInsuObj = getSecondaryInsuObj();
	if (mainInsuObj != null)
		mainInsCompanyId = mainInsuObj.value;

	// gIsInsurance - advance insurance and company not empty, variable for first of category check & display patient amounts.
	if (isModAdvanceIns && mainInsCompanyId != '') gIsInsurance = true;
	else gIsInsurance = false;

	if (!gIsInsurance) {
		if (screenid == 'reg_registration') {
			document.getElementById('patientAmountId').style.display = 'none';
			document.getElementById('patientAmountId1').style.display = 'none';
		}
		if (planTypeObj != null) {
			planTypeObj.selectedIndex = 0;
			insuCatChange(spnsrIndex);
		}
		if (document.mainform.op_type != null
				&& (document.mainform.op_type.value != "F" && document.mainform.op_type.value != "D"))
			if (tpaObj != null) tpaObj.disabled = false;
		//if (insuCompObj != null)
			//setSelectedIndex(insuCompObj, "");
	}

	if (gIsInsurance) {
		if (screenid == 'reg_registration') {
			document.getElementById('patientAmountId').style.display = 'block';
			document.getElementById('patientAmountId1').style.display = 'block';
			document.getElementById('patietConsultAmount').value = "0";
		}

		if (empty(mainSpnsrIndex) || mainSpnsrIndex == spnsrIndex) {

			var j = 2;
			// Load plan types related to insurance company
			for (var i = 0; i < insuCatNames.length; i++) {
				var ele = insuCatNames[i];
				if (ele.insurance_co_id == mainInsCompanyId && ele.status == "A") {
					var optn = new Option(ele.category_name, ele.category_id);
					planTypeObj.options.length = j;
					planTypeObj.options[j-1] = optn;
					j++;
					planType = ele.category_id;
				}
			}
		}
	}

	var ratePlanObj = document.mainform.organization;
	var selectedRatePlan = ratePlanObj.value;
	var insCompDefaultRatePlan = '';

	var selectedIns = findInList(insuCompanyDetails, "insurance_co_id", mainInsCompanyId);
	if (!empty(selectedIns) && !empty(selectedIns.default_rate_plan)) {
		insCompDefaultRatePlan = selectedIns.default_rate_plan;
	}
	if (!empty(insCompDefaultRatePlan))
		setSelectedIndex(ratePlanObj, insCompDefaultRatePlan);
	else
		setSelectedIndex(ratePlanObj, selectedRatePlan);

	var insCompTpaList = filterList(companyTpaList, 'insurance_co_id', insCompanyId);
	if (empty(insCompTpaList)) {
		insCompTpaList = tpanames;
	}

	// Loading TPAs follows....

	// For revisit if tpa exists, need to set that back after TPAs are loaded.
	var previousTpa = (tpaObj != null) ? tpaObj.value : "";

	var newCaseSuffix = '';
	var tpaList = tpanames; // the default set: all TPAs
	var defaultTpa = "";
	var visitType = screenid == 'ip_registration'? 'i': 'o';
	if (categoryId != '') {
		// category is enabled, the list of TPAs is restricted
		for (var i = 0; i < categoryJSON.length; i++) {
			var item = categoryJSON[i];
			if (categoryId == item.category_id) {
				document.mainform.reg_charge_applicable.value = item.registration_charge_applicable;
				if(visitType == 'i') {
					if ((item.ip_allowed_sponsors == null ||item.ip_allowed_sponsors=='')) {
						tpaList = [];
						loadSelectBox(insuCompObj, [], 'insurance_co_name',
							'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
					}else if ((item.ip_allowed_sponsors != '*')) {
						var tpaIdList = item.ip_allowed_sponsors.split(',');
						var ip_allowedTpas = [];
						for (var i = 0; i < tpaIdList.length; i++)
						ip_allowedTpas.push(findInList(tpanames, "tpa_id", tpaIdList[i]));
						// override the tpaList with allowed TPAs.
						tpaList =  ip_allowedTpas ;
					} else {
						tpaList = tpaList;
					}
					if (spnsrIndex == 'P')
						defaultTpa = item.primary_ip_sponsor_id;
					else if (spnsrIndex == 'S')
						defaultTpa = item.secondary_ip_sponsor_id
					break;
				 } else {
				 	if ((item.op_allowed_sponsors == null ||item.op_allowed_sponsors=='')) {
						tpaList = [];
						loadSelectBox(insuCompObj, [], 'insurance_co_name',
							'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
					}else if ((item.op_allowed_sponsors != '*')) {
						var tpaIdList = item.op_allowed_sponsors.split(',');
						var op_allowedTpas = [];
						for (var i = 0; i < tpaIdList.length; i++)
						op_allowedTpas.push(findInList(tpanames, "tpa_id", tpaIdList[i]));
						// override the tpaList with allowed TPAs.
						tpaList = !empty(op_allowedTpas) ? op_allowedTpas : tpaList;
					} else {
						tpaList = tpaList;
					}
					if (spnsrIndex == 'P')
						defaultTpa = item.primary_op_sponsor_id;
					else if (spnsrIndex == 'S')
						defaultTpa = item.secondary_op_sponsor_id;
					break;
				 }
			}
		}
	} else {
		document.mainform.reg_charge_applicable.value = "Y";
	}

	if (tpaObj != null) {
		// Empty TPAs in tpa dropdown
		tpaObj.length = 1;
		var index = 0;

		tpaObj.options[index].text = getString("js.registration.patient.commonselectbox.defaultText");
		tpaObj.options[index].value = "";

		var tpaObjName = tpaObj.name;
		var sponsorType = '';
		if (tpaObjName.startsWith('primary_sponsor')) sponsorType = 'I';
		else if (tpaObjName.startsWith('primary_corporate')) sponsorType = 'C';
		else if (tpaObjName.startsWith('primary_national')) sponsorType = 'N';
		else if (tpaObjName.startsWith('secondary_sponsor')) sponsorType = 'I';
		else if (tpaObjName.startsWith('secondary_corporate')) sponsorType = 'C';
		else if (tpaObjName.startsWith('secondary_national')) sponsorType = 'N';
		else {}

		// Add all the allowed TPAs for patient category and insurance company as new cases.
		for (var i = 0; i < tpaList.length; i++) {
			var exists = false;
			var item = tpaList[i];

			item = findInList(tpanames, "tpa_id", item.tpa_id);
			if (sponsorType == 'I' && item.sponsor_type == 'I') {
				for (var k = 0; k < insCompTpaList.length; k++) {
					var insItem = insCompTpaList[k];
					if (!empty(item) && !empty(insItem) && (item.tpa_id == insItem.tpa_id)) {
						exists = true;
						break;
					}
				}
				if (exists) {
					index++;
					tpaObj.length = index + 1;
					tpaObj.options[index].text = item.tpa_name + newCaseSuffix;
					tpaObj.options[index].value = item.tpa_id;
				}
			}else {
				if (sponsorType == item.sponsor_type) {
					index++;
					tpaObj.length = index + 1;
					tpaObj.options[index].text = item.tpa_name + newCaseSuffix;
					tpaObj.options[index].value = item.tpa_id;
				}
			}
		}

		if (allowBillNowInsurance == 'true' || (document.mainform.bill_type != null && document.mainform.bill_type.value == 'C')) {
			// if the patient is for revisit and TPA exists, set it
			if (!empty(previousTpa)) {
				setSelectedIndex(tpaObj, previousTpa);

				// if there is a default tpa for patient category, set it (doesn't work well if there is a case for the same TPA)
			} else if (!empty(defaultTpa)) {
				setSelectedIndex(tpaObj, defaultTpa);

				// if there is a default tpa for insurance company, set it
			} else if (insCompTpaList.length == 1) {
				setSelectedIndex(tpaObj, insCompTpaList[0].tpa_id);
			}
			if (document.mainform.op_type != null
					&& (document.mainform.op_type.value != "F" && document.mainform.op_type.value != "D"))
				tpaObj.disabled = false;
		} else {
			setSelectedIndex(tpaObj, "");
			tpaObj.disabled = true;
		}
	}



	if (insuCompObj != null)
		sortDropDown(insuCompObj);
	if (tpaObj != null)
		sortDropDown(tpaObj);
	if (planTypeObj != null)
		sortDropDown(planTypeObj);
	if (planObj)
		sortDropDown(planObj);

	if (document.mainform.patient_category_id &&
			 planTypeObj != null && planTypeObj.options.length == 2) {
		setSelectedIndex(planTypeObj, planType);
	}


}

function onCorporateChange(spnsrIndex) {

	var tpaObj = null;
	var tpa = null;
	var approvalLimitObj = null;
	var uploadRowObj = null;

	var employeeIdObj = null;
	var empNameObj = null;
	var empRelationObj = null;

	if (spnsrIndex == 'P') {
		tpaObj = getPrimarySponsorObj();
		approvalLimitObj = getPrimaryApprovalLimitObj();
		uploadRowObj = getPrimaryUploadRowObj();

		employeeIdObj = getPrimaryMemberIdObj();
		empNameObj = getPrimaryPatientHolderObj();
		empRelationObj = getPrimaryPatientRelationObj();

	}else if (spnsrIndex == 'S') {
		tpaObj = getSecondarySponsorObj();
		approvalLimitObj = getSecondaryApprovalLimitObj();
		uploadRowObj = getSecondaryUploadRowObj();

		employeeIdObj = getSecondaryMemberIdObj();
		empNameObj = getSecondaryPatientHolderObj();
		empRelationObj = getSecondaryPatientRelationObj();

	}
	if (tpaObj != null && employeeIdObj != null) {
		var tpaId = tpaObj.value;
		approvalLimitObj.value = "";
		employeeIdObj.value = "";
		empNameObj.value = "";
		empRelationObj.value = "";

		if (tpaId != '') {
			tpa = findInList(tpanames, "tpa_id", tpaId);
		}
		if (tpa != null) {
			if (uploadRowObj != null) {
				if (tpa.scanned_doc_required == 'N')
					uploadRowObj.style.display = 'none';
				else
					uploadRowObj.style.display = 'table-row';
			}
		}
		ratePlanChange();
	}
}

function onNationalSponsorChange(spnsrIndex) {

	var tpaObj = null;
	var tpa = null;
	var approvalLimitObj = null;
	var uploadRowObj = null;

	var nationalIdObj = null;
	var citizenNameObj = null;
	var patRelationObj = null;

	if (spnsrIndex == 'P') {
		tpaObj = getPrimarySponsorObj();
		approvalLimitObj = getPrimaryApprovalLimitObj();
		uploadRowObj = getPrimaryUploadRowObj();

		nationalIdObj = getPrimaryMemberIdObj();
		citizenNameObj = getPrimaryPatientHolderObj();
		patRelationObj = getPrimaryPatientRelationObj();

	}else if (spnsrIndex == 'S') {
		tpaObj = getSecondarySponsorObj();
		approvalLimitObj = getSecondaryApprovalLimitObj();
		uploadRowObj = getSecondaryUploadRowObj();

		nationalIdObj = getSecondaryMemberIdObj();
		citizenNameObj = getSecondaryPatientHolderObj();
		patRelationObj = getSecondaryPatientRelationObj();
	}

	if (tpaObj != null && nationalIdObj != null) {
		var tpaId = tpaObj.value;
		approvalLimitObj.value = "";
		nationalIdObj.value = "";
		citizenNameObj.value = "";
		patRelationObj.value = "";

		if (tpaId != '') {
			tpa = findInList(tpanames, "tpa_id", tpaId);
		}
		if (tpa != null) {
			if (uploadRowObj != null) {
				if (tpa.scanned_doc_required == 'N')
					uploadRowObj.style.display = 'none';
				else
					uploadRowObj.style.display = 'table-row';
			}
		}
		ratePlanChange();
	}
}


// Function called in 3 places, when TPA is changed (tpaChange())
// (or) Rate plans are loaded (RatePlanList())
// (or) to load existing patient details (loadInsurancePolicyDetails())

var gSelectedTPA = null;
var gSelectedPlan = null;
var gSelectedRatePlan = null;
var gSelectedPatientCategory = null;
function ratePlanChange() {

	var patientCategoryObj	= document.mainform.patient_category_id;
	var patientCategory		= "";
	if (patientCategoryObj != null) patientCategory = patientCategoryObj.value;

	if (gSelectedPatientCategory == patientCategory) {
		gPatientCategoryChanged = false;

	} else {
		gSelectedPatientCategory = patientCategory;
		gPatientCategoryChanged = true;
		return;
	}

	var plan = "", tpaId = "";
	var isRatePlanChanged = false;
	var isTPAorPlanChanged = false;

	var ratePlanObj = document.mainform.organization;
	var ratePlan = ratePlanObj.value;

	var planObj = null;
	var tpaObj = null;

	var spnsrIndex = getMainSponsorIndex();

	if (spnsrIndex == 'P') {
		planObj = getPrimaryPlanObj();
		tpaObj = getPrimarySponsorObj();

	}else if (spnsrIndex == 'S') {
		planObj = getSecondaryPlanObj();
		tpaObj = getSecondarySponsorObj();
	}

	if (planObj != null) plan = planObj.value;
	if (tpaObj != null) tpaId = tpaObj.value;

	if (gSelectedRatePlan == ratePlan && gSelectedTPA == tpaId && gSelectedPlan == plan) return;

	if (gSelectedRatePlan == ratePlan){}
	else {
		gSelectedRatePlan = ratePlan;
		isRatePlanChanged = true;
	}

	if (gSelectedPlan == plan) {}
	else {
		gSelectedPlan = plan;
		isTPAorPlanChanged = true;
	}

	if (gSelectedTPA == tpaId) {}
	else {
		gSelectedTPA = tpaId;
		isTPAorPlanChanged = true;
	}

	if (isRatePlanChanged || isTPAorPlanChanged)
		resetOrderDialogRatePlanInsurance(gSelectedRatePlan, gSelectedTPA, gSelectedPlan, isRatePlanChanged);
}

function resetOrderDialogRatePlanInsurance(n_orgId, n_tpaId, n_plan, n_isRatePlanChanged) {

	if (n_isRatePlanChanged && document.mrnoform.group.value == "ipreg" && screenid == "ip_registration") {
		populateBedCharge();
	}

	if (screenid != 'ip_registration' && screenid != 'out_pat_reg') {

		if (!empty(addOrderDialog.getChargeRequest)) {
			if (YAHOO.lang.isArray(addOrderDialog.getChargeRequest)) {
				for (var i=0; i<getChargeRequest.length; i++) {
					YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest[i] , addOrderDialog.onGetCharge , true) ;
				}
			}else {
				YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest , addOrderDialog.onGetCharge , true) ;
			}
		}

		// clear the order table, since new rates are now applicable
		clearOrderTable(0);

		// tell order dialog the new Plan, so that it can use new rates for co-pay calculation.
		addOrderDialog.setInsurance((n_tpaId != ''), n_plan);

		// tell orderd dialog the new org ID, so that it can use new rates
		if (addOrderDialog) addOrderDialog.setOrgId(n_orgId);

		// tell order dialog if patient has insurance for restricting doctor consultation per visit.
		if( eClaimModule == 'Y' && !empty(n_plan) && n_plan != 0)
			addOrderDialog.restictionType = 'Doctor';
		else
			addOrderDialog.restictionType = null;

		// Update the list of items in the order dialog: this depends on the rate plan
		var url = orderItemsUrl + '&orgId=' + n_orgId + '&visitType=o' + "&center_id=" + centerId + "&tpa_id=" + n_tpaId;
		YAHOO.util.Connect.asyncRequest('GET', url, {
			success: onNewItemList,
			failure: null
		});

		disableRegBillButton();
		calculateTotalEstimateAmount();
	}
}

// Display the estimated total amount field set and disable register & pay based on action rights and rate plan
function disableRegBillButton() {
	if (document.mainform.regBill == null)
		return;
	var organizationId = document.mainform.organization.value;
	var display = displayEstimatedTotalAmountTable(organizationId);
	var regBillDisabled = document.mainform.regBill.disabled;
	if (display) {
		document.getElementById("estimatedTotalAmountFieldSet").style.display = 'block';
		if ((document.mainform.regBill != null)) {
			var newType = document.mainform.bill_type.value;
			if (document.mainform.bill_type != null
					&& document.mainform.bill_type.value == 'P' && !empty(billingCounterId))
				document.mainform.regBill.disabled = false;
			else
				document.mainform.regBill.disabled = regBillDisabled;
		}
	}else {
		document.getElementById("estimatedTotalAmountFieldSet").style.display = 'none';
		document.mainform.regBill.disabled = true;
	}

	if (document.mainform.regBill != null) {
		var disable = document.mainform.regBill.disabled;
		document.getElementById("paymentTab").style.display = disable ? 'none' : 'block';
	}
}

function displayEstimatedTotalAmountTable(rateplan) {
	var allRatesDisplay = (!empty(showChargesAllRatePlan) && showChargesAllRatePlan == 'A') ? true : false;
	if (!allRatesDisplay) {
		var generalRatesDisplay = (!empty(showChargesGeneralRatePlan) && showChargesGeneralRatePlan == 'A') ? true : false;
		if (rateplan == 'ORG0001' && generalRatesDisplay) {
			return generalRatesDisplay;
		}
	}
	return allRatesDisplay;
}

function calculateTotalEstimateAmount() {
	var doctorObj = document.mainform.doctor;
	var chargeTypeObj = document.mainform.doctorCharge;
	var doctorCharge = (chargeTypeObj) ? chargeTypeObj.value : '';

	getConsultationTypes(document.mainform.organization.value);

	if (chargeTypeObj) {
		setSelectedIndex(chargeTypeObj, "");
		setSelectedIndex(chargeTypeObj, doctorCharge);
	}

	if (doctorObj) {
		var  doctorId = doctorObj.value;
		if (!empty(doctorId)) getDoctorCharge();
	}

	loadPreviousUnOrderedPrescriptions();

	if (trim(document.mrnoform.mrno.value) != "" && gSelectedRatePlan == null && gSelectedTPA == null && gSelectedPlan  == null) return;
	if (category != null && (category != 'SNP' || !empty(scheduleName)))
		loadSchedulerOrders();
	estimateTotalAmount();
}

// For the previous prescriptions - patient and sponsor amts have to be calculated so post the orders after
// ins. comp, tpa and plan are loaded.
function loadPreviousUnOrderedPrescriptions() {
	if (screenid != 'ip_registration' && screenid != 'out_pat_reg') {

		if (!empty(addOrderDialog.getChargeRequest)) {
			if (YAHOO.lang.isArray(addOrderDialog.getChargeRequest)) {
				for (var i=0; i<getChargeRequest.length; i++) {
					YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest[i] , addOrderDialog.onGetCharge , true) ;
				}
			}else {
				YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest , addOrderDialog.onGetCharge , true) ;
			}
		}

		clearOrderTable(0);
	}
	if (document.mainform.op_type != null && (screenid != "out_pat_reg")
			&& (document.mainform.op_type.value == 'F' || document.mainform.op_type.value == 'D')) {
		if (gTestPrescriptions != null || gServicePrescriptions != null || gConsultationPrescriptions != null
			|| gDietPrescriptions != null || gStandingInstructions != null || gOperationPrescriptions != null) {
			orderPrescriptions();
		}
	}
	estimateTotalAmount();
}

var cachedConsultTypes = [];

function getConsultationTypes(orgId) {
	orgId = empty(orgId) ? 'ORG0001' : orgId;
	if (cachedConsultTypes[orgId] == undefined) {
		var ajaxobj = newXMLHttpRequest();
		var url = '../../pages/registration/regUtils.do?_method=getConsultationTypesForRateplan&orgId=' + orgId;
		ajaxobj.open("POST", url, false);
		ajaxobj.send(null);

		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var consultationTypes = " + ajaxobj.responseText);
					cachedConsultTypes[orgId] = consultationTypes;
				}
			}
		}
	}

	if(allow_all_cons_types_in_reg == 'N') {
		loadPreferenceConsultationTypes(document.orderDialogForm.doctorCharge);
		loadPreferenceConsultationTypes(document.mainform.doctorCharge);
	} else {
		loadSelectBox(document.orderDialogForm.doctorCharge, cachedConsultTypes[orgId], 'consultation_type', 'consultation_type_id', getString("js.registration.patient.commonselectbox.defaultText"), '');
		loadSelectBox(document.mainform.doctorCharge, cachedConsultTypes[orgId], 'consultation_type', 'consultation_type_id', getString("js.registration.patient.commonselectbox.defaultText.none"), '');
		sortDropDown(document.orderDialogForm.doctorCharge);
		sortDropDown(document.mainform.doctorCharge);
	}
}

function onNewItemList(response) {
	eval(response.responseText);
	// re-initialize the item list within the order dialog.
	addOrderDialog.setNewItemList(rateplanwiseitems);
}

function onDeptChange() {
	DeptChange();
	loadPreviousUnOrderedPrescriptions();
	if (category != null && (category != 'SNP' || !empty(scheduleName)))
		loadSchedulerOrders();
	estimateTotalAmount();
}

var isDoctorChange = false;

function DeptChange() {
	var deptId = document.mainform.dept_name.value;
	document.mainform.dept_allowed_gender.value = '';
	setDeptAllowedGender(deptId);

	document.mainform.doctor_name.removeAttribute("title");
	document.mainform.doctor_name.value = '';
	document.mainform.doctor.value = '';
	document.mainform.consFees.value = 0;
	document.mainform.opdocchrg.value = 0;
	if (document.getElementById("docConsultationFees") != null) {
		document.mainform.doctorCharge.selectedIndex = 0;
		document.getElementById("docConsultationFees").textContent = '';
	}
	estimateTotalAmount();

	//Initialize doctor auto complete and reset op type.
	// Doctor autocomplete is initialized when the department is changed.
	if (!isDoctorChange)
		initDoctorDept(deptId);
	if (screenid != "ip_registration")
		setDocRevistCharge(document.mainform.doctor.value);

	var unitSelect = document.mainform.unit_id;
	if (unitSelect != null) {
		loadDepartmentUnit(unitSelect, deptId);
	}

	setPatientComplaint();

	if (screenid != "ip_registration") calculateEstimateAmountOnDeptChange();
}

function calculateEstimateAmountOnDeptChange() {
	var estimateAmount = document.getElementById('estimateAmount').value;
	if (estimateAmount == '') {
		estimateAmount = 0;
	}
	if (document.mainform.consFees.value != '') {
		document.getElementById('estimtAmount').innerHTML =
					formatAmountPaise(getPaise(estimateAmount) - getPaise(document.mainform.consFees.value));

		document.getElementById('estimateAmount').value =
					formatAmountPaise(getPaise(estimateAmount) - getPaise(document.mainform.consFees.value));

		document.mainform.consFees.value = '';
		document.mainform.opdocchrg.value = '';
	}
}

function validateSchConsultation() {
	var form = document.mainform;
	var appointmentId = form.appointmentId.value;
	if (!empty(appointmentId)) {
		var primaryResource = getSchedulerPrimaryResource();
		var docChrgObj = document.mainform.doctorCharge;
		var docChrg = (docChrgObj != null) ? docChrgObj.value : "";
		setSelectedIndex(docChrgObj, docChrg);

		if (primaryResource.category == 'DOC') {
			if (!empty(primaryResource.consultation_type_id)
				&& primaryResource.consultation_type_id != "0"
				&& primaryResource.consultation_type_id != docChrg) {

				var organizationObj	   = document.mainform.organization;
				var consTypes		   = cachedConsultTypes[organizationObj.value];
				var consultation	   = findInList(consTypes, "consultation_type_id", primaryResource.consultation_type_id);
				if (empty(consultation)) {
					consTypes		   = cachedConsultTypes["ORG0001"];
					consultation 	   = findInList(consTypes, "consultation_type_id", primaryResource.consultation_type_id);
				}
				var consultation_type  = (!empty(consultation)) ? consultation.consultation_type : "";

				var msg = " "+getString("js.registration.patient.selected.consultation.type.is.not.same.as.scheduler.consultation.type.string")+":";
				msg += !empty(consultation_type) ? "\n ( "+ consultation_type + ") " : "";
				msg += "\n " + getString("js.registration.patient.want.to.continue.string");

				var ok = confirm(msg);
				if (!ok) {
					document.getElementById("doctorCharge").focus();
					return false;
				}
			}
		}
	}
	return true;
}

function validateandregister() {
	var newReg = isNewReg();

	if (!newReg && !empty(gMrNo) && trim(gMrNo) != '' && trim(document.mrnoform.mrno.value) != ''
		&& trim(gMrNo) != trim(document.mrnoform.mrno.value)) {
		alert(getString("js.registration.patient.valid.mr.no.check")+" : "+trim(gMrNo));
		document.mrnoform.mrno.focus();
		return false;
	}

	document.mainform.mrno.value = trim(document.mrnoform.mrno.value);
	var mrno = document.mainform.mrno.value;

	if (!patientDetailsValidation()) return false;
	if (!patientAdditionalFieldsValidation()) return false;

	if (newReg) {
		document.mainform.regType.value = "new";
	} else {
		document.mainform.regType.value = "regd";
		var mrno = trim(document.mrnoform.mrno.value);
		if (mrno == "") {
			showMessage("js.registration.patient.mr.no.required");
			return false;
		}

		var elements = document.getElementsByName("category_expiry_date");
		for (var i = 0; i < elements.length; i++) {
			var obj = elements[i];
			if (obj.getAttribute("name") == "category_expiry_date") {
				var previousExpDate = document.getElementById('cardExpiryDate').value;
				var selectedExpDate = document.mainform.category_expiry_date.value;
				myDate = new Date();
				var currDate = formatDueDate(myDate);
				if (previousExpDate == "") {
					if (getDateDiff(currDate, selectedExpDate) < 0) {
						showMessage("js.registration.patient.expiry.date.current.date.check");
						return false;
					}
				} else {
					if (selectedExpDate == previousExpDate) {
						if (getDateDiff(currDate, previousExpDate) < 0) {
							showMessage("js.registration.patient.registration.validity.period.check");
							document.mainform.category_expiry_date.focus();
							return false;
						}
					}
					if (getDateDiff(currDate, selectedExpDate) < 0) {
						showMessage("js.registration.patient.expiry.date.current.date.check");
						document.mainform.category_expiry_date.focus();
						return false;
					}
				}
			}
		}
	}

	if (document.mrnoform.mlccheck.checked) {
		if (document.mainform.mlc_template.selectedIndex <= 0) {
			showMessage("js.registration.patient.mlc.template.required");
			if (mlcDialog != null) mlcDialog.show();
			document.mainform.mlc_template.focus();
			return false;
		}
	}

	var priInsCompObj = getPrimaryInsuObj();
	var priTpaObj = getPrimarySponsorObj();

	var secInsCompObj = getSecondaryInsuObj();
	var secTpaObj = getSecondarySponsorObj();

	if (priInsCompObj != null && priInsCompObj.selectedIndex != 0
					&& priTpaObj != null && priTpaObj.selectedIndex == 0) {
		showMessage("js.registration.patient.tpa.sponsor.required");
		priTpaObj.focus();
		return false;
	}
	if (secInsCompObj != null && secInsCompObj.selectedIndex != 0
					&& secTpaObj != null && secTpaObj.selectedIndex == 0) {
		showMessage("js.registration.patient.tpa.sponsor.required");
		secTpaObj.focus();
		return false;
	}

	if (document.getElementById('organization').value == '') {
		showMessage("js.registration.patient.rate.plan.required");
		document.getElementById('organization').focus();
		return false;
	}

	if (document.mainform.bed_id != undefined) {
		if (allocBed == 'Y' && dutyDoctorMand && !document.mainform.duty_doctor_id.disabled && document.mainform.duty_doctor_id.value == '') {
			showMessage("js.registration.patient.duty.doctor.required");
			document.mainform.duty_doctor_id.focus();
			return false;
		}
		if (allocBed == 'Y' && !document.mainform.bed_id.disabled && document.mainform.bed_id.value == 0) {
			showMessage("js.registration.patient.bed.name");
			document.mainform.bed_id.focus();
			return false;
		}
	}

	return true;
}

function validateOnDepPref() {
	var prefArea = document.mainform.areaValidate.value;
	var prefAddress = document.mainform.addressValidate.value;
	var prefNextOfkin = document.mainform.nextofkinValidate.value;
	var area = document.mainform.patient_area.value;
	var prefReferredBy = document.mainform.referredbyValidate.value;
	var address = document.mainform.patient_address.value;
	var cRealation = document.mainform.relation.value;
	var cPerson = document.mainform.patient_care_oftext.value;
	var cpAddress = document.mainform.patient_careof_address.value;
	var complaint = "";
	var prefPatientPhone = document.mainform.patientPhoneValidate.value;
	var patientPhone = document.mainform.patient_phone.value;

	if (document.mainform.ailment != null) complaint = document.mainform.ailment.value;
	var creferaldoctorName = document.mainform.referaldoctorName.value;
	if (prefArea == "A" || prefArea == "I" && visitType == "I" || prefArea == "O" && visitType == "O") {
		if (area == "") {
			showMessage("js.registration.patient.area.required");
			CollapsiblePanel1.open();
			document.mainform.patient_area.focus();
			return false;
		}
	}
	if (prefAddress == "A" || prefAddress == "I" && visitType == "I" || prefAddress == "O" && visitType == "O") {
		if (address == "") {
			showMessage("js.registration.patient.address.required");
			CollapsiblePanel1.open();
			document.mainform.patient_address.focus();
			return false;
		}
	}
	if (prefPatientPhone == "A" || prefPatientPhone == "I" && visitType == "I" || prefPatientPhone == "O" && visitType == "O") {
		if (patientPhone == "") {
			showMessage("js.registration.patient.phone.no.required");
			document.mainform.patient_phone.focus();
			return false;
		}
	}
	if (prefNextOfkin == "A" || prefNextOfkin == "I" && visitType == "I" || prefNextOfkin == "O" && visitType == "O") {
		if (cRealation == "") {
			showMessage("js.registration.patient.next.of.kin.relation.name.required");
			document.mainform.relation.focus();
			return false;
		}
		if (cPerson == "") {
			showMessage("js.registration.patient.next.of.kin.contact.no.required");
			document.mainform.patient_care_oftext.focus();
			return false;
		}
		if (cpAddress == "") {
			showMessage("js.registration.patient.next.of.kin.address.required");
			CollapsiblePanel1.open();
			cfDialog.show();
			document.mainform.patient_careof_address.focus();
			return false;
		}
	}
	if (complaintField == "A" || complaintField == "I" && visitType == "I" || complaintField == "O" && visitType == "O") {
		if (document.mainform.ailment != null && !document.mainform.ailment.disabled) {
			if (complaint == "") {
				showMessage("js.registration.patient.complaint.required");
				document.mainform.ailment.focus();
				return false;
			}
		}
	}
	if (prefReferredBy == "A" || prefReferredBy == "I" && visitType == "I" || prefReferredBy == "O"
			&& visitType == "O" && screenid != "out_pat_reg" || prefReferredBy == "P" && visitType == "O" && screenid == "out_pat_reg") {
		if (creferaldoctorName == "") {
			showMessage("js.registration.patient.referral.required");
			document.mainform.referaldoctorName.focus();
			return false;
		}
	}
	if (cfDialog != null) cfDialog.hide();
	return true;
}

function visitFieldsValidation() {
	if (screenid == "ip_registration") {
		//validation for  ip
		var selIndex = document.mainform.dept_name.selectedIndex;
		if (selIndex == 0) {
			showMessage("js.registration.patient.consulting.department.required");
			document.mainform.dept_name.focus();
			return false;
		}

		if (trim(document.mainform.doctor_name.value) == '') {
			showMessage("js.registration.patient.admitting.doctor.required");
			document.mainform.doctor_name.focus();
			return false;
		}

		if (document.mainform.bed_type.selectedIndex == 0) {
			showMessage("js.registration.patient.bed.type.required");
			document.mainform.bed_type.focus();
			return false;
		}

		if (document.mainform.ward_id.selectedIndex == 0) {
			showMessage("js.registration.patient.ward.name.required");
			document.mainform.ward_id.focus();
			return false;
		}
		return true;

	}

	if (screenid == "reg_registration") {
		var selIndex = document.getElementById('dept_name').selectedIndex;
		if (selIndex == 0) {
			showMessage("js.registration.patient.consulting.department.required");
			document.getElementById('dept_name').focus();
			return false;
		}

		if (trim(document.mainform.doctor.value) != '') {

			var consDateObj = document.mainform.consDate;
			var consTimeObj = document.mainform.consTime;

			if (!doValidateDateField(consDateObj, 'future')) {
				consDateObj.focus();
				return false;
			}

			if (!validateTime(consTimeObj)) {
				consTimeObj.focus();
				return false;
			}

			var dateTime = getDateTimeFromField(consDateObj, consTimeObj);
			var d = new Date(gServerNow);
			d.setSeconds(0);
			d.setMilliseconds(0);

			var diff = d - dateTime;

			if (diff > 0) {
				showMessage("js.registration.patient.consultation.date.time.current.date.time.check");
				consTimeObj.focus();
				return false;
			}
		}

		var prefAdmittedAndConductedDoc = document.mainform.conductingdoctormandatory.value;
		var mainSpnsrIndex = getMainSponsorIndex();
		var planObj = null;
		if (mainSpnsrIndex == 'P')
			planObj = getPrimaryPlanObj();
		else if (mainSpnsrIndex == 'S')
			planObj = getSecondaryPlanObj();
		else {}

		var planId = planObj ? planObj.value : '' ;
		// If Insured with plan then doctor is required for Main/Revisit.
		// Irrespective of plan, for follow up with/without consultation, doctor is required
		if (document.mainform.doctor.value == "") {
			if (!empty(planId) && !empty(eClaimModule) && eClaimModule == 'Y'
					&& (document.mainform.op_type.value == "M" || document.mainform.op_type.value == "R")) {
				showMessage("js.registration.patient.consulting.doctor.required");
				document.mainform.doctor_name.focus();
				return false;
			}

			if (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D") {
				showMessage("js.registration.patient.consulting.doctor.required");
				document.mainform.doctor_name.focus();
				return false;
			}
		}
		if (prefAdmittedAndConductedDoc == 'Y') {
			if (screenid == "reg_registration") {
				if (trim(document.mainform.doctor_name.value) == '') {
					showMessage("js.registration.patient.consulting.doctor.required");
					document.mainform.doctor_name.focus();
				return false;
			}
		}
	}
		if (!validateDeptAllowedGender()) return false;
		return true;
	}

	if (screenid == "out_pat_reg") {
		return true;
	}
}

function hasPlanVisitCopayLimit(planId) {
	var plan = findInList(policynames, "plan_id", planId);
	var hasVisitCopayLimit = false;
	if (empty(plan))
		return hasVisitCopayLimit;

	var visitType = screenid == 'ip_registration'? 'i': 'o';
	if (visitType == 'o')
		hasVisitCopayLimit = (!empty(plan.op_visit_copay_limit) && getPaise(plan.op_visit_copay_limit) != 0);

	else if (visitType == 'i')
		hasVisitCopayLimit = (!empty(plan.ip_visit_copay_limit) && getPaise(plan.ip_visit_copay_limit) != 0);

	return hasVisitCopayLimit;
}

function validateMultiSponsorForPlanWithCopay() {
	if (document.getElementById("secondary_sponsor").value != "") {
		var planObj = getSecondaryPlanObj();
		if (planObj == null)
			planObj = getPrimaryPlanObj();

		if (planObj != null) {
			var planId = planObj.value;
			var hasVisitCopayLimit = hasPlanVisitCopayLimit(planId);
			if (hasVisitCopayLimit) {
				var msg = getString("js.registration.patient.plan.has.visit.copay.string");
				msg += " \n";
				msg += getString("js.registration.patient.secondary.sponsor");
				msg += " "+	getString("js.registration.patient.is.not.allowed.string");

				alert(msg);
				document.getElementById("secondary_sponsor").focus();
				return false;
			}
		}
	}
	return true;
}

function validatePrimarySponsor() {
	if (document.getElementById("secondary_sponsor").value != "") {
		var tpaObj = getSecondarySponsorObj();
		if (tpaObj != null && tpaObj.value != "") {
			if (document.getElementById("primary_sponsor").value == "") {
				var msg = getString("js.registration.patient.primary.sponsor") +
						  " "+getString("js.registration.patient.is.required.string");
				alert(msg);
				document.getElementById("primary_sponsor").focus();
				return false;
			}
			tpaObj = getPrimarySponsorObj();
			if (tpaObj == null || tpaObj.value == "") {
				showMessage("js.registration.patient.tpa.sponsor.required");
				tpaObj.focus();
				return false;
			}
		}
	}
	return true;
}

function validateInsuranceFields(spnsrIndex) {

	if (!validateSponsor(spnsrIndex)) return false;

	if (spnsrIndex == 'P') {
		var priInsCompObj = getPrimaryInsuObj();
		var priTpaObj = getPrimarySponsorObj();
		var priPlanObj = getPrimaryPlanObj();
		var priPlanTypeObj = getPrimaryPlanTypeObj();
		var priMemberIdObj = getPrimaryInsuranceMemberIdObj();
	}

	if (spnsrIndex == 'S') {
		var secInsCompObj = getSecondaryInsuObj();
		var secTpaObj = getSecondarySponsorObj();
		var secPlanObj = getSecondaryPlanObj();
		var secPlanTypeObj = getSecondaryPlanTypeObj();
		var secMemberIdObj = getSecondaryInsuranceMemberIdObj();
	}
	//var spnsrIndex = getMainSponsorIndex();

	if (isModAdvanceIns) {
		if(spnsrIndex == 'P'
			&& (priInsCompObj != null && priInsCompObj.selectedIndex != 0)
			&& (priPlanTypeObj != null && priPlanTypeObj.selectedIndex == 0)) {
			showMessage("js.registration.patient.network.plantype.name.required");
			priPlanTypeObj.focus();
			return false;
		}

		if (spnsrIndex == 'P'
			&& (priPlanObj != null && priPlanObj.selectedIndex == 0
			&& priPlanTypeObj.selectedIndex != 0)) {
			showMessage("js.registration.patient.plan.name.required");
			priPlanObj.focus();
			return false;
		}

		if (spnsrIndex == 'S'
			&& (secInsCompObj != null && secInsCompObj.selectedIndex != 0)
			&& (secPlanTypeObj != null && secPlanTypeObj.selectedIndex == 0)) {
			showMessage("js.registration.patient.network.plantype.name.required");
			secPlanTypeObj.focus();
			return false;
		}

		if (spnsrIndex == 'S'
			&& (secPlanObj != null && secPlanObj.selectedIndex == 0
			&& secPlanTypeObj.selectedIndex != 0)) {
			showMessage("js.registration.patient.plan.name.required");
			secPlanObj.focus();
			return false;
		}

		if ((priPlanObj != null && priPlanObj.value != "")
			|| (secPlanObj != null && secPlanObj.value != "")) {

			var memberIdRequiredMsg = memberIdLabel + " " +getString("js.common.is.required");
			var memberIdValidFromRequiredMsg = memberIdValidFromLabel + " " +getString("js.common.is.required");
			var memberIdValidToRequiredMsg = memberIdValidToLabel + " " +getString("js.common.is.required");

			if (spnsrIndex == 'P' && priMemberIdObj != null && priMemberIdObj.value == "") {
				alert(memberIdRequiredMsg);
				priMemberIdObj.focus();
				return false;
			}
			if (spnsrIndex == 'S' && secMemberIdObj != null && secMemberIdObj.value == "") {
				alert(memberIdRequiredMsg);
				secMemberIdObj.focus();
				return false;
			}

			if (spnsrIndex == 'P') {
				var policyStartDateObj = getPrimaryPolicyValidityStartObj();
				var policyEndDateObj = getPrimaryPolicyValidityEndObj();

			  if (policyStartDateObj != null) {
				if (!validateRequired(policyStartDateObj, memberIdValidFromRequiredMsg)) return false;
				if (!validateRequired(policyEndDateObj, memberIdValidToRequiredMsg)) return false;

				var fromDt = getDateFromField(policyStartDateObj);
				var toDt = getDateFromField(policyEndDateObj);
				var dateCompareMsg = memberIdValidToLabel+" "+getString("js.common.message.cannot.be.less.than")+" "+memberIdValidFromLabel;

				if ((toDt != null) && (fromDt != null)) {
					if (fromDt > toDt) {
						alert(dateCompareMsg);
						policyEndDateObj.focus();
						return false;
					}
				}

				var memberIdValidFromFutureValidate = memberIdValidFromLabel + " " +getString("js.common.message.date.invalid.future");
				var memberIdValidToPastValidate = memberIdValidToLabel + " " +getString("js.common.message.date.invalid.past");
				var curDate = new Date();
				if (gServerNow != null) {
					curDate.setTime(gServerNow);
				}
				curDate.setHours(0);
				curDate.setMinutes(0);
				curDate.setSeconds(0);
				curDate.setMilliseconds(0);

				if (fromDt > curDate) {
					alert(memberIdValidFromFutureValidate);
					policyStartDateObj.focus();
					return false;
				}

				if (toDt < curDate) {
					alert(memberIdValidToPastValidate);
					policyEndDateObj.focus();
					return false;
				}
			  }
			}

			if (spnsrIndex == 'S') {
				var policyStartDateObj = getSecondaryPolicyValidityStartObj();
				var policyEndDateObj = getSecondaryPolicyValidityEndObj();
			   if (policyStartDateObj != null) {
				if (!validateRequired(policyStartDateObj, memberIdValidFromRequiredMsg)) return false;
				if (!validateRequired(policyEndDateObj, memberIdValidToRequiredMsg)) return false;

				var fromDt = getDateFromField(policyStartDateObj);
				var toDt = getDateFromField(policyEndDateObj);
				var dateCompareMsg = memberIdValidToLabel+" "+getString("js.common.message.cannot.be.less.than")+" "+memberIdValidFromLabel;

				if ((toDt != null) && (fromDt != null)) {
					if (fromDt > toDt) {
						alert(dateCompareMsg);
						policyEndDateObj.focus();
						return false;
					}
				}

				var memberIdValidFromFutureValidate = memberIdValidFromLabel + " " +getString("js.common.message.date.invalid.future");
				var memberIdValidToPastValidate = memberIdValidToLabel + " " +getString("js.common.message.date.invalid.past");
				var curDate = new Date();
				if (gServerNow != null) {
					curDate.setTime(gServerNow);
				}
				curDate.setHours(0);
				curDate.setMinutes(0);
				curDate.setSeconds(0);
				curDate.setMilliseconds(0);

				if (fromDt > curDate) {
					alert(memberIdValidFromFutureValidate);
					policyStartDateObj.focus();
					return false;
				}

				if (toDt < curDate) {
					alert(memberIdValidToPastValidate);
					policyEndDateObj.focus();
					return false;
				}
			  }
			}

		}
	}


	if (spnsrIndex == 'P') {

		if (!validateIdDetails('P')) {
			return false;
		}

		if (document.getElementById("primary_sponsor").value != "") {
			var tpaObj = getPrimarySponsorObj();
			if (tpaObj != null && tpaObj.value != "") {
				if (!validateInsuranceApprovalAmount('P'))
					return false;
			}
		}

		if (!isInsCompanyActive(priInsCompObj)) {
			showMessage("js.registration.patient.insurance.company.is.inactive");
			priInsCompObj.focus();
			return false;
		}

		if (!isTpaActive(priTpaObj)) {
			showMessage("js.registration.patient.tpa.is.inactive");
			priTpaObj.focus();
			return false;
		}

		if (!validateDRGCodeWithPlan(spnsrIndex)) {
			return false;
		}

		if (!validateInsuranceCardRequired(spnsrIndex)) {
			return false;
		}

		if (!validateScannedDocRequired(spnsrIndex)) {
			return false;
		}
	}

	if (spnsrIndex == 'S') {

		if (!validateIdDetails('S')) {
			return false;
		}

		if (document.getElementById("secondary_sponsor").value != "") {
			var tpaObj = getSecondarySponsorObj();
			if (tpaObj != null && tpaObj.value != "") {
				if (!validateInsuranceApprovalAmount('S'))
					return false;
			}
		}

		if (!isInsCompanyActive(secInsCompObj)) {
			showMessage("js.registration.patient.insurance.company.is.inactive");
			secInsCompObj.focus();
			return false;
		}

		if (!isTpaActive(secTpaObj)) {
			showMessage("js.registration.patient.tpa.is.inactive");
			secTpaObj.focus();
			return false;
		}

		if (!validateDRGCodeWithPlan(spnsrIndex)) {
			return false;
		}

		if (!validateInsuranceCardRequired(spnsrIndex)) {
			return false;
		}

		if (!validateScannedDocRequired(spnsrIndex)) {
			return false;
		}
	}

	if (isModAdvanceIns) {
		if (spnsrIndex == 'P') {
			if (!isPlanTypeActive(priPlanTypeObj)) {
				showMessage("js.registration.patient.network.plan.type.is.inactive");
				priPlanTypeObj.focus();
				return false;
			}

			if (!isPlanActive(priPlanObj)) {
				showMessage("js.registration.patient.plan.is.inactive");
				priPlanObj.focus();
				return false;
			}
		}

		if (spnsrIndex == 'S') {
			if (!isPlanTypeActive(secPlanTypeObj)) {
				showMessage("js.registration.patient.network.plan.type.is.inactive");
				secPlanTypeObj.focus();
				return false;
			}

			if (!isPlanActive(secPlanObj)) {
				showMessage("js.registration.patient.plan.is.inactive");
				secPlanObj.focus();
				return false;
			}
		}
	}

	return true;
}

function validateGovtIdentity() {

	var priPlanObj = getPrimaryPlanObj();
	var secPlanObj = getSecondaryPlanObj();

	if (isModAdvanceIns) {
		if ((priPlanObj != null && priPlanObj.value != "")
			|| (secPlanObj != null && secPlanObj.value != "")) {

			if (!empty(eClaimModule) && eClaimModule == 'Y') {
				var govtIdentifierIdObj = document.mainform.identifier_id;
				var govtIdentifierObj = document.mainform.government_identifier;
				var isIdEmpty = false;
				var isIdentifierEmpty = false;
				if ((govtIdentifierIdObj != null && govtIdentifierIdObj.value == ""))
					isIdEmpty = true;

				if ((govtIdentifierObj != null && trim(govtIdentifierObj.value) == ""))
					isIdentifierEmpty = true;

				if (isIdEmpty && isIdentifierEmpty) {
					alert(govtIDType+" "+getString("js.registration.patient.or.string")+" "+govtID+" "+getString("js.registration.patient.is.required.string"));

					if (!CollapsiblePanel1.isOpen()) {
						CollapsiblePanel1.open();
						setTimeout("document.mainform.identifier_id.focus()", 800);
					}else
						setTimeout("document.mainform.identifier_id.focus()", 100);

					cfDialog.hide();
					return false;
				}

				return true;
			}
			return true;
		}
		return true;
	}

	return true;
}


function validateOutpatientMandatoryfields() {

	if (screenid == "out_pat_reg") {
		if (modMrdIcdEnabled == 'Y') {
			if (!empty(eClaimModule) && eClaimModule == 'Y' && !checkPrincipalDiagCodes()) {
				return false;
			}
		}
		if (document.mainform.referaldoctorName.value != "" && document.mainform.clinician_id.value == "") {
			showMessage("js.registration.patient.clinician.id.required");
			document.mainform.clinician_id.focus();
			return false;
		}
		return true;
	}

	return true;
}

function isRatePlanActive(ratePlan) {
	if (empty(ratePlan)) return true;

	var org = findInList(orgNamesJSON, "org_id", ratePlan);
	if (org != null && org.status == 'A') {
		return true;
	}
	return false;
}

function isInsCompanyActive(insCompObj) {
	if (insCompObj == null) return true;
	var insComp = insCompObj .value;
	if (empty(insComp)) return true;

	var inscomp = findInList(insuCompanyDetails, "insurance_co_id", insComp);
	if (inscomp != null && inscomp.status == 'A') {
		return true;
	}
	return false;
}

function isTpaActive(tpaIdObj) {
	if (tpaIdObj == null) return true;
	var tpaId = tpaIdObj .value;
	if (empty(tpaId)) return true;

	var tpa = findInList(tpanames, "tpa_id", tpaId);
	if (tpa != null && tpa.status == 'A') {
		return true;
	}
	return false;
}

function isPlanTypeActive(planTypeObj) {
	if (planTypeObj == null) return true;
	var planType = planTypeObj .value;
	if (empty(planType)) return true;

	var plantype = findInList(insuCatNames, "category_id", planType);
	if (plantype != null && plantype.status == 'A') {
		return true;
	}
	return false;
}

function isPlanActive(planIdObj) {
	if (planIdObj == null) return true;
	var planId = planIdObj .value;
	if (empty(planId)) return true;

	var plan = findInList(policynames, "plan_id", planId);
	if (plan != null && plan.status == 'A') {
		return true;
	}
	return false;
}

function validateSponsor(spnsrIndex) {
	var tpaObj = null;
	var spnsrText = "";
	if (spnsrIndex == 'P') spnsrText = getString("js.registration.patient.primary.sponsor");
	if (spnsrIndex == 'S') spnsrText = getString("js.registration.patient.secondary.sponsor");
	else {}

	var msg =  spnsrText+ " " +getString("js.common.is.required");

	if (spnsrIndex == 'P')
		tpaObj = getPrimarySponsorObj();
	else if (spnsrIndex == 'S')
		tpaObj = getSecondarySponsorObj();

	if (tpaObj != null && tpaObj.value == "") {
		alert(msg);
		tpaObj.focus();
		return false;
	}
	return true;
}

function validateIdDetails(spnsrIndex) {
	var idValue = 0;
	var idObj = null;
	var msg = "";
	var tpaObj = getPrimarySponsorObj();
	if (spnsrIndex == 'P') {
		var primarySponsorObj = document.getElementById("primary_sponsor");
		tpaObj = getPrimarySponsorObj();
		if (primarySponsorObj != null) {
			if (primarySponsorObj.value == 'C') {
				idObj = document.getElementById("primary_employee_id");
				msg = getString("js.registration.patient.employee.id.required");
			}else if (primarySponsorObj.value == 'N') {
				idObj = document.getElementById("primary_national_member_id");
				msg = getString("js.registration.patient.member.id.required");
			}
		}
	}else if (spnsrIndex == 'S') {
		var secondarySponsorObj = document.getElementById("secondary_sponsor");
		tpaObj = getSecondarySponsorObj();
		if (secondarySponsorObj != null) {
			if (secondarySponsorObj.value == 'C') {
				idObj = document.getElementById("secondary_employee_id");
				msg = getString("js.registration.patient.employee.id.required");
			}else if (secondarySponsorObj.value == 'N') {
				idObj = document.getElementById("secondary_national_member_id");
				msg = getString("js.registration.patient.member.id.required");
			}
		}
	}

	if (tpaObj != null && tpaObj.value != "") {
		if (idObj != null && trim(idObj.value) == '') {
			alert(msg);
			idObj.focus();
			return false;
		}
	}
	return true;
}

function validateInsuranceApprovalAmount(spnsrIndex) {
	var insApprovalAmt = 0;
	var approvalLimitObj = null;
	if (spnsrIndex == 'P') {
		approvalLimitObj = getPrimaryApprovalLimitObj();
	}else if (spnsrIndex == 'S') {
		approvalLimitObj = getSecondaryApprovalLimitObj();
	}

	if (approvalLimitObj != null) {
		if (approvalLimitObj.disabled || approvalLimitObj.readOnly) return true;
		if (trimAll(approvalLimitObj.value) == '') {

			var spnsrText = "";
			if (spnsrIndex == 'P') spnsrText = getString("js.registration.patient.primary.sponsor");
			if (spnsrIndex == 'S') spnsrText = getString("js.registration.patient.secondary.sponsor");
			else {}

			var msg = " "+getString("js.registration.patient.warning");
			var tpaObj = getSecondarySponsorObj();
			if (tpaObj != null && tpaObj.value != "") {
				msg += " "+spnsrText;
			}
			msg += " "+getString("js.registration.patient.approval.amount.is.given.string")+" \n";
			msg += " "+getString("js.registration.patient.warning.validations.against.approval.amount.will.be.disabled.string")+" \n";
			msg += " "+getString("js.registration.patient.for.blanket.approvals.specify.amount.as.zero.string")+" \n";
			msg += " "+getString("js.registration.patient.do.you.want.tocontinue.to.save.string")+" \n";

			var ok = confirm(msg);
			if (!ok) {
				approvalLimitObj.focus();
				return false;
			} else return true;
		}
		formatAmountObj(approvalLimitObj, false);
		insApprovalAmt = getPaise(approvalLimitObj.value);
	}

	var approvalMsg = getString("js.registration.patient.approval.amount.must.be.a.valid.amount");
	if (!validateAmount(approvalLimitObj, approvalMsg))
		return false;

	/* Bug # 16439 - Blanket approval, if approval amount is zero then the amount is treated as unlimited. */
	if (insApprovalAmt >= 0) return true;
	else return false;
}

function validateBilltypeIfSecondarySponsor() {

	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj != null && secondarySponsorObj.value != "") {
		var tpaObj = getPrimarySponsorObj();
		if (tpaObj != null && tpaObj.value != "") {
			var billTypeObj = document.mainform.bill_type;

			if (billTypeObj && (billTypeObj.value == "C" || (allowBillNowInsurance == 'true' && billTypeObj.value == 'P'))) {
				return true;
			}

			if (billTypeObj && billTypeObj.value != 'C') {
				showMessage("js.registration.patient.secondary.sponsor.type.is.bill.later.required");
				billTypeObj.focus();
				return false;
			}
		}
		return true;
	}
	return true;
}

function validateScannedDocRequired() {

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	var memberIdObj = null;
	var validatePrimary = true;
	var validateSecondary = true;

	if (primarySponsorObj != null && !primarySponsorObj.disabled && primarySponsorObj.value != "") {
		var tpaObj = getPrimarySponsorObj();
		memberIdObj = getPrimaryMemberIdObj();
		// Check if an existing sponsor details are being updated or new values are being inserted.
		if(primarySponsorObj.value == 'C') {
			if (tpaObj != null && tpaObj.value != "") {
				var rec = findInList2(gPatientCorporateIds, "sponsor_id", tpaObj.value, "employee_id", memberIdObj.value);
				if(rec!= null) {
					validatePrimary = false;
				}
			}
		} else if(primarySponsorObj.value == 'N') {
			if (tpaObj != null && tpaObj.value != "") {
				var rec = findInList2(gPatientNationalIds, "sponsor_id", tpaObj.value, "national_id", memberIdObj.value);
				if(rec!= null) {
					validatePrimary = false;
				}
			}
		} else if(primarySponsorObj.value == 'I') {
			validatePrimary = false;
		}


		if (tpaObj != null && tpaObj.value != "" && validatePrimary) {
			var tpaId = tpaObj.value;
			var tpa = findInList(tpanames, "tpa_id", tpaId);
			var insuranceCardMandatory = !empty(tpa) ? tpa.scanned_doc_required : "N";
			var docContentObj = getPrimaryDocContentObj();
			var fileHtmlId = 'primary_sponsor_cardfileLocation'+primarySponsorObj.value;

			if (insuranceCardMandatory == 'R' && docContentObj.value == ''
					&& document.getElementById(fileHtmlId).value == '') {
				showMessage("js.registration.patient.sponsor.required.scanned.doc");
				docContentObj.focus();
				return false;
			}
		}
	}

	if (secondarySponsorObj != null && !secondarySponsorObj.disabled && secondarySponsorObj.value != "") {

		var tpaObj = getSecondarySponsorObj();
		memberIdObj = getSecondaryMemberIdObj();
		if(secondarySponsorObj.value == 'C') {
			if (tpaObj != null && tpaObj.value != "") {
				var rec = findInList2(gPatientCorporateIds, "sponsor_id", tpaObj.value, "employee_id", memberIdObj.value);
				if(rec!= null) {
					validateSecondary = false;
				}
			}
		} else if(secondarySponsorObj.value == 'N') {
			if (tpaObj != null && tpaObj.value != "") {
				var rec = findInList2(gPatientNationalIds, "sponsor_id", tpaObj.value, "national_id", memberIdObj.value);
				if(rec!= null) {
					validateSecondary = false;
				}
			}
		} else if(secondarySponsorObj.value == 'I') {
			validateSecondary = false;
		}

		if (tpaObj != null && tpaObj.value != "" && validateSecondary) {
			memberIdObj = getSecondaryMemberIdObj();

			var tpaId = tpaObj.value;
			var tpa = findInList(tpanames, "tpa_id", tpaId);
			var insuranceCardMandatory = !empty(tpa) ? tpa.scanned_doc_required : "N";
			var docContentObj = getSecondaryDocContentObj();
			var fileHtmlId = 'secondary_sponsor_cardfileLocation'+secondarySponsorObj.value;

			if (insuranceCardMandatory == 'R' && docContentObj.value == ''
					&& document.getElementById(fileHtmlId).value == '') {
				showMessage("js.registration.patient.sponsor.required.scanned.doc");
				docContentObj.focus();
				return false;
			}
		}
	}
	return true;
}


function validateInsuranceCardRequired(spnsrIndex) {

	//var spnsrIndex = getMainSponsorIndex();
	var memberIdObj = null;
	var planIdObj = null;
	var tpaObj = null;
	var docContentObj = null;
	var docNameObj = null;
	var policyEndDateObj = null;
	var fileHtmlId = '';

	if (spnsrIndex == 'P') {
		memberIdObj = getPrimaryInsuranceMemberIdObj();
		planIdObj 	= getPrimaryPlanObj();
		tpaObj		= getPrimarySponsorObj();
		docContentObj = getPrimaryDocContentObj();
		docNameObj	= getPrimaryDocNameObj();
		policyEndDateObj = getPrimaryPolicyValidityEndObj();
		fileHtmlId = 'primary_sponsor_cardfileLocation'+document.getElementById("primary_sponsor").value;

	}else if (spnsrIndex == 'S') {
		memberIdObj = getSecondaryInsuranceMemberIdObj();
		planIdObj 	= getSecondaryPlanObj();
		tpaObj		= getSecondarySponsorObj();
		docContentObj = getSecondaryDocContentObj();
		docNameObj	= getSecondaryDocNameObj();
		policyEndDateObj = getSecondaryPolicyValidityEndObj();
		fileHtmlId = 'secondary_sponsor_cardfileLocation'+document.getElementById("secondary_sponsor").value;
	}

	if (planIdObj == null || memberIdObj == null) return true;

	if (empty(planIdObj.value)) {
		if(!empty(docContentObj.value)) {
			docContentObj.value = "";
			alert(getString("js.registration.patient.please.select.a.plan"));
			return false;
		}
	}

	var tpaId = (tpaObj != null) ? tpaObj.value : "";
	var tpa = findInList(tpanames, "tpa_id", tpaId);
	var insuranceCardMandatory = !empty(tpa) ? tpa.scanned_doc_required : "N";

	if (insuranceCardMandatory == 'R' && isModAdvanceIns && (!empty(planIdObj.value) || !empty(memberIdObj.value))) {
		if (docNameObj.value == 'Insurance Card') {

			if (planIdObj.value == gPreviousPlan
				&& memberIdObj.value == gPreviousMemberId
				&& parseDateStr(policyEndDateObj.value).getTime() == new Date(gPreviousEndDate).getTime()) {
				// do nothing if the previous plan is selected
				// and the membership validity is not expired.
				return true;
			}

			if (gPatientPolciyNos != null && gPatientPolciyNos != '') {
				for (var k = 0; k < gPatientPolciyNos.length; k++) {
					if (planIdObj.value == gPatientPolciyNos[k].plan_id
						&& memberIdObj.value == gPatientPolciyNos[k].member_id
						&& parseDateStr(policyEndDateObj.value).getTime() == new Date(gPatientPolciyNos[k].policy_validity_end).getTime()) {
						// do nothing if one of the previous plans have been selected
						// and the membership validity is not expired.
						return true;
					}
				}
			}

			if (insuranceCardMandatory == 'R' && docContentObj.value == ''
					&& document.getElementById(fileHtmlId).value == '') {
				showMessage("js.registration.patient.insurance.card.required");
				docContentObj.focus();
				return false;
			}
		}
	}
	return true;
}

function validateDRGCodeWithPlan(spnsrIndex) {

//	var spnsrIndex = getMainSponsorIndex();
	var useDRGObj = null;
	var drgCheckObj = null;
	var planObj = null;
	var billTypeObj = document.mainform.bill_type;

	if (spnsrIndex == 'P') {
		useDRGObj 	= getPrimaryUseDRGObj();
		drgCheckObj = getPrimaryDRGCheckObj();
		planObj 	= getPrimaryPlanObj();

	}else if (spnsrIndex == 'S') {
		useDRGObj 	= getSecondaryUseDRGObj();
		drgCheckObj = getSecondaryDRGCheckObj();
		planObj 	= getSecondaryPlanObj();
	}

	if (drgCheckObj && drgCheckObj.checked) {
		if (billTypeObj && billTypeObj.value != 'C') {
			showMessage("js.registration.patient.drg.bill.type.is.bill.later.required");
			billTypeObj.focus();
			return false;
		}

		if (planObj && planObj.value == '') {
			showMessage("js.registration.patient.drg.code.required.is.only.for.plan.patient");
			drgCheckObj.focus();
			return false;
		}
	}
	return true;
}


function validateFollowUpDoctor() {
	var doctorObj = document.mainform.doctor;
	var doctorChargeObj = document.mainform.doctorCharge;
	var opTypeObj = document.mainform.op_type;
	if (opTypeObj != null && opTypeObj.value == 'D') {
		if (doctorObj.value == '') {
			showMessage("js.registration.patient.follow.up.doctor.required");
			doctorObj.focus();
			return false;
		}
		if (doctorChargeObj.value != '') {
			showMessage("js.registration.patient.consultation.is.not.required.for.follow.up.without.consultation");
			doctorChargeObj.focus();
			return false;
		}
	}
	return true;
}

// Validate consultation validity only for follow up with cons.
function validateVisitValidity() {
	if (document.mainform.doctor != null) {
		var visitValid = setVisitType(document.mainform.doctor.value, gPreviousDocVisits);
		if (document.mainform.op_type) {
		 	if (!visitValid && (document.mainform.op_type.value == 'F')) {
				alert(getString("js.registration.patient.selected.doctor.visit.validity.has.expired.string")+
					"\n"+getString("js.registration.patient.select.visit.type.as.main.follow.up.no.cons.revisit.visit.string"));
				document.mainform.op_type.focus();
				return false;
		 	}
		}
	}
	return true;
}

function validatePatientCategory() {
	var patientCategoryObj	= document.mainform.patient_category_id;
	if (patientCategoryObj != null && patientCategoryObj.value == "") {
		alert(patientCategory+" "+getString("js.registration.patient.is.required.string"));
		patientCategoryObj.focus();
		return false;
	}
	return true;
}

function registerAndBill() {
	document.getElementById('registerBtn').focus();
	document.mainform.regAndBill.value = "Y";
	validateRegister();
}

function registerAndEditBill() {
	document.mainform.regAndBill.value = "E";
	document.getElementById('registerBtn').focus();
	validateRegister();
}

function registervalidate() {
	document.mainform.regAndBill.value = "N";
	document.getElementById('registerBtn').focus();
	validateRegister();
}

function disableOrEnableRegisterBtns(disable) {
	if (disable) {
		if (document.mainform.regBill != null) document.mainform.regBill.disabled = true;
		if (document.mainform.editBill != null) document.mainform.editBill.disabled = true;
		if (document.mainform.registerBtn != null) document.mainform.registerBtn.disabled = true;
	} else {
		if (document.mainform.regBill != null) document.mainform.regBill.disabled = false;
		if (document.mainform.editBill != null) document.mainform.editBill.disabled = false;
		if (document.mainform.registerBtn != null) document.mainform.registerBtn.disabled = false;
	}
}

// AJAX search to check these patient details already exists

function validateRegister() {

	if (max_centers>1 && centerId == 0) {
		showMessage("js.registration.patient.registration.allowed.only.for.center.users");
		return false;
	}

	if (!validateandregister()) return false;
	if (!validateOnDepPref()) return false;
	if (!validateCustomFields()) return false;
	if (!visitFieldsValidation()) return false;

	if (document.getElementById('regTyperegd').checked == true) {
		if (!validateFollowUpDoctor()) return false;
		if (!validateVisitValidity()) return false;
	}

	if (!validatePatientCategory()) return false;
	if (!validateOnChangePatientCategory()) return false;
	if (!uploadForms()) return false;

	var priPlanObj = getPrimaryPlanObj();
	var priAuthIdObj = getPrimaryAuthIdObj();
	var priAuthModeIdObj = getPrimaryAuthModeIdObj();

	var secPlanObj = getSecondaryPlanObj();
	var secAuthIdObj = getSecondaryAuthIdObj();
	var secAuthModeIdObj = getSecondaryAuthModeIdObj();

	if (isModAdvanceIns && priPlanObj != null && priPlanObj.value != ''
			&& !empty(priorAuthRequired) && trim(priAuthIdObj.value) == ""
			&& (priorAuthRequired=="A" || (priorAuthRequired=="I" && screenid == "ip_registration")
				|| (priorAuthRequired=="O" && screenid == "reg_registration" ))) {
		showMessage("js.registration.patient.prior.auth.no.required");
		priAuthIdObj.focus();
		return false;
	}

	if (priAuthModeIdObj != null) {
		if(!validatePriorAuthMode(null, null, priAuthIdObj.name, priAuthModeIdObj.name))
		return false;
	}

	if (isModAdvanceIns && secPlanObj != null && secPlanObj.value != ''
			&& !empty(priorAuthRequired) && trim(secAuthIdObj.value) == ""
			&& (priorAuthRequired=="A" || (priorAuthRequired=="I" && screenid == "ip_registration")
				|| (priorAuthRequired=="O" && screenid == "reg_registration" ))) {
		showMessage("js.registration.patient.prior.auth.no.required");
		secAuthIdObj.focus();
		return false;
	}

	if (secAuthModeIdObj != null) {
		if(!validatePriorAuthMode(null, null, secAuthIdObj.name, secAuthModeIdObj.name))
		return false;
	}


	if (!validateMultiSponsorForPlanWithCopay()) return false;

	if (!validatePrimarySponsor()) return false;

	if (!validateInsuranceFields('P')) return false;

	if (!validateInsuranceFields('S')) return false;

	if (!validatePlan()) return false;

	if (!validateGovtIdentity()) return false;

	if (!validateMemberId()) return false;

	if (!validateOutpatientMandatoryfields()) return false;

	if (!validateBilltypeIfSecondarySponsor()) return false;

	if (document.mrnoform.group.value == "opreg") {
		document.mainform.group.value = "opreg";
	} else {
		document.mainform.group.value = "ipreg";
	}
	if (document.mainform.referaldoctorName.value == "")
		document.mainform.referred_by.value = "";

	if (!ratePlanApplicableForAppointment()) return false;

	if ((document.mainform.appointmentId) && (document.mainform.appointmentId.value != '') && (document.mainform.appointmentId.value != '0')
			&& (document.mainform.category) && (document.mainform.category.value == 'OPE' && !empty(scheduleName))) {
		if(advancedOTModule == "Y") {
		} else
			alert(getString("js.registration.patient.patient.has.surgery.scheduled.string")+" "+"\n"+getString("js.registration.patient.surgery.will.be.scheduled.string"));
	}

	if (document.getElementById('regTyperegd').checked == true) {
		return register();
	}

	var middleName2='';
	var firstName = trim(document.getElementById('patient_name').value);
	var middleName = trim(document.getElementById('middle_name').value);
	if(regPref.name_parts == 4)
		middleName2 = trim(document.getElementById('middle_name2').value);
	var lastName = trim(document.getElementById('last_name').value);

	if (middleName == '' || middleName == "..MiddleName..") middleName = '';
	if (middleName2 == '' || middleName2 == "..MiddleName2..") middleName2 = '';
	if (lastName == '' || lastName == "..LastName..") lastName = '';
	middleName = trim(middleName+" "+middleName2);
	var gender = document.getElementById('patient_gender').options[document.getElementById('patient_gender').options.selectedIndex].value;
	var age = document.getElementById('age').value;
	var dob = document.mainform.dateOfBirth.value;
	var phno = document.getElementById('patient_phone').value;
	var url = "../../pages/registration/regUtils.do?_method=checkPatientDetailsExists&firstName=" + firstName
			+ "&middleName=" + middleName + "&lastName=" + lastName + "&gender=" + gender + "&age=" + age + "&dob=" + dob + "&phno=" + phno;
	var reqObject = newXMLHttpRequest();
	reqObject.open("POST", url.toString(), false);
	reqObject.send(null);
	if (reqObject.readyState == 4) {
		if ((reqObject.status == 200) && (reqObject.responseText != null)) {
			getPatientInfo(reqObject.responseText);
		}
	}
	return null;
}

var existingPatientDetails = null;
var gotPatDetails = false;

function getPatientInfo(responseData) {
	existingPatientDetails = null;
	eval("existingPatientDetails =" + responseData);
	if (!empty(existingPatientDetails)) {
		var eobirth = empty(existingPatientDetails.eob) ? '' : existingPatientDetails.eob;
		var dobirth = empty(existingPatientDetails.dob) ? '' : existingPatientDetails.dob;

		var age = empty(existingPatientDetails.age) ? '' : existingPatientDetails.age;
		var agein = empty(existingPatientDetails.agein) ? '' : existingPatientDetails.agein;

		var ageAndDOB = age +" "+ agein;
		if (document.mainform.dateOfBirth.value != '' && document.mainform.dateOfBirth.value != null) {
			ageAndDOB = ageAndDOB + " / " + (empty(dobirth) ? eobirth : dobirth) ;
		}

		var area = empty(existingPatientDetails.patient_area) ? '' : existingPatientDetails.patient_area;
		var middleName = empty(existingPatientDetails.middle_name) ? '' : existingPatientDetails.middle_name;
		var lastName = empty(existingPatientDetails.last_name) ? '' : existingPatientDetails.last_name;
		var phoneNo = empty(existingPatientDetails.patient_phone) ? '' : existingPatientDetails.patient_phone;

		if (confirm(getString("js.registration.patient.patient.with.following.details.already.exists.string")+" " +
					" \n " + " \n"+getString("js.registration.patient.mr.no.string")+" " + existingPatientDetails.mr_no +
					" \n " +getString("js.registration.patient.first.name.string")+" " + existingPatientDetails.patient_name +
					" \n " +getString("js.registration.patient.middle.name.string")+" " + middleName +
					" \n " +getString("js.registration.patient.last.name.string")+" "+ lastName +
					" \n " +getString("js.registration.patient.gender.string")+" "+ existingPatientDetails.patient_gender  +
					" \n " +getString("js.registration.patient.age.date.of.birth.string")+" "+ ageAndDOB +
					" \n " +getString("js.registration.patient.phone.string")+" " +phoneNo +
					" \n " +getString("js.registration.patient.address.string")+" "+ existingPatientDetails.patient_address +
					" \n " +getString("js.registration.patient.city.string")+" "+ existingPatientDetails.city_name +
					" \n " +getString("js.registration.patient.area.string")+" " + area + " \n " + " \n " +
					getString("js.registration.patient.are.you.want.to.register.a.new.patient.string"))) {

			register();
			return true;
		} else {
			document.getElementById('regTypenew').checked = false;
			document.getElementById('regTyperegd').checked = true;
			clearRegDetails();
			document.mrnoform.mrno.value = existingPatientDetails.mr_no;

			var form = document.mainform;
			var primaryResource = getSchedulerPrimaryResource();
			if (primaryResource != null) {
				form.appointmentId.value = primaryResource.appointment_id;
				form.category.value = primaryResource.category;
				form.patient_phone.value = primaryResource.patient_contact;
				form.ailment.value = primaryResource.complaint;
			}
			getRegDetails();
		}

	} else {
		register();
	}
}

function ratePlanApplicableForAppointment() {

	var appointmentId = "", scheduleId = "", scheduleName = "", category = "";
	var consultationTypeId = "";
	var primaryResource = getSchedulerPrimaryResource();

	if (!empty(primaryResource)) {
		for (var i = 0; i < appointmentDetailsList.length; i++) {
			var category = appointmentDetailsList[i].category;
			var isPrimary = appointmentDetailsList[i].primary_resource;
			if (isPrimary) {
				appointmentId	= appointmentDetailsList[i].appointment_id;
				category		= appointmentDetailsList[i].category;
				scheduleId		= appointmentDetailsList[i].res_sch_name;
				scheduleName	= appointmentDetailsList[i].central_resource_name;
				consultationTypeId	= appointmentDetailsList[i].consultation_type_id;
				break;
			}
		}
	}

	if (empty(appointmentId) || appointmentId == '0') return true;

	if (category == 'DOC' && (empty(consultationTypeId) || consultationTypeId == 0 || consultationTypeId == '0')) return true;
	else if (empty(scheduleId)) return true;

	var organizationObj = document.mainform.organization;

	var orgId = organizationObj.options[organizationObj.options.selectedIndex].value;
	var orgName = organizationObj.options[organizationObj.options.selectedIndex].text;

	orgId = empty(orgId) ? 'ORG0001' : orgId;
	orgName = empty(orgName) ? 'GENERAL' : orgName;

	var reqObject = newXMLHttpRequest();
	var url = cpath + "/pages/registration/regUtils.do?_method=isRatePlanApplicable&category=" +
		category + "&orgId=" + orgId;

	if (category == 'DOC')
		url += "&schedule_id=" + consultationTypeId;
	else
		url += "&schedule_id=" + scheduleId;

	reqObject.open("POST", url.toString(), false);
	reqObject.send(null);
	if (reqObject.readyState == 4) {
		if ((reqObject.status == 200) && (reqObject.responseText != null)) {
			if (!empty(reqObject.responseText)) {
				if (reqObject.responseText != 't') {

					var schMsg = " "+getString("js.registration.patient.patient.scheduled");
					var msg = getString("js.registration.patient.is.not.applicable.with.rate.plan");

					if (category == 'SNP') {
						alert(schMsg +" "+ getString("js.registration.patient.patient.service") +": "+scheduleName +" \n "+ msg +" : " + orgName);
						return false;
					} else if (category == 'DIA') {
						alert(schMsg +" "+ getString("js.registration.patient.patient.test") +": "+scheduleName +" \n "+ msg +" : " + orgName);
						return false;
					} else if (category == 'OPE') {
						alert(schMsg +" "+ getString("js.registration.patient.patient.surgery") +": "+scheduleName +" \n "+ msg +" : " + orgName);
						return false;
					} else if (category == 'DOC') {
						var consultationType = "";

						var consTypes		   = cachedConsultTypes[orgId];
						var consultation	   = findInList(consTypes, "consultation_type_id", consultationTypeId);
						if (empty(consultation)) {
							consTypes		   = cachedConsultTypes["ORG0001"];
							consultation 	   = findInList(consTypes, "consultation_type_id", consultationTypeId);
						}
						consultationType  = (!empty(consultation)) ? consultation.consultation_type : "";

						if (consultationType == "") return true;

						alert(schMsg +" "+ getString("js.registration.patient.patient.consultation") +": "+consultationType +" \n "+ msg +" : " + orgName);
						return false;
					}
				}
			}
		}
	}
	return true;
}


function validateEmptyOrders() {
	if (screenid == "reg_registration") {

		//Validate Scheduler Doctor Consultation.
		if (!validateSchConsultation()) {
			return false;
		}

		var ordertab = document.getElementById('orderTable' + 0);
		var rows = ordertab.rows.length;
		if (rows == 2 && document.mainform.doctorCharge.value == "") {
			var ok = confirm(" "+getString("js.registration.patient.warning.no.order.is.placed.no.consultatio.is.selected.string")
						+"\n " + getString("js.registration.patient.want.to.continue.string"));
			if (!ok) {
				document.getElementById("doctorCharge").focus();
				return false;
			}
		}
	}
	return true;
}


function register() {

	if (!validateEmptyOrders()) return false;

	document.mainform.patient_area.value = trimAll(document.mainform.patient_area.value);
	//if (!validateCategoryExpiryDate()) return false;

	if (screenid == "reg_registration") {
		document.mainform.action = 'quickregistration.do';
	} else if (screenid == "ip_registration") {
		document.mainform.action = 'IpRegistration.do';
	} else {
		document.mainform.action = 'outPatientRegistration.do';
	}

	document.mainform._method.value = "doRegister";
	document.getElementById('patient_name').disabled = false;

	enableDisableDateOfBirthFields('dob', false);
	document.mainform.age.disabled = false;
	document.mainform.ageIn.disabled = false;
	document.mainform.patient_gender.disabled = false;

	enableCustomLists();
	// Pass the forceDisabled value as false so that while registration, the disabled insurance fields are enabled.
	disableOrEnableInsuranceFields(false, false);
	if (document.mainform.op_type) document.mainform.op_type.disabled = false;
	document.getElementById('referaldoctorName').disabled = false;
	if (screenid != "out_pat_reg") document.getElementById('ailment').disabled = false;

	disableOrEnableRegisterBtns(true);
	document.mainform.submit();

} //end of register

function getRegDetailsOnMrnoNoChange() {
	// Reset the selected doctor on mrno change.
	gSelectedDoctorName = null;
	gSelectedDoctorId = null;
	var mrno = document.mrnoform.mrno.value;
	var newReg = isNewReg();
	if (!newReg && !empty(gMrNo) && trim(gMrNo) != '' && trim(mrno) != '' && trim(gMrNo) != trim(mrno)) {
		clearRegDetails();
	}
	document.mrnoform.mrno.value = mrno;
	getRegDetails();
}

function getRegDetails() {
	clearTodaysAppointmentDetails();
	var mrno = document.mrnoform.mrno.value;
	var mainVisitId = document.mainform.main_visit_id.value;
	var isFollowUpNoCons = (document.mainform.op_type != null && document.mainform.op_type.value == "D");

	var ajaxobj1 = newXMLHttpRequest();
	var url = '../../pages/registration/regUtils.do?_method=getPatientDetailsJSON&mrno=' + mrno;
	url = url + '&reg_screen_id='+screenid;
	(isDoctorChange || isFollowUpNoCons) ? url = url+'&patient_id='+mainVisitId : '';
	getResponseHandlerText(ajaxobj1, patientDetailsResponseHandler, url.toString());
}

function empty(obj) {
	if (obj == null || obj == undefined || obj == '') return true;
}

function clearPreviousPatientDetails() {
	patient = null;
	gLastVisitId = null;
	gVisitId = null;
	gConsultationStatus = null;
	gPreviousVisitDoctor = null;
	gPreviousVisitDept = null;
	gMrNo = null;

	gPreviousPrimarySponsorIndex = "";
	gPreviousSecondarySponsorIndex = "";

	gPreviousPrimaryInsCompany = null;
	gPreviousPrimaryTpa = null;

	gPreviousPlan = null;
	gPreviousPlanType = null;
	gPreviousMemberId = null;
	gPreviousPolicyNumber = null;
	gPreviousHolder = null;
	gPreviousRelation = null;
	gPreviousStartDate = null;
	gPreviousEndDate = null;
	gPreviousPatientPolicyId = null;
	gPreviousPriorauthid = null;
	gPreviousPriorauthmodeid = null;

	gPreviousSecondaryInsCompany = null;
	gPreviousSecondaryTpa = null;

	gPreviousSecPlan = null;
	gPreviousSecPlanType = null;
	gPreviousSecMemberId = null;
	gPreviousSecPolicyNumber = null;
	gPreviousSecHolder = null;
	gPreviousSecRelation = null;
	gPreviousSecStartDate = null;
	gPreviousSecEndDate = null;
	gPreviousSecPatientPolicyId = null;
	gPreviousSecPriorauthid = null;
	gPreviousSecPriorauthmodeid = null;

	gPreviousCorporateRelation = null;
	gPreviousCorporateSponsorId = null;
	gPreviousCorporateEmployeeId = null;
	gPreviousCorporateEmployeeName = null;
	gPreviousNationalSponsorId = null;
	gPreviousNationalId = null;
	gPreviousNationalCitizenName = null;
	gPreviousNationalRelation = null;

	gPreviousSecCorporateRelation = null;
	gPreviousSecCorporateSponsorId = null;
	gPreviousSecCorporateEmployeeId = null;
	gPreviousSecCorporateEmployeeName = null;
	gPreviousSecNationalSponsorId = null;
	gPreviousSecNationalId = null;
	gPreviousSecNationalCitizenName = null;
	gPreviousSecNationalRelation = null;

	gPreviousPatientCategoryId = null;
	gPreviousPatientCategoryExpDate = null;
	gPreviousRatePlan = null;

	gPatientComplaint = null;

	gPatientLastIpVisit = null;
	gFollowUpDocVisits = null;
	gLastGenRegChargeAcceptedDate = null;
	gPatientRegDate = null;
	gPatientPolciyNos = null;
	gPatientCorporateIds = null;
	gPatientNationalIds = null;
	gPreviousDocVisits = null;

	gTestPrescriptions = null;
	gServicePrescriptions = null;
	gConsultationPrescriptions = null;
	gDietPrescriptions = null;
	gStandingInstructions = null;
	gOperationPrescriptions = null;

	gPatientBillsApprovalTotal = null;
	gPrevVisitDues = null;
	gPatientFamilyBillsTotal = null;
	gPatMultiVisitComponentDetails = null;
	gPatMultiVisitConsumedDetails = null;
	gMvPackageIds = null;

}


var gLastVisitId = null;
var gVisitId = null;
var gConsultationStatus = null;
var gPreviousVisitDoctor = null;
var gPreviousVisitDept = null;
var gMrNo = null;

var gPreviousPrimarySponsorIndex = "";
var gPreviousSecondarySponsorIndex = "";

var gPreviousPrimaryInsCompany = null;
var gPreviousPrimaryTpa = null;

var gPreviousPlan = null;
var gPreviousPlanType = null;
var gPreviousMemberId = null;
var gPreviousPolicyNumber = null;
var gPreviousHolder = null;
var gPreviousRelation = null;
var gPreviousStartDate = null;
var gPreviousEndDate = null;
var gPreviousPatientPolicyId = null;
var gPreviousPriorauthid = null;
var gPreviousPriorauthmodeid = null;

var gPreviousSecondaryInsCompany = null;
var gPreviousSecondaryTpa = null;

var gPreviousSecPlan = null;
var gPreviousSecPlanType = null;
var gPreviousSecMemberId = null;
var gPreviousSecPolicyNumber = null;
var gPreviousSecHolder = null;
var gPreviousSecRelation = null;
var gPreviousSecStartDate = null;
var gPreviousSecEndDate = null;
var gPreviousSecPatientPolicyId = null;
var gPreviousSecPriorauthid = null;
var gPreviousSecPriorauthmodeid = null;

var gPreviousCorporateRelation = null;
var gPreviousCorporateSponsorId = null;
var gPreviousCorporateEmployeeId = null;
var gPreviousCorporateEmployeeName = null;
var gPreviousNationalSponsorId = null;
var gPreviousNationalId = null;
var gPreviousNationalCitizenName = null;
var gPreviousNationalRelation = null;

var gPreviousSecCorporateRelation = null;
var gPreviousSecCorporateSponsorId = null;
var gPreviousSecCorporateEmployeeId = null;
var gPreviousSecCorporateEmployeeName = null;
var gPreviousSecNationalSponsorId = null;
var gPreviousSecNationalId = null;
var gPreviousSecNationalCitizenName = null;
var gPreviousSecNationalRelation = null;

var gPreviousPatientCategoryId = null;
var gPreviousPatientCategoryExpDate = null;
var gPreviousRatePlan = null;

var gPatientComplaint = null;

var gPatientLastIpVisit = null;
var gFollowUpDocVisits = null;
var gLastGenRegChargeAcceptedDate = null;
var gPatientRegDate = null;
var gPatientPolciyNos = null;
var gPatientCorporateIds = null;
var gPatientNationalIds = null;
var gPreviousDocVisits = null;

var gTestPrescriptions = null;
var gServicePrescriptions = null;
var gConsultationPrescriptions = null;
var gDietPrescriptions = null;
var gStandingInstructions = null;
var gOperationPrescriptions = null;

var gPatientBillsApprovalTotal = null;
var gPrevVisitDues = null;
var gPatientFamilyBillsTotal = null;

var patient = null;
var filter = '';
var gPatMultiVisitComponentDetails = null;
var gPatMultiVisitConsumedDetails = null;
var gMvPackageIds = null;
function loadPatientResponseDetails(patientInfo, patient) {

	gLastVisitId = patientInfo.lastVisitId;
	gConsultationStatus = patientInfo.consultation_status;
	gPreviousVisitDoctor = patient.doctor;
	gPreviousVisitDept = patient.dept_id;
	gMrNo = patient.mr_no;
	gPatientPolciyNos = patientInfo.policyNos;
	gVisitId = patient.patient_id;

	if (gPatientPolciyNos.length == 2 ) {

		var primaryPlanDetais = gPatientPolciyNos[0];
		var secondaryPlanDetails = gPatientPolciyNos[1];

		gPreviousPrimaryInsCompany = primaryPlanDetais.insurance_co;
		gPreviousPrimaryTpa = primaryPlanDetais.sponsor_id;
		gPreviousPlan = primaryPlanDetais.plan_id;
		gPreviousPlanType = primaryPlanDetais.plan_type_id;
		gPreviousMemberId = !empty(primaryPlanDetais.member_id) ? primaryPlanDetais.member_id : null;
		gPreviousPolicyNumber = !empty(primaryPlanDetais.policy_number) ? primaryPlanDetais.policy_number : null;
		gPreviousHolder = !empty(primaryPlanDetais.policy_holder_name) ? primaryPlanDetais.policy_holder_name : null;
		gPreviousRelation = !empty(primaryPlanDetais.patient_relationship) ? primaryPlanDetais.patient_relationship : null;
		gPreviousStartDate = primaryPlanDetais.policy_validity_start;
		gPreviousEndDate = primaryPlanDetais.policy_validity_end;
		gPreviousPatientPolicyId = primaryPlanDetais.patient_policy_id;
		gPreviousPriorauthid = primaryPlanDetais.prior_auth_id;
		gPreviousPriorauthmodeid = primaryPlanDetais.prior_auth_mode_id;

		gPreviousSecondaryInsCompany = secondaryPlanDetails.insurance_co;
		gPreviousSecondaryTpa = secondaryPlanDetails.sponsor_id;
		gPreviousSecPlan = secondaryPlanDetails.plan_id;
		gPreviousSecPlanType = secondaryPlanDetails.plan_type_id;
		gPreviousSecMemberId = !empty(secondaryPlanDetails.member_id) ? secondaryPlanDetails.member_id : null;
		gPreviousSecPolicyNumber = !empty(secondaryPlanDetails.policy_number) ? secondaryPlanDetails.policy_number : null;
		gPreviousSecHolder = !empty(secondaryPlanDetails.policy_holder_name) ? secondaryPlanDetails.policy_holder_name : null;
		gPreviousSecRelation = !empty(secondaryPlanDetails.patient_relationship) ? secondaryPlanDetails.patient_relationship : null;
		gPreviousSecStartDate = secondaryPlanDetails.policy_validity_start;
		gPreviousSecEndDate = secondaryPlanDetails.policy_validity_end;
		gPreviousSecPatientPolicyId = secondaryPlanDetails.patient_policy_id;
		gPreviousSecPriorauthid = secondaryPlanDetails.prior_auth_id;
		gPreviousSecPriorauthmodeid = secondaryPlanDetails.prior_auth_mode_id;

		gPreviousPrimarySponsorIndex = 'I';
		gPreviousSecondarySponsorIndex = 'I';

	} else if (gPatientPolciyNos.length == 1) {

		if (!empty(patient.corporate_sponsor_id) || !empty(patient.national_sponsor_id) ) {

			var secondaryPlanDetails = gPatientPolciyNos[0];

			gPreviousSecondaryInsCompany = secondaryPlanDetails.insurance_co;
			gPreviousSecondaryTpa = secondaryPlanDetails.sponsor_id;
			gPreviousSecPlan = secondaryPlanDetails.plan_id;
			gPreviousSecPlanType = secondaryPlanDetails.plan_type_id;
			gPreviousSecMemberId = !empty(secondaryPlanDetails.member_id) ? secondaryPlanDetails.member_id : null;
			gPreviousSecPolicyNumber = !empty(secondaryPlanDetails.policy_number) ? secondaryPlanDetails.policy_number : null;
			gPreviousSecHolder = !empty(secondaryPlanDetails.policy_holder_name) ? secondaryPlanDetails.policy_holder_name : null;
			gPreviousSecRelation = !empty(secondaryPlanDetails.patient_relationship) ? secondaryPlanDetails.patient_relationship : null;
			gPreviousSecStartDate = secondaryPlanDetails.policy_validity_start;
			gPreviousSecEndDate = secondaryPlanDetails.policy_validity_end;
			gPreviousSecPatientPolicyId = secondaryPlanDetails.patient_policy_id;
			gPreviousSecPriorauthid = secondaryPlanDetails.prior_auth_id;
			gPreviousSecPriorauthmodeid = secondaryPlanDetails.prior_auth_mode_id;

			gPreviousSecondarySponsorIndex = 'I';
			gPreviousPrimarySponsorIndex = (!empty(patient.corporate_sponsor_id)) ? 'C' : 'N';
			gPreviousPrimaryTpa = patient.primary_sponsor_id;

		} else if ((!empty(patient.sec_corporate_sponsor_id) || !empty(patient.sec_national_sponsor_id))
						|| (empty(patient.sec_corporate_sponsor_id) && empty(patient.sec_national_sponsor_id))) {

			var primaryPlanDetais = gPatientPolciyNos[0];

			gPreviousPrimaryInsCompany = primaryPlanDetais.insurance_co;
			gPreviousPrimaryTpa = primaryPlanDetais.sponsor_id;
			gPreviousPlan = primaryPlanDetais.plan_id;
			gPreviousPlanType = primaryPlanDetais.plan_type_id;
			gPreviousMemberId = !empty(primaryPlanDetais.member_id) ? primaryPlanDetais.member_id : null;
			gPreviousPolicyNumber = !empty(primaryPlanDetais.policy_number) ? primaryPlanDetais.policy_number : null;
			gPreviousHolder = !empty(primaryPlanDetais.policy_holder_name) ? primaryPlanDetais.policy_holder_name : null;
			gPreviousRelation = !empty(primaryPlanDetais.patient_relationship) ? primaryPlanDetais.patient_relationship : null;
			gPreviousStartDate = primaryPlanDetais.policy_validity_start;
			gPreviousEndDate = primaryPlanDetais.policy_validity_end;
			gPreviousPatientPolicyId = primaryPlanDetais.patient_policy_id;
			gPreviousPriorauthid = primaryPlanDetais.prior_auth_id;
			gPreviousPriorauthmodeid = primaryPlanDetais.prior_auth_mode_id;

			gPreviousPrimarySponsorIndex = 'I';
			gPreviousSecondarySponsorIndex = (!empty(patient.sec_corporate_sponsor_id)) ? 'C' : (!empty(patient.sec_national_sponsor_id) ? 'N' : '');
			gPreviousSecondaryTpa = patient.secondary_sponsor_id;

		}


	} else {
		gPreviousPrimarySponsorIndex = !empty(patient.sponsor_type) ? patient.sponsor_type : '';
		gPreviousSecondarySponsorIndex = !empty(patient.sec_sponsor_type) ? patient.sec_sponsor_type : '';
		gPreviousPrimaryTpa = patient.primary_sponsor_id;
		gPreviousSecondaryTpa = patient.secondary_sponsor_id;
	}

	gPreviousCorporateRelation =  !empty(patient.patient_corporate_relation) ? patient.patient_corporate_relation : null;
	gPreviousCorporateSponsorId = !empty(patient.corporate_sponsor_id) ? patient.corporate_sponsor_id : null;
	gPreviousCorporateEmployeeId = !empty(patient.employee_id) ? patient.employee_id : null;
	gPreviousCorporateEmployeeName =  !empty(patient.employee_name) ? patient.employee_name : null;
	gPreviousNationalSponsorId = !empty(patient.national_sponsor_id) ? patient.national_sponsor_id : null;
	gPreviousNationalId = !empty(patient.national_id) ? patient.national_id : null;
	gPreviousNationalCitizenName = !empty(patient.citizen_name) ? patient.citizen_name : null;
	gPreviousNationalRelation = !empty(patient.patient_national_relation) ? patient.patient_national_relation : null;

	gPreviousSecCorporateRelation =  !empty(patient.sec_patient_corporate_relation) ? patient.sec_patient_corporate_relation : null;
	gPreviousSecCorporateSponsorId = !empty(patient.sec_corporate_sponsor_id) ? patient.sec_corporate_sponsor_id : null;
	gPreviousSecCorporateEmployeeId = !empty(patient.sec_employee_id) ? patient.sec_employee_id : null;
	gPreviousSecCorporateEmployeeName =  !empty(patient.sec_employee_name) ? patient.sec_employee_name : null;
	gPreviousSecNationalSponsorId = !empty(patient.sec_national_sponsor_id) ? patient.sec_national_sponsor_id : null;
	gPreviousSecNationalId = !empty(patient.sec_national_id) ? patient.sec_national_id : null;
	gPreviousSecNationalCitizenName = !empty(patient.sec_citizen_name) ? patient.sec_citizen_name : null;
	gPreviousSecNationalRelation = !empty(patient.sec_patient_national_relation) ? patient.sec_patient_national_relation : null;

	gFollowUpDocVisits = patientInfo.followUpDocVisits;
	gPatientLastIpVisit = patientInfo.patientLastIpVisit;

	gPatientCorporateIds = patientInfo.corporateIds;
	gPatientNationalIds = patientInfo.nationalIds;
	gPreviousDocVisits = patientInfo.previousDocVisits;
	gLastGenRegChargeAcceptedDate = new Date(patientInfo.recentGenRegChargePostedDate);
	gPatientRegDate = new Date(patient.reg_date);

	gTestPrescriptions = patientInfo.previousTestPrescriptions;
	gServicePrescriptions = patientInfo.previousServicePrescriptions;
	gConsultationPrescriptions = patientInfo.previousConsultationPrescriptions;

	gDietPrescriptions = '';
	gStandingInstructions = '';
	gOperationPrescriptions = '';

	gPatientBillsApprovalTotal = patientInfo.billsApprovalTotal;
	gPrevVisitDues = !empty(patientInfo.previousVisitDues) ? patientInfo.previousVisitDues : null;
	gPatientFamilyBillsTotal = patientInfo.patientFamilyBillsTotal;
	gPatMultiVisitComponentDetails = patientInfo.patientMultiVisitPacakgeComponentDetails;
	gPatMultiVisitConsumedDetails = patientInfo.patientMultiVisitPacakgeConsumedDetails;
	gMvPackageIds = patientInfo.mvPackageIds;
	// If General registration patient then patient category is patient.patient_category_id else patient.patient_category
	var patientCategoryId = !empty(patient.patient_category) ? patient.patient_category : patient.patient_category_id;
	if(!empty(patient))
		insured = empty(patient.primary_sponsor_id) ? false : true;
	if (empty(patient.visit_status) || patient.visit_status == 'N')
		patientCategoryId = !empty(patient.patient_category_id) ? patient.patient_category_id : 1;

	gPreviousPatientCategoryId = patientCategoryId;
	gPreviousPatientCategoryExpDate = !empty(patient.category_expiry_date) ? patient.category_expiry_date : null;
	gPreviousRatePlan = patient.org_id;

	gPatientComplaint = !empty(patient.complaint) ? patient.complaint : "";

	/*
	 * Got the patient, now, set the patient's info in the details section
	 */
	var form = document.mainform;
	if (document.mrnoform.tmp_verfiy_finger_print && !empty(patientInfo.pVisitBean)) {
		form.verify_finger_print.value = patientInfo.pVisitBean.verify_finger_print;
		if (patientInfo.pVisitBean.verify_finger_print == 'Y') {
			document.mrnoform.tmp_verify_finger_print.checked = true;
		} else {
			document.mrnoform.tmp_verify_finger_print.checked = false;
		}
	}

	setSelectedIndex(form.salutation, patient.salutation_id);
	form.patient_name.value = patient.patient_name;
	// for four parts name while we editing registration through mr_no auto-complete we can
	//populate the values in to text boxes by splitting the middle name & show in different text boxes
	var middle_name = patient.middle_name;
	if(regPref.name_parts == 4){
		if(middle_name != null && middle_name !='' && middle_name != undefined){
			if(middle_name.contains(" ")){
				form.middle_name.value = middle_name.substr(0,middle_name.indexOf(" "));
				form.middle_name2.value = middle_name.substr(middle_name.indexOf(" ")+1,middle_name.length-1);
			}
			else
				form.middle_name.value = middle_name;
		}
	}
	else {
		form.middle_name.value = patient.middle_name;
	}
	form.last_name.value = patient.last_name;
	if(regPref.name_local_lang_required == 'Y')
		form.name_local_language.value = patient.name_local_language;

	if ((roleId == 1 || roleId == 2) || (editFirstName == "A") && (roleId != 1 || roleId != 2)) {
		document.getElementById('patient_name').disabled = false;
		enableDisableDateOfBirthFields('dob', false);
		form.age.disabled = false;
		form.ageIn.disabled = false;
		form.patient_gender.disabled = false;
	} else {
		document.getElementById('patient_name').disabled = true;
		enableDisableDateOfBirthFields('dob', true);
		form.age.disabled = true;
		form.ageIn.disabled = true;
		form.patient_gender.disabled = true;
	}

	if ((roleId == 1 || roleId == 2) || (catChangeRights == "A") && (roleId != 1 || roleId != 2)) {
		if (form.patient_category_id) form.patient_category_id.disabled = false;
		if (form.category_expiry_date) form.category_expiry_date.readOnly = false;
	} else {
		if (form.patient_category_id) form.patient_category_id.disabled = true;
		if (form.category_expiry_date) form.category_expiry_date.readOnly = true;
	}

	if (patient.vip_status != null) {
		document.mainform.vip_check.checked = patient.vip_status == 'Y' ? true : false;
		enableVipStatus();
	}
	if (patient.dateofbirth != null) {
		setDateOfBirthFields('dob', new Date(patient.dateofbirth));
	} else {
		setDateOfBirthFields('dob', null);
	}
	if (gLastVisitId != null) {
		form.previousVisit.value = "Y";
	} else {
		form.previousVisit.value = "N";
	}
	form.age.value = patient.age;
	form.patient_phone2.value = patient.addnl_phone;
	form.patient_area.value = patient.patient_area;

	checkTypeOfReg();

	if (allowMultipleActiveVisits == 'Y') {
		// Set the previous visit id to be closed if visit is OP/IP/OUTSIDE visit and Active.
		if ((patient.visit_status != null) && (patient.visit_status == 'A')
			&& !empty(patient.visit_type) && (patient.visit_type == 'o' || patient.visit_type == 'i')) {
			document.mrnoform.close_last_active_visit.disabled = false;
			document.mrnoform.close_last_active_visit.checked = true;
		} else {
			document.mrnoform.close_last_active_visit.disabled = true;
			document.mrnoform.close_last_active_visit.checked = false;
		}
		setLastVisitToClose();
	}

	// Set the patient category and category expiry date.
	var patientCategoryObj = document.mainform.patient_category_id;
	var patientCategoryExpDtObj = document.mainform.category_expiry_date;

	if (!empty(gPreviousPatientCategoryId) && patientCategoryObj) {
		var isMain = ((document.mainform.op_type && document.mainform.op_type.value == "M") || empty(document.mainform.op_type));
		var isRevisit = ((document.mainform.op_type && document.mainform.op_type.value == "R") || empty(document.mainform.op_type));
		var isFollowUp = !isMain && !isRevisit;
		var visitCenterId = patient.center_id;
		var activeVisit = patientInfo.active_visit_in_another_center;

		var cat = findInList(categoryJSON, "category_id", gPreviousPatientCategoryId);
		var catAllowed = cat == null ? false : (cat.center_id == 0 || cat.center_id == centerId);
		var disableButtons = false;
		var categoryName = empty(patient.category_name) ? patient.patient_category_name : patient.category_name;
		if (!catAllowed) {
			if (isMain || isRevisit) {
				if (allowMultipleActiveVisits == 'Y' && activeVisit != null) {
					disableButtons = true;
					var msg = getString("js.registration.patient.catnotallowed.multiplevisits");
					alert(msg.replace("#", categoryName));
				} else {
					alert(getString("js.registration.patient.catnotallowed.mainvisit")+ " "+categoryName);
					gPreviousPatientCategoryId = 1;
				}
			} else {
				disableButtons = true;
				var msg = getString("js.registration.patient.catnotallowed.followup");
				alert(msg.replace("#", categoryName));
			}
		}
		if (disableButtons) {
			disableOrEnableRegisterBtns(true);
		}
		if (empty(patient.visit_status) || patient.visit_status == 'N') {
			setSelectedIndex(patientCategoryObj, "");
			onChangeCategory(); // reset patient category if pre-registered patient
		}
		if (gPreviousPatientCategoryId == 1 && findInList(categoryJSON, "category_id", gPreviousPatientCategoryId) == null) {
			var msg = getString("js.registration.patient.catnotallowed.inactive");
			alert(msg.replace("#", gen_category.category_name));
		}
		setSelectedIndex(patientCategoryObj, gPreviousPatientCategoryId);
		onChangeCategory(); // this will also load the tpa list
	}

	if (!empty(gPreviousPatientCategoryExpDate) && patientCategoryExpDtObj) {
		patientCategoryExpDtObj.value = formatDate(new Date(gPreviousPatientCategoryExpDate), "ddmmyyyy", "-");
		document.getElementById('cardExpiryDate').value = formatDate(new Date(gPreviousPatientCategoryExpDate), "ddmmyyyy", "-");
	}

	setSelectedIndex(form.ageIn, patient.agein);
	setSelectedIndex(form.patient_gender, patient.patient_gender);

	form.patient_phone.value = patient.patient_phone;
	if (patient.email_id != null) form.email_id.value = patient.email_id;

	form.patient_city.value = patient.patient_city;
	form.patient_state.value = patient.patient_state;
	form.country.value = patient.country;

	form.pat_city_name.value = patient.city_name;
	document.getElementById("statelbl").textContent = patient.state_name;
	document.getElementById("countrylbl").textContent = patient.country_name;

  /*if ((form.bloodgroup != null) && !empty(patient.bloodgroup) && form.bloodgroup)
		setSelectedIndex(form.bloodgroup, patient.bloodgroup);
    if ((form.religion != null) && !empty(patient.religion) && form.religion)
		setSelectedIndex(form.religion, patient.religion);
    if ((form.occupation != null) && !empty(patient.occupation) && form.occupation)
		setSelectedIndex(form.occupation, patient.occupation);*/

	for (var i=1; i<10; i++) {
		var customListValue = eval("patient.custom_list"+i+"_value");
		var customListLabel = eval("custom_list"+i+"_name");
		var customListObj = eval("form.custom_list"+i+"_value");
		if (!empty(customListValue) && !empty(customListLabel) && customListObj)
			customListObj.value = customListValue;
	}

	for (var i=1; i<20; i++) {
		var customFieldValue = eval("patient.custom_field"+i);
		var customFieldLabel = eval("custom_field"+i+"_label");
		var customFieldObj = eval("form.custom_field"+i);
		if (!empty(customFieldValue) && !empty(customFieldLabel) && customFieldObj) {
			if(i>13 && i<17) {
				customFieldValue = formatDate(new Date(customFieldValue), "ddmmyyyy", "-");
			}
			customFieldObj.value = customFieldValue;
		}
	}

	for (var i=1; i<3; i++) {
		var customListValue = eval("patient.visit_custom_list"+i);
		var customListLabel = eval("visit_custom_list"+i+"_name");
		var customListObj = eval("form.visit_custom_list"+i);
		if (!empty(customListValue) && !empty(customListLabel) && customListObj)
			customListObj.value = customListValue;
	}

	for (var i=1; i<10; i++) {
		var customFieldValue = eval("patient.visit_custom_field"+i);
		var customFieldLabel = eval("visit_custom_field"+i+"_name");
		var customFieldObj = eval("form.visit_custom_field"+i);
		if (!empty(customFieldValue) && !empty(customFieldLabel) && customFieldObj) {
			if(i>3 && i<7) {
				customFieldValue = formatDate(new Date(customFieldValue), "ddmmyyyy", "-");
			}
			customFieldObj.value = customFieldValue;
		}
	}

    if (!empty(patient.identifier_id) && !empty(govtID) && form.identifier_id)
		setSelectedIndex(form.identifier_id, patient.identifier_id);
    if (!empty(patient.government_identifier) && !empty(govtIDType) && form.government_identifier)
		form.government_identifier.value = patient.government_identifier;

	if (!empty(patient.passport_no) && !empty(passportNoLabel) && form.passport_no)
		form.passport_no.value = patient.passport_no;
	if (!empty(patient.passport_issue_country) && !empty(passportIssueCountryLabel) && form.passport_issue_country)
		setSelectedIndex(form.passport_issue_country, patient.passport_issue_country);
	if (!empty(patient.passport_validity) && !empty(passportValidityLabel) && form.passport_validity)
		form.passport_validity.value = formatDate(new Date(patient.passport_validity), "ddmmyyyy", "-");
	if (!empty(patient.visa_validity) && !empty(visaValidityLabel) && form.visa_validity)
		form.visa_validity.value = formatDate(new Date(patient.visa_validity), "ddmmyyyy", "-");

	if (!empty(patient.family_id) && !empty(familyIDLabel) && form.family_id)
		form.family_id.value = patient.family_id;

	var referenceDocId = !empty(patient.reference_docto_id) ? patient.reference_docto_id : '';

	if (referenceDocId != "") {
		for (i = 0; i < referalsJSON.length; i++) {
			var item = referalsJSON[i];
			if (referenceDocId == item["REF_ID"]) {
				document.getElementById('referaldoctorName').value = item["REF_NAME"];
				document.getElementById('referred_by').value = item["REF_ID"];
				if (screenid == "out_pat_reg" && document.getElementById('clinician_label')) {
					document.getElementById('clinician_label').innerHTML = item["CLINICIAN_ID"];
					document.getElementById('clinician_id').value = item["CLINICIAN_ID"];
				}
			}
		}
	}

	if (patient.dept_id != null && screenid != "out_pat_reg") {
		setSelectedIndex(form.dept_name, patient.dept_id);
		DeptChange();
		if (document.mainform.unit_id != null && patient.unit_id != null)
			setSelectedIndex(form.unit_id, patient.unit_id);
	}
	if (patient.patient_address != null)
		form.patient_address.value = UnFormatTextAreaValues(patient.patient_address);
	else form.patient_address.value = "";

	if (form.oldmrno != null) {
		if (!empty(patient.oldmrno)) {
			form.oldmrno.value = patient.oldmrno;
			form.oldmrno.readOnly = true;
		} else {
			form.oldmrno.value = patient.oldmrno;
			form.oldmrno.readOnly = false;
		}
	}
	mrno = document.mrnoform.mrno.value;
	if (form.casefileNo != null) {
		if (!empty(patient.casefile_no)) {
			form.casefileNo.value = patient.casefile_no;
			form.casefileNo.readOnly = true;
			form.oldRegAutoGenerate.checked = false;
			form.oldRegAutoGenerate.disabled = true;
			if (document.getElementById("autoGenCaseFileDiv") != null)
					document.getElementById("autoGenCaseFileDiv").style.display = 'none';
			if (document.getElementById("caseFileIssuedDiv") != null)
					document.getElementById("caseFileIssuedDiv").style.display = 'table-cell';
			if (!empty(patient.file_status)) {
				if (!empty(patient.issued_to) && patient.file_status != 'A') {
					document.getElementById("caseFileIssuedBy").innerHTML = patient.issued_to;
				} else {
					document.getElementById("caseFileIssuedBy").innerHTML = "MRD Dept";
				}
				if (patient.indented == 'Y') form.raiseCaseFileIndent.disabled = true;
				else form.raiseCaseFileIndent.disabled = false;
			}

		} else {
			form.casefileNo.value = patient.casefile_no;
			form.casefileNo.readOnly = false;
			form.oldRegAutoGenerate.checked = false;
			form.oldRegAutoGenerate.disabled = false;
			form.raiseCaseFileIndent.disabled = false;
			form.raiseCaseFileIndent.checked = false;
			if (document.getElementById("autoGenCaseFileDiv") != null)
					document.getElementById("autoGenCaseFileDiv").style.display = 'table-cell';
			if (document.getElementById("caseFileIssuedDiv") != null)
					document.getElementById("caseFileIssuedDiv").style.display = 'none';
		}
		showHideCaseFile();
	}
	document.getElementById("remarks").value = patient.remarks;
	document.getElementById('prevVisitTag').style.display = 'inline';

	if (patient.doctor_name != null && patient.doctor_name != '') {
		document.getElementById('prvsDoctor').textContent = patient.doctor_name;
		document.getElementById('prvsDate').innerHTML = '<font style="font-weight: normal"> on </font>' + formatDate(new Date(gPatientRegDate), "ddmmyyyy", "-");
	}else {
		document.getElementById('prvsDoctor').textContent = 'None';
		document.getElementById('prvsDate').textContent = '';
	}

	form.patient_care_oftext.value = !empty(patient.patcontactperson) ? patient.patcontactperson :
												(!empty(patient.patient_care_oftext) ? patient.patient_care_oftext : '');
	form.relation.value = !empty(patient.patrelation) ? patient.patrelation : (!empty(patient.relation) ? patient.relation : '');
	form.next_of_kin_relation.value = !empty(patient.next_of_kin_relation) ? patient.next_of_kin_relation : '';
	form.patient_careof_address.value = !empty(patient.pataddress) ? patient.pataddress :
												(!empty(patient.patient_careof_address) ? patient.patient_careof_address : '');

	document.mainform.salutation.focus();

	var mrno = document.mrnoform.mrno.value;
	var ajaxobj2 = newXMLHttpRequest();
	var url = '../../pages/registration/regUtils.do?_method=photoSize&mrno=' + mrno;
	getResponseHandlerText(ajaxobj2, patientPhotoResponseHandler, url.toString());
	document.getElementById('regTyperegd').checked = true;

	// If mod_adv_ins is enabled, initialize the membership id auto complete (if there are more than one membership ids for the patient).
	if (isModAdvanceIns) {
		if (gPreviousPrimarySponsorIndex == 'I')
			policyNoAutoComplete('P', gPatientPolciyNos);
		if (gPreviousSecondarySponsorIndex == 'I')
			policyNoAutoComplete('S', gPatientPolciyNos);
	}

	corporateNoAutoComplete('P', gPatientCorporateIds);
	corporateNoAutoComplete('S', gPatientCorporateIds);

	nationalNoAutoComplete('P', gPatientNationalIds);
	nationalNoAutoComplete('S', gPatientNationalIds);

	var hasDoctor = false;

	// Set the previous visit doctor if the doctor is Active.
	if ((screenid == "reg_registration")) {
		if (!empty(gSelectedDoctorName) && !empty(gSelectedDoctorId)) {
			form.doctor.value = gSelectedDoctorId;
			form.doctor_name.value = gSelectedDoctorName;
			form.doctor_name.title = gSelectedDoctorName;
			setDocRevistCharge(gSelectedDoctorId);
			hasDoctor = true;

		}else if (!empty(patient.doctor) && (gConsultationStatus != "C")) {
			var doctor = findInList(doctorsList, 'doctor_id', patient.doctor);
			if (!empty(doctor)) {
				form.doctor.value = patient.doctor;
				form.doctor_name.value = patient.doctor_name;
				form.doctor_name.title = patient.doctor_name;
				setDocRevistCharge(patient.doctor);
				hasDoctor = true;
			}
		}
	}

	if(advancedPackageModule == 'Y' && screenid == 'reg_registration' && !empty(gMvPackageIds)) {
		document.getElementById('patient_mv_label').style.display = 'table-row';
		document.getElementById('btnMvDetails').disabled = false;
		document.getElementById('patient_mv_value').textContent = getString('js.registration.patient.visitinformation.multivistpackagedetails')+":"+gMvPackageIds.length;
	}


	// Set globally, the selected doctor.
	gSelectedDoctorName = (form.doctor_name != null) ? form.doctor_name.value : null;
	gSelectedDoctorId = (form.doctor != null) ? form.doctor.value : null;

	return hasDoctor;
}

function patientDetailsResponseHandler(responseText) {

	var isFollowUpNoCons = (document.mainform.op_type != null && document.mainform.op_type.value == "D");

	clearPreviousPatientDetails();

	eval("patientInfo =" + responseText);

	if (isFollowUpNoCons) {
		patient = patientInfo.patient;
		loadPatientResponseDetails(patientInfo, patient);

		if (!empty(gPreviousPrimarySponsorIndex) && allowBillNowInsurance == 'false') {
			if (document.mainform.bill_type != null && document.mainform.bill_type.value != 'C') {
				setSelectedIndex(document.mainform.bill_type, "C");
				onChangeBillType();
			}
		}else
			onChangeBillType();

	}else {
		setPatientDetailsResponse(patientInfo);
	}

	// to show all the Doctor consultation appointments

	if (screenid == 'reg_registration' && !empty(patientInfo.patientTodaysAppointmnts) && patientInfo.patientTodaysAppointmnts.length > 0) {
		setPatientAppointmentDetailsResponse(patientInfo);
	}
}

function setPatientAppointmentDetailsResponse (patientInfo) {
	patientTodaysAppointmentDetails = patientInfo.patientTodaysAppointmnts;
	showTodaysAppointments(patientTodaysAppointmentDetails);
}

// this method is to show all Doctor consultation appointments in registration screen.

function showTodaysAppointments (patientTodaysAppointmentDetails) {
	var table = document.getElementById('patientDetailsTable');
	var row;
	var cell;

	if (patientTodaysAppointmentDetails.length > 0) {
		document.getElementById('patDetFieldset').setAttribute('style','height:120px;');
		var disabled = false;
		row =  document.createElement("TR");
		cell = document.createElement("TD");
		cell.setAttribute('class' , 'formlable');
		cell.innerHTML = "Today's Doctor Appointments: <select name='appointment_item' id='appointment_item' class='dropdown' style='width:350px;' onchange='loadAppointmentOrder(this)'>";
		row.appendChild(cell);
		table.appendChild(row);
		var option0 = new Option("-- Select --", "");
		var apptItemObj = document.getElementById('appointment_item');
		var j = 1;
		apptItemObj.options[0] = option0;
		for (var i=0;i<patientTodaysAppointmentDetails.length;i++) {
			if (patientTodaysAppointmentDetails[i].primary_resource) {
				var apptId = patientTodaysAppointmentDetails[i].appointment_id;
				var resourceName = patientTodaysAppointmentDetails[i].central_resource_name;
				var apptTime = patientTodaysAppointmentDetails[i].text_appointment_time;
				var doctorDept = patientTodaysAppointmentDetails[i].doctor_department;
				var dispalyStr = resourceName+"("+doctorDept+") "+"at "+apptTime;
				var option = new Option(dispalyStr,apptId);
				apptItemObj.options[j++] = option;

				if (!disabled)
					disabled = apptId == gAppointmentId ? true : false;
			}
		}

		if (!empty(gAppointmentId)) {
			setSelectedIndex(document.getElementById('appointment_item'),gAppointmentId);
			document.getElementById('appointment_item').disabled = disabled;
		}
	}
}

// loading the scheduled consultation or checked consultation in registration screen to connect the appointment to the patient visit.

function loadAppointmentOrder(obj) {
	if (!empty(obj.value)) {
		var list = filterList(patientTodaysAppointmentDetails,"appointment_id",obj.value);
		category = list[0].category;
		document.mainform.appointmentId.value = list[0].appointment_id;
		document.mainform.category.value = list[0].category;
		appointmentDetailsList = list;
		scheduleName = list[0].res_sch_name;

		if (category == 'DOC') {
			loadConsultation();
		}
	} else {
		clearConsultation();
	}
}

function clearConsultation() {
	var form = document.mainform;
	if (!empty(form.doctor_name.value)) {
		form.doctor_name.value = "";
		form.doctor.value = "";
		form.doctorCharge.value = "";
		setSelectedIndex(form.dept_name, "");
		DeptChange();
		getDoctorCharge();
	}
	document.mainform.appointmentId.value = "";
	document.mainform.category.value = "";
}

function loadConsultation() {
	var form = document.mainform;
	var primaryResource = getSchedulerPrimaryResource();
	if (primaryResource != null) {
		// For Doctor scheduling, load the doctor details
		if (primaryResource.category == 'DOC') {
			setSelectedIndex(form.dept_name, primaryResource.dept_id);
			DeptChange();

			form.doctor_name.value = primaryResource.resourcename;
			form.doctor.value = primaryResource.res_sch_name;

			if (document.mainform.doctorCharge.selectedIndex == 0) {
				// Sets the consultation, op type and gets the doctor charge
				setDocRevistCharge(primaryResource.res_sch_name);
				changeVisitType();
				//first setting the scheduler doctor and then scheduler consultatin type if action is coming form scheduler
				if (!empty(primaryResource.res_sch_name) && !empty(primaryResource.resourcename)) {
					document.mainform.doctor.value = primaryResource.res_sch_name;
					document.mainform.doctor_name.value = primaryResource.resourcename;
				}

				resetDoctorAndReferralOnRevisit();

				if (!empty(primaryResource.consultation_type_id) && primaryResource.consultation_type_id != 0) {
					setSelectedIndex(form.doctorCharge,primaryResource.consultation_type_id);
				}

				setAppointmentDateTimeAsConsultationDateTime(primaryResource);
				getDoctorCharge();

			}
		}
	}

}

function setPatientDetailsResponse(patientInfo) {

	if (empty(patientInfo) || empty(patientInfo.patient)) {
		showMessage("js.registration.patient.valid.mr.no.check");
		document.mrnoform.mrno.value = '';
		document.mrnoform.mrno.focus();
		return false;
	}

	patient = patientInfo.patient;

	if (!empty(patient.original_mr_no)) {
		showMessage("js.registration.patient.valid.mr.no.check");
		document.mrnoform.mrno.value = '';
		document.mrnoform.mrno.focus();
		return false;
	}

	if ((patient.discharge_type != null) && (patient.discharge_type == 'Expiry')) {
		showMessage("js.registration.patient.expired.mrno.check");
		document.mrnoform.mrno.value = '';
		document.mrnoform.mrno.focus();
		return false;
	}

	if(!empty(patient))
		insured = empty(patient.primary_sponsor_id) ? false : true;

	if ((patient.visit_status != null) && (patient.visit_status == 'A') && !isDoctorChange) {
		if (allowMultipleActiveVisits == 'Y') {
			var ok = confirm(getString("js.registration.patient.patient.is.already.registered.with.id.string")+" " + patient.patient_id +
						". \n"+getString("js.registration.patient.want.to.create.new.visit.for.the.patient.string")+" ? ");
			if (!ok) {
				clearRegDetails();
				return false;
			}
		}else {
			alert(getString("js.registration.patient.patient.already.registered.with.id")+": " + patient.patient_id);
			clearRegDetails();
			return false;
		}
	}

	var hasDoctor = loadPatientResponseDetails(patientInfo, patient);

	// Insurance details are also loaded
	// Previous Insurance company, TPA, Plan type, Plan and RatePlan are loaded
	// Also enable the policy validity end date field if empty

	// Load insurance details if patient has any previous visit
	if (!empty(patient.visit_status) && patient.visit_status != 'N'
			&& !hasDoctor && (screenid == "reg_registration") )
		loadInsurancePolicyDetails();

	// If Revisit, the doctor & referral is not loaded, since the user selects the doctor (and or) referral as well consultation.
	resetDoctorAndReferralOnRevisit();

	changeVisitType();

	if (!empty(gPreviousPrimarySponsorIndex) && allowBillNowInsurance == 'false') {
		if (document.mainform.bill_type != null && document.mainform.bill_type.value != 'C') {
			setSelectedIndex(document.mainform.bill_type, "C");
			onChangeBillType();
		}
	}

	// After the patient's last visit details are loaded, load schedulerappointment details of the patient if patient has an appointment_id.
	var appointmentId = document.mainform.appointmentId.value;
	if(!empty(appointmentId))
		loadSchedulerPatientInfo();

	// Load the complaint if follow up/revisit visit.
	setPatientComplaint();

	//setting admission request realted info
	var admReqId = document.mainform.adm_request_id.value;
	if(!empty(admReqId))
		loadPatientAdmissionRequestInfo();

	// If Patient Category Rate Plan is not changed then load previous prescriptions.
	if ((empty(gSelectedRatePlan) && empty(gSelectedTPA) && empty(gSelectedPlan))
		|| ((gPatientCategoryRatePlan == gPreviousRatePlan) && (gSelectedRatePlan == gPreviousRatePlan))) {
		loadPreviousUnOrderedPrescriptions();
		if (category != null && (category != 'SNP' || !empty(scheduleName)))
				loadSchedulerOrders();
		estimateTotalAmount();
	}

	if (!isDoctorChange && gPrevVisitDues != null) {
		var j = 0;
		var msg = null;
		for (var i = 0; i < gPrevVisitDues.length; i++) {
			if (getPaise(gPrevVisitDues[i].DUE_AMOUNT) != 0) {
				if (j == 0 )
					msg = getString("js.registration.patient.patient.has.following.bills.string")+"\n";

				msg += "" + formatAmountValue(gPrevVisitDues[i].DUE_AMOUNT) + " "+getString("js.registration.patient.from.bill.no.text")+" " + gPrevVisitDues[i].BILL_NO + "\n";
				j++;
			}
		}
		if (!empty(msg))
			alert(msg);
	}

	if (!isDoctorChange && !empty(regPref.family_id) && gPatientFamilyBillsTotal != null && !empty(gPatientFamilyBillsTotal.total_amount)
					&& getPaise(gPatientFamilyBillsTotal.total_amount) != 0 ) {
		var msg = getString("js.registration.patient.total.family.expenditure.string")+"\n"+
				  getString("js.registration.patient.in,this.finacial.year.is.string")+" " +formatAmountValue(gPatientFamilyBillsTotal.total_amount)+"\n \n "+
				  "("+ regPref.family_id +" : "+patient.family_id+")";
		alert(msg);
	}

	isDoctorChange = false;
	enableDisablePlanDetailsButton(gPreviousPrimarySponsorIndex,gPreviousPrimarySponsorIndex);
}

//enabling and disabling palndetails button depending upon primary sponsor or secondary sponsor
function enableDisablePlanDetailsButton(PrimarySponsorIndex,SecondarySponsorIndex) {
	if (!empty(gPreviousPrimarySponsorIndex) && gPreviousPrimarySponsorIndex == "I") {
		if (document.getElementById('pd_primary_planButton') != null) {
			if (!empty(gPreviousPlan)) {
				document.getElementById('pd_primary_planButton').disabled = false;
			} else {
				document.getElementById('pd_primary_planButton').disabled = true;
			}
		}
	} else if (!empty(gPreviousSecondarySponsorIndex) && gPreviousSecondarySponsorIndex == "I") {
		if (!empty(gPreviousPlan)) {
			if (document.getElementById('pd_secondary_planButton') != null)
				document.getElementById('pd_secondary_planButton').disabled = false;
		}
	}
}

// The complaint is loaded if the visit type is follow up/revisit visit.
function setPatientComplaint() {
	if (document.mainform.ailment) {
		if (document.mainform.op_type != null
			&& (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D" || document.mainform.op_type.value == "R")) {
			if (!empty(gPatientComplaint)) {
				document.getElementById('ailment').value = gPatientComplaint;
			}
		}else if (!isNewReg() && !empty(gPatientComplaint) && !empty(document.getElementById('ailment').value)
				&& gPatientComplaint == document.getElementById('ailment').value)
			document.getElementById('ailment').value = "";
	}
}

function checkUseDRG(spnsrIndex) {
	var drgCheckObj = null;
	var useDRGobj = null;

	if (spnsrIndex == 'P') {
		drgCheckObj = getPrimaryDRGCheckObj();
		useDRGobj = getPrimaryUseDRGObj();
	}else if (spnsrIndex == 'S') {
		drgCheckObj = getSecondaryDRGCheckObj();
		useDRGobj = getSecondaryUseDRGObj();
	}
	if (drgCheckObj != null) {
		var useDRG = drgCheckObj.checked ? 'Y' : 'N';
		useDRGobj.value = useDRG;
	}
}

// If Revisit, the doctor is not loaded, since the user selects the doctor as well consultation.
function resetDoctorAndReferralOnRevisit() {
	var appointmentId = document.mainform.appointmentId.value;
	if (document.mainform.op_type && document.mainform.op_type.value == 'R') {
		if(empty(appointmentId)) {
			document.mainform.doctor.value = "";
			document.mainform.doctor_name.value = "";
			document.mainform.doctor_name.removeAttribute("title");
			setDoctorChargeBasedOnPractition('', true);
		}
		document.mainform.referaldoctorName.value = "";
		document.mainform.referred_by.value = "";
	}
}

// Load the scheduler patient details if the patient is already registered.

function loadSchedulerPatientInfo() {
	var form = document.mainform;
	var appointmentId = form.appointmentId.value;
	if (!empty(appointmentId)) {
		var primaryResource = getSchedulerPrimaryResource();

		if (primaryResource != null) {
			form.patient_phone.value = primaryResource.patient_contact;
			form.ailment.value = primaryResource.complaint;

			// For Doctor scheduling, load the doctor details
			if (primaryResource.category == 'DOC') {
				setSelectedIndex(form.dept_name, primaryResource.dept_id);
				DeptChange();

				form.doctor_name.value = primaryResource.resourcename;
				form.doctor.value = primaryResource.res_sch_name;

				if (document.mainform.doctorCharge.selectedIndex == 0) {
					// Sets the consultation, op type and gets the doctor charge
					setDocRevistCharge(primaryResource.res_sch_name);
					changeVisitType();
					//first setting the scheduler doctor and then scheduler consultatin type if action is coming form scheduler
					if (!empty(primaryResource.res_sch_name) && !empty(primaryResource.resourcename)) {
						document.mainform.doctor.value = primaryResource.res_sch_name;
						document.mainform.doctor_name.value = primaryResource.resourcename;
					}

					resetDoctorAndReferralOnRevisit();

					if (!empty(primaryResource.consultation_type_id) && primaryResource.consultation_type_id != 0)
						setSelectedIndex(form.doctorCharge,primaryResource.consultation_type_id);

					setAppointmentDateTimeAsConsultationDateTime(primaryResource);
					loadPreviousUnOrderedPrescriptions();
				}
			} else {
				form.doctor_name.value = '';
				form.doctor.value = '';
				gSelectedDoctorName = document.mainform.doctor_name.value;
				gSelectedDoctorId = document.mainform.doctor.value;
				setDocRevistCharge(document.mainform.doctor.value);
				if (document.getElementById('docConsultationFees') != null) {
					document.getElementById('docConsultationFees').textContent = '';
					getDoctorCharge();
				}
				if (gSelectedRatePlan == gPatientCategoryRatePlan) {
					if (category != null && (category != 'SNP' || !empty(scheduleName)))
						loadSchedulerOrders();
					estimateTotalAmount();
				}
			}
		}
		// If Patient Category not enabled or no default(rateplan or tpa) then load the scheduler orders else the orders are loaded
		// in ratePlanChange() i.e while rateplan/tpa/plan is changed
		if (gSelectedRatePlan == null && gSelectedTPA == null && gSelectedPlan  == null) {
			if (category != null && (category != 'SNP' || !empty(scheduleName)))
				loadSchedulerOrders();
			estimateTotalAmount();
		}
	}
}

var policyNoAutoComp = null;
function policyNoAutoComplete(spnsrIndex, gPatientPolciyNos) {

	var policyIdObj = null;
	if (spnsrIndex == 'S')
		policyIdObj = document.getElementById('secondary_member_id');
	else
		policyIdObj = document.getElementById('primary_member_id');

	if (policyNoAutoComp != null)
		policyNoAutoComp.destroy();

	var policyNoArray = [];
	if (!empty(gPatientPolciyNos)) {
		policyNoArray.length = gPatientPolciyNos.length;
		for (i = 0; i < gPatientPolciyNos.length; i++) {
			var item = gPatientPolciyNos[i]
			policyNoArray[i] = item.member_id + "[" + item.insurance_co_name + "]";
		}
	}
	policyIdObj.disabled = false;
	YAHOO.example.ACJSAddArray = new function () {
		datasource = new YAHOO.widget.DS_JSArray(policyNoArray);

		if (spnsrIndex == 'S')
			policyNoAutoComp = new YAHOO.widget.AutoComplete('secondary_member_id', 'secondaryMemberIdContainer', datasource);
		else
			policyNoAutoComp = new YAHOO.widget.AutoComplete('primary_member_id', 'primaryMemberIdContainer', datasource);

		policyNoAutoComp.formatResult = Insta.autoHighlight;
		policyNoAutoComp.prehighlightClassName = "yui-ac-prehighlight";
		policyNoAutoComp.typeAhead = false;
		policyNoAutoComp.useShadow = false;
		policyNoAutoComp.allowBrowserAutocomplete = false;
		policyNoAutoComp.queryMatchContains = true;
		policyNoAutoComp.minQueryLength = 0;
		policyNoAutoComp.maxResultsDisplayed = 20;
		policyNoAutoComp.forceSelection = false;
		policyNoAutoComp.itemSelectEvent.subscribe(loadPolicyDetails);
	}
}

var loadPolicyDetails = function (sType, aArgs) {
		var oData = aArgs[2];
		var acPolicyNo = (oData + "").split('[')[0];
		var acCompanyName = (((oData + "").split("[")[1]) + "").split("]")[0];

		var inputElmt = policyNoAutoComp.getInputEl();
		var spnsrIndex = (inputElmt.name.substr(0,1)).toUpperCase();

		var insuCompObj = null;
		var planTypeObj = null;
		var planObj = null;
		var policyValidityStartObj = null;
		var policyValidityEndObj = null;
		var memberIdObj = null;
		var policyNumberObj = null;
		var policyHolderObj = null;
		var policyRelationObj = null;

		if (spnsrIndex == 'P') {
			insuCompObj = getPrimaryInsuObj();
			planTypeObj = getPrimaryPlanTypeObj();
			planObj = getPrimaryPlanObj();
			policyValidityStartObj = getPrimaryPolicyValidityStartObj();
			policyValidityEndObj = getPrimaryPolicyValidityEndObj();

			memberIdObj = getPrimaryInsuranceMemberIdObj();
			policyNumberObj = getPrimaryInsurancePolicyNumberObj();
			policyHolderObj = getPrimaryPatientHolderObj();
			policyRelationObj = getPrimaryPatientRelationObj();

		}else if (spnsrIndex == 'S') {
			insuCompObj = getSecondaryInsuObj();
			planTypeObj = getSecondaryPlanTypeObj();
			planObj = getSecondaryPlanObj();
			policyValidityStartObj = getSecondaryPolicyValidityStartObj();
			policyValidityEndObj = getSecondaryPolicyValidityEndObj();

			memberIdObj = getSecondaryInsuranceMemberIdObj();
			policyNumberObj = getSecondaryInsurancePolicyNumberObj();
			policyHolderObj = getSecondaryPatientHolderObj();
			policyRelationObj = getSecondaryPatientRelationObj();

		}

		for (var i = 0; i < gPatientPolciyNos.length; i++) {
			var item = gPatientPolciyNos[i];
			if (acPolicyNo == item.member_id && getCompanyIdForCompanyName(acCompanyName) == item.insurance_co_id) {
				policyValidityStartObj.disabled = false;
				policyValidityEndObj.disabled = false;
				policyHolderObj.disabled = false;
				policyNumberObj.disabled = false;
				setSelectedIndex(insuCompObj, item.insurance_co_id);
				loadTpaList(spnsrIndex);
				tpaChange(spnsrIndex);
				setSelectedIndex(planTypeObj, item.plan_type_id);
				insuCatChange(spnsrIndex);
				setSelectedIndex(planObj, item.plan_id);
				policyChange(spnsrIndex);
				RatePlanList();
				ratePlanChange();
				memberIdObj.value = acPolicyNo;
				policyNumberObj.value = item.policy_number;
				policyHolderObj.value = item.policy_holder_name;
				policyRelationObj.value = item.patient_relationship;
				policyValidityStartObj.value = formatDate(new Date(item.policy_validity_start), "ddmmyyyy", "-");
				policyValidityEndObj.value = formatDate(new Date(item.policy_validity_end), "ddmmyyyy", "-");
				break;
			}
		}
	}

function getCompanyIdForCompanyName(companyName) {
	if (empty(companyName)) {
		showMessage("js.registration.patient.member.id.valid.check.against.insurance.company");
		return null;
	}

	var companyId = null;
	if (!empty(gPatientPolciyNos)) {
		for (var i = 0; i < gPatientPolciyNos.length; i++) {
			if (gPatientPolciyNos[i].insurance_co_name == companyName) {
				companyId = gPatientPolciyNos[i].insurance_co_id;
				break;
			}
		}
	}
	return companyId;
}

var primaryCorporateNoAutoComp = null;
var secondaryCorporateNoAutoComp = null;
function corporateNoAutoComplete(spnsrIndex, gPatientCorporateIds) {

	var corporateNoArray = [];
	if (!empty(gPatientCorporateIds)) {
		corporateNoArray.length = gPatientCorporateIds.length;
		for (i = 0; i < gPatientCorporateIds.length; i++) {
			var item = gPatientCorporateIds[i]
			corporateNoArray[i] = item.employee_id + "[" + item.tpa_name + "]";
		}
	}

	YAHOO.example.ACJSAddArray = new function () {
		datasource = new YAHOO.widget.DS_JSArray(corporateNoArray);

		if (spnsrIndex == 'S') {

			if (secondaryCorporateNoAutoComp != null)
				secondaryCorporateNoAutoComp.destroy();

			secondaryCorporateNoAutoComp = new YAHOO.widget.AutoComplete('secondary_employee_id', 'secondaryCorporateIdContainer', datasource);
			secondaryCorporateNoAutoComp.formatResult = Insta.autoHighlight;
			secondaryCorporateNoAutoComp.prehighlightClassName = "yui-ac-prehighlight";
			secondaryCorporateNoAutoComp.typeAhead = false;
			secondaryCorporateNoAutoComp.useShadow = false;
			secondaryCorporateNoAutoComp.allowBrowserAutocomplete = false;
			secondaryCorporateNoAutoComp.queryMatchContains = true;
			secondaryCorporateNoAutoComp.minQueryLength = 0;
			secondaryCorporateNoAutoComp.maxResultsDisplayed = 20;
			secondaryCorporateNoAutoComp.forceSelection = false;
			secondaryCorporateNoAutoComp.itemSelectEvent.subscribe(loadPatientCorporateDetails);
		}else {

			if (primaryCorporateNoAutoComp != null)
				primaryCorporateNoAutoComp.destroy();

			primaryCorporateNoAutoComp = new YAHOO.widget.AutoComplete('primary_employee_id', 'primaryCorporateIdContainer', datasource);
			primaryCorporateNoAutoComp.formatResult = Insta.autoHighlight;
			primaryCorporateNoAutoComp.prehighlightClassName = "yui-ac-prehighlight";
			primaryCorporateNoAutoComp.typeAhead = false;
			primaryCorporateNoAutoComp.useShadow = false;
			primaryCorporateNoAutoComp.allowBrowserAutocomplete = false;
			primaryCorporateNoAutoComp.queryMatchContains = true;
			primaryCorporateNoAutoComp.minQueryLength = 0;
			primaryCorporateNoAutoComp.maxResultsDisplayed = 20;
			primaryCorporateNoAutoComp.forceSelection = false;
			primaryCorporateNoAutoComp.itemSelectEvent.subscribe(loadPatientCorporateDetails);
		}
	}
}

var loadPatientCorporateDetails = function (sType, aArgs) {
		var oData = aArgs[2];
		var acCorporateNo = (oData + "").split('[')[0];
		var acSponsorName = (((oData + "").split("[")[1]) + "").split("]")[0];

		var inputElmt = this.getInputEl()
		var spnsrIndex = (inputElmt.name.substr(0,1)).toUpperCase();

		var tpaObj = null;
		var employeeIdObj = null;
		var empNameObj = null;
		var empRelationObj = null;

		if (spnsrIndex == 'P') {
			tpaObj = getPrimarySponsorObj();
			employeeIdObj = getPrimaryMemberIdObj();
			empNameObj = getPrimaryPatientHolderObj();
			empRelationObj = getPrimaryPatientRelationObj();

		}else if (spnsrIndex == 'S') {
			tpaObj = getSecondarySponsorObj();
			employeeIdObj = getSecondaryMemberIdObj();
			empNameObj = getSecondaryPatientHolderObj();
			empRelationObj = getSecondaryPatientRelationObj();
		}

		if (!empty(gPatientCorporateIds)) {
			for (var i = 0; i < gPatientCorporateIds.length; i++) {
				var item = gPatientCorporateIds[i];
				if (acCorporateNo == item.employee_id && getSponsorIdForCorporateSponsorName(acSponsorName) == item.sponsor_id) {

					setSelectedIndex(tpaObj, item.sponsor_id);
					loadTpaList(spnsrIndex);
					onCorporateChange(spnsrIndex);

					RatePlanList();
					ratePlanChange();
					employeeIdObj.value = acCorporateNo;
					empNameObj.value = item.employee_name;
					empRelationObj.value = item.patient_relationship;
					break;
				}
			}
		}
	}

function getSponsorIdForCorporateSponsorName(sponsorName) {
	if (empty(sponsorName)) {
		showMessage("js.registration.patient.employee.id.valid.check.against.sponsor");
		return null;
	}

	var sponsorId = null;
	if (!empty(gPatientCorporateIds)) {
		for (var i = 0; i < gPatientCorporateIds.length; i++) {
			if (gPatientCorporateIds[i].tpa_name == sponsorName) {
				sponsorId = gPatientCorporateIds[i].tpa_id;
				break;
			}
		}
	}
	return sponsorId;
}

var primaryNationalNoAutoComp = null;
var secondaryNationalNoAutoComp = null;
function nationalNoAutoComplete(spnsrIndex, gPatientNationalIds) {

	var nationalNoArray = [];
	if (!empty(gPatientNationalIds)) {
		nationalNoArray.length = gPatientNationalIds.length;
		for (i = 0; i < gPatientNationalIds.length; i++) {
			var item = gPatientNationalIds[i]
			nationalNoArray[i] = item.national_id + "[" + item.tpa_name + "]";
		}
	}

	YAHOO.example.ACJSAddArray = new function () {
		datasource = new YAHOO.widget.DS_JSArray(nationalNoArray);

		if (spnsrIndex == 'S') {

			if (secondaryNationalNoAutoComp != null)
				secondaryNationalNoAutoComp.destroy();

			secondaryNationalNoAutoComp = new YAHOO.widget.AutoComplete('secondary_national_member_id', 'secondaryNationalIdContainer', datasource);
			secondaryNationalNoAutoComp.formatResult = Insta.autoHighlight;
			secondaryNationalNoAutoComp.prehighlightClassName = "yui-ac-prehighlight";
			secondaryNationalNoAutoComp.typeAhead = false;
			secondaryNationalNoAutoComp.useShadow = false;
			secondaryNationalNoAutoComp.allowBrowserAutocomplete = false;
			secondaryNationalNoAutoComp.queryMatchContains = true;
			secondaryNationalNoAutoComp.minQueryLength = 0;
			secondaryNationalNoAutoComp.maxResultsDisplayed = 20;
			secondaryNationalNoAutoComp.forceSelection = false;
			secondaryNationalNoAutoComp.itemSelectEvent.subscribe(loadPatientNationalDetails);
		}else {

			if (primaryNationalNoAutoComp != null)
				primaryNationalNoAutoComp.destroy();

			primaryNationalNoAutoComp = new YAHOO.widget.AutoComplete('primary_national_member_id', 'primaryNationalIdContainer', datasource);
			primaryNationalNoAutoComp.formatResult = Insta.autoHighlight;
			primaryNationalNoAutoComp.prehighlightClassName = "yui-ac-prehighlight";
			primaryNationalNoAutoComp.typeAhead = false;
			primaryNationalNoAutoComp.useShadow = false;
			primaryNationalNoAutoComp.allowBrowserAutocomplete = false;
			primaryNationalNoAutoComp.queryMatchContains = true;
			primaryNationalNoAutoComp.minQueryLength = 0;
			primaryNationalNoAutoComp.maxResultsDisplayed = 20;
			primaryNationalNoAutoComp.forceSelection = false;
			primaryNationalNoAutoComp.itemSelectEvent.subscribe(loadPatientNationalDetails);
		}
	}
}

var loadPatientNationalDetails = function (sType, aArgs) {
		var oData = aArgs[2];
		var acNationalNo = (oData + "").split('[')[0];
		var acSponsorName = (((oData + "").split("[")[1]) + "").split("]")[0];

		var inputElmt = this.getInputEl()
		var spnsrIndex = (inputElmt.name.substr(0,1)).toUpperCase();

		var tpaObj = null;
		var nationalIdObj = null;
		var citizenNameObj = null;
		var patRelationObj = null;

		if (spnsrIndex == 'P') {
			tpaObj = getPrimarySponsorObj();
			nationalIdObj = getPrimaryMemberIdObj();
			citizenNameObj = getPrimaryPatientHolderObj();
			patRelationObj = getPrimaryPatientRelationObj();

		}else if (spnsrIndex == 'S') {
			tpaObj = getSecondarySponsorObj();
			nationalIdObj = getSecondaryMemberIdObj();
			citizenNameObj = getSecondaryPatientHolderObj();
			patRelationObj = getSecondaryPatientRelationObj();
		}

		if (!empty(gPatientNationalIds)) {
			for (var i = 0; i < gPatientNationalIds.length; i++) {
				var item = gPatientNationalIds[i];
				if (acNationalNo == item.national_id && getSponsorIdForNationalSponsorName(acSponsorName) == item.sponsor_id) {

					setSelectedIndex(tpaObj, item.sponsor_id);
					loadTpaList(spnsrIndex);
					onNationalSponsorChange(spnsrIndex);

					RatePlanList();
					ratePlanChange();
					nationalIdObj.value = acNationalNo;
					citizenNameObj.value = item.citizen_name;
					patRelationObj.value = item.patient_relationship;
					break;
				}
			}
		}
	}

function getSponsorIdForNationalSponsorName(sponsorName) {
	if (empty(sponsorName)) {
		showMessage("js.registration.patient.national.id.valid.check.against.sponsor");
		return null;
	}

	var sponsorId = null;
	if (!empty(gPatientNationalIds)) {
		for (var i = 0; i < gPatientNationalIds.length; i++) {
			if (gPatientNationalIds[i].tpa_name == sponsorName) {
				sponsorId = gPatientNationalIds[i].tpa_id;
				break;
			}
		}
	}
	return sponsorId;
}


function patientPhotoResponseHandler(responseText) {
	eval("var patientPhoto =" + responseText);
	if (patientPhoto == 0) {
		document.getElementById('viewPhoto').style.display = 'none';
	} else {
		document.getElementById('viewPhoto').style.display = 'block';
	}
}

function setDateOfBirthFields(prefix, dateObj) {
	if (dateObj != null) {
		document.getElementById(prefix + "Year").value = dateObj.getFullYear();
		document.getElementById(prefix + "Day").value = dateObj.getDate();
		document.getElementById(prefix + "Month").value = dateObj.getMonth() + 1;
	} else {
		document.getElementById(prefix + "Day").value = getString("js.registration.patient.show.dd.text");
		document.getElementById(prefix + "Month").value = getString("js.registration.patient.show.mm.text");
		document.getElementById(prefix + "Year").value = getString("js.registration.patient.show.yy.text");
	}
}

function enableDisableDateOfBirthFields(prefix, disable) {
	document.getElementById(prefix + "Year").disabled = disable;
	document.getElementById(prefix + "Day").disabled = disable;
	document.getElementById(prefix + "Month").disabled = disable;
}

// Set the last visit to be closed.

function setLastVisitToClose() {
	var closeVisitObj = document.mrnoform.close_last_active_visit;
	var lastVisitObj = document.mainform.last_active_visit;
	if (closeVisitObj.checked) {
		lastVisitObj.value = gLastVisitId;
	} else {
		lastVisitObj.value = '';
	}
}

/**
  * disable (possible values are true/false)
  		= parameter which indicates whether insurance fields are to be disabled (true) or enabled (false).
  * forceEnable (possible values are true/false)
  		= parameter which ignores disable (above parameter) and forcefully enables or disables the insurance fields.
 */

function disableOrEnableInsuranceFields(disable, forceEnable) {

/** If mod_adv_ins is not enabled, and bill type selected is Prepaid then the insurance fields are disabled.
	   Also if mod_adv_ins is enabled and Visit type selected is Follow up the the insurance fields are disabled. */

	var allowInsurance = false;

	if (document.mainform.bill_type
			&& (document.mainform.bill_type.value == "C" || (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {
		allowInsurance = true;
	}

	var isMain = ((document.mainform.op_type && document.mainform.op_type.value == "M") || empty(document.mainform.op_type));
	var isRevisit = ((document.mainform.op_type && document.mainform.op_type.value == "R") || empty(document.mainform.op_type));

	var isFollowUpVisit = (!isMain && !isRevisit);

	if (typeof (forceEnable) == 'undefined') {

		if (allowInsurance) {
			if (isFollowUpVisit) disable = true;
			else disable = disable;
		}else
			disable = true;

	} else disable = forceEnable;

	if (document.mainform.ailment)
		document.mainform.ailment.disabled = (typeof (forceEnable) == 'undefined') ? (!isMain && !isRevisit) : forceEnable;

	var disableCategory = forceEnable;
	if (typeof (disableCategory) == 'undefined') {
		if (document.getElementById('regTypenew').checked) disableCategory = false;
		else if ((roleId != 1 && roleId != 2 && catChangeRights != 'A') || (!isMain && !isRevisit)) disableCategory = true;
	}
	if (document.mainform.patient_category_id)
		document.mainform.patient_category_id.disabled = disableCategory;

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");

	var primarySpnsrType = primarySponsorObj.value;
	var secondarySpnsrType = secondarySponsorObj.value;

	primarySponsorObj.disabled = disable;

	if (primarySpnsrType == '') {
		secondarySponsorObj.disabled = true;
		if (secondarySponsorObj != null) secondarySponsorObj.selectedIndex = 0;
	}else
		secondarySponsorObj.disabled = disable;

	// var approvalAmtEnableDisable = !isMain && !isRevisit;

	// For bug # 29283 Follow-Up visits, per visit co-pay is not applicable.
	// Hence, enabling approval amount field for follow up also
	var approvalAmtEnableDisable = false;

	if (primarySponsorObj != null) {
		if (primarySpnsrType == 'I') {
			enableDisablePrimaryInsuranceDetails(disable, approvalAmtEnableDisable);

		}else if (primarySpnsrType == 'C') {
			enableDisablePrimaryCorporateDetails(disable, approvalAmtEnableDisable);

		}else if (primarySpnsrType == 'N') {
			enableDisablePrimaryNationalDetails(disable, approvalAmtEnableDisable);
		}else {}
	}
	if (secondarySponsorObj != null) {
		if (secondarySpnsrType == 'I') {
			enableDisableSecondaryInsuranceDetails(disable, approvalAmtEnableDisable);

		}else if (secondarySpnsrType == 'C') {
			enableDisableSecondaryCorporateDetails(disable, approvalAmtEnableDisable);

		}else if (secondarySpnsrType == 'N') {
			enableDisableSecondaryNationalDetails(disable, approvalAmtEnableDisable);
		}else {}
	}
}

// Populate the main visit or the previous insurance & policy details
// if op_type is F/D i.e FollowUp/FollowUp with consultation.
// Populate the category related TPA and Rate plan if op_type is M/R i.e Main or Revisit.

function loadInsuranceDetails(spnsrIndex) {

	var mainSpnsrIndex = spnsrIndex;

	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;

	// If bill type is bill now and allow bill now insurance is true or bill type is bill later or for out side patient then load
	// the previous patient insurance details.
	if (document.mainform.bill_type
			&& (document.mainform.bill_type.value == "C" || (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {
		allowInsurance = true;
	}

	if (allowInsurance || screenid == "out_pat_reg") {
		loadPreviousInsDetails = true;
	}

	var insCompObj	= null;
	var tpaObj		= null;
	var planObj		= null;
	var planTypeObj	= null;
	var memberIdObj	= null;
	var policyStartDtObj= null;
	var policyEndDtObj	= null;
	var policyNumberObj = null;
	var policyHolderObj	= null;
	var patientRelationshipObj	= null;
	var insuranceApprovalObj	= null;

	var priorAuthIdObj = null;
	var priorAuthModeIdObj = null;

	var previousInsCompany = null;
	var previousTpa = null;
	var previousPlan = null;
	var previousPlanType = null;
	var previousMemberId = null;
	var previousPatientPolicyId = null;
	var previousStartDate = null;
	var previousEndDate = null;
	var previousPolicyNumber = null;
	var previousHolder = null;
	var previousRelation = null;
	var previousPriorAuthid = null;
	var previousPriorAuthmodeid = null;

	if (spnsrIndex == 'P') {
		insCompObj	= getPrimaryInsuObj();
		tpaObj		= getPrimarySponsorObj();
		planObj		= getPrimaryPlanObj();
		planTypeObj	= getPrimaryPlanTypeObj();
		memberIdObj	= getPrimaryInsuranceMemberIdObj();
		policyStartDtObj= getPrimaryPolicyValidityStartObj();
		policyEndDtObj	= getPrimaryPolicyValidityEndObj();
		policyNumberObj = getPrimaryInsurancePolicyNumberObj();
		policyHolderObj	= getPrimaryPatientHolderObj();
		patientRelationshipObj	= getPrimaryPatientRelationObj();
		insuranceApprovalObj	= getPrimaryApprovalLimitObj();

		priorAuthIdObj = getPrimaryAuthIdObj();
		priorAuthModeIdObj = getPrimaryAuthModeIdObj();

		previousInsCompany = gPreviousPrimaryInsCompany;
		previousTpa = gPreviousPrimaryTpa;
		previousPlan = gPreviousPlan;
		previousPatientPolicyId = gPreviousPatientPolicyId;

		var member = findInList(gPatientPolciyNos, "patient_policy_id", previousPatientPolicyId);
		if (member != null && member.plan_id == previousPlan && member.insurance_co_id == previousInsCompany) {
			previousPlanType = gPreviousPlanType;
			previousMemberId = gPreviousMemberId;
			previousStartDate = gPreviousStartDate;
			previousEndDate = gPreviousEndDate;

			previousPolicyNumber = gPreviousPolicyNumber;
			previousHolder = gPreviousHolder;
			previousRelation = gPreviousRelation;
			previousPriorAuthid = gPreviousPriorauthid;
			previousPriorAuthmodeid = gPreviousPriorauthmodeid;

		}else {
			previousPlan = null;
			previousPlanType = null;
			previousMemberId = null;
			previousStartDate = null;
			previousEndDate = null;
			previousPolicyNumber = null;
			previousHolder = null;
			previousRelation = null;
			previousPriorAuthid = null;
			previousPriorAuthmodeid = null;
		}

	}else if (spnsrIndex == 'S') {
		insCompObj	= getSecondaryInsuObj();
		tpaObj		= getSecondarySponsorObj();
		planObj		= getSecondaryPlanObj();
		planTypeObj	= getSecondaryPlanTypeObj();
		memberIdObj	= getSecondaryInsuranceMemberIdObj();
		policyStartDtObj= getSecondaryPolicyValidityStartObj();
		policyEndDtObj	= getSecondaryPolicyValidityEndObj();
		policyNumberObj = getSecondaryInsurancePolicyNumberObj();
		policyHolderObj	= getSecondaryPatientHolderObj();
		patientRelationshipObj	= getSecondaryPatientRelationObj();
		insuranceApprovalObj	= getSecondaryApprovalLimitObj();

		priorAuthIdObj = getSecondaryAuthIdObj();
		priorAuthModeIdObj = getSecondaryAuthModeIdObj();

		previousInsCompany = gPreviousSecondaryInsCompany;
		previousTpa = gPreviousSecondaryTpa;
		previousPlan = gPreviousSecPlan;
		previousPatientPolicyId = gPreviousSecPatientPolicyId;

		var member = findInList(gPatientPolciyNos, "patient_policy_id", previousPatientPolicyId);
		if (mainSpnsrIndex == 'S' && member != null && member.plan_id == previousPlan && member.insurance_co_id == previousInsCompany) {
			previousPlanType = gPreviousSecPlanType;
			previousMemberId = gPreviousSecMemberId;
			previousPolicyNumber = gPreviousSecPolicyNumber;
			previousStartDate = gPreviousSecStartDate;
			previousEndDate = gPreviousSecEndDate;
			previousHolder = gPreviousSecHolder;
			previousRelation = gPreviousSecRelation;
			previousPriorAuthid = gPreviousSecPriorauthid;
			previousPriorAuthmodeid = gPreviousSecPriorauthmodeid;
		}else {
			previousPlan = null;
			previousPlanType = null;
			previousMemberId = null;
			previousPolicyNumber = null;
			previousStartDate = null;
			previousEndDate = null;
			previousHolder = null;
			previousRelation = null;
			previousPriorAuthid = null;
			previousPriorAuthmodeid = null;
		}
	}

	var organizationObj	  = document.mainform.organization;
	var patientCategoryObj	= document.mainform.patient_category_id;

	var patientCategoryId = '';
	var insCompId = '';
	var tpaId = '';
	var planId = '';
	var planTypeId = '';
	var ratePlanId = '';

	var memberId = '';
	var policyNumber = '';
	var policyStart = '';
	var policyEnd = '';
	var holder = '';
	var relation = '';

	var validPatientCategoryId = '';
	var validPlanType = '';
	var validInsComp = '';
	var validTpa = '';
	var validMemberId = '';
	var validRatePlan = '';

	var patcategory = findInList(categoryJSON, "category_id", gPreviousPatientCategoryId);

	if (patcategory != null && patcategory.status == 'A') {
		patientCategoryId = gPreviousPatientCategoryId;
		validPatientCategoryId = patcategory.category_id;
	}

	if (validPatientCategoryId == gPreviousPatientCategoryId) {
		patientCategoryId = gPreviousPatientCategoryId;
	}

	if (empty(previousPlan)) {
		ratePlanId = gPreviousRatePlan;
		tpaId = previousTpa;
		insCompId = previousInsCompany;
	}

	var plan = findInList(policynames, "plan_id", previousPlan);

	if (plan != null && plan.status == 'A') {
		planId = previousPlan;
		validPlanType = plan.category_id;
		validRatePlan = plan.default_rate_plan;
	}

	if (validPlanType == previousPlanType) {
		var plantype = findInList(insuCatNames, "category_id", previousPlanType);

		if (plantype != null && plantype.status == 'A') {
			planTypeId = previousPlanType;
			validInsComp = plantype.insurance_co_id;
		}
	}

	if (validRatePlan == gPreviousRatePlan) {
		var ratePlan = findInList(orgNamesJSON, "org_id", gPreviousRatePlan);

		if (ratePlan != null && ratePlan.status == 'A') {
			ratePlanId = gPreviousRatePlan;
		}
	}

	if (!empty(gPatientPolciyNos) && (gPatientPolciyNos.length > 0)) {

		var member = findInList(gPatientPolciyNos, "patient_policy_id", previousPatientPolicyId);
		if (member != null) validMemberId = member.member_id;

		if (isModAdvanceIns && member != null && validMemberId != null && validMemberId == previousMemberId) {

			memberId = previousMemberId;
			policyNumber = previousPolicyNumber;
			policyStart = previousStartDate;
			holder = previousHolder;
			relation = previousRelation;

			var d = new Date(gServerNow);
			d.setHours(0);
			d.setSeconds(0);
			d.setMinutes(0);
			d.setMilliseconds(0);
			var diff = new Date(previousEndDate) - d;
			if (diff >= 0) {
				policyEnd = previousEndDate;
			} else {
				alert(getString("js.registration.patient.policy.validity.has.expired.on.string")+" " + formatDate(new Date(previousEndDate), 'ddmmyyyy', '-') +
								"\n" +getString("js.registration.patient.select.another.string")+" "+ "\n"+getString("js.registration.patient.or.string") + "\n"+getString("js.registration.patient.enter.validity.end.date.string"));
				policyEndDtObj.focus();
			}
		}
	}

	if (validInsComp == previousInsCompany && validPatientCategoryId == gPreviousPatientCategoryId) {
		var inscomp = findInList(insuCompanyDetails, "insurance_co_id", previousInsCompany);

		if (inscomp != null && inscomp.status == 'A') {
			insCompId = previousInsCompany;

			var tpaList = filterList(companyTpaList, 'insurance_co_id', previousInsCompany);

			if (empty(tpaList)) {
				var tpa = findInList(tpanames, "tpa_id", previousTpa);
				if (tpa != null && tpa.status == 'A') {
					tpaId = previousTpa;
					validTpa = tpa.tpa_id;
				}
			} else {
				var tpa = findInList(tpaList, "tpa_id", previousTpa);
				if (tpa != null && tpa.tpa_status == 'A') {
					tpaId = previousTpa;
					validTpa = tpa.tpa_id;
				}
			}

			// Rate plan related to insurance company
			if (empty(ratePlanId) && !empty(inscomp.default_rate_plan)) {
				validRatePlan = inscomp.default_rate_plan;
			}

			if (validRatePlan == gPreviousRatePlan) {
				var ratePlan = findInList(orgNamesJSON, "org_id", gPreviousRatePlan);

				if (ratePlan != null && ratePlan.status == 'A') {
					ratePlanId = gPreviousRatePlan;
				}
			}
		}
	}

	// If mod_adv_ins (or) mod_insurance is enabled, set the insurance company & tpa.
	if (loadPreviousInsDetails) {

		if (isModAdvanceIns) {

			if (patientCategoryObj != null) {
				setSelectedIndex(patientCategoryObj, patientCategoryId);
			}

			if (insCompObj != null) {
				setSelectedIndex(insCompObj, insCompId);
				loadTpaList(spnsrIndex);
			}

			if (tpaObj != null) {
				setSelectedIndex(tpaObj, tpaId);
				tpaChange(spnsrIndex);
			}
		} else if (isModInsurance) {

			if (patientCategoryObj != null) {
				setSelectedIndex(patientCategoryObj, gPreviousPatientCategoryId);
			}

			if (insCompObj != null) {
				setSelectedIndex(insCompObj, previousInsCompany);
				loadTpaList(spnsrIndex);
			}

			if (tpaObj != null) {
				setSelectedIndex(tpaObj, previousTpa);
				tpaChange(spnsrIndex);
			}
		} else {
			if (patientCategoryObj != null)
				setSelectedIndex(patientCategoryObj, gPreviousPatientCategoryId);
			setSelectedIndex(insCompObj, previousInsCompany);
			loadTpaList(spnsrIndex);
			setSelectedIndex(tpaObj, previousTpa);
		}
	}else {
		if (patientCategoryObj != null)
			setSelectedIndex(patientCategoryObj, "");
		setSelectedIndex(insCompObj, "");
		setSelectedIndex(tpaObj, "");
	}

	// Set the plan type, plan and the validity dates if the membership id validity has not expired.
	if (isModAdvanceIns) {

		if (loadPreviousInsDetails) {
			setSelectedIndex(planTypeObj, planTypeId);
			insuCatChange(spnsrIndex);
			setSelectedIndex(planObj, planId);
			//policyChange(); // skipped this since the mandatory fields (red star mark and the overall treatment amount not required to be loaded)
			if (policyStart !=null && policyStart != '') policyStartDtObj.value = formatDate(new Date(policyStart), "ddmmyyyy", "-");
			else policyStartDtObj.value = '';

			if (policyEnd !=null && policyEnd != '') policyEndDtObj.value = formatDate(new Date(policyEnd), "ddmmyyyy", "-");
			else policyEndDtObj.value = '';

		}else {
			setSelectedIndex(planTypeObj, "");
			insuCatChange(spnsrIndex);
			setSelectedIndex(planObj, "");
			policyStartDtObj.value = '';
			policyEndDtObj.value = '';
		}
	}

	if (priorAuthIdObj  != null
			&& previousPriorAuthid != null && previousPriorAuthid != "" && previousPriorAuthid != "0")
		priorAuthIdObj.value = previousPriorAuthid;

	if (priorAuthModeIdObj != null
      		&& previousPriorAuthmodeid != null && previousPriorAuthmodeid != "")
		setSelectedIndex(priorAuthModeIdObj, previousPriorAuthmodeid);

	// If mod_adv_ins (or) mod_insurance is enabled, set the member id, policy holder and relationship details.
	if (loadPreviousInsDetails) {
		if (isModAdvanceIns) {
			memberIdObj.value = memberId;
			policyNumberObj.value = policyNumber;
			policyHolderObj.value = holder;
			patientRelationshipObj.value = relation;

		}
	}else if (isModAdvanceIns ) {
		memberIdObj.value = "";
		policyNumberObj.value = "";
		policyHolderObj.value = "";
		patientRelationshipObj.value = "";
	}

	// Set the approval limit.
	/*if (loadPreviousInsDetails && (isModAdvanceIns || isModInsurance)) {
		insuranceApprovalObj.value = !empty(gPatientBillsApprovalTotal) ? formatAmountValue(gPatientBillsApprovalTotal) : "";
	}else {
		insuranceApprovalObj.value = "";
	}*/

	insuranceApprovalObj.value = "";

	loadRatePlanDetails(validRatePlan);
}

function loadRatePlanDetails(validRatePlan) {

	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;

	// If bill type is bill now and allow bill now insurance is true or bill type is bill later or for out side patient then load
	// the previous patient insurance details.
	if (document.mainform.bill_type
			&& (document.mainform.bill_type.value == "C" || (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {
		allowInsurance = true;
	}

	if (allowInsurance || screenid == "out_pat_reg") {
		loadPreviousInsDetails = true;
	}

	var organizationObj	  = document.mainform.organization;
	var patientCategoryObj	= document.mainform.patient_category_id;

	// Set the rate plan -- If mod_adv_ins, set the rate plan according to the above criteria filtered.
	// In other cases i.e if mod_insurance (or) no insurance, set the previous rate plan.
	RatePlanList();

	if (loadPreviousInsDetails) {
		if (isModAdvanceIns || isModInsurance) {

			// Rate plan defaulting.
			var patientCategoryObj = document.mainform.patient_category_id;
			if (patientCategoryObj == null) {
				if (!empty(gPreviousPlan) && !empty(validRatePlan))
					setSelectedIndex(organizationObj, validRatePlan);
				else setSelectedIndex(organizationObj, gPreviousRatePlan);
			}else {
				if (!empty(gPreviousPlan) && !empty(validRatePlan))
					setSelectedIndex(organizationObj, validRatePlan);
				//else if (!empty(gPreviousPatientCategoryId)) {}
				//else setSelectedIndex(organizationObj, gPreviousRatePlan);
				else setSelectedIndex(organizationObj, gPreviousRatePlan);
			}
		}else {
			loadPreviousRatePlan();
		}
		ratePlanChange();

	}else {
		loadPreviousRatePlan();
		ratePlanChange();
	}
}

function loadPreviousRatePlan() {
	var organizationObj	  = document.mainform.organization;
	var patientCategoryObj = document.mainform.patient_category_id;
	if (patientCategoryObj == null) {
		if (!empty(gPreviousRatePlan))
			setSelectedIndex(organizationObj, gPreviousRatePlan);
		else
			setSelectedIndex(organizationObj, "ORG0001");
	} else {
		if (!empty(gPreviousRatePlan))
			setSelectedIndex(organizationObj, gPreviousRatePlan);
	}

	var patientCategoryExpDtObj = document.mainform.category_expiry_date;

	if (!empty(gPreviousPatientCategoryId) && patientCategoryObj) {
		setSelectedIndex(patientCategoryObj, gPreviousPatientCategoryId);
		onChangeCategory(); // this will also load the tpa list
	}

	if (!empty(gPreviousPatientCategoryExpDate) && patientCategoryExpDtObj) {
		patientCategoryExpDtObj.value = formatDate(new Date(gPreviousPatientCategoryExpDate), "ddmmyyyy", "-");
		document.getElementById('cardExpiryDate').value = formatDate(new Date(gPreviousPatientCategoryExpDate), "ddmmyyyy", "-");
	}
}

function loadCorporateDetails(spnsrIndex) {

	var corporateSpnsrObj= null;
	var employeeIdObj	= null;
	var employeeNameObj	= null;
	var patientRelationshipObj	= null;
	var insuranceApprovalObj	= null;

	if (spnsrIndex == 'P') {
		loadTpaList('P');
		onCorporateChange('P');
		corporateSpnsrObj = document.getElementById("primary_corporate");
		employeeIdObj = document.getElementById("primary_employee_id");
		employeeNameObj = document.getElementById("primary_employee_name");
		patientRelationshipObj = document.getElementById("primary_employee_relation");
		insuranceApprovalObj = document.getElementById("primary_corporate_approval");

		setSelectedIndex(corporateSpnsrObj, gPreviousPrimaryTpa);
		onCorporateChange('P');
		employeeIdObj.value		= gPreviousCorporateEmployeeId;
		employeeNameObj.value	= gPreviousCorporateEmployeeName;
		patientRelationshipObj.value	= gPreviousCorporateRelation;
		insuranceApprovalObj.value	= null;

	}else if (spnsrIndex == 'S') {
		loadTpaList('S');
		onCorporateChange('S');
		corporateSpnsrObj = document.getElementById("secondary_corporate");
		employeeIdObj = document.getElementById("secondary_employee_id");
		employeeNameObj = document.getElementById("secondary_employee_name");
		patientRelationshipObj = document.getElementById("secondary_employee_relation");
		insuranceApprovalObj = document.getElementById("secondary_corporate_approval");

		setSelectedIndex(corporateSpnsrObj, gPreviousSecondaryTpa);
		onCorporateChange('S');
		employeeIdObj.value		= gPreviousSecCorporateEmployeeId;
		employeeNameObj.value	= gPreviousSecCorporateEmployeeName;
		patientRelationshipObj.value	= gPreviousSecCorporateRelation;
		insuranceApprovalObj.value	= null;
	}
}

function loadNationalDetails(spnsrIndex) {

	var nationalSpnsrObj= null;
	var nationalIdObj	= null;
	var nationalMemberNameObj	= null;
	var patientRelationshipObj	= null;
	var insuranceApprovalObj	= null;

	if (spnsrIndex == 'P') {
		loadTpaList('P');
		onNationalSponsorChange('P');
		nationalSpnsrObj = document.getElementById("primary_national_sponsor");
		nationalIdObj = document.getElementById("primary_national_member_id");
		nationalMemberNameObj = document.getElementById("primary_national_member_name");
		patientRelationshipObj = document.getElementById("primary_national_relation");
		insuranceApprovalObj = document.getElementById("primary_national_approval");

		setSelectedIndex(nationalSpnsrObj, gPreviousPrimaryTpa);
		onNationalSponsorChange('P');
		nationalIdObj.value			= gPreviousNationalId;
		nationalMemberNameObj.value	= gPreviousNationalCitizenName;
		patientRelationshipObj.value= gPreviousNationalRelation;
		insuranceApprovalObj.value	= null;

	}else if (spnsrIndex == 'S') {
		loadTpaList('S');
		onNationalSponsorChange('S');
		nationalSpnsrObj = document.getElementById("secondary_national_sponsor");
		nationalIdObj = document.getElementById("secondary_national_member_id");
		nationalMemberNameObj = document.getElementById("secondary_national_member_name");
		patientRelationshipObj = document.getElementById("secondary_national_relation");
		insuranceApprovalObj = document.getElementById("secondary_national_approval");

		setSelectedIndex(nationalSpnsrObj, gPreviousSecondaryTpa);
		onNationalSponsorChange('S');
		nationalIdObj.value			= gPreviousSecNationalId;
		nationalMemberNameObj.value	= gPreviousSecNationalCitizenName;
		patientRelationshipObj.value= gPreviousSecNationalRelation;
		insuranceApprovalObj.value	= null;
	}
}

function loadInsurancePolicyDetails() {

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");

	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;

	// If bill type is bill now and allow bill now insurance is true or bill type is bill later or for out side patient then load
	// the previous patient insurance details.
	if (document.mainform.bill_type
			&& (document.mainform.bill_type.value == "C" || (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {
		allowInsurance = true;
	}

	if (allowInsurance || screenid == "out_pat_reg") {
		loadPreviousInsDetails = true;
	}

	if (!loadPreviousInsDetails) {
		loadRatePlanDetails(gPreviousRatePlan);
		return;
	}

	setSelectedIndex(primarySponsorObj, gPreviousPrimarySponsorIndex);
	resetPrimarySponsorChange();
	setSelectedIndex(secondarySponsorObj, gPreviousSecondarySponsorIndex);
	resetSecondarySponsorChange();

	if (gPreviousPrimarySponsorIndex == 'I')
		loadInsuranceDetails('P'); // Also loads rate plan

	else if (gPreviousPrimarySponsorIndex == 'C') {
		loadCorporateDetails('P');
		loadRatePlanDetails(gPreviousRatePlan);

	}else if (gPreviousPrimarySponsorIndex == 'N') {
		loadNationalDetails('P');
		loadRatePlanDetails(gPreviousRatePlan);

	}else
		loadRatePlanDetails(gPreviousRatePlan);

	if (gPreviousSecondarySponsorIndex == 'I')
		loadInsuranceDetails('S');
	else if (gPreviousSecondarySponsorIndex == 'C')
		loadCorporateDetails('S');
	else if (gPreviousSecondarySponsorIndex == 'N')
		loadNationalDetails('S');

}

// Practitioner type G--  General, S -- Specialist
// Sets the consultation type and gets the doctor charge

function setDoctorChargeBasedOnPractition(doctorId, isFirstVisit, isIpFollowUp) {
	var form = document.mainform;
	var docChrgObj = document.mainform.doctorCharge;
	var docChrg = (docChrgObj != null) ? docChrgObj.value : "";
	var doctor = findInList(doctorsList, "doctor_id", doctorId);
	if (!empty(doctor)) {
		var practition_type = doctor.practition_type;
		if (!empty(practition_type)) {
			if (practition_type == 'G') {
				if (isFirstVisit) {
					if (!empty(default_gp_first_consultation))
						setSelectedIndex(document.mainform.doctorCharge, default_gp_first_consultation);
					else setSelectedIndex(document.mainform.doctorCharge, '-1');
				} else {
					if (typeof(isIpFollowUp) == 'undefined') {
						if (!empty(default_gp_revisit_consultation))
							setSelectedIndex(document.mainform.doctorCharge, default_gp_revisit_consultation);
						else setSelectedIndex(document.mainform.doctorCharge, '-2');
					} else {
						if (isIpFollowUp) setSelectedIndex(document.mainform.doctorCharge, '-4');
						else setSelectedIndex(document.mainform.doctorCharge, '-2');
					}
				}
			} else if (practition_type == 'S') {
				if (isFirstVisit) {
					if (!empty(default_sp_first_consultation))
						setSelectedIndex(document.mainform.doctorCharge, default_sp_first_consultation);
					else setSelectedIndex(document.mainform.doctorCharge, '-1');
				} else {
					if (typeof(isIpFollowUp) == 'undefined') {
						if (!empty(default_sp_revisit_consultation))
							setSelectedIndex(document.mainform.doctorCharge, default_sp_revisit_consultation);
						else setSelectedIndex(document.mainform.doctorCharge, '-2');
					} else {
						if (isIpFollowUp)
							setSelectedIndex(document.mainform.doctorCharge, '-4');
						else setSelectedIndex(document.mainform.doctorCharge, '-2');
					}
				}
			} else {
				if (isFirstVisit)
					setSelectedIndex(document.mainform.doctorCharge, '-1');
				else {
					if (typeof(isIpFollowUp) == 'undefined')
						setSelectedIndex(document.mainform.doctorCharge, '-2');
					else {
						if (isIpFollowUp)
							setSelectedIndex(document.mainform.doctorCharge, '-4');
						else setSelectedIndex(document.mainform.doctorCharge, '-2');
					}
				}
			}
		} else {
			if (isFirstVisit)
				setSelectedIndex(document.mainform.doctorCharge, '-1');
			else {
				if (typeof (isIpFollowUp == 'undefined'))
					setSelectedIndex(document.mainform.doctorCharge, '-2');
				else {
					if (isIpFollowUp)
						setSelectedIndex(document.mainform.doctorCharge, '-4');
					else setSelectedIndex(document.mainform.doctorCharge, '-2');
				}
			}
		}
	} else {
		if(document.mainform.doctorCharge)
			setSelectedIndex(document.mainform.doctorCharge, '');
	}

	// If scheduler patient, the consultation type is as scheduled.
	//if (document.mainform.appointmentId != null
			//&& document.mainform.appointmentId.value != "")
		//setSelectedIndex(docChrgObj, docChrg);
	getDoctorCharge();
}

function getMainVisitOnChangeToFollowUpWithoutCons() {
	var doctorId = (document.mainform.doctor != null) ? document.mainform.doctor.value : null;

	if (!empty(doctorId)) {

		var tempPreviousDocVisits = gPreviousDocVisits;
		getPatientDoctorVisits(doctorId);

		if (!empty(gPreviousDocVisits)) {
			var cons = gPreviousDocVisits[0];
			var mainVisitId = cons.main_visit_id;
			if (document.mainform.main_visit_id.value == mainVisitId) {
				gPreviousDocVisits = tempPreviousDocVisits;
				return;
			}
		}

		var mrno = document.mrnoform.mrno.value;
		var doctorId = document.mainform.doctor.value;
		var doctorName = document.mainform.doctor_name.value;
		var opType = document.mainform.op_type.value;

		clearRegDetails();

		gSelectedDoctorName = doctorName;
		gSelectedDoctorId = doctorId;
		document.mrnoform.mrno.value = mrno;
		setSelectedIndex(document.mainform.op_type, opType);

		getPatientDoctorVisits(doctorId);

		var mainVisitId = null;
		if (!empty(gPreviousDocVisits)) {
			for (var i = 0; i < gPreviousDocVisits.length; i++) {
				var cons = gPreviousDocVisits[i];
				mainVisitId = cons.main_visit_id;
				break;
			}
		}

		document.mainform.main_visit_id.value = mainVisitId;

		getRegDetails();
	}
}

// Function called when Visit type is changed in UI

function onChangeVisitType() {
	if (document.mainform.op_type != null) {
		if (document.mainform.op_type.value == "D")
			getMainVisitOnChangeToFollowUpWithoutCons();

		if(document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D")
			loadInsurancePolicyDetails();
	}
	changeVisitType();
	loadPreviousUnOrderedPrescriptions();
	if (category != null && (category != 'SNP' || !empty(scheduleName)))
		loadSchedulerOrders();
	estimateTotalAmount();
}

// Load previous visit details based on selected op type and set the consultation to get the doctor charge.

function changeVisitType() {

	if(allow_all_cons_types_in_reg == 'N' && screenid == "reg_registration") {
		loadPreferenceConsultationTypes(document.mainform.doctorCharge);
		loadPreferenceConsultationTypes(document.orderDialogForm.doctorCharge);
	}

	// For Main visit enable or disable insurance details and set consulation as first visit.
	if (screenid == "reg_registration" && document.mainform.op_type.value == "M") {
		disableOrEnableInsuranceFields(false);
		setDoctorChargeBasedOnPractition(document.mainform.doctor.value, true); // isFirstVisit = true
		// For Revisit enable or disable insurance details and set consulation as first visit.
	} else if (screenid == "reg_registration" && document.mainform.op_type.value == "R") {
		disableOrEnableInsuranceFields(false);
		setDoctorChargeBasedOnPractition(document.mainform.doctor.value, true); // isFirstVisit = true
		// For Follow up with consultation load previous details and disable insurance details and set consulation as follow up.
	} else if (screenid == "reg_registration" && (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D")) {
		disableOrEnableInsuranceFields(true);

		// Follow up without consultation load previous details and disable insurance details and set consulation as empty.
		if ( screenid == "reg_registration" && document.mainform.op_type.value == "D") {
			setSelectedIndex(document.mainform.doctorCharge, '');
			getDoctorCharge();
		} else {
			setDoctorChargeBasedOnPractition(document.mainform.doctor.value, false); // isFirstVisit = false
		}
	}
	setPatientComplaint();
}


/** Doctor Consultations & Visit Type:
 * 1. For main visit the selected doctor is the base doctor.
 * 2. For revisit, the selected doctor's validity is checked w.r.t previous visits base doctor
      and visit type i.e, op type is determined as Main / Follow up / Revisit.
 * 3. If for revisit, different doctor is selected, then the visit type is Main.
 */

/* Function called when patient details are loaded (patientDetailsResponseHandler())
	(or) to load scheduler patient details
		New patient --> loadSchedulerPatientDetails()
		Existing patient --> loadSchedulerPatientInfo()
*/

//loading consultation types depending upon visit type if in generic_preferences allow_all_cons_types_in_reg is 'N';
//otherwise all consultation types.

function loadPreferenceConsultationTypes(docConsObj) {
	var orgObj = document.mainform.organization;
	var opTypeObj = document.mainform.op_type;

	var orgId = empty(orgObj.value) ? 'ORG0001' : orgObj.value;
	var consTypesList = cachedConsultTypes[orgId];
	var opType = (opTypeObj != null) ? opTypeObj.value : "";

	var defaultText = getString("js.registration.patient.commonselectbox.defaultText");

	if(opType == 'M' || opType == 'R') {
		// visit type Main, load consultation types (-1/0 : OP Consultation/Others)
		var consFilterList = filterListWithValues(consTypesList, "visit_consultation_type", new Array(-1,0));
		loadSelectBox(docConsObj, consFilterList, "consultation_type", "consultation_type_id", defaultText);

	} else if(opType == 'F') {
		// visit type Follow up(with consultation), load consultation types  (-2/-4/0 : Revisit Consultation/IP Follow Up Consultation/Others)
		var consFilterList = filterListWithValues(consTypesList, "visit_consultation_type", new Array(-2,-4,0));
		loadSelectBox(docConsObj, consFilterList, "consultation_type", "consultation_type_id", defaultText);

	} else if(opType == 'D') {
		// visit type Follow up(with out consultation), load empty consultation types.
		loadSelectBox(docConsObj, null, "consultation_type", "consultation_type_id", defaultText);

	} else {
		loadSelectBox(docConsObj, consTypesList, "consultation_type", "consultation_type_id", defaultText);
	}

	if (docConsObj)
		sortDropDown(docConsObj);
}

function setDocRevistCharge(doctorId) {
	getPatientDoctorVisits(doctorId);

	var opType = (document.mainform.op_type != null) ? document.mainform.op_type.value : "";
	if (opType == 'D') return;

	// OP follow up for IP visit
	if (isRevisitAfterDischarge(doctorId, gPatientLastIpVisit, gFollowUpDocVisits)) {
		if(document.getElementById("docConsultationFees") != null)
			document.getElementById("docConsultationFees").textContent = '';
		if(document.mainform.op_type) {
			setSelectedIndex(document.mainform.op_type, "M");
			document.mainform.op_type.disabled = true;
		}
		setDoctorChargeBasedOnPractition(doctorId, false, true); // isFirstVisit = false, isIpFollowUp = true, default IP follow up consultation
		disableOrEnableInsuranceFields(false);

		if (document.getElementById('ailment').value != "")
			document.getElementById('ailment').disabled = true;
	}

	// Doctor no previous visits -- Main Visit
	if (empty(gPreviousDocVisits)) {
		if(document.getElementById("docConsultationFees") != null)
			document.getElementById("docConsultationFees").textContent = '';
		if(document.mainform.op_type) {
			setSelectedIndex(document.mainform.op_type, "M");
			document.mainform.op_type.disabled = true;
		}
		disableOrEnableInsuranceFields(false);
		document.mainform.main_visit_id.value = "";
		setDoctorChargeBasedOnPractition(doctorId, true); // isFirstVisit = true, default OP Main visit consultation
		document.getElementById('referaldoctorName').disabled = false;
		document.getElementById('ailment').disabled = false;

	} else {
		var doctor = findInList(doctorsList, 'doctor_id', doctorId);
		// Doctor has no validity days or count -- Main Visit
		if (doctor == null || empty(doctor.op_consultation_validity) || empty(doctor.allowed_revisit_count)) {
			if(document.getElementById("docConsultationFees") != null)
				document.getElementById("docConsultationFees").textContent = '';
			if(document.mainform.op_type) {
				setSelectedIndex(document.mainform.op_type, "M");
				document.mainform.op_type.disabled = true;
			}
			disableOrEnableInsuranceFields(false);
			document.mainform.main_visit_id.value = "";
			setDoctorChargeBasedOnPractition(doctorId, true); // isFirstVisit = true, default OP Main visit consultation
			document.getElementById('referaldoctorName').disabled = false;
			document.getElementById('ailment').disabled = false;

			// Doctor visit not within validity -- Revisit
		} else if (!setVisitType(doctorId, gPreviousDocVisits)) {
			if(document.getElementById("docConsultationFees") != null)
				document.getElementById("docConsultationFees").textContent = '';
			if(document.mainform.op_type) {
				setSelectedIndex(document.mainform.op_type, "R");
				document.mainform.op_type.disabled = false;
			}
			loadInsurancePolicyDetails();
			disableOrEnableInsuranceFields(false);
			setDoctorChargeBasedOnPractition(doctorId, true); // isFirstVisit = true, default OP Main visit consultation
			document.getElementById('ailment').disabled = true;

			// Doctor visit within validity -- Follow Up Visit with consultation
		} else {
			if(document.getElementById("docConsultationFees") != null)
				document.getElementById("docConsultationFees").textContent = '';
			if(document.mainform.op_type) {
				setSelectedIndex(document.mainform.op_type, "F");
				document.mainform.op_type.disabled = false;
			}
			loadInsurancePolicyDetails();
			disableOrEnableInsuranceFields(true);
			setDoctorChargeBasedOnPractition(doctorId, false); // isFirstVisit = false, default OP Follow up consultation
			if (document.getElementById('ailment').value != "")
				document.getElementById('ailment').disabled = true;
		}
	}

	// Note: Follow Up Visit without consultation -- user needs to select manually
}

/* Get the patient previous visits for the selected doctor */

function getPatientDoctorVisits(doctor) {
	var mrno = document.mrnoform.mrno.value;
	var opType = (document.mainform.op_type != null) ? document.mainform.op_type.value : "";

	if (mrno != null && mrno != '') {
		var ajaxobj = newXMLHttpRequest();
		var url = cpath + '/pages/registration/regUtils.do?_method=getPatientDoctorVisits&mrNo=' + mrno
						+ '&doctor=' + doctor + '&opType=' + opType;
		ajaxobj.open("POST", url.toString(), false);
		ajaxobj.send(null);
		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var visits =" + ajaxobj.responseText);
					if (!empty(visits)) {
						gPreviousDocVisits = visits;
					}else
						gPreviousDocVisits = null;
				}
			}
		}
	}
}

// Set the main visit id

function setVisitType(doctorId, gPreviousDocVisits) {

	if (doctorId == null) return false;

	var doctor = findInList(doctorsList, 'doctor_id', doctorId);
	if (doctor == null) return false;
	var dept = doctor.dept_id;

	if (empty(gPreviousDocVisits)) return false;

	var validityDays = doctor.op_consultation_validity;
	var maxVisits = doctor.allowed_revisit_count;

	var revisitCount = 0;
	var visitWithinValidity = false;
	var mainVisitId = null;
	var k = 0;
	for (var i = 0; i < gPreviousDocVisits.length; i++) {
		var cons = gPreviousDocVisits[i];

		// Based on visit type dependence (Doctor/Speciality) the op-type is determined.
		if ((visitTypeDependence == 'D' && doctorId == cons.doctor_name) || (visitTypeDependence == 'S' && dept == cons.dept_name)) {
			var visitDate = new Date(cons.visited_date);
			revisitCount++;
			if (daysDiff(visitDate, getServerDate()) <= validityDays) {
				visitWithinValidity = true;
				// Choose the latest doctor visit for setting the main visit id.
				if (k == 0) {
					mainVisitId = cons.main_visit_id;
				}
				k++;
			}
			if (!visitWithinValidity)
				break;
		}
	}
	document.mainform.main_visit_id.value = mainVisitId;

	return visitWithinValidity && (revisitCount <= maxVisits);
}

// Function called on op_type change in UI (changeVisitType())
// (or) to calcuate estimate amount when Insu. company/TPA/Rate plan is changed in UI (calculateTotalEstimateAmount())
// (or) to load existing patient details (loadSchedulerPatientInfo())

function getDoctorCharge() {
	var orgid = document.mainform.organization.value;
	var bedType = (screenid != "ip_registration" && !empty(billingBedTypeForOp)) ? billingBedTypeForOp : 'GENERAL';
	var ajaxobj = newXMLHttpRequest();
	var doctor = document.mainform.doctor.value;
	var chargeType = document.mainform.doctorCharge ? document.mainform.doctorCharge.value : '';
	var planId = ""; var planObj = null;
	var tpaId = ""; var tpaObj = null;

	var spnsrIndex = getMainSponsorIndex();
	if (spnsrIndex != null) {
		if (spnsrIndex == 'P') {
			planObj = getPrimaryPlanObj();
			tpaObj	= getPrimarySponsorObj();
		}else if (spnsrIndex == 'S') {
			planObj = getSecondaryPlanObj();
			tpaObj	= getSecondarySponsorObj();
		}

		if (planObj != null) planId = planObj.value;
		if (tpaObj != null) tpaId = tpaObj.value;
	}

	var planIds = getPlanIds();

	if (screenid == "ip_registration") {
		var visitType = "i";
	} else {
		var visitType = "o";
	}
	var url = '';
	if (doctor != '' && chargeType != '') {
		if (null != planIds && planIds.length >  0) {
			url = cpath + '/master/orderItems.do?method=getItemCharges&type=Doctor' + '&id=' + doctor
				+ '&orgId=' + orgid + '&bedType=' + bedType + '&chargeType=' + chargeType
				+ '&planIds=' + planIds + '&visitType=' + visitType;
		} else if (tpaId != "") {
			url = cpath + '/master/orderItems.do?method=getItemCharges&type=Doctor' + '&id=' + doctor
				+ '&orgId=' + orgid + '&bedType=' + bedType + '&chargeType=' + chargeType
				+ '&insurance=true&visitType=' + visitType;
		} else {
			url = cpath + '/master/orderItems.do?method=getItemCharges&type=Doctor' + '&id=' + doctor
				+ '&orgId=' + orgid + '&bedType=' + bedType + '&chargeType=' + chargeType
				+ '&visitType=' + visitType;
		}

		ajaxobj.open("POST", url, false);
		ajaxobj.send(null);

		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var doctorChargeJSBean = " + ajaxobj.responseText);
					var charge = 0;
					if (doctorChargeJSBean != null) {
						charge = doctorChargeJSBean[0].amount;
					}
					var insurancePayable = "true";
					if (addOrderDialog.orderChargeHeadJSON != null && !empty(doctorChargeJSBean)) {
						insurancePayable = findInList(addOrderDialog.orderChargeHeadJSON, "CHARGEHEAD_ID",
													doctorChargeJSBean[0].chargeHead).INSURANCE_PAYABLE == 'Y' ? "true" : "false";
					}
					document.mainform.consFees.value = charge;
					document.mainform.opdocchrg.value = charge;
					if(document.getElementById("docConsultationFees") != null)
						document.getElementById("docConsultationFees").textContent = formatAmountValue(charge);
					if (document.getElementById('patietConsultAmount')) {

					var insClaimAmt = doctorChargeJSBean[0].insuranceClaimAmount;
					insClaimAmt = null != planIds && planIds.length > 0 ?(planIds.length==2 ? doctorChargeJSBean[0].claimAmounts[0] + doctorChargeJSBean[0].claimAmounts[1] :
						doctorChargeJSBean[0].claimAmounts[0]) : insClaimAmt ;

					document.getElementById('patietConsultAmount').value = charge - insClaimAmt;
					var ordCat = document.getElementsByName("orderCategory");
					var ordFirstOfCategory = document.getElementsByName("firstOfCategory");
					if (ordCat != null && ordCat != undefined && ordCat.length > 0) {
						for (var i = 0; i < ordCat.length; i++) {
							if (ordCat[i].value == doctorChargeJSBean[0].insuranceCategoryId && ordFirstOfCategory[i].value == "true") {
								document.getElementById('patietConsultAmount').value = 0;
								document.getElementById('regDocFirstOfCategory').value = "false";

								var claimAmt = 0;
								var remainingAmt = charge;
								if(planIds != null && planIds.length > 0) {
								for(var k=0; k<planIds.length; k++) {
									claimAmt = calculateClaimAmount(remainingAmt,doctorChargeJSBean[0].discount,doctorChargeJSBean[0].insuranceCategoryId,
									doctorChargeJSBean[0].firstOfCategory, doctorChargeJSBean[0].visitType,doctorChargeJSBean[0].billNo,planIds[k]);
									remainingAmt = remainingAmt - claimAmt;
									document.getElementById('patietConsultAmount').value = remainingAmt;
								}
							}

							}
						}
					}
					if (insurancePayable != "true")
						document.getElementById('patietConsultAmount').value = charge;
					}
				}
			}
		}
		estimateTotalAmount();
	} else {
		document.mainform.consFees.value = 0;
		document.mainform.opdocchrg.value = 0;
		if(document.getElementById("docConsultationFees"))
			document.getElementById("docConsultationFees").textContent = 0;
		estimateTotalAmount();
	}

	var display = displayEstimatedTotalAmountTable(orgid);
	if (display && document.getElementById("docConsultationFees")) {
		document.getElementById("docConsultationFees").style.display = 'block';
	}else {
		if(document.getElementById("docConsultationFees"))
			document.getElementById("docConsultationFees").style.display = 'none';
	}
}

// Function called when TPA is changed in UI

function onTpaChange(spnsrIndex) {
	tpaChange(spnsrIndex);
	ratePlanChange();
}

// Function called in 3 places, when Insurance company changed (loadTpaList()) (or) TPA is changed in UI
// (or) to load existing patient details (loadInsurancePolicyDetails())

function tpaChange(spnsrIndex) {

	var tpaIdObj = null;
	var insuCompIdObj = null;
	var uploadRowObj = null;

	if (spnsrIndex == 'P') {
		tpaIdObj = getPrimarySponsorObj();
		insuCompIdObj = getPrimaryInsuObj();
		uploadRowObj = getPrimaryUploadRowObj();

	}else if (spnsrIndex == 'S') {
		tpaIdObj = getSecondarySponsorObj();
		insuCompIdObj = getSecondaryInsuObj();
		uploadRowObj = getSecondaryUploadRowObj();
	}

	if (tpaIdObj != null && tpaIdObj.value != '') {
		gIsInsurance = true;
		var selectedTpaId = tpaIdObj.value;

		for (var i = 0; i < tpanames.length; i++) {
			var tpaValidityDate = new Date(tpanames[i].validity_end_date);
			if (selectedTpaId == tpanames[i].tpa_id) {
				if (!empty(tpanames[i].validity_end_date)) {
					if (daysDiff(getServerDate(), tpaValidityDate) < 0) {
						showMessage("js.registration.patient.tpa.validity.check");
						tpaIdObj.selectedIndex = 0;
					}
				}
				if (uploadRowObj != null) {
					if (tpanames[i].scanned_doc_required == 'N')
						uploadRowObj.style.display = 'none';
					else
						uploadRowObj.style.display = 'table-row';
				}
				break;
			}
		}
	} else {
		gIsInsurance = false;
	}
	if (insuCompIdObj != null)
		sortDropDown(insuCompIdObj);
}

// Function called when Plan is changed in UI

function onPolicyChange(spnsrIndex) {
	policyChange(spnsrIndex);
	RatePlanList();
	ratePlanChange();
}

// Function called when Plan type is changed (insuCatChange())
// (or) plan is changed (onPolicyChange())
// (or) Member ship autocomplete is changed (loadPolicyDetails)

function policyChange(spnsrIndex) {

	var approvalAmtObj = null;
	var planObj = null;
	var policyValidityStartObj = null;
	var policyValidityEndObj = null;
	var memberIdObj = null;
	var policyNumberObj = null;
	var policyHolderObj = null;
	var insuranceDocContentObj = null;

	var approvalAmtStarObj = null;
	var policyValidityStartStarObj = null;
	var policyValidityEndStarObj = null;

	if (spnsrIndex == 'P') {
		approvalAmtObj = getPrimaryApprovalLimitObj();
		planObj = getPrimaryPlanObj();
		policyValidityStartObj = getPrimaryPolicyValidityStartObj();
		policyValidityEndObj = getPrimaryPolicyValidityEndObj();

		memberIdObj = getPrimaryInsuranceMemberIdObj();
		policyNumberObj = getPrimaryInsurancePolicyNumberObj();
		policyHolderObj = getPrimaryPatientHolderObj();
		insuranceDocContentObj = getPrimaryDocContentObj();

		approvalAmtStarObj = getPrimaryApprovalLimitStarObj();
		policyValidityStartStarObj = getPrimaryPolicyValidityStartStarObj();
		policyValidityEndStarObj = getPrimaryPolicyValidityEndStarObj();
		if (planObj != null) {
			if (empty(planObj.value)) {
				document.getElementById('pd_primary_planButton').disabled = true;
			} else {
				document.getElementById('pd_primary_planButton').disabled = false;
			}
			document.getElementById('primary_plan_div').title = "";
		}

	}else if (spnsrIndex == 'S') {
		approvalAmtObj = getSecondaryApprovalLimitObj();
		planObj = getSecondaryPlanObj();
		policyValidityStartObj = getSecondaryPolicyValidityStartObj();
		policyValidityEndObj = getSecondaryPolicyValidityEndObj();

		memberIdObj = getSecondaryInsuranceMemberIdObj();
		policyNumberObj = getSecondaryInsurancePolicyNumberObj();
		policyHolderObj = getSecondaryPatientHolderObj();
		insuranceDocContentObj = getSecondaryDocContentObj();

		approvalAmtStarObj = getSecondaryApprovalLimitStarObj();
		policyValidityStartStarObj = getSecondaryPolicyValidityStartStarObj();
		policyValidityEndStarObj = getSecondaryPolicyValidityEndStarObj();
		if (planObj != null) {
			if (empty(planObj.value)){
				document.getElementById('pd_secondary_planButton').disabled = true;
			} else {
				document.getElementById('pd_secondary_planButton').disabled = false;
			}
			document.getElementById('secondary_plan_div').title = "";
		}
	}

	if (planObj != null) {
		var plan =  planObj.value;

		if (!empty(plan)) {

			policyValidityStartObj.removeAttribute("disabled");
			policyValidityEndObj.removeAttribute("disabled");
			approvalAmtObj.value = "";

			for (var i = 0; i < policynames.length; i++) {
				if (policynames[i].plan_id == plan) {
					if (!empty(policynames[i].overall_treatment_limit)) {
						approvalAmtObj.value = formatAmountPaise(getPaise(policynames[i].overall_treatment_limit));
					}
					approvalAmtStarObj.style.visibility = 'visible';
					policyValidityStartStarObj.style.visibility = 'visible';
					policyValidityEndStarObj.style.visibility = 'visible';
					break;
				}
			}
		} else {
			approvalAmtStarObj.style.visibility = 'hidden';
			policyValidityStartStarObj.style.visibility = 'hidden';
			policyValidityEndStarObj.style.visibility = 'hidden';

			memberIdObj.value = "";
			policyNumberObj.value = "";
			policyHolderObj.value = "";
			policyValidityEndObj.value = "";
			policyValidityStartObj.value = "";
			policyValidityEndObj.setAttribute("disabled", true);
			policyValidityStartObj.setAttribute("disabled", true);
			insuranceDocContentObj.value = "";
		}
	}
}

function calculateTestAmount(index) {
	var testQty = document.getElementById('testQuantity' + index).value;
	if (testQty == '' || testQty == 0) {
		showMessage("js.registration.patient.is.qty.greater.than.zero.check");
		document.getElementById('testQuantity' + index).focus();
		return false;
	}
	var testRate = document.getElementById('testRate' + index).value;
	document.getElementById('testAmount' + index).value = (parseFloat(testQty) * parseFloat(testRate)).toFixed(2);
}

var cachedCharges = [];

function getCharge(chargeId, orgId, bedType, chargeType) {
	var amount = 0;
	var ajaxobj = newXMLHttpRequest();
	if (empty(orgId)) orgId = 'ORG0001';
	bedType = (screenid != "ip_registration" && !empty(billingBedTypeForOp)) ? billingBedTypeForOp : 'GENERAL';
	var url = cpath + '/master/orderItems.do?method=getItemCharges&type=Direct Charge' + '&id=' + chargeId
								+ '&orgId=' + orgId + '&bedType=' + bedType + '&visitType=' + visitType;
	var key = chargeId + "_" + orgId + "_" + bedType;
	if (chargeType != null) {
		url = url + "&chargeType=" + chargeType;
		key += "_" + chargeType;
	}
	if (cachedCharges[key] == undefined) {
		ajaxobj.open("POST", url, false);
		ajaxobj.send(null);

		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
					eval("var chargeJSBean = " + ajaxobj.responseText);
					amount = chargeJSBean[0].amount;
					cachedCharges[key] = amount;
				}
			}
		}
	} else {
		amount = cachedCharges[key];
	}
	return amount;
}
var totalRegistrationCharges = 0;
function estimateTotalAmount() {
	var totalEstimatedAmount = 0;
	var genregcharge = 0;
	var ipregcharge = 0;
	var opregcharge = 0;
	var mlcCharge = 0;
	var orgId;
	var bedType;
	var id;

	if (screenid == "ip_registration")
		id = "IPREG";
	else
		id = "OPREG";

	if (document.mainform.organization.value == "..Rate Plan..")
		orgId = "ORG0001";
	else
		orgId = document.mainform.organization.value;

	if (document.mainform.bed_type != null && document.mainform.bed_type.value != "")
		bedType = document.mainform.bed_type.value;
	else bedType = (screenid != "ip_registration" && !empty(billingBedTypeForOp)) ? billingBedTypeForOp : 'GENERAL';

	// Get OP or IP registration charge.
	if (document.mainform.reg_charge_applicable.value == "Y") {
		if (screenid == "ip_registration") {
			ipregcharge = getCharge(id, orgId, bedType);
		} else {
			opregcharge = getCharge(id, orgId, bedType);
		}
	}

	// Get MLC charge
	if (document.mrnoform.mlccheck != null && document.mrnoform.mlccheck.checked) {
		mlcCharge = getCharge('MLREG', orgId, bedType);
	}

	if (document.mainform.reg_charge_applicable.value == "Y") {
		if (document.getElementById('regTypenew').checked == true) {
			// New registration: add the general registration charge.
			genregcharge = getCharge('GREG', orgId, bedType);
		} else {
			// Existing patient: based on validity, and if previous visit exists.
			if (gLastGenRegChargeAcceptedDate != null) {
				// previous visit exists, check the validity and apply genreg renewal charge
				if (regPref.regValidityPeriod > 0) {
					if (daysDiff(gLastGenRegChargeAcceptedDate, new Date()) > regPref.regValidityPeriod)
						genregcharge = getCharge('GREG', orgId, bedType, 'renewal');
				}
			} else {
				// no previous visit. Charge genreg only if patient is newer than golive date
				if (gPatientRegDate > goLiveDate)
					genregcharge = getCharge('GREG', orgId, bedType);
			}
		}
	}

	if (document.mrnoform.group.value == "opreg") {
		var reg_charges = getPaise(opregcharge) + getPaise(genregcharge);
		totalRegistrationCharges = reg_charges;
		var consFee;
		if (document.getElementById('consFees').value == '') {
			consFee = 0;
		} else {
			consFee = document.getElementById('consFees').value;
		}
		totalEstimatedAmount += getPaise(consFee) + reg_charges;
	} else {
		totalEstimatedAmount += getPaise(ipregcharge) + getPaise(genregcharge);
	}

	if (document.mrnoform.mlccheck != null && document.mrnoform.mlccheck.checked) {
		totalEstimatedAmount += getPaise(mlcCharge);
	}

	if (screenid == "reg_registration") {
		if (document.getElementById('orderTable' + 0) != null) {
			updateNewTotalAmount();
			totalEstimatedAmount += getTotalNewOrdersAmountPaise(0);
		}
	}
	if (screenid != "ip_registration" && screenid != "out_pat_reg") {
		document.getElementById('estimtAmount').innerHTML = formatAmountPaise(totalEstimatedAmount);
		document.getElementById('estimateAmount').value = formatAmountPaise(totalEstimatedAmount);
	}
	document.mainform.opIpcharge.value = formatAmountPaise(totalEstimatedAmount);
	totalRegistrationCharges = formatAmountPaise(totalRegistrationCharges);

	if(!empty(registrationChargeApplicability) && registrationChargeApplicability == 'A')
		setRegistrationChargesFlag(document.mainform.patient_category_id);
}

function updateNewTotalAmount() {
	var totalNewPatientAmt = getTotalNewOrdersPatientAmountPaise(0);
	if (document.getElementById('totalNewPatientAmt') != null) {
		var totalNewPatientAmtEl = document.getElementById('totalNewPatientAmt');

		if (totalNewPatientAmtEl) {
			totalNewPatientAmtEl.textContent =
				formatAmountPaise(totalNewPatientAmt + getPaise(document.getElementById('patietConsultAmount').value));

			document.getElementById('patientAmt').value =
				formatAmountPaise(totalNewPatientAmt + getPaise(document.getElementById('patietConsultAmount').value));
		}
	}
}

/* Function called in 5 places, when Patient category is changed (onChangeCategory())
	(or) Plan type is changed (insuCatChange())
	(or) Plan is changed (onPolicyChange())
	(or) to load existing patient details (loadInsurancePolicyDetails())
	(or) Member ship autocomplete is changed (loadPolicyDetails)
*/
function RatePlanList() {

	var spnsrIndex = getMainSponsorIndex();

	var planObj= null;
	var insuCompObj = null;

	if (spnsrIndex == 'P') {
		insuCompObj = getPrimaryInsuObj();
		planObj		= getPrimaryPlanObj();
	}else if (spnsrIndex == 'S') {
		insuCompObj = getSecondaryInsuObj();
		planObj		= getSecondaryPlanObj();
	}

	var categoryId = '';
	var planId = '';
	var insCompanyId = '';
	var catDefaultRatePlan = "";
	var planDefaultRatePlan = "";
	var insCompDefaultRatePlan = "";

	var orgIdList = null;

	var ratePlan = document.getElementById("organization");

	if (insuCompObj) insCompanyId = insuCompObj.value;
	if (planObj) planId = planObj.value;

	if (document.mainform.patient_category_id)
		categoryId = document.mainform.patient_category_id.value;

	if (categoryId != '') {
		var category = findInList(categoryJSON, "category_id", categoryId);
		if (!empty(category)) {
			if(screenid == 'ip_registration') {
				catDefaultRatePlan = category.ip_rate_plan_id;
				if (category.ip_allowed_rate_plans != '*')
					orgIdList = category.ip_allowed_rate_plans.split(',');

				if(category.ip_allowed_sponsors == null) {
					if (document.getElementById("primary_insurance_co") != null)
						loadSelectBox(document.getElementById('primary_insurance_co'), [],
							'insurance_co_name', 'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
					if (document.getElementById("secondary_insurance_co") != null)
						loadSelectBox(document.getElementById('secondary_insurance_co'), [],
							'insurance_co_name', 'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
				}
			} else {
				catDefaultRatePlan = category.op_rate_plan_id;
				if (category.op_allowed_rate_plans != '*' )
					orgIdList = category.op_allowed_rate_plans.split(',');

				if(category.op_allowed_sponsors == null) {
					if (document.getElementById("primary_insurance_co") != null)
						loadSelectBox(document.getElementById("primary_insurance_co"), [],
							'insurance_co_name', 'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
					if (document.getElementById("secondary_insurance_co") != null)
						loadSelectBox(document.getElementById("secondary_insurance_co"), [],
							'insurance_co_name', 'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
				}
			}
		}
	}

	// Rate plan related to insurance company
	if (insCompanyId != '') {
		var selectedIns = findInList(insuCompanyDetails, "insurance_co_id", insCompanyId);
		if (!empty(selectedIns) && !empty(selectedIns.default_rate_plan)) {
			insCompDefaultRatePlan = selectedIns.default_rate_plan;
			insCompDefaultRatePlan = isRatePlanActive(insCompDefaultRatePlan) ? insCompDefaultRatePlan : "";
		}
	}

	// Rate plan related to plan
	if (planId != '') {
		var plan = findInList(policynames, "plan_id", planId);
		planDefaultRatePlan = plan.default_rate_plan;
		planDefaultRatePlan = isRatePlanActive(planDefaultRatePlan) ? planDefaultRatePlan : "";
	}

	// If plan default rate plan is empty and insurance company default rate plan exists
	// then company default rate plan is choosen.
	if (empty(planDefaultRatePlan) && !empty(insCompDefaultRatePlan))
		planDefaultRatePlan = insCompDefaultRatePlan;

	// Empty Rate plans
	var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
	var len = 1;
	ratePlan.options.length = len;
	ratePlan.options[len - 1] = optn;

	var len = 1;

	if (document.mainform.patient_category_id && !empty(planDefaultRatePlan)) {
		if (!empty(orgIdList)) {
			for (var k = 0; k < orgIdList.length; k++) {
				// Not empty plan default rate plan and also category rate plan list containd the plan rate plan,
				// populate the rate plan.
				if (planDefaultRatePlan == orgIdList[k]) {
					var org = findInList(orgNamesJSON, "org_id", orgIdList[k]);
					if (!empty(org)) {
						var optn = new Option(org.org_name, org.org_id);
						len++;
						ratePlan.options.length = len;
						ratePlan.options[len - 1] = optn;
						break;
					}
				}
			}
		} else {
			for (var k = 0; k < orgNamesJSON.length; k++) {
				// Not empty plan default rate plan and also category rate plan list containd the plan rate plan,
				// populate the rate plan.
				if (planDefaultRatePlan == orgNamesJSON[k].org_id) {
					var optn = new Option(orgNamesJSON[k].org_name, orgNamesJSON[k].org_id);
					len++;
					ratePlan.options.length = len;
					ratePlan.options[len - 1] = optn;
					break;
				}
			}
		}

		if (ratePlan.options.length == 1) {
			showMessage("js.registration.patient.valid.rate.plans.against.category.plan.insurance.company");
		}

	} else {
		if (!empty(orgIdList)) {
			for (var k = 0; k < orgIdList.length; k++) {
				var org = null;
				if(orgIdList[k].org_id)
					org = findInList(orgNamesJSON, "org_id", orgIdList[k].org_id);
				else
					org = findInList(orgNamesJSON, "org_id", orgIdList[k]);
				if (!empty(org)) {
					var optn = new Option(org.org_name, org.org_id);
					len++;
					ratePlan.options.length = len;
					ratePlan.options[len - 1] = optn;
				}
			}
		} else {
			for (var i = 0; i < orgNamesJSON.length; i++) {
				ratePlan.options.length = len + 1;
				var optn = new Option(orgNamesJSON[i].org_name, orgNamesJSON[i].org_id);
				ratePlan.options[len] = optn;
				len++;
			}
		}
	}

	if (!empty(catDefaultRatePlan))
		setSelectedIndex(ratePlan, catDefaultRatePlan);

	if (!empty(planDefaultRatePlan))
		setSelectedIndex(ratePlan, planDefaultRatePlan);

	if (!empty(gPatientCategoryRatePlan)) {
		var patientCategoryObj = document.mainform.patient_category_id;
		if (patientCategoryObj == null)
			setSelectedIndex(ratePlan, gPatientCategoryRatePlan);
	}else {
		if (ratePlan.options.length == 2)
			ratePlan.selectedIndex = 1;
	}

	sortDropDown(ratePlan);
}

function CategoryList() {
	var categoryObj = document.getElementById("patient_category_id");
	var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
	categoryObj.options[0] = optn;

	var len = 1;
	for (var i = 0; i < categoryJSON.length; i++) {
		optn = new Option(categoryJSON[i].category_name, categoryJSON[i].category_id);
		categoryObj.options[len] = optn;
		len++;
	}
	if (!empty(defaultPatientCategory)) {
		setSelectedIndex(categoryObj, defaultPatientCategory);
	} else {
		// if there is only one category found, then default it.
		if (len == 2)
			categoryObj.options.selectedIndex = 1;
		else
			setSelectedIndex(categoryObj, "");

	}
}

// If the selected Primary sponsor is Insurance && has plan then Primary is Main Insurance
// If the selected Secondary sponsor is Insurance && has plan then Secondary is Main Insurance
// Otherwise Primary Sponsor is Main
function getMainSponsorIndex() {

	if (document.getElementById("primary_member_id") != null
			&& document.getElementById("primary_member_id").value !='')
		return 'P';

	if (document.getElementById("secondary_member_id") != null
			&& document.getElementById("secondary_member_id").value !='')
		return 'S';

	if (document.getElementById("primary_plan_id") != null
			&& document.getElementById("primary_plan_id").value !='')
		return 'P';

	if (document.getElementById("secondary_plan_id") != null
			&& document.getElementById("secondary_plan_id").value !='')
		return 'S';

	if (document.getElementById("primary_plan_type") != null
			&& document.getElementById("primary_plan_type").value !='')
		return 'P';

	if (document.getElementById("secondary_plan_type") != null
			&& document.getElementById("secondary_plan_type").value !='')
		return 'S';

	if (document.getElementById("primary_insurance_co") != null
			&& document.getElementById("primary_insurance_co").value !='')
		return 'P';

	if (document.getElementById("secondary_insurance_co") != null
			&& document.getElementById("secondary_insurance_co").value !='')
		return 'S';

	if (document.getElementById("primary_sponsor_id") != null
			&& document.getElementById("primary_sponsor_id").value !='')
		return 'P';

	if (document.getElementById("secondary_sponsor_id") != null
			&& document.getElementById("secondary_sponsor_id").value !='')
		return 'S';

	if (document.getElementById("primary_sponsor") != null
			&& document.getElementById("primary_sponsor").value == 'I')
		return 'P';

	if (document.getElementById("secondary_sponsor") != null
			&& document.getElementById("secondary_sponsor").value == 'I')
		return 'S';

	if (document.getElementById("primary_sponsor") != null
			&& document.getElementById("primary_sponsor").value == 'C')
		return 'P';

	if (document.getElementById("primary_sponsor") != null
			&& document.getElementById("primary_sponsor").value == 'N')
		return 'P';
}

// Patient category -- primary, secondary default sponsor types and bill type default
function setPrimarySecondarySponsor() {

	var visitType = screenid == 'ip_registration'? 'i': 'o';
	var patientCategoryObj	= document.mainform.patient_category_id;
	var patientCategory		= "";

	if (patientCategoryObj != null) {
		patientCategory	= patientCategoryObj.value;
		if (gSelectedPatientCategory == patientCategory) return;
	}

	var category = findInList(categoryJSON, "category_id", patientCategory);

	var defaultPrimaryTpa = '';
	var defaultSecondaryTpa = '';

	if (visitType == 'i') {
		defaultPrimaryTpa = !empty(category) ? category.primary_ip_sponsor_id : '';
		defaultSecondaryTpa = !empty(category) ? category.secondary_ip_sponsor_id : '';
	}else if (visitType == 'o') {
		defaultPrimaryTpa = !empty(category) ? category.primary_op_sponsor_id : '';
		defaultSecondaryTpa = !empty(category) ? category.secondary_op_sponsor_id : '';
	}

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");

	if (primarySponsorObj != null) {
		if (!empty(defaultPrimaryTpa)) {
			var tpa = findInList(tpanames, "tpa_id", defaultPrimaryTpa);
			var spnsrType = !empty(tpa) ? tpa.sponsor_type : "";

			if (document.mainform.bill_type) {
				if (!empty(spnsrType) && visitType == 'o' && allowBillNowInsurance == 'false')
					setSelectedIndex(document.mainform.bill_type, "C");
				else {
					if (visitType == 'o') setSelectedIndex(document.mainform.bill_type, defaultOpBillType);
					else setSelectedIndex(document.mainform.bill_type, defaultIpBillType);
				}
			}

			if (!empty(spnsrType) && document.mainform.bill_type &&
				(document.mainform.bill_type.value == "C"
				|| (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {

				setSelectedIndex(primarySponsorObj, spnsrType);
			}else {
				primarySponsorObj.selectedIndex = 0;
			}

		}else {
			primarySponsorObj.selectedIndex = 0;
			if (document.mainform.bill_type) {
				if (visitType == 'o') setSelectedIndex(document.mainform.bill_type, defaultOpBillType);
				else setSelectedIndex(document.mainform.bill_type, defaultIpBillType);
			}
		}
	}

	if (secondarySponsorObj != null) {
		if (primarySponsorObj != null && primarySponsorObj.value != '') {
			if (!empty(defaultSecondaryTpa)) {
				var tpa = findInList(tpanames, "tpa_id", defaultSecondaryTpa);
				var spnsrType = !empty(tpa) ? tpa.sponsor_type : "";

				if (!empty(spnsrType) && document.mainform.bill_type &&
						(document.mainform.bill_type.value == "C"
						|| (allowBillNowInsurance == 'true' && document.mainform.bill_type.value == 'P'))) {

					setSelectedIndex(secondarySponsorObj, spnsrType);
					secondarySponsorObj.disabled = false;

				}else {
					secondarySponsorObj.selectedIndex = 0;
				}

			}else {
				secondarySponsorObj.selectedIndex = 0;
			}
		}else {
			secondarySponsorObj.selectedIndex = 0;
			secondarySponsorObj.disabled = true;
		}
	}
}


// Function called when Patient Category is changed in UI

var gPatientCategoryChanged = false;
function onChangeCategory() {

	var patientCategoryObj	= document.mainform.patient_category_id;
	var patientCategory		= "";

	if (patientCategoryObj != null) {
		patientCategory	= patientCategoryObj.value;
		if (gSelectedPatientCategory == patientCategory) return;
	}

	setPrimarySecondarySponsor();

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");

	if (primarySponsorObj != null) resetPrimarySponsorChange();
	if (secondarySponsorObj != null) resetSecondarySponsorChange();

	if (screenid != "out_pat_reg")
		onBillTypeChange();
	setAllDefaults();

	if (document.mainform.op_type != null
			&& (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D"))
		loadInsurancePolicyDetails();
	changeVisitType();
	estimateTotalAmount();

	showHideCaseFile();
	ratePlanChange();
	isCategoryChanged();
	setSchedulerPriorAuthDetails();
	setRegistrationChargesFlag(patientCategoryObj);
}

function setRegistrationChargesFlag(patientCategoryObj) {
	if(screenid == 'reg_registration') {
		var list = null;
		var regChargeApplicable = "N";
		if(empty(patientCategory)) {
			regChargeApplicable = "Y";
		} else {
			if(!empty(patientCategoryObj)) {
				list = filterList(categoryJSON,"category_id",patientCategoryObj.value);
			}
		}

		if(list != null && list.length > 0) {
			regChargeApplicable = list[0].registration_charge_applicable;
		}

		if(!empty(registrationChargeApplicability) && registrationChargeApplicability == 'A') {
			if(regChargeApplicable == "Y" && totalRegistrationCharges != 0) {
				document.getElementById('apply_registration_charges').value = "Y";
				document.getElementById('registration_charges_checkbox').disabled = false;
				document.getElementById('registration_charges_checkbox').checked = true;
			} else {
				document.getElementById('registration_charges_checkbox').checked = false;
				document.getElementById('registration_charges_checkbox').disabled = true;
				document.getElementById('apply_registration_charges').value = "N";
			}
		}
	}
}

function checkUncheckCheckbox(obj) {
	var totalEstimatedAmt = parseFloat(document.getElementById('estimtAmount').textContent);
	if(obj.checked) {
		document.getElementById('apply_registration_charges').value = "Y";
		document.getElementById('estimtAmount').textContent = formatAmountPaise(getPaise(totalEstimatedAmt)+getPaise(totalRegistrationCharges));
		document.getElementById('estimateAmount').value = formatAmountPaise(getPaise(totalEstimatedAmt)+getPaise(totalRegistrationCharges));
	} else {
		document.getElementById('apply_registration_charges').value = "N";
		document.getElementById('estimtAmount').textContent = formatAmountPaise(getPaise(totalEstimatedAmt)-getPaise(totalRegistrationCharges));
		document.getElementById('estimateAmount').value = formatAmountPaise(getPaise(totalEstimatedAmt)-getPaise(totalRegistrationCharges));
	}
}

function isCategoryChanged() {
	var spnsrIndex = getMainSponsorIndex();

	var tpaObj = null;
	var planObj= null;

	if (spnsrIndex == 'P') {
		tpaObj = getPrimarySponsorObj();
		planObj= getPrimaryPlanObj();
	}else if (spnsrIndex == 'S') {
		tpaObj = getSecondarySponsorObj();
		planObj= getSecondaryPlanObj();
	}
	var tpaId = "";
	if (tpaObj != null) tpaId = tpaObj.value;

	var plan 	= "";
	if (planObj != null) plan = planObj.value;

	var orgId = document.mainform.organization.value;

	if (gPatientCategoryChanged)
		resetOrderDialogRatePlanInsurance(orgId, tpaId, plan, true);
}

function populateMLCTemplates() {
	var isMlc = document.mrnoform.mlccheck.checked;
	if (isMlc) {
		document.mainform.patientMlcStatus.value = 'Y';
		document.mrnoform.mlcBtn.disabled = false;
		showMlcDialog();
	} else {
		document.mainform.patientMlcStatus.value = 'N';
		document.mrnoform.mlcBtn.disabled = true;
	}
	estimateTotalAmount();
}

function setValueInAnotherForm(formName, elName, obj, defaultValue) {
	if (obj.type == 'checkbox') {
		var mForm = document.forms[formName];
		if (obj.checked) mForm[elName].value = obj.value;
		else mForm[elName].value = defaultValue;
	}
}

function onChangeMLCDoc() {
	document.mainform.mlc_template_id.value = document.mainform.mlc_template.options[document.mainform.mlc_template.options.selectedIndex].value;
	document.mainform.mlc_template_name.value = document.mainform.mlc_template.options[document.mainform.mlc_template.options.selectedIndex].text;
}

//for validation... As sometimes the number of characters may exceed the max-length specified

function limitText(limitField, limitNum) {
	if (limitField.value.length > limitNum) {
		alert(getString("js.registration.patient.sorry.a.maximum.description.of.only.string")+" " + limitNum + " "+getString("js.registration.patient.characters.can.be.entered.string"));
		limitField.value = limitField.value.substring(0, limitNum);
	}
}

String.prototype.startsWith = function (str){
   	return this.slice(0, str.length) == str;
};

var mlcDialog = null;

function initMlcDialog() {
	var dialog = document.getElementById('mlcFieldsDialog');
	dialog.style.display = 'block';
	mlcDialog = new YAHOO.widget.Dialog("mlcFieldsDialog", {
		width: "760px",
		visible: false,
		modal: true,
		constraintoviewport: true
	});
	YAHOO.util.Event.addListener("mlcFieldsOkBtn", "click", validateMlcFields, mlcDialog, true);
	subscribeKeyListeners(mlcDialog, 'mlc');
	mlcDialog.render();
}

function showMlcDialog() {
	var obj = document.getElementById("openmlc");
	if (mlcDialog != null) {
		mlcDialog.cfg.setProperty("context", [obj, "tr", "tl"], false);
		mlcDialog.show();
	}
	return false;
}

function validateMlcFields() {
	if (document.mainform.mlc_template.selectedIndex <= 0) {
		showMessage("js.registration.patient.mlc.template.required");
		document.mainform.mlc_template.focus();
		return false;
	}

	if (mlcDialog != null) mlcDialog.hide();
	return true;
}

var cfDialog = null;
var vcfDialog = null;

function customDialog() {
	var dialog = document.getElementById('customFieldsDialog');
	dialog.style.display = 'block';
	cfDialog = new YAHOO.widget.Dialog("customFieldsDialog", {
		width: "760px",
		visible: false,
		modal: true,
		constraintoviewport: true
	});
	YAHOO.util.Event.addListener("customFieldsOkBtn", "click", validateSecondaryCustomFields, cfDialog, true);
	subscribeKeyListeners(cfDialog, 'custom');
	cfDialog.render();
}

function visitCustomDialog() {
	var dialog = document.getElementById('visitCustomFieldsDialog');
	dialog.style.display = 'block';
	vcfDialog = new YAHOO.widget.Dialog("visitCustomFieldsDialog", {
		width: "760px",
		visible: false,
		modal: true,
		constraintoviewport: true
	});
	YAHOO.util.Event.addListener("visitCustomFieldsOkBtn", "click", validateSecondaryVisitCustomFields, vcfDialog, true);
	subscribeKeyListeners(vcfDialog, 'visit_custom');
	vcfDialog.render();
}

function subscribeKeyListeners(dialog, type) {
	var escKeyListener = new YAHOO.util.KeyListener(document, {
		keys: 27
	}, {
		fn: closeDialog,
		scope: dialog,
		correctScope: true
	});

	// Alt+Shift+K
	if (type == 'mlc') {
		var okButtonListener = new YAHOO.util.KeyListener(document, {
			alt: true,
			shift: true,
			keys: 75
		}, {
			fn: validateMlcFields,
			scope: dialog,
			correctScope: true
		});
		dialog.cfg.setProperty("keylisteners", [escKeyListener, okButtonListener]);
	} else if (type == 'custom') {
		var okButtonListener = new YAHOO.util.KeyListener(document, {
			alt: true,
			shift: true,
			keys: 75
		}, {
			fn: validateSecondaryCustomFields,
			scope: dialog,
			correctScope: true
		});
		dialog.cfg.setProperty("keylisteners", [escKeyListener, okButtonListener]);
	} else if (type == 'visit_custom') {
		var okButtonListener = new YAHOO.util.KeyListener(document, {
			alt: true,
			shift: true,
			keys: 75
		}, {
			fn: validateSecondaryVisitCustomFields,
			scope: dialog,
			correctScope: true
		});
		dialog.cfg.setProperty("keylisteners", [escKeyListener, okButtonListener]);
	}
}

function showCustomDialog(obj) {
	var row = getThisRow(obj);
	if (cfDialog != null) {
		cfDialog.cfg.setProperty("context", [obj, "tr", "tl"], false);
		cfDialog.show();
	}
	return false;
}

function showVisitCustomDialog(obj) {
	var row = getThisRow(obj);
	if (vcfDialog != null) {
		vcfDialog.cfg.setProperty("context", [obj, "tl", "tr"], false);
		vcfDialog.show();
	}
	return false;
}

function getThisRow(node) {
	return findAncestor(node, "TR");
}

function closeDialog() {
	this.cancel();
}

/*function validateVisitCustomFields() {
	if (screenid == "ip_registration") {
		var visitType = "I";
	} else {
		var visitType = "O";
	}
	if (visitFieldsList.length > 0) {
		for (var i = 0; i < visitFieldsList.length; i++) {
			var custfieldObj = customVisitFieldValidation(visitType, visitFieldsList[i]);
			if (custfieldObj != null) {
				if (VisitCollapsiblePanel1.isOpen()) {
					setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
				} else {
					VisitCollapsiblePanel1.open();
					setTimeout("document.mainform." + custfieldObj + ".focus()", 800);
				}
				return false;
			}
		}
	}
	return true;
}*/

function validatePrimaryCustomFields() {
	if (screenid == "ip_registration") {
		var visitType = "I";
	} else {
		var visitType = "O";
	}
	if (mainPagefieldsList.length > 0) {
		for (var i = 0; i < mainPagefieldsList.length; i++) {
			var custfieldObj = customFieldValidation(visitType, mainPagefieldsList[i]);
			if (custfieldObj != null) {
				if (CollapsiblePanel1.isOpen()) {
					setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
				} else {
					CollapsiblePanel1.open();
					setTimeout("document.mainform." + custfieldObj + ".focus()", 800);
				}
				cfDialog.hide();
				return false;
			}
		}
	}
	if (cfDialog != null) cfDialog.hide();
	return true;
}

function validatePrimaryVisitCustomFields() {
	if (screenid == "ip_registration") {
		var visitType = "I";
	} else {
		var visitType = "O";
	}
	if (mainPageVisitfieldsList.length > 0) {
		for (var i = 0; i < mainPageVisitfieldsList.length; i++) {
			var custfieldObj = customVisitFieldValidation(visitType, mainPageVisitfieldsList[i]);
			if (custfieldObj != null) {
				if (VisitCollapsiblePanel1.isOpen()) {
					setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
				} else {
					VisitCollapsiblePanel1.open();
					setTimeout("document.mainform." + custfieldObj + ".focus()", 800);
				}
				vcfDialog.hide();
				return false;
			}
		}
	}
	if (vcfDialog != null) vcfDialog.hide();
	return true;
}


function validateSecondaryCustomFields() {
	if (screenid == "ip_registration") {
		var visitType = "I";
	} else {
		var visitType = "O";
	}
	if (dialogFieldsList.length > 0) {
		for (var i = 0; i < dialogFieldsList.length; i++) {
			var custfieldObj = customFieldValidation(visitType, dialogFieldsList[i]);
			if (custfieldObj != null) {
				if (!CollapsiblePanel1.isOpen()) CollapsiblePanel1.open();
				cfDialog.cfg.setProperty("context", [document.getElementById('btnCustomFields'), "tr", "tl"], false);
				cfDialog.show();
				setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
				return false;
			}
		}
	}
	if (cfDialog != null) cfDialog.hide();
	return true;
}

function validateSecondaryVisitCustomFields() {
	if (screenid == "ip_registration") {
		var visitType = "I";
	} else {
		var visitType = "O";
	}
	if (dialogVisitFieldsList.length > 0) {
		for (var i = 0; i < dialogVisitFieldsList.length; i++) {
			var custfieldObj = customVisitFieldValidation(visitType, dialogVisitFieldsList[i]);
			if (custfieldObj != null) {
				if (!VisitCollapsiblePanel1.isOpen()) VisitCollapsiblePanel1.open();
				vcfDialog.cfg.setProperty("context", [document.getElementById('btnVisitCustomFields'), "tl", "tr"], false);
				vcfDialog.show();
				setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
				return false;
			}
		}
	}
	if (vcfDialog != null) vcfDialog.hide();
	return true;
}

function validateCustomFields() {
	if (!validatePrimaryCustomFields()) return false;
	if (!validateSecondaryCustomFields()) return false;
	if (!validatePrimaryVisitCustomFields()) return false;
	if (!validateSecondaryVisitCustomFields()) return false;
	return true;
}

function openPatientBill() {
	if (patientBilPopUp == "Y") {
		window.open("../../billing/BillAction.do?_method=getCreditBillingCollectScreen&billNo=" + billNo);
	}
}

// function called by order dialog when user clicks Add in the order dialog.

function addOrders(order) {
	order.planIds = getPlanIds();
	var type = order.itemType;
	if (type == 'Laboratory' || type == 'Radiology') {
		index = addInvestigations(order);
	} else if (type == 'Service') {
		index = addServices(order);
	} else if (type == 'Other Charge') {
		index = addOtherServices(order, "OCOTC");
	} else if (type == 'Implant') {
		index = addOtherServices(order, "IMPOTC");
	} else if (type == 'Consumable') {
		index = addOtherServices(order, "CONOTC");
	} else if (type == 'Doctor') {
		index = addDoctor(order);
	} else if (type == 'Equipment') {
		index = addEquipment(order);
	} else if (type == 'Package') {
		index = addPackages(order);
	} else if (type == 'Operation') {
		index = infoOfOrder(order);
	}

	estimateTotalAmount();
	return true;
}

function getPlanIds(){
	var primaryPlanId = document.getElementById("primary_plan_id");
	var secPlanId = document.getElementById("secondary_plan_id");
	var noofPlans = 0;
	var priPlanExists = false;
	var secPlanExists = false;
	if(primaryPlanId != null && primaryPlanId.value != '') {
		priPlanExists = true;
		noofPlans++;
	}
	if(secPlanId != null && secPlanId.value != '') {
		secPlanExists = true;
		noofPlans++;
	}
	var planIds = [];
	planIds.length = noofPlans;

	if(priPlanExists && secPlanExists) {
		planIds[0] = primaryPlanId.value;
		planIds[1] = secPlanId.value;
	}else if(priPlanExists) {
		planIds[0] = primaryPlanId.value;
	}else if(secPlanExists) {
		planIds[0] = secPlanId.value;
	}
	return planIds;
}


function infoOfOrder(order) {
	showMessage("js.registration.patient.operations.cannot.be.ordered.use.order.screen.string");
	return false;
}

function cancelOrder(imgObj) {
	var row = YAHOO.util.Dom.getAncestorByTagName(imgObj, 'tr');
	if (getElementByName(row, "firstOfCategory").value == "true" && gIsInsurance)
		alert(getString("js.registration.patient.deleting.the.first.item.of.insurance.category.string")+"\n" +
			 getString("js.registration.patient.insurance.patient.co.pay.fixed.amount.may.need.to.be.adjusted.string")+"\n" +
			getString("js.registration.patient.for.additional.charges.of.the.same.category.string"));
	row.parentNode.removeChild(row);
	estimateTotalAmount();
}

// Function called when Plan type is changed in UI

function onInsuCatChange(spnsrIndex) {
	insuCatChange(spnsrIndex);
	RatePlanList();
	ratePlanChange();
}

// Function called when Insurance company is changed in UI (loadTpaList())
// (or) existing patient details are loaded (loadInsurancePolicyDetails())
// (or) Member ship autocomplete is changed (loadPolicyDetails)

function insuCatChange(spnsrIndex) {

	var insApprovalAmtObj = null;
	var planObj = null;
	var insCompObj = null;
	var planTypeObj = null;

	if (spnsrIndex == 'P') {
		insApprovalAmtObj = getPrimaryApprovalLimitObj();
		planObj = getPrimaryPlanObj();
		insCompObj = getPrimaryInsuObj();
		planTypeObj = getPrimaryPlanTypeObj();

	}else if (spnsrIndex == 'S') {
		insApprovalAmtObj = getSecondaryApprovalLimitObj();
		planObj = getSecondaryPlanObj();
		insCompObj = getSecondaryInsuObj();
		planTypeObj = getSecondaryPlanTypeObj();

	}

	if (insApprovalAmtObj) insApprovalAmtObj.value = "";

	if (planObj != null) {

		var selectedInsId = insCompObj.value;
		var selectedCatId = planTypeObj.value;
		var policySelect = planObj;

		// Empty plans
		var len = 1;
		var policyDefault = "";
		var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
		policySelect.options.length = len;
		policySelect.options[len - 1] = optn;
		for (var k = 0; k < policynames.length; k++) {
			var ele = policynames[k];
			if (screenid == "reg_registration" || screenid == "out_pat_reg") {
				if (ele.insurance_co_id == selectedInsId && ele.category_id == selectedCatId && ele.status == "A" && ele.op_applicable == "Y") {
					var optn = new Option(ele.plan_name, ele.plan_id);
					len++;
					policySelect.options.length = len;
					policySelect.options[len - 1] = optn;
					policyDefault = ele.plan_id;
				}
			} else {
				if (ele.insurance_co_id == selectedInsId && ele.category_id == selectedCatId && ele.status == "A" && ele.ip_applicable == "Y") {
					var optn = new Option(ele.plan_name, ele.plan_id);
					len++;
					policySelect.options.length = len;
					policySelect.options[len - 1] = optn;
					policyDefault = ele.plan_id;
				}
			}
		}

		if (policySelect.options.length == 2) {
			setSelectedIndex(policySelect, policyDefault);
		}

		sortDropDown(planObj);
		policyChange(spnsrIndex);
	}
}

function showPatientAmountsColumns(show) {
	// show patient amounts in order table
	showOrderTablePatientAmounts(0, show);

	// show patient amount totals
	var patientAmountRow = document.getElementById("patientAmounts");
	if (patientAmountRow) {
		if (show) patientAmountRow.style.display = '';
		else patientAmountRow.style.display = 'none';
	}
}

function uploadForms() {
	var docSelected = false;
	var tpaIdObj = getPrimarySponsorObj();
	if (document.getElementById("docTable")) {
		var table = document.getElementById("docTable");
		// First row -- Insurance card upload
		// From second row the docs required in docs_upload, hence check if rows > 1
		var totalNoOfRows = table.rows.length;
		if (totalNoOfRows > 0) {
			for (var i = 1; i <= totalNoOfRows; i++) {
				if (document.getElementById('mandatory' + i).value == "A"
								&& document.getElementById('doc_content_bytea' + i).value == "") {
					alert(getString("js.registration.patient.upload.document.required")+" " + document.getElementById('doc_name' + i).value);
					document.getElementById('doc_content_bytea' + i).focus();
					return false;
				}
				if (document.getElementById('mandatory' + i).value == "I"
								&& document.getElementById('doc_content_bytea' + i).value == "" && screenid == "ip_registration") {
					alert(getString("js.registration.patient.upload.document.required")+" " + document.getElementById('doc_name' + i).value);
					document.getElementById('doc_content_bytea' + i).focus();
					return false;
				}
				if (document.getElementById('mandatory' + i).value == "O"
								&& document.getElementById('doc_content_bytea' + i).value == "" && screenid == "reg_registration") {
					alert(getString("js.registration.patient.upload.document.required")+" " + document.getElementById('doc_name' + i).value);
					document.getElementById('doc_content_bytea' + i).focus();
					return false;
				}
				if (document.getElementById('mandatory' + i).value == "S"
								&& document.getElementById('doc_content_bytea' + i).value == "" && screenid == "out_pat_reg") {
					alert(getString("js.registration.patient.upload.document.required")+" " + document.getElementById('doc_name' + i).value);
					document.getElementById('doc_content_bytea' + i).focus();
					return false;
				}
				if (document.getElementById('mandatory' + i).value == "P"
					&& document.getElementById('doc_content_bytea' + i).value == ""
					&& tpaIdObj && tpaIdObj.value != ""
					&& (document.mainform.op_type == null || document.mainform.op_type.value == "M")) {

					alert(getString("js.registration.patient.upload.document.required")+" " + document.getElementById('doc_name' + i).value);
					document.getElementById('doc_content_bytea' + i).focus();
					return false;
				}
			}
		}
	}
	return true;
}

var babyMemeberId;
function validateBabyAge(mrNo,visitId,sponsorObj,memberId) {
	babyMemeberId = memberId;
	var ajaxobj = newXMLHttpRequest();
	var url = cpath + "/pages/registration/regUtils.do?_method=getBabyDOBAndMemberIdValidityDetails&mr_no=" + mrNo +
						"&visit_id=" + visitId+"&sponsor_type="+sponsorObj.value;

	ajaxobj.open("POST", url.toString(), false);
	ajaxobj.send(null);
	if (ajaxobj.readyState == 4) {
		if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
			return babyDetailsHandaler(ajaxobj.responseText);
		}
	}

	return true;
}


function babyDetailsHandaler(responseText) {
	var memberId = babyMemeberId;
	eval("babyInfo =" + responseText);
	if (babyInfo != null) {
		var babyDetails = babyInfo.babyDetails;
		var babyVisitDetails = babyInfo.babyVisitDetails;
		var helthAuthPrefs =  babyInfo.helathAuthPrefs;
		var parentMemberId = babyInfo.member_id;
		if(babyDetails != null && helthAuthPrefs != null) {
			var salutation = babyDetails.salutation;
			salutation = salutation.toUpperCase();
			if(salutation == 'BABY' && memberId == parentMemberId) {
				var dobInMillis = babyDetails.dateofbirth;
				var child_mother_ins_member_validity_days = helthAuthPrefs.child_mother_ins_member_validity_days;
				var dob = new Date(dobInMillis);
				var serverDate = new Date();
				var diffInDays = (serverDate - dob)/ 60 / 60 / 24 / 1000;
				if(!empty(child_mother_ins_member_validity_days) && diffInDays < child_mother_ins_member_validity_days) {
					return false;
				}
			}
		}
	}
	return true;
}

function checkForMemberID(spnsrIndex) {
	var memberIdObj = null;
	var insuCompObj = null;
	var sponsorObj = null;

	if (spnsrIndex == 'P') {
		memberIdObj = getPrimaryInsuranceMemberIdObj();
		insuCompObj = getPrimaryInsuObj();
		sponsorObj = getPrimarySponsorTypeObj();

	}else if (spnsrIndex == 'S') {
		memberIdObj = getSecondaryInsuranceMemberIdObj();
		insuCompObj = getSecondaryInsuObj();
		sponsorObj = getSecondarySponsorTypeObj();
	}

	if (memberIdObj != null) {
		var memberId = trimAll(memberIdObj.value);
		var mrNo = document.mrnoform.mrno.value;

		if (!empty(memberId)) {
			var companyId = insuCompObj.value;

			if(!empty(mrNo) && !empty(gVisitId) && !empty(sponsorObj)
				&& !validateBabyAge(mrNo,gVisitId,sponsorObj,memberId)) {
				return true;
			}

			var ajaxobj = newXMLHttpRequest();
			var url = cpath + "/pages/registration/regUtils.do?_method=checkForPatientMemberId&member_id=" + encodeURIComponent(memberId) +
								"&companyId=" + companyId + "&mrno=" + mrNo;
			ajaxobj.open("POST", url.toString(), false);
			ajaxobj.send(null);
			if (ajaxobj) {
				if (ajaxobj.readyState == 4) {
					if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
						eval("var exists =" + ajaxobj.responseText);
						if (exists == "true") {
							showMessage("js.registration.patient.membership.id.already.exists.string");
							memberIdObj.value = "";
							memberIdObj.focus();
							return false;
						}else
							return true;
					}
				}
			}
		}
	}
	return true;
}

function hotKeys() {
/** which will adds the keylistener for the document(for key Alt + Shift +  I).
	  toggles the Additional Information Collapsible Panel. */

	var addInfoKeyListener = new YAHOO.util.KeyListener(document, {
		alt: true,
		shift: true,
		keys: 73
	}, {
		fn: toggleCollapsiblePanel,
		scope: CollapsiblePanel1,
		correctScope: true
	});
	addInfoKeyListener.enable();

	/** Keylistener for the Additional Information Collapsible Panel.(key Alt + Shift + N) */
	var addVisitInfoKeyListener = new YAHOO.util.KeyListener(document, {
		alt: true,
		shift: true,
		keys: 78
	}, {
		fn: toggleVisitCollapsiblePanel,
		scope: VisitCollapsiblePanel1,
		correctScope: true
	});
	addVisitInfoKeyListener.enable();

	/** enables the mrno search. (Alt + Shift + M) */

	var mrnoSearchKeyListener = new YAHOO.util.KeyListener(document, {
		alt: true,
		shift: true,
		keys: 77
	}, {
		fn: showMrnoSearch,
		scope: "regTyperegd",
		correctScope: true
	});
	mrnoSearchKeyListener.enable();
}

	var photoViewDialog = null;

	function initPatientphotoViewDialog() {
		var dialog = document.getElementById('showphotoViewDialog');
		dialog.style.display = 'block';
		photoViewDialog = new YAHOO.widget.Dialog("showphotoViewDialog", {
			width: "350px",
			height: "250px",
			visible: false,
			modal: true,
			constraintoviewport: true
		});
		photoViewDialog.render();

	}

	var primarySponsorDialog = null;

	function initprimarySponsorDialog() {
		var dialog = document.getElementById('showPimarySponsorViewDialog');
		dialog.style.display = 'block';
		primarySponsorDialog = new YAHOO.widget.Dialog("showPimarySponsorViewDialog", {
			width: "350px",
			height: "250px",
			visible: false,
			modal: true,
			constraintoviewport: true
		});
		primarySponsorDialog.render();

	}

	var secondarySponsorDialog = null;

	function initsecondarySponsorDialog() {
		var dialog = document.getElementById('showSecondarySponsorViewDialog');
		dialog.style.display = 'block';
		secondarySponsorDialog = new YAHOO.widget.Dialog("showSecondarySponsorViewDialog", {
			width: "350px",
			height: "250px",
			visible: false,
			modal: true,
			constraintoviewport: true
		});
		secondarySponsorDialog.render();

	}

	function getCookie() {
		return document.cookie;
	}

	function getUrl() {
		var anchor = document.createElement("a");
		anchor.href = cpath + "/pages/registration/fileupload.do?_method=fileUpload";
		return anchor.href;
	}

	function storeFilePath(fileLocation, contentType, toPath) {

		var fileHtmlId;
		var fileContentHtmlId;
		var viewImageHtmlId;
		var primarySponsorType = document.getElementById('primary_sponsor').value;
		var secondarySponsorType = document.getElementById('secondary_sponsor').value;

		if (toPath == 'patientphoto') {
			fileHtmlId = 'photofileLocation';
			fileContentHtmlId = 'photocontentType';
			viewImageHtmlId = 'viewPatientPhotoLabel';

		} else if (toPath == 'primarySponsor') {
			fileHtmlId = 'primary_sponsor_cardfileLocation'+primarySponsorType;
			fileContentHtmlId = 'primary_sponsor_cardContentType'+primarySponsorType;
			viewImageHtmlId = 'viewPrimarySponsor'+primarySponsorType;

		} else {
			fileHtmlId = 'secondary_sponsor_cardfileLocation'+secondarySponsorType;
			fileContentHtmlId = 'secondary_sponsor_cardContentType'+secondarySponsorType;
			viewImageHtmlId = 'viewSecondarySponsor'+secondarySponsorType;

		}

		document.getElementById(fileHtmlId).value = fileLocation;
		document.getElementById(fileContentHtmlId).value = contentType;
		var viewLabel = document.getElementById(viewImageHtmlId);
		var jsString = getString("js.registration.patient.pasteImage.viewImageLabel");
		var quotedPath = "'"+toPath+"'";
		viewLabel.innerHTML = '<a onclick="viewImage('+quotedPath+');" >'+jsString+'</a>';
		viewImage(toPath);
	}

	function viewImage(toPath) {

		var fileHtmlId;
		var fileContentHtmlId;
		var viewObjectId;
		var srcHtmlId;
		var dialog;
		var primarySponsorType = document.getElementById('primary_sponsor').value;
		var secondarySponsorType = document.getElementById('secondary_sponsor').value;

		if (toPath == 'patientphoto') {
			fileHtmlId = 'photofileLocation';
			fileContentHtmlId = 'photocontentType';
			viewObjectId = 'viewphotoId';
			srcHtmlId = 'photoImgId';
			dialog = photoViewDialog;

		} else if (toPath == 'primarySponsor') {
			fileHtmlId = 'primary_sponsor_cardfileLocation'+primarySponsorType;
			fileContentHtmlId = 'primary_sponsor_cardContentType'+primarySponsorType;
			viewObjectId = 'primarySponsor'+primarySponsorType;
			srcHtmlId = 'primarySponsorImgId';
			dialog = primarySponsorDialog;

		} else {
			fileHtmlId = 'secondary_sponsor_cardfileLocation'+secondarySponsorType;
			fileContentHtmlId = 'secondary_sponsor_cardContentType'+secondarySponsorType;
			viewObjectId = 'secondarySponsor'+secondarySponsorType;
			srcHtmlId = 'secondarySponsorImgId';
			dialog = secondarySponsorDialog;
		}
		var fileLocation = document.getElementById(fileHtmlId).value;
		var contentType = document.getElementById(fileContentHtmlId).value;

		document.getElementById(srcHtmlId).src = cpath+'/pages/registration/fileupload.do?_method=showImage&filePathLocation='+fileLocation+'&contentType='+contentType;
		var obj = document.getElementById(viewObjectId)
		if (dialog != null) {
			dialog.cfg.setProperty("context", [obj, "tr", "tl"], false);
			dialog.show();
		}

	}


function checkForCorporateMemberID(spnsrIndex) {
    var memberIdObj = null;
    var insuCompObj = null;
    var planObj= null;
    var sponsorObj = null;
    if (spnsrIndex == 'P') {
        memberIdObj =  document.getElementById("primary_employee_id")
        insuCompObj = getPrimarySponsorObj();
        sponsorObj = getPrimarySponsorTypeObj();

    } else if (spnsrIndex == 'S') {
        memberIdObj =  document.getElementById("secondary_employee_id")
        insuCompObj =  getSecondarySponsorObj();
        sponsorObj = getPrimarySponsorTypeObj();
    }

    if (memberIdObj != null) {
		var memberId = trimAll(memberIdObj.value);
		var mrNo = document.mrnoform.mrno.value;

		if (!empty(memberId)) {
			var companyId = insuCompObj.value;

			if(!empty(mrNo) && !empty(gVisitId) && !empty(sponsorObj)
				&& !validateBabyAge(mrNo,gVisitId,sponsorObj,memberId)) {
				return true;
			}

			var ajaxobj = newXMLHttpRequest();
			var url = cpath + "/pages/registration/regUtils.do?_method=checkForDuplicateCorporateMemberId"
						+ "&member_id=" + encodeURIComponent(memberId) +"&sponsor_id="+companyId+ "&mr_no=" + mrNo;
			ajaxobj.open("POST", url.toString(), false);
			ajaxobj.send(null);
			if (ajaxobj) {
				if (ajaxobj.readyState == 4) {
					if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
						eval("var exists =" + ajaxobj.responseText);
						if (exists == "true") {
							showMessage("js.registration.patient.employee.id.already.exists.string");
							memberIdObj.value = "";
							memberIdObj.focus();
							return false;
						}else
							return true;
					}
				}
			}
		}
	}
    return true;
}

function checkForNationalMemberID(spnsrIndex) {
    var memberIdObj = null;
    var insuCompObj = null;
    var planObj= null;
    var sponsorObj = null;
    if (spnsrIndex == 'P') {
        memberIdObj = document.getElementById('primary_national_member_id');
        insuCompObj = getPrimarySponsorObj();
        sponsorObj = getPrimarySponsorTypeObj();
    } else if (spnsrIndex == 'S') {
        memberIdObj = document.getElementById('secondary_national_member_id')
        insuCompObj =  getSecondarySponsorObj();
        sponsorObj = getPrimarySponsorTypeObj();
    }

    if (memberIdObj != null) {
		var memberId = trimAll(memberIdObj.value);
		var mrNo = document.mrnoform.mrno.value;

		if (!empty(memberId)) {
			var companyId = insuCompObj.value;

			if(!empty(mrNo) && !empty(gVisitId) && !empty(sponsorObj)
				&& !validateBabyAge(mrNo,gVisitId,sponsorObj,memberId)) {
				return true;
			}

			var ajaxobj = newXMLHttpRequest();
			var url = cpath + "/pages/registration/regUtils.do?_method=checkForDuplicateNationalMemberId"+
						"&member_id=" + encodeURIComponent(memberId) + "&sponsor_id=" + companyId + "&mr_no=" + mrNo
			ajaxobj.open("POST", url.toString(), false);
			ajaxobj.send(null);
			if (ajaxobj) {
				if (ajaxobj.readyState == 4) {
					if ((ajaxobj.status == 200) && (ajaxobj.responseText != null)) {
						eval("var exists =" + ajaxobj.responseText);
						if (exists == "true") {
							showMessage("js.registration.patient.member.id.already.exists.string");
							memberIdObj.value = "";
							memberIdObj.focus();
							return false;
						}else
							return true;
					}
				}
			}
		}
	}
    return true;
}

//--------- editorders related javascript code ---

var presAutoComp = null;
var rowUnderEdit = null;
function doctorAutoComplete(field, dropdown, list, thisForm) {

	var localDs = new YAHOO.util.LocalDataSource(list,{ queryMatchContains : true });
	localDs.responseType =  YAHOO.util.LocalDataSource.TYPE_JSON;
	localDs.responseSchema = { resultsList : "doctors",
		fields: [ {key : "doctor_name"}, {key: "doctor_id"} ]
	};

	var autoComp = new YAHOO.widget.AutoComplete(field, dropdown, localDs);

	autoComp.prehightlightClassName = "yui-ac-prehighlight";
	autoComp.typeAhead = true;
	autoComp.useShadow = true;
	autoComp.allowBrowserAutocomplete = false;
	autoComp.minQueryLength = 0;
	autoComp.maxResultsDisplayed = 20;
	autoComp.autoHighlight = true;
	autoComp.forceSelection = true;
	autoComp.animVert = false;
	autoComp.useIFrame = true;
	autoComp.formatResult = Insta.autoHighlight;

	var itemSelectHandler = function(sType, aArgs) {
		thisForm.ePresDocId.value =  aArgs[2][1];
	};

	autoComp.itemSelectEvent.subscribe(itemSelectHandler);
	return autoComp;
}
function initEditDialog() {
	editDialog = new YAHOO.widget.Dialog("editDialog", { width:"600px",
			context: ["orderTable", "tr", "br"],
			visible:false,
			modal:true,
			constraintoviewport:true
			});
	document.getElementById("editDialog").style.display = 'block';
	editDialog.render();
	subscribeEscKeyEvent(editDialog, cancelEdit);
	editDialog.cancelEvent.subscribe(onEditDialogCancel);
}

function showEditDialog(imgObj) {
	editDialog.cfg.setProperty("context", [imgObj, "tr", "br"], false);
	var row = YAHOO.util.Dom.getAncestorByTagName(imgObj, 'tr');
	var newEl = getElementByName(row, 'new');
	var type = getElementByName(row, "existingtype").value;
	var newType =  getElementByName(row, "type").value;
	var finStatus = getElementByName(row, "finStatus").value;
	var newFinStatus = getElementByName(row, "newFinStatus").value;
	var isFinalizable = (type == 'Equipment') && (finStatus == 'N');		// orig fin status in db
	var isFinalized = (type == 'Equipment') && (newFinStatus == 'F');

	// editing an existing order

	var remarksElmt = getElementByName(row, (newEl.value == 'Y' ? newType+".":'')+"remarks");
	if (remarksElmt != null) document.editForm.eRemarks.value = remarksElmt.value;
	var prescDrIdElmt = getElementByName(row, (newEl.value == 'Y' ? newType+".":'')+"presDocId");
	if (prescDrIdElmt != null) document.editForm.ePresDocId.value = prescDrIdElmt.value;

	document.editForm.ePrescribedBy.value = getElementByName(row, "presDocName").value;
	// the following is to prevent clearing of the autocomp on blur
	presAutoComp._bItemSelected = true;
	var qtyElmt = getElementByName(row,( newEl.value == 'Y' ? newType+".quantity" : "quantity"));

	if (isFinalizable || isFinalized) {
		var fromDateElmt = getElementByName(row, "fromDate");
		if (fromDateElmt != null) document.editForm.eFromDate.value = fromDateElmt.value;

		var fromTimeElmt = getElementByName(row, "fromTime");
		if (fromTimeElmt != null) document.editForm.eFromTime.value = fromTimeElmt.value;

		var toDateElmt = getElementByName(row, "toDate");
		if (toDateElmt != null) document.editForm.eToDate.value = toDateElmt.value;

		var toTimeElmt = getElementByName(row, "toTime");
		if (toTimeElmt != null) document.editForm.eToTime.value = toTimeElmt.value;
	}
	document.editForm.eFinalized.checked = isFinalized;
	document.editForm.eFinalized.disabled = !isFinalizable;
	document.editForm.eFromDate.disabled = !isFinalizable;
	document.editForm.eFromTime.disabled = !isFinalizable;
	document.editForm.eToDate.disabled = !isFinalizable;
	document.editForm.eToTime.disabled = !isFinalizable;

	var urgentElmt = getElementByName(row, (newEl.value == 'Y' ? newType+".":'')+"urgent");

	if(type == 'Laboratory' || type == 'Radiology' || newType == 'test')
		document.editForm.eurgent.disabled = false;
	else
		document.editForm.eurgent.disabled = true;

	if (urgentElmt != null && urgentElmt.value == 'S')
		document.editForm.eurgent.checked = true;
	else
		document.editForm.eurgent.checked = false;

	if(multiPlanExists) {
		document.getElementById("ePriPreAuthLbl").style.display = 'block';
		document.getElementById("ePreAuthLbl").style.display = 'none';
		document.getElementById("ePriPreAuthModeLbl").style.display = 'block';
		document.getElementById("ePreAuthModeLbl").style.display = 'none';
	}else{
		document.getElementById("ePriPreAuthLbl").style.display = 'none';
		document.getElementById("ePreAuthLbl").style.display = 'block';
		document.getElementById("ePriPreAuthModeLbl").style.display = 'none';
		document.getElementById("ePreAuthModeLbl").style.display = 'block';
	}

	var priorAuthElmt = getElementByName(row, "prior_auth_id");
	if (priorAuthElmt != null) document.editForm.ePriorAuthId.value = priorAuthElmt.value;

	var secPriorAuthElmt = getElementByName(row, "sec_prior_auth_id");
	if(secPriorAuthElmt != null) document.editForm.eSecPriorAuthId.value = secPriorAuthElmt.value;

	var priorAuthModeElmt = getElementByName(row, "prior_auth_mode_id");
	if (priorAuthModeElmt != null) document.editForm.ePriorAuthMode.value = priorAuthModeElmt.value;

	var secPriorAuthModeElmt = getElementByName(row, "sec_prior_auth_mode_id");
	if(secPriorAuthModeElmt != null) document.editForm.eSecPriorAuthMode.value = secPriorAuthModeElmt.value;

	var toothNum = getElementByName(row, "s_tooth_number").value;
	if (empty(type)) {
		document.getElementById('edToothNumBtnDiv').style.display = empty(toothNum) ? 'none' : 'block';
		document.getElementById('edToothNumDsblBtnDiv').style.display = empty(toothNum) ? 'block' : 'none';
	} else {
		// do not allow to edit the tooth number for the services which are already saved.
		document.getElementById('edToothNumBtnDiv').style.display = 'none';
		document.getElementById('edToothNumDsblBtnDiv').style.display = 'block';
	}
	var nos = toothNum.split(',');
	var tooth_numbers_text = '';
	var index = 0;
	for (var k=0; k<nos.length; k++) {
		if (index > 0) tooth_numbers_text += ',';
		if (index%10 ==0)
			tooth_numbers_text += '\n';

		tooth_numbers_text += nos[k];
		index++;
	}
	document.getElementById('edToothNumberDiv').textContent = tooth_numbers_text;
	document.getElementById('ed_tooth_number').value = toothNum;
	var toothNumReqEl = getElementByName(row, 's_tooth_num_required');
	if (toothNumReqEl != null) document.editForm.ed_tooth_num_required.value = toothNumReqEl.value;

	if(newEl.value == 'Y') {
		document.getElementById("ePriAuthRowId").style.visibility = "visible";
		if(multiPlanExists)
			document.getElementById("eSecPriAuthRowId").style.visibility = "visible";
	}
	else {
		document.getElementById("ePriAuthRowId").style.visibility = "hidden";
		document.getElementById("eSecPriAuthRowId").style.visibility = "hidden";
	}

/*	var billStatusEl = getElementByName(row, 'bill_status');
	if (billStatusEl && billStatusEl.value != 'A') {
		// disable changing of presc doctor if bill is not open. Presc doctor change
		// affects payment rule selection, so this should not be allowed.
		document.editForm.ePrescribedBy.disabled = true;
	} else {
		document.editForm.ePrescribedBy.disabled = false;
	}*/


	rowUnderEdit = row;
	YAHOO.util.Dom.addClass(row, 'editing');
	editDialog.show();

	document.editForm.eRemarks.focus();
}

function cancelEdit() {
	editDialog.cancel();
	rowUnderEdit = undefined;
}

function onEditDialogCancel() {
	document.getElementById("ePriAuthRowId").style.visibility = "hidden";
	document.getElementById("eSecPriAuthRowId").style.visibility = "hidden";
	YAHOO.util.Dom.removeClass(rowUnderEdit, 'editing');
}

function saveEdit() {
	var row = rowUnderEdit;
	var newEl = getElementByName(row, 'new');

	var editedEl = getElementByName(row, 'edited');
	if (editedEl)
		editedEl.value = 'Y';

	if (document.editForm.ePrescribedBy.value == '')
		document.editForm.ePresDocId.value = '';
	if (document.editForm.ed_tooth_num_required.value == 'Y' &&
		document.editForm.ed_tooth_number.value == '') {
		alert('Service required the tooth number.');
		return false;
	}

	setNodeText(row.cells[PRES_DOCTOR_COL], document.editForm.ePrescribedBy.value);
	setNodeText(row.cells[REMARKS_COL], document.editForm.eRemarks.value, 16);
	setNodeText(row.cells[PRE_AUTH_COL], document.editForm.ePriorAuthId.value, 16);
	if(multiPlanExists)
		setNodeText(row.cells[SEC_PRE_AUTH_COL], document.editForm.eSecPriorAuthId.value, 16);

	if(!document.editForm.eFromDate.disabled && !validateEditFields())
		return false;

	var tmType = getElementByName(row, "type").value;

	var prescribedDoctor = "";
	if(tmType == 'doctor') {
		prescribedDoctor = tmType+'.presc_doctor_id';
	} else if(tmType == 'service') {
		prescribedDoctor = tmType+'.doctor_id';
	} else if(tmType == 'test') {
		prescribedDoctor = tmType+'.pres_doctor';
	} else if(tmType == 'package') {
		prescribedDoctor = tmType+'.doctorId';
	} else if(tmType == 'other') {
		prescribedDoctor = tmType+'.doctor_id';
	} else if(tmType == 'Equipment') {
		prescribedDoctor = 'equipment.doctor_id';
	} else if(tmType == 'diet') {
		prescribedDoctor = tmType+'.ordered_by';
	}

	var remarksElmt = getElementByName(row, (newEl.value == 'Y' ? tmType+".":'')+"remarks");
	if (remarksElmt != null) remarksElmt.value = document.editForm.eRemarks.value;
	var prescDrIdElmt = getElementByName(row, prescribedDoctor);
	if (prescDrIdElmt != null) prescDrIdElmt.value = document.editForm.ePresDocId.value;
	getElementByName(row, "presDocName").value = document.editForm.ePrescribedBy.value;
	getElementByName(row, "newFinStatus").value = document.editForm.eFinalized.checked ? 'F' : 'N' ;
	getElementByName(row, "fromDate").value = document.editForm.eFromDate.value;
	getElementByName(row, "fromTime").value = document.editForm.eFromTime.value;
	getElementByName(row, "toDate").value = document.editForm.eToDate.value;
	getElementByName(row, "toTime").value = document.editForm.eToTime.value;
	if (document.editForm.ed_tooth_number) {
		var tooth_number = document.editForm.ed_tooth_number.value;
		if (getElementByName(row, "service.tooth_unv_number")) {
			getElementByName(row, "service.tooth_unv_number").value = tooth_number;
		} else if (getElementByName(row, "service.tooth_fdi_number")) {
			getElementByName(row, "service.tooth_fdi_number").value = tooth_number;
		}
		getElementByName(row, "s_tooth_number").value = tooth_number;
	}


	var urgentElmt = getElementByName(row, (newEl.value == 'Y' ? tmType+".":'')+"urgent");
	if (urgentElmt != null) urgentElmt.value = document.editForm.eurgent.checked ? 'S' : 'R' ;

	if(document.editForm.ePriorAuthId && insured){
		var priorAuthIdElmt = getElementByName(row, tmType+".prior_auth_id");
		if (priorAuthIdElmt != null) priorAuthIdElmt.value = document.editForm.ePriorAuthId.value;
		if (getElementByName(row, "prior_auth_id") != null)
			getElementByName(row, "prior_auth_id").value = document.editForm.ePriorAuthId.value;
		var priorAuthModeIdElmt = getElementByName(row, tmType+".prior_auth_mode_id");
		if (priorAuthModeIdElmt != null) priorAuthModeIdElmt.value = document.editForm.ePriorAuthMode.value;
		if (getElementByName(row, "prior_auth_mode_id") != null)
			getElementByName(row, "prior_auth_mode_id").value = document.editForm.ePriorAuthMode.value;
	}

	if(document.editForm.eSecPriorAuthId && insured && multiPlanExists){
		var secPriorAuthIdElmt = getElementByName(row, tmType+".sec_prior_auth_id");
		if (secPriorAuthIdElmt != null) secPriorAuthIdElmt.value = document.editForm.eSecPriorAuthId.value;
		if (getElementByName(row, "sec_prior_auth_id") != null)
			getElementByName(row, "sec_prior_auth_id").value = document.editForm.eSecPriorAuthId.value;
		var secPriorAuthModeIdElmt = getElementByName(row, tmType+".sec_prior_auth_mode_id");
		if (secPriorAuthModeIdElmt != null) secPriorAuthModeIdElmt.value = document.editForm.eSecPriorAuthMode.value;
		if (getElementByName(row, "sec_prior_auth_mode_id") != null)
			getElementByName(row, "sec_prior_auth_mode_id").value = document.editForm.eSecPriorAuthMode.value;
	}

	editDialog.cancel();
	YAHOO.util.Dom.addClass(rowUnderEdit, 'edited');
}

function validateEditFields(){
	var valid = true;

	valid = valid && validateRequired(document.editForm.eFromDate,"Start Date required");
	valid = valid && validateRequired(document.editForm.eFromTime,"Start Time required");
	valid = valid && validateRequired(document.editForm.eToDate,"End Date required");
	valid = valid && validateRequired(document.editForm.eToTime,"End Time required");
	valid = valid && validateFromToDateTime(document.editForm.eFromDate, document.editForm.eFromTime,
			document.editForm.eToDate, document.editForm.eToTime, true, true)
	return valid;
}

function validatePlan() {

	var priInsCompObj = getPrimaryInsuObj();
	var priTpaObj = getPrimarySponsorObj();
	var priPlanObj = getPrimaryPlanObj();
	var priPlanTypeObj = getPrimaryPlanTypeObj();
	var priMemberIdObj = getPrimaryInsuranceMemberIdObj();

	var secInsCompObj = getSecondaryInsuObj();
	var secTpaObj = getSecondarySponsorObj();
	var secPlanObj = getSecondaryPlanObj();
	var secPlanTypeObj = getSecondaryPlanTypeObj();
	var secMemberIdObj = getSecondaryInsuranceMemberIdObj();


	if (isModAdvanceIns) {
		if (!empty(priInsCompObj) && priInsCompObj.value !='' && !empty(secInsCompObj) && secInsCompObj.value !=''
							&& !empty(priPlanObj) && priPlanObj.value !='' && !empty(secPlanObj) && secPlanObj.value !='') {

			if (priInsCompObj.value == secInsCompObj.value && priPlanObj.value == secPlanObj.value) {
				var msg = getString("js.registration.patient.plans");
				msg += " "+getString("js.registration.patient.same.isnotallowed");;
				alert(msg);
				return false;
			}
			return true;
		}
		return true;
	}
	return true;
}

function validateMemberId() {

	if (isModAdvanceIns) {

		var priPlanObj = getPrimaryPlanObj();
		var secPlanObj = getSecondaryPlanObj();
		var priInsCompObj = getPrimaryInsuObj();
		var secInsCompObj = getSecondaryInsuObj();
		var priMemberIdObj = getPrimaryInsuranceMemberIdObj();
		var secMemberIdObj = getSecondaryInsuranceMemberIdObj();

		if ((priPlanObj != null && priPlanObj.value != "")
				&& (secPlanObj != null && secPlanObj.value != "")) {

			if (priInsCompObj.value == secInsCompObj.value
						&& (priMemberIdObj != null && priMemberIdObj.value.trim() != '')
						&& (secMemberIdObj != null && secMemberIdObj.value.trim() != '')) {

				if (priMemberIdObj.value.trim() == secMemberIdObj.value.trim()) {
					var memberIdRequiredMsg = memberIdLabel + " " +getString("js.registration.patient.same.isnotallowed");
					alert(memberIdRequiredMsg);
					return false;
				}
				return true;
			}
			return true;
		}
		return true;
	}
	return true;
}