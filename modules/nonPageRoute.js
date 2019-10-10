/**@module nonPageRoute*/
module.exports = (app, operator, checkAuth) => {
  const redis = require("redis");
  const redisClient = redis.createClient(6379);
  const Promise = require("promise");

  const checkCache = key => {
    return new Promise((resolve, reject) => {
      redisClient.get(key, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };
  const updateCache = (key, data) => {
    return new Promise((resolve, reject) => {
      redisClient.setex(key, 3600, data);
      resolve();
    });
  };
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

  const handleNonPageRequest = (req, res) => {
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
    checkCache(redisKey)
      .then(data => {
        if (data) {
          res.send(JSON.parse(data));
        } else {
          if (checkMethodArgs(keyList[req_url]["fetchMethod"]).length == 0) {
            keyList[req_url]["fetchMethod"]().then(search_result => {
              updateCache(redisKey, JSON.stringify(search_result));
              res.send(search_result);
            });
          } else {
            const reqParam = req.body;
            keyList[req_url]["fetchMethod"](reqParam).then(search_result => {
              updateCache(redisKey, JSON.stringify(search_result));
              res.send(search_result);
            });
          }
        }
      })
      .catch(err => {
        console.error("[System] " + err);
      });
  };

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
        res.send({
          authSuccess: result.authSuccess,
          user: loginInfo.authUsername
        });
      }
    );
  });
  app.get("/listOfficer", checkAuth, handleNonPageRequest);
  app.get("/listSection", checkAuth, handleNonPageRequest);
  app.post("/listDept", checkAuth, handleNonPageRequest);
  app.post("/listWorkgroup", checkAuth, handleNonPageRequest);
  app.get("/listEmployeeType", checkAuth, handleNonPageRequest);
  app.post("/listEmployeeJob", checkAuth, handleNonPageRequest);
  
  app.get("/listEmployeeLevel", (req, res) => {
    operator.listEmployeeLevel(lResult => {
      res.send(lResult);
    });
  });
  app.get("/listEmployeePosition", (req, res) => {
    operator.listEmployeePosition(epResult => {
      res.send(epResult);
    });
  });
  app.post("/addEmployee", (req, res) => {
    operator.insertEmployee(req.body.employeeData, aResult => {
      res.send(aResult);
    });
  });
  app.post("/resolveEmployee", (req, res) => {
    operator.resolveOfficer(req.body.uuid, resolve_result => {
      res.send(resolve_result);
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
