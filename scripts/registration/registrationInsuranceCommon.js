/* Insurance functions used in registration */

var primaryResource = getSchedulerPrimaryResource();

function onChangePrimarySponsor() {
	resetPrimarySponsorChange();
	setPrimarySponsorDefaults();
	if (screenid == "reg_registration" && (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D"))
		loadInsurancePolicyDetails();
	if(screenid == "reg_registration")
		setMultiPlanExists();
	changeVisitType();
	setSchedulerPriorAuthDetails();
}

function setMultiPlanExists(){
	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if(primarySponsorObj.value == 'I' &&  secondarySponsorObj.value == 'I') {
		multiPlanExists = true;
		document.getElementById("secPriorAuthHeader").style.display = 'table-cell';
		document.getElementById("preAuthHeader").style.display = 'none';
		document.getElementById("priPreAuthHeader").style.display = 'block';
	}else{
		multiPlanExists = false;
		document.getElementById("preAuthHeader").style.display = 'block';
		document.getElementById("priPreAuthHeader").style.display = 'none';
		document.getElementById("secPriorAuthHeader").style.display = 'none';
	}
	orderTableInit(true);
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
		}else if (spnsrIndex == 'S') {
			var secondaryPriorAuthIddObj = document.getElementById("secondary_prior_auth_id");
			var secondaryPriorAuthModeIdObj = document.getElementById("secondary_prior_auth_mode_id");
			if (secondaryPriorAuthIddObj != null)
				secondaryPriorAuthIddObj.value = !empty(primaryResource.scheduler_prior_auth_no) ? primaryResource.scheduler_prior_auth_no : "";
			if (secondaryPriorAuthModeIdObj != null)
				secondaryPriorAuthModeIdObj.value = !empty(primaryResource.scheduler_prior_auth_mode_id) ? primaryResource.scheduler_prior_auth_mode_id : "";
		}
	}
}

function resetPrimarySponsorChange() {

	var primarySponsorObj = document.getElementById("primary_sponsor");
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (primarySponsorObj != null && primarySponsorObj.value != '') {
		document.getElementById("primarySponsorGroup").style.display = 'block';
		secondarySponsorObj.disabled = false;

		if (primarySponsorObj.value == 'I') {
			document.getElementById("primaryInsuranceTab").style.display = 'block';
			document.getElementById("primaryCorporateTab").style.display = 'none';
			document.getElementById("primaryNationalTab").style.display = 'none';
			resetPrimaryCorporateDetails();
			resetPrimaryNationalDetails();

		}else if (primarySponsorObj.value == 'C') {
			document.getElementById("primaryCorporateTab").style.display = 'block';
			document.getElementById("primaryInsuranceTab").style.display = 'none';
			document.getElementById("primaryNationalTab").style.display = 'none';
			resetPrimaryInsuranceDetails();
			resetPrimaryNationalDetails();

		}else {
			document.getElementById("primaryNationalTab").style.display = 'block';
			document.getElementById("primaryInsuranceTab").style.display = 'none';
			document.getElementById("primaryCorporateTab").style.display = 'none';
			resetPrimaryCorporateDetails();
			resetPrimaryInsuranceDetails();
		}
	}else {
		resetPrimaryInsuranceDetails();
		resetPrimaryCorporateDetails();
		resetPrimaryNationalDetails();
		document.getElementById("secondary_sponsor").selectedIndex = 0;
		secondarySponsorObj.disabled = true;
		document.getElementById("primarySponsorGroup").style.display = 'none';
		document.getElementById("secondarySponsorGroup").style.display = 'none';
	}
}

function setAllDefaults() {
	setPrimarySponsorDefaults();
	setSecondarySponsorDefaults();
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
			RatePlanList();
			policyChange('P');

		}else if (primarySpnsrType == 'C') {
			loadTpaList('P');
			onCorporateChange('P');

		}else if (primarySpnsrType == 'N') {
			loadTpaList('P');
			onNationalSponsorChange('P');
		}else {}
	}

	if (isModAdvanceIns) {
		var spnsrIndex = getMainSponsorIndex();
		if (spnsrIndex == 'S') policyNoAutoComplete('S', gPatientPolciyNos);
		else policyNoAutoComplete('P', gPatientPolciyNos);

		corporateNoAutoComplete('P', gPatientCorporateIds);
		corporateNoAutoComplete('S', gPatientCorporateIds);

		nationalNoAutoComplete('P', gPatientNationalIds);
		nationalNoAutoComplete('S', gPatientNationalIds);
	}
}

function setSecondarySponsorDefaults() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj != null) {
		var secondarySpnsrType = secondarySponsorObj.value;
		if (secondarySpnsrType == 'I') {
			loadInsuranceCompList('S');
			loadTpaList('S');
			tpaChange('S');
			insuCatChange('S');
			RatePlanList();
			policyChange('S');

		}else if (secondarySpnsrType == 'C') {
			loadTpaList('S');
			onCorporateChange('S');

		}else if (secondarySpnsrType == 'N') {
			loadTpaList('S');
			onNationalSponsorChange('S');
		}else {}
	}

	if (isModAdvanceIns) {
		var spnsrIndex = getMainSponsorIndex();
		if (spnsrIndex == 'S') policyNoAutoComplete('S', gPatientPolciyNos);
		else policyNoAutoComplete('P', gPatientPolciyNos);

		corporateNoAutoComplete('P', gPatientCorporateIds);
		corporateNoAutoComplete('S', gPatientCorporateIds);

		nationalNoAutoComplete('P', gPatientNationalIds);
		nationalNoAutoComplete('S', gPatientNationalIds);
	}
}

