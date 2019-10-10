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
  personData.section = $("#identityForm #section option:selected").val();
  personData.department = $("#identityForm #department option:selected").val();
  personData.workgroup = $("#identityForm #workgroup option:selected").val();
  personData.employee_type = $("#identityForm #emptype option:selected").val();
  personData.employee_job = $("#identityForm #empjob option:selected").val();
  personData.employee_level = $(
    "#identityForm #emplevel option:selected"
  ).val();
  personData.employee_position = $(
    "#identityForm #emppos option:selected"
  ).val();
  personData.employee_mobile = $("#identityForm #userMobile").val();
  personData.employee_tel = $("#identityForm #userTel").val();
  const enabled_system = {
    emailSys: $("#identityForm #emailsys").is(":checked") & 1,
    eleaveSys: $("#identityForm #leavesys").is(":checked") & 1,
    edocPRSys: $("#identityForm #eDocPRsys").is(":checked") & 1,
    ekeepSys: $("#identityForm #eDocKeepsys").is(":checked") & 1,
    ecirSys: $("#identityForm #eDocCirsys").is(":checked") & 1,
    sarabunSys: $("#identityForm #esarabunsys").is(":checked") & 1,
    eMeetSys: $("#identityForm #eMeetsys").is(":checked") & 1,
    vpnSys: $("#identityForm #vpnsys").is(":checked") & 1,
    carSys: $("#identityForm #carsys").is(":checked") & 1
  };
  personData.selected_system = enabled_system;
  if (personData != null) {
    $.post(
      "https://172.19.0.250/addEmployee",
      { employeeData: personData },
      (data, status) => {
        $("#idInsertModal").modal("hide");
        userTable.ajax.reload();
      }
    );
  } else {
  }
});

let selectedUser,
  selectedOption = {};
$("#userTable tbody").on("click", "tr", function() {
  selectedUser = userTable.row(this).data();
  $("#idUpdateModal").modal("show");
});

const listSection = selected_form => {
  return new Promise((resolve, reject) => {
    $.get("https://172.19.0.250/listSection")
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=section]").attr("disabled", false);
          selected_form
            .find("select[name=section]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=section]").append(
              $("<option />")
                .val(item.sectionId)
                .text(item.sectionName)
            );
          });
          if (selectedOption.hasOwnProperty("section")) {
            $(document).off("change", "select[name=section]");
            selected_form
              .find("select[name=section]")
              .val(selectedOption.section)
              .change();
            $(document).on(
              "change",
              "select[name=section]",
              sectionChangeEvent
            );
          }
        } else {
          selected_form.find("select[name=section]").attr("disabled", true);
          selected_form
            .find("select[name=section]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["section"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["section"];
        reject("Cannot get section");
      });
  });
};

const listDepartment = selected_form => {
  return new Promise((resolve, reject) => {
    const selectedSect = selected_form
      .find("select[name=section] option:selected")
      .val();
    $.post("https://172.19.0.250/listDept", { sectionid: selectedSect })
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=department]").attr("disabled", false);
          selected_form
            .find("select[name=department]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=department]").append(
              $("<option />")
                .val(item.deptUUID)
                .text(item.deptName)
            );
          });
          if (selectedOption.hasOwnProperty("department")) {
            $(document).off("change", "select[name=department]");
            selected_form
              .find("select[name=department]")
              .val(selectedOption.department)
              .change();
            $(document).on(
              "change",
              "select[name=department]",
              departmentChangeEvent
            );
          }
        } else {
          selected_form.find("select[name=department]").attr("disabled", true);
          selected_form
            .find("select[name=department]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["department"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["department"];
        reject("Cannot get department");
      });
  });
};

const listWorkgroup = selected_form => {
  return new Promise((resolve, reject) => {
    const selected_dept = selected_form
      .find("select[name=department] option:selected")
      .val();
    $.post("https://172.19.0.250/listWorkgroup", { deptuuid: selected_dept })
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=workgroup]").attr("disabled", false);
          selected_form
            .find("select[name=workgroup]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=workgroup]").append(
              $("<option />")
                .val(item.groupUUID)
                .text(item.groupName)
            );
          });
          if (selectedOption.hasOwnProperty("workgroup")) {
            selected_form
              .find("select[name=workgroup]")
              .val(selectedOption.workgroup)
              .change();
          }
        } else {
          selected_form.find("select[name=workgroup]").attr("disabled", true);
          selected_form
            .find("select[name=workgroup]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["workgroup"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["workgroup"];
        reject("Cannot get workgroup");
      });
  });
};

