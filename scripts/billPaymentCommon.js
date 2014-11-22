/* Get the bill amount total and due amount total */
var total_AmtPaise =  0;
var total_AmtDuePaise = 0;
var total_SpnsrAmtDuePaise = 0;
var total_DepositAmtAvailablePaise = 0;
var total_LessDeposits = 0;

var total_RewardPointsAvailable = 0;
var total_RewardPointsAmountAvailable = 0;
var total_LessRewardPoints = 0;
var total_LessRewardPointsAmount = 0;

function resetTotalsForPayments() {
	total_AmtPaise =  getTotalAmount();
	total_AmtDuePaise = getTotalAmountDue();
	total_AmtDuePaise = total_AmtDuePaise - total_LessDeposits - total_LessRewardPointsAmount;
}

function resetTotalsForSpnsrPayments() {
	total_SpnsrAmtDuePaise = getTotalSpnsrAmountDue();
}

function resetTotalsForDepositPayments() {
	total_DepositAmtAvailablePaise = getTotalDepositAmountAvailable();
}

function resetTotalsForPointsRedeemed() {
	total_RewardPointsAvailable = getAmountDecimal(getTotalRewardPointsAvailable(), 2);
	total_RewardPointsAmountAvailable = getTotalRewardPointsAmountAvailable();
}

function getThisRow(node) {
	return findAncestor(node, "TR");
}

function setFormIndexedValue(name, index, value) {
	var obj = getIndexedFormElement(documentForm, name, index);
	if (obj)
		obj.value = value;
	return obj;
}

function getFormIndexedValue(name, index) {
	var obj = getIndexedFormElement(documentForm, name, index);
	if (obj)
		return obj.value;
	else
		return null;
}

function getNumOfPayments() {
	var paymentTable = document.getElementById("paymentsTable");
	if (paymentTable) {
		var numPayments = (paymentTable.rows.length - paymentRowsUncloned) /paymentRows;
		return numPayments;
	}
	return 0;
}

function setTotalPayAmount() {
	var numPayments = getNumOfPayments();
	if (numPayments == 1) {
		var obj = getIndexedFormElement(documentForm, "totPayingAmt", 0);
		var pmtObj = getIndexedFormElement(documentForm, "paymentType", 0);
		if (obj != null) {
			if (total_AmtDuePaise >= 0) {
				setPaymentType(pmtObj, "receipt_settlement");
				obj.value = formatAmountPaise(total_AmtDuePaise);

			} else if (total_AmtDuePaise < 0) {
				setPaymentType(pmtObj, "refund");
				obj.value = formatAmountPaise(Math.abs(total_AmtDuePaise));

			} else {
				setPaymentType(pmtObj, "");
				obj.value = "";
			}
		}
		setColor(pmtObj);
	}
}

function setPaymentType(pmtObj, pmtVal) {
	var index=0;
	if (pmtObj != null) {
		for(var i=0; i<pmtObj.options.length; i++) {
			var opt_value = pmtObj.options[i].value;
			if (opt_value == pmtVal) {
				pmtObj.selectedIndex = i;
				return;
			}
		}
	}
}

function validatePaymentRefund() {
	var numPayments = getNumOfPayments();
	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var totPayAmt = getIndexedFormElement(documentForm, "totPayingAmt", i);

			if (getPaise(totPayAmt.value) != 0) {
				var payType = getIndexedFormElement(documentForm, "paymentType", i);
				if (payType.value == "refund" && allowRefundRights != "A") {
					showMessage("js.laboratory.radiology.billpaymentcommon.notauthorized.refund");
					payType.focus();
					return false;
				}
				//hospital bill refund validation starts here
				if(typeof totalBilledAmount != 'undefined'){
				 if (payType.value == "refund" && getPaise(totPayAmt.value) != 0) {
				    if(totalBilledAmount > 0 ){
				       if(getPaise(totPayAmt.value) > getPaise(existingReceipts)){
				           alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+existingReceipts);
					       totPayAmt.focus();
					    return false;
					}
				}
				else {
				       if(getPaise(totPayAmt.value) > (Math.abs(total_AmtDuePaise - getPaise(existingReceipts)))){
				            alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+(Math.abs(total_AmtDuePaise - getPaise(existingReceipts)))/100);
				            totPayAmt.focus();
					    return false;
				       }
				  }
				}
			  }
			  //dental & pharmacy bill refund validation starts here
			  if(typeof screenId != 'undefined'){
			    if(screenId == 'dental_consultations'){
			     if (payType.value == "refund" && getPaise(totPayAmt.value) != 0) {
			              var patPaid = getPaise(document.getElementById("totalRec").value);
			              var totalDue = getPaise(document.getElementById("totalDue").value);
			              var diff = Math.abs(totalDue - patPaid );
				          if(getPaise(document.getElementById("totalAmt").value) > 0 ){
				               if(getPaise(totPayAmt.value) > patPaid ){
				                     alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+patPaid/100);
					                 totPayAmt.focus();
					        return false;
					}
				}
				else {
				       if(getPaise(totPayAmt.value) > diff ){
				            alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+diff/100);
				            totPayAmt.focus();
					    return false;
				       }
				    }
				  }
				}
				else if(screenId == 'pharma_retail_sale_pending_bills') {
				  if (payType.value == "refund" && getPaise(totPayAmt.value) != 0) {
				          var patPaid = getPaise(document.getElementById("netPay").value);
			              var totalDue = getPaise(document.getElementById("amountdue").value);
			              var billedAmount = getPaise(document.getElementById('l_total').textContent);
			              var diff = Math.abs(totalDue - patPaid );
			              if(billedAmount > 0 ){
				               if(getPaise(totPayAmt.value) > patPaid ){
				                     alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+patPaid/100);
					                 totPayAmt.focus();
					                 return false;
					        }
					     }
					    else {
				                if(getPaise(totPayAmt.value) > diff ){
				                     alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+diff/100);
				                     totPayAmt.focus();
				                     return false;
				                    }
				             }

				  }
				}
				else if(screenId == 'pharma_item_credit_bill') {
				  	  if (payType.value == "refund" && getPaise(totPayAmt.value) != 0) {
				          var patPaid = getPaise(document.getElementById("lblExistingReceipts").textContent);
			              var totalDue = getPaise(document.getElementById("lblTotAmtDue").textContent);
			              var billedAmount = getPaise(document.getElementById('lblTotAmt').textContent);
			              var diff = Math.abs(totalDue - patPaid );
			              if(billedAmount > 0 ){
				               if(getPaise(totPayAmt.value) > patPaid ){
				                     alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+patPaid/100);
					                 totPayAmt.focus();
					                 return false;
					        }
					     }
					    else {
				                if(getPaise(totPayAmt.value) > diff ){
				                     alert(getString("js.laboratory.radiology.billpaymentcommon.refundamt.notexceed")+' '+diff/100);
				                     totPayAmt.focus();
				                     return false;
				                    }
				             }

				  }
				}
			  }
			}
		}
	}
	return true;
}

