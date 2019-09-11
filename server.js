const express = require("express");
const wsServer = require("ws").Server;
const bParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const app = express();
const mustacheExpress = require("mustache-express");
//custom module
dotenv.config();
const auth = require("./modules/Auth")(process.env);
const db = require("./modules/Database")(process.env);

app.use(bParser.json()); // to support JSON-encoded bodies
app.use(
  bParser.urlencoded({
    // to support URL-encoded bodies
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

//start - website route section
app.get("/", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      res.render(process.env.ADMIN_HOMEPAGE, {
        account_name: `${req.session.firstname}  ${req.session.lastname}`,
        account_position: req.session.OU,
        page_name: "แผงควบคุม"
      });
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.post("/auth", (req, res) => {
  const loginInfo = req.body;
  auth.login(loginInfo.authUsername, loginInfo.authPassword, result => {
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
app.get("/home", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      res.render(process.env.ADMIN_HOMEPAGE, {
        account_name: `${req.session.firstname}  ${req.session.lastname}`,
        account_position: req.session.OU,
        page_name: "แผงควบคุม"
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.get("/sac_reg", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      res.render(process.env.ADMIN_SAC_REG, {
        account_name: `${req.session.firstname}  ${req.session.lastname}`,
        account_position: req.session.OU,
        page_name: "Service Access Control"
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.get("/listOfficer", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      db.listOfficer(qResult => {
        res.send(qResult);
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.get("/signout", (req, res) => {
  if (req.session.authSuccess == true) {
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      }
    });
  }
  res.render(process.env.LOGIN_PAGE);
});
//end - website route section
//start - API route section

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
