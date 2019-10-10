module.exports = (app) => {
  const sessionChecker = require("./CheckSession");

  app.get("/", sessionChecker.checkAuth, (req, res) => {
    res.render(req.page, {
      account_name: `${req.session.firstname}  ${req.session.lastname}`,
      account_position: req.session.OU,
      account_picture: req.session.picture,
      page_name: "แผงควบคุม"
    });
  });
  app.get("/home", sessionChecker.checkAuth, (req, res) => {
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
      page_name: "แผงควบคุม"
    });
  });
  app.get("/sac_reg", sessionChecker.checkAuth, (req, res) => {
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
      page_name: "Service Access Control"
    });
  });
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
