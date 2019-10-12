module.exports = app => {
  const sessionChecker = require("./CheckSession");
  const operator = require("./OpsHub");

  app.post("/apiAuthen", sessionChecker.checkAPIAuth, (req, res) => {
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
  app.post("/ldapLogin", sessionChecker.checkAPIAuth, (req, res) => {
    operator.ldapLogin(req.body.username, req.body.password, result => {
      if (result) {
        res.send({ userData: result, APIResult: true });
      } else {
        res.send({
          message: "AD username or password is incorrect!",
          APIResult: false
        });
      }
    });
  });
  app.get("/getUserlist", sessionChecker.checkAPIAuth, (req, res) => {
    operator
      .listUser()
      .then(search_result => {
        res.send(search_result);
      })
      .catch(err => {
        res.send({ api_error: err });
      });
  });
  app.get("/getOUlist", sessionChecker.checkAPIAuth, (req, res) => {
    operator
      .listOU()
      .then(search_result => {
        res.send(search_result);
      })
      .catch(err => {
        res.send({ api_error: err });
      });
  });
  app.get("/getGroupList", sessionChecker.checkAPIAuth, (req, res) => {
    operator.listGroup(result => {
      if (result != false) {
        res.send({ userData: result, APIResult: true });
      } else {
        res.send({ message: "Not found any record", APIResult: false });
      }
    });
  });
  app.get("/searchUser", sessionChecker.checkAPIAuth, (req, res) => {
    const paramList = req.body;
    let conditions = {};
    if (paramList.hasOwnProperty("ou")) {
      conditions["ou"] = paramList.ou;
    }
    if (paramList.hasOwnProperty("group")) {
      conditions["group"] = paramList.group;
    }
    if (paramList.hasOwnProperty("name")) {
      conditions["name"] = paramList.name;
    }
    operator.searchUser(conditions, result => {
      if (result != false) {
        res.send({ userData: result, APIResult: true });
      } else {
        res.send({ message: "Not found any record", APIResult: false });
      }
    });
  });
  app.post("/addUser", sessionChecker.checkAPIAuth, (req, res) => {
    const newUser = {
      firstname: req.body.adFirstname,
      lastname: req.body.adLastname,
      workgroup: req.body.adWorkgroup,
      password: req.body.adPassword
    };
    operator.addUser(newUser, result => {
      if (result != false) {
        res.send({ message: "Done insert new user!", APIResult: true });
      } else {
        res.send({ message: "Insert new user not success", APIResult: false });
      }
    });
  });
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
