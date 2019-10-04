let userTable, wSocket;
$(document).ready(() => {
  wSocket = new WebSocket("wss://172.19.0.250:443/?type=web");
  wSocket.onmessage = event => {
    const sexName = { 1: "ชาย", 2: "หญิง" };
    const returnMsg = JSON.parse(event.data);
    const returnData = returnMsg.data;
    switch (returnMsg.action) {
      case "cardData":
        $("#identityID").val(returnData.id);
        $("#thaiName").val(
          returnData.th_prefix +
            " " +
            returnData.th_firstname +
            " " +
            returnData.th_lastname
        );
        $("#engName").val(
          returnData.eng_prefix +
            " " +
            returnData.eng_firstname +
            " " +
            returnData.eng_lastname
        );
        $("#sex").val(sexName[returnData.sex]);
        $("#birthDate").val(returnData.bDate);
        $("#issueDate").val(returnData.issued_date);
        $("#expiredDate").val(returnData.expired_date);
        $("#identPic").attr("src", returnData.picture);
        break;
      case "error":
        if (returnData == "NO_READER") {
          alert("ไม่ได้เสียบเครื่องอ่านหรือยังไม่ได้เสียบการ์ด");
        }
        break;
    }
  };

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
  wSocket.send(JSON.stringify({ action: "retreivedData" }));
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
