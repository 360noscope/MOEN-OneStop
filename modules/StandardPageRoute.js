module.exports = app => {
  const sessionChecker = require("./CheckSession");

  const renderedMenu = req => {
    const userObject = req.session.userObject;
    let menu;
    const adminMenu = {
      account_name: `${userObject.firstname}  ${userObject.lastname}`,
      account_position: userObject.OU,
      account_picture: userObject.picture,
      menu: [{ liClass: "header", liText: "จัดการข้อมูล" }],
      menu1: [
        {
          liClass: "active",
          aLink: "/home",
          liIcon: "fas fa-tachometer-alt",
          liText: "แผงควบคุม"
        },
        {
          aLink: "/sac_reg",
          liIcon: "fas fa-user-lock",
          liText: "Service Access Control"
        },
        {
          aLink: "/home",
          liIcon: "far fa-life-ring",
          liText: "ระบบแจ้งซ่อม"
        }
      ],
      menu2: [{ liClass: "header", liText: "จัดการ API" }],
      menu3: [
        {
          aLink: "/home",
          liIcon: "fas fa-key",
          liText: "จัดการ API Access Key"
        }
      ],
      page_name: "แผงควบคุม"
    };
    const userMenu = {
      account_name: `${userObject.firstname}  ${userObject.lastname}`,
      account_position: userObject.OU,
      account_picture: userObject.picture,
      menu: [{ liClass: "header", liText: "จัดการข้อมูล" }],
      menu1: [
        {
          liClass: "active",
          aLink: "/home",
          liIcon: "fas fa-tachometer-alt",
          liText: "แผงควบคุม"
        },
        {
          aLink: "/sac_reg",
          liIcon: "fas fa-user-lock",
          liText: "Service Access Control"
        },
        {
          aLink: "/home",
          liIcon: "far fa-life-ring",
          liText: "ระบบแจ้งซ่อม"
        }
      ],
      menu2: [{ liClass: "header", liText: "จัดการ API" }],
      menu3: [
        {
          aLink: "/home",
          liIcon: "fas fa-key",
          liText: "จัดการ API Access Key"
        }
      ],
      page_name: "แผงควบคุม"
    };
    if (req.page == "admin") {
      menu = adminMenu;
    } else {
      menu = userMenu;
    }
    return menu;
  };

  const homeRender = (req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
    const finalMenu = renderedMenu(req);
    res.render("home.html", finalMenu);
  };
  const sacRender = (req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
    const userObject = req.session.userObject;
    let renderData;
    if (req.page == "admin") {
      renderData = {
        account_name: `${userObject.firstname}  ${userObject.lastname}`,
        account_position: userObject.OU,
        account_picture: userObject.picture,
        menu: [{ liClass: "header", liText: "จัดการข้อมูล" }],
        menu1: [
          {
            aLink: "/home",
            liIcon: "fas fa-tachometer-alt",
            liText: "แผงควบคุม"
          },
          {
            liClass: "active",
            aLink: "/sac_reg",
            liIcon: "fas fa-user-lock",
            liText: "Service Access Control"
          },
          {
            aLink: "/home",
            liIcon: "far fa-life-ring",
            liText: "ระบบแจ้งซ่อม"
          }
        ],
        menu2: [{ liClass: "header", liText: "จัดการ API" }],
        menu3: [
          {
            aLink: "/home",
            liIcon: "fas fa-key",
            liText: "จัดการ API Access Key"
          }
        ],
        page_name: "แผงควบคุม"
      };
    }
    res.render("sac.html", renderData);
  };
  app.get("/", sessionChecker.checkAuth, homeRender);
  app.get("/home", sessionChecker.checkAuth, homeRender);
  app.get("/sac_reg", sessionChecker.checkAuth, sacRender);
  app.get("/manage_api", sessionChecker.checkAuth, (req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
    const userObject = req.session.userObject;
    res.render(req.page, {
      account_name: `${userObject.firstname}  ${userObject.lastname}`,
      account_position: userObject.OU,
      account_picture: userObject.picture,
      page_name: "API Key Manage"
    });
  });
};
