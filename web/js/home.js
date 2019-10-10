$(document).ready(() => {});

const logoutEvent = e => {
  $.get("https://172.19.0.250/signout")
    .done(data => {
      if (data.logoutResult == true) {
        window.location.replace("/");
      }
    })
    .fail(() => {
      console.log("Cant access server");
    });
};
$(document).on("click", "#logoutBtn", logoutEvent);
