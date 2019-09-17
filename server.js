const express = require("express");
const wsServer = require("ws").Server;
const bParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const app = express();
const mustacheExpress = require("mustache-express");
dotenv.config();

//Customer modules
const operator = require("./modules/OpsHub")(process.env);
const auth = require("./modules/Auth")(process.env, operator);

app.use(bParser.json());
app.use(
  bParser.urlencoded({
    extended: true
  })
);

app.engine("html", mustacheExpress());
app.set("view engine", "html");
app.set("views", __dirname + "/web/html/");
app.use(
  session({ resave: true, secret: "moenSoCute2019", saveUninitialized: true })
);

app.use("/greedy", express.static("web/vendor"));
app.use("/josh", express.static("web/js"));
app.use("/cosh", express.static("web/css"));
app.use("/imagine", express.static("web/img"));

/**
 * Description. checkAuth middleware function for check authentication on every request
 * and give correct page route for each request
 * @param {Object} req  Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call back function when authen check passed!
 */
const checkAuth = (req, res, next) => {
  const pageList = {
    "/home_admin": process.env.ADMIN_HOMEPAGE,
    "/_admin": process.env.ADMIN_HOMEPAGE,
    "/sac_reg_admin": process.env.ADMIN_SAC_REG,
    "/manage_api_admin": process.env.ADMIN_API_MANAGE,
    "/_user": "",
    "/home_user": ""
  };
  const tableRequest = [
    "/listOfficer",
    "/apiexists",
    "/listAPIKey",
    "/insertApi"
  ];
  const logoutRequest = ["/signout"];
  const way = req.originalUrl;
  if (req.session.authSuccess == true) {
    if (logoutRequest.includes(way)) {
      next();
    } else {
      if (req.session.isAdmin == true) {
        if (!tableRequest.includes(way)) {
          req.page = pageList[way + "_admin"];
        }
        next();
      } else {
        if (!tableRequest.includes(way)) {
          req.page = pageList[way + "_user"];
        }
        next();
      }
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
};

/**
 * Description. checkAPIAuth middleware function for check authentication on API request
 * @param {Object} req  Express request object
 * @param {Object} res Express response object
 * @param {Function} next Call back function when authen check passed!
 */
const checkAPIAuth = (req, res, next) => {
  const authenRequest = ["/apiAuthen"];
  const requestURL = req.originalUrl;
  const requestMperm = { "/getUserlist": 1, "/getOUlist": 2, "/ldapLogin": 3 };
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
      const permList = req.session.apiAuthData.permList;
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

require("./modules/nonPageRoute")(app, operator, checkAuth);
require("./modules/StandardPageRoute")(app, checkAuth, auth, operator);
require("./modules/ApiRoute")(app, operator, checkAPIAuth);

app.use((req, res, next) => {
  return res.status(404).render("404.html");
});
app.use((req, res, next) => {
  return res.status(500).render("500.html");
});

app.listen(80, () => {
  console.log("Web access on http/80");
});

const wss = new wsServer({ port: 3050 }, () => {
  console.log("Web Socket listen on 3050");
});

wss.on("connection", socket => {
  socket.on("message", message => {
    console.log("received: %s", message);
  });
});
