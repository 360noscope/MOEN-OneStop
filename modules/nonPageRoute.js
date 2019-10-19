/**@module nonPageRoute*/
module.exports = app => {
  const Promise = require("promise");
  const sessionChecker = require("./CheckSession");
  const Cacher = require("./Cacher");
  const operator = require("./OpsHub");

  const checkMethodArgs = func => {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    let result = fnStr
      .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
      .match(ARGUMENT_NAMES);
    if (result === null) result = [];
    return result;
  };
  const handleFormRequest = (req, res) => {
    const keyList = {
      "/listOfficer": {
        redisKey: "datatables:userlist",
        fetchMethod: operator.listOfficer
      },
      "/listSection": {
        redisKey: "droplist:section",
        fetchMethod: operator.listSection
      },
      "/listDept": {
        redisKey: "droplist:department:sectionid:",
        fetchMethod: operator.listDept,
        selective: "sectionid"
      },
      "/listWorkgroup": {
        redisKey: "droplist:workgroup:deptuuid:",
        fetchMethod: operator.listWorkgroup,
        selective: "deptuuid"
      },
      "/listEmployeeType": {
        redisKey: "droplist:employeeType",
        fetchMethod: operator.listEmployeeType
      },
      "/listEmployeeJob": {
        redisKey: "droplist:employeejob:typeId:",
        fetchMethod: operator.listEmployeeJob,
        selective: "typeId"
      },
      "/listEmployeeLevel": {
        redisKey: "droplist:employeelevel",
        fetchMethod: operator.listEmployeeLevel
      },
      "/listEmployeePosition": {
        redisKey: "droplist:listemployeeposition",
        fetchMethod: operator.listEmployeePosition
      },
      "/resolveEmployee": {
        redisKey: "form:uuid:",
        fetchMethod: operator.resolveOfficer,
        selective: "uuid"
      }
    };
    let req_url = req.originalUrl;
    if (req_url.includes("?")) {
      req_url = req_url.split("?", 1).pop();
    }
    let redisKey = keyList[req_url]["redisKey"];
    if (keyList[req_url].hasOwnProperty("selective")) {
      const testReq = req.body;
      redisKey = redisKey + testReq[keyList[req_url]["selective"]];
    }
    Cacher.cacheRetreive(redisKey)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          if (checkMethodArgs(keyList[req_url]["fetchMethod"]).length == 0) {
            keyList[req_url]["fetchMethod"]().then(search_result => {
              Cacher.cacheUpdate(redisKey, search_result);
              res.send(search_result);
            });
          } else {
            const reqParam = req.body;
            keyList[req_url]["fetchMethod"](reqParam).then(search_result => {
              Cacher.cacheUpdate(redisKey, search_result);
              res.send(search_result);
            });
          }
        }
      })
      .catch(err => {
        console.error("[System] " + err);
      });
  };
  const handleAuthenRequest = (req, res) => {
    operator
      .webLogin(req.body.authUsername, req.body.authPassword)
      .then(user => {
        const userObject = {
          isAdmin: user.isAdmin,
          UUID: user.UUID,
          firstname: user.firstname,
          lastname: user.lastname,
          OU: user.OU,
          picture: user.picture
        };
        req.session.userObject = userObject;
        res.send({
          loginStatus: true,
          uuid: user.UUID
        });
      })
      .catch(err => {
        console.error("[System] " + err);
        res.send({ loginStatus: false });
      });
  };


  app.post("/auth", handleAuthenRequest);
  app.get("/signout", sessionChecker.checkAuth, (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      }
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      });
      res.render(process.env.LOGIN_PAGE);
    });
  });
  app.get("/listOfficer", sessionChecker.checkAuth, handleFormRequest);
  app.get("/listSection", sessionChecker.checkAuth, handleFormRequest);
  app.post("/listDept", sessionChecker.checkAuth, handleFormRequest);
  app.post("/listWorkgroup", sessionChecker.checkAuth, handleFormRequest);
  app.get("/listEmployeeType", sessionChecker.checkAuth, handleFormRequest);
  app.post("/listEmployeeJob", sessionChecker.checkAuth, handleFormRequest);
  app.get("/listEmployeeLevel", sessionChecker.checkAuth, handleFormRequest);
  app.get("/listEmployeePosition", sessionChecker.checkAuth, handleFormRequest);
  app.post("/insertEmployee", sessionChecker.checkAuth, (req, res) => {
    operator
      .insertEmployee(req.body.employeeData)
      .then(() => {
        res.send({ actionResult: true });
      })
      .catch(err => {
        res.send({ actionResult: false, error: err });
      });
  });
  app.post("/resolveEmployee", sessionChecker.checkAuth, handleFormRequest);
  app.get("/listUserContacts", sessionChecker.checkAuth, (req, res) => {
    const userSession = req.session.userObject;
    operator.listUserContacts(userSession.UUID).then(search_result => {
      res.send(search_result);
    });
  });
  app.get("/retreiveChatMsg", sessionChecker.checkAuth, acquiredChatMsg);
  app.post("/updateChatMsg", sessionChecker.checkAuth, updateChatMsg);
  app.post("/listAPIKey", sessionChecker.checkAuth, (req, res) => {
    operator.listAPIKey(req.session.UUID, result => {
      res.send(result);
    });
  });
  app.post("/apiexists", sessionChecker.checkAuth, (req, res) => {
    operator.isAPIExists(req.body.keyName, result => {
      res.send(result);
    });
  });
  app.post("/insertApi", sessionChecker.checkAuth, (req, res) => {
    operator.insertAPI(
      req.body.keyName,
      req.body.keyPassword,
      req.session.UUID,
      result => {
        res.send(result);
      }
    );
  });
};
