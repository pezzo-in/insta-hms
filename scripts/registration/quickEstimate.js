
var chargesAdded = 0;

var mainform;
var editform;
var addOrderDialog;
var gIsInsurance = false;
var theForm;

totAmtPaise = 0;

function init() {
	mainform = document.mainform;
	editform = document.editform;
	addform = document.addform;

	// column indexes
	var i=0;
	HEAD_COL = i++; DESC_COL = i++; ACT_REMARKS_COL=i++; REMARKS_COL=i++,
	RATE_COL = i++; QTY_COL = i++,UNITS_COL=i++, DISCOUNT_COL = i++,
	AMT_COL = i++; CLAIM_COL=i++,PATIENT_AMT_COL=i++,TRASH_COL = i++; EDIT_COL = i++;

	initEditChargeDialog();

	var doctors = { "doctors": jDoctors };
	var anaList = filterList(jDoctors, 'dept_id', 'DEP0002');
	var anaesthetists = { "doctors": anaList };
	var discauths = { "discount_authorizer": jDiscountAuthorizers };

	if (document.getElementById("orderDialogAddDialog") != null) {
		addOrderDialog = new Insta.AddOrderDialog('btnAddItem', rateplanwiseitems, null, onAddCharge,
				doctors, anaesthetists, gVisitType, bedType, gOrgId, "", "",
				estimateDate, estimateTime, 'A',fixedOtCharges, discauths, forceSubGroupSelection, null, anaeTypes);
		addOrderDialog.allowQtyEdit = true;
	}

	if(empty(estiamteNo)) {
		setFocus();
		loadRatePlans();
		reInitializeAc();
		CategoryList();
		RatePlanList();
		document.getElementById('pd_primary_planButton').disabled = true;
		document.getElementById('direct_estimate').click();
		document.getElementById('new_patient').click();
		document.getElementById('directestimate_ipvisit').click();
		visitTypeChange(document.getElementById('directestimate_ipvisit'));

	}/* else {
		var ajaxResponse = getDoctorAndOtDoctorCharges(gVisitType,gOrgId);
		loadDoctorAndOtDoctorCharges(ajaxResponse);
	}*/
	resetTotals();
}

var psAc = null;
function reInitializeAc() {

	if (!empty(psAc)) {
		psAc.destroy();
		psAc = null;
	}
	psAc = Insta.initMRNoAcSearch(contextPath, "mrno", "mrnoAcContainer", getStatus(), function (type, args) {
		onSelectPatient();
	}, function (type, args) {
		clearRegisteredPatientDetails();
	});
}

function getStatus() {
	var status = '';
	if (document.mainform.ps_status) {
		var els = document.mainform.ps_status;
		if (els.checked && !els.disabled)
			status = els.value;
	}
	status = (status == '' ? 'all' : status);
	return status;
}

function onSelectPatient() {
	var mrno = document.mainform.mrno.value;
	var ajaxobj1 = newXMLHttpRequest();
	var url = '../../pages/registration/regUtils.do?_method=getPatientDetailsJSON&mrno=' + mrno;
	getResponseHandlerText(ajaxobj1, patientDetailsResponseHandler, url.toString());
}

function patientDetailsResponseHandler(responseText) {
	eval("patientInfo =" + responseText);
	patient = patientInfo.patient;
	loadPatientResponseDetails(patientInfo, patient);
	if(patient.insurance_co_name != undefined && patient.insurance_co_name != null && patient.insurance_co_name != '' ) {
		var insuranceObj = document.getElementById("primary_sponsor");
		if(insuranceObj != null)
			handleInsuranceSelect(insuranceObj);
		document.getElementById("primary_sponsor").checked = true;
		loadInsuranceResponseDetails(patientInfo, patient);
	} else {
		loadNonInsurancePatientDetails(patient);
	}
}

function loadNonInsurancePatientDetails(patient) {
	clearInsuranceDetails();
	document.getElementById('direct_estimate').click();
	var form = document.mainform;
	if (patient != null) {
		var visitType = patient.visit_type
		if(visitType == 'i') {
			document.getElementById('directestimate_ipvisit').click();
			onChangeOpVisitType(document.getElementById('directestimate_ipvisit'));
		}else {
			document.getElementById('directestimate_opvisit').click();
			onChangeOpVisitType(document.getElementById('directestimate_opvisit'));
		}
		setSelectedIndex(form.rate_plan_op, patient.org_id);
		onChangeDirectRatePlan(form.rate_plan_op);
		if(!empty(visitType)) {
			var bedType = patient.bill_bed_type;
			if(!empty(bedType)) {
				setSelectedIndex(form.bed_type_op, patient.bill_bed_type);
			}else {
				document.getElementById('bed_type_op').value = 'GENERAL';
			}
			onBedTypeChange(form.bed_type_op);
		}
		disableAllInsuranceActions();
		enableInsuranceAction(document.getElementById('directestimate'));
	}
}

var gVisitId = null;
var gMrNo = null;
var gPreviousPrimarySponsorIndex = "";
var gPreviousPrimaryInsCompany = null;
var gPreviousPrimaryTpa = null;
var gPreviousPlan = null;
var gPreviousPlanType = null;
var gPreviousPatientCategoryId = null;
var gPreviousRatePlan = null;
var gPatientPolciyNos = null;
var patient = null;
var gPreviousPrimaryTpa = null;
var gPatientCategoryRatePlan = null;
var gPreviousPlan = null;
var gPreviousPlanType = null;
var gPreviousPrimaryInsCompany = null;
var gPreviousPrimarySponsorIndex = "";

function loadInsuranceResponseDetails(patientInfo, patient) {
	var form = document.mainform;
	var insCompObj = document.getElementById("primary_insurance_co");
	var tpaObj = document.getElementById("primary_sponsor_id");
	var planTypeObj = document.getElementById("primary_plan_type");
	var planObj = document.getElementById("primary_plan_id");
	var gPatientPolciyNos = patientInfo.policyNos;
	var primaryPlanDetais = gPatientPolciyNos[0];

	var visitType = patient.visit_type

	if(visitType == 'i') {
		document.getElementById('insurance_ipvisit').checked = true;
		onChangeIpVisitType(document.getElementById('insurance_ipvisit'));
	}else {
		document.getElementById('insurance_opvisit').checked = true;
		onChangeIpVisitType(document.getElementById('insurance_opvisit'));
	}
	setSelectedIndex(form.patient_category_id, patient.patient_category_id);
	gPatientCategoryChanged = true;
	onChangeCategory();

	if (gPatientPolciyNos.length == 2 ) {

		var primaryPlanDetais = gPatientPolciyNos[0];

		gPreviousPrimaryInsCompany = primaryPlanDetais.insurance_co;
		gPreviousPrimaryTpa = primaryPlanDetais.sponsor_id;
		gPreviousPlan = primaryPlanDetais.plan_id;
		gPreviousPlanType = primaryPlanDetais.plan_type_id;
		gPreviousPrimarySponsorIndex = 'I';

		if (insCompObj != null && gPreviousPrimaryInsCompany != null && gPreviousPrimaryInsCompany != '') {
			setSelectedIndex(form.primary_insurance_co, gPreviousPrimaryInsCompany);
			insuPrimaryViewDoc(insCompObj);
			loadTpaList('P');
		}
		if(tpaObj != null && gPreviousPrimaryTpa != null && gPreviousPrimaryTpa != '') {
			setSelectedIndex(form.primary_sponsor_id, gPreviousPrimaryTpa);
		}
		if(planTypeObj != null && gPreviousPlanType != null && gPreviousPlanType != '') {
			setSelectedIndex(form.primary_plan_type, gPreviousPlanType);
			insuCatChange('P');

		}
		if(planObj !=null && gPreviousPlan != null && gPreviousPlan != '') {
			setSelectedIndex(form.primary_plan_id, gPreviousPlan);
			onPolicyChange('P');
		}

	} else if (gPatientPolciyNos.length == 1) {

		 if ((!empty(patient.sec_corporate_sponsor_id) || !empty(patient.sec_national_sponsor_id))
						|| (empty(patient.sec_corporate_sponsor_id) && empty(patient.sec_national_sponsor_id))) {

			var primaryPlanDetais = gPatientPolciyNos[0];

			gPreviousPrimaryInsCompany = primaryPlanDetais.insurance_co;
			gPreviousPrimaryTpa = primaryPlanDetais.sponsor_id;
			gPreviousPlan = primaryPlanDetais.plan_id;
			gPreviousPlanType = primaryPlanDetais.plan_type_id;
			gPreviousPrimarySponsorIndex = 'I';

			if (insCompObj != null && gPreviousPrimaryInsCompany != null && gPreviousPrimaryInsCompany != '') {
				setSelectedIndex(form.primary_insurance_co, gPreviousPrimaryInsCompany);
				insuPrimaryViewDoc(insCompObj);
				loadTpaList('P');
			}
			if(tpaObj != null && gPreviousPrimaryTpa != null && gPreviousPrimaryTpa != '') {
				setSelectedIndex(form.primary_sponsor_id, gPreviousPrimaryTpa);
			}
			if(planTypeObj != null && gPreviousPlanType != null && gPreviousPlanType != '') {
				setSelectedIndex(form.primary_plan_type, gPreviousPlanType);
				insuCatChange('P');
			}
			if(planObj !=null && gPreviousPlan != null && gPreviousPlan != '') {
				setSelectedIndex(form.primary_plan_id, gPreviousPlan);
				onPolicyChange('P');
			}
		}
	}
	setSelectedIndex(form.organization, patient.org_id);
	ratePlanChange();
	if(!empty(visitType)) {
		var bedType = patient.bill_bed_type;
			if(!empty(bedType)) {
				setSelectedIndex(form.bed_type_ip, patient.bill_bed_type);
			}else {
				document.getElementById('bed_type_ip').value = 'GENERAL';
			}
		onBedTypeChange(form.bed_type_ip);
	}
}

function loadPatientResponseDetails(patientInfo, patient) {
	var form = document.mainform;

	document.getElementById('visitId').textContent = patient.patient_id;
	document.getElementById('gender').textContent = patient.patient_gender == 'M' ? 'Male' : patient.patient_gender == 'F' ? 'Female' :
		patient.patient_gender == 'O' ? 'Others' : '';
	document.mainform.i_patient_gender.value = patient.patient_gender;
	document.getElementById('age').textContent = patient.age+" "+patient.agein;
	document.mainform.i_patient_age.value = patient.age;
	document.mainform.i_patient_age_in.value = patient.agein;
	document.getElementById('mobile').textContent = patient.patient_phone;
	document.mainform.i_patient_mobile.value = patient.patient_phone;
	document.getElementById('fullname').textContent = patient.full_name;
	var patFullName = patient.patient_name+" ";
	if(!empty(patient.middle_name))
		patFullName +=" "+patient.middle_name;
	if(!empty(patient.last_name))
		patFullName +=" "+patient.last_name;
	document.mainform.i_patient_full_name.value = patFullName;
	document.mainform.i_salutation_id.value = patient.salutation_id;
}

