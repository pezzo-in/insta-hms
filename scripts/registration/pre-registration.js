function hotKeys() {
	/**
	* which will adds the keylistener for the document(for key Alt + Shift + P).
	* toggles the Patient Details Collapsible Panel.
	*/
	var addInfoKeyListener = new YAHOO.util.KeyListener(document, { alt:true, shift: true, keys:73 }, { fn:toggleCollapsiblePanel,
					scope:CollapsiblePanel1,
					correctScope:true} );
	addInfoKeyListener.enable();
}

var customFieldList = null;
function initPreRegistration() {
	hotKeys();

	// Custom fields
	getCustomFieldList();

	// Create custom field list and filter according to display preferences.
	setCustomFieldList();

	initializeOnLoad();
	initLightbox();
	initAutocompletes();

	var notNewRegistration = (document.mainform.mr_no.value != null && document.mainform.mr_no.value != "")?true:false;
	if(notNewRegistration)
		Insta.initMRNoAcSearch(cpath, 'original_mr_no', 'mrnoContainer', 'all', null, null,null,'Save');

	CategoryList();
	categoryChange();
	showHideCaseFile();

	markCustomFieldsReadonly(notNewRegistration);

	document.mainform.salutation.focus();

	if (document.mainform.patient_category_id != null)
		sortDropDown(document.mainform.patient_category_id);

	if (document.mainform.is_duplicate != null) {
		if(originalMrNo == '')
			document.mainform.is_duplicate.checked = false;
		else
			document.mainform.is_duplicate.checked = true;

		document.mainform.original_mr_no.value = originalMrNo;
		isDuplicateChecked();
	}
// for four parts name while we editing registration we can split the middle name & show in different text boxes
	var name_parts_pref = document.getElementById("name_parts_pref").value;
	if(name_parts_pref == 4){
		var middle_name = document.getElementById("middle_name_split").value;
		if(middle_name != null && middle_name !='' && middle_name != undefined){
			if(middle_name.contains(" ")){
				document.getElementById("middle_name").value = middle_name.substr(0,middle_name.indexOf(" "));
				document.getElementById("middle_name2").value = middle_name.substr(middle_name.indexOf(" ")+1,middle_name.length-1);
			}
			else
				document.getElementById("middle_name").value = middle_name;
		}
	}

}