function onAddPayMode(obj) {
	total_AmtPaise =  getTotalAmount();
	total_AmtDuePaise = getTotalAmountDue();
	var table = document.getElementById("paymentsTable");
	var thisRow = getThisRow(obj);		// location of the add button
	var numPayments = getNumOfPayments();
	var id = numPayments;
	if (document.getElementById("payDD") != null)
		document.getElementById("payDD").style.height="auto";

	var payObj = getIndexedFormElement(documentForm, "totPayingAmt", numPayments -1 );

	if ( (null != payObj) && (payObj.value == "") ) {
		showMessage("js.laboratory.radiology.billpaymentcommon.payamount");
		payObj.focus();

	} else {
		for (var i=(paymentRowsUncloned-1); i<(paymentRows + paymentRowsUncloned-1) ; i++) {
			var newRow = table.rows[i].cloneNode(true);
			table.tBodies[0].insertBefore(newRow, thisRow);
		}

		clearPaymentFields(id);

		var paymentObj = getIndexedFormElement(documentForm, "paymentType", id);

		var totalAmt =  Math.abs(getTotalAmountDue());
		var payingAmt = getPayingAmountPaise('patient') + getPayingAmountPaise('refund') + getPayingAmountPaise('sponsor');
		payingAmt = Math.abs(payingAmt);

		var prevPaymentObj = getIndexedFormElement(documentForm, "paymentType", (id-1));
		var prevPaymentType = prevPaymentObj != null ? prevPaymentObj.value : "";
		var isSponsorPay = (prevPaymentType.indexOf("sponsor") != -1) ? true : false;

		if (!isSponsorPay) {
			if ((totalAmt - payingAmt) < 0)
				setSelectedIndex(paymentObj, "refund");
			else if ((totalAmt - payingAmt) >= 0)
				setSelectedIndex(paymentObj, "receipt_advance");
		}else {
			setSelectedIndex(paymentObj, "receipt_advance");
		}

		var modeObj = getIndexedFormElement(documentForm, "paymentModeId", id);
		var currObj = getIndexedFormElement(documentForm, "currencyId", id);
		var type = paymentObj.value;

		if (currObj != null)
			getCurrencyDetails(currObj);
		else
			setPayingAmountPaise(type, id);

		if (isSponsorPay)
			setFormIndexedValue("totPayingAmt", id, '');

		enableBankDetails(modeObj);
		enableDisableDeletePayMode();
	}
	return false;
}

function setColor(paymentObj) {
	if (paymentObj != null && paymentObj.value =="refund")
		paymentObj.style.color = 'red';
	else
		paymentObj.style.color = '';
}

function populatePaymentType(billType, defaultPaymentType) {
 	var payment_type_el = document.getElementById('paymentType');
 	var rec_selected = '';
 	var ref_selected = '';
 	var adv_selected = '';
	payment_type_el.length = 0; // clear the previously populated list
	if (billType == "C") {
		if (defaultPaymentType == 'A')
			adv_selected = 'selected';
		payment_type_el.innerHTML += '<option value="receipt_advance"'+ adv_selected +'">Advance</option>';
		if (defaultPaymentType == 'R')
			 rec_selected = 'selected';
		payment_type_el.innerHTML += '<option value="receipt_settlement"'+ rec_selected +'">Settlement</option>';
	}
	if (billType == "P") {
		if (defaultPaymentType == 'R')
			 rec_selected = 'selected';
		payment_type_el.innerHTML += '<option value="receipt_settlement"'+ rec_selected +'">Settlement</option>';
	}
	if (defaultPaymentType == 'F')
		ref_selected = 'selected';
	payment_type_el.innerHTML += '<option value="refund" "'+ ref_selected +'">Refund</option>'

}

function enableBankDetails(modeObj) {
	var thisRow  = getThisRow(modeObj);
	var mode = modeObj.value;
	var numPayments = getNumOfPayments();
	var paymentIndex = numPayments;

	if (numPayments > 0) {
		paymentIndex = ((thisRow.rowIndex + 1) - paymentRowsUncloned) / paymentRows;
	}

	var bankObj = getIndexedFormElement(documentForm, "bankName", paymentIndex);
	var cardObj = getIndexedFormElement(documentForm, "cardTypeId", paymentIndex);
	var refObj = getIndexedFormElement(documentForm, "refNumber", paymentIndex);

	var bankBatchObj = getIndexedFormElement(documentForm, "bankBatchNo", paymentIndex);
	var cardAuthObj = getIndexedFormElement(documentForm, "cardAuthCode", paymentIndex);
	var cardHolderObj = getIndexedFormElement(documentForm, "cardHolderName", paymentIndex);

	var cardNumberObj = getIndexedFormElement(documentForm, "cardNumber", paymentIndex);
	var cardExpDtObj = getIndexedFormElement(documentForm, "cardExpDate", paymentIndex);

	setSelectedIndex(cardObj, "");

	var currencyObj = getIndexedFormElement(documentForm, "currencyId", paymentIndex);

	if (currencyObj != null && currencyObj.value != "") {
		setSelectedIndex(currencyObj, "");
		getCurrencyDetails(currencyObj);
	}

	var paymentModeDetail = findInList(jPaymentModes, "mode_id", mode);

	cardObj.disabled = (paymentModeDetail.card_type_required != 'Y');
	bankObj.disabled = (paymentModeDetail.bank_required != 'Y');
	refObj.disabled = (paymentModeDetail.ref_required != 'Y');

	bankBatchObj.disabled = (paymentModeDetail.bank_batch_required != 'Y');
	cardAuthObj.disabled = (paymentModeDetail.card_auth_required != 'Y');
	cardHolderObj.disabled = (paymentModeDetail.card_holder_required != 'Y');

	cardNumberObj.disabled = (paymentModeDetail.card_number_required != 'Y');
	cardExpDtObj.disabled = (paymentModeDetail.card_expdate_required != 'Y');

	if (bankObj.disabled) bankObj.value = "";
	if (refObj.disabled)  refObj.value = "";

	if (bankBatchObj.disabled) bankBatchObj.value = "";
	if (cardAuthObj.disabled)  cardAuthObj.value = "";
	if (cardHolderObj.disabled)  cardHolderObj.value = "";

	if (cardNumberObj.disabled)  cardNumberObj.value = "";
	if (cardExpDtObj.disabled)  cardExpDtObj.value = "";
	addMandatoryIndicators();
}

