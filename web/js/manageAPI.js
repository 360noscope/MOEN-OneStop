let keyTable,
  keyNameSupplied = false;
$(document).ready(() => {
  keyTable = $("#keyTable").DataTable({
    paging: true,
    processing: true,
    ordering: false,
    createdRow: function(row, data, index) {
      $(row).addClass("text-center");
    },
    ajax: {
      url: "http://172.19.0.250/listAPIKey",
      type: "POST"
    },
    language: {
      url: "//cdn.datatables.net/plug-ins/1.10.19/i18n/Thai.json"
    },
    info: false,
    columns: [{ data: "keyNumber" }, { data: "keyName" }],
    columnDefs: [
      {
        targets: [2],
        defaultContent:
          "<button class='btn btn-info' id='selectAPI'>แก้ไข/ลบ</button>"
      }
    ]
  });
});

$(document).on("shown.bs.modal", "#new-key-modal", e => {
  $("#keyName").focus();
});

$(document).on("submit", "#apiForm", e => {
  e.preventDefault();
  if (keyNameSupplied) {
    const kName = $("#keyName").val();
    const passworded1 = $("#keyPassword").val();
    const passworded2 = $("#keyPasswordConfirm").val();
    if (passworded1 == passworded2) {
      $.ajax({
        type: "POST",
        url: "http://172.19.0.250/insertApi",
        data: JSON.stringify({ keyName: kName, keyPassword: passworded1 }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: data => {
          $("#new-key-modal").modal("hide");
          keyTable.ajax.reload();
        },
        failure: errMsg => {
          alert(errMsg);
        }
      });
    } else {
      alert("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    }
  } else {
    alert("ชื่อ key ซ้ำกับ key ที่มีอยู่แล้ว");
  }
});

$(document).on("focusout", "#keyName", e => {
  const kName = $("#keyName").val();
  $.ajax({
    type: "POST",
    url: "http://172.19.0.250/apiexists",
    data: JSON.stringify({ keyName: kName }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: data => {
      if (data.apiFound == true) {
        $("#keyNameBlock").addClass("has-error");
        $("#helpKeyname").show();
        keyNameSupplied = false;
      } else {
        $("#keyNameBlock").removeClass("has-error");
        $("#helpKeyname").hide();
        keyNameSupplied = true;
      }
    },
    failure: errMsg => {
      alert(errMsg);
    }
  });
});

$(document).on("focusout", "#keyPassword", () => {
  let password1 = $("#keyPassword").val();
  if (password1 == "") {
    $("#helpKeypassword1").html("กรุณากรอกรหัสผ่าน");
    $("#keypasswordBlock1").addClass("has-error");
    $("#helpKeypassword1").show();
    $("#keypasswordBlock2").removeClass("has-success");
    $("#keypasswordBlock2").removeClass("has-error");
    $("#helpKeypassword2").hide();
  } else {
    $("#keypasswordBlock1").removeClass("has-error");
    $("#helpKeypassword1").hide();
    $("#keypasswordBlock2").removeClass("has-success");
    $("#keypasswordBlock2").removeClass("has-error");
    $("#helpKeypassword2").hide();
  }
});

$(document).on("focusout", "#keyPasswordConfirm", () => {
  let password1 = $("#keyPassword").val();
  let password2 = $("#keyPasswordConfirm").val();
  if (password2 == "") {
    $("#keypasswordBlock2").addClass("has-error");
    $("#helpKeypassword2").html("กรุณากรอกรหัสผ่านยืนยัน");
    $("#helpKeypassword2").show();
  } else {
    if (password1 == password2) {
      $("#keypasswordBlock2").addClass("has-success");
      $("#helpKeypassword2").html("รหัสผ่านตรงกัน");
      $("#helpKeypassword2").show();
      $("#keypasswordBlock1").addClass("has-success");
      $("#helpKeypassword1").html("รหัสผ่านตรงกัน");
      $("#helpKeypassword1").show();
    } else {
      $("#keypasswordBlock2").addClass("has-error");
      $("#helpKeypassword2").html("รหัสผ่านไม่ตรงกัน");
      $("#helpKeypassword2").show();
      $("#keypasswordBlock1").addClass("has-error");
      $("#helpKeypassword1").html("รหัสผ่านไม่ตรงกัน");
      $("#helpKeypassword1").show();
    }
  }
});