function setFocus() {
	var regPatRadio = document.getElementById('registered_patient');
	if(regPatRadio.checked) {
		document.getElementById("mrno").focus();
	}else {
		document.getElementById("salutation").focus();
	}
}

String.prototype.startsWith = function (str){
   	return this.slice(0, str.length) == str;
};

function setFlagStyle(i) {
	var row = getChargeRow(i);
	var flagImgs = row.cells[HEAD_COL].getElementsByTagName("img");
	var trashImgs = row.cells[TRASH_COL].getElementsByTagName("img");
	var chargeId = getIndexedValue("chargeId", i);
	var added = (chargeId.substring(0,1) == "_");
	var cancelled = getIndexedValue("delCharge", i) == 'true';
	var edited = getIndexedValue("edited", i) == 'true';

	var cls;
	if (added) {
		cls = 'added';
	} else if (edited || cancelled) {
		cls = 'edited';
	} else {
		cls = '';
	}

	var flagSrc;
	if (cancelled) {
		flagSrc = cpath + '/images/red_flag.gif';
	} else {
		flagSrc = cpath + '/images/empty_flag.gif';
	}
	var trashSrc;
	if (cancelled) {
		trashSrc = cpath + '/icons/Delete1.png';
	} else {
		trashSrc = cpath + '/icons/Delete.png';
	}
	row.className = cls;

	if (flagImgs && flagImgs[0])
		flagImgs[0].src = flagSrc;

	if (trashImgs && trashImgs[0])
		trashImgs[0].src = trashSrc;
}

function isDeletable(i) {
	if (getIndexedValue("hasActivity", i) == 'true')
		return false;
	return true;
}

function isRateEditable(i) {
	if (getIndexedValue("delCharge", i) == 'true')
		return false;
	return true;
}

function isQtyEditable(i) {
	if (getIndexedValue("hasActivity", i) == 'true')
		return false;
	if (getIndexedValue("delCharge", i) == 'true')
		return false;
	return true;
}

function isItemRemarksEditable(i) {
	if (getIndexedValue("delCharge", i) == 'true')
		return false;
	return true;
}

function setHiddenValue(index, name, value) {
	var el = getIndexedFormElement(mainform, name, index);
	if (el) {
		el.value = value;
	}
}

function onAddCharge(order) {
	if (order.itemType == 'Bed' || order.itemType == 'Equipment') {
		if (order.remarks == undefined || order.remarks == '') {
			order.remarks = order.fromDate + ' to ' + order.toDate;
		}
	}
	for (var i=0; i<order.rateDetails.length; i++) {
		var charge = order.rateDetails[i];
		addToTable(charge.chargeGroup, charge.chargeHead, charge.actDepartmentId, charge.actDescriptionId,
				charge.actDescription, charge.actRate, charge.actQuantity, charge.actUnit, "", order.remarks,
				charge.discount,charge.actUnit, charge.insuranceCategoryId,charge.actRemarks,charge.amount,charge.insuranceClaimAmount);
	}
	return true;
}

/*
 * Add ONE charge row to the table, always adds at the end of the list of charges,
 * and returns the ID of the row that was added.
 */
function addToTable(group, head, dept, descId, desc, rate, qty, units, refId, remarks, discount, units, insuranceCategoryId,actRemarks,amount,insuranceClaimAmount) {

	var headText = findInList(jChargeHeads, "CHARGEHEAD_ID", head).CHARGEHEAD_NAME;
	var insPayable = findInList(jChargeHeads, "CHARGEHEAD_ID", head).INSURANCE_PAYABLE;
	var insClaimTaxable = findInList(jChargeHeads, "CHARGEHEAD_ID", head).CLAIM_SERVICE_TAX_APPLICABLE;
	var serviceChrgApplicable = findInList(jChargeHeads, "CHARGEHEAD_ID", head).SERVICE_CHARGE_APPLICABLE;
	var curDate = (gServerNow != null) ? gServerNow : new Date();

	var rateStr = formatAmountValue(rate);
	var discStr = formatAmountValue(discount);
	var amtStr = formatAmountValue((rate * qty) - (discount));
	if (refId == null) refId = "";
	var planId = null;
	var visitType = null;
	if (head == 'MISOTC' || head == 'BIDIS') {
		// need to calculate the insurance claim amount ourselves
		var chargeHead = findInList(jChargeHeads, "CHARGEHEAD_ID", head);
		insuranceCategoryId = chargeHead.INSURANCE_CATEGORY_ID;

		var amtPaise = getPaise(rate)*qty - getPaise(discount);
		insuranceClaimAmount = 0;//getPaiseReverse(
				//getClaimAmount(head, amtPaise,getPaise(discount), insuranceCategoryId, false));

	} else if (head == 'CSTAX') {
		if (!empty(estimateNo) && document.getElementById('isTpaEstimate').value == 'N') {
			showMessage("js.registration.quickestimate.claimservicetax.notapplicable");
			return true;
		} else {
			if(!empty(document.getElementById('primary_plan_id').value)) {
				var chargeHead = findInList(jChargeHeads, "CHARGEHEAD_ID", head);
				insuranceCategoryId = chargeHead.INSURANCE_CATEGORY_ID;
				var amtPaise = getPaise(rate)*qty - getPaise(discount);
				insuranceClaimAmount = amtPaise;
				desc = 'Service tax on claim';
			} else {
				showMessage("js.registration.quickestimate.claimservicetax.notapplicable");
				return true;
			}
		}

	} else if (head == 'BSTAX') {
		var chargeHead = findInList(jChargeHeads, "CHARGEHEAD_ID", head);
		insuranceCategoryId = chargeHead.INSURANCE_CATEGORY_ID;
		var amtPaise = getPaise(rate)*qty - getPaise(discount);
		insuranceClaimAmount = amtPaise;
		desc = 'Service charge on total amount';
	}

	if(empty(estimateNo)) {
		var insuranceRadioObj = document.getElementById('primary_sponsor');
		planId = insuranceRadioObj.checked ? document.getElementById('primary_plan_id').value : '';
		if(insuranceRadioObj.checked) {
			if(document.getElementById('insurance_ipvisit').checked)
				visitType = document.getElementById('insurance_ipvisit').value;
			else
				visitType = document.getElementById('insurance_opvisit').value;
		}else {
			if(document.getElementById('directestimate_ipvisit').checked)
				visitType = document.getElementById('directestimate_ipvisit').value;
			else
				visitType = document.getElementById('directestimate_opvisit').value;
		}

	} else {
		planId = gPlanId;
		visitType = gVisitType;
	}
	visitType = empty(visitType) ? 'i' : visitType;

	var claimAmt = amtStr;
	if (remarks == undefined) remarks = "";

	var id = getNumCharges();
   	var table = document.getElementById("chargesTable");
	var templateRow = table.rows[getTemplateRow()];
	var row = templateRow.cloneNode(true);
	row.style.display = '';
	table.tBodies[0].insertBefore(row, templateRow);
   	row.id="chRow"+id;

	var cell = null;
	var inp = null;

	setNodeText(row.cells[HEAD_COL], headText);
	setNodeText(row.cells[DESC_COL], desc, 25);
	setNodeText(row.cells[ACT_REMARKS_COL], actRemarks, 16);
	setNodeText(row.cells[REMARKS_COL], remarks, 16);
	setNodeText(row.cells[RATE_COL], rateStr);
	setNodeText(row.cells[QTY_COL], qty.toString());
	setNodeText(row.cells[UNITS_COL], units);
	setNodeText(row.cells[DISCOUNT_COL], discStr);
	setNodeText(row.cells[AMT_COL], amtStr);

	setHiddenValue(id, "chargeHeadName", headText);
	setHiddenValue(id, "chargeGroupId", group);
	setHiddenValue(id, "chargeHeadId", head);
	setHiddenValue(id, "chargeId", "_" + id);
	setHiddenValue(id, "chargeRef", "_" + refId);
	setHiddenValue(id, "departmentId", !empty(dept) ? dept : '');
	setHiddenValue(id, "hasActivity", "false");
	setHiddenValue(id, "description", desc);
	setHiddenValue(id, "descriptionId", descId);
	setHiddenValue(id, "remarks", remarks);
	setHiddenValue(id, "act_remarks", !empty(actRemarks) ? actRemarks : '');
	setHiddenValue(id, "originalRate", rate.toString());
	setHiddenValue(id, "rate", rate.toString());
	setHiddenValue(id, "qty", qty.toString());
	setHiddenValue(id, "units", units);
	setHiddenValue(id, "discount", discStr);
	setHiddenValue(id, "amt", amtStr.toString());
	setHiddenValue(id, "new", "Y");
	setHiddenValue(id, "serviceChrgApplicable", serviceChrgApplicable);
	if(!empty(estimateNo)) {
		if(document.getElementById('isTpaEstimate').value == 'N')
			setHiddenValue(id, "insClaimTaxable", "N");
		else
			setHiddenValue(id, "insClaimTaxable", insClaimTaxable);
	} else {
		if(!empty(document.getElementById('primary_plan_id').value)) {
			setHiddenValue(id, "insClaimTaxable", insClaimTaxable);
		} else {
			setHiddenValue(id, "insClaimTaxable", "N");
		}
	}
	var claimAmt = 0;
	var patAmt = 0;
	var remainingAmt = (!empty(head) && (head == 'MISOTC')) ? amtStr : amount;
	if(!empty(planId)) {
		if (insPayable != 'Y') {
				claimAmt = 0;
				patAmt = remainingAmt;
		} else {
			if(remainingAmt == undefined) remainingAmt = 0;
			var discAmt = formatAmountPaise(discStr);
			claimAmt = calculateClaimAmount(remainingAmt,discount,insuranceCategoryId,false,
				visitType,"",planId);
			remainingAmt = remainingAmt - claimAmt;
			patAmt = remainingAmt;
		}
	} else {
		patAmt = remainingAmt;
	}

	if(!empty(head) && (head == 'BIDIS' || head == 'CSTAX' || head == 'BSTAX')) {
		setNodeText(row.cells[CLAIM_COL], formatAmountPaise(getPaise(insuranceClaimAmount)));
		setNodeText(row.cells[PATIENT_AMT_COL], formatAmountPaise(getPaise(patAmt)));
		setHiddenValue(id, "sponsor_amt", formatAmountPaise(getPaise(insuranceClaimAmount)));
		setHiddenValue(id, "patient_amt", formatAmountPaise(getPaise(patAmt)));
	} else {
		setNodeText(row.cells[CLAIM_COL], formatAmountPaise(getPaise(claimAmt)));
		setNodeText(row.cells[PATIENT_AMT_COL], formatAmountPaise(getPaise(patAmt)));
		setHiddenValue(id, "sponsor_amt", formatAmountPaise(getPaise(claimAmt)));
		setHiddenValue(id, "patient_amt", formatAmountPaise(getPaise(patAmt)));
	}

	row.className = "newRow";
	chargesAdded++;
	resetTotals();
	return id;
}

