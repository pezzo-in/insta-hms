
function toggleCollapsiblePanel() {
	if (CollapsiblePanel1.isOpen()) CollapsiblePanel1.close();
	else CollapsiblePanel1.open();
}

function toggleVisitCollapsiblePanel() {
	if (VisitCollapsiblePanel1 != null) {
		if (VisitCollapsiblePanel1.isOpen()) VisitCollapsiblePanel1.close();
		else VisitCollapsiblePanel1.open();
	}
}

// Gender
function salutationChange() {
	var title = getSelText(document.mainform.salutation);
	if (title != "" && document.mainform.salutation.value != "") {
		for(var i=0;i<salutationJSON.length;i++) {
			var item  = salutationJSON[i];
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

function enableVipStatus() {
	var vip = document.mainform.vip_check;
	var vipStatus = vip.checked ? 'Y' : 'N';
	document.mainform.vip_status.value = vipStatus;
}

function setDeptAllowedGender(deptId) {
	if (deptId != '') {
		var dept = findInList(deptList, 'dept_id', deptId);
		document.mainform.dept_allowed_gender.value = dept.allowed_gender;
	}
}

function enableCaseFileAutoGen() {
	var no = document.getElementById('casefileNo').value;
	if (no == null || no == '') {
		document.mainform.oldRegAutoGenerate.disabled = false;
	}else{
		document.mainform.oldRegAutoGenerate.disabled = true;
	}
}

// Validate case file no.
function checkUniqueCasefileNo() {
	var no = document.getElementById('casefileNo').value;
	if (no == null || no == '') return false;
    var validate = function(response, code) {
    	var responsetext = eval(response);
        if (responsetext == "true") {
        	showMessage( "js.registration.patient.case.file.number.already.exists.string");
            document.mainform.casefileNo.value="";
            document.mainform.casefileNo.focus();
        }
	}
	if (no != null || no != '') {
        Ajax.get(cpath+"/pages/registration/regUtils.do?_method=checkCaseFileNo&casefileno="+no, validate);
	}
}

function enableOldmrno() {
	var autoGen = document.mainform.oldRegAutoGenerate;
	var readonly = document.mainform.casefileNo.readOnly;
	document.mainform.casefileNo.readOnly = !readonly;
}

// Validate old mrno
function checkUniqueOldMrno(){
	var no = document.getElementById('oldmrno').value;
	if (no == null || no == '') return false;
    var validate = function(response, code) {
	    document.mainform.previoushospimg.style.visibility="hidden";
    	var responsetext = eval(response);
        if (responsetext == "true") {
        	alert( oldRegNumFieldText + " "+getString("js.registration.patient.already.exists.string"));
            document.mainform.oldmrno.value="";
            document.mainform.oldmrno.focus();
        }
	}
	if (no != null || no != '') {
    	document.mainform.previoushospimg.style.visibility="visible";
        Ajax.get(cpath+"/pages/registration/regUtils.do?_method=checkOldMrno&oldno="+no, validate);
	}
}

function categoryChange() {
	if (document.mainform.patient_category_id != null) {
		if ((document.mainform.patient_category_id.value=="") && (document.mainform.category_expiry_date!=null)) {
			document.mainform.category_expiry_date.value = '';
			document.mainform.category_expiry_date.disabled = true;
		} else if (document.mainform.category_expiry_date!=null) {
			document.mainform.category_expiry_date.disabled = false;
		}
	}
}

function initAutocompletes(){
	initAutoArea("patient_area","area_dropdown", "area_id");
	initAutoCityStateCountry("pat_city_name","city_state_country_dropdown", "city_id");
}

function initAutoArea(patientareaname,areadropdown,areaid){
	var areaAuthJson = {result: areaListJSON};
	dataSource  = new YAHOO.util.LocalDataSource(areaAuthJson, { queryMatchContains : true } );
	dataSource.responseType = YAHOO.util.LocalDataSource.TYPE_JSON;
	dataSource.responseSchema = {
		resultsList : "result",
		fields: [{key: "area_name"},
				 {key: "area_id"}]
		};

	oAutoComp = new YAHOO.widget.AutoComplete(patientareaname,areadropdown,dataSource);

	oAutoComp.prehighlightClassName = "yui-ac-prehighlight";
	oAutoComp.maxResultsDisplayed = 5;
	oAutoComp.allowBrowserAutocomplete = false;
	oAutoComp.typeAhead = false;
	oAutoComp.useShadow = false;
	oAutoComp.minQueryLength = 0;
	oAutoComp.forceSelection = false;
	oAutoComp.resultTypeList= false;

	oAutoComp.itemSelectEvent.subscribe(function(oSelf, elItem) {
		var record = elItem[2];
		YAHOO.util.Dom.get('patient_area').value = record.area_name;
		YAHOO.util.Dom.get('area_id').value = record.area_id;
		if (YAHOO.util.Dom.get('patient_area').value == '') {
			YAHOO.util.Dom.get('area_id').value = '';
		}
	});
	oAutoComp.textboxBlurEvent.subscribe(function(oAutoComp) {
		var index=true;
		for (var i=0;i<areaListJSON.length;i++) {
			var record=areaListJSON[i];
			if (record["area_name"] == YAHOO.util.Dom.get('patient_area').value && YAHOO.util.Dom.get('area_id').value == record["area_id"]) {
				index=false;
				break;
			}
		}
		if(index) {
			YAHOO.util.Dom.get('area_id').value = '';

		}
	});
	oAutoComp.selectionEnforceEvent.subscribe(function() {
		YAHOO.util.Dom.get('area_id').value = '';
	});
}

function initAutoCityStateCountry(patientcityname,citydropdown,patientcityid,cityid) {
	var cityAuthJson = {result:cityStateCountryJSON};
	dataSource  = new YAHOO.util.LocalDataSource(cityAuthJson, { queryMatchContains : true } );
	dataSource.responseType = YAHOO.util.LocalDataSource.TYPE_JSON;
	dataSource.responseSchema = {
		resultsList : "result",
		fields: [{key: "city_state_country_name"},
				 {key: "city_name"},
				 {key: "city_id"},
				 {key: "state_name"},
				 {key: "state_id"},
				 {key: "country_name"},
				 {key: "country_id"}
				]
		};

	oAutoComp = new YAHOO.widget.AutoComplete(patientcityname, citydropdown, dataSource);

	oAutoComp.prehighlightClassName = "yui-ac-prehighlight";
	oAutoComp.maxResultsDisplayed = 5;
	oAutoComp.allowBrowserAutocomplete = false;
	oAutoComp.typeAhead = false;
	oAutoComp.useShadow = false;
	oAutoComp.minQueryLength = 0;
	oAutoComp.forceSelection = true;
	oAutoComp.resultTypeList= false;
	oAutoComp._bItemSelected = true;

	oAutoComp.itemSelectEvent.subscribe(function(oSelf, elItem) {
		var record = elItem[2];
		YAHOO.util.Dom.get(patientcityname).value = record.city_name;
		YAHOO.util.Dom.get(patientcityid).value = record.city_id;
		document.getElementById("statelbl").textContent = record.state_name;
		YAHOO.util.Dom.get('state_id').value = record.state_id;
		YAHOO.util.Dom.get('country_id').value = record.country_id;
		document.getElementById("countrylbl").textContent = record.country_name;
	});
	oAutoComp.selectionEnforceEvent.subscribe(function() {
		YAHOO.util.Dom.get(patientcityid).value = '';
	});
	oAutoComp.textboxBlurEvent.subscribe(function(oAutoComp){
		var index=true;
		for (var i=0;i<cityStateCountryJSON.length;i++) {
			var record=cityStateCountryJSON[i];
				if (record["city_name"] == YAHOO.util.Dom.get('pat_city_name').value && YAHOO.util.Dom.get('city_id').value == record["city_id"]) {
					index=false;
					break;
				}
		}
		if(index) {
			YAHOO.util.Dom.get('city_id').value = '';
			document.getElementById("statelbl").textContent = '';
			YAHOO.util.Dom.get('state_id').value = '';
			YAHOO.util.Dom.get('country_id').value = '';
			document.getElementById("countrylbl").textContent = '';
		}
	});
}

// Function used in EditPatientVisit.jsp
function onChangeBedType(bedObj, wardObj) {
	if (bedObj != null) {
		var bedtyp = bedObj.value;
		if (bedtyp != '') {
			var ajaxobj = newXMLHttpRequest();
			var url = cpath+'/pages/registration/regUtils.do?_method=getWardnamesForBedType&selectedbedtype='+encodeURIComponent(bedtyp);
			var freebeds = 0;
			wardObj.length=1;
			wardObj.options[wardObj.length-1].text = getString("js.common.commonselectbox.defaultText");
			wardObj.options[wardObj.length-1].value = "";
			var ajaxobj = newXMLHttpRequest();
			ajaxobj.open("POST",url.toString(), false);
			ajaxobj.send(null);
			if (ajaxobj) {
				if (ajaxobj.readyState == 4) {
					if ( (ajaxobj.status == 200) && (ajaxobj.responseText!=null) ) {
						eval("var wards =" + ajaxobj.responseText);
						if (wards != null && wards != '') {
							var len = wards.length;
							for(var i=0;i<len;i++) {
								var record = wards[i];
								var bedNameObj= null;
								wardObj.length = wardObj.length + 1;
								bedNameObj= record == null? 0:  record.freebeds == null ||  record.freebeds== null ||  record.freebeds == ''? '0' :  (record.freebeds).toString();
								wardObj.options[wardObj.length-1].text = record.ward_name+ " ("+bedNameObj+" beds)";
								wardObj.options[wardObj.length-1].value = record.ward_no;
								freebeds = freebeds + record.freebeds == null || record.freebeds == ''? 0 : record.freebeds;
							}
						}
						if(freebeds == 0) {
							showMessage("js.registration.patient.no.free.beds.to.allocate.string");
						}
					}
				}
			}
		}else{
			bedObj.selectedIndex = 0;
			wardObj.selectedIndex = 0;
			wardObj.length = 1;
		}
	}
}


var referalArray = [];
function loadReferals() {
	if (referalsJSON != null) {
		referalArray.length = referalsJSON.length;
		for ( i=0 ; i< referalsJSON.length; i++){
			var item = referalsJSON[i];
			if (item["CLINICIAN_ID"]!=null && item["CLINICIAN_ID"]!="") {
				referalArray[i] = item["REF_NAME"]+"("+item["CLINICIAN_ID"]+")";
			} else {
				referalArray[i] = item["REF_NAME"];
			}
		}
	}
}

function referalAutoComplete(refId, refName, refContainer){

	YAHOO.example.ACJSAddArray = new function() {
		datasource = new YAHOO.widget.DS_JSArray(referalArray);
		var autoComp = new YAHOO.widget.AutoComplete(refName, refContainer ,datasource);

		autoComp.formatResult = Insta.autoHighlight;
		autoComp.prehighlightClassName = "yui-ac-prehighlight";
		autoComp.typeAhead = false;
		autoComp.useShadow = false;
		autoComp.allowBrowserAutocomplete = false;
		autoComp.queryMatchContains = true;
		autoComp.minQueryLength = 0;
		autoComp.maxResultsDisplayed = 20;
		autoComp.forceSelection = true;
		autoComp._bItemSelected = true;

		autoComp.textboxBlurEvent.subscribe(function() {
			var referralName = YAHOO.util.Dom.get(refName).value;
			if(referralName == '') {
				YAHOO.util.Dom.get(refId).value = '';
			}
		});

		autoComp.itemSelectEvent.subscribe(function() {
			var referralName = YAHOO.util.Dom.get(refName).value;
			if(referralName != '') {
				for ( var i=0 ; i< referalsJSON.length; i++){
					if (referalsJSON[i]["CLINICIAN_ID"]!=null && referalsJSON[i]["CLINICIAN_ID"]!="") {
						if(referralName == referalsJSON[i]["REF_NAME"]+"("+referalsJSON[i]["CLINICIAN_ID"]+")"){
							YAHOO.util.Dom.get(refId).value = referalsJSON[i]["REF_ID"];
							YAHOO.util.Dom.get(refName).value = referalsJSON[i]["REF_NAME"];
							if (document.mainform.clinician_id!=null) {
								document.mainform.clinician_id.value = referalsJSON[i]["CLINICIAN_ID"];
								document.getElementById('clinician_label').innerHTML = referalsJSON[i]["CLINICIAN_ID"];
							}
						}
					} else {
						if(referralName == referalsJSON[i]["REF_NAME"]){
							YAHOO.util.Dom.get(refId).value = referalsJSON[i]["REF_ID"];
							YAHOO.util.Dom.get(refName).value = referalsJSON[i]["REF_NAME"];
							if (document.mainform.clinician_id!=null) {
								document.mainform.clinician_id.value = referalsJSON[i]["CLINICIAN_ID"];
								document.getElementById('clinician_label').innerHTML = referalsJSON[i]["CLINICIAN_ID"];
							}
						}
					}
				}
			}else{
				YAHOO.util.Dom.get(refId).value = '';
			}
		});
	 }
}

var docAutoComp = null;
function initDoctorDept(dept) {

	if (docAutoComp != null) {
		docAutoComp.destroy();
	}

	var docDeptNameArray = [];
	var jDeptDocList = null;

	if(jDocDeptNameList !=null && jDocDeptNameList.length > 0) {
		if (dept != null && dept != '')
			jDeptDocList = filterList(jDocDeptNameList, 'dept_id', dept);
		else
			jDeptDocList = jDocDeptNameList;

		docDeptNameArray.length = jDeptDocList.length;

		for ( i=0 ; i< jDeptDocList.length; i++){
			var item = jDeptDocList[i];
			if (item["doctor_license_number"]!=null && item["doctor_license_number"]!="") {
				docDeptNameArray[i] = item["doctor_name"]+" ("+item["dept_name"]+")"+"("+item["doctor_license_number"]+")";
			} else {
				docDeptNameArray[i] = item["doctor_name"]+" ("+item["dept_name"]+")";
			}
		}
	}
	if(document.mainform.doctor_name != null) {
		YAHOO.example.ACJSAddArray = new function() {
			var dataSource = new YAHOO.widget.DS_JSArray(docDeptNameArray);
			docAutoComp = new YAHOO.widget.AutoComplete('doctor_name', 'doc_dept_dropdown', dataSource);
			docAutoComp.maxResultsDisplayed = 10;
			docAutoComp.queryMatchContains = true;
			docAutoComp.allowBrowserAutocomplete = false;
			docAutoComp.formatResult = Insta.autoHighlight;
			docAutoComp.prehighlightClassName = "yui-ac-prehighlight";
			docAutoComp.typeAhead = false;
			docAutoComp.useShadow = false;
			docAutoComp.minQueryLength = 0;
			docAutoComp.forceSelection = true;
			docAutoComp._bItemSelected = true;
			docAutoComp.textboxBlurEvent.subscribe(function() {
			var docName = document.mainform.doctor_name.value;
				if(docName == '') {
					document.mainform.doctor_name.removeAttribute("title");
					document.mainform.doctor.value = '';
					if (document.getElementById("docConsultationFees") != null) {
						setDocRevistCharge(document.mainform.doctor.value);
						document.mainform.consFees.value = 0;
						document.mainform.opdocchrg.value = 0;
						document.getElementById("docConsultationFees").textContent = '';
						estimateTotalAmount();
					}else if (document.getElementById("hasOpType") != null && !document.getElementById("hasOpType").disabled) {
						getPatientDoctorVisits(document.mainform.doctor.value);
					}
				}else {
					document.mainform.doctor_name.title = docName;
				}
			});
			docAutoComp.itemSelectEvent.subscribe(function() {
				var dName = document.mainform.doctor_name.value;
				if(dName != '') {
					for ( var i=0 ; i< jDeptDocList.length; i++){
						if (jDeptDocList[i]["doctor_license_number"]!=null && jDeptDocList[i]["doctor_license_number"]!="") {
							if(dName == jDeptDocList[i]["doctor_name"]+" ("+jDeptDocList[i]["dept_name"]+")"+"("+jDeptDocList[i]["doctor_license_number"]+")"){
								document.mainform.doctor.value = jDeptDocList[i]["doctor_id"];
								if (document.mainform.dept_name.value != jDeptDocList[i]["dept_id"]) {
									if (document.mainform.unit_id != null)
										document.mainform.unit_id.selectedIndex = 0;
										setSelectedIndex(document.mainform.dept_name, jDeptDocList[i]["dept_id"]);
										setDeptAllowedGender(jDeptDocList[i]["dept_id"]);
								}
								break;
							}
						} else {
							if(dName == jDeptDocList[i]["doctor_name"]+" ("+jDeptDocList[i]["dept_name"]+")"){
								document.mainform.doctor.value = jDeptDocList[i]["doctor_id"];
								if (document.mainform.dept_name.value != jDeptDocList[i]["dept_id"]) {
									if (document.mainform.unit_id != null)
										document.mainform.unit_id.selectedIndex = 0;
										setSelectedIndex(document.mainform.dept_name, jDeptDocList[i]["dept_id"]);
										setDeptAllowedGender(jDeptDocList[i]["dept_id"]);
								}
								break;
							}
						}
					}

					if (document.getElementById("docConsultationFees") != null) {
						gSelectedDoctorName = document.mainform.doctor_name.value;
						gSelectedDoctorId = document.mainform.doctor.value;
						setDocRevistCharge(document.mainform.doctor.value);
						getDoctorCharge();
						changeVisitType();
						loadPreviousUnOrderedPrescriptions();
						if (category != null && (category != 'SNP' || !empty(scheduleName)))
							loadSchedulerOrders();
						estimateTotalAmount();
					}else if (document.getElementById("hasOpType") != null && !document.getElementById("hasOpType").disabled) {
						if (gDoctorId != document.mainform.doctor.value) {
							getPatientDoctorVisits(document.mainform.doctor.value);
						}
					}

					if (document.getElementById("docConsultationFees") != null
						&& !empty(visitTypeDependence) && ((visitTypeDependence == 'D' && !empty(gPreviousVisitDoctor) && gPreviousVisitDoctor != document.mainform.doctor.value)
							 || (visitTypeDependence == 'S' && !empty(gPreviousVisitDoctor) && gPreviousVisitDept != dept))
						&& document.mainform.op_type != null
						&& (document.mainform.op_type.value == "F" || document.mainform.op_type.value == "D")) {
						var mrno = document.mrnoform.mrno.value;
						var mainVisitId = document.mainform.main_visit_id.value;
						//Before clearing the registration details set globally the selected doctor
						var doctorId = document.mainform.doctor.value;
						var doctorName = document.mainform.doctor_name.value;
						clearRegDetails();
						gSelectedDoctorName = doctorName;
						gSelectedDoctorId = doctorId;
						document.mrnoform.mrno.value = mrno;
						document.mainform.main_visit_id.value = mainVisitId;
						isDoctorChange = true;
						getRegDetails();
					}
					document.mainform.doctor_name.title = dName;
				}else{
					document.mainform.doctor.value = '';
					document.mainform.doctor_name.removeAttribute("title");
					document.mainform.dept_name.selectedIndex = 0;
					if (document.mainform.unit_id != null)
						document.mainform.unit_id.selectedIndex = 0;
					if (document.getElementById("docConsultationFees") != null) {
						gSelectedDoctorName = document.mainform.doctor_name.value;
						gSelectedDoctorId = document.mainform.doctor.value;
						setDocRevistCharge(document.mainform.doctor.value);
						document.mainform.consFees.value = 0;
						document.mainform.opdocchrg.value = 0;
						document.getElementById("docConsultationFees").textContent = '';
						estimateTotalAmount();
					}else if (document.getElementById("hasOpType") != null && !document.getElementById("hasOpType").disabled) {
						getPatientDoctorVisits(document.mainform.doctor.value);
					}
				}
				setPatientComplaint();
			});
		}
	}
}

function setDefaultCity() {
	document.mainform.patient_city.value = defaultCity;
	document.mainform.patient_state.value = defaultState;
	document.mainform.country.value = defaultCountry;

	document.mainform.pat_city_name.value = defaultCityName;
	document.getElementById("statelbl").textContent = defaultStateName;
	document.getElementById("countrylbl").textContent = defaultCountryName;
}

function loadDepartmentUnit(unitSelect, deptId) {
	var deptUnitList = filterList(unitList, "dept_id", deptId);
	if(deptUnitSetting != null && deptUnitSetting == 'M') {
		var index = 1;
	 	for (var i=0;i<deptUnitList.length;i++) {
			var item = deptUnitList[i];
			unitSelect.length = parseFloat(index)+parseFloat(1);
			unitSelect.options[index].text = item.unit_name;
			unitSelect.options[index].value = item.unit_id;
			index++;
	 	}
	 }else if(deptUnitSetting != null && deptUnitSetting == 'R') {
	 	var index = 1;
	 	var url = cpath+'/pages/registration/regUtils.do?_method=getDeptUnit&dept_id='+deptId;
		var ajaxobj = newXMLHttpRequest();
		ajaxobj.open("POST",url.toString(), false);
		ajaxobj.send(null);
		if (ajaxobj) {
			if (ajaxobj.readyState == 4) {
				if ( (ajaxobj.status == 200) && (ajaxobj.responseText!=null) ) {
					eval("var unitid = " + ajaxobj.responseText);
					if(unitid != null && unitid != '') {
						for (var i=0;i<deptUnitList.length;i++) {
							var item = deptUnitList[i];
							if (unitid == item.unit_id) {
								unitSelect.length = parseFloat(index)+parseFloat(1);
								unitSelect.options[index].text = item.unit_name;
								unitSelect.options[index].value = item.unit_id;
								index++;
							}
					 	}
				 	} else {
						unitSelect.length = parseFloat(1);
			 		}
				}
			}
		}
	}
}

/*
 * Check if user has entered any DOB. If not, we can use the age.
 * If the user has entered the DOB, that must be used.
 */
function isDOBEntered() {
    var strDay = document.mainform.dobDay.value;
    var strMonth = document.mainform.dobMonth.value;
    var strYear = document.mainform.dobYear.value;

    if ( (strDay == 'DD') && (strMonth == 'MM') && (strYear == 'YY') ) {
        return false;
    }
    if ( (strDay == '') && (strMonth == '') && (strYear == '') ) {
        return false;
    }
    return true;
}

//date of birth validation
function validateDOB() {
    var strDay = document.mainform.dobDay.value;
    var strMonth = document.mainform.dobMonth.value;
    var strYear = document.mainform.dobYear.value;

	if (strDay == "") {
		showMessage("js.registration.patient.date.required");
		setTimeout("document.mainform.dobDay.focus()",0);
		return null;
	}

	if (strMonth == "") {
		showMessage("js.registration.patient.month.required");
		setTimeout("document.mainform.dobMonth.focus()",0);
		return null;
	}

	if (strYear == "") {
		showMessage("js.registration.patient.year.required");
		return null;
	}

    if (!isInteger(strYear)) {
        showMessage("js.registration.patient.invalid.year.not.an.integer.string");
        return null;
    }
    if (!isInteger(strMonth)) {
        showMessage("js.registration.patient.invalid.month.not.an.integer.string");
	    setTimeout("document.mainform.dobMonth.focus()",0);
        return null;
    }
    if (!isInteger(strDay)) {
        showMessage("js.registration.patient.invalid.month.not.an.integer.string");
	    setTimeout("document.mainform.dobDay.focus()",0);
        return null;
    }

    if (parseInt(strDay) > 31) {
        showMessage("js.registration.patient.enter.correct.date.string");
	    setTimeout("document.mainform.dobDay.focus()",0);
        return null;
    }

    if (parseInt(strMonth) > 12) {
        showMessage("js.registration.patient.enter.correct.month.string");
	    setTimeout("document.mainform.dobMonth.focus()",0);
        return null;
    }

    if (strYear.length < 4) {
        var year = convertTwoDigitYear(parseInt(strYear,10));
        if (year < 1900) {
            alert(getString("Invalid year:")+" " + year +
                ". "+getString("js.registration.patient.must.be.two.digit.or.four.digit.year.string"));
	        setTimeout("document.mainform.dobYear.focus()",0);
            return null;
        }
        // silently set the 4-digit year back to the textbox, and get the new value
        document.mainform.dobYear.value = year;
        strYear = year.toString();
    }

    // check if a conversion gives us back the same numbers, or else, correct it
    // For example, 31 Sep will be converted to 01 Oct. We need to warn the user.
    var dob = getDateFromDDMMYY(strDay, strMonth, strYear);
    if (!dob) {
        showMessage("js.registration.patient.invalid.date.specification.string");
	    setTimeout("document.mainform.dobDay.focus()",0);
        return null;
    }

    if (dob > (new Date()) ) {
	    showMessage("js.registration.patient.date.of.birth.and.current.date.check.string");
	    setTimeout("document.mainform.dobDay.focus()",0);
		return null;
    }

    var newDate = dob.getDate();
    var newMonth = dob.getMonth();
    var newYear = dob.getFullYear();

    if ( (parseInt(strDay,10) != newDate) || (parseInt(strMonth,10) != newMonth + 1) ||
         (parseInt(strYear,10) != newYear) )  {

        // clear the new value in the text boxes and warn the user
        document.mainform.dobDay.value = "";
        //document.mainform.dobMonth.value = "";
        //document.mainform.dobYear.value = "";
        showMessage("js.registration.patient.valid.date.check.for.current.month.year.combination.string");
	    setTimeout("document.mainform.dobDay.focus()",0);
        return null;
    }

    return dob;
}

function getDateFromDDMMYY(strDay, strMonth, strYear) {
    if ( !(isInteger(strDay) && isInteger(strMonth) && isInteger(strYear)) ) {
        return null;
    }
    var year = parseInt(strYear, 10);
    var month = parseInt(strMonth, 10);
    var day = parseInt(strDay, 10);
    if (year < 100) {
        year = convertTwoDigitYear(year);
    }

    var dob = new Date(year, month-1, day);
    //alert("For year: " + year + " month " + month + " day " + day + " Got date: " + dob);
    return dob;
}

function convertTwoDigitYear(year) {
    // convert 2 digit years intelligently
    var now = new Date();
    var century = now.getFullYear();
    century = Math.floor(century/100) * 100;
    // say this is 2008. Century gives 2000
    if (year > now.getFullYear() - century) {
        // more than 08, (09 - 99), use last century (eg 1909 1999)
        year += century -100;
    } else {
        // else (eg 05), make it this century (2005)
        year += century;
    }
    return year;
}

function getAge(validate, validatedDob) {
	var dob = null;
	if (validate) {
	    if (!isDOBEntered()) {
	        return;
	    }
    	dob = validateDOB();
    } else {
    	dob = validatedDob;
    }
    if (dob) {
        var now = new Date();
        var oneDay = 1000 * 60 * 60 * 24 ;

        var age = (now - dob) / (oneDay);
        var ageIn = null;
        if (age < 31) {
        	age = Math.floor(age);
        	ageIn = 'D';
        } else if (age < 730) {
        	age = age / 30.43;
        	age = Math.floor(age);
        	ageIn = 'M';
        } else {
        	age = age / 365.25;
        	age = Math.floor(age);
        	ageIn = 'Y';
        }
        document.mainform.age.value = age;
        document.mainform.ageIn.value = ageIn;
        if (age >= 1000) {
        	showMessage("js.registration.patient.valid.age.check.string");
        	document.mainform.age.value = "";
        	setTimeout("document.mainform.dobDay.focus()", 0);
        	return false;
        }
    }
    return true;
}

function customVisitFieldValidation(visitType, customField) {
	for (var i=1; i<3; i++) {
		var label = eval("visit_custom_list" + i + "_name");
		var labelValidate = eval("visit_custom_list" + i + "_validate");
		var labelObj = eval("document.mainform.visit_custom_list"+i);

		if (customField == label && labelObj != null && labelObj.value == '') {
			if (labelValidate == 'A' || (labelValidate == 'I' && visitType == 'I') ||
					(labelValidate == 'O' && visitType == 'O')) {
				alert(label+ " "+getString("js.registration.patient.is.required.string"));
				return "visit_custom_list"+i;
			}
		}
	}

	for (var i=1; i<10; i++) {
		var label = eval("visit_custom_field" + i + "_name");
		var labelValidate = eval("visit_custom_field" + i + "_validate");
		var labelObj = eval("document.mainform.visit_custom_field"+i);

		if (customField == label && labelObj != null && labelObj.value == '') {
			if (labelValidate == 'A' || (labelValidate == 'I' && visitType == 'I') ||
					(labelValidate == 'O' && visitType == 'O')) {
				alert(label+ " "+getString("js.registration.patient.is.required.string"));
				return "visit_custom_field"+i;
			}
		}

		if(customField == label && labelObj != null && !empty(labelObj.value)) {
			if (i>3 && i<7) {
				if(!doValidateDateField(labelObj))
					return "visit_custom_field"+i;
			} else if (i > 6) {
				if (!isValidNumber(labelObj,"Y",label))
					return "visit_custom_field"+i;

				if(!validateAmount(labelObj,label+" "+getString("js.registration.patient.allowed.only.eight.digit.number")))
					return "visit_custom_field"+i;
			}
		}
	}
}

var visitFieldsList = [];

function getVisitCustomFieldList() {
	var j = 0;
	if (regPref == null) return;
	for (var i=1; i<3; i++) {
		eval("visit_custom_list"+i+"_name=regPref.visit_custom_list"+i+"_name");
		eval("visit_custom_list"+i+"_validate=regPref.visit_custom_list"+i+"_validate");

		var label = eval("visit_custom_list" + i + "_name");

		if (!empty(label)) {
			j++;
			visitFieldsList.length = j;
			visitFieldsList[j-1] = label;
		}
	}

	for (var i=1; i<10; i++) {
		eval("visit_custom_field"+i+"_name=regPref.visit_custom_field"+i+"_name");
		eval("visit_custom_field"+i+"_validate=regPref.visit_custom_field"+i+"_validate");

		var label = eval("visit_custom_field" + i + "_name");

		if (!empty(label)) {
			j++;
			visitFieldsList.length = j;
			visitFieldsList[j-1] = label;
		}
	}
}

var default_gp_first_consultation = null, default_gp_revisit_consultation = null,
	default_sp_first_consultation = null, default_sp_revisit_consultation = null,
	govtIDType = null, govtID = null,

	passportNoLabel = null, passportValidityLabel = null, passportIssueCountryLabel = null, visaValidityLabel = null,
	passportNoValidate = null, passportValidityValidate = null, passportIssueCountryValidate = null, visaValidityValidate = null,
	familyIDLabel = null, familyIDValidate = null ;

function getCustomFieldList() {

	for (var i=1; i<10; i++) {
		eval("custom_list"+i+"_name=regPref.custom_list"+i+"_name");
		eval("custom_list"+i+"_validate=regPref.custom_list"+i+"_validate");
	}

	for (var i=1; i<20; i++) {
		eval("custom_field"+i+"_label=regPref.custom_field"+i+"_label");
		eval("custom_field"+i+"_validate=regPref.custom_field"+i+"_validate");
	}

	default_gp_first_consultation	= healthAuthoPref.default_gp_first_consultation;
	default_gp_revisit_consultation	= healthAuthoPref.default_gp_revisit_consultation;
	default_sp_first_consultation	= healthAuthoPref.default_sp_first_consultation;
	default_sp_revisit_consultation	= healthAuthoPref.default_sp_revisit_consultation;

	govtIDType	= regPref.government_identifier_type_label;
	govtID		= regPref.government_identifier_label;

	passportNoLabel				= regPref.passport_no;
	passportValidityLabel		= regPref.passport_validity;
	passportIssueCountryLabel	= regPref.passport_issue_country;
	visaValidityLabel			= regPref.visa_validity;

	passportNoValidate			= regPref.passport_no_validate;
	passportValidityValidate	= regPref.passport_validity_validate;
	passportIssueCountryValidate= regPref.passport_issue_country_validate;
	visaValidityValidate		= regPref.visa_validity_validate;

	familyIDLabel		= regPref.family_id;
	familyIDValidate	= regPref.family_id_validate;
}

var mainPagefieldsList = [];
var mainPageVisitfieldsList = [];
var dialogFieldsList = [];
var dialogVisitFieldsList = [];

function filterCustomFields() {
	var j = 0;
	var k = 0;
	for (var i=0;i<customFieldList.length;i++) {
		if (!empty(customFieldList[i].display) && !empty(customFieldList[i].label)) {
			if (customFieldList[i].display == 'M') {
				j++;
				mainPagefieldsList.length = j;
				mainPagefieldsList[j-1] = customFieldList[i].label;
			}else {
				k++;
				dialogFieldsList.length = k;
				dialogFieldsList[k-1] =  customFieldList[i].label;
			}
		}
	}
}

function filterVisitCustomFields() {
	var j = 0;
	var k = 0;
	for (var i=0;i<visitCustomFieldList.length;i++) {
		if (!empty(visitCustomFieldList[i].display) && !empty(visitCustomFieldList[i].label)) {
			if (visitCustomFieldList[i].display == 'M') {
				j++;
				mainPageVisitfieldsList.length = j;
				mainPageVisitfieldsList[j-1] = visitCustomFieldList[i].label;
			}else {
				k++;
				dialogVisitFieldsList.length = k;
				dialogVisitFieldsList[k-1] =  visitCustomFieldList[i].label;
			}
		}
	}
}

function enableCustomLists() {

	for (var i=0; i<10; i++) {
		var customListFieldObj = eval("document.mainform.custom_list"+i+"_value");
		if (customListFieldObj) customListFieldObj.disabled = false;
	}
}

function markCustomFieldsReadonly(notNewRegistration) {
	if ((allowFieldEdit == 'A' && notNewRegistration) || !notNewRegistration) {

		for (var i=1; i<20; i++) {
			var customFieldObj = eval("document.mainform.custom_field"+i);
			if (customFieldObj) customFieldObj.readOnly = false;
		}

		for (var i=1; i<10; i++) {
			var customListFieldObj = eval("document.mainform.custom_list"+i+"_value");
			if (customListFieldObj) customListFieldObj.disabled = false;
		}

		if (document.mainform.passport_no) document.mainform.passport_no.readOnly = false;
		if (document.mainform.passport_validity) document.mainform.passport_validity.readOnly = false;
		if (document.mainform.passport_issue_country) document.mainform.passport_issue_country.readOnly = false;
		if (document.mainform.visa_validity) document.mainform.visa_validity.readOnly = false;

		if (document.mainform.family_id) document.mainform.family_id.readOnly = false;

	}else {

		for (var i=1; i<20; i++) {
			var customFieldObj = eval("document.mainform.custom_field"+i);
			if (customFieldObj) customFieldObj.readOnly = true;
		}

		for (var i=1; i<10; i++) {
			var customListFieldObj = eval("document.mainform.custom_list"+i+"_value");
			if (customListFieldObj) customListFieldObj.disabled = true;
		}

		if (document.mainform.passport_no) document.mainform.passport_no.readOnly = true;
		if (document.mainform.passport_validity) document.mainform.passport_validity.readOnly = true;
		if (document.mainform.passport_issue_country) document.mainform.passport_issue_country.readOnly = true;
		if (document.mainform.visa_validity) document.mainform.visa_validity.readOnly = true;

		if (document.mainform.family_id) document.mainform.family_id.readOnly = true;
	}
}

function customFieldValidation(visitType, customField) {

	for (var i=1; i<10; i++) {
		var label = eval("custom_list" + i + "_name");
		var labelValidate = eval("custom_list" + i + "_validate");
		var labelObj = eval("document.mainform.custom_list"+i+"_value");

		if (customField == label && labelObj != null && labelObj.value == '') {
			if (labelValidate == 'A' || (labelValidate == 'I' && visitType == 'I') ||
					(labelValidate == 'O' && visitType == 'O')) {
				alert(label+ " "+getString("js.registration.patient.is.required.string"));
				return "custom_list"+i+"_value";
			}
		}
	}

	for (var i=1; i<20; i++) {
		var label = eval("custom_field" + i + "_label");
		var labelValidate = eval("custom_field" + i + "_validate");
		var labelObj = eval("document.mainform.custom_field"+i);

		if (customField == label && labelObj != null && labelObj.value == '') {
			if (labelValidate == 'A' || (labelValidate == 'I' && visitType == 'I') ||
					(labelValidate == 'O' && visitType == 'O')) {
				alert(label+ " "+getString("js.registration.patient.is.required.string"));
				return "custom_field"+i;
			}
		}

		if(customField == label && labelObj != null && !empty(labelObj.value)) {
			if(i>13 && i<17) {
				if(!doValidateDateField(labelObj))
					return "custom_field"+i;
			} else if (i > 16) {

				if(!isValidNumber(labelObj,"Y",label))
					return "custom_field"+i;

				if(!validateAmount(labelObj,label+" "+getString("js.registration.patient.allowed.only.eight.digit.number")))
					return "custom_field"+i;
			}
		}
	}

	var passportNo = document.mainform.passport_no;
	var passportValidity = document.mainform.passport_validity;
	var passportIssueCountry = document.mainform.passport_issue_country;
	var visaValidity = document.mainform.visa_validity;

	if (customField == passportNoLabel && passportNo !=null && passportNo.value == "") {
		if (passportNoValidate=="A"||(passportNoValidate=="I"&& visitType=="I")|| (passportNoValidate=="O"&& visitType=="O")) {
	  		alert(passportNoLabel + " "+getString("js.registration.patient.is.required.string"));
	  	    return "passport_no";
	  	}
	}

	if (customField == passportValidityLabel && passportValidity !=null && passportValidity.value == "") {
		if (passportValidityValidate=="A"||(passportValidityValidate=="I"&& visitType=="I")|| (passportValidityValidate=="O"&& visitType=="O")) {
	  		alert(passportValidityLabel + " "+getString("js.registration.patient.is.required.string"));
	  	    return "passport_validity";
	  	}
	}

	if (customField == passportValidityLabel && passportValidity !=null && passportValidity.value != "") {
		if (passportValidityValidate=="A"||(passportValidityValidate=="I"&& visitType=="I")|| (passportValidityValidate=="O"&& visitType=="O")) {
		  	if (!doValidateDateField(passportValidity, 'future'))
				return "passport_validity";
		}
	}

	if (customField == passportIssueCountryLabel && passportIssueCountry !=null && passportIssueCountry.value == "") {
		if (passportIssueCountryValidate=="A"||(passportIssueCountryValidate=="I"&& visitType=="I")|| (passportIssueCountryValidate=="O"&& visitType=="O")) {
	  		alert(passportIssueCountryLabel + " "+getString("js.registration.patient.is.required.string"));
	  	    return "passport_issue_country";
	  	}
	}

	if (customField == visaValidityLabel && visaValidity !=null && visaValidity.value == "") {
		if (visaValidityValidate=="A"||(visaValidityValidate=="I"&& visitType=="I")|| (visaValidityValidate=="O"&& visitType=="O")) {
	  		alert(visaValidityLabel + " "+getString("js.registration.patient.is.required.string"));
	  	    return "visa_validity";
	  	}
	}

	if (customField == visaValidityLabel && visaValidity !=null && visaValidity.value != "") {
		if (visaValidityValidate=="A"||(visaValidityValidate=="I"&& visitType=="I")|| (visaValidityValidate=="O"&& visitType=="O")) {
		  	if (!doValidateDateField(visaValidity, 'future'))
				return "visa_validity";
		}
	}

	var familyId = document.mainform.family_id;

	if (customField == familyIDLabel && familyId !=null && familyId.value == "") {
		if (familyIDValidate=="A"||(familyIDValidate=="I"&& visitType=="I")|| (familyIDValidate=="O"&& visitType=="O")) {
	  		alert(familyIDLabel + " "+getString("js.registration.patient.is.required.string"));
	  	    return "family_id";
	  	}
	}

	return null;
}

function validatePassportCustomFields(custfieldObj, custfieldLabel) {
	var isPrimaryField = false;
	var isSecondaryField = false;

	var isCfDialog = !(typeof cfDialog == "undefined");

	if (mainPagefieldsList.length > 0) {
		for (var i = 0; i < mainPagefieldsList.length; i++) {
			if (custfieldLabel == mainPagefieldsList[i]) {
				isPrimaryField = true;
				break;
			}
		}
	}

	if (!isPrimaryField) {
		if (dialogFieldsList.length > 0) {
			for (var i = 0; i < dialogFieldsList.length; i++) {
				if (custfieldLabel == dialogFieldsList[i]) {
					isSecondaryField = true;
					break;
				}
			}
		}
	}

	if (isPrimaryField) {
		if (CollapsiblePanel1.isOpen()) {
			setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
		} else {
			CollapsiblePanel1.open();
			setTimeout("document.mainform." + custfieldObj + ".focus()", 800);
		}
		if (isCfDialog) cfDialog.hide();
		return false;

	}else if (isSecondaryField) {
		if (!CollapsiblePanel1.isOpen()) CollapsiblePanel1.open();
		if (isCfDialog) cfDialog.show();
		setTimeout("document.mainform." + custfieldObj + ".focus()", 100);
		return false;
	}

	if (isCfDialog) cfDialog.hide();
	return true;
}


function validatePassportDetails() {
	var passportNo = document.mainform.passport_no;
	var passportValidity = document.mainform.passport_validity;
	var passportIssueCountry = document.mainform.passport_issue_country;
	var visaValidity = document.mainform.visa_validity;

	if (!empty(passportNoLabel) && passportNo !=null && passportNo.value == "") {
  		alert(passportNoLabel + " "+getString("js.registration.patient.is.required.string"));
  		if (!validatePassportCustomFields("passport_no", passportNoLabel)) return false;
	}

	if (!empty(passportValidityLabel) && passportValidity !=null && passportValidity.value == "") {
	  	alert(passportValidityLabel + " "+getString("js.registration.patient.is.required.string"));
	  	if (!validatePassportCustomFields("passport_validity", passportValidityLabel)) return false;
	}

	if (!empty(passportValidityLabel) && passportValidity !=null && passportValidity.value != "") {
	  	if (!doValidateDateField(passportValidity, 'future'))
			if (!validatePassportCustomFields("passport_validity", passportValidityLabel)) return false;
	}

	if (!empty(passportIssueCountryLabel) && passportIssueCountry !=null && passportIssueCountry.value == "") {
  		alert(passportIssueCountryLabel + " "+getString("js.registration.patient.is.required.string"));
  	    if (!validatePassportCustomFields("passport_issue_country", passportIssueCountryLabel)) return false;
	}

	if (!empty(visaValidityLabel)  && visaValidity !=null && visaValidity.value == "") {
  		alert(visaValidityLabel + " "+getString("js.registration.patient.is.required.string"));
  	    if (!validatePassportCustomFields("visa_validity", visaValidityLabel)) return false;
	}

	if (!empty(visaValidityLabel) && visaValidity !=null && visaValidity.value != "") {
	  	if (!doValidateDateField(visaValidity, 'future'))
			if (!validatePassportCustomFields("visa_validity", visaValidityLabel)) return false;
	}

	return true;
}

function validateOnChangePatientCategory() {
	var categoryObj = document.getElementById("patient_category_id");
	if (categoryObj != null && categoryObj.value != '') {
		var catDetails = findInList(categoryJSON, "category_id", categoryObj.value);
		if (!empty(catDetails.passport_details_required) &&  catDetails.passport_details_required == "Y") {
			return validatePassportDetails();
		}
	}
	return true;
}

function UnFormatTextAreaValues(vText) {
	vRtnText= vText;
	while(vRtnText.indexOf("~") > -1) {
		vRtnText = vRtnText.replace("~"," ");
	}
	while(vRtnText.indexOf("^") > -1) {
		vRtnText = vRtnText.replace("^"," ");
	}
	return  vRtnText;
}

function FormatTextAreaValues(vText) {
	vRtnText= vText;
	while(vRtnText.indexOf("\n") > -1) {
		vRtnText = vRtnText.replace("\n"," ");
	}
	while(vRtnText.indexOf("\r") > -1) {
		vRtnText = vRtnText.replace("\r"," ");
	}
	return vRtnText;
}

function validatePatientAge() {
	var msg = getString("js.registration.patient.age.validation.more.than.120.years");
	var ageIn = document.mainform.ageIn.value;
	var age = document.mainform.age.value;
	if(ageIn == 'Y' && age > 120) {
		alert(msg);
		document.mainform.age.focus();
		return false;
	} else if(ageIn == 'M' && (age/12) > 120) {
		alert(msg);
		document.mainform.age.focus();
		return false;
	} else if(ageIn == 'D' && (age/365) > 120) {
		alert(msg);
		document.mainform.age.focus();
		return false;
	}
	return true;
}

function patientDetailsValidation() {
	var isCollapseElmt = !(typeof CollapsiblePanel1 == "undefined");

	if (document.mainform.government_identifier != null)
		document.mainform.government_identifier.value  = trim(document.mainform.government_identifier.value);

	document.mainform.patient_name.value = trim(document.mainform.patient_name.value);
	document.mainform.middle_name.value = trim(document.mainform.middle_name.value);
	document.mainform.last_name.value = trim(document.mainform.last_name.value);
	document.mainform.patient_address.value	= FormatTextAreaValues(document.mainform.patient_address.value);
	document.mainform.patient_area.value = trim(document.mainform.patient_area.value);
	document.mainform.pat_city_name.value = trim(document.mainform.pat_city_name.value);

    var dobDay = document.mainform.dobDay.value;
    var dobMonth = document.mainform.dobMonth.value;
    var dobYear = document.mainform.dobYear.value;

    if(document.mainform.salutation.value==""){
	    showMessage("js.registration.patient.title.required");
	    document.mainform.salutation.focus();
	    return false;
    }

    if(document.mainform.patient_name.value == "..FirstName.." || document.mainform.patient_name.value == ""){
	    showMessage("js.registration.patient.first.name.required");
	    document.mainform.patient_name.focus();
	    return false;
    }

	/*
    if(document.mainform.middle_name.value == "..MiddleName.." || document.mainform.middle_name.value == ""){
        alert("Middle name is required");
        document.mainform.middle_name.focus();
        return false;
    }*/

	if(document.mainform.patient_gender.options.selectedIndex==0){
		showMessage("js.registration.patient.gender.required");
		document.mainform.patient_gender.focus();
		return false;
	}

	 if (!validateSalutationGender()) return false;

	/*
	 * One of DOB or Age must be entered: prefer DOB
	 */
	if (isDOBEntered()) {
		var dob = validateDOB();
		if (!dob) {
			return false;
		}
		if(!getAge(false, dob)){
			return false;
		}

		if(!validatePatientAge()) {
			return false;
		}

		// set the hidden dateOfBirth input value that the backend needs
		document.mainform.dateOfBirth.value =
			dob.getFullYear() + "-" + getFullMonth(dob.getMonth()) + "-" + getFullDay(dob.getDate());
	} else {
		if(document.mainform.age.value=="..Age.." || document.mainform.age.value=="Age") {
			showMessage("js.registration.patient.dob.age.required");
			document.mainform.age.focus();
			return false;
		} else {
			if(!validatePatientAge()) {
				return false;
			}
		}
	}

	if (document.mainform.pat_city_name.value == '') {
		showMessage("js.registration.patient.city.required");
		if (isCollapseElmt && CollapsiblePanel1 != null)
			CollapsiblePanel1.open();
		document.mainform.pat_city_name.focus();
		return false;
	}

    if (document.mainform.areaValidate.value=="A" && document.mainform.patient_area.value=="") {
    	showMessage("js.registration.patient.area.required");
    	if (isCollapseElmt && CollapsiblePanel1 != null)
    		CollapsiblePanel1.open();
    	document.mainform.patient_area.focus();
    	return false;
    }
    if (document.mainform.addressValidate.value=="A" && document.mainform.patient_address.value=="") {
    	showMessage("js.registration.patient.address.required");
    	if (isCollapseElmt && CollapsiblePanel1 != null)
    		CollapsiblePanel1.open();
    	document.mainform.patient_address.focus();
    	return false;
    }

    if(document.mainform.patient_address.value.length > 250){
		showMessage("js.registration.patient.address.length.check.string");
		if (isCollapseElmt && CollapsiblePanel1 != null)
    		CollapsiblePanel1.open();
		document.mainform.patient_address.focus();
		return false;
	}
	return true;
}

/*
function validateCategoryExpiryDate() {
	if (document.mainform.patient_category_id)
	 	document.mainform.patient_category_id.disabled=false;

	if (document.mainform.patient_category_id) {
		if(document.mainform.patient_category_id.value != '') {
		var elements = document.getElementsByName("category_expiry_date");
			for(var i=0; i<elements.length;i++){
				var obj = elements[i];
				if(obj.getAttribute("name")=="category_expiry_date"){
					var selectedExpDate = document.mainform.category_expiry_date.value;
					if(selectedExpDate!=""){
						myDate = new Date();
						var currDate= formatDueDate(myDate);
						if(getDateDiff(currDate,selectedExpDate)<0) {
							alert(categoryExpirydateText + " "+getString("js.registration.patient.shoul.not.less.than.current.date.string"));
							return false;
						}
					}
				}
			}
		}
	}
	return true;
}
*/

function patientAdditionalFieldsValidation() {

    var prefNextOfKins = document.mainform.nextofkinValidate.value;
    var relationName = document.mainform.relation.value;
    var contactNo = document.mainform.patient_care_oftext.value;
    var addres = document.mainform.patient_careof_address.value;
    var prefPatientPhone = document.mainform.patientPhoneValidate.value;
    var patientPhone = document.mainform.patient_phone.value;
    var addtnlPhone = document.mainform.patient_phone2.value;

	if(prefPatientPhone=="A") {
    	if(patientPhone=="") {
    		showMessage("js.registration.patient.phone.no.required");
    		document.mainform.patient_phone.focus();
    		return false;
    	}
    }
    if (patientPhone != '' && !validatePhoneNo(patientPhone, getString("js.registration.patient.invalid.phoneno"))) {
  		document.mainform.patient_phone.focus();
  		return false;
  	}

  	if(contactNo != "") {
  		if (!validatePhoneNo(contactNo, getString("js.registration.patient.invalid.phoneno"))) {
    			document.mainform.patient_care_oftext.focus();
    			return false;
    		}
    }

    if (prefNextOfKins=="A") {
    	if(relationName=="") {
    		showMessage("js.registration.patient.next.of.kin.relation.name.required");
    		document.mainform.relation.focus();
    		return false;
    	}
    	if(contactNo=="") {
    		showMessage("js.registration.patient.next.kin.relation.contact.required");
    		document.mainform.patient_care_oftext.focus();
    		return false;
    	}
    	if(addres=="") {
    		showMessage("js.registration.patient.address.ph.required");
    		if (CollapsiblePanel1 != null) {
    			CollapsiblePanel1.open();
    			if (typeof cfDialog != 'undefined' && cfDialog != null) cfDialog.show();
    		}
    		document.mainform.patient_careof_address.focus();
    		return false;
    	}
    }

    if (addtnlPhone != '' && !validatePhoneNo(addtnlPhone, getString("js.registration.patient.invalid.phoneno"))) {
    	document.mainform.patient_phone2.focus();
    	return false;
    }

	if ( (null != document.mainform.portalPatAccess ) && document.mainform.portalPatAccess[0].checked ) {
	    if ( document.mainform.email_id.value == "" ) {
	            showMessage("js.registration.patient.email.id.required");
	            document.mainform.email_id.focus();
	            return false;
	    }

	    if(!(FIC_checkField(" validate-email ", document.mainform.email_id))) {
	            showMessage("js.registration.patient.enter.emai.id.string");
	            document.mainform.email_id.focus();
	            return false;
	    }
     }else if (null != document.mainform.email_id && trim(document.mainform.email_id.value) != '' ) {
     	 if(!(FIC_checkField(" validate-email ", document.mainform.email_id))) {
	            showMessage("js.registration.patient.enter.emai.id.string");
	            document.mainform.email_id.focus();
	            return false;
	    }
     }

     if (null != document.mainform.government_identifier && trim(document.mainform.government_identifier.value) != '' ) {
     	if(!(FIC_checkField(" validate-govt-id ", document.mainform.government_identifier))) {
				alert(govtId_label+" "+
				getString("js.registration.patient.enter.govt.invalid.string")+". "+
				" "+getString("js.registration.patient.enter.govt.format.string")+" : "+
				govtId_pattern);
	            document.mainform.government_identifier.focus();
	            return false;
	    }
     }

	if (typeof cfDialog != 'undefined' && cfDialog != null) cfDialog.hide();
	return true;
}


function formatDueDate(dateMSecs) {
	var dateObj = new Date(dateMSecs);
	var dateStr = formatDate(dateObj, 'ddmmyyyy', '-');
	return dateStr;
}

function validateDeptAllowedGender() {
	var allowedGender = document.mainform.dept_allowed_gender.value;
	var dept_name = document.mainform.dept_name.value;
	if (allowedGender == 'ALL')
		return true;
	var gender = document.mainform.patient_gender.value;
	if (dept_name != '') {
		if (allowedGender != gender) {
			alert(document.mainform.dept_name.options[document.mainform.dept_name.selectedIndex].text
					+ " "+getString("js.registration.patient.is.not.valid.for.string")+" "+document.mainform.patient_gender.options[document.mainform.patient_gender.selectedIndex].text+" patient.");
			document.mainform.dept_name.focus();
			return false;
		}
	}
	return true;
}

function validateSalutationGender() {
	var salutation = document.mainform.salutation.value;
	if (document.mainform.salutation.options[document.mainform.salutation.selectedIndex].text == '')
		return true;
	var gender = document.mainform.patient_gender.value;
	var salDetails = findInList(salutationJSON, 'salutation_id', salutation);
	if (!empty(salDetails.gender) && gender != salDetails.gender) {
		if (salDetails.gender == 'N')
			return true;
		alert(document.mainform.salutation.options[document.mainform.salutation.selectedIndex].text
				+ " "+getString("js.registration.patient.is.not.valid.for.string")+" "+ document.mainform.patient_gender.options[document.mainform.patient_gender.selectedIndex].text);
		document.mainform.salutation.focus();
		return false;
	}
	return true;
}

function showHideCaseFile() {
	var categoryObj = document.getElementById("patient_category_id");
	if (document.getElementById("caseFileFields") != null && categoryObj != null) {
		if (categoryObj.value != '') {
			var catDetails = findInList(categoryJSON, "category_id", categoryObj.value);
			if (!empty(catDetails.case_file_required) &&  catDetails.case_file_required == "Y") {
				document.getElementById("caseFileFields").style.display = 'block';
				if(document.mainform.oldRegAutoGenerate != null && !document.mainform.oldRegAutoGenerate.disabled) {
					document.mainform.casefileNo.value = '';
					document.mainform.casefileNo.readOnly = false;
					document.mainform.oldRegAutoGenerate.checked = true;
					enableOldmrno();
				}else if(document.mainform.raiseCaseFileIndent != null && !document.mainform.raiseCaseFileIndent.disabled) {
					document.mainform.raiseCaseFileIndent.checked = true;
				}
			}else {
				document.getElementById("caseFileFields").style.display = 'none';
				document.mainform.casefileNo.readOnly = true;
				document.mainform.casefileNo.value = '';
				document.mainform.oldRegAutoGenerate.checked = false;
				enableOldmrno();
				if (document.mainform.raiseCaseFileIndent != null)
					document.mainform.raiseCaseFileIndent.checked = false;
			}
		}else {
			document.getElementById("caseFileFields").style.display = 'block';
			document.mainform.casefileNo.readOnly = false;
			document.mainform.casefileNo.value = '';
			document.mainform.oldRegAutoGenerate.checked = false;
			enableOldmrno();
			if (document.mainform.raiseCaseFileIndent != null)
				document.mainform.raiseCaseFileIndent.checked = false;
		}
	}
}

function setSmsStatusForVaccination() {
	smsForVaccination = document.getElementById('smsForVaccination');
	sms_for_vaccination = document.getElementById('sms_for_vaccination');
	if (smsForVaccination.checked) {
		sms_for_vaccination.value = 'Y'
	} else {
		sms_for_vaccination.value = 'N';
	}
}

function displayVisitMoreButton() {
	if(document.getElementById('displayVisitCustomBtn')) {
		if(!isVisitCustomFieldIsSecondary())
			document.getElementById('displayVisitCustomBtn').style.display = 'none';
		else
			document.getElementById('displayVisitCustomBtn').style.display = 'table-row';
	}
}

function isVisitCustomFieldIsSecondary() {
	var displayVisitMoreButton = false;
	if(visitCustomFieldList.length > 0) {
		for(var i=0;i<visitCustomFieldList.length;i++) {
			if(visitCustomFieldList[i].display == 'D') {
				displayVisitMoreButton = true;
				break;
			}
		}
	}
	return displayVisitMoreButton;
}