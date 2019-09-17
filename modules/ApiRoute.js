module.exports = (app, operator, checkAPIAuth) => {
  app.post("/apiAuthen", checkAPIAuth, (req, res) => {
    operator.apiLogin(req.body.keyName, req.body.keyPassword, result => {
      if (result != false) {
        req.session.apiAuth = true;
        req.session.apiAuthData = result;
        res.send({
          message: "API login successful!",
          APIloginResult: true
        });
      }
    });
  });
  app.post("/getKeynumber", (req, res) => {
    if (req.session.apiAuth == true) {
      res.send({ keyNumber: req.session.keyNumber });
    } else {
      res.send({ message: "Not allowed any guest!", APIResult: false });
    }
  });
  app.post("/ldapLogin", checkAPIAuth, (req, res) => {
    operator.ldapLogin(req.body.username, req.body.password, result => {
      if (result) {
        res.send({ userData: result, APIResult: true });
      } else {
        res.send({ message: "AD username or password is incorrect!", APIResult: false });
      }
    });
  });
  app.get("/getUserlist", checkAPIAuth, (req, res) => {});
  app.get("/getOUlist", checkAPIAuth, (req, res) => {});
  app.post("/apiSignout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        res.send({ message: err, APIlogoutResult: false });
      } else {
        res.send({ message: "API Disconnected!", APIlogoutResult: true });
      }
    });
  });
};