function getClaimAmount(head, amtPaise, newDiscPaise,  insuranceCategoryId, firstOfCategory) {
	var insPayable = findInList(jChargeHeads, "CHARGEHEAD_ID", head).INSURANCE_PAYABLE;
	if (insPayable != 'Y')
		return 0;
	var insuranceRadio = document.getElementById('primary_sponsor');
	var visitType = gVisitType;
	if(empty(estimateNo)) {
		if(insuranceRadio.checked) {
			if(document.getElementById('insurance_ipvisit').checked) {
				visitType = "i";
			} else {
				visitType = "o";
			}
		} else {
			if(document.getElementById('directestimate_ipvisit').checked) {
				visitType = "i";
			} else {
				visitType = "o";
			}
		}
	} else {
		visitType = gVisitType;
	}
	var ipOpApplicable = (visitType == 'i') ? "ip_applicable" : "op_applicable";

	var planDetails = null;
	if (jPolicyNameList!=null && jPolicyNameList.length>0 ) {
		planDetails = findInList3(jPolicyNameList, "insurance_category_id",
				insuranceCategoryId, "patient_type", visitType, ipOpApplicable, "Y" );
	}

	if (planDetails == null) {
		// no full amount is claimable
		return amtPaise;
	}

	var patientCatDednPaise = getPaise(planDetails.patient_amount_per_category);
	var patientDednPaise = getPaise(planDetails.patient_amount);
	var patientPer = planDetails.insurance_payable == 'Y'?planDetails.patient_percent:100;
	var patientCapPaise = getPaise(planDetails.patient_amount_cap);
	var is_copay_pc_on_post_discnt_amt = planDetails.is_copay_pc_on_post_discnt_amt;
	var chgPercAmt = is_copay_pc_on_post_discnt_amt == 'N'?  amtPaise+newDiscPaise : amtPaise;

	var patientPortionPaise =  patientDednPaise+ (chgPercAmt*patientPer/100);
	if(firstOfCategory == true){
		patientPortionPaise += patientCatDednPaise;
	}

	if (head != 'BIDIS' && patientCapPaise != null && patientCapPaise != 0) {
		if (patientPortionPaise > patientCapPaise)
			patientPortionPaise = patientCapPaise;
	}

	var claimAmtPaise = amtPaise - patientPortionPaise;

	return claimAmtPaise;
}

function getNumCharges() {
	// header, add row, hidden template row: totally 3 extra
	return document.getElementById("chargesTable").rows.length-3;
}

function getFirstItemRow() {
	// index of the first charge item: 0 is header, 1 is first charge item.
	return 1;
}

function getTemplateRow() {
	// gets the hidden template row index: this follows header row + num charges.
	return getNumCharges() + 1;
}

function getChargeRow(i) {
	i = parseInt(i);
	var table = document.getElementById("chargesTable");
	return table.rows[i + getFirstItemRow()];
}

function getRowChargeIndex(row) {
	return row.rowIndex - getFirstItemRow();
}

function getThisRow(node) {
	return findAncestor(node, "TR");
}