function disablePackage(obj) {
	var thisRow  = getThisRow(obj);
	var numPayments = getNumOfPayments();
	var paymentIndex = numPayments;

	if (numPayments > 0) {
	    paymentIndex = Math.floor(((thisRow.rowIndex + 1) - paymentRowsUncloned) / paymentRows);
	}

	var packageObj = getIndexedFormElement(documentForm, "packageId", paymentIndex);

	if(packageObj) {
	    if (obj.checked) {
		packageObj.disabled = false;
	    } else {
		packageObj.value = "";
		packageObj.disabled = true;
	    }
	}
}

function assignPackageIdValue(obj) {
	var thisRow  = getThisRow(obj);
	var numPayments = getNumOfPayments();
	var paymentIndex = numPayments;

	if (numPayments > 0) {
	    paymentIndex = Math.floor(((thisRow.rowIndex + 1) - paymentRowsUncloned) / paymentRows);
	}

	var packageIdObj = getIndexedFormElement(documentForm, "mvPackageId", paymentIndex);
	if(packageIdObj != null)
		packageIdObj.value = obj.value;
}

function onDeletePayMode(obj) {
	var table = document.getElementById("paymentsTable");
	var numRows = table.rows.length;

	var numRows = numRows - paymentRowsUncloned;

	for (var i=1; i<=paymentRows; i++) {
		table.deleteRow(numRows-i);
	}
	enableDisableDeletePayMode();
}

function enableDisableDeletePayMode() {
	var numPayments = getNumOfPayments();
	var enable = numPayments > 1;
	document.getElementById("deletePayMode").disabled = !enable;
}

function setPayingAmountPaise(type, id) {

	var paymentObj = getIndexedFormElement(documentForm, "paymentType", id);
	setColor(paymentObj);

	var totPayingPaise = getPayingAmountPaise('patient');
	var totPayingRefundPaise = getPayingAmountPaise('refund');
	var totSponsorPayingPaise = getPayingAmountPaise('sponsor');
	var totTdsPaise = getPayingTDSAmountPaise();

	var sponsorDue = total_SpnsrAmtDuePaise - (totSponsorPayingPaise + totPayingRefundPaise + totTdsPaise);
	var patientDue = total_AmtDuePaise - (totPayingPaise + totPayingRefundPaise);

	sponsorDue = Math.abs(sponsorDue);
	patientDue = Math.abs(patientDue);

	if (type == 'pri_sponsor_receipt_advance' || type == 'pri_sponsor_receipt_settlement'
	    || type == 'sec_sponsor_receipt_advance' || type == 'sec_sponsor_receipt_settlement') {
		setFormIndexedValue("totPayingAmt", id, formatAmountPaise(sponsorDue));

	} else if (type == 'receipt_advance' || type == 'receipt_settlement') {
		setFormIndexedValue("totPayingAmt", id, formatAmountPaise(patientDue));

	}else if (type == 'refund') {
		setFormIndexedValue("totPayingAmt", id, formatAmountPaise(patientDue));
	}
}

/*
 * Returns an amount that is being paid/refunded. If refunded, the amount
 * is returned negative, thus, calculations can use the returned value as is,
 * regardless of refund/receipt.
 */

function getPayingAmountPaise(paymentType) {
	var payingAmtPaise = 0;
	var isReturns = (empty(isReturns)) ? false : isReturns;

	// paymentType is patient, sponsor, refund (patient)
	var numPayments = getNumOfPayments();
	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
			var amtObj = getIndexedFormElement(documentForm, "totPayingAmt", i);

			var type = paymentObj.value;
			if ( (null != amtObj) && (amtObj.value != "") ) {
				if (paymentType == 'patient' && (type == 'receipt_advance' || type == 'receipt_settlement')) {
					payingAmtPaise = payingAmtPaise + getPaise(amtObj.value);

				}else if (paymentType == 'sponsor'
					&& (type == 'pri_sponsor_receipt_advance' || type == 'pri_sponsor_receipt_settlement'
						|| type == 'sec_sponsor_receipt_advance' || type == 'sec_sponsor_receipt_settlement')) {
					payingAmtPaise = payingAmtPaise + getPaise(amtObj.value);

				}else if (paymentType == 'refund' && (type == 'refund')) {
					payingAmtPaise = payingAmtPaise + getPaise(amtObj.value);
					payingAmtPaise = Math.abs(payingAmtPaise);
				}
			}
		}
	}

	if (paymentType == 'refund' && !isReturns)
		payingAmtPaise = (0-payingAmtPaise);
	return payingAmtPaise;
}

function getPayingTDSAmountPaise() {
	var tdsAmtPaise = 0;

	var numPayments = getNumOfPayments();
	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
			var tdsObj = getIndexedFormElement(documentForm, "tdsAmt", i);

			var type = paymentObj.value;
			if ( (null != tdsObj) && (tdsObj.value != "") ) {
				if (type == 'pri_sponsor_receipt_advance' || type == 'pri_sponsor_receipt_settlement'
				    || type == 'sec_sponsor_receipt_advance' || type == 'sec_sponsor_receipt_settlement') {
					tdsAmtPaise = tdsAmtPaise + getPaise(tdsObj.value);
				}
			}
		}
	}
	return tdsAmtPaise;
}

