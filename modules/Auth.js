const ldap = require("ldapjs");
const converter = require("./LdapConvert");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
module.exports = (settingEnv, db) => {
  const login = (username, password, done) => {
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
                  UUID: converter.GUIDEncrypt(
                    converter.GUIDtoUUID(user.objectGUID)
                  ),
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

  const apiAuth = (username, password, done) => {
    db.getApiPassword(username, result => {
      if (result != false) {
        if (bcrypt.compareSync(password, result["keyPassword"])) {
          done(result["keyNumber"]);
        } else {
          done(false);
        }
      } else {
        done(false);
      }
    });
  };

  const apiLDAPAuth = (username, password, done) => {
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
                const adminRight =
                  groupList.includes("Administrators") ||
                  groupList.includes("Domain Admins");
                const userObject = {
                  UUID: converter.GUIDEncrypt(
                    converter.GUIDtoUUID(user.objectGUID)
                  ),
                  LdapUsername: username,
                  LdapPassword: password,
                  OU: ouInfo,
                  firstname: user.givenName,
                  lastname: user.sn,
                  isAdmin: adminRight
                };
                const encryptedUserObj = jwt.sign(
                  userObject,
                  settingEnv.API_SECRET,
                  {
                    expiresIn: process.env.API_TOKEN_EXPIRES
                  }
                );
                done(encryptedUserObj);
              });
            }
          }
        );
      }
    });
  };

  return { login: login, apiAuth: apiAuth, apiLDAPAuth: apiLDAPAuth };
};