function getIndexedPaise(name, index) {
	return getElementPaise(getIndexedFormElement(mainform, name, index));
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

/*
 * Re-calculate all the totals: discount, amount, update amount due etc.
 * These are all global varibles to be referred elsewhere when required.
 */
function resetTotals() {
	var totalClaimAmt = 0;
		totAmtPaise = 0;
	var totalPatAmt = 0;
	var serviceChargeableTotalPaise = 0;
	var claimableTotalPaise = 0;
	var totalDiscountPaise = 0;

	for (var i=0;i<getNumCharges();i++) {
		var delCharge = getIndexedFormElement(mainform, "delCharge", i);
		if ("true" == delCharge.value)
			continue;

		var chargeHead = getIndexedValue("chargeHeadId", i);
		if (chargeHead == 'CSTAX' || chargeHead == 'BSTAX') {
			// we'll deal with it later.
			continue;
		}

		var chargeHead = getIndexedFormElement(mainform, 'chargeHeadId', i);
		if (getIndexedFormElement(mainform, "insClaimTaxable", i) != null) {
			if (getIndexedFormElement(mainform, "insClaimTaxable",i).value == 'Y')
				claimableTotalPaise += getIndexedPaise("sponsor_amt",i);
		}

		if (getIndexedFormElement(mainform, "serviceChrgApplicable", i) != null) {
			if (getIndexedFormElement(mainform, "serviceChrgApplicable",i).value == 'Y')
				serviceChargeableTotalPaise += getIndexedPaise("amt",i);
		}

		totAmtPaise += getIndexedPaise("amt",i);
		totalClaimAmt += getIndexedPaise("sponsor_amt",i);
		totalPatAmt += getIndexedPaise("patient_amt",i);
		totalDiscountPaise += getIndexedPaise("discount",i);
	}

	var serChargeRowId = getChargeHeadRowId('BSTAX');
	if(serChargeRowId != null) {
		var servAmtPaise = getIndexedPaise("amt", serChargeRowId);
		var serChrgInsPayable = 'N';
		var newServAmtPaise = Math.round(serviceChargePer * serviceChargeableTotalPaise / 100);
		if (newServAmtPaise != servAmtPaise) {
			// reset claim amounts
		//	claimAmtEdited = claimAmtEdited && (newServAmtPaise != servAmtPaise);
			// update the row
			var row = getChargeRow(serChargeRowId);
			var serchrg = formatAmountPaise(newServAmtPaise);
			var remarks = "" + serviceChargePer + "% on " + formatAmountPaise(serviceChargeableTotalPaise);

			var chargeHead = findInList(jChargeHeads, "CHARGEHEAD_ID", 'BSTAX');
			serChrgInsPayable = chargeHead.INSURANCE_PAYABLE;

			setEditedAmounts(serChargeRowId, row, serchrg, 1, 0, serchrg, (serChrgInsPayable == 'Y'?serchrg:0), serchrg);
			setNodeText(row.cells[ACT_REMARKS_COL], remarks, 16);
			setIndexedValue("act_remarks", serChargeRowId, remarks);
			servAmtPaise = newServAmtPaise;
		}
		totAmtPaise += servAmtPaise;
		if (serChrgInsPayable == 'Y')
			totalClaimAmt += servAmtPaise;
	}

	var insClaimRowId = getChargeHeadRowId('CSTAX');
	if (insClaimRowId != null) {
		var taxInPaise = getIndexedPaise("sponsor_amt", insClaimRowId);
		var newTaxInPaise = Math.round(claimServiceTaxPer * claimableTotalPaise / 100);

		if (newTaxInPaise != taxInPaise) {
			// reset claim amounts
			//claimAmtEdited = claimAmtEdited && (newTaxInPaise != taxInPaise);
			// update the row
			var row = getChargeRow(insClaimRowId);
			var insTax = formatAmountPaise(newTaxInPaise);
			var remarks = "" + claimServiceTaxPer + "% on " + formatAmountPaise(claimableTotalPaise);
			setEditedAmounts(insClaimRowId, row, insTax, 1, 0, insTax, insTax, 0);
			setNodeText(row.cells[ACT_REMARKS_COL], remarks, 16);
			setIndexedValue("act_remarks", insClaimRowId, remarks);
			taxInPaise = newTaxInPaise;
		}
		totalClaimAmt += taxInPaise
		totAmtPaise += taxInPaise;
	}
	document.getElementById('lblNetAmt').textContent = formatAmountPaise(totAmtPaise);
	document.getElementById("lblTotAmt").textContent = formatAmountPaise(totAmtPaise+totalDiscountPaise);
	document.getElementById("lbldiscount").textContent = formatAmountPaise(totalDiscountPaise);
	document.getElementById("sponsorTotAmt").textContent = formatAmountPaise(totalClaimAmt);
	document.getElementById("patientTotAmt").textContent = formatAmountPaise(totAmtPaise-totalClaimAmt);
}

function getChargeHeadRowId(chargeHead) {
	var headRowId = null;
	for (var i=0;i<getNumCharges();i++) {
		var delCharge = getIndexedFormElement(mainform, "delCharge", i);

		if (delCharge && "true" == delCharge.value)
			continue;

		if (getIndexedFormElement(mainform, "chargeHeadId", i).value == chargeHead) {
			headRowId = i;
			break;
		}
	}
	return headRowId;
}

function setEditedAmounts(i, row, rate, qty, disc, amt, claim, deduction) {
	var table = YAHOO.util.Dom.getAncestorByTagName(row, 'table');
	setIndexedValue("rate", i, formatAmountValue(rate));
	setNodeText(row.cells[RATE_COL], formatAmountValue(rate));
	setIndexedValue("qty",i, formatAmountValue(qty, true));
	setNodeText(row.cells[QTY_COL], formatAmountValue(qty, true));
	setIndexedValue("discount",i, formatAmountValue(disc));
	//setIndexedValue("overall_discount_amt", i, formatAmountValue(disc));
	setNodeText(row.cells[DISCOUNT_COL], formatAmountValue(disc), 10, "");
	setIndexedValue("amt",i, formatAmountValue(amt));
	setNodeText(row.cells[AMT_COL], formatAmountValue(amt));


	// hidden and DB value is always original claim amount
	// but display is net claim (ie, after adding return Claim Amt).
	var amtPaise = getPaise(amt);
	var claimPaise = getPaise(claim);

	setNodeText(row.cells[CLAIM_COL], formatAmountPaise(claimPaise));
	setNodeText(row.cells[PATIENT_AMT_COL], formatAmountPaise(
			(amtPaise) - (claimPaise) ));
	setIndexedValue("sponsor_amt", i, formatAmountValue(claim));
	setIndexedValue("patient_amt", i, formatAmountPaise(
				(amtPaise) - (claimPaise) ));

/*	var chargeHead = getIndexedValue("chargeHeadId", i);
	if (chargeHead == 'BIDIS' || chargeHead == 'ROF' || chargeHead == 'CSTAX' || chargeHead == 'BSTAX') {
		var dynaPkgId = (document.mainform.dynaPkgId != null) ? (document.mainform.dynaPkgId.value) : 0;
		if (!empty(dynaPkgId) && dynaPkgId != 0)
			setIndexedValue("chargeExcluded", i, "Y");
		else
			setIndexedValue("chargeExcluded", i, "N");
	}*/

	setIndexedValue("edited", i, 'true');
//	setRowStyle(i);
}

function doSave() {
	if(document.getElementById("chargesTable").rows.length <= 3)
		return false;
	document.mainform.buttonAction.value = 'save';
	document.mainform.print.value = 'N';
	document.mainform.submit();
}

function doSaveAndPrint(printObj) {
	var insuranceRadioObj = document.getElementById('primary_sponsor');
	var registeredRadioObj = document.getElementById('registered_patient');
	if(empty(estiamteNo)) {
		if(!registeredRadioObj.checked) {
			if(document.mainform.salutation.value == ""){
			    showMessage("js.registration.patient.title.required");
			    document.mainform.salutation.focus();
			    return false;
	    	}

		    if(document.mainform.person_name.value == "..FirstName.." || document.mainform.person_name.value == ""){
			    showMessage("js.registration.patient.first.name.required");
			    document.mainform.person_name.focus();
			    return false;
		    }

		    var patientPhone = document.getElementById('mobile_no').value;
			if (!empty(patientPhone) &&
				!validatePhoneNo(patientPhone, getString("js.registration.patient.invalid.phoneno"))) {
		  		document.mainform.mobile_no.focus();
		  		return false;
		  	}
		 }

		var firstname = document.mainform.person_name.value;
		var middlename = document.mainform.middle_name.value;
		var lastname = document.mainform.last_name.value;
		var personFullName = firstname;
		if(!empty(middlename) && middlename != "..MiddleName.." )
			personFullName = personFullName+" "+middlename;
		if(!empty(lastname) && lastname != '..LastName..')
			personFullName = personFullName+" "+lastname;
		document.getElementById('person_full_name').value = personFullName;
	}

	if(document.getElementById("chargesTable").rows.length <= 3) {
		showMessage('js.registration.patient.quickestimate.please.add.one.or.more.items.to.save.your.estimate');
		return false;
	}

	if(printObj == 'P')
		document.mainform.isPrint.value = 'P';
	else
		document.mainform.isPrint.value = '';

	document.mainform.submit();
}

function estimateBillPrint() {
	var estimateNo = document.mainform.estimate_no.value;
	if(estimateNo == null || estimateNo == '')
		return false;
	var printerId = document.mainform.printType.value;
	window.open("../../pages/registration/QuickEstimate.do?_method=estimateBillPrint&estimate_no="
			+estimateNo+"&printerType="+printerId);
}

function cancelCharge(obj) {

	var row = getThisRow(obj);
	var id = getRowChargeIndex(row);
	if (!isDeletable(id))
		return false;

	var oldDeleted =  getIndexedValue("delCharge", id);
	var chargeId = getIndexedValue("chargeId", id);
	var isNew = (chargeId.substring(0,1) == '_');

	if (isNew) {
		// just delete the row, don't marke it as deleted
		row.parentNode.removeChild(row);
		chargesAdded--;

	} else {
		var newDeleted;
		if (oldDeleted == 'true'){
			newDeleted = 'false';
		} else {
			newDeleted = 'true';
		}

		setIndexedValue("delCharge", id, newDeleted);
		setIndexedValue("edited", id, 'true');
		setFlagStyle(id);

		// set the same status to all referenced charges
		var numCharges = getNumCharges();
		for (var i=0; i<numCharges; i++) {
			var ref = getIndexedValue("chargeRef", i);
			if (ref == chargeId) {
				setIndexedValue("delCharge", i, newDeleted);
				setIndexedValue("edited", i, 'true');
				setFlagStyle(i);
			}
		}
	}

	resetTotals();
	return false;
}

function initEditChargeDialog() {
	var dialogDiv = document.getElementById("editChargeDialog");
	dialogDiv.style.display = 'block';
	editChargeDialog = new YAHOO.widget.Dialog("editChargeDialog",{
			width:"700px",
			text: "Edit Charge",
			close: true,
			context :["chargesTable", "tl", "tl"],
			visible:false,
			modal:true,
			constraintoviewport:true
			});
	var escKeyListener = new YAHOO.util.KeyListener(document, { keys:27 },
	                                              { fn:onEditCancel,
	                                                scope:editChargeDialog,
	                                                correctScope:true } );
	editChargeDialog.cfg.queueProperty("keylisteners", escKeyListener);
	editChargeDialog.render();
}

function showEditChargeDialog(obj) {
	editform.eRate.disabled = false;
	editform.eQty.disabled = false;
	var row = getThisRow(obj);
	var id = getRowChargeIndex(row);
	var chargeHead = getIndexedValue("chargeHeadId", id)
	YAHOO.util.Dom.addClass(row, 'rowUnderEdit');
	editform.editRowId.value = id;
	if(chargeHead == 'BIDIS' || chargeHead == 'CSTAX' || chargeHead == 'BSTAX') {
		editform.eRate.disabled = true;
		editform.eQty.disabled = true;
	}

	document.getElementById("eChargeHead").textContent = getIndexedValue("chargeHeadName", id);
	document.getElementById("eDescription").textContent = getIndexedValue("description", id);

	editform.eRate.value = getIndexedValue("rate", id);
	editform.eQty.value = getIndexedValue("qty", id);
	editform.eDiscount.value = getIndexedValue("discount", id);
	editform.eAmt.value = getIndexedValue("amt", id);
	editform.eSponsorAmt.value = getIndexedValue("sponsor_amt", id);
	editform.ePatAmt.value = getIndexedValue("patient_amt", id);
	editChargeDialog.cfg.setProperty("context", [row.cells[EDIT_COL], "tr", "bl"], false);
	editChargeDialog.show();
	return false;
}



function recalcEditChargeAmount(id) {
	if(empty(id))
		id = editform.editRowId.value;

/*	var rate = editform.eRate.value;//editform.eRate;
	var qtyObj = editform.eQty;
	var amt = getIndexedValue("amt", id);//editform.eAmt;
	var disc = editform.eDiscount.value;//editform.eDiscount;
	var sponsorAmt = editform.eSponsorAmt.value;//editform.eSponsorAmt;
	var patAmt = getIndexedValue("patient_amt", id);//editform.ePatAmt;
	var hiddenQty = getIndexedValue("qty", id);

	if (rate == "") { rate = 0;}
	if (amt == "")  { amt = 0;}
	if (qtyObj.value == "") { qtyObj.value = 0; }
	if (disc == "") {disc = 0;}
	if (sponsorAmt == "") {sponsorAmt = 0;}
	if (patAmt == "") {patAmt = 0;}

	if (!isDecimal(rate) || !isDecimal(qtyObj.value)) {
		return;
	}

	var changedRate = getPaise(rate);
	var changedQty = getAmount(qtyObj.value);
	var changedDisc = getPaise(gPerItemDiscount*qtyObj.value);
	var changedSponsorAmt =  getPaise(sponsorAmt/hiddenQty);
	var changedPatAmt     = getPaise(patAmt/hiddenQty);

	var newAmtPaise = changedRate*changedQty;
	var newDiscPaise = changedDisc;
	var newSponsorAmt = changedSponsorAmt*changedQty;
	var newPatAmt     = (newAmtPaise-newDiscPaise-newSponsorAmt);
	// set the new amount
	editform.eAmt.value = formatAmountPaise(newAmtPaise-newDiscPaise);
	editform.eDiscount.value = formatAmountPaise(newDiscPaise);
	editform.eSponsorAmt.value = formatAmountPaise(newSponsorAmt);
	editform.ePatAmt.value = formatAmountPaise(newPatAmt);*/

	var oldAmountPaise = getPaise(editform.eAmt.value);
	var rateObj = editform.eRate;
	var qtyObj = editform.eQty;
//	var discObj = (editform.discountType.checked) ? editform.eDiscount : editform.overallDiscRs;
	var discObj = editform.eDiscount

	if (rateObj.value == "") { rateObj.value = 0; }
	if (qtyObj.value == "") { qtyObj.value = 0; }
	if (discObj.value == "") { discObj.value = 0; }

	if (!isSignedAmount(rateObj.value) || !isSignedAmount(qtyObj.value) || !isSignedAmount(discObj.value)) {
		return;
	}

	var changedRate = getPaise(rateObj.value);
	var changedQty = getAmount(qtyObj.value);
	var changedDisc = getPaise(discObj.value);

	var newAmtPaise = changedRate*changedQty - changedDisc;

	// update the claim amount if Insurance bill
	if (!isSignedAmount(editform.eSponsorAmt.value))
		return;

	var chargeHead = getIndexedValue("chargeHeadId", id);
	var insuranceCategoryId = getIndexedValue("insuranceCategoryId", id);
	var firstOfCategory = false;
	var newClaimPaise = getClaimAmount(chargeHead, newAmtPaise,changedDisc,insuranceCategoryId, firstOfCategory);
	var row = getChargeRow(id);
	var newPatientPaise = 0;

	var oldClaimPaise = getPaise(editform.eSponsorAmt.value);
	var isOldClaimValid = newAmtPaise<0 && oldClaimPaise<0 ? ((-newAmtPaise)>=(-oldClaimPaise)) : (newAmtPaise>= oldClaimPaise);
	if(isOldClaimValid) {
		newClaimPaise = oldClaimPaise;
		newPatientPaise = newAmtPaise - oldClaimPaise;
	}else {
		newClaimPaise = oldClaimPaise;
		newPatientPaise = newAmtPaise -  newClaimPaise;
	}
//	var table = YAHOO.util.Dom.getAncestorByTagName(row, 'table');
//	var chargeHeadId = getElementByName(row,"chargeHeadId").value;

	editform.eSponsorAmt.value = formatAmountPaise(newClaimPaise);
	editform.ePatAmt.value = formatAmountPaise(newPatientPaise);


	if (newAmtPaise == 0){
		editform.eSponsorAmt.value = formatAmountPaise(getPaise(0));
		editform.ePatAmt.value = formatAmountPaise(getPaise(0));
	}
	// set the new amount
	editform.eAmt.value = formatAmountPaise(newAmtPaise);

/*	if (hasDynaPackage && !editform.eQtyIncluded.readOnly && getAmount(editform.eQtyIncluded.value) != 0) {
		var amtIncludedObj = editform.eAmtIncluded;
		var qtyIncludedObj = editform.eQtyIncluded;

		var includedQty = getAmount(qtyIncludedObj.value);
		var amtPaiseIncluded = (newAmtPaise * includedQty) / changedQty;
		amtIncludedObj.value = formatAmountPaise(amtPaiseIncluded);
	}*/
}

function onEditSubmit() {
	if (!validateAmount(editform.eRate, getString("js.registration.quickestimate.ratevalidamt")))
		return false;
	if (!validateDecimal(editform.eQty, getString("js.registration.quickestimate.qtyvalidamt"), 2))
		return false;

	var id = editform.editRowId.value;
	var row = getChargeRow(id);
//	recalcEditChargeAmount();

	var rate = editform.eRate.value;
	var amt = editform.eAmt.value;
	var qty = editform.eQty.value;
	var discount = editform.eDiscount.value;;
	var sponsorAmt = editform.eSponsorAmt.value;
	var patientAmt = editform.ePatAmt.value;

	setIndexedValue("rate",id, formatAmountValue(rate));
	setNodeText(row.cells[RATE_COL], formatAmountValue(rate));
	setIndexedValue("qty",id, formatAmountValue(qty, true));
	setNodeText(row.cells[QTY_COL], formatAmountValue(qty, true));
	setIndexedValue("amt",id, formatAmountValue(amt));
	setNodeText(row.cells[AMT_COL], formatAmountValue(amt));
	setIndexedValue("discount",id, formatAmountValue(discount));
	setNodeText(row.cells[DISCOUNT_COL], formatAmountValue(discount));
	setIndexedValue("sponsor_amt",id, formatAmountValue(sponsorAmt));
	setNodeText(row.cells[CLAIM_COL], formatAmountValue(sponsorAmt));
	setIndexedValue("patient_amt",id, formatAmountValue(patientAmt));
	setNodeText(row.cells[PATIENT_AMT_COL], formatAmountValue(patientAmt));

	setIndexedValue("edited", id, 'true');
	setFlagStyle(id);

	editChargeDialog.hide();
	resetTotals();
	YAHOO.util.Dom.removeClass(row, 'rowUnderEdit');
}

function onEditCancel(){
	var id = editform.editRowId.value;
	var row = getChargeRow(id);
	YAHOO.util.Dom.removeClass(row, 'rowUnderEdit');
	editChargeDialog.hide();
}

function showTotalDiscountAmount() {
	var totDiscount = 0;
	for (i=0; i<getNumCharges(); i++){
			var delCharge = getIndexedFormElement(mainform, "delCharge", i);
		if ("true" == delCharge.value)
			continue;

		totDiscount += getIndexedPaise("disc",i);
	}
	document.getElementById("totDiscount").textContent = formatAmountValue(totDiscount/100);
}

/*function for print button to generate total credit bill print */

function getDetailedReport(insuranceId,estimateId) {
	var rowsLength = document.getElementById("chargesTable").rows.length-3;
	if (chargesAdded > 0) {
		showMessage("js.registration.quickestimate.newchargesadded");
		return false;
	}
	if(rowsLength == 0){
		showMessage("js.registration.quickestimate.savecharges.print");
		return false;
	}else{
		window.open("../../pages/Enquiry/insEstimatePrint.do?_method=getEstimatePrint&insuranceId="+insuranceId+"&estimateId="+estimateId);
		return false;
	}
}

function save(){
	var rowsLength = document.getElementById("chargesTable").rows.length-3;
	if(rowsLength == 0){
		showMessage("js.registration.quickestimate.addcharges.save");
		return false;
	}else{
	 document.mainform.action="../../pages/insurance/EstimateAction.do?method=saveEstimationDetails";
	 document.mainform.submit();
	}
}


/// my code starts from here///
function loadRatePlans() {
	var ratePlan = document.getElementById("organization");
	var optn = new Option(getString("js.registration.patient.commonselectbox.defaultText"), "");
	var len = 1;
	ratePlan.options.length = len;
	ratePlan.options[len - 1] = optn;

	var len = 1;
	for (var k = 0; k < orgNamesJSON.length; k++) {
		var org = orgNamesJSON[k];
		if (!empty(org)) {
			var optn = new Option(org.org_name, org.org_id);
			len++;
			ratePlan.options.length = len;
			ratePlan.options[len - 1] = optn;
		}
	}
}
gSelectedRatePlan = "";
gSelectedVisitType = "";
gSelectedBedType  = "";
var isRatePlanChanged = false;
function visitTypeChange(obj) {
	var visitType = obj.value;
	var insuranceRadio = document.getElementById('primary_sponsor');
	gSelectedVisitType = visitType;
}

function changeRatePlan(obj) {
	// clear the order table, since new rates are now applicable
	if (gSelectedRatePlan == obj.value){}
	else {
		gSelectedRatePlan = obj.value;
		isRatePlanChanged = true;
	}
	showGridClearMessage();
	gSelectedRatePlan = obj.value;
	clearQSOrderTable();
	resetTotals();

}

function onChangeDirectRatePlan(obj) {
	// clear the order table, since new rates are now applicable
	if (gSelectedRatePlan == obj.value){}
	else {
		gSelectedRatePlan = obj.value;
		isRatePlanChanged = true;
	}
	showGridClearMessage();
	gSelectedRatePlan = obj.value;
	clearQSOrderTable();
	resetTotals();
}

function onBedTypeChange(obj) {
	gSelectedBedType = !empty(obj.value) ? obj.value : 'GENERAL';
}

var transactionCompleted = true;
function initializeOrderDialog(obj) {
	if (addOrderDialog ) addOrderDialog.setUrgentDisabled(true);
	/*if(!empty(estimateNo)) {
		addOrderDialog.start(obj, false, '');
		return;
	}*/
	var orgId = null;
	var visitType = null;
	var bedtype = null;

	if(empty(estimateNo)) {
		var insuranceRadio = document.getElementById('primary_sponsor');
		if(insuranceRadio.checked) {
			orgId = document.getElementById('organization').value;
			if(document.getElementById('insurance_ipvisit').checked) {
				visitType = document.getElementById("insurance_ipvisit").value;
			}else {
				visitType = document.getElementById("insurance_opvisit").value;
			}
			bedtype = document.getElementById('bed_type_ip').value;
		} else {
			orgId = document.getElementById('rate_plan_op').value;
			if(document.getElementById('directestimate_ipvisit').checked) {
				visitType = document.getElementById("directestimate_ipvisit").value;
			}else {
				visitType = document.getElementById("directestimate_opvisit").value;
			}
			bedtype = document.getElementById('bed_type_op').value;
		}
	} else {
		orgId = gOrgId;
		visitType = gVisitType;
		bedtype = bedType;
		resetOrderDialogRatePlanInsurance(orgId,visitType,bedtype);
	}

	var ajaxResponse = getDoctorAndOtDoctorCharges(visitType,orgId);
	loadDoctorAndOtDoctorCharges(ajaxResponse);

	bedtype = visitType == 'i' ? (empty(bedtype) ? 'GENERAL' : bedtype) : 'GENERAL';

	if(empty(estimateNo) && isRatePlanChanged) {
		resetOrderDialogRatePlanInsurance(orgId,visitType,bedtype);
	}
	addOrderDialog.start(obj, false, '');

	gSelectedBedType = bedtype;
	gSelectedVisitType = visitType;
	gSelectedRatePlan = orgId;
}


function showGridClearMessage() {
	var insuranceRadio = document.getElementById('primary_sponsor');
	var table = document.getElementById('chargesTable');
	var numRows = table.rows.length;
	var lastRowIndex = numRows-2;
	var ratePlan= null;
	if (insuranceRadio.checked) {
		ratePlan = document.mainform.organization.value;
	} else {
		ratePlan = document.mainform.rate_plan_op.value;
	}
	if(isRatePlanChanged && lastRowIndex > 1) {
		showMessage('js.registration.patient.quickestimate.order.grid.clear.msg');
	}
}

function getDoctorAndOtDoctorCharges(visitType,orgId) {
	var response = null;
	var ajaxReqObject = newXMLHttpRequest();
	var url = cpath+"/master/orderItems.do?method=getDoctorAndOtDoctorCharges"
	url = url + "&visit_type=" + visitType;
	url = url + "&org_id=" + orgId;
	url = url + "&includeOtDocCharges=Y";
	ajaxReqObject.open("POST", url.toString(), false);
	ajaxReqObject.send(null);
	if (ajaxReqObject.readyState == 4) {
		if ((ajaxReqObject.status == 200) && (ajaxReqObject.responseText != null)) {
			eval("var ajax_response =" + ajaxReqObject.responseText);
			if(!empty(ajax_response))
				response = ajax_response;
		}
	}

	return response;
}

function loadDoctorAndOtDoctorCharges(ajaxResponse) {
	var docCharge = document.orderDialogForm.doctorCharge;
	var otDocCharge = document.orderDialogForm.otDoctorCharge;
	var docCharges = ajaxResponse.doctor_charges;
	var otDocCharges = ajaxResponse.ot_doctor_charges;
	docCharge.options.length = 0;
	docCharge.options.length = docCharges.length;

	otDocCharge.options.length = 0;
	otDocCharge.options.length = otDocCharges.length;

//	manually loading doctor consultation types in order dialog depending upon visit type
	loadSelectBox(docCharge, docCharges, 'consultation_type', 'consultation_type_id',
		getString("js.registration.patient.commonselectbox.defaultText"));
//	manually loading doctor OT Charges in order dialog depending upon visit type
	loadSelectBox(otDocCharge, otDocCharges, 'chargehead_name', 'chargehead_id',
		getString("js.registration.patient.commonselectbox.defaultText"));
}

function resetOrderDialogRatePlanInsurance(n_orgId, n_visitType, n_bedType) {
	if (!empty(addOrderDialog.getChargeRequest)) {
		if (YAHOO.lang.isArray(addOrderDialog.getChargeRequest)) {
			for (var i=0; i<getChargeRequest.length; i++) {
				YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest[i] , addOrderDialog.onGetCharge , true) ;
			}
		}else {
			YAHOO.util.Connect.abort(addOrderDialog.getChargeRequest , addOrderDialog.onGetCharge , true) ;
		}
	}

	// tell orderd dialog the new org ID, so that it can use new rates
	if (addOrderDialog) addOrderDialog.setOrgId(n_orgId);

	if (addOrderDialog ) addOrderDialog.setVisitType(n_visitType);

	if (addOrderDialog ) addOrderDialog.setBedType(empty(n_bedType) ? 'GENERAL' : n_bedType);

	// Update the list of items in the order dialog: this depends on the rate plan
	var url = orderItemsUrl + '&orgId=' + n_orgId + '&visitType='+n_visitType + "&center_id=" + centerId + "&bed_type=" + n_bedType;
	if(!empty(n_orgId)) {
		transactionCompleted = false;
		var ajaxRequest = newXMLHttpRequest();
		ajaxRequest.open("GET", url.toString(), false);
		ajaxRequest.send(null);
		if (ajaxRequest.readyState == 4 && ajaxRequest.status == 200) {
			eval(ajaxRequest.responseText);
			// re-initialize the item list within the order dialog.
			addOrderDialog.setNewItemList(rateplanwiseitems);
		}

		/* YAHOO.util.Connect.asyncRequest('GET', url, {
		  				success: onNewItemList,
		  				failure: getItemsFailed
		  			  }); */
	}
}