function getCurrencyDetails(currObj) {
	var thisRow  = getThisRow(currObj);
	var currVal = currObj.value;

	var numPayments = getNumOfPayments();
	var paymentIndex = numPayments;

	if (numPayments > 0) {
		paymentIndex = ((thisRow.rowIndex) - paymentRowsUncloned) / paymentRows;
	}

	var paymentObj = getIndexedFormElement(documentForm, "paymentType", paymentIndex);
	var payObj = getIndexedFormElement(documentForm, "totPayingAmt", paymentIndex);
	var currAmtObj = getIndexedFormElement(documentForm, "currencyAmt", paymentIndex);
	var exchRateObj = getIndexedFormElement(documentForm, "exchangeRate", paymentIndex);
	var exchDtTimeObj = getIndexedFormElement(documentForm, "exchangeDateTime", paymentIndex);
	var exchangeRateDtlbl = thisRow.getElementsByTagName("label")[0];

	var type = paymentObj.value;
	setPayingAmountPaise(type, paymentIndex);

	if (currVal != '') {
		var currency = findInList(jForeignCurrencyList, "currency_id", currVal);
		if (!empty(currency)) {
			payObj.readOnly = true;
			exchRateObj.value = currency.conversion_rate;
			exchDtTimeObj.value = formatDate(new Date(currency.mod_time),'ddmmyyyy','-') + ' ' + formatTime(new Date(currency.mod_time));
			exchangeRateDtlbl.textContent =
				currency.conversion_rate +" (    "+ formatDate(new Date(currency.mod_time),'ddmmyyyy','-') + ' '
												  + formatTime(new Date(currency.mod_time)) +"   )";
		}else {
			payObj.readOnly = false;
			currAmtObj.value = '';
			exchRateObj.value = '';
			exchDtTimeObj.value = '';
			exchangeRateDtlbl.textContent = '';
		}

		if ((null != currAmtObj) && !currAmtObj.disabled && (currAmtObj.value == ""))
			if ((null != payObj)) payObj.value = '';

	}else {
		payObj.readOnly = false;
		payObj.value = '';
		currAmtObj.value = '';
		exchRateObj.value = '';
		exchDtTimeObj.value = '';
		exchangeRateDtlbl.textContent = '';
		setPayingAmountPaise(type, paymentIndex);
	}

	convertCurrency(currAmtObj);
}

function convertCurrency(currAmtObj) {

	var thisRow  = getThisRow(currAmtObj);
	var currAmtVal = currAmtObj.value;
	if (isNaN(currAmtVal)) {
		showMessage("js.laboratory.radiology.billpaymentcommon.enternumeric");
		currAmtObj.value = 0;
		currAmtObj.focus();
	}

	if (!validateAmount(currAmtObj, getString("js.laboratory.radiology.billpaymentcommon.currency.validamount"))) {
		currAmtObj.value = 0;
		currAmtObj.focus();
	}

	var numPayments = getNumOfPayments();
	var paymentIndex = numPayments;

	if (numPayments > 0) {
		paymentIndex = ((thisRow.rowIndex) - paymentRowsUncloned) / paymentRows;
	}

	var currObj = getIndexedFormElement(documentForm, "currencyId", paymentIndex);
	var currVal = currObj.value;

	var exchRateObj = getIndexedFormElement(documentForm, "exchangeRate", paymentIndex);
	var payObj = getIndexedFormElement(documentForm, "totPayingAmt", paymentIndex);

	if (trim(currAmtVal) != '' && currVal != '') {
		var currency = findInList(jForeignCurrencyList, "currency_id", currVal);
		if (!empty(currency)) {
			payObj.readOnly = true;
			payObj.value = formatAmountValue(currAmtVal * currency.conversion_rate);
		}else {
			payObj.readOnly = false;
			payObj.value = '';
			var paymentObj = getIndexedFormElement(documentForm, "paymentType", paymentIndex);
			var type = paymentObj.value;
			setPayingAmountPaise(type, paymentIndex);
		}
	}
}

/*
 * Run through all the date widgets and ensure they have properly formatted date.
 */
function validatePayDates() {
	var valid = true;

	var numPayments = getNumOfPayments();
	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var pay = getIndexedFormElement(documentForm, "totPayingAmt", i);
			if ( (null != pay) && (pay.value != "") ) {
				if (allowReceiptBackDate != 'N'){
					var dateObj = getIndexedFormElement(documentForm, "payDate", i);
					var timeObj = getIndexedFormElement(documentForm, "payTime", i);
					if ( !dateObj ) continue;
					valid = valid && validateRequired(dateObj, getString("js.laboratory.radiology.billpaymentcommon.paymentdate.required"));
					valid = valid && validateRequired(timeObj, getString("js.laboratory.radiology.billpaymentcommon.paymenttime.required"));

					valid = valid && doValidateDateField(dateObj);
					valid = valid && validateTime(timeObj);
				}

				if (!valid) return false;
			}
		}
	}
	return true;
}

/*
 * Validate that a counter is selected if any payment is being made
 */
function validateCounter() {
	if (typeof(documentForm) != 'undefined' && documentForm.counterId.value == "") {
		showMessage("js.laboratory.radiology.billpaymentcommon.notauthorized.collect");
		return false;
	}
	return true;
}

function validateAllNumerics() {
	var numPayments = getNumOfPayments();
	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
			var tdsObj = getIndexedFormElement(documentForm, "tdsAmt", i);
			var amtObj = getIndexedFormElement(documentForm, "totPayingAmt", i);
			var currIdObj = getIndexedFormElement(documentForm, "currencyId", i);
			var currAmtObj = getIndexedFormElement(documentForm, "currencyAmt", i);

			var type = paymentObj.value;

			if (( null != currIdObj) && !currIdObj.disabled && (currIdObj.value != "") ) {
				if ( (null != currAmtObj) && !currAmtObj.disabled && (currAmtObj.value != "") ) {
					if (!validateAmount(currAmtObj, getString("js.laboratory.radiology.billpaymentcommon.currency.validamount")))
					return false;
				}
			}else {
				if ( (null != currAmtObj) && !currAmtObj.disabled && (currAmtObj.value != "") ) {
					currAmtObj.value = "";
				}
			}

			if ( (null != amtObj) && (amtObj.value != "") ) {
				if (!validateAmount(amtObj, getString("js.laboratory.radiology.billpaymentcommon.pay.validamount")))
				return false;
			}

			if ( (null != tdsObj) && (tdsObj.value != "") ) {
				if (!validateAmount(tdsObj, getString("js.laboratory.radiology.billpaymentcommon.tds.validamount")))
				return false;
			}
		}
	}
	return true;
}

