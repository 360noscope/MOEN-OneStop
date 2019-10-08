let userTable, wSocket, personData;
$(document).ready(() => {
  const wsCheck = () => {
    if (!wSocket || wSocket.readyState === wSocket.CLOSED) startConnection();
  };
  const startConnection = () => {
    wSocket = null;
    wSocket = new WebSocket("wss://172.19.0.250:443/?type=web");
    wSocket.onopen = event => {
      console.log("Web socket connected!");
    };
    wSocket.onmessage = event => {
      const sexName = { 1: "ชาย", 2: "หญิง" };
      const returnMsg = JSON.parse(event.data);
      const returnData = returnMsg.data;
      personData = returnData;
      switch (returnMsg.action) {
        case "cardData":
          $("#identityForm button[type=submit]").attr("disabled", false);
          $("#identityID").val(returnData.Id);
          $("#thaiName").val(
            returnData.Th_prefix +
              " " +
              returnData.Th_firstname +
              " " +
              returnData.Th_lastname
          );
          $("#engName").val(
            returnData.Eng_prefix +
              " " +
              returnData.Eng_firstname +
              " " +
              returnData.Eng_lastname
          );
          $("#sex").val(sexName[returnData.Sex]);
          $("#birthDate").val(returnData.BDate);
          $("#issueDate").val(returnData.Issued_date);
          $("#expiredDate").val(returnData.Expired_date);
          $("#identPic").attr("src", returnData.Picture);
          break;
        case "error":
          if (returnData == "NO_READER") {
            $("#identityForm button[type=submit]").attr("disabled", true);
            alert("ไม่ได้เสียบเครื่องอ่านหรือยังไม่ได้เสียบการ์ด");
          }
          break;
      }
    };
    wSocket.onclose = event => {
      console.log("Web socket closed!");
      wsCheck();
    };
  };

  startConnection();
  setInterval(startConnection(), 5000);

  userTable = $("#userTable").DataTable({
    paging: true,
    processing: true,
    ordering: false,
    createdRow: function(row, data, index) {
      $(row).addClass("text-center");
    },
    ajax: {
      url: "https://172.19.0.250/listOfficer",
      type: "GET"
    },
    language: {
      url: "//cdn.datatables.net/plug-ins/1.10.19/i18n/Thai.json"
    },
    info: false,
    columns: [
      { data: "id" },
      { data: "type" },
      { data: "th_name" },
      { data: "en_name" },
      { data: "position" },
      { data: "workgroup" },
      { data: "department" },
      { data: "section" }
    ],
    columnDefs: [
      {
        targets: [0],
        visible: false,
        searchable: false
      },
      {
        targets: [8],
        defaultContent:
          "<button class='btn btn-info' id='selectOfficer'>แก้ไข/ลบ</button>"
      }
    ],
    drawCallback: function(settings) {
      var api = this.api();
      var rows = api.rows({ page: "current" }).nodes();
      var last = null;

      api
        .column(6, { page: "current" })
        .data()
        .each((group, i) => {
          if (last !== group) {
            $(rows)
              .eq(i)
              .before(
                '<tr class="group text-center"><td colspan="8"><strong>' +
                  group +
                  "</strong></td></tr>"
              );
            last = group;
          }
        });
    }
  });
});

$(document).on("click", "#readCard", e => {
  e.preventDefault();
  wSocket.send(JSON.stringify({ Action: "retreivedData" }));
});