function onChangeSecondarySponsor() {
	resetSecondarySponsorChange();
	setSecondarySponsorDefaults();
	if (screenid == "reg_registration" && (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D"))
		loadInsurancePolicyDetails();
	if(screenid == "reg_registration")
		setMultiPlanExists();
	changeVisitType();
	setSchedulerPriorAuthDetails();
}

function resetSecondarySponsorChange() {

	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj != null && secondarySponsorObj.value != '') {
		document.getElementById("secondarySponsorGroup").style.display = 'block';

		if (secondarySponsorObj.value == 'I') {
			document.getElementById("secondaryInsuranceTab").style.display = 'block';
			document.getElementById("secondaryCorporateTab").style.display = 'none';
			document.getElementById("secondaryNationalTab").style.display = 'none';
			resetSecondaryCorporateDetails();
			resetSecondaryNationalDetails();

		}else if (secondarySponsorObj.value == 'C') {
			document.getElementById("secondaryCorporateTab").style.display = 'block';
			document.getElementById("secondaryInsuranceTab").style.display = 'none';
			document.getElementById("secondaryNationalTab").style.display = 'none';
			resetSecondaryInsuranceDetails();
			resetSecondaryNationalDetails();
		}else {
			document.getElementById("secondaryNationalTab").style.display = 'block';
			document.getElementById("secondaryInsuranceTab").style.display = 'none';
			document.getElementById("secondaryCorporateTab").style.display = 'none';
			resetSecondaryInsuranceDetails();
			resetSecondaryCorporateDetails();
		}
	}else {
		document.getElementById("secondarySponsorGroup").style.display = 'none';
		resetSecondaryInsuranceDetails();
		resetSecondaryCorporateDetails();
		resetSecondaryNationalDetails();
	}
}

function resetPrimaryInsuranceDetails() {
	var primarySponsorIdObj = document.getElementById("primary_sponsor_id");
	if (primarySponsorIdObj != null) {
		primarySponsorIdObj.selectedIndex = 0;
		onTpaChange('P');
	}

	var primaryInsuranceIdObj = document.getElementById("primary_insurance_co");
	if (primaryInsuranceIdObj != null) {
		primaryInsuranceIdObj.selectedIndex = 0;
		onLoadTpaList('P');
	}

	var primaryInsuranceApprovalObj = document.getElementById("primary_insurance_approval");
	if (primaryInsuranceApprovalObj != null)
		primaryInsuranceApprovalObj.value = "";

	var primaryPlanTypeObj = document.getElementById("primary_plan_type");
	if (primaryPlanTypeObj != null) {
		primaryPlanTypeObj.selectedIndex = 0;
		onInsuCatChange('P');
	}

	var primaryPlanIdObj = document.getElementById("primary_plan_id");
	if (primaryPlanIdObj != null) {
		primaryPlanIdObj.selectedIndex = 0;
		onPolicyChange('P');
	}

	var primaryDrgCheckObj = document.getElementById("primary_drg_check");
	var primaryUseDrgObj = document.getElementById("primary_use_drg");
	if (primaryDrgCheckObj != null) {
		primaryDrgCheckObj.checked = false;
		checkUseDRG('P');
	}

	var primaryMemberIdObj = document.getElementById("primary_member_id");
	if (primaryMemberIdObj != null) {
		primaryMemberIdObj.value = "";
		checkForMemberID('P');
	}

	var primaryPolicyValidityStartObj = document.getElementById("primary_policy_validity_start");
	if (primaryPolicyValidityStartObj != null) primaryPolicyValidityStartObj.value = "";
	var primaryPolicyValidityEndObj = document.getElementById("primary_policy_validity_end");
	if (primaryPolicyValidityEndObj != null) primaryPolicyValidityEndObj.value = "";

	var primaryPolicyNumberObj = document.getElementById("primary_policy_number");
	if (primaryPolicyNumberObj != null) primaryPolicyNumberObj.value = "";

	var primaryPolicyHolderObj = document.getElementById("primary_policy_holder_name");
	if (primaryPolicyHolderObj != null) primaryPolicyHolderObj.value = "";

	var primaryPatientRelationshipObj = document.getElementById("primary_patient_relationship");
	if (primaryPatientRelationshipObj != null) primaryPatientRelationshipObj.value ="";

	var primaryPriorAuthIddObj = document.getElementById("primary_prior_auth_id");
	if (primaryPriorAuthIddObj != null) primaryPriorAuthIddObj.value = "";
	var primaryPriorAuthModeIdObj = document.getElementById("primary_prior_auth_mode_id");
	if (primaryPriorAuthModeIdObj != null) primaryPriorAuthModeIdObj.selectedIndex = 0;

	var primaryInsuranceDocContentObj = document.getElementById("primary_insurance_doc_content_bytea1");
	if (primaryInsuranceDocContentObj != null) primaryInsuranceDocContentObj.value = "";
}

function resetPrimaryCorporateDetails() {

	var primaryCorporateObj = document.getElementById("primary_corporate");
	if (primaryCorporateObj != null) {
		primaryCorporateObj.selectedIndex = 0;
	}

	var primaryCorporateApprovalObj = document.getElementById("primary_corporate_approval");
	if (primaryCorporateApprovalObj != null) primaryCorporateApprovalObj.value = "";

	var primaryEmployeeIdObj = document.getElementById("primary_employee_id");
	if (primaryEmployeeIdObj != null) primaryEmployeeIdObj.value = "";

	var primaryEmployeeNameObj = document.getElementById("primary_employee_name");
	if (primaryEmployeeNameObj != null) primaryEmployeeNameObj.value = "";

	var primaryEmployeeRelationObj = document.getElementById("primary_employee_relation");
	if (primaryEmployeeRelationObj != null) primaryEmployeeRelationObj.value = "";

	var primaryCorporateDocContentObj = document.getElementById("primary_corporate_doc_content_bytea1");
	if (primaryCorporateDocContentObj != null) primaryCorporateDocContentObj.value = "";
}

function resetPrimaryNationalDetails() {

	var primaryNationalObj = document.getElementById("primary_national_sponsor");
	if (primaryNationalObj != null) {
		primaryNationalObj.selectedIndex = 0;
		onNationalSponsorChange('P');
	}

	var primaryNationalApprovalObj = document.getElementById("primary_national_approval");
	if (primaryNationalApprovalObj != null) primaryNationalApprovalObj.value = "";

	var primaryNationalMemberIdObj = document.getElementById("primary_national_member_id");
	if (primaryNationalMemberIdObj != null) primaryNationalMemberIdObj.value = "";

	var primaryNationalMemberNameObj = document.getElementById("primary_national_member_name");
	if (primaryNationalMemberNameObj != null) primaryNationalMemberNameObj.value = "";

	var primaryNationalRelationObj = document.getElementById("primary_national_relation");
	if (primaryNationalRelationObj != null) primaryNationalRelationObj.value = "";

	var primaryNationalDocContentObj = document.getElementById("primary_national_doc_content_bytea1");
	if (primaryNationalDocContentObj != null) primaryNationalDocContentObj.value = "";
}

function resetSecondaryInsuranceDetails() {
	var secondarySponsorIdObj = document.getElementById("secondary_sponsor_id");
	if (secondarySponsorIdObj != null) {
		secondarySponsorIdObj.selectedIndex = 0;
		onTpaChange('S');
	}

	var secondaryInsuranceIdObj = document.getElementById("secondary_insurance_co");
	if (secondaryInsuranceIdObj != null) {
		secondaryInsuranceIdObj.selectedIndex = 0;
		onLoadTpaList('S');
	}

	var secondaryInsuranceApprovalObj = document.getElementById("secondary_insurance_approval");
	if (secondaryInsuranceApprovalObj != null) secondaryInsuranceApprovalObj.value = "";

	var secondaryPlanTypeObj = document.getElementById("secondary_plan_type");
	if (secondaryPlanTypeObj != null) {
		secondaryPlanTypeObj.selectedIndex = 0;
		onInsuCatChange('S');
	}

	var secondaryPlanIdObj = document.getElementById("secondary_plan_id");
	if (secondaryPlanIdObj != null) {
		secondaryPlanIdObj.selectedIndex = 0;
		onPolicyChange('S');
	}

	var secondaryDrgCheckObj = document.getElementById("secondary_drg_check");
	var secondaryUseDrgObj = document.getElementById("secondary_use_drg");
	if (secondaryDrgCheckObj != null) {
		secondaryDrgCheckObj.checked = false;
		checkUseDRG('S');
	}

	var secondaryMemberIdObj = document.getElementById("secondary_member_id");
	if (secondaryMemberIdObj != null) {
		secondaryMemberIdObj.value = "";
		checkForMemberID('S');
	}

	var secondaryPolicyValidityStartObj = document.getElementById("secondary_policy_validity_start");
	if (secondaryPolicyValidityStartObj != null) secondaryPolicyValidityStartObj.value = "";
	var secondaryPolicyValidityEndObj = document.getElementById("secondary_policy_validity_end");
	if (secondaryPolicyValidityEndObj != null) secondaryPolicyValidityEndObj.value = "";

	var secondaryPolicyNumberObj = document.getElementById("secondary_policy_number");
	if (secondaryPolicyNumberObj != null) secondaryPolicyNumberObj.value = "";

	var secondaryPolicyHolderObj = document.getElementById("secondary_policy_holder_name");
	if (secondaryPolicyHolderObj != null) secondaryPolicyHolderObj.value = "";

	var secondaryPatientRelationshipObj = document.getElementById("secondary_patient_relationship");
	if (secondaryPatientRelationshipObj != null) secondaryPatientRelationshipObj.value ="";

	var secondaryPriorAuthIddObj = document.getElementById("secondary_prior_auth_id");
	if (secondaryPriorAuthIddObj != null) secondaryPriorAuthIddObj.value = "";
	var secondaryPriorAuthModeIdObj = document.getElementById("secondary_prior_auth_mode_id");
	if (secondaryPriorAuthModeIdObj != null) secondaryPriorAuthModeIdObj.selectedIndex = 0;

	var secondaryInsuranceDocContentObj = document.getElementById("secondary_insurance_doc_content_bytea1");
	if (secondaryInsuranceDocContentObj != null) secondaryInsuranceDocContentObj.value = "";
}

function resetSecondaryCorporateDetails() {

	var secondaryCorporateObj = document.getElementById("secondary_corporate");
	if (secondaryCorporateObj != null) {
		secondaryCorporateObj.selectedIndex = 0;
	}

	var secondaryCorporateApprovalObj = document.getElementById("secondary_corporate_approval");
	if (secondaryCorporateApprovalObj != null) secondaryCorporateApprovalObj.value = "";

	var secondaryEmployeeIdObj = document.getElementById("secondary_employee_id");
	if (secondaryEmployeeIdObj != null) secondaryEmployeeIdObj.value = "";

	var secondaryEmployeeNameObj = document.getElementById("secondary_employee_name");
	if (secondaryEmployeeNameObj != null) secondaryEmployeeNameObj.value = "";

	var secondaryEmployeeRelationObj = document.getElementById("secondary_employee_relation");
	if (secondaryEmployeeRelationObj != null) secondaryEmployeeRelationObj.value = "";

	var secondaryCorporateDocContentObj = document.getElementById("secondary_corporate_doc_content_bytea1");
	if (secondaryCorporateDocContentObj != null) secondaryCorporateDocContentObj.value = "";
}

function resetSecondaryNationalDetails() {

	var secondaryNationalObj = document.getElementById("secondary_national_sponsor");
	if (secondaryNationalObj != null) {
		secondaryNationalObj.selectedIndex = 0;
		onNationalSponsorChange('S');
	}

	var secondaryNationalApprovalObj = document.getElementById("secondary_national_approval");
	if (secondaryNationalApprovalObj != null) secondaryNationalApprovalObj.value = "";

	var secondaryNationalMemberIdObj = document.getElementById("secondary_national_member_id");
	if (secondaryNationalMemberIdObj != null) secondaryNationalMemberIdObj.value = "";

	var secondaryNationalMemberNameObj = document.getElementById("secondary_national_member_name");
	if (secondaryNationalMemberNameObj != null) secondaryNationalMemberNameObj.value = "";

	var secondaryNationalRelationObj = document.getElementById("secondary_national_relation");
	if (secondaryNationalRelationObj != null) secondaryNationalRelationObj.value = "";

	var secondaryNationalDocContentObj = document.getElementById("secondary_national_doc_content_bytea1");
	if (secondaryNationalDocContentObj != null) secondaryNationalDocContentObj.value = "";
}


function enableDisablePrimaryInsuranceDetails(disable, approvalAmtEnableDisable) {
	var primarySponsorIdObj = document.getElementById("primary_sponsor_id");
	primarySponsorIdObj.disabled = disable;

	var primaryInsuranceIdObj = document.getElementById("primary_insurance_co");
	if (disable)
		primaryInsuranceIdObj.disabled = disable;
	else
		primaryInsuranceIdObj.removeAttribute("disabled");

	//var primaryInsuranceApprovalObj = document.getElementById("primary_insurance_approval");
	//primaryInsuranceApprovalObj.disabled = approvalAmtEnableDisable;

	var primaryPlanTypeObj = document.getElementById("primary_plan_type");
	if (primaryPlanTypeObj != null) primaryPlanTypeObj.disabled = disable;

	var primaryPlanIdObj = document.getElementById("primary_plan_id");
	if (primaryPlanIdObj != null) primaryPlanIdObj.disabled = disable;

	var primaryDrgCheckObj = document.getElementById("primary_drg_check");
	var primaryUseDrgObj = document.getElementById("primary_use_drg");
	if (primaryDrgCheckObj != null) primaryDrgCheckObj.checked = false;
	if (primaryDrgCheckObj != null) primaryDrgCheckObj.disabled = disable;

	var primaryMemberIdObj = document.getElementById("primary_member_id");
	if  (primaryMemberIdObj != null) primaryMemberIdObj.disabled = disable;

	var primaryPolicyValidityStartObj = document.getElementById("primary_policy_validity_start");
	if (primaryPolicyValidityStartObj != null) primaryPolicyValidityStartObj.disabled = disable;

	var primaryInsuranceDocContentObj = document.getElementById("primary_insurance_doc_content_bytea1");
	var primaryInsurancePasteObj = document.getElementById("primarySponsorI");
	var primaryInsuranceViewObj = document.getElementById("viewPrimarySponsorI");

	var primaryPolicyValidityEndObj = document.getElementById("primary_policy_validity_end");
	if (primaryPolicyValidityEndObj != null) {
		if (trimAll(primaryPolicyValidityEndObj.value) != '') {
			primaryPolicyValidityEndObj.disabled = disable;
			if (primaryInsuranceDocContentObj != null) primaryInsuranceDocContentObj.disabled = disable;
			if (primaryInsurancePasteObj != null) primaryInsurancePasteObj.style.display = (disable == true ? 'none' : 'block');
			if (primaryInsuranceViewObj != null) primaryInsuranceViewObj.style.display = (disable == true ? 'none' : 'block');
		} else {
			primaryPolicyValidityEndObj.disabled = false;
			if (primaryInsuranceDocContentObj != null) primaryInsuranceDocContentObj.disabled = false;
			if (primaryInsurancePasteObj != null) primaryInsurancePasteObj.style.display = (disable == true ? 'none' : 'block');
			if (primaryInsuranceViewObj != null) primaryInsuranceViewObj.style.display = (disable == true ? 'none' : 'block');
		}
	}

	var primaryPolicyNumberObj = document.getElementById("primary_policy_number");
	if (primaryPolicyNumberObj != null) primaryPolicyNumberObj.disabled = disable;

	var primaryPolicyHolderObj = document.getElementById("primary_policy_holder_name");
	if (primaryPolicyHolderObj != null) primaryPolicyHolderObj.disabled = disable;

	var primaryPatientRelationshipObj = document.getElementById("primary_patient_relationship");
	if (primaryPatientRelationshipObj != null) primaryPatientRelationshipObj.disabled = disable;

	var primaryPriorAuthIddObj = document.getElementById("primary_prior_auth_id");
	if (primaryPriorAuthIddObj != null) primaryPriorAuthIddObj.disabled = disable;
	var primaryPriorAuthModeIdObj = document.getElementById("primary_prior_auth_mode_id");
	if (primaryPriorAuthModeIdObj != null) {
		if (disable) primaryPriorAuthModeIdObj.disabled = disable;
		else primaryPriorAuthModeIdObj.removeAttribute("disabled");
	}
}

function enableDisablePrimaryCorporateDetails(disable, approvalAmtEnableDisable) {

	var primaryCorporateObj = document.getElementById("primary_corporate");
	primaryCorporateObj.disabled = disable;

	//var primaryCorporateApprovalObj = document.getElementById("primary_corporate_approval");
	//primaryCorporateApprovalObj.disabled = approvalAmtEnableDisable;

	var primaryEmployeeIdObj = document.getElementById("primary_employee_id");
	primaryEmployeeIdObj.disabled = disable;

	var primaryEmployeeNameObj = document.getElementById("primary_employee_name");
	primaryEmployeeNameObj.disabled = disable;

	var primaryEmployeeRelationObj = document.getElementById("primary_employee_relation");
	primaryEmployeeRelationObj.disabled = disable;

	var primaryCorporateDocContentObj = document.getElementById("primary_corporate_doc_content_bytea1");
	if (primaryCorporateDocContentObj != null) primaryCorporateDocContentObj.disabled = disable;

	var primaryCorporatePasteObj = document.getElementById("primarySponsorC");
	if (primaryCorporatePasteObj != null) primaryCorporatePasteObj.style.display = (disable == true ? 'none' : 'block');

	var primaryCorporateViewObj = document.getElementById("viewPrimarySponsorC");
	if (primaryCorporateViewObj != null) primaryCorporateViewObj.style.display = (disable == true ? 'none' : 'block');
}

function enableDisablePrimaryNationalDetails(disable, approvalAmtEnableDisable) {

	var primaryCorporateObj = document.getElementById("primary_national_sponsor");
	primaryCorporateObj.disabled = disable;

	//var primaryNationalApprovalObj = document.getElementById("primary_national_approval");
	//primaryNationalApprovalObj.disabled = approvalAmtEnableDisable;

	var primaryNationalMemberIdObj = document.getElementById("primary_national_member_id");
	primaryNationalMemberIdObj.disabled = disable;

	var primaryNationalMemberNameObj = document.getElementById("primary_national_member_name");
	primaryNationalMemberNameObj.disabled = disable;

	var primaryNationalRelationObj = document.getElementById("primary_national_relation");
	primaryNationalRelationObj.disabled = disable;

	var primaryNationalDocContentObj = document.getElementById("primary_national_doc_content_bytea1");
	if (primaryNationalDocContentObj != null) primaryNationalDocContentObj.disabled = disable;

	var primaryNationalPasteObj = document.getElementById("primarySponsorN");
	if (primaryNationalPasteObj != null) primaryNationalPasteObj.style.display = (disable == true ? 'none' : 'block');

	var primaryNationalViewObj = document.getElementById("viewPrimarySponsorN");
	if (primaryNationalViewObj != null) primaryNationalViewObj.style.display = (disable == true ? 'none' : 'block');
}

function enableDisableSecondaryInsuranceDetails(disable, approvalAmtEnableDisable) {
	var secondarySponsorIdObj = document.getElementById("secondary_sponsor_id");
	secondarySponsorIdObj.disabled = disable;

	var secondaryInsuranceIdObj = document.getElementById("secondary_insurance_co");
	if (disable)
		secondaryInsuranceIdObj.disabled = disable;
	else
		secondaryInsuranceIdObj.removeAttribute("disabled");

	//var secondaryInsuranceApprovalObj = document.getElementById("secondary_insurance_approval");
	//secondaryInsuranceApprovalObj.disabled = approvalAmtEnableDisable;

	var secondaryPlanTypeObj = document.getElementById("secondary_plan_type");
	if (secondaryPlanTypeObj != null) secondaryPlanTypeObj.disabled = disable;

	var secondaryPlanIdObj = document.getElementById("secondary_plan_id");
	if (secondaryPlanIdObj != null) secondaryPlanIdObj.disabled = disable;

	var secondaryDrgCheckObj = document.getElementById("secondary_drg_check");
	var secondaryUseDrgObj = document.getElementById("secondary_use_drg");
	if (secondaryDrgCheckObj != null) secondaryDrgCheckObj.checked = false;
	if (secondaryDrgCheckObj != null) secondaryDrgCheckObj.disabled = disable;

	var secondaryMemberIdObj = document.getElementById("secondary_member_id");
	if (secondaryMemberIdObj != null) secondaryMemberIdObj.disabled = disable;

	var secondaryPolicyValidityStartObj = document.getElementById("secondary_policy_validity_start");
	if (secondaryPolicyValidityStartObj != null) secondaryPolicyValidityStartObj.disabled = disable;

	var secondaryInsuranceDocContentObj = document.getElementById("secondary_insurance_doc_content_bytea1");
	var secondaryInsurancePasteObj = document.getElementById("secondarySponsorI");
	var secondaryInsuranceViewObj = document.getElementById("viewSecondarySponsorI");

	var secondaryPolicyValidityEndObj = document.getElementById("secondary_policy_validity_end");
	if (secondaryPlanTypeObj != null) {
		if (trimAll(secondaryPolicyValidityEndObj.value) != '') {
			secondaryPolicyValidityEndObj.disabled = disable;
			if (secondaryInsuranceDocContentObj != null) secondaryInsuranceDocContentObj.disabled = disable;
			if (secondaryInsurancePasteObj != null) secondaryInsurancePasteObj.style.display = (disable == true ? 'none' : 'block');
			if (secondaryInsuranceViewObj != null) secondaryInsuranceViewObj.style.display = (disable == true ? 'none' : 'block');
		} else {
			secondaryPolicyValidityEndObj.disabled = false;
			if (secondaryInsuranceDocContentObj != null) secondaryInsuranceDocContentObj.disabled = false;
			if (secondaryInsurancePasteObj != null) secondaryInsurancePasteObj.style.display = (disable == true ? 'none' : 'block');
			if (secondaryInsuranceViewObj != null) secondaryInsuranceViewObj.style.display = (disable == true ? 'none' : 'block');
		}
	}

	var secondaryPolicyNumberObj = document.getElementById("secondary_policy_number");
	if (secondaryPolicyNumberObj != null) secondaryPolicyNumberObj.disabled = disable;

	var secondaryPolicyHolderObj = document.getElementById("secondary_policy_holder_name");
	if (secondaryPolicyHolderObj != null) secondaryPolicyHolderObj.disabled = disable;

	var secondaryPatientRelationshipObj = document.getElementById("secondary_patient_relationship");
	if (secondaryPatientRelationshipObj != null) secondaryPatientRelationshipObj.disabled = disable;

	var secondaryPriorAuthIddObj = document.getElementById("secondary_prior_auth_id");
	if (secondaryPriorAuthIddObj != null) secondaryPriorAuthIddObj.disabled = disable;
	var secondaryPriorAuthModeIdObj = document.getElementById("secondary_prior_auth_mode_id");
	if (secondaryPriorAuthModeIdObj != null) {
		if (disable) secondaryPriorAuthModeIdObj.disabled = disable;
		else secondaryPriorAuthModeIdObj.removeAttribute("disabled");
	}
}

function enableDisableSecondaryCorporateDetails(disable, approvalAmtEnableDisable) {

	var secondaryCorporateObj = document.getElementById("secondary_corporate");
	secondaryCorporateObj.disabled = disable;

	//var secondaryCorporateApprovalObj = document.getElementById("secondary_corporate_approval");
	//secondaryCorporateApprovalObj.disabled = approvalAmtEnableDisable;

	var secondaryEmployeeIdObj = document.getElementById("secondary_employee_id");
	secondaryEmployeeIdObj.disabled = disable;

	var secondaryEmployeeNameObj = document.getElementById("secondary_employee_name");
	secondaryEmployeeNameObj.disabled = disable;

	var secondaryEmployeeRelationObj = document.getElementById("secondary_employee_relation");
	secondaryEmployeeRelationObj.disabled = disable;

	var secondaryCorporateDocContentObj = document.getElementById("secondary_corporate_doc_content_bytea1");
	if (secondaryCorporateDocContentObj != null) secondaryCorporateDocContentObj.disabled = disable;

	var secondaryCorporatePasteObj = document.getElementById("secondarySponsorC");
	if (secondaryCorporatePasteObj != null) secondaryCorporatePasteObj.style.display = (disable == true ? 'none' : 'block');

	var secondaryCorporateViewObj = document.getElementById("viewSecondarySponsorC");
	if (secondaryCorporateViewObj != null) secondaryCorporateViewObj.style.display = (disable == true ? 'none' : 'block');
}

function enableDisableSecondaryNationalDetails(disable, approvalAmtEnableDisable) {

	var secondaryCorporateObj = document.getElementById("secondary_national_sponsor");
	secondaryCorporateObj.disabled = disable;

	//var secondaryNationalApprovalObj = document.getElementById("secondary_national_approval");
	//secondaryNationalApprovalObj.disabled = approvalAmtEnableDisable;

	var secondaryNationalMemberIdObj = document.getElementById("secondary_national_member_id");
	secondaryNationalMemberIdObj.disabled = disable;

	var secondaryNationalMemberNameObj = document.getElementById("secondary_national_member_name");
	secondaryNationalMemberNameObj.disabled = disable;

	var secondaryNationalRelationObj = document.getElementById("secondary_national_relation");
	secondaryNationalRelationObj.disabled = disable;

	var secondaryNationalDocContentObj = document.getElementById("secondary_national_doc_content_bytea1");
	if (secondaryNationalDocContentObj != null) secondaryNationalDocContentObj.disabled = disable;

	var secondaryNationalPasteObj = document.getElementById("secondarySponsorN");
	if (secondaryNationalPasteObj != null) secondaryNationalPasteObj.style.display = (disable == true ? 'none' : 'block');

	var secondaryNationalViewObj = document.getElementById("viewSecondarySponsorN");
	if (secondaryNationalViewObj != null) secondaryNationalViewObj.style.display = (disable == true ? 'none' : 'block');
}

/**********************************************************************/
function getPrimarySponsorObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_sponsor_id");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primary_corporate");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primary_national_sponsor");
	}
	return null;
}

function getSecondarySponsorObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_sponsor_id");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondary_corporate");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondary_national_sponsor");
	}
	return null;
}

function getPrimarySponsorTypeObj() {
	return  document.getElementById("primary_sponsor");
}

function getSecondarySponsorTypeObj() {
	return  document.getElementById("secondary_sponsor");
}

function getPrimaryInsuObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_co");
	}else return null;
}

function getSecondaryInsuObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_insurance_co");
	}else return null;
}

function getPrimaryPlanTypeObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_plan_type");
	}else return null;
}

function getSecondaryPlanTypeObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_plan_type");
	}else return null;
}

function getPrimaryPlanObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_plan_id");
	}else return null;
}

function getSecondaryPlanObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_plan_id");
	}else return null;
}
/*********************************************************************/

function getPrimaryPolicyValidityStartObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_policy_validity_start");
	}else return null;
}

function getSecondaryPolicyValidityStartObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_policy_validity_start");
	}else return null;
}

function getPrimaryPolicyValidityEndObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_policy_validity_end");
	}else return null;
}

function getSecondaryPolicyValidityEndObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_policy_validity_end");
	}else return null;
}

function getPrimaryInsuranceMemberIdObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_member_id");
	}else return null;
}

function getSecondaryInsuranceMemberIdObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_member_id");
	} else {
		return null;
	}
}

function getPrimaryMemberIdObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_member_id");
	} else if(primarySponsorObj.value == 'N'){
		return document.getElementById("primary_national_member_id");
	}else if(primarySponsorObj.value == 'C') {
		return document.getElementById("primary_employee_id");
	}else return null;
}

function getSecondaryMemberIdObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_member_id");
	}else if( secondarySponsorObj.value  == 'N'){
		return document.getElementById("secondary_national_member_id");
	}else if(secondarySponsorObj.value  == 'C') {
		return document.getElementById("secondary_employee_id");
	} else {
		return null;
	}
}

function getPrimaryInsurancePolicyNumberObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I')
		return document.getElementById("primary_policy_number");
	return null;
}

function getSecondaryInsurancePolicyNumberObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I')
		return document.getElementById("secondary_policy_number");
	return null;
}

function getPrimaryPatientHolderObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_policy_holder_name");
	}else if( primarySponsorObj.value  == 'N'){
		return document.getElementById("primary_national_member_name");
	}else if(primarySponsorObj.value  == 'C') {
		return document.getElementById("primary_employee_name");
	} else {
		return null;
	}
}

function getSecondaryPatientHolderObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_policy_holder_name");
	}else if( secondarySponsorObj.value  == 'N'){
		return document.getElementById("secondary_national_member_name");
	}else if(secondarySponsorObj.value  == 'C') {
		return document.getElementById("secondary_employee_name");
	} else {
		return null;
	}
}

function getPrimaryPatientRelationObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_patient_relationship");
	}else if( primarySponsorObj.value  == 'N'){
		return document.getElementById("primary_national_relation");
	}else if(primarySponsorObj.value  == 'C') {
		return document.getElementById("primary_employee_relation");
	} else {
		return null;
	}
}

function getSecondaryPatientRelationObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_patient_relationship");
	}else if( secondarySponsorObj.value  == 'N'){
		return document.getElementById("secondary_national_relation");
	}else if(secondarySponsorObj.value  == 'C') {
		return document.getElementById("secondary_employee_relation");
	} else {
		return null;
	}
}
/*********************************************************************/

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

function getSecondaryApprovalLimitObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_insurance_approval");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondary_corporate_approval");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondary_national_approval");
	}
	return null;
}

function getPrimaryDRGCheckObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_drg_check");
	}else return null;
}

function getSecondaryDRGCheckObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_drg_check");
	}else return null;
}

function getPrimaryUseDRGObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_use_drg");
	}else return null;
}

function getSecondaryUseDRGObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_use_drg");
	}else return null;
}

function getPrimaryDocContentObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_doc_content_bytea1");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primary_corporate_doc_content_bytea1");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primary_national_doc_content_bytea1");
	}
	return null;
}

function getSecondaryDocContentObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_insurance_doc_content_bytea1");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondary_corporate_doc_content_bytea1");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondary_national_doc_content_bytea1");
	}
	return null;
}

function getPrimaryDocNameObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_insurance_doc_name1");
	}else if (primarySponsorObj.value == 'C') {
		return document.getElementById("primary_corporate_doc_name1");
	}else if (primarySponsorObj.value == 'N') {
		return document.getElementById("primary_national_doc_name1");
	}
	return null;
}

function getSecondaryDocNameObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_insurance_doc_name1");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondary_corporate_doc_name1");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondary_national_doc_name1");
	}
	return null;
}
/**********************************************************************/

function getPrimaryAuthIdObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_prior_auth_id");
	}
	return null;
}

function getSecondaryAuthIdObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_prior_auth_id");
	}
	return null;
}

function getPrimaryAuthModeIdObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_prior_auth_mode_id");
	}
	return null;
}

function getSecondaryAuthModeIdObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_prior_auth_mode_id");
	}
	return null;
}

/***********************************************************************/

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

function getSecondaryApprovalLimitStarObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_insurance_approval_star");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondary_corporate_approval_star");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondary_national_approval_star");
	}
	return null;
}

function getPrimaryPolicyValidityStartStarObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_policy_validity_start_star");
	}else return null;
}

function getSecondaryPolicyValidityStartStarObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_policy_validity_start_star");
	}else return null;
}

function getPrimaryPolicyValidityEndStarObj() {
	var primarySponsorObj = document.getElementById("primary_sponsor");
	if (primarySponsorObj.value == 'I') {
		return document.getElementById("primary_policy_validity_end_star");
	}else return null;
}

function getSecondaryPolicyValidityEndStarObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondary_policy_validity_end_star");
	}else return null;
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

function getSecondaryUploadRowObj() {
	var secondarySponsorObj = document.getElementById("secondary_sponsor");
	if (secondarySponsorObj.value == 'I') {
		return document.getElementById("secondaryInsFile");
	}else if (secondarySponsorObj.value == 'C') {
		return document.getElementById("secondaryCorporateFile");
	}else if (secondarySponsorObj.value == 'N') {
		return document.getElementById("secondaryNationalFile");
	}
	return null;
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
	else if (planName == "secondary")
		button = document.getElementById('pd_secondary_planButton');

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
	else if (planName == "secondary")
		planId = document.getElementById('secondary_plan_id').value;
	if (!empty(planId)) {
		var ajaxReqObject = newXMLHttpRequest();
		var url = "./QuickEstimate.do?_method=getPlanDetails"
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
		} else {
			document.getElementById('secondary_plan_div').title = planDetails.plan_name != null ? (planDetails.plan_name) : "";
		}
	} else {
		document.getElementById('plan_exclusions').textContent = "";
		document.getElementById('plan_notes').textContent = "";
		if (planName =="primary") {
			document.getElementById('primary_plan_div').title = "";
		}
		else {
			document.getElementById('secondary_plan_div').title = "";
		}
	}
}

