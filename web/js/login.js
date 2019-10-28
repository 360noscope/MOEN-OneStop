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
      console.log("test");
      if (data.loginStatus == true) {
        localStorage.setItem("chatUUID", data.uuid);
        window.location.replace("/home");
      } else {
        $(".login-failed-alert").show();
      }
    })
    .fail(() => {
      console.error("Can't access login server");
    });
});