$(document).on("shown.bs.modal", "#idInsertModal", e => {
  $.get("https://172.19.0.250/listSection", (data, status) => {
    if (data.length > 0) {
      $("#section").attr("disabled", false);
      $("#section")
        .find("option")
        .remove()
        .end();
      data.forEach(item => {
        $("#section").append(
          $("<option />")
            .val(item.sectionId)
            .text(item.sectionName)
        );
      });
      const selectedSect = $("#section option:selected").val();
      $.post(
        "https://172.19.0.250/listDept",
        { sectionid: selectedSect },
        (data, status) => {
          if (data.length > 0) {
            $("#department").attr("disabled", false);
            $("#department")
              .find("option")
              .remove()
              .end();
            data.forEach(item => {
              $("#department").append(
                $("<option />")
                  .val(item.deptUUID)
                  .text(item.deptName)
              );
            });
            const selectedDept = $("#department option:selected").val();
            $.post(
              "https://172.19.0.250/listWorkgroup",
              { deptuuid: selectedDept },
              (data, status) => {
                if (data.length > 0) {
                  $("#workgroup").attr("disabled", false);
                  $("#workgroup")
                    .find("option")
                    .remove()
                    .end();
                  data.forEach(item => {
                    $("#workgroup").append(
                      $("<option />")
                        .val(item.groupUUID)
                        .text(item.groupName)
                    );
                  });
                } else {
                  $("#workgroup").attr("disabled", true);
                  $("#workgroup")
                    .find("option")
                    .remove()
                    .end()
                    .append(
                      $("<option />")
                        .val("0")
                        .text("ไม่มีข้อมูล")
                    );
                }
              }
            );
          } else {
            $("#department").attr("disabled", true);
            $("#department")
              .find("option")
              .remove()
              .end()
              .append(
                $("<option />")
                  .val("0")
                  .text("ไม่มีข้อมูล")
              );
          }
        }
      );
    } else {
      $("#section").attr("disabled", true);
      $("#section")
        .find("option")
        .remove()
        .end()
        .append(
          $("<option />")
            .val("0")
            .text("ไม่มีข้อมูล")
        );
    }
  });

  $.get("https://172.19.0.250/listEmployeeType", (data, status) => {
    if (data.length > 0) {
      $("#emptype").attr("disabled", false);
      $("#emptype")
        .find("option")
        .remove()
        .end();
      data.forEach(item => {
        $("#emptype").append(
          $("<option />")
            .val(item.typeId)
            .text(item.typeName)
        );
      });
      const selectedType = $("#emptype option:selected").val();
      $.post(
        "https://172.19.0.250/listEmployeeJob",
        { typeId: selectedType },
        (data, status) => {
          if (data.length > 0) {
            $("#empjob").attr("disabled", false);
            $("#empjob")
              .find("option")
              .remove()
              .end();
            data.forEach(item => {
              $("#empjob").append(
                $("<option />")
                  .val(item.empTypeLevelId)
                  .text(item.empTypeLevelName)
              );
            });
          } else {
            $("#empjob").attr("disabled", true);
            $("#empjob")
              .find("option")
              .remove()
              .end()
              .append(
                $("<option />")
                  .val("0")
                  .text("ไม่มีข้อมูล")
              );
          }
        }
      );
    } else {
      $("#emptype").attr("disabled", true);
      $("#emptype")
        .find("option")
        .remove()
        .end()
        .append(
          $("<option />")
            .val("0")
            .text("ไม่มีข้อมูล")
        );
    }
  });

  $.get("https://172.19.0.250/listEmployeeLevel", (data, status) => {
    if (data.length > 0) {
      $("#emplevel").attr("disabled", false);
      $("#emplevel")
        .find("option")
        .remove()
        .end();
      data.forEach(item => {
        $("#emplevel").append(
          $("<option />")
            .val(item.levelId)
            .text(item.levelName)
        );
      });
    } else {
      $("#emplevel").attr("disabled", true);
      $("#emplevel")
        .find("option")
        .remove()
        .end()
        .append(
          $("<option />")
            .val("0")
            .text("ไม่มีข้อมูล")
        );
    }
  });

  $.get("https://172.19.0.250/listEmployeePosition", (data, status) => {
    if (data.length > 0) {
      $("#emppos").attr("disabled", false);
      $("#emppos")
        .find("option")
        .remove()
        .end();
      data.forEach(item => {
        $("#emppos").append(
          $("<option />")
            .val(item.PositionId)
            .text(item.PositionName)
        );
      });
    } else {
      $("#emppos").attr("disabled", true);
      $("#emppos")
        .find("option")
        .remove()
        .end()
        .append(
          $("<option />")
            .val("0")
            .text("ไม่มีข้อมูล")
        );
    }
  });
});

$(document).on("change", "#emptype", e => {
  const selectedType = $("#emptype option:selected").val();
  $.post(
    "https://172.19.0.250/listEmployeeJob",
    { typeId: selectedType },
    (data, status) => {
      if (data.length > 0) {
        $("#empjob").attr("disabled", false);
        $("#empjob")
          .find("option")
          .remove()
          .end();
        data.forEach(item => {
          $("#empjob").append(
            $("<option />")
              .val(item.empTypeLevelId)
              .text(item.empTypeLevelName)
          );
        });
      } else {
        $("#empjob").attr("disabled", true);
        $("#empjob")
          .find("option")
          .remove()
          .end()
          .append(
            $("<option />")
              .val("0")
              .text("ไม่มีข้อมูล")
          );
      }
    }
  );
});

