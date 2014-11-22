function validate() {
	var strUser = document.forms[0].userId.value;
  	var strPwd	= document.forms[0].password.value;
  	var strHospital = document.forms[0].hospital.value;

  	if(strHospital == "") {
	  	alert("Please Enter Hospital");
	  	document.forms[0].hospital.focus();
		return false;
  	}
	if(strUser == "") {
	  	alert("Please Enter User Name");
	  	document.forms[0].userId.focus();
		return false;
  	}
  	if(strPwd == "") {
	  	alert("Please Enter Password");
	  	document.forms[0].password.focus();
		return false;
  	}
  	return true;
}

function init() {
  	if(loginStatus == 'errorInUpdatePassword') {
  		document.getElementById("oldpwd").value = '';
  		document.getElementById("changePasswordDiv").style.display="block";
	}
	if(!notifyPasswordChange && loginStatus!='blockUser' && loginStatus!='errorInUpdatePassword')
		clear();
}

function clear(){
	document.forms[0].password.value="";
	var hospital = document.forms[0].hospital.value;
	if (hospital != '') {
		document.forms[0].userId.focus();
	} else {
		document.forms[0].hospital.focus();
	}


}//End of the clear function

function changePassword(){
	document.getElementById("oldpwd").value = '';
	document.getElementById("changePasswordDiv").style.display="block";
	document.getElementById("blockUser").style.display="none";
}

function submitFun() {
	 var oldpwd=document.getElementById("oldpwd").value;
     var newpwd=document.getElementById("pwd").value;
     if(oldpwd==""){
         alert("Enter Old Password");
         document.getElementById("oldpwd").focus();
         return false;
     }
     if(oldpwd==newpwd) {
      alert("New password is same as the old password");
      document.forms[0].pwd.value="";
         document.forms[0].cpwd.value="";
         document.forms[0].pwd.focus();
      return false;
     }
     if(!passequal()){
         return false;
     }
	document.changePasswordForm.action = cpath+"/pages/AdminModule/ChangePassword.do";
	document.changePasswordForm.method.value = "updatePassword";
	document.changePasswordForm.submit();
}
function passequal() {
    var str = document.getElementById("pwd").value;
    var str1= document.getElementById("cpwd").value;

    if(str=="") {
        alert("Enter New Password")
        document.getElementById("pwd").focus();
        return false;
    }
    if(!(str==str1)) {
        alert("Passwords mismatch !! Fill again !!");
        document.getElementById("pwd").value="";
        document.getElementById("cpwd").value="";
        document.getElementById("pwd").focus();
        return false;
    }
    return true;
}