const listEmployeeType = selected_form => {
  return new Promise((resolve, reject) => {
    $.get("https://172.19.0.250/listEmployeeType")
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=emptype]").attr("disabled", false);
          selected_form
            .find("select[name=emptype]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=emptype]").append(
              $("<option />")
                .val(item.typeId)
                .text(item.typeName)
            );
          });
          if (selectedOption.hasOwnProperty("emptype")) {
            $(document).off("change", "select[name=emptype]");
            selected_form
              .find("select[name=emptype]")
              .val(selectedOption.emptype)
              .change();
            $(document).on(
              "change",
              "select[name=emptype]",
              emptypeChangeEvent
            );
          }
        } else {
          selected_form.find("select[name=emptype]").attr("disabled", true);
          selected_form
            .find("select[name=emptype]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["emptype"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["emptype"];
        reject("Cannot get employee type!");
      });
  });
};

const listEmployeeJob = selected_form => {
  return new Promise((resolve, reject) => {
    const selected_type = selected_form
      .find("select[name=emptype] option:selected")
      .val();
    $.post("https://172.19.0.250/listEmployeeJob", { typeId: selected_type })
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=empjob]").attr("disabled", false);
          selected_form
            .find("select[name=empjob]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=empjob]").append(
              $("<option />")
                .val(item.empTypeLevelId)
                .text(item.empTypeLevelName)
            );
          });
          if (selectedOption.hasOwnProperty("empjob")) {
            selected_form
              .find("select[name=empjob]")
              .val(selectedOption.empjob)
              .change();
          }
        } else {
          selected_form.find("select[name=empjob]").attr("disabled", true);
          selected_form
            .find("select[name=empjob]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["empjob"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["empjob"];
        reject("Cannot get job");
      });
  });
};

const listEmployeeLevel = selected_form => {
  return new Promise((resolve, reject) => {
    const selected_type = selected_form
      .find("select[name=emptype] option:selected")
      .val();
    if (selected_type == "1") {
      $.get("https://172.19.0.250/listEmployeeLevel")
        .done(data => {
          if (data.length > 0) {
            selected_form.find("select[name=emplevel]").attr("disabled", false);
            selected_form
              .find("select[name=emplevel]")
              .find("option")
              .remove()
              .end();
            data.forEach(item => {
              selected_form.find("select[name=emplevel]").append(
                $("<option />")
                  .val(item.levelId)
                  .text(item.levelName)
              );
            });
            if (selectedOption.hasOwnProperty("emplevel")) {
              selected_form
                .find("select[name=emplevel]")
                .val(selectedOption.emplevel)
                .change();
            }
          } else {
            selected_form.find("select[name=emplevel]").attr("disabled", true);
            selected_form
              .find("select[name=emplevel]")
              .find("option")
              .remove()
              .end()
              .append(
                $("<option />")
                  .val("0")
                  .text("ไม่มีข้อมูล")
              );
          }
          delete selectedOption["emplevel"];
          resolve();
        })
        .fail(() => {
          delete selectedOption["emplevel"];
          reject("Cannot get level");
        });
    } else {
      selected_form.find("select[name=emplevel]").attr("disabled", true);
      selected_form
        .find("select[name=emplevel]")
        .find("option")
        .remove()
        .end()
        .append(
          $("<option />")
            .val("0")
            .text("ไม่มีข้อมูล")
        );
      resolve();
    }
  });
};

