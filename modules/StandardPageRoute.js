module.exports = app => {
  const sessionChecker = require("./CheckSession");

  const menuRenderer = (req, res) => {
    const userObject = req.session.userObject;
    const pageRoute = req.originalUrl;
    const renderList = {
      "/home": {
        partRendered: {
          admin: {
            account_name: `${userObject.firstname}  ${userObject.lastname}`,
            account_position: userObject.OU,
            account_picture: userObject.picture,
            menu: [{ liClass: "nav-header", liText: "จัดการข้อมูล" }],
            menu1: [
              {
                liClass: "nav-item",
                aLink: "/home",
                aClass: "nav-link active",
                liIcon: "fas fa-tachometer-alt",
                liText: "แผงควบคุม"
              },
              {
                liClass: "nav-item",
                aLink: "/sac_reg",
                aClass: "nav-link",
                liIcon: "fas fa-user-lock",
                liText: "Service Access Control"
              },
              {
                liClass: "nav-item",
                aLink: "/home",
                aClass: "nav-link",
                liIcon: "far fa-life-ring",
                liText: "ระบบแจ้งซ่อม"
              }
            ],
            menu2: [{ liClass: "nav-header", liText: "จัดการ API" }],
            menu3: [
              {
                liClass: "nav-item",
                aClass: "nav-link",
                aLink: "/home",
                liIcon: "fas fa-key",
                liText: "จัดการ API Access Key"
              }
            ],
            page_name: "แผงควบคุม"
          },
          user: {
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
          }
        },
        page: "home.html"
      },
      "/sac_reg": {
        partRendered: {
          admin: {
            account_name: `${userObject.firstname}  ${userObject.lastname}`,
            account_position: userObject.OU,
            account_picture: userObject.picture,
            menu: [{ liClass: "nav-header", liText: "จัดการข้อมูล" }],
            menu1: [
              {
                liClass: "nav-item",
                aLink: "/home",
                aClass: "nav-link ",
                liIcon: "fas fa-tachometer-alt",
                liText: "แผงควบคุม"
              },
              {
                liClass: "nav-item",
                aLink: "/sac_reg",
                aClass: "nav-link active",
                liIcon: "fas fa-user-lock",
                liText: "Service Access Control"
              },
              {
                liClass: "nav-item",
                aLink: "/home",
                aClass: "nav-link",
                liIcon: "far fa-life-ring",
                liText: "ระบบแจ้งซ่อม"
              }
            ],
            menu2: [{ liClass: "nav-header", liText: "จัดการ API" }],
            menu3: [
              {
                liClass: "nav-item",
                aClass: "nav-link",
                aLink: "/home",
                liIcon: "fas fa-key",
                liText: "จัดการ API Access Key"
              }
            ],
            page_name: "Service Access Control"
          }
        },
        page: "sac.html"
      }
    };
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
    const selectedRender = renderList[pageRoute];
    res.render(
      selectedRender["page"],
      selectedRender["partRendered"][req.page]
    );
  };

  app.get("/", sessionChecker.checkAuth, menuRenderer);
  app.get("/home", sessionChecker.checkAuth, menuRenderer);
  app.get("/sac_reg", sessionChecker.checkAuth, menuRenderer);
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