function isNewGenReg() {
    var radios = document.mrnoform.regType;
    for (var i=0; i<radios.length; i++) {
        if (radios[i].checked == true) {
            var value = radios[i].value;
            return value == 'new' ? true : false;
        }
    }
    return false;
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
	if (!empty(defaultPatientCategory) || !empty(savedPatientCategoryId)) {
		setSelectedIndex(categoryObj, !empty(savedPatientCategoryId) ? savedPatientCategoryId : defaultPatientCategory);
	} else {
		// if there is only one category found, then default it.
		if (len == 2)
			categoryObj.options.selectedIndex = 1;
		else
			setSelectedIndex(categoryObj, "");

	}
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
	}, {
		display: regPref.custom_field15_show,
		label: custom_field15_label
	}, {
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


function initializeOnLoad() {
	if (document.mainform.mr_no.value != "") { //loaded with existing
		var pdob = document.mainform.pdateofbirth.value;
		if(document.mainform.patient_category_id!=null){
			setSelectedIndex(document.mainform.patient_category_id, document.mainform.categoryId.value);
			document.mainform.patient_category_id.disabled = true;
		}

		var element = document.getElementsByName("category_expiry_date");
		for(var i=0; i<element.length;i++){
			var obj = element[i];
			var expiryDate = document.mainform.categoryExpiryDate.value;
			if(expiryDate!=""){
				if(obj.getAttribute("name")=="category_expiry_date"){
					var yy = expiryDate.substring(0, 4);
					var mm = expiryDate.substring(5, 7);
					var dd = expiryDate.substring(8, expiryDate.length);
					document.mainform.category_expiry_date.value=dd+'-'+mm+'-'+yy;
				}
			}
		}

		if (pdob != '') {
			setGenDateOfBirthFields('dob', parseFloat(pdob));
		}
		document.mainform.register.value="Save";
		if(document.mainform.photosize.value==0){
			document.getElementById('viewPhoto').style.display='none';
		}else{
			document.getElementById('viewPhoto').style.display='block';
		}
	} else { //new registration
		document.mainform.patient_name.readOnly = false;
		document.mainform.register.value="Register";
		setDefaultCity();
	}
	if (document.mainform.category_expiry_date!=null)
		document.mainform.category_expiry_date.disabled = true;
}

function setGenDateOfBirthFields(prefix, dateNum) {
    var dt = new Date(dateNum);
    document.getElementById(prefix+"Year").value = dt.getFullYear();
    document.getElementById(prefix+"Day").value = dt.getDate();
    document.getElementById(prefix+"Month").value = dt.getMonth()+1;
}

/*function validatePatientRegister() {
	var flag = true;
	var firstName = trim(document.getElementById('patient_name').value);
	var middleName = trim(document.getElementById('middle_name').value);
	var lastName = trim(document.getElementById('last_name').value);

	if (middleName == '' || middleName == "..MiddleName..") middleName = '';
	if (lastName == '' || lastName == "..LastName..") lastName = '';

	var gender = document.mainform.patient_gender.options[document.mainform.patient_gender.options.selectedIndex].value;
	var age = document.mainform.age.value;
	var dob = document.mainform.dateOfBirth.value;

	var url = cpath+"/pages/registration/regUtils.do?_method=checkPatientDetailsExists&firstName=" + firstName
			+ "&middleName=" + middleName + "&lastName=" + lastName + "&gender=" + gender + "&age=" + age + "&dob=" + dob;
	var reqObject = newXMLHttpRequest();
	reqObject.open("POST", url.toString(), false);
	reqObject.send(null);
	if (reqObject.readyState == 4) {
		if ((reqObject.status == 200) && (reqObject.responseText != null)) {
			flag = getPatientInfo(reqObject.responseText);
		}
	}
	return flag;
}

function getPatientInfo(responseData) {
	existingPatientDetails = null;
	var existingMrNo = document.mainform.mr_no.value;
	existingMrNo = empty(existingMrNo) ? null : existingMrNo;
	eval("existingPatientDetails =" + responseData);
	if (!empty(existingPatientDetails) && existingMrNo != existingPatientDetails.mr_no) {
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

		alert(getString("js.registration.patient.patient.with.following.details.already.exists.string")+" " +
					" \n " + " \n"+" "+getString("js.registration.patient.mr.no.string")+" " + existingPatientDetails.mr_no +
					" \n " +getString("js.registration.patient.first.name.string")+" " + existingPatientDetails.patient_name +
					" \n " +getString("js.registration.patient.middle.name.string")+" " + middleName +
					" \n " +getString("js.registration.patient.last.name.string")+" "+ lastName +
					" \n " +getString("js.registration.patient.gender.string")+" "+ existingPatientDetails.patient_gender  +
					" \n " +getString("js.registration.patient.age.date.of.birth.string")+" "+ ageAndDOB);

		return false;
	}

	return true;
}*/


function updateRecord() {
	if(patientDetailsValidation()==false){
		return false;
	}

	if (document.mainform.patient_category_id != null) {
		if (!validateRequired(document.mainform.patient_category_id, patientCategoryLabel+" is required."))
			return false;
	}

	if(patientAdditionalFieldsValidation()==false){
		return false;
	}

	//if (!validateCategoryExpiryDate()) return false;

	var visitType = "";
	if (mainPagefieldsList.length > 0) {
		for (var i=0;i<mainPagefieldsList.length;i++) {
			var custfieldObj = customFieldValidation(visitType, mainPagefieldsList[i]);
			if (custfieldObj != null) {
				CollapsiblePanel1.open();
				document.getElementsByName(custfieldObj)[0].focus();
				return false;
			}
		}
	}
	if (dialogFieldsList.length > 0) {
		for (var i=0;i<dialogFieldsList.length;i++) {
			var custfieldObj = customFieldValidation(visitType, dialogFieldsList[i]);
			if (custfieldObj != null) {
				CollapsiblePanel1.open();
				document.getElementsByName(custfieldObj)[0].focus();
			  	return false;
			}
		}
	}

	if (!validateOnChangePatientCategory()) return false;

	var notNewRegistration = (document.mainform.mr_no.value != null && document.mainform.mr_no.value != "")?true:false;
	if(notNewRegistration) {
		if(document.mainform.mr_no.value == document.mainform.original_mr_no.value) {
			showMesssage("js.registration.preregistration.duplicatemrno");
			document.mainform.is_duplicate.checked = false;
			document.mainform.original_mr_no.disabled = true;
			document.mainform.original_mr_no.value='';
			return false;
		}
	}

	enableCustomLists();

	document.mainform.patient_gender.disabled = false;
	document.mainform.ageIn.disabled = false;

	document.mainform.submit();
	return true;
}

function isDuplicateChecked() {
	var duplicateChk = document.mainform.is_duplicate;
	if(!duplicateChk.checked) {
		document.mainform.original_mr_no.disabled = true;
		document.mainform.original_mr_no.value='';
	}
	else {
		document.mainform.original_mr_no.disabled = false;
	}
}
