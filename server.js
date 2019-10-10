const https = require("https");
const http = require("http");
const fs = require("fs");
const express = require("express");
const wsServer = require("ws");
const bParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const app = express();
const mustacheExpress = require("mustache-express");
dotenv.config();

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
  session({
    resave: true,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true
  })
);

app.use("/greedy", express.static("web/vendor"));
app.use("/josh", express.static("web/js"));
app.use("/cosh", express.static("web/css"));
app.use("/imagine", express.static("web/img"));

require("./modules/nonPageRoute")(app);
require("./modules/StandardPageRoute")(app);
require("./modules/ApiRoute")(app);

app.use((req, res, next) => {
  return res.status(404).render("404.html");
});
app.use((req, res, next) => {
  return res.status(500).render("500.html");
});

const httpsServer = https.createServer(
  {
    key: fs.readFileSync(__dirname + "/certy/WebSSL.pem"),
    cert: fs.readFileSync(__dirname + "/certy/WebSSLCert.pem"),
    passphrase: process.env.CRT_PASS
  },
  app
);

//web socket section!
const wss = new wsServer.Server({ server: httpsServer });

wss.on("connection", (socket, incoming_request) => {
  const connectionId = socket._socket.remoteAddress.replace("::ffff:", "");
  let paramStr = incoming_request.url;
  paramStr = paramStr.replace("/", "");
  paramStr = paramStr.replace("?", "");
  socket.id = connectionId + "-" + paramStr.split("=")[1];
  console.log(socket.id + " is connecting in!");
  socket.on("message", message => {
    const msg = JSON.parse(message);
    switch (msg.Action) {
      case "retreivedData":
        console.log(
          "[LOG] client reading card from " + connectionId + "-agent"
        );
        wss.clients.forEach(client => {
          if (client.id == connectionId + "-agent") {
            client.send(JSON.stringify({ action: "retreivedData", data: "" }));
          }
        });
        break;
      case "cardData":
        console.log("[LOG] agent return card data to " + connectionId + "-web");
        wss.clients.forEach(client => {
          if (client.id == connectionId + "-web") {
            client.send(JSON.stringify({ action: "cardData", data: msg.Data }));
          }
        });
        break;
      case "error":
        wss.clients.forEach(client => {
          if (client.id == connectionId + "-web") {
            client.send(JSON.stringify({ action: "error", data: msg.Data }));
          }
        });

        break;
    }
  });
  socket.on("error", err => {
    console.log(err);
  });
  socket.on("close", (status, reason) => {
    console.log("Status: " + status + " " + socket.id + " is going away!");
  });
});

httpsServer.listen(443, () => {
  console.log("[System] listening to HTTPS");
});

//http redirect
const httpApp = express();
httpApp.all("*", (req, res) => {
  res.redirect(300, "https://172.19.0.250");
});
const httpServer = http.createServer(httpApp);
httpServer.listen(80, () => {
  console.log("[System] listen for http traffic to redirect to https");
});