function addMandatoryIndicators() {
	var numPayments = getNumOfPayments();
	for (var i=0; i<numPayments; i++) {

		var cardtype = getIndexedFormElement(documentForm, "cardTypeId", i);
		if (!cardtype.disabled) {
			appendStarSpan(cardtype.parentNode);
		} else {
			removePreviousSpans(cardtype.parentNode);
		}

		var bank = getIndexedFormElement(documentForm, "bankName", i);
		if (!bank.disabled ) {
			appendStarSpan(bank.parentNode);
		} else {
			removePreviousSpans(bank.parentNode);
		}

		var ref = getIndexedFormElement(documentForm, "refNumber", i);
		if (!ref.disabled ) {
			appendStarSpan(ref.parentNode);
		} else {
			removePreviousSpans(ref.parentNode);
		}

		var btch = getIndexedFormElement(documentForm, "bankBatchNo", i);
		if (!btch.disabled ) {
			appendStarSpan(btch.parentNode);
		} else {
			removePreviousSpans(btch.parentNode);
		}

		var crdAuth = getIndexedFormElement(documentForm, "cardAuthCode", i);
		if (!crdAuth.disabled) {
			appendStarSpan(crdAuth.parentNode);
		} else {
			removePreviousSpans(crdAuth.parentNode);
		}

		var crdHolder = getIndexedFormElement(documentForm, "cardHolderName", i);
		if (!crdHolder.disabled ) {
			appendStarSpan(crdHolder.parentNode);
		} else {
			removePreviousSpans(crdHolder.parentNode);
		}


		var crdNumber = getIndexedFormElement(documentForm, "cardNumber", i);
		if (!crdNumber.disabled ) {
			appendStarSpan(crdNumber.parentNode);
		} else {
			removePreviousSpans(crdNumber.parentNode);
		}

		var crdExpDt = getIndexedFormElement(documentForm, "cardExpDate", i);
		if (!crdExpDt.disabled) {
			appendStarSpan(crdExpDt.parentNode);
		} else {
			removePreviousSpans(crdExpDt.parentNode);
		}
	}

	return true;
}

/*
 * Validate that if a payment is being made via non-cash instruments,
 * the required values are provided as per payment mode master preference.
 */
