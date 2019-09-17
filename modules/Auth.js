const ldap = require("ldapjs");
const converter = require("./LdapConvert");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
module.exports = (settingEnv, mysqlPool) => {
  const webLogin = (username, password, done) => {
    const ldapClient = ldap.createClient({
      url: `ldap://${settingEnv.LDAP_SERVER}`
    });
    const searchOptions = {
      scope: "sub",
      filter: `(userPrincipalName=${username}@energy.local)`
    };
    ldapClient.bind(`${username}@energy.local`, password, err => {
      if (err) {
        if (err.code == 49) {
          done({ authSuccess: false });
        } else {
          console.log(err);
        }
      } else {
        ldapClient.search(
          "dc=energy,dc=local",
          searchOptions,
          (err, search) => {
            if (err) {
              console.log(err);
            } else {
              search.on("searchEntry", entry => {
                const user = entry.object;
                const ouInfo = user.distinguishedName
                  .split(",")[1]
                  .split("=")[1];
                const groupList = [];
                if (typeof user.memberOf == "string") {
                  groupList.push(user.memberOf.split(",")[0].split("=")[1]);
                } else {
                  user.memberOf.forEach((item, index) => {
                    groupList.push(item.split(",")[0].split("=")[1]);
                  });
                }
                const adminRight =
                  groupList.includes("Administrators") ||
                  groupList.includes("Domain Admins");
                done({
                  authSuccess: true,
                  UUID: converter.GUIDtoUUID(user.objectGUID),
                  OU: ouInfo,
                  firstname: user.givenName,
                  lastname: user.sn,
                  isAdmin: adminRight
                });
              });
            }
          }
        );
      }
    });
  };

  const apiLogin = (username, password, done) => {
    mysqlPool.query(
      "SELECT keyPassword, keyNumber FROM apiKey WHERE keyName = ?",
      [username],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          if (results.length > 0) {
            if (bcrypt.compareSync(password, results[0].keyPassword)) {
              done(results[0]["keyNumber"]);
            } else {
              done(false);
            }
          } else {
            done(false);
          }
        }
      }
    );
  };

  const searchCitizen = (uuid, done) => {
    mysqlPool.query(
      "SELECT citizenId FROM moen_officer WHERE AD_UUID = ?",
      [uuid],
      (err, results, fields) => {
        if (err) {
          console.log(err);
          done(false);
        } else {
          done(results[0]["citizenId"]);
        }
      }
    );
  };

  const ldapLogin = (username, password, done) => {
    const ldapClient = ldap.createClient({
      url: `ldap://${settingEnv.LDAP_SERVER}`
    });
    const searchOptions = {
      scope: "sub",
      filter: `(userPrincipalName=${username}@energy.local)`
    };
    ldapClient.bind(`${username}@energy.local`, password, err => {
      if (err) {
        if (err.code == 49) {
          done(false);
        } else {
          console.log(err);
        }
      } else {
        ldapClient.search(
          "dc=energy,dc=local",
          searchOptions,
          (err, search) => {
            if (err) {
              console.log(err);
            } else {
              search.on("searchEntry", entry => {
                const user = entry.object;
                const ouInfo = user.distinguishedName
                  .split(",")[1]
                  .split("=")[1];
                const groupList = [];
                if (typeof user.memberOf == "string") {
                  groupList.push(user.memberOf.split(",")[0].split("=")[1]);
                } else {
                  user.memberOf.forEach((item, index) => {
                    groupList.push(item.split(",")[0].split("=")[1]);
                  });
                }
                searchCitizen(converter.GUIDtoUUID(user.objectGUID), result => {
                  const adminRight =
                    groupList.includes("Administrators") ||
                    groupList.includes("Domain Admins");
                  const userObject = {
                    UUID: converter.GUIDtoUUID(user.objectGUID),
                    citizenId: result,
                    OU: ouInfo,
                    firstname: user.givenName,
                    lastname: user.sn,
                    isAdmin: adminRight
                  };
                  done(userObject);
                });
              });
            }
          }
        );
      }
    });
  };

  return { webLogin: webLogin, apiLogin: apiLogin, ldapLogin: ldapLogin };
};