const listEmployeePosition = selected_form => {
  return new Promise((resolve, reject) => {
    $.get("https://172.19.0.250/listEmployeePosition")
      .done(data => {
        if (data.length > 0) {
          selected_form.find("select[name=emppos]").attr("disabled", false);
          selected_form
            .find("select[name=emppos]")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find("select[name=emppos]").append(
              $("<option />")
                .val(item.PositionId)
                .text(item.PositionName)
            );
          });
          if (selectedOption.hasOwnProperty("emppos")) {
            selected_form
              .find("select[name=emppos]")
              .val(selectedOption.emppos)
              .change();
          }
        } else {
          selected_form.find("select[name=emppos]").attr("disabled", true);
          selected_form
            .find("select[name=emppos]")
            .find("option")
            .remove()
            .end()
            .append(
              $("<option />")
                .val("0")
                .text("ไม่มีข้อมูล")
            );
        }
        delete selectedOption["emppos"];
        resolve();
      })
      .fail(() => {
        delete selectedOption["emppos"];
        reject("cannot get position");
      });
  });
};

const resolveEmployee = selected_form => {
  return new Promise((resolve, reject) => {
    $.post("https://172.19.0.250/resolveEmployee", {
      uuid: selectedUser.id
    })
      .done(data => {
        const personal_data = data.person_data;
        const app_data = data.app;
        selected_form.find("img").each((index, element) => {
          $(element).attr("src", personal_data[$(element).attr("id")]);
        });
        selected_form.find("input").each((index, element) => {
          const input_name = $(element).attr("name");
          let input_type = $(element).attr("type");
          if (!input_type) {
            input_type = "text";
          }
          if (input_type == "text") {
            if (!$(element).is("img")) {
              $(element).val(personal_data[input_name]);
            }
          } else if (input_type == "checkbox") {
            $(element).prop("checked", Boolean(Number(app_data[input_name])));
          }
        });
        selected_form.find("select").each((index, element) => {
          const input_name = $(element).attr("name");
          selectedOption[input_name] = personal_data[input_name];
        });
        resolve();
      })
      .fail(() => {
        console.error("Can't resolve user");
      });
  });
};

const sectionChangeEvent = e => {
  const selected_form = $(e.currentTarget).closest("form");
  listDepartment(selected_form).then(() => {
    return listWorkgroup(selected_form);
  });
};

const departmentChangeEvent = e => {
  if (e.originalEvent) {
    const selected_form = $(e.currentTarget).closest("form");
    listWorkgroup(selected_form).catch(err => {
      console.error(err);
    });
  }
};

const emptypeChangeEvent = e => {
  if (e.originalEvent) {
    const selected_form = $(e.currentTarget).closest("form");
    listEmployeeJob(selected_form).then(() => {
      return listEmployeeLevel(selected_form);
    });
  }
};

const showUpdateModalEvent = e => {
  const selected_form = $(e.currentTarget).find("form");
  resolveEmployee(selected_form)
    .then(() => {
      return listSection(selected_form);
    })
    .then(() => {
      return listDepartment(selected_form);
    })
    .then(() => {
      return listWorkgroup(selected_form);
    })
    .then(() => {
      return listEmployeeType(selected_form);
    })
    .then(() => {
      return listEmployeeJob(selected_form);
    })
    .then(() => {
      return listEmployeeLevel(selected_form);
    })
    .then(() => {
      return listEmployeePosition(selected_form);
    })
    .catch(err => {
      console.error(err);
    });
};

const showInsertModalEvent = e => {
  const selected_form = $(e.currentTarget).find("form");
  listSection(selected_form)
    .then(() => {
      return listDepartment(selected_form);
    })
    .then(() => {
      return listWorkgroup(selected_form);
    })
    .then(() => {
      return listEmployeeType(selected_form);
    })
    .then(() => {
      return listEmployeeJob(selected_form);
    })
    .then(() => {
      return listEmployeeLevel(selected_form);
    })
    .then(() => {
      return listEmployeePosition(selected_form);
    })
    .catch(err => {
      console.error(err);
    });
};

$(document).on("shown.bs.modal", "#idInsertModal", showInsertModalEvent);
$(document).on("click", "#readCard", e => {
  e.preventDefault();
  wSocket.send(JSON.stringify({ Action: "retreivedData" }));
});
$(document).on("change", "select[name=section]", sectionChangeEvent);
$(document).on("change", "select[name=department]", departmentChangeEvent);
$(document).on("change", "select[name=emptype]", emptypeChangeEvent);
$(document).on("shown.bs.modal", "#idUpdateModal", showUpdateModalEvent);
$(document).on("submit", "form[id=identityUpdateForm]", e => {});
