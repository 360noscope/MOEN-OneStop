/**@module nonPageRoute*/
module.exports = (app, operator, checkAuth) => {
  app.post("/auth", (req, res) => {
    const loginInfo = req.body;
    operator.webLogin(loginInfo.authUsername, loginInfo.authPassword, result => {
      if (result.authSuccess == true) {
        req.session.isAdmin = result.isAdmin;
        req.session.UUID = result.UUID;
        req.session.firstname = result.firstname;
        req.session.lastname = result.lastname;
        req.session.OU = result.OU;
      }
      req.session.authSuccess = result.authSuccess;
      res.send(
        JSON.stringify({
          authSuccess: result.authSuccess
        })
      );
    });
  });
  app.get("/listOfficer", checkAuth, (req, res) => {
    operator.listOfficer(qResult => {
      res.send(qResult);
    });
  });
  app.post("/listAPIKey", checkAuth, (req, res) => {
    operator.listAPIKey(req.session.UUID, result => {
      res.send(result);
    });
  });
  app.post("/apiexists", checkAuth, (req, res) => {
    operator.isAPIExists(req.body.keyName, result => {
      res.send(result);
    });
  });
  app.post("/insertApi", (req, res) => {
    operator.insertAPI(
      req.body.keyName,
      req.body.keyPassword,
      req.session.UUID,
      result => {
        res.send(result);
      }
    );
  });
  app.get("/signout", checkAuth, (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      }
      res.render(process.env.LOGIN_PAGE);
    });
  });
};
