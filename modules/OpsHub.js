/**@module OpsHub */
module.exports = settingEnv => {
  const mysql = require("mysql2");
  const mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: settingEnv.MARIA_HOST,
    user: settingEnv.MARIA_USERNAME,
    password: settingEnv.MARIA_PASSWORD,
    database: settingEnv.MARIA_DB,
    port: settingEnv.MARIA_PORT
  });

  //API Page section
  const Api = require("./Api")(mysqlPool);
  const listAPIKey = (userId, done) => {
    Api.listAPIKey(userId, done);
  };
  const insertAPI = (name, password, owner, done) => {
    Api.insertAPI(name, password, owner, done);
  };
  const isUserExists = (username, done) => {
    Api.isUserExists(username, done);
  };
  const checkAPIUserRole = (keyNumber, done) => {
    Api.checkAPIUserRole(keyNumber, done);
  };

  //Authentication section
  const Auth = require("./Auth")(settingEnv, mysqlPool);
  const webLogin = (username, password, done) => {
    Auth.webLogin(username, password, done);
  };
  const apiLogin = (username, password, done) => {
    Auth.apiLogin(username, password, loginResult => {
      if (loginResult != false) {
        Api.checkAPIRole(loginResult, permResult => {
          done({ keyNumber: loginResult, permList: permResult });
        });
      } else {
        done(false);
      }
    });
  };
  const ldapLogin = (username, password, done) => {
    Auth.ldapLogin(username, password, done);
  };

  //Officer Page section
  const Officer = require("./Officer")(mysqlPool);
  const listOfficer = done => {
    Officer.listOfficer(done);
  };

  //ldap section
  const Ldap = require("./Ldap")(settingEnv);

  return {
    listOfficer: listOfficer,
    isUserExists: isUserExists,
    checkAPIUserRole: checkAPIUserRole,
    listAPIKey: listAPIKey,
    insertAPI: insertAPI,
    webLogin: webLogin,
    apiLogin: apiLogin,
    ldapLogin: ldapLogin
  };
};