$(document).on("change", "#section", () => {
  const selectedSect = $("#section option:selected").val();
  $.post(
    "https://172.19.0.250/listDept",
    { sectionid: selectedSect },
    (data, status) => {
      if (data.length > 0) {
        $("#department").attr("disabled", false);
        $("#department")
          .find("option")
          .remove()
          .end();
        data.forEach(item => {
          $("#department").append(
            $("<option />")
              .val(item.deptUUID)
              .text(item.deptName)
          );
        });
        const selectedDept = $("#department option:selected").val();
        $.post(
          "https://172.19.0.250/listWorkgroup",
          { deptuuid: selectedDept },
          (data, status) => {
            if (data.length > 0) {
              $("#workgroup").attr("disabled", false);
              $("#workgroup")
                .find("option")
                .remove()
                .end();
              data.forEach(item => {
                $("#workgroup").append(
                  $("<option />")
                    .val(item.groupUUID)
                    .text(item.groupName)
                );
              });
            } else {
              $("#workgroup").attr("disabled", true);
              $("#workgroup")
                .find("option")
                .remove()
                .end()
                .append(
                  $("<option />")
                    .val("0")
                    .text("ไม่มีข้อมูล")
                );
            }
          }
        );
      } else {
        $("#department").attr("disabled", true);
        $("#department")
          .find("option")
          .remove()
          .end()
          .append(
            $("<option />")
              .val("0")
              .text("ไม่มีข้อมูล")
          );
      }
    }
  );
});

$(document).on("change", "#department", () => {
  const selectedDept = $("#department option:selected").val();
  $.post(
    "https://172.19.0.250/listWorkgroup",
    { deptuuid: selectedDept },
    (data, status) => {
      $("#workgroup").attr("disabled", false);
      if (data.length > 0) {
        $("#workgroup")
          .find("option")
          .remove()
          .end();
        data.forEach(item => {
          $("#workgroup").append(
            $("<option />")
              .val(item.groupUUID)
              .text(item.groupName)
          );
        });
      } else {
        $("#workgroup").attr("disabled", true);
        $("#workgroup")
          .find("option")
          .remove()
          .end()
          .append(
            $("<option />")
              .val("0")
              .text("ไม่มีข้อมูล")
          );
      }
    }
  );
});

$(document).on("hidden.bs.modal", "#idInsertModal", e => {
  personData = null;
  $("#identityForm")
    .find("input")
    .val("");
  $("#identityForm")
    .find("select")
    .find("option")
    .remove()
    .end();
  $("#identityForm")
    .find("input[type=checkbox]")
    .prop("checked", false);
  $("#identPic").attr("src", "");
});

$(document).on("submit", "#identityForm", e => {
  e.preventDefault();
  personData.section = $("#section option:selected").val();
  personData.department = $("#department option:selected").val();
  personData.workgroup = $("#workgroup option:selected").val();
  personData.employee_type = $("#emptype option:selected").val();
  personData.employee_job = $("#empjob option:selected").val();
  personData.employee_level = $("#emplevel option:selected").val();
  personData.employee_position = $("#emppos option:selected").val();
  personData.employee_mobile = $("#userMobile").val();
  personData.employee_tel = $("#userTel").val();
  const enabled_system = {
    emailSys: $("#emailsys").is(":checked") & 1,
    eleaveSys: $("#leavesys").is(":checked") & 1,
    edocPRSys: $("#eDocPRsys").is(":checked") & 1,
    ekeepSys: $("#eDocKeepsys").is(":checked") & 1,
    ecirSys: $("#eDocCirsys").is(":checked") & 1,
    sarabunSys: $("#esarabunsys").is(":checked") & 1,
    eMeetSys: $("#eMeetsys").is(":checked") & 1,
    vpnSys: $("#vpnsys").is(":checked") & 1,
    carSys: $("#carsys").is(":checked") & 1
  };
  personData.selected_system = enabled_system;
  if (personData != null) {
    $.post(
      "https://172.19.0.250/addEmployee",
      { employeeData: personData },
      (data, status) => {
        $('#idInsertModal').modal('hide')
        userTable.ajax.reload();
      }
    );
  } else {
  }
});