function getItemsFailed() {
	transactionCompleted = true;
}

function onNewItemList(response) {
	eval(response.responseText);
	// re-initialize the item list within the order dialog.
	addOrderDialog.setNewItemList(rateplanwiseitems);
	//transactionCompleted = true;
}

function clearQSOrderTable() {
	var table = document.getElementById('chargesTable');
	var numRows = table.rows.length;
	var lastRowIndex = numRows-2;
	for (var index = lastRowIndex; index >0; index--) {
		var row = table.rows[index];
		var newEl = getElementByName(row, 'new');
		if (newEl.value == 'Y') {
			row.parentNode.removeChild(row);
		}
	}
}

//my code ends here

// Function called when Patient Category is changed in UI

var gPatientCategoryChanged = false;
function onChangeCategory() {
	var patientCategoryObj	= document.mainform.patient_category_id;
	var patientCategory		= "";

	if (patientCategoryObj != null) {
		patientCategory	= patientCategoryObj.value;
		if (gSelectedPatientCategory == patientCategory) return;
	}

	setPrimarySponsor();
	var primarySponsorObj = document.getElementById("primary_sponsor");

	setPrimarySponsorDefaults();
	loadInsurancePolicyDetails();
	ratePlanChange();
	isCategoryChanged();
}

function setPrimarySponsor() {

	var patientCategoryObj	= document.mainform.patient_category_id;
	var patientCategory		= "";

	if (patientCategoryObj != null) {
		patientCategory	= patientCategoryObj.value;
		if (gSelectedPatientCategory == patientCategory) return;
	}

	var category = findInList(categoryJSON, "category_id", patientCategory);
	var defaultPrimaryTpa = '';
	defaultPrimaryTpa = !empty(category) ? category.primary_ip_sponsor_id : '';
	var primarySponsorObj = document.getElementById("primary_sponsor");

	if (primarySponsorObj != null) {
		if (!empty(defaultPrimaryTpa)) {
			var tpa = findInList(tpanames, "tpa_id", defaultPrimaryTpa);
			var spnsrType = !empty(tpa) ? tpa.sponsor_type : "";
			setSelectedIndex(primarySponsorObj, spnsrType);
		}
	}
}

