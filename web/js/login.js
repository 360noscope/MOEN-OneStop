$(document).ready(() => {});

$(document).on("submit", "#signinForm", e => {
  e.preventDefault();
  const username = $("#inputUsername").val();
  const password = $("#inputPassword").val();
  $.post("https://172.19.0.250/auth", {
    authUsername: username,
    authPassword: password
  })
    .done(data => {
      if (data.loginStatus == true) {
        window.location.replace("/home");
      } else {
        $(".login-failed-alert").show();
      }
    })
    .fail(() => {
      console.error("Can't access login server");
    });
});
