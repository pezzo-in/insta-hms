
function onChangePaymentMode() {
	var disableBankDetails;

	var modeObj = document.getElementById("paymentModeId");
	var bankObj = document.getElementById("paymentBank");
	var cardObj = document.getElementById("cardTypeId");
	var refObj = document.getElementById("paymentRefNum");
	var narrationObj = document.getElementById("paymentRemarks");

	setSelectedIndex(cardObj, "");

	var mode = modeObj.value;

	var paymentModeDetail = findInList(jPaymentModes, "mode_id", mode);

	bankObj.disabled = (paymentModeDetail.bank_required != 'Y');
	cardObj.disabled = (paymentModeDetail.card_type_required != 'Y');
	refObj.disabled = (paymentModeDetail.ref_required != 'Y');

	if (bankObj.disabled) bankObj.value = "";
	if (refObj.disabled)  refObj.value = "";

}

function validatePayment() {
	var valid = true;
	var modeObj = document.getElementById("paymentModeId");
	var bankObj = document.getElementById("paymentBank");
	var cardObj = document.getElementById("cardTypeId");
	var refObj = document.getElementById("paymentRefNum");
	var mode = modeObj.value;

	if (!cardObj.disabled && cardObj.value == "") {
		alert("Card type is required");
		cardObj.focus();
		return false;
	}

	if (!bankObj.disabled) {
		if (bankObj.value == "") {
			alert("Bank name is required");
			bankObj.focus();
			return false;
		}
	}

	if (!refObj.disabled) {
		if (refObj.value == "") {
			alert("Bank Ref number is required");
			refObj.focus();
			return false;
		}

		if (refObj.value.length >50) {
			alert("Enter short reference number for ref num field as it cross the field size (50)");
			refObj.focus();
			return false;
		}
	}
	return valid;
}
