const express = require("express");
const wsServer = require("ws").Server;
const bParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const app = express();
const mustacheExpress = require("mustache-express");
//custom module
dotenv.config();

const db = require("./modules/Database")(process.env);
const auth = require("./modules/Auth")(process.env, db);

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
app.get("/manage_api", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      res.render(process.env.ADMIN_API_MANAGE, {
        account_name: `${req.session.firstname}  ${req.session.lastname}`,
        account_position: req.session.OU,
        page_name: "API Key Manage"
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.post("/listAPIKey", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      db.listAPIKey(req.session.UUID, result => {
        res.send(result);
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.post("/apiexists", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      db.isAPIExists(req.body.keyName, result => {
        res.send(result);
      });
    } else {
    }
  } else {
    res.render(process.env.LOGIN_PAGE);
  }
});
app.post("/insertApi", (req, res) => {
  if (req.session.authSuccess == true) {
    if (req.session.isAdmin == true) {
      db.insertAPI(
        req.body.keyName,
        req.body.keyPassword,
        req.session.UUID,
        result => {
          res.send(result);
        }
      );
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
app.use((req, res, next) => {
  return res.status(404).render("404.html");
});
app.use((req, res, next) => {
  return res.status(500).render("500.html");
});
//end - website route section

//start - API route section
//start API authentication part
const jwt = require("jsonwebtoken");
const passport = require("passport");
const ExtractJwt = require("passport-jwt").ExtractJwt;
const JwtStrategy = require("passport-jwt").Strategy;
const lOps = require("./modules/LdapOps")(process.env, db);

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
  secretOrKey: process.env.API_SECRET
};

const jwtAuth = new JwtStrategy(jwtOptions, (payload, done) => {
  db.isUserExists(payload.kName, result => {
    if (result) {
      done(null, true);
    } else {
      done(null, false);
    }
  });
});

passport.use(jwtAuth);

const requireJWTAuth = passport.authenticate("jwt", { session: false });

const loginMiddleWare = (req, res, next) => {
  auth.apiAuth(req.body.keyName, req.body.keyPassword, result => {
    if (result != false) {
      req.kNumber = result;
      next();
    } else {
      res.send(false);
    }
  });
};

app.post("/apiAuth", loginMiddleWare, (req, res) => {
  const payload = {
    kName: req.body.keyName,
    time: new Date().getHours(),
    kNumber: req.kNumber
  };
  res.send({
    API_Token: jwt.sign(payload, process.env.API_SECRET, {
      expiresIn: process.env.API_TOKEN_EXPIRES
    })
  });
});
//end API authentication part
//API Token tester
app.post("/apiTest", requireJWTAuth, (req, res) => {
  res.send(true);
});

//start API part
//authen AD user
app.post("/ldapAuth", requireJWTAuth, (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const uObject = jwt.verify(token, process.env.API_SECRET);
  db.checkAPIUserRole(uObject.kNumber, result => {
    if (result.includes(1)) {
      auth.apiLDAPAuth(req.body.username, req.body.password, result => {
        if (result) {
          res.send({ ADToken: result });
        } else {
          res.send(false);
        }
      });
    } else {
      res.status(401).send({ message: "This API User not allowed!" });
    }
  });
});
//list AD User
app.post("/listUser", requireJWTAuth, (req, res) => {
  lOps.listUser(req.body.ADToken, result => {
    res.send({ AD_query_result: result });
  });
});
//list Organization Unit
app.post("/listOU", requireJWTAuth, (req, res) => {
  lOps.listOU(req.body.ADToken, result => {
    res.send({ AD_query_result: result });
  });
});
//search AD user from username
//end API part

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
