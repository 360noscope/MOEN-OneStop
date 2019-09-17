/**
 Description. web page route nothing special
 * @param {Object} app  Express server itself
 * @param {Function} checkAuth function for check authentication status!
 */
module.exports = (app, checkAuth) => {
  app.get("/", checkAuth, (req, res) => {
    res.render(req.page, {
      account_name: `${req.session.firstname}  ${req.session.lastname}`,
      account_position: req.session.OU,
      page_name: "แผงควบคุม"
    });
  });
  app.get("/home", checkAuth, (req, res) => {
    res.render(req.page, {
      account_name: `${req.session.firstname}  ${req.session.lastname}`,
      account_position: req.session.OU,
      page_name: "แผงควบคุม"
    });
  });
  app.get("/sac_reg", checkAuth, (req, res) => {
    res.render(req.page, {
      account_name: `${req.session.firstname}  ${req.session.lastname}`,
      account_position: req.session.OU,
      page_name: "Service Access Control"
    });
  });
  app.get("/manage_api", checkAuth, (req, res) => {
    res.render(req.page, {
      account_name: `${req.session.firstname}  ${req.session.lastname}`,
      account_position: req.session.OU,
      page_name: "API Key Manage"
    });
  });
};