// Gender
function salutationChange() {
	var title = getSelText(document.mainform.salutation);
	if (title != "" && document.mainform.salutation.value != "") {
	var salutation = eval(salutationJSON);
		for(var i=0;i<salutation.length;i++) {
			var item  = salutation[i];
			if(title == item["salutation"]) {
				if (!empty(item["gender"])) {
					for(var k=0; k<document.mainform.patient_gender.options.length;k++) {
						if(document.mainform.patient_gender.options[k].value == item["gender"])
							document.mainform.patient_gender.selectedIndex = k;
					}
				}else {
					document.mainform.patient_gender.selectedIndex = 0;
				}
				break;
			}
		}
	}else {
		document.mainform.patient_gender.selectedIndex = 0;
	}
}

function isCategoryChanged() {
	var spnsrIndex = getMainSponsorIndex();

	var tpaObj = null;
	var planObj= null;

	if (spnsrIndex == 'P') {
		tpaObj = getPrimarySponsorObj();
		planObj= getPrimaryPlanObj();
	}
	var tpaId = "";
	if (tpaObj != null) tpaId = tpaObj.value;

	var plan 	= "";
	if (planObj != null) plan = planObj.value;

	var orgId = document.mainform.organization.value;

/*	if (gPatientCategoryChanged)
		resetOrderDialogRatePlanInsurance(orgId, tpaId, plan, true);*/
}

// Function called when Insurance Company is changed in UI

function onLoadTpaList(spnsrIndex) {

	loadTpaList(spnsrIndex);
	tpaChange(spnsrIndex);
	insuCatChange(spnsrIndex);
	RatePlanList();
	ratePlanChange();
}

// Function called when TPA is changed in UI

function onTpaChange(spnsrIndex) {
	tpaChange(spnsrIndex);
	ratePlanChange();
}

function resetPrimarySponsorChange() {

	var primarySponsorObj = document.getElementById("primary_sponsor");

		if (primarySponsorObj.value == 'I') {
			document.getElementById("primaryInsuranceTab").style.display = 'block';

	}
}

function setPrimarySponsorDefaults() {

	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj != null) {
		var primarySpnsrType = primarySponsorObj.value;

		if (primarySpnsrType == 'I') {
			loadInsuranceCompList('P');
			loadTpaList('P');
			tpaChange('P');
			insuCatChange('P');
		}
	}
}

function populateRatePlan(){

	var ratePlanObj = document.getElementById("rate_plan_op");
	var ratePlanList = orgNamesJSON;
	var defaultRatePlan = "";
	var allRatePlanList = new Array();
	var filterRatePlanList = new Array();
	if(!empty(centerWiseOrgNameJSON)) {
	for (var i = 0; i < centerWiseOrgNameJSON.length; i++) {
		var item = centerWiseOrgNameJSON[i];
			if(document.getElementById('directestimate_opvisit').checked) {
				if (!empty(item.op_allowed_rate_plans) && item.op_allowed_rate_plans != '*') {
					var ratePlanIdList = item.op_allowed_rate_plans.split(',');
					var op_allowedRatePlans = [];
					for (var j = 0; j < ratePlanIdList.length; j++)
						op_allowedRatePlans.push(findInList(orgNamesJSON, "org_id", ratePlanIdList[j]));
					ratePlanList =  !empty(op_allowedRatePlans) ? op_allowedRatePlans : ratePlanList;
				}
				allRatePlanList.push(ratePlanList);
			}else {
				if (!empty(item.ip_allowed_rate_plans) && item.ip_allowed_rate_plans != '*') {
					var ratePlanIdList = item.ip_allowed_rate_plans.split(',');
					var ip_allowedRatePlans = [];
					for (var j = 0; j < ratePlanIdList.length; j++)
						ip_allowedRatePlans.push(findInList(orgNamesJSON, "org_id", ratePlanIdList[j]));
					ratePlanList =  !empty(ip_allowedRatePlans) ? ip_allowedRatePlans : ratePlanList;
				}
				allRatePlanList.push(ratePlanList);
			}
		}
	}
	var index = 0;
	if (ratePlanObj != null) {
		ratePlanObj.length = 1;
		ratePlanObj.options[index].text = "-- Select --";
		ratePlanObj.options[index].value = "";
	}

	for (var i = 0; i < allRatePlanList.length; i++) {
		var filterRatePlan = allRatePlanList[i];
		var sorted_filterRatePlan = filterRatePlan.sort();
		for (var j = 0; j < filterRatePlan.length; j++) {
			var found = false;
			for(var k = 0; k < filterRatePlanList.length; k++) {
				if(filterRatePlan[j] == filterRatePlanList[k]) {
					found = true;
					break;
				}
			}
    		if (!found) {
    			filterRatePlanList.push(filterRatePlan[j]);
			}
		}
	}
	if(empty(filterRatePlanList)){
		filterRatePlanList = ratePlanList;
	}

	for (var i = 0; i < filterRatePlanList.length; i++) {
		var exists = false;
		var item = filterRatePlanList[i];
		for (var k = 0; k < orgNamesJSON.length; k++) {
			var ratePlanItem = orgNamesJSON[k];
			if (!empty(item) && !empty(ratePlanItem) && (item.org_id == ratePlanItem.org_id)) {
				exists = true;
				break;
			}
		}
		if (exists) {
			index++;
			if (ratePlanObj != null) {
				ratePlanObj.length = index + 1;
				ratePlanObj.options[index].text = item.org_name;
				ratePlanObj.options[index].value = item.org_id;
			}
		}
	}
	if(ratePlanObj != null)
		sortDropDown(ratePlanObj);
}

function loadInsuranceCompList(spnsrIndex) {
	if(document.getElementById('insurance_ipvisit').checked) {
		var visitTypeObj = document.getElementById("insurance_ipvisit");
	}else {
		var visitTypeObj = document.getElementById("insurance_opvisit");
	}
	if(!empty(visitTypeObj)) {
		var categoryId = '';
		var visitType = visitTypeObj.value;
		if (document.mainform.patient_category_id)
			categoryId = document.mainform.patient_category_id.value;

		var tpaIdObj = null;
		var insuCompIdObj = null;
	var categoryId = '';
	if (document.mainform.patient_category_id)
		categoryId = document.mainform.patient_category_id.value;

		if (spnsrIndex == 'P') {
			tpaIdObj = getPrimarySponsorObj();
			insuCompIdObj = getPrimaryInsuObj();
		}
		var insCompList = insuCompanyDetails; // the default set: all Ins Comps
		var defaultInsComp = "";

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
						break;
					 } else if (visitType == 'o'){
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

		if (insuCompIdObj != null) {
			if (!empty(defaultInsComp)) {
				setSelectedIndex(insuCompIdObj, defaultInsComp);
			}
			else {
				setSelectedIndex(insuCompIdObj, "");
			}
		}
	}
}

function loadTpaList(spnsrIndex) {
	if(document.getElementById('insurance_ipvisit').checked) {
		var visitTypeObj = document.getElementById("insurance_ipvisit");
	}else {
		var visitTypeObj = document.getElementById("insurance_opvisit");
	}
	var visitType = null;
	if(visitTypeObj != null) {
		var tpaObj = null;
		var insuCompObj = null;
		var planTypeObj = null;
		var planObj = null;
		visitType = visitTypeObj.value;

		if (spnsrIndex == 'P') {
			tpaObj = getPrimarySponsorObj();
			insuCompObj = getPrimaryInsuObj();
			planTypeObj = getPrimaryPlanTypeObj();
			planObj = getPrimaryPlanObj();
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
		if (mainSpnsrIndex == 'P')
			mainInsuObj = getPrimaryInsuObj();
		if (mainInsuObj != null)
			mainInsCompanyId = mainInsuObj.value;

		// gIsInsurance - advance insurance and company not empty, variable for first of category check & display patient amounts.
		if (isModAdvanceIns && mainInsCompanyId != '') gIsInsurance = true;
		else gIsInsurance = false;

		if (!gIsInsurance) {

			if (planTypeObj != null) {
				planTypeObj.selectedIndex = 0;
				insuCatChange(spnsrIndex);
			}
		}

		if (gIsInsurance) {

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

		if (categoryId != '') {
			// category is enabled, the list of TPAs is restricted

			for (var i = 0; i < categoryJSON.length; i++) {
				var item = categoryJSON[i];
				if (categoryId == item.category_id) {
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
						break;
					 } else if (visitType == 'o') {
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
						break;
					 }
				}
			}
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
	}


	if (insuCompObj != null)
		sortDropDown(insuCompObj);
	if (tpaObj != null)
		sortDropDown(tpaObj);
	if (planTypeObj != null)
		sortDropDown(planTypeObj);
	if (planObj)
		sortDropDown(planObj);

	if(tpaObj != null) {
		if (!empty(defaultTpa)) {
			setSelectedIndex(tpaObj, defaultTpa);
		}else {
			setSelectedIndex(tpaObj, "");
		}
	}

	if (document.mainform.patient_category_id &&
			 planTypeObj != null && planTypeObj.options.length == 2) {
		setSelectedIndex(planTypeObj, planType);
	}
  }
}

// If the selected Primary sponsor is Insurance && has plan then Primary is Main Insurance
// If the selected Secondary sponsor is Insurance && has plan then Secondary is Main Insurance
// Otherwise Primary Sponsor is Main
function getMainSponsorIndex() {

	if (document.getElementById("primary_plan_id") != null
			&& document.getElementById("primary_plan_id").value !='')
		return 'P';

	if (document.getElementById("primary_plan_type") != null
			&& document.getElementById("primary_plan_type").value !='')
		return 'P';

	if (document.getElementById("primary_insurance_co") != null
			&& document.getElementById("primary_insurance_co").value !='')
		return 'P';

	if (document.getElementById("primary_sponsor_id") != null
			&& document.getElementById("primary_sponsor_id").value !='')
		return 'P';

	if (document.getElementById("primary_sponsor") != null
			&& document.getElementById("primary_sponsor").value == 'I')
		return 'P';
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

// Function called when Plan type is changed in UI

function onInsuCatChange(spnsrIndex) {
	insuCatChange(spnsrIndex);
	RatePlanList();
	ratePlanChange();
}

function onPolicyChange(spnsrIndex) {
	policyChange(spnsrIndex);
	RatePlanList();
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
				if (ele.insurance_co_id == selectedInsId && ele.category_id == selectedCatId && ele.status == "A" && ele.op_applicable == "Y") {
					var optn = new Option(ele.plan_name, ele.plan_id);
					len++;
					policySelect.options.length = len;
					policySelect.options[len - 1] = optn;
					policyDefault = ele.plan_id;
				}
		}

		if (policySelect.options.length == 2) {
			setSelectedIndex(policySelect, policyDefault);
		}

		sortDropDown(planObj);
		policyChange(spnsrIndex);
	}
}

