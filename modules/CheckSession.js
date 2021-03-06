const checkAuth = (req, res, next) => {
  const tableRequest = [
    "/listOfficer",
    "/apiexists",
    "/listAPIKey",
    "/insertApi"
  ];
  const logoutRequest = ["/signout"];
  const way = req.originalUrl;
  if (req.session.userObject) {
    const userObject = req.session.userObject;
    if (logoutRequest.includes(way)) {
      next();
    } else {
      if (userObject.isAdmin == true) {
        if (!tableRequest.includes(way)) {
          req.page = "admin";
        }
        next();
      } else {
        if (!tableRequest.includes(way)) {
          req.page = "user";
        }
        next();
      }
    }
  } else {
    res.render("signin.html");
  }
};

const checkAPIAuth = (req, res, next) => {
  const authenRequest = ["/apiAuthen"];
  const requestURL = req.originalUrl;
  const requestMperm = {
    "/getUserlist": 1,
    "/getOUlist": 2,
    "/ldapLogin": 3,
    "/addUser": 4,
    "/getGroupList": 5,
    "/searchUser": 6
  };
  if (authenRequest.includes(requestURL)) {
    if (!req.session.apiAuth) {
      next();
    } else {
      res.send({
        message: "This session already authenticate!",
        APIloginResult: true
      });
    }
  } else {
    if (req.session.apiAuth) {
      const permList = req.session.apipermList;
      if (permList.includes(requestMperm[requestURL])) {
        next();
      } else {
        res.send({
          message: "This API key not allowed to use selected request",
          APIResult: false
        });
      }
    } else {
      res.send({ message: "Not allowed any guest!", APIResult: false });
    }
  }
};

module.exports = {
  checkAuth: checkAuth,
  checkAPIAuth: checkAPIAuth
};