function validatePaymentTagFields() {

	var numPayments = getNumOfPayments();
	var payingAmt = getPayingAmountPaise('patient') + getPayingAmountPaise('refund') + getPayingAmountPaise('sponsor');

	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {

			var totPayAmt = getIndexedFormElement(documentForm, "totPayingAmt", i);

			if (payingAmt != 0) {

				if (getPaise(totPayAmt.value) != 0) {

					var payType = getIndexedFormElement(documentForm, "paymentType", i);
					if (!payType.disabled && payType.value == "") {
						showMessage("js.laboratory.radiology.billpaymentcommon.paymenttype.required");
						payType.focus();
						return false;
					}

					var payMode = getIndexedFormElement(documentForm, "paymentModeId", i);
					if (!payMode.disabled && payMode.value == "") {
						showMessage("js.laboratory.radiology.billpaymentcommon.mode.required");
						payMode.focus();
						return false;
					}
				}

				var cardtype = getIndexedFormElement(documentForm, "cardTypeId", i);
				if (!cardtype.disabled && trim(cardtype.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.cardtype.required");
					cardtype.focus();
					return false;
				}

				var bank = getIndexedFormElement(documentForm, "bankName", i);
				if (!bank.disabled && trim(bank.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.bankname.required");
					bank.focus();
					return false;
				}
				if (bank.value.length > 50) {
					showMessage("js.laboratory.radiology.billpaymentcommon.entershortname.banknamefield");
					bank.focus();
					return false;
				}

				var ref = getIndexedFormElement(documentForm, "refNumber", i);
				if (!ref.disabled && trim(ref.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.bankrefnumber.required");
					ref.focus();
					return false;
				}

				if (ref.value.length >50) {
					 showMessage("js.laboratory.radiology.billpaymentcommon.entershortreferencenumber.refnumfield");
					 ref.focus();
  	                 return false;
				}

				var btch = getIndexedFormElement(documentForm, "bankBatchNo", i);
				if (!btch.disabled && trim(btch.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.bankbatchnumber.required");
					btch.focus();
					return false;
				}

				if (btch.value.length >100) {
					 showMessage("js.laboratory.radiology.billpaymentcommon.batchnumberexceedssize100");
					 btch.focus();
  	                 return false;
				}

				var crdAuth = getIndexedFormElement(documentForm, "cardAuthCode", i);
				if (!crdAuth.disabled && trim(crdAuth.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.cardauthorizationcode.required");
					crdAuth.focus();
					return false;
				}

				if (crdAuth.value.length >100) {
					 showMessage("js.laboratory.radiology.billpaymentcommon.cardauthorizationcodeexceedssize100");
					 crdAuth.focus();
  	                 return false;
				}

				var crdHolder = getIndexedFormElement(documentForm, "cardHolderName", i);
				if (!crdHolder.disabled && trim(crdHolder.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.cardholdername.required");
					crdHolder.focus();
					return false;
				}

				if (crdHolder.value.length >100) {
					 showMessage("js.laboratory.radiology.billpaymentcommon.cardholdernameexceedssize300");
					 crdHolder.focus();
  	                 return false;
				}

				var crdNumber = getIndexedFormElement(documentForm, "cardNumber", i);
				if (!crdNumber.disabled && trim(crdNumber.value) == "") {
					showMessage("js.laboratory.radiology.billpaymentcommon.cardnumber.required");
					crdNumber.focus();
					return false;
				}

				if (crdNumber.value.length >100) {
					 showMessage("js.laboratory.radiology.billpaymentcommon.cardnumberexceedssize150");
					 crdNumber.focus();
  	                 return false;
				}

				var multiVisitSelectBox = getIndexedFormElement(documentForm, "multi_visit_package", i);
				var packageIdObj = getIndexedFormElement(documentForm, "packageId", i);
				if(multiVisitSelectBox && packageIdObj) {
					if(multiVisitSelectBox.checked) {
						if(empty(packageIdObj.value)) {
							showMessage("js.laboratory.radiology.billpaymentcommon.pleaseselectapackage");
							packageIdObj.focus();
							return false;
						}
					}
				}

				var crdExpDt = getIndexedFormElement(documentForm, "cardExpDate", i);
				if (!crdExpDt.disabled) {
					if (trim(crdExpDt.value) == "") {
						showMessage("js.laboratory.radiology.billpaymentcommon.cardexpirydate.required");
						crdExpDt.focus();
						return false;
					}

					var errorStr = validateCardDateStr(crdExpDt.value, "future");
					if (errorStr != null) {
						alert(errorStr);
						crdExpDt.focus();
						return false;
					}
				}
			}
		}
	}
	return true;
}

function validateDepositSetOff(depositSetOffObj, origDepositSetOffObj) {

	clearBillPaymentDetails();

	var isReturns = (empty(isReturns)) ? false : isReturns;

	var valid = true;

	if (typeof(depositSetOffObj) != 'undefined' && depositSetOffObj != null) {

		if (!validateAmount(depositSetOffObj, getString("js.laboratory.radiology.billpaymentcommon.depositsetoff.avalidamount"))) {
			depositSetOffObj.value = 0;
			valid = false;
		}

		var depositSetOffPaise = getPaise(depositSetOffObj.value);

		if (depositSetOffPaise >= 0) {
			if (!isReturns) {
				// Billing need to reset back to original deposit set off used.
				if (typeof(origDepositSetOffObj) != 'undefined' && origDepositSetOffObj != null) {

					if (depositSetOffPaise > total_DepositAmtAvailablePaise) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.depositsetoff.lessthanavailabledeposits");
						msg +=formatAmountPaise(total_DepositAmtAvailablePaise);
						msg +=getString( "js.laboratory.radiology.billpaymentcommon.resettingtoexisitingdeposits");
						alert(msg);
						depositSetOffObj.value = origDepositSetOffObj.value;
						depositSetOffObj.focus();
						valid = false;
					}else {
						// Bill deposits existing, so on deposit amount change resetTotals() is called.
						valid = true;
					}

				}else {
					// Pharmacy sales reset to zero.
					if (depositSetOffPaise > total_DepositAmtAvailablePaise) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.depositsetoffamount.notexceedmaxamount");
						msg +=formatAmountPaise(total_DepositAmtAvailablePaise);
						msg +=getString("js.laboratory.radiology.billpaymentcommon.resettingtozero");
						alert(msg);
						depositSetOffObj.value = 0;
						depositSetOffObj.focus();
						valid = false;
					}else {
						valid = true;
					}

					// Existing sale deposits -- calculate less deposits.
					total_LessDeposits = getPaise(depositSetOffObj.value);
					resetPayments();
				}
			}else if (isReturns) {
				// Pharmacy returns reset to zero
				if (depositSetOffPaise > total_DepositAmtAvailablePaise) {
					showMessage("js.laboratory.radiology.billpaymentcommon.depositsetoffamount.notexceedbilldepositamount");
					depositSetOffObj.value = 0;
					depositSetOffObj.focus();
					valid = false;

				}else if (total_DepositAmtAvailablePaise > 0) {
					valid = true;
				}

				// Existing sale deposits -- calculate less deposits.
				total_LessDeposits = getPaise(depositSetOffObj.value);
				resetPayments();
			}
		}
	}

	return valid;
}

function calculatePointsRedeemedAmt(pointsRedeemedObj, pointsRedeemedAmountObj) {
	if (pointsRedeemedObj != null) {
		var newPointsRedeemedAmt = pointsRedeemedObj.value * points_redemption_rate;
		pointsRedeemedAmountObj.value = formatAmountValue(newPointsRedeemedAmt);
	}
}

function validateRewardPoints(pointsRedeemedObj, pointsRedeemedAmountObj, origPointsRedeemedObj) {
	clearBillPaymentDetails();
	return validateRewardPointsRedeemed(pointsRedeemedObj, pointsRedeemedAmountObj, origPointsRedeemedObj);
}

function validateRewardPointsRedeemed(pointsRedeemedObj, pointsRedeemedAmountObj, origPointsRedeemedObj) {

	var isReturns = (empty(isReturns)) ? false : isReturns;

	if (isReturns) return true;

	var valid = true;

	if (typeof(pointsRedeemedObj) != 'undefined' && pointsRedeemedObj != null) {

		if (!validateInteger(pointsRedeemedObj, getString("js.laboratory.radiology.billpaymentcommon.pointsredeemed.avalidnumber"))) {
			pointsRedeemedObj.value = 0;
			calculatePointsRedeemedAmt(pointsRedeemedObj, pointsRedeemedAmountObj);
			valid = false;
		}

		calculatePointsRedeemedAmt(pointsRedeemedObj, pointsRedeemedAmountObj);

		var pointsRedeemed = pointsRedeemedObj.value;
		var pointsRedeemedAmtPaise = getPaise(pointsRedeemedAmountObj.value);

		if (pointsRedeemed >= 0) {
			if (!isReturns) {
				// Billing need to reset back to original points redeemed.??
				if (typeof(origPointsRedeemedObj) != 'undefined' && origPointsRedeemedObj != null) {

					if (pointsRedeemed > total_RewardPointsAvailable) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.pointsredeemed.lessthanmaxpoints");
						msg +=formatAmountValue(total_RewardPointsAvailable);
						msg +=getString("js.laboratory.radiology.billpaymentcommon.resettingtozero");
						alert(msg);
						pointsRedeemedObj.value = 0;
						pointsRedeemedObj.focus();
						valid = false;

					}else if (pointsRedeemedAmtPaise > total_RewardPointsAmountAvailable) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.pointsredeemedamount.notexceedeligibleamount");
						 msg+=formatAmountPaise(total_RewardPointsAmountAvailable);
						 msg +=getString("js.laboratory.radiology.billpaymentcommon.resettingtozero");
						alert(msg);
						pointsRedeemedObj.value = 0;
						pointsRedeemedObj.focus();
						valid = false;

					}else {
						// Bill Reward points existing, so on reward points change resetTotals() is called.
						valid = true;
					}

					calculatePointsRedeemedAmt(pointsRedeemedObj, pointsRedeemedAmountObj);

				}else {
					// Pharmacy sales reset to zero.
					if (pointsRedeemed > total_RewardPointsAvailable) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.pointsredeemed.notexceedmaxpoints");
						msg +=formatAmountValue(total_RewardPointsAvailable);
						msg +=getString("js.laboratory.radiology.billpaymentcommon.resettingtozero");
						alert(msg);
						pointsRedeemedObj.value = 0;
						pointsRedeemedObj.focus();
						valid = false;

					}else if (pointsRedeemedAmtPaise > total_RewardPointsAmountAvailable) {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.pointsredeemedamount.notexceedeligibleamount");
						msg +=formatAmountPaise(total_RewardPointsAmountAvailable);
						msg +=getString("js.laboratory.radiology.billpaymentcommon.resettingtozero");
						alert(msg);
						pointsRedeemedObj.value = 0;
						pointsRedeemedObj.focus();
						valid = false;

					}else {
						valid = true;
					}

					calculatePointsRedeemedAmt(pointsRedeemedObj, pointsRedeemedAmountObj);

					// Existing reward points and reward points amount
					total_LessRewardPoints = pointsRedeemedObj.value;
					total_LessRewardPointsAmount = getPaise(pointsRedeemedAmountObj.value);
					resetPayments();
				}
			}
		}
	}

	return valid;
}