// Function called when Plan type is changed (insuCatChange())
// (or) plan is changed (onPolicyChange())
// (or) Member ship autocomplete is changed (loadPolicyDetails)

function policyChange(spnsrIndex) {

	var approvalAmtObj = null;
	var planObj = null;

	if (spnsrIndex == 'P') {
		planObj = getPrimaryPlanObj();

		if (planObj != null) {
			if (empty(planObj.value)) {
				document.getElementById('pd_primary_planButton').disabled = true;
			} else {
				document.getElementById('pd_primary_planButton').disabled = false;
			}
			document.getElementById('primary_plan_div').title = "";
		}

	}
}

// Function called in 3 places, when TPA is changed (tpaChange())
// (or) Rate plans are loaded (RatePlanList())
// (or) to load existing patient details (loadInsurancePolicyDetails())


var gSelectedPatientCategory = null;
function ratePlanChange() {
	var ratePlanObj = document.mainform.organization;
	changeRatePlan(ratePlanObj);

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

}

function CategoryList() {
	var categoryObj = document.getElementById("patient_category_id");
	var de = getString("js.registration.patient.commonselectbox.defaultText");
	var optn = new Option(de, "");
	categoryObj.options[0] = optn;

	var len = 1;
	for (var i = 0; i < categoryJSON.length; i++) {
		optn = new Option(categoryJSON[i].category_name, categoryJSON[i].category_id);
		categoryObj.options[len] = optn;
		len++;
	}
	// if there is only one category found, then default it.
	if (len == 2)
			categoryObj.options.selectedIndex = 1;
	else
		setSelectedIndex(categoryObj, "");
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
				catDefaultRatePlan = category.ip_rate_plan_id;
				if (category.ip_allowed_rate_plans != '*')
					orgIdList = category.ip_allowed_rate_plans.split(',');

				if(category.ip_allowed_sponsors == null) {
					if (document.getElementById("primary_insurance_co") != null)
						loadSelectBox(document.getElementById('primary_insurance_co'), [],
							'insurance_co_name', 'insurance_co_id' , getString("js.registration.patient.commonselectbox.defaultText"));
				}
			 else {
				catDefaultRatePlan = category.op_rate_plan_id;
				if (category.op_allowed_rate_plans != '*' )
					orgIdList = category.op_allowed_rate_plans.split(',');

				if(category.op_allowed_sponsors == null) {
					if (document.getElementById("primary_insurance_co") != null)
						loadSelectBox(document.getElementById("primary_insurance_co"), [],
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


function getPrimaryUploadRowObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primaryInsFile");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primaryCorporateFile");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primaryNationalFile");
	}
	return null;
}

function getPrimarySponsorObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_sponsor_id");
	}
	return null;
}

function getPrimaryInsuObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_co");
	}else return null;
}

function getPrimaryPlanTypeObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_plan_type");
	}else return null;
}

function getPrimaryPlanObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_plan_id");
	}else return null;
}

function getPrimaryApprovalLimitObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_approval");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primary_corporate_approval");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primary_national_approval");
	}
	return null;
}

function getPrimaryApprovalLimitStarObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_approval_star");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primary_corporate_approval_star");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primary_national_approval_star");
	}
	return null;
}

function loadInsurancePolicyDetails() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;

	if (!loadPreviousInsDetails) {
		loadRatePlanDetails(gPreviousRatePlan);
		return;
	}

	resetPrimarySponsorChange();
	loadInsuranceDetails('P'); // Also loads rate plan

}

function loadRatePlanDetails(validRatePlan) {

	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;
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

	//var patientCategoryExpDtObj = document.mainform.category_expiry_date;

	if (!empty(gPreviousPatientCategoryId) && patientCategoryObj) {
		setSelectedIndex(patientCategoryObj, gPreviousPatientCategoryId);
		onChangeCategory(); // this will also load the tpa list
	}
}

// Populate the main visit or the previous insurance & policy details
// if op_type is F/D i.e FollowUp/FollowUp with consultation.
// Populate the category related TPA and Rate plan if op_type is M/R i.e Main or Revisit.

function loadInsuranceDetails(spnsrIndex) {

	var mainSpnsrIndex = spnsrIndex;

	var loadPreviousInsDetails	= false;
	var allowInsurance			= false;
	var insCompObj	= null;
	var tpaObj		= null;
	var planObj		= null;
	var planTypeObj	= null;
	var previousInsCompany = null;
	var previousTpa = null;
	var previousPlan = null;
	var previousPlanType = null;

	if (spnsrIndex == 'P') {
		insCompObj	= getPrimaryInsuObj();
		tpaObj		= getPrimarySponsorObj();
		planObj		= getPrimaryPlanObj();
		planTypeObj	= getPrimaryPlanTypeObj();
		previousInsCompany = gPreviousPrimaryInsCompany;
		previousTpa = gPreviousPrimaryTpa;
		previousPlan = gPreviousPlan;
		previousPatientPolicyId = gPreviousPatientPolicyId;

		//var member = findInList(gPatientPolciyNos, "patient_policy_id", previousPatientPolicyId);
		if (member != null && member.plan_id == previousPlan && member.insurance_co_id == previousInsCompany) {
			previousPlanType = gPreviousPlanType;

		}else {
			previousPlan = null;
			previousPlanType = null;
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
	var validPatientCategoryId = '';
	var validPlanType = '';
	var validInsComp = '';
	var validTpa = '';
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

		}else {
			setSelectedIndex(planTypeObj, "");
			insuCatChange(spnsrIndex);
			setSelectedIndex(planObj, "");
		}
	}
}

var patientRegPlanDetailsDialog;

function initPatientRegPlanDetailsDialog(buttonName) {
    patientRegPlanDetailsDialog = new YAHOO.widget.Dialog('patientRegPlanDetailsDialog', {
    	context:["","tr","br", ["beforeShow", "windowResize"]],
        width:"525px",
        visible: false,
        modal: true,
        constraintoviewport: true,
		close :false,
    });

    var escKeyListener = new YAHOO.util.KeyListener(document, { keys:27 },
                                             { fn:handlePatientRegPlanDetailsDialogCancel,
                                               scope:patientRegPlanDetailsDialog,
                                               correctScope:true } );
	scope:patientRegPlanDetailsDialog.cfg.queueProperty("keylisteners", [escKeyListener]);
	isPlanDetlDialgInitzld = true;
    patientRegPlanDetailsDialog.render();
}

function handlePatientRegPlanDetailsDialogCancel(){
	 document.getElementById('patientRegPlanDetailsDialog').style.display='none';
	 document.getElementById('patientRegPlanDetailsDialog').style.visibility='hidden';
	 patientRegPlanDetailsDialog.cancel();
}

function showPatientRegPlanDetailsDialog(planName) {
	var button = null;

	if (planName == "primary")
		button = document.getElementById('pd_primary_planButton');

	if (button != null) {
		document.getElementById('patientRegPlanDetailsDialog').style.display='block';
		document.getElementById('patientRegPlanDetailsDialog').style.visibility='visible';
		patientRegPlanDetailsDialog.cfg.setProperty("context", [button, "tr", "br"], false);
		getPatientPlanDetails(planName);
		patientRegPlanDetailsDialog.show();
	}
}

function getPatientPlanDetails(planName) {
	var planId = null;
	if (planName == "primary")
		planId = document.getElementById('primary_plan_id').value;
	if (!empty(planId)) {
		var ajaxReqObject = newXMLHttpRequest();
		var url = "./quickregistration.do?_method=getPlanDetails"
		url = url + "&plan_id=" + planId;
		var reqObject = newXMLHttpRequest();
		reqObject.open("POST", url.toString(), false);
		reqObject.send(null);
		if (reqObject.readyState == 4) {
			if ((reqObject.status == 200) && (reqObject.responseText != null)) {
				return handleAjaxResponse(reqObject.responseText,planName);
			}
		}
	}
}

function handleAjaxResponse(responseText,planName) {
	var planExclusion = null;
	var planNotes = null;

	if (responseText != null) {
		eval("var planDetails = " + responseText);
		if (!empty(planDetails.plan_exclusions))
			planExclusion = planDetails.plan_exclusions.split("\n");

		if (planExclusion != null && planExclusion.length > 0) {
			var exclusionChilds = document.getElementById('plan_exclusions').childNodes;
			for (var i=0; i<exclusionChilds.length; ) {
				document.getElementById('plan_exclusions').removeChild(exclusionChilds[i]);
			}
			for (var i=0;i<planExclusion.length;i++) {
				document.getElementById('plan_exclusions').appendChild(document.createTextNode(planExclusion[i]));
				document.getElementById('plan_exclusions').appendChild(document.createElement("br"));
			}
		} else {
			document.getElementById('plan_exclusions').textContent = "";
		}

		if (!empty(planDetails.plan_notes)) {
			planNotes = planDetails.plan_notes.split("\n");
		}

		if (planNotes != null && planNotes.length > 0) {
			var notesChilds = document.getElementById('plan_notes').childNodes;
			for (var i=0; i<notesChilds.length; ) {
				document.getElementById('plan_notes').removeChild(childs[i]);
			}
			for (var i=0;i<planNotes.length;i++) {
				document.getElementById('plan_notes').appendChild(document.createTextNode(planNotes[i]));
				document.getElementById('plan_notes').appendChild(document.createElement("br"));
			}
		} else {
			document.getElementById('plan_notes').textContent = "";
		}

		if (planName =="primary") {
			document.getElementById('primary_plan_div').title = planDetails.plan_name != null ? planDetails.plan_name : "";
		}
	} else {
		document.getElementById('plan_exclusions').textContent = "";
		document.getElementById('plan_notes').textContent = "";
		if (planName =="primary") {
			document.getElementById('primary_plan_div').title = "";
		}

	}
}