function insuPrimaryViewDoc(obj){



     var insuconame=obj.value;
     var docname = findInList(insuCompanyDetails, "insurance_co_id", insuconame);
     var insufilename=docname.insurance_rules_doc_name;

     if(!empty(insufilename)) {
     if(!empty(insuconame)) {
		var insUrl = cpath+"/master/InsuranceCompMaster.do?_method=getviewInsuDocument";
		insUrl += "&inscoid=" + insuconame;
		if(document.getElementById('a1')) {
			document.getElementById('a1').href = insUrl;
			document.getElementById('viewinsuranceprimaryruledocs').style.display = 'block';

        } else {
        	var aTag = document.createElement('a');
			aTag.setAttribute('id',"a1");
			aTag.setAttribute('href',insUrl);
			aTag.setAttribute('target','_blank');
			aTag.innerHTML = "Rules Document";
			document.getElementById('viewinsuranceprimaryruledocs').appendChild(aTag);
			document.getElementById('viewinsuranceprimaryruledocs').style.display = 'block';

		}

	 	}
       } else {
              document.getElementById('viewinsuranceprimaryruledocs').style.display = 'none';
           }


}

function insuSecondaryViewDoc(obj){

      var secondaryinsdoc=obj.value;
      var secdocname = findInList(insuCompanyDetails, "insurance_co_id", secondaryinsdoc);
      var secinsufilename=secdocname.insurance_rules_doc_name;
      if(!empty(secinsufilename)) {
      if(!empty(secondaryinsdoc)) {
		var inssecUrl = cpath+"/master/InsuranceCompMaster.do?_method=getviewInsuDocument";
		inssecUrl += "&inscoid=" + secondaryinsdoc;
		if(document.getElementById('b1')) {
			document.getElementById('b1').href = inssecUrl;
			document.getElementById('viewinsurancesecondaryruledocs').style.display = 'block';
        } else {
            var aTag = document.createElement('a');
			aTag.setAttribute('id',"b1");
			aTag.setAttribute('href',inssecUrl);
			aTag.setAttribute('target','_blank');
			aTag.innerHTML = "Rules Document";
			document.getElementById('viewinsurancesecondaryruledocs').appendChild(aTag);
			document.getElementById('viewinsurancesecondaryruledocs').style.display = 'block';

		}
	 }
       } else{
              document.getElementById('viewinsurancesecondaryruledocs').style.display = 'none';

          }
}





