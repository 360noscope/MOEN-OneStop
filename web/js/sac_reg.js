let userTable,
  wSocket,
  personData,
  newMsgCount = 0;

$(document).ready(() => {
  const wsCheck = () => {
    if (!wSocket || wSocket.readyState === wSocket.CLOSED) startConnection();
  };
  const startConnection = () => {
    wSocket = null;
    wSocket = new WebSocket("wss://172.19.0.250:443/?type=web");
    wSocket.onopen = event => {
      console.log("Web socket connected!");
      wSocket.send(
        JSON.stringify({
          Action: "registerChatClient",
          Data: localStorage.getItem("chatUUID")
        })
      );
    };
    wSocket.onmessage = event => {
      const sexName = { 1: "ชาย", 2: "หญิง" };
      const returnMsg = JSON.parse(event.data);
      const returnData = returnMsg.data;
      personData = returnData;
      switch (returnMsg.action) {
        case "cardData":
          $("#identityForm button[type=submit]").attr("disabled", false);
          $("#identityForm .identityID").val(returnData.Id);
          $("#identityForm .thaiName").val(
            returnData.Th_prefix +
              " " +
              returnData.Th_firstname +
              " " +
              returnData.Th_lastname
          );
          $("#identityForm .engName").val(
            returnData.Eng_prefix +
              " " +
              returnData.Eng_firstname +
              " " +
              returnData.Eng_lastname
          );
          $("#identityForm .sex").val(sexName[returnData.Sex]);
          $("#identityForm .birthDate").val(returnData.BDate);
          $("#identityForm .identPic").attr("src", returnData.Picture);
          break;
        case "chatMsg":
          if ((msg.local = true)) {
            newMsgCount++;
          }
          let chatName = $(
            "<span class='direct-chat-name pull-left'>" + msg.owner + "</span>"
          );
          let chatTime = $(
            "<span class='direct-chat-timestamp pull-right'> " +
              msg.timeStamp +
              "</span>"
          );
          let chatNameNStamp = $("<div class='direct-chat-info clearfix'>");
          chatNameNStamp.append(chatName);
          chatNameNStamp.append(chatTime);

          let chatText = $(
            "<div class='direct-chat-text'>" + msg.text + "</div>"
          );
          let chatMsg;
          if (msg.local) {
            chatMsg = $("<div class='direct-chat-msg right'>");
          } else {
            chatMsg = $("<div class='direct-chat-msg'>");
          }
          chatMsg.append(chatNameNStamp);
          chatMsg.append(chatText);
          $("#chatScreen").append(chatMsg);
          if (newMsgCount > 0) {
            $(".chatNoti").text(newMsgCount);
          }
          break;
        case "error":
          if (returnData == "NO_READER") {
            $("#identityForm button[type=submit]").attr("disabled", true);
            alert("ไม่ได้เสียบเครื่องอ่านหรือยังไม่ได้เสียบการ์ด");
          } else if (returnData == "NO_AGENT") {
            $("#identityForm button[type=submit]").attr("disabled", true);
            alert("ไม่ได้รันตัว AGENT");
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

let selectedUser,
  selectedOption = {};

const listSection = selected_form => {
  return new Promise((resolve, reject) => {
    $.get("https://172.19.0.250/listSection")
      .done(data => {
        if (data.length > 0) {
          selected_form.find(".sectionList").attr("disabled", false);
          selected_form
            .find(".sectionList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".sectionList").append(
              $("<option />")
                .val(item.sectionId)
                .text(item.sectionName)
            );
          });
          if (selectedOption.hasOwnProperty("section")) {
            $(document).off("change", ".sectionList");
            selected_form
              .find(".sectionList")
              .val(selectedOption.section)
              .change();
            $(document).on("change", ".sectionList", sectionChangeEvent);
          }
        } else {
          selected_form.find(".sectionList").attr("disabled", true);
          selected_form
            .find(".sectionList")
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
      .find(".sectionList option:selected")
      .val();
    $.post("https://172.19.0.250/listDept", { sectionid: selectedSect })
      .done(data => {
        if (data.length > 0) {
          selected_form.find(".departmentList").attr("disabled", false);
          selected_form
            .find(".departmentList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".departmentList").append(
              $("<option />")
                .val(item.deptUUID)
                .text(item.deptName)
            );
          });
          if (selectedOption.hasOwnProperty("department")) {
            $(document).off("change", ".departmentList");
            selected_form
              .find(".departmentList")
              .val(selectedOption.department)
              .change();
            $(document).on("change", ".departmentList", departmentChangeEvent);
          }
        } else {
          selected_form.find(".departmentList").attr("disabled", true);
          selected_form
            .find(".departmentList")
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
      .find(".departmentList option:selected")
      .val();
    $.post("https://172.19.0.250/listWorkgroup", { deptuuid: selected_dept })
      .done(data => {
        if (data.length > 0) {
          selected_form.find(".workgroupList").attr("disabled", false);
          selected_form
            .find(".workgroupList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".workgroupList").append(
              $("<option />")
                .val(item.groupUUID)
                .text(item.groupName)
            );
          });
          if (selectedOption.hasOwnProperty("workgroup")) {
            selected_form
              .find(".workgroupList")
              .val(selectedOption.workgroup)
              .change();
          }
        } else {
          selected_form.find(".workgroupList").attr("disabled", true);
          selected_form
            .find(".workgroupList")
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
          selected_form.find(".emptypeList").attr("disabled", false);
          selected_form
            .find(".emptypeList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".emptypeList").append(
              $("<option />")
                .val(item.typeId)
                .text(item.typeName)
            );
          });
          if (selectedOption.hasOwnProperty("emptype")) {
            $(document).off("change", ".emptypeList");
            selected_form
              .find(".emptypeList")
              .val(selectedOption.emptype)
              .change();
            $(document).on("change", ".emptypeList", emptypeChangeEvent);
          }
        } else {
          selected_form.find(".emptypeList").attr("disabled", true);
          selected_form
            .find(".emptypeList")
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
      .find(".emptypeList option:selected")
      .val();
    $.post("https://172.19.0.250/listEmployeeJob", { typeId: selected_type })
      .done(data => {
        if (data.length > 0) {
          selected_form.find(".empjobList").attr("disabled", false);
          selected_form
            .find(".empjobList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".empjobList").append(
              $("<option />")
                .val(item.empTypeLevelId)
                .text(item.empTypeLevelName)
            );
          });
          if (selectedOption.hasOwnProperty("empjob")) {
            selected_form
              .find(".empjobList")
              .val(selectedOption.empjob)
              .change();
          }
        } else {
          selected_form.find(".empjobList").attr("disabled", true);
          selected_form
            .find(".empjobList")
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
      .find(".emptypeList option:selected")
      .val();
    if (selected_type == "1") {
      $.get("https://172.19.0.250/listEmployeeLevel")
        .done(data => {
          if (data.length > 0) {
            selected_form.find(".emplevelList").attr("disabled", false);
            selected_form
              .find(".emplevelList")
              .find("option")
              .remove()
              .end();
            data.forEach(item => {
              selected_form.find(".emplevelList").append(
                $("<option />")
                  .val(item.levelId)
                  .text(item.levelName)
              );
            });
            if (selectedOption.hasOwnProperty("emplevel")) {
              selected_form
                .find(".emplevelList")
                .val(selectedOption.emplevel)
                .change();
            }
          } else {
            selected_form.find(".emplevelList").attr("disabled", true);
            selected_form
              .find(".emplevelList")
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
      selected_form.find(".emplevelList").attr("disabled", true);
      selected_form
        .find(".emplevelList")
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
          selected_form.find(".empposList").attr("disabled", false);
          selected_form
            .find(".empposList")
            .find("option")
            .remove()
            .end();
          data.forEach(item => {
            selected_form.find(".empposList").append(
              $("<option />")
                .val(item.PositionId)
                .text(item.PositionName)
            );
          });
          if (selectedOption.hasOwnProperty("emppos")) {
            selected_form
              .find(".empposList")
              .val(selectedOption.emppos)
              .change();
          }
        } else {
          selected_form.find(".empposList").attr("disabled", true);
          selected_form
            .find(".empposList")
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
        const exceptClass = [
          "form-control",
          "custom-control-input",
          "mr-3",
          "custom-select"
        ];
        selected_form.find(".identPic").attr("src", personal_data["photo"]);
        selected_form.find("input").each((index, element) => {
          let elementInputClass = $(element)
            .attr("class")
            .split(" ");
          elementInputClass = elementInputClass.filter(el => {
            return !exceptClass.includes(el);
          });
          const selectedClass = "." + elementInputClass.join();
          if ($(element).prop("type") == "text") {
            selected_form
              .find(selectedClass)
              .val(personal_data[elementInputClass.join()]);
          } else {
            selected_form
              .find(selectedClass)
              .prop(
                "checked",
                Boolean(app_data[elementInputClass.join().replace("List", "")])
              );
          }
        });
        selectedOption = data.office;
        resolve();
      })
      .fail(() => {
        reject("Can't resolve user");
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

const insertFormSubmit = e => {
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
      "https://172.19.0.250/insertEmployee",
      { employeeData: personData },
      (data, status) => {
        $("#idInsertModal").modal("hide");
        userTable.ajax.reload();
      }
    );
  } else {
    alert("กรุณาใส่ข้อมูลเจ้าหน้าที่");
  }
};

const updateChatscreen = msg => {
  $.post("https://172.19.0.250/translateName", { uuid: msg.owner }).done(
    data_response => {
      let chatName = $(
        "<span class='direct-chat-name pull-left'>" + data_response + "</span>"
      );
      let chatTime = $(
        "<span class='direct-chat-timestamp pull-right'> " +
          msg.timeStamp +
          "</span>"
      );
      let chatNameNStamp = $("<div class='direct-chat-info clearfix'>");
      chatNameNStamp.append(chatName);
      chatNameNStamp.append(chatTime);

      let chatText = $("<div class='direct-chat-text'>" + msg.text + "</div>");
      let chatMsg;
      if (msg.local) {
        chatMsg = $("<div class='direct-chat-msg right'>");
      } else {
        chatMsg = $("<div class='direct-chat-msg'>");
      }
      chatMsg.append(chatNameNStamp);
      chatMsg.append(chatText);
      $("#chatScreen").append(chatMsg);
    }
  );
};

$(document).on("shown.bs.modal", "#idInsertModal", showInsertModalEvent);
$(document).on("click", ".readCard", e => {
  e.preventDefault();
  wSocket.send(JSON.stringify({ Action: "retreivedData" }));
});
$(document).on("change", ".sectionList", sectionChangeEvent);
$(document).on("change", ".departmentList", departmentChangeEvent);
$(document).on("change", ".emptypeList", emptypeChangeEvent);
$(document).on("shown.bs.modal", "#idUpdateModal", showUpdateModalEvent);
$(document).on("click", "#selectOfficer", function() {
  selectedUser = userTable.row($(this).parents("tr")).data();
  $("#idUpdateModal").modal("show");
});
$(document).on("submit", "#identityForm", insertFormSubmit);
$(document).on("submit", "form[id=identityUpdateForm]", e => {});
$(document).on("click", "#modalChatShow", e => {
  const clickedElement = e.currentTarget;
  const user_chat_name = $(clickedElement).data("userchat");
  $("#chatModal .modal-title").text(user_chat_name);
  $("#chatModal").modal("show");
});
$(document).on("shown.bs.dropdown", "#chatDropDown", e => {
  let chatMsgList = $("#chatMsgList");
  $(".chatNoti").text("");
  newMsgCount = 0;
  chatMsgList.empty();
  $.get("https://172.19.0.250/listUserContacts").done(contact_list => {
    contact_list.forEach(contact => {
      const contactName = contact.th_firstname + " " + contact.th_lastname;
      let chatMsgInnerBody = $("<div class='media-body'>");
      chatMsgInnerBody.append(
        $(
          "<h3 class='dropdown-item-title'>  " +
            contactName +
            "<span class='float-right text-sm text-danger'></span></h3>"
        )
      );
      chatMsgInnerBody.append(
        $("<p class='text-sm'>Call me whenever you can...</p>")
      );
      chatMsgInnerBody.append(
        $(
          " <p class='text-sm text-muted'>" +
            "<i class='far fa-clock mr-1'></i> 4 Hours Ago</p>"
        )
      );

      let chatMsgInner = $("<div class='media'>");
      chatMsgInner.append(
        $(
          "<img src=" +
            contact.photoRaw +
            " alt='contacts' class='img-size-50 mr-3 img-circle' />"
        )
      );
      chatMsgInner.append(chatMsgInnerBody);

      let chatMsgBlock = $("<a class='dropdown-item chatContacts' href='#' >");
      chatMsgBlock.data("uuid", contact.AD_UUID);
      chatMsgBlock.append(chatMsgInner);
      chatMsgList.append(chatMsgBlock);
    });

    chatMsgList.append(
      $(
        "<div class='dropdown-divider'></div><a href='#' class='dropdown-item dropdown-footer'>อ่านข้อความทั้งหมด</a>"
      )
    );
  });

  let chatMsgDevide = $("<div class='dropdown-divider'>");
});

$(document).on("click", ".chatContacts", e => {
  $("#chatModal .modal-title").text(
    "กล่อง chat " +
      $(e.currentTarget)
        .find(".dropdown-item-title")
        .text()
  );
  $("#chatModal").data("uuid", $(e.currentTarget).data("uuid"));
  $("#chatModal").modal("show");
});
$(document).on("shown.bs.modal", "#chatModal", e => {
  const selectedUUID = $(e.currentTarget).data("uuid");
  $.post("https://172.19.0.250/retreiveChatMsg", {
    owner: localStorage.getItem("chatUUID"),
    destination: selectedUUID
  }).done(msgBlock => {
    msgBlock.forEach(msg => {
      updateChatscreen(msg);
    });
  });
});
$(document).on("hide.bs.modal", "#chatModal", e => {
  $("#chatScreen").empty();
});
$(document).on("submit", "#chatForm", e => {
  e.preventDefault();
  const destinationUUID = $(e.currentTarget)
    .parents()
    .find("#chatModal")
    .data("uuid");
  const msg = {
    owner: localStorage.getItem("chatUUID"),
    text: $(".chatText").val(),
    local: true,
    timeStamp: moment().format("D-M-YYYY, h:mm:ss a"),
    destClient: destinationUUID
  };
  updateChatscreen(msg);
  $.post("https://172.19.0.250/updateChatMsg", {
    uuid: localStorage.getItem("chatUUID"),
    msgBlock: msg
  }).done(response => {
    console.log(response);
  });
  wSocket.send(
    JSON.stringify({
      Action: "sendChat",
      Data: {
        owner: localStorage.getItem("chatUUID"),
        msg: $(".chatText").val(),
        destClient: destinationUUID
      }
    })
  );
});