function onChangeIpVisitType(ipVisitTypeObj) {
	var visitType = ipVisitTypeObj;
	var bedType = document.getElementById('bed_type_ip').value;
	var index = document.getElementById('bed_type_ip').selectedIndex;
	if(visitType.value == 'i') {
		document.getElementById('displayBedTypeIp').style.display = 'table-row';
		if(!(index <= 0))
			setSelectedIndex(document.getElementById('bed_type_ip'),bedType);
		else
			setSelectedIndex(document.getElementById('bed_type_ip'),'GENERAL');
		onBedTypeChange(document.getElementById('bed_type_ip'));
	}
	else {
		document.getElementById('displayBedTypeIp').style.display = 'none';
	}
	visitTypeChange(visitType);
}

function onChangeOpVisitType(opVisitTypeObj) {
	var visitType = opVisitTypeObj;
	populateRatePlan();
	if(visitType.value == 'i') {
		document.getElementById('displayBedTypeOp').style.display = 'table-row';
		setSelectedIndex(document.getElementById('bed_type_op'),'GENERAL');
		onBedTypeChange(document.getElementById('bed_type_op'));
	}
	else {
		document.getElementById('directestimate_opvisit').checked = true;
		document.getElementById('displayBedTypeOp').style.display = 'none';
	}
	visitTypeChange(visitType);
}

function populateBedTypes(insuranceObj) {

	if(insuranceObj.value == 'I')
		var bedTypeObj = document.mainform.bed_type_ip;
	else
		var bedTypeObj = document.mainform.bed_type_op;

	var len = 0;
	for (var i = 0; i < bedTypesList.length; i++) {
		var optn = new Option(bedTypesList[i].bedtype, bedTypesList[i].bedtype);
		bedTypeObj.options[len] = optn;
		len++;
	}
	// if there is only one Bed found, then default it.
	if (len == 2)
			bedTypeObj.options.selectedIndex = 1;
	else
		setSelectedIndex(bedTypeObj, "");
}

function insuPrimaryViewDoc(obj){
	var insuconame = obj.value;
	var docname = findInList(insuCompanyDetails, "insurance_co_id", insuconame);
	if(docname != null)
		var insufilename = docname.insurance_rules_doc_name;
	if(!empty(insufilename)) {
		if(!empty(insuconame)) {
			var insUrl = cpath+"/master/InsuranceCompMaster.do?_method=getviewInsuDocument";
			insUrl += "&inscoid=" + insuconame;
			if(document.getElementById('a1')) {
				document.getElementById('a1').href = insUrl;
				document.getElementById('viewinsuranceprimaryruledocs').style.display = 'block';
			}else {
				var aTag = document.createElement('a');
				aTag.setAttribute('id',"a1");
				aTag.setAttribute('href',insUrl);
				aTag.setAttribute('target','_blank');
				aTag.innerHTML = "View Current Document";
				document.getElementById('viewinsuranceprimaryruledocs').appendChild(aTag);
				document.getElementById('viewinsuranceprimaryruledocs').style.display = 'block';
			}
		}
	}else {
		document.getElementById('viewinsuranceprimaryruledocs').style.display = 'none';
	}
}

// clear the insurance details if direct estimate is selected
function clearInsuranceDetails() {

	var form = document.mainform;
	setSelectedIndex(form.patient_category_id, '');
	setSelectedIndex(form.organization, '');
	document.getElementById('insurance_ipvisit').click();
	setSelectedIndex(form.primary_insurance_co, '');
	setSelectedIndex(form.primary_sponsor_id, '');
	setSelectedIndex(form.primary_plan_type, '');
	setSelectedIndex(form.primary_plan_id, '');

	document.getElementById("primary_sponsor_id").length = 1;
	document.getElementById("primary_plan_type").length = 1;
	document.getElementById("primary_plan_id").length = 1;
	document.getElementById('displayBedTypeIp').style.display = 'table-row';
	document.getElementById('viewinsuranceprimaryruledocs').style.display = 'none';
}

// clear the Patient details if new patient is selected
function clearRegisteredPatientDetails() {

	document.getElementById('mrno').value = '';
	document.getElementById('visitId').textContent = '';
	document.getElementById('gender').textContent = '';
	document.getElementById('age').textContent = '';
	document.getElementById('mobile').textContent = '';
	document.getElementById('fullname').textContent = '';
}

function clearNewPatientDetails() {

	var form = document.mainform;
	document.getElementById('salutation').value = '';
	document.getElementById('person_name').value = '..FirstName..';
	document.getElementById('middle_name').value = '..MiddleName..';
	document.getElementById('last_name').value = '..LastName..';
	document.getElementById('patient_age').value = '';
	setSelectedIndex(form.ageIn, 'Y');
	setSelectedIndex(form.patient_gender, 'N');
	document.getElementById('mobile_no').value = '';
}

function clearDirectEstimateDetails() {

	var form = document.mainform;
	document.getElementById('directestimate_ipvisit').click();
	setSelectedIndex(form.rate_plan_op, '');
	document.getElementById('displayBedTypeOp').style.display = 'table-row';
}

function onClickClear() {
	clearRegisteredPatientDetails();
	clearNewPatientDetails();
	clearInsuranceDetails();
	clearDirectEstimateDetails();
	clearQSOrderTable();
	resetTotals();
	document.getElementById('direct_estimate').click();
	document.getElementById('new_patient').click();
	document.getElementById('directestimate_ipvisit').click();
}

function setSchedulerPriorAuthDetails() {
	if (!empty(primaryResource)) {
		var spnsrIndex = getMainSponsorIndex();
		if (spnsrIndex == 'P') {
			var primaryPriorAuthIddObj = document.getElementById("primary_prior_auth_id");
			var primaryPriorAuthModeIdObj = document.getElementById("primary_prior_auth_mode_id");
			if (primaryPriorAuthIddObj != null)
				primaryPriorAuthIddObj.value = !empty(primaryResource.scheduler_prior_auth_no) ? primaryResource.scheduler_prior_auth_no : "";
			if (primaryPriorAuthModeIdObj != null)
				primaryPriorAuthModeIdObj.value = !empty(primaryResource.scheduler_prior_auth_mode_id) ? primaryResource.scheduler_prior_auth_mode_id : "";
		}
	}
}

function handlePatientSelect(patientObj) {
	clearChargeRelatedDetails();
	var value = patientObj.value;
	if(value == 'registered') {
		clearNewPatientDetails();
		disableAllPatientActions();
		enablePatientAction(document.getElementById('registeredpatientdetails'));
		setFocus();
	} else if( value == 'new') {
		clearRegisteredPatientDetails();
		clearInsuranceDetails();
		disableAllPatientActions();
		disableAllInsuranceActions();
		enableInsuranceAction(document.getElementById('directestimate'));
		document.getElementById("direct_estimate").checked = true;
		enablePatientAction(document.getElementById('newpatientdetails'));
		setFocus();
	}
}

function disableAllPatientActions() {
	document.getElementById('registeredpatientdetails').className = "disabler";
	disableFormFields(document.getElementById('registeredpatientdetails'), true);

	document.getElementById('newpatientdetails').className = "disabler";
	disableFormFields(document.getElementById('newpatientdetails'), true);
}

function enablePatientAction(parent) {
	parent.className = '';
	disableFormFields(parent, false);
}

function handleInsuranceSelect(insuranceObj) {
	clearChargeRelatedDetails();
	populateBedTypes(insuranceObj);
	var value = insuranceObj.value;
	if(value == 'I') {
		clearDirectEstimateDetails();
		document.getElementById('insurance_ipvisit').click();
		if(patient != null) {
			if(!empty(document.mainform.mrno.value)) {
				if(patient.visit_type == 'i') {
					onChangeIpVisitType(document.getElementById('insurance_ipvisit'));
					visitTypeChange(document.getElementById('insurance_ipvisit'));
				}else{
					onChangeIpVisitType(document.getElementById('insurance_opvisit'));
					visitTypeChange(document.getElementById('insurance_opvisit'));
				}
				loadInsuranceResponseDetails(patientInfo, patient);
			}
			else {
				clearInsuranceDetails();
				onChangeIpVisitType(document.getElementById('insurance_ipvisit'));
			}
		}else{
			onChangeIpVisitType(document.getElementById('insurance_ipvisit'));
		}
		disableAllInsuranceActions();
		enableInsuranceAction(document.getElementById('registeredpatient'));
	} else if( value ==  'direstimate') {
		clearInsuranceDetails();
		populateRatePlan();
		if(patient != null) {
			if(patient.visit_type == 'i') {
				onChangeOpVisitType(document.getElementById('directestimate_ipvisit'));
				visitTypeChange(document.getElementById('directestimate_ipvisit'));
			}else{
				onChangeOpVisitType(document.getElementById('directestimate_opvisit'));
				visitTypeChange(document.getElementById('directestimate_opvisit'));
			}
			if(!empty(document.mainform.mrno.value)) {
				loadNonInsurancePatientDetails(patient);
			}
		}else {
			onChangeOpVisitType(document.getElementById('directestimate_ipvisit'));
		}
		disableAllInsuranceActions();
		enableInsuranceAction(document.getElementById('directestimate'));
	}
}

function handleDirestimateVisitTypeSelect(direstimateVisitTypeObj){

	var value = direstimateVisitTypeObj.value;
	if(value == 'i') {
		document.getElementById('displayBedTypeOp').style.display = 'table-row';
		document.getElementById('bed_type_op').value = 'GENERAL';
	}else {
		document.getElementById('displayBedTypeOp').style.display = 'none';
	}


/*
if(visitType.value == 'i') {
		document.getElementById('displayBedTypeOp').style.display = 'table-row';
		document.getElementById('bed_type_op').value = 'GENERAL';
		onBedTypeChange(document.getElementById('bed_type_op'));
	}
	else {
		document.getElementById('displayBedTypeOp').style.display = 'none';
	}
	visitTypeChange(visitType);
*/
}

function clearChargeRelatedDetails() {
	if (addOrderDialog) addOrderDialog.setOrgId("");

	if (addOrderDialog ) addOrderDialog.setVisitType("");

	if (addOrderDialog ) addOrderDialog.setVisitType("");
}

function disableAllInsuranceActions() {
	document.getElementById('registeredpatient').className = "disabler";
	disableFormFields(document.getElementById('registeredpatient'), true);

	document.getElementById('directestimate').className = "disabler";
	disableFormFields(document.getElementById('directestimate'), true);
}

function enableInsuranceAction(parent) {
	parent.className = '';
	disableFormFields(parent, false);
}

function disableFormFields(parent, isDisabled) {
	var tagNames = ["INPUT", "SELECT", "TEXTAREA"];
	for (var i = 0; i < tagNames.length; i++) {
	    var elems = parent.getElementsByTagName(tagNames[i]);
	    for (var j = 0; j < elems.length; j++) {
	      elems[j].disabled = isDisabled;
	    }
	}
}