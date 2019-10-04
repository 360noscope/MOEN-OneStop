/**@module nonPageRoute*/
module.exports = (app, operator, checkAuth) => {
  app.post("/auth", (req, res) => {
    const loginInfo = req.body;
    operator.webLogin(
      loginInfo.authUsername,
      loginInfo.authPassword,
      result => {
        if (result.authSuccess == true) {
          req.session.isAdmin = result.isAdmin;
          req.session.UUID = result.UUID;
          req.session.firstname = result.firstname;
          req.session.lastname = result.lastname;
          req.session.OU = result.OU;
          req.session.picture = result.picture;
        }
        req.session.authSuccess = result.authSuccess;
        res.send(
          JSON.stringify({
            authSuccess: result.authSuccess,
            user: loginInfo.authUsername
          })
        );
      }
    );
  });
  app.get("/listOfficer", checkAuth, (req, res) => {
    operator.listOfficer(qResult => {
      res.send(qResult);
    });
  });
  app.get("/listSection", checkAuth, (req, res) => {
    operator.listSection(sResult => {
      res.send(sResult);
    });
  });
  app.post("/listDept", (req, res) => {
    operator.listDept(req.body.sectionid, dResult => {
      res.send(dResult);
    });
  });
  app.post("/listWorkgroup", (req, res) => {
    operator.listWorkgroup(req.body.deptuuid, wResult => {
      res.send(wResult);
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