function validatePaymentAmount() {

	var totalAmt =  Math.abs(getTotalAmount());

	// TODO: Need to use same deposit field in all payment screens
	var depositSetOff = 0;
	if (documentForm.depositsetoff)
		depositSetOff = getPaise(documentForm.depositsetoff.value);
	else if(documentForm.depositSetOff)
		depositSetOff = getPaise(documentForm.depositSetOff.value);

	var rewardPointsAmount = 0;
	if (documentForm.rewardPointsRedeemedAmount)
		rewardPointsAmount = getPaise(documentForm.rewardPointsRedeemedAmount.value);

	var payingAmt = getPayingAmountPaise('patient') + getPayingAmountPaise('refund')
					+ getPayingAmountPaise('sponsor') + depositSetOff + rewardPointsAmount;

	var dueAmount = getTotalAmount() - payingAmt;

	payingAmt = Math.abs(payingAmt);

	if (totalAmt >= 0 && (documentForm.billType != null || documentForm.close != null)) {
		var billtype = documentForm.billType.value;

		if (billtype == "BN" || billtype == "BN-I" || billtype == "P") {

			if (payingAmt > totalAmt) {
				var msg=getString("js.laboratory.radiology.billpaymentcommon.totalpaymentamount.morethanbillamount")
				msg+="\n";
				msg+=getString("js.laboratory.radiology.billpaymentcommon.pleaserefundtheexcessamount");
				alert(msg);
				return false;
			}

			if (payingAmt != totalAmt) {
				var msg=getString("js.laboratory.radiology.billpaymentcommon.totalbillamount.patientpaidamountsdonotmatch");
				msg+="\n";
				msg+=getString("js.laboratory.radiology.billpaymentcommon.pleasepaythebillamount");
				alert(msg);
				return false;
			}

			if (totalAmt != 0 && (payingAmt == totalAmt)
				&& (Math.abs(getPayingAmountPaise('refund')) == totalAmt)
				&& (getPayingAmountPaise('patient') == 0)
				&& (getPayingAmountPaise('sponsor') == 0)
				&& (!isReturns) ) {
				var msg=getString("js.laboratory.radiology.billpaymentcommon.totalbillamount.patientpaidamountsdoesnotmatch");
				msg+="\n";
				msg+=getString("js.laboratory.radiology.billpaymentcommon.pleasepaythebillamount");
				alert(msg);
				return false;
			}

		}else if (documentForm.close != null && documentForm.close.checked) {
			if (payingAmt != totalAmt) {
				if(!validateSettlement()) {
					var msg=getString("js.laboratory.radiology.billpaymentcommon.totalbillamount.patientpaidamountsdonotmatch");
					msg+="\n";
					msg+=getString("js.laboratory.radiology.billpaymentcommon.settle/refundtheamounttoclosetheaccount");
					alert(msg);
					if (documentForm.close != null)
						documentForm.close.checked = false;

					return false;
				}else if (dueAmount > 0) {
					if (writeOffAmountRights == 'A') {
						var ok = confirm("Warning: Total bill amount and patient paid amounts do not match.\n" +
									"The balance amount will be considered as Write-Off. Do you want to proceed?");
						if (!ok) {
							if (documentForm.close != null)
								documentForm.close.checked = false;
							return false;

						}else {
							var billRemarksObj = getIndexedFormElement(documentForm, "billRemarks", 0);
							var oldRemarksObj = getIndexedFormElement(documentForm, "oldRemarks", 0);

							if ( (null != billRemarksObj) && (
								('' == trimAll(billRemarksObj.value))||
								(trimAll(oldRemarksObj.value) == trimAll(billRemarksObj.value)))) {
								showMessage("js.laboratory.radiology.billpaymentcommon.entervalidreasonforwrite-off.");
								billRemarksObj.focus();
								return false;
							}
						}
					}else {
						var msg=getString("js.laboratory.radiology.billpaymentcommon.totalbillamount.patientpaidamountsdonotmatch");
						msg+="\n";
						msg+=getString("js.laboratory.radiology.billpaymentcommon.notauthorized.write-offthebalanceamount");
						alert(msg);
						if (documentForm.close != null)
							documentForm.close.checked = false;
						return false;
					}
				}else if (dueAmount < 0) {
					var msg=getString("js.laboratory.radiology.billpaymentcommon.totalbillamount.patientpaidamountsdoesnotmatch");
					msg+="\n";
					msg+=getString("js.laboratory.radiology.billpaymentcommon.cannotclosethebill");
					alert(msg);
					return false;
				}
			}
		}
	}

	if (documentForm.billType != null || documentForm.close != null) {
		var billtype = documentForm.billType.value;

		if (billtype == "BN" || billtype == "BN-I" || billtype == "P") {
			if (payingAmt == totalAmt) {
				if (documentForm.close != null)
					documentForm.close.checked = true;
			}
		}
	}

	return true;
}

