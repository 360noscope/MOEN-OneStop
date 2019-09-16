$(document).ready(() => {
 
});

$(document).on("submit", "#signinForm", e => {
  e.preventDefault();
  const username = $("#inputUsername").val();
  const password = $("#inputPassword").val();
  $.ajax({
    type: "POST",
    url: "http://172.19.0.250/auth",
    data: JSON.stringify({ authUsername: username, authPassword: password }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: data => {
      if (data.authSuccess == true) {
        window.location.replace('/home');
      } else {
       $('.login-failed-alert').show();
      }
    },
    failure: errMsg => {
      alert(errMsg);
    }
  });
});

function getLocalProfile(callback) {
  var profileImgSrc = localStorage.getItem("PROFILE_IMG_SRC");
  var profileName = localStorage.getItem("PROFILE_NAME");
  var profileReAuthEmail = localStorage.getItem("PROFILE_REAUTH_EMAIL");

  if (
    profileName !== null &&
    profileReAuthEmail !== null &&
    profileImgSrc !== null
  ) {
    callback(profileImgSrc, profileName, profileReAuthEmail);
  }
}

function loadProfile() {
  if (!supportsHTML5Storage()) {
    return false;
  }
  // we have to provide to the callback the basic
  // information to set the profile
  getLocalProfile(function(profileImgSrc, profileName, profileReAuthEmail) {
    //changes in the UI
    $("#profile-img").attr("src", profileImgSrc);
    $("#profile-name").html(profileName);
    $("#reauth-email").html(profileReAuthEmail);
    $("#inputEmail").hide();
    $("#remember").hide();
  });
}

function supportsHTML5Storage() {
  try {
    return "localStorage" in window && window["localStorage"] !== null;
  } catch (e) {
    return false;
  }
}

function testLocalStorageData() {
  if (!supportsHTML5Storage()) {
    return false;
  }
  localStorage.setItem(
    "PROFILE_IMG_SRC",
    "//lh3.googleusercontent.com/-6V8xOA6M7BA/AAAAAAAAAAI/AAAAAAAAAAA/rzlHcD0KYwo/photo.jpg?sz=120"
  );
  localStorage.setItem("PROFILE_NAME", "César Izquierdo Tello");
  localStorage.setItem("PROFILE_REAUTH_EMAIL", "oneaccount@gmail.com");
}
