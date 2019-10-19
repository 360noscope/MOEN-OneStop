module.exports = app => {
  const sessionChecker = require("./CheckSession");
  const operator = require("./OpsHub");

  app.post("/apiAuthen", sessionChecker.checkAPIAuth, (req, res) => {
    let loginResult;
    operator
      .apiLogin(req.body.keyName, req.body.keyPassword)
      .then(authen_result => {
        if (authen_result != false) {
          loginResult = {
            message: "API login successful!",
            APIloginResult: true
          };
        } else {
          loginResult = {
            message: "Wrong username or password",
            APIloginResult: false
          };
        }
        return operator.checkAPIUserRole(authen_result);
      })
      .then(perm_list => {
        if (loginResult.APIloginResult == true) {
          req.session.apiAuth = loginResult;
          req.session.apipermList = perm_list;
        }
        res.send(loginResult);
      })
      .catch(err => {
        res.send({
          message: "API Error!",
          APIloginResult: err
        });
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
    operator
      .ldapLogin(req.body.username, req.body.password)
      .then(ldap_result => {
        if (!ldap_result) {
          res.send({ loginStatus: true, userInfo: ldap_result });
        } else {
          res.send({
            loginStatus: false,
            message: "Wrong username or password"
          });
        }
      })
      .catch(err => {
        res.send({
          message: "API Error!",
          APIloginResult: err
        });
      });
  });
  app.get("/getUserlist", sessionChecker.checkAPIAuth, (req, res) => {
    operator
      .getUserList()
      .then(search_result => {
        res.send(search_result);
      })
      .catch(err => {
        res.send({ api_error: err });
      });
  });
  app.get("/getOUlist", sessionChecker.checkAPIAuth, (req, res) => {
    operator
      .getOUList()
      .then(search_result => {
        res.send(search_result);
      })
      .catch(err => {
        res.send({ api_error: err });
      });
  });
  app.get("/getGroupList", sessionChecker.checkAPIAuth, (req, res) => {
    operator
      .getGroupList()
      .then(search_result => {
        res.send(search_result);
      })
      .catch(err => {
        res.send({ api_error: err });
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
