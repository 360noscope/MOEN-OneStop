let userTable, wSocket;
$(document).ready(() => {
  wSocket = new WebSocket("wss://172.19.0.250:443/?type=web");
  wSocket.onmessage = event => {
    const returnMsg = JSON.parse(event.data);
    switch (returnMsg.action) {
      case "cardData":
        const cardData = returnMsg.data;
        $("#identityID").val(cardData.id);
        $("#thaiName").val(
          cardData.th_prefix +
            " " +
            cardData.th_firstname +
            " " +
            cardData.th_lastname
        );
        $("#engName").val(
          cardData.eng_prefix +
            " " +
            cardData.eng_firstname +
            " " +
            cardData.eng_lastname
        );
        $("#sex").val(cardData.sex);
        $("#birthDate").val(cardData.bDate);
        $("#issueDate").val(cardData.issued_date);
        $("#expiredDate").val(cardData.expired_date);
        $("#identPic").attr("src", cardData.picture);
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