function validateSettlement() {
	var numPayments = getNumOfPayments();

	if (numPayments > 0) {
		for (var i=0; i<numPayments; i++) {
			var payType = getIndexedFormElement(documentForm, "paymentType", i);
			if (payType.value == "receipt_settlement" || payType.value == "refund") {
				return true;
			}
		}
	}
	return false;
}

function clearBillPaymentDetails() {
	var numPayments = getNumOfPayments();

	if (numPayments > 1) {
		for (var i=0; i<numPayments-1; i++) {
			onDeletePayMode(document.getElementById('deletePayMode'));
		}
	}

	for (var i=0; i<numPayments; i++) {
		clearPaymentFields(i);
	}
}

function clearPaymentFields(i) {
	var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
	var modeObj = getIndexedFormElement(documentForm, "paymentModeId", i);
	var totPayAmt = getIndexedFormElement(documentForm, "totPayingAmt", i);

	if (paymentObj != null) paymentObj.selectedIndex = 0;
	if (modeObj != null) setSelectedIndex(modeObj, "-1");
	if (modeObj != null) enableBankDetails(modeObj);
	if (totPayAmt != null) totPayAmt.value = "";

	var userRemObj = getIndexedFormElement(documentForm, "allUserRemarks", i);
	var payRemObj = getIndexedFormElement(documentForm, "paymentRemarks", i);

	if (userRemObj != null) userRemObj.value = "";
	if (payRemObj != null) payRemObj.value = "";

	var bankObj = getIndexedFormElement(documentForm, "bankName", i);
	var cardObj = getIndexedFormElement(documentForm, "cardTypeId", i);
	var refObj = getIndexedFormElement(documentForm, "refNumber", i);

	var bankBatchObj = getIndexedFormElement(documentForm, "bankBatchNo", i);
	var cardAuthObj = getIndexedFormElement(documentForm, "cardAuthCode", i);
	var cardHolderObj = getIndexedFormElement(documentForm, "cardHolderName", i);

	var cardNumberObj = getIndexedFormElement(documentForm, "cardNumber", i);
	var cardExpDtObj = getIndexedFormElement(documentForm, "cardExpDate", i);

	if (cardObj != null) setSelectedIndex(cardObj, "");

	var currencyObj = getIndexedFormElement(documentForm, "currencyId", i);

	if (currencyObj != null && currencyObj.value != "") {
		setSelectedIndex(currencyObj, "");
		getCurrencyDetails(currencyObj);
	}

	var packageObj = getIndexedFormElement(documentForm, "packageId", i);
	var multiVisitCheckBox = getIndexedFormElement(documentForm, "multi_visit_package", i);

	if(multiVisitCheckBox && multiVisitCheckBox.checked) {
		multiVisitCheckBox.checked = false;
	}

	if(packageObj && !empty(packageObj.value)) {
		setSelectedIndex(packageObj, "");
	}
}

function validateMVRefund(patPackDetailsJson) {
	if(patPackDetailsJson != null && patPackDetailsJson.length > 0) {
		var numPayments = getNumOfPayments();

		if (numPayments > 0) {
			for (var i=0; i<numPayments; i++) {
				var packageIdObj = getIndexedFormElement(documentForm, "packageId", i);
				var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
				if(paymentObj.value == 'refund') {
					if(packageIdObj && !empty(packageIdObj.value)) {
						var list = findInList(patPackDetailsJson,"package_id",packageIdObj.value);
						if(list != null && list.length > 0) {
							for(var j=0;j<list.length;j++) {
								if(list[j].status == 'P') {
									return false;
								}
							}
						}
					}
				}
			}
		}
	}
	return true;
}

function validateMVDeposit(patPackDetailsJson) {
	if(patPackDetailsJson != null && patPackDetailsJson.length > 0) {
		var numPayments = getNumOfPayments();

		if (numPayments > 0) {
			for (var i=0; i<numPayments; i++) {
				var packageIdObj = getIndexedFormElement(documentForm, "packageId", i);
				var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
				if(paymentObj.value == 'receipt_settlement') {
					if(packageIdObj && !empty(packageIdObj.value)) {
						var list = findInList(patPackDetailsJson,"package_id",packageIdObj.value);
						if(list != null && list.length > 0) {
							for(var j=0;j<list.length;j++) {
								if(list[j].status == 'C' || list[j].status == 'X') {
									return false;
								}
							}
						}
					}
				}
			}
		}
	}
	return true;
}

function getMultiVisitPackageBalanceAmt(patPackDetailsJson) {
	var balnaceAmt = 0;
	if(patPackDetailsJson != null && patPackDetailsJson.length > 0) {
		var numPayments = getNumOfPayments();
		if(numPayments > 0) {
			for (var i=0; i<numPayments; i++) {
				var packageIdObj = getIndexedFormElement(documentForm, "packageId", i);
				var paymentObj = getIndexedFormElement(documentForm, "paymentType", i);
				if(paymentObj.value == 'refund') {
					if(packageIdObj && !empty(packageIdObj.value)) {
						var list = findInList(patPackDetailsJson,"package_id",packageIdObj.value);
						if(list != null && list.length > 0) {
								for(var j=0;j<list.length;j++) {
									if(list[j].status == 'C' || list[j].status == 'X') {
										balnaceAmt = getPaise(balnaceAmt)+getPaise(list[j].balance);
									}
								}
							}
					}
				}
			}
		}
	}
	return balnaceAmt;
}